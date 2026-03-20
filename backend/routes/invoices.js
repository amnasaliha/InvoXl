const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const auth = require('../middleware/authMiddleware');
const { parseToISO } = require('../utils/dateUtils');

/**
 * @route   GET /api/invoices
 * @desc    Get all invoices for the authenticated user and summary metrics
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const invoices = await Invoice.find({ userId }).sort({ uploadedAt: -1 });
    
    // Calculate simple metrics requested for Step 2
    let totalRevenue = 0;
    let totalOrders = invoices.length;
    let todayOrders = 0;
    
    const today = new Date().toISOString().split('T')[0]; // Current date
    
    invoices.forEach(inv => {
      totalRevenue += (inv.finalAmount || 0);
      
      // Standardized date comparison
      const invDate = parseToISO(inv.invoiceDate);
      if (invDate === today) {
        todayOrders++;
      }
    });

    console.log(`[INVOICE ROUTE] Returning ${totalOrders} invoices for user ${userId}`);
    
    res.json({ 
      success: true, 
      invoices, 
      totalOrders, 
      totalRevenue: Math.round(totalRevenue),
      todayOrders
    });

  } catch (err) {
    console.error('[INVOICE ROUTE] GET Error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/invoices/:id
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user._id });
    if (!invoice) {
        return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    
    await invoice.deleteOne();
    res.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (err) {
    console.error('[INVOICE ROUTE] DELETE Error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
