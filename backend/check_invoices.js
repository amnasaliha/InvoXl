const mongoose = require('mongoose');
require('dotenv').config();
const fs = require('fs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/invoxl';

async function check() {
  try {
    await mongoose.connect(MONGO_URI);
    const Invoice = require('./models/Invoice');
    
    const invoices = await Invoice.find().sort({ uploadedAt: -1 }).limit(3).lean();
    fs.writeFileSync('last_invoices.json', JSON.stringify(invoices, null, 2));
    
    process.exit(0);
  } catch (err) {
    fs.writeFileSync('last_invoices_err.txt', err.message);
    process.exit(1);
  }
}

check();
