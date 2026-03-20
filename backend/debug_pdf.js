const fs = require('fs');
const pdf = require('pdf-parse');

async function debugPdf() {
    const dataBuffer = fs.readFileSync('c:/Users/shefi/Downloads/INVOXL/backend/test_flipkart.pdf');
    try {
        const data = await pdf(dataBuffer);
        console.log('--- RAW TEXT START ---');
        console.log(data.text);
        console.log('--- RAW TEXT END ---');
        console.log('Length:', data.text.length);
    } catch (err) {
        console.error('Error parsing PDF:', err);
    }
}

debugPdf();
