// invoiceReparse.route.js
// Drop this file into your routes folder and register it:
//   const reparseRouter = require('./invoiceReparse.route');
//   app.use('/api/invoices', reparseRouter);
//
// Then call: POST /api/invoices/reparse
// It will re-run the fixed ocrParser on the rawText stored in each invoice
// and update all extracted fields in the database.

const express  = require('express');
const router   = express.Router();
const Invoice  = require('../models/Invoice');
const { parseInvoiceText } = require('../utils/ocrParser');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/reparse', authMiddleware, async (req, res) => {
  try {
    const invoices = await Invoice.find({ userId: req.user._id, rawText: { $exists: true, $ne: '' } });

    if (!invoices.length) {
      return res.json({ message: 'No invoices with stored text found.', updated: 0 });
    }

    let updated = 0;
    let failed  = 0;

    for (const inv of invoices) {
      try {
        const parsed = parseInvoiceText(inv.rawText);
        if (!parsed) { failed++; continue; }

        await Invoice.findByIdAndUpdate(inv._id, {
          invoiceDate:     parsed.invoiceDate     || inv.invoiceDate,
          orderDate:       parsed.orderDate       || inv.orderDate,
          orderId:         parsed.orderId         || inv.orderId,
          invoiceNumber:   parsed.invoiceNumber   || inv.invoiceNumber,
          trackingId:      parsed.trackingId      || inv.trackingId,
          sku:             parsed.sku             || inv.sku,
          hsnCode:         parsed.hsnCode         || inv.hsnCode,
          productName:     parsed.productName     || inv.productName,
          quantity:        parsed.quantity        || inv.quantity,
          customerName:    parsed.customerName    || inv.customerName,
          billingAddress:  parsed.billingAddress  || inv.billingAddress,
          city:            parsed.city            || inv.city,
          state:           parsed.state           || inv.state,
          pincode:         parsed.pincode         || inv.pincode,
          placeOfSupply:   parsed.placeOfSupply   || inv.placeOfSupply,
          grossAmount:     parsed.grossAmount,
          discount:        parsed.discount,
          taxableAmount:   parsed.taxableAmount,
          cgst:            parsed.cgst,
          sgst:            parsed.sgst,
          igst:            parsed.igst,
          cess:            parsed.cess,
          shippingCharges: parsed.shippingCharges,
          finalAmount:     parsed.finalAmount     || inv.finalAmount,
          paymentType:     parsed.paymentType     || inv.paymentType,
        });

        updated++;
      } catch (e) {
        console.error(`[REPARSE] Failed for invoice ${inv._id}:`, e.message);
        failed++;
      }
    }

    console.log(`[REPARSE] Done — updated: ${updated}, failed: ${failed}`);
    res.json({
      message: `Re-extraction complete. ${updated} invoices updated, ${failed} skipped.`,
      updated,
      failed,
      total: invoices.length,
    });

  } catch (err) {
    console.error('[REPARSE] Route error:', err);
    res.status(500).json({ message: 'Re-parse failed: ' + err.message });
  }
});

module.exports = router;