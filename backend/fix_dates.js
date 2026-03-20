/**
 * fix_dates.js
 * One-time migration: patches existing Invoice records that have a valid
 * orderDate but a missing/null invoiceDate (or vice-versa).
 * Also sets finalAmount from total if finalAmount is missing.
 *
 * Run ONCE:  node fix_dates.js
 */
'use strict';
require('dotenv').config();
const mongoose = require('mongoose');
const Invoice  = require('./models/Invoice');
const { parseToISO } = require('./utils/dateUtils');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/invoxl';

(async () => {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  const invoices = await Invoice.find({});
  console.log(`Found ${invoices.length} total invoices`);

  let dateFixed = 0;
  let amountFixed = 0;

  for (const inv of invoices) {
    const update = {};

    // Standardize existing dates
    const currentInvoiceDate = parseToISO(inv.invoiceDate);
    const currentOrderDate   = parseToISO(inv.orderDate);

    if (currentInvoiceDate && currentInvoiceDate !== inv.invoiceDate) update.invoiceDate = currentInvoiceDate;
    if (currentOrderDate && currentOrderDate !== inv.orderDate) update.orderDate = currentOrderDate;

    // Fix missing invoiceDate from orderDate fallback
    if (!currentInvoiceDate && currentOrderDate) {
      update.invoiceDate = currentOrderDate;
      dateFixed++;
    }
    // Fix missing orderDate from invoiceDate fallback
    if (!currentOrderDate && currentInvoiceDate) {
      update.orderDate = currentInvoiceDate;
    }

    // Fix missing finalAmount (used by analytics totalRevenue)
    if ((!inv.finalAmount || inv.finalAmount === 0) && inv.total) {
      update.finalAmount = inv.total;
      amountFixed++;
    }
    // Fix missing grandTotal alias
    if ((!inv.grandTotal || inv.grandTotal === 0) && inv.total) {
      update.grandTotal = inv.total;
    }

    if (Object.keys(update).length > 0) {
      await Invoice.findByIdAndUpdate(inv._id, update);
    }
  }

  console.log(`✅ Date fallback applied to ${dateFixed} invoices`);
  console.log(`✅ Amount fallback applied to ${amountFixed} invoices`);
  console.log('Migration complete.');
  process.exit(0);
})().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
