const fs = require('fs');
const path = require('path');

// ─── Lazy-load pdf-parse so missing the module gives a clear error ─────────────
function getPdfParse() {
  return require('pdf-parse');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseToISO(str) {
  if (!str) return null;
  str = String(str).trim();
  // YYYY-MM-DD already
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  // DD.MM.YYYY
  let m = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return null;
}

// ─── Core single-invoice parser ───────────────────────────────────────────────
function parseInvoiceChunk(chunk) {
  const lines = chunk.split('\n').map(l => l.trim()).filter(Boolean);
  const allAmounts = [...chunk.matchAll(/Rs\.?\s*([\d,]+\.?\d*)/gi)].map(m => parseFloat(m[1].replace(/,/g, '')));

  // FIX 4 — PAYMENT TYPE
  const firstLine = lines[0] || '';
  const paymentType = /^COD:/i.test(firstLine) ? 'COD' : 'Prepaid';

  // 1. DATE
  let date = "";
  const dateM = chunk.match(/(?:Invoice|Order)\s*Date\s*[:\-]?\s*(\d{2}\.\d{2}\.\d{4})/i);
  if (dateM) date = parseToISO(dateM[1]);

  // 2. PLATFORM
  let platform = "Meesho";
  if (chunk.match(/amazon/i)) platform = "Amazon";
  else if (chunk.match(/flipkart/i)) platform = "Flipkart";

  // 3. ORDER ID
  let orderId = "";
  const orderM = chunk.match(/(?:Order|Purchase Order)\s*No\.\s*[:\-]?\s*(\d+)/i);
  if (orderM) orderId = orderM[1];

  // 4. INVOICE No
  let invoiceNo = "";
  const invM = chunk.match(/Invoice No\.\s*[:\-]?\s*([A-Za-z0-9]+)/i);
  if (invM) invoiceNo = invM[1];

  // FIX 1 — SKU
  const skuHeaderIdx = lines.indexOf('SKU Size Qty Color Order No.');
  const sku = skuHeaderIdx !== -1 ? lines[skuHeaderIdx + 1].split(/\s+/)[0] : null;

  // 6. TRACKING ID
  let trackingId = "";
  const trackM = chunk.match(/\n(VL[A-Z0-9]+|\d{10,16})\n/) || chunk.match(/(VL[A-Z0-9]{10,}|\d{12,})/);
  if (trackM) trackingId = trackM[1];

  // 7. PRODUCT
  let product = "Products";
  const descIdx = lines.findIndex(l => l.includes("Description") && l.includes("HSN"));
  if (descIdx !== -1 && lines[descIdx + 1]) {
    product = lines[descIdx + 1].split(/\d{4}/)[0].trim() || product;
  }

  // 8. TAXABLE VALUE (3rd Rs. value on HSN line / index 2)
  let taxableValue = 0;
  if (allAmounts.length >= 3) {
    taxableValue = allAmounts[2];
  }

  // 9. SELLING PRICE (TOTAL AMOUNT)
  let sellingPrice = 0;
  const totalMatch = chunk.match(/Total\s*(?:Rs\.?)?\s*([\d,]+\.\d+)/i);
  if (totalMatch) {
    sellingPrice = parseFloat(totalMatch[1].replace(/,/g, ''));
  } else if (allAmounts.length > 0) {
    sellingPrice = allAmounts[allAmounts.length - 1];
  }

  // FIX 2 — CGST and SGST
  let cgst = 0, sgst = 0;
  for (const line of lines) {
    const cgstM = line.match(/CGST\s*@[\d.]+%\s*:Rs\.([\d.]+)/);
    if (cgstM) cgst += parseFloat(cgstM[1]);
    const sgstM = line.match(/SGST\s*@[\d.]+%\s*:Rs\.([\d.]+)/);
    if (sgstM) sgst += parseFloat(sgstM[1]);
  }
  cgst = Math.round(cgst * 100) / 100;
  sgst = Math.round(sgst * 100) / 100;

  // FIX 3 — IGST
  let igst = 0;
  if (/IGST\s*@/i.test(chunk)) {
    for (const line of lines) {
      const m = line.trim().match(/^Rs\.([\d.]+)$/);
      if (m) igst += parseFloat(m[1]);
    }
    igst = Math.round(igst * 100) / 100;
  }

  // 12. LOCATION / STATE
  let location = "";
  const states = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman & Nicobar', 'Delhi', 'Jammu and Kashmir', 'Chandigarh', 'Ladakh'];
  for (let s of states) {
    if (chunk.includes(s)) { location = s; break; }
  }

  if (!invoiceNo && !orderId) return null;

  return {
    invoiceDate: date,
    orderDate: date,
    orderId: orderId,
    invoiceNumber: invoiceNo,
    trackingId: trackingId,
    customerName: "Customer",
    supplierName: platform,
    state: location,
    productName: product,
    quantity: 1,
    sku: sku || null,
    taxableAmount: taxableValue,
    cgst: cgst,
    sgst: sgst,
    igst: igst,
    tax: Math.round((cgst + sgst + igst) * 100) / 100 || Math.max(0, Math.round((sellingPrice - taxableValue) * 100) / 100),
    shippingCharges: 0,
    finalAmount: sellingPrice,
    paymentType: paymentType
  };
}

// ─── Main extractor ───────────────────────────────────────────────────────────
async function extractFromPDF(fileInput) {
  let fullText = '';
  try {
    const pdfParse = getPdfParse();
    const buffer = Buffer.isBuffer(fileInput) ? fileInput : fs.readFileSync(fileInput);
    const data = await pdfParse(buffer, { max: 0 });
    fullText = data.text || '';
    console.log('[INVOXL] PDF text length:', fullText.length);
  } catch (err) {
    console.error('[INVOXL] PDF read error:', err.message);
    return [];
  }

  if (!fullText || fullText.trim().length < 20) {
    console.error('[INVOXL] No extractable text in PDF (scanned image PDF?)');
    return [];
  }

  // Split by "Customer Address" as per user requirements
  const chunks = fullText.split(/Customer Address\s*/i).filter(c => c.trim().length > 100);
  console.log('[INVOXL] Chunks to parse:', chunks.length);

  if (chunks.length > 0) {
    fs.writeFileSync(path.join(__dirname, '../debug_chunk.txt'), chunks[0]);
    fs.writeFileSync(path.join(__dirname, '../debug_lines.txt'), chunks[0].split('\n').join('\n---LINE---\n'));
  }

  const results = chunks
    .map(chunk => parseInvoiceChunk(chunk))
    .filter(r => r !== null);

  console.log('[INVOXL] Extracted', results.length, 'invoices.');
  return results;
}

module.exports = { extractFromPDF, parseInvoiceChunk };