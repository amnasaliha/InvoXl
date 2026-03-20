const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

async function test() {
  const uploads = fs.readdirSync('uploads').filter(f => f.endsWith('.pdf'));
  if (uploads.length === 0) { console.log("No PDF found in uploads"); return; }
  
  const buf = fs.readFileSync(path.join('uploads', uploads[0]));
  const data = await pdf(buf);
  fs.writeFileSync('raw_text.txt', data.text);
  console.log("Written raw_text.txt. Length:", data.text.length);
}

test();
