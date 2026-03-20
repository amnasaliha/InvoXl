const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  productName: String,
  sku: String,
  quantity: Number,
  price: Number,
  taxableAmount: Number,
  tax: Number,
  total: Number
});

const invoiceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileName: String,
  
  // ── Core invoice fields (flat, from ocrParser) ─────────────────────────────
  invoiceNumber: String,
  invoiceDate: String,
  orderDate: String,
  orderId: String,
  trackingId: String,
  sku: String,
  hsnCode: String,
  productName: String,
  quantity: Number,
  customerName: String,
  billingAddress: String,
  city: String,
  state: String,
  pincode: String,
  placeOfSupply: String,
  
  // ── Financials ─────────────────────────────────────────────────────────────
  price: Number,
  grossAmount: Number,
  discount: Number,
  taxableAmount: Number,
  tax: Number,
  cgst: Number,
  sgst: Number,
  igst: Number,
  cess: Number,
  shippingCharges: Number,
  total: Number,
  finalAmount: Number,
  
  paymentType: { type: String },
  platform: String,

  // ── Legacy / UI bridge fields ──────────────────────────────────────────────
  buyerName: String,   // = customerName
  supplierName: String,
  grandTotal: Number,   // = finalAmount
  otherCharges: Number,  // = shippingCharges
  
  // ── Legacy items array (kept for UI backward compat) ──────────────────────
  items: [itemSchema],

  rawText: String,
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Invoice', invoiceSchema);