const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

async function test() {
  try {
    const fd = new FormData();
    fd.append('file', fs.createReadStream('logs.txt')); // Using a dummy file but it should fail with 'Only PDF allowed' or something
    
    const res = await axios.post('http://localhost:5001/api/extract', fd, {
      headers: fd.getHeaders()
    });
    console.log('Response:', res.data);
  } catch (err) {
    console.log('Error status:', err.response?.status);
    console.log('Error data:', typeof err.response?.data === 'string' ? err.response?.data.slice(0, 500) : err.response?.data);
  }
}

test();
