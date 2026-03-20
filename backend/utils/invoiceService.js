'use strict';
const ExcelJS = require('exceljs');
const Invoice = require('../models/Invoice');

// ─── saveInvoices ─────────────────────────────────────────────────────────────
// parsedData = flat array from ocrParser — NO nested items[]
async function saveInvoices(parsedData, userId, fileName) {
  if (!parsedData || parsedData.length === 0) {
    console.log('[INVOXL] saveInvoices called with empty array');
    return [];
  }

  console.log('[INVOXL] Saving invoices:', parsedData.length, '| userId:', userId);

  const docs = parsedData.map(inv => {
    const totalTax = inv.tax || inv.gst_amount || (inv.igst || 0) + (inv.cgst || 0) + (inv.sgst || 0);

    const resolvedInvoiceDate = inv.invoiceDate || inv.invoice_date || inv.orderDate || inv.order_date || null;
    const resolvedOrderDate = inv.orderDate || inv.order_date || inv.invoiceDate || inv.invoice_date || null;

    const base = {
      userId: userId,
      fileName: fileName,

      invoiceNumber: inv.invoiceNumber || inv.invoice_no || null,
      invoiceDate: resolvedInvoiceDate,
      orderDate: resolvedOrderDate,
      orderId: inv.orderId || inv.order_no || null,
      trackingId: inv.trackingId || inv.tracking_id || null,
      sku: inv.sku || null,
      hsnCode: inv.hsnCode || inv.hsn || null,
      productName: inv.productName || inv.product_name || null,
      quantity: inv.quantity || inv.qty || 1,
      customerName: inv.customerName || inv.customer_name || null,
      billingAddress: inv.billingAddress || inv.customer_address || null,
      state: inv.state || null,

      taxableAmount: inv.taxableAmount || inv.taxable_value || 0,
      grossAmount: inv.grossAmount || inv.gross_amount || 0,
      discount: inv.discount || 0,
      tax: totalTax,
      cgst: inv.cgst || 0,
      sgst: inv.sgst || 0,
      igst: inv.igst || 0,
      shippingCharges: inv.shippingCharges || inv.shipping || 0,
      total: inv.finalAmount || inv.total || 0,
      finalAmount: inv.finalAmount || inv.total || 0,

      // Supplier / platform
      supplierName: inv.supplierName || inv.vendor_name || null,
      platform: inv.supplierName || inv.vendor_name || 'Meesho',

      // Bridge for legacy / UI
      buyerName: inv.customerName || inv.customer_name || null,
      grandTotal: inv.finalAmount || inv.total || 0,
      otherCharges: inv.shippingCharges || inv.shipping || 0,
      items: [{
        productName: inv.productName || inv.product_name,
        sku: inv.sku,
        quantity: inv.quantity || inv.qty || 1,
        taxableAmount: inv.taxableAmount || inv.taxable_value || 0,
        tax: totalTax,
        total: inv.finalAmount || inv.total || 0
      }]
    };
    return base;
  });

  try {
    const savedInvoices = await Invoice.insertMany(docs, { ordered: false });
    console.log('[INVOXL] Saved invoices:', savedInvoices.length);
    return savedInvoices;
  } catch (err) {
    console.error("[INVOXL] Error in insertMany:", err.message);
    return docs;
  }
}

// ─── generateExcel ────────────────────────────────────────────────────────────
async function generateExcel(invoices) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Invoices');

  sheet.columns = [
    { header: 'Invoice_No', key: 'invoice_no', width: 22 },
    { header: 'Order_No', key: 'order_no', width: 24 },
    { header: 'Tracking_ID', key: 'tracking_id', width: 20 },
    { header: 'State', key: 'state', width: 15 },
    { header: 'SKU', key: 'sku', width: 18 },
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Customer_Name', key: 'customer_name', width: 25 },
    { header: 'Product', key: 'product', width: 35 },
    { header: 'Qty', key: 'qty', width: 10 },
    { header: 'Taxable_Value', key: 'taxable', width: 12 },
    { header: 'IGST', key: 'igst', width: 10 },
    { header: 'CGST', key: 'cgst', width: 10 },
    { header: 'SGST', key: 'sgst', width: 10 },
    { header: 'Total_GST', key: 'gst_amount', width: 12 },
    { header: 'Shipping', key: 'shipping', width: 12 },
    { header: 'Total', key: 'total', width: 14 },
  ];

  sheet.getRow(1).eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F172A' } };
    cell.font = { color: { argb: 'FFFFFF' }, bold: true, size: 11 };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  invoices.forEach(inv => {
    const gstType = inv.gst_type || (inv.igst ? 'IGST' : (inv.cgst || inv.sgst ? 'CGST+SGST' : ''));
    const gstAmt = inv.gst_amount || inv.igst || (inv.tax ? inv.tax : 0);

    sheet.addRow({
      invoice_no: inv.invoice_no || inv.invoiceNumber,
      order_no: inv.order_no || inv.orderId,
      tracking_id: inv.tracking_id || inv.trackingId,
      state: inv.state,
      sku: inv.sku,
      date: inv.invoice_date || inv.invoiceDate,
      customer_name: inv.customer_name || inv.customerName,
      product: inv.product_name || inv.productName,
      qty: inv.qty || inv.quantity,
      taxable: inv.taxable_value || inv.taxableAmount || 0,
      igst: inv.igst || 0,
      cgst: inv.cgst || 0,
      sgst: inv.sgst || 0,
      gst_amount: gstAmt,
      shipping: inv.shipping || inv.shippingCharges || 0,
      total: inv.total || inv.finalAmount || 0
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

module.exports = { saveInvoices, generateExcel };