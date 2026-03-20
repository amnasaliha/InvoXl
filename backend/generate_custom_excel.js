const fs = require('fs');
const pdfParse = require('pdf-parse');
const ExcelJS = require('exceljs');

async function processPDF() {
  const filePath = "c:\\Users\\arunv\\Downloads\\INVOXL (2)\\INVOXL\\backend\\uploads\\1773947215966-Sub_Order_Labels_31c1a881-8fd2-4ea9-97ed-1e1d9809bf9a.pdf";
  if (!fs.existsSync(filePath)) {
    console.error("PDF not found at", filePath);
    return;
  }

  console.log("Reading PDF...");
  const data = await pdfParse(fs.readFileSync(filePath));
  const fullText = data.text;
  
  const chunks = fullText.split(/Customer Address\s*/i).filter(c => c.trim().length > 100);
  console.log(`Found ${chunks.length} potential invoices`);
  
  const rows = [];
  
  for (let chunk of chunks) {
    // 1. DATE
    let date = "";
    const dateM = chunk.match(/Invoice Date\s*(\d{2}\.\d{2}\.\d{4})/i);
    if (dateM) date = dateM[1];
    
    // 2. PLATFORM
    let platform = "Meesho"; // default based on sold by PIK FRAGINCENCE format
    
    // 3. ORDER ID
    let orderId = "";
    const orderM = chunk.match(/Purchase Order No.\s*([A-Za-z0-9_]+)/i);
    if (orderM) orderId = orderM[1];
    else {
      const orderM2 = chunk.match(/Order No.\s*([A-Za-z0-9_]+)/i);
      if (orderM2) orderId = orderM2[1];
    }
    
    // 4. INVOICE No
    let invoiceNo = "";
    const invM = chunk.match(/Invoice No.\s*([A-Za-z0-9]+)/i);
    if (invM) invoiceNo = invM[1];
    
    // 5. TRACKING ID
    let trackingId = "";
    const trackM = chunk.match(/\n(VL[A-Z0-9]+|\d{10,16})\n/);
    if (trackM) trackingId = trackM[1];
    else {
      const trackM2 = chunk.match(/(VL[A-Z0-9]{10,}|\d{12,})/);
      if (trackM2) trackingId = trackM2[1];
    }
    
    // 6. COURIER
    let courier = "";
    if (chunk.match(/Valmo/i)) courier = "Valmo";
    else if (chunk.match(/Delhivery/i)) courier = "Delhivery";
    else {
       for(let cr of ["Valmo", "Delhivery", "Ecom Express", "Xpressbees", "Shadowfax", "Blue Dart"]) {
           if (chunk.includes(cr)) { courier = cr; break; }
       }
    }
    
    // 7. PRODUCT
    let product = "";
    const descStart = chunk.indexOf("DescriptionHSNQtyGross AmountDiscountTaxable ValueTaxesTotal");
    if (descStart !== -1) {
        let textAfterDesc = chunk.substring(descStart + 60);
        let prodLines = textAfterDesc.split("\n").map(l => l.trim());
        let i = 1; // skip first empty line
        while (i < prodLines.length && !prodLines[i].match(/^\d{4}/)) {
            if (prodLines[i]) product += prodLines[i] + " ";
            i++;
        }
        product = product.trim();
    }
    
    // 8. TAXABLE VALUE
    let taxableValue = 0;
    const lines = chunk.split('\n').map(l => l.trim()).filter(Boolean);
    for(let line of lines) {
        // Match product row (starts with HSN like 33011)
        if (line.match(/^\d{4,8}.*?Rs\.[\d\.]+.*?Rs\./)) {
             let vals = line.match(/Rs\.([\d\.]+)/g);
             if (vals && vals.length >= 3) {
                 taxableValue += parseFloat(vals[vals.length - 1].replace('Rs.',''));
             }
        }
        // Match Other Charges row
        if (line.startsWith("Other Charges")) {
             let vals = line.match(/Rs\.([\d\.]+)/g);
             if (vals && vals.length >= 1) {
                 taxableValue += parseFloat(vals[vals.length - 1].replace('Rs.',''));
             }
        }
    }
    taxableValue = Math.round(taxableValue * 100) / 100;

    // 9. SELLING PRICE
    let sellingPrice = "";
    const totalLinesRe = /TotalRs\.[\d\.]+Rs\.([\d\.]+)/i;
    const totalMatch = chunk.match(totalLinesRe);
    if (totalMatch) {
        sellingPrice = totalMatch[1];
    } else {
         const altTotalMatch = chunk.match(/Total\s*(?:Rs\.?)?(\d+\.\d+)/i);
         if (altTotalMatch) sellingPrice = altTotalMatch[1];
    }
    
    // 10. STATUS
    let status = "Shipped"; // Default to Shipped based on user's screenshot
    
    // 11. LOCATION
    let location = "";
    const states = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Andaman & Nicobar','Delhi','Jammu and Kashmir','Chandigarh','Ladakh'];
    
    // STRICTLY search inside the Customer Address block to prevent picking up the Return Address state
    let addressBlock = chunk;
    const addrStart = chunk.indexOf("Customer Address");
    const addrEnd = chunk.indexOf("If undelivered");
    if (addrStart !== -1 && addrEnd !== -1) {
        addressBlock = chunk.substring(addrStart, addrEnd);
    }

    for(let s of states) {
        if (addressBlock.includes(s)) {
            location = s;
            break;
        }
    }

    if (invoiceNo || orderId) {
        rows.push({
            "DATE": date ? date.split('.').join('-') : "", // Format as DD-MM-YYYY
            "PLATFORM": platform,
            "ORDER ID": orderId,
            "INVOICE NO": invoiceNo,
            "TRACKING ID": trackingId,
            "COURIER": courier,
            "PRODUCT": product,
            "QTY": 1,
            "TAXABLE VALUE": taxableValue,
            "SELLING PRICE": sellingPrice,
            "STATUS": status,
            "PAYOUT": "",
            "PAYOUT DATE": "",
            "RETURN CHARGES": "",
            "DISCOUNT": "",
            "CUSTOMER LOCATION": location
        });
    }
  }
  
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Invoices');
  
  // Style headers entirely matched to the screenshot order
  worksheet.columns = [
      { header: 'DATE', key: 'DATE', width: 12 },
      { header: 'PLATFORM', key: 'PLATFORM', width: 12 },
      { header: 'ORDER ID', key: 'ORDER ID', width: 22 },
      { header: 'INVOICE NO', key: 'INVOICE NO', width: 15 },
      { header: 'TRACKING ID', key: 'TRACKING ID', width: 20 },
      { header: 'COURIER', key: 'COURIER', width: 15 },
      { header: 'PRODUCT', key: 'PRODUCT', width: 45 },
      { header: 'QTY', key: 'QTY', width: 5 },
      { header: 'TAXABLE VALUE', key: 'TAXABLE VALUE', width: 15 },
      { header: 'SELLING PRICE', key: 'SELLING PRICE', width: 15 },
      { header: 'STATUS', key: 'STATUS', width: 10 },
      { header: 'PAYOUT', key: 'PAYOUT', width: 10 },
      { header: 'PAYOUT DATE', key: 'PAYOUT DATE', width: 12 },
      { header: 'RETURN CHARGES', key: 'RETURN CHARGES', width: 15 },
      { header: 'DISCOUNT', key: 'DISCOUNT', width: 10 },
      { header: 'CUSTOMER LOCATION', key: 'CUSTOMER LOCATION', width: 20 }
  ];
  
  // Apply visual style from screenshot (blue background)
  worksheet.getRow(1).eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } };
    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
  });
  
  rows.forEach(r => worksheet.addRow(r));
  
  const outPath = 'c:\\Users\\arunv\\Downloads\\INVOXL (2)\\INVOXL\\Extracted_Invoices_Custom.xlsx';
  await workbook.xlsx.writeFile(outPath);
  console.log(`Saved ${rows.length} invoices to ${outPath}`);
}

processPDF().catch(console.error);
