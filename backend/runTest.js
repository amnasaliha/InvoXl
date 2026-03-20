const fs = require('fs');
const { extractFromPDF } = require('./utils/ocrParser.js');
const { generateExcel } = require('./utils/invoiceService.js');

async function runTest() {
  const fileInput = './test_flipkart.pdf';
  const parsed = await extractFromPDF(fileInput);
  fs.writeFileSync('C:/Users/shefi/Downloads/INVOXL/backend/test_out_parsed.json', JSON.stringify(parsed, null, 2));
  console.log('Parsed ' + (parsed ? parsed.length : 0) + ' items.');
  
  if (parsed && parsed.length > 0) {
    const wb = await generateExcel(parsed);
    const outputPath = 'C:/Users/shefi/Downloads/INVOXL/backend/test_output.xlsx';
    await wb.xlsx.writeFile(outputPath);
    console.log('Excel file generated at: ' + outputPath);
  }
}
runTest().catch(console.error);
