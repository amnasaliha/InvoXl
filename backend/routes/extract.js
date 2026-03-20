'use strict';
const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');

const auth     = require('../middleware/authMiddleware');
const { extractFromPDF } = require('../utils/ocrParser');
const { saveInvoices } = require('../utils/invoiceService');

// 4. Extract Route (IMPORTANCE MULTER)
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const upload = multer({ dest: uploadsDir });

// 3. Route Fix - Path matches /api/extract
router.post('/extract', auth, upload.single('file'), async (req, res) => {
  try {
    // 6. Debugging - Log when request hits backend
    console.log("[INVOXL-EXTRACT-REQ] File received:", req.file ? req.file.originalname : 'NONE');

    if (!req.file) {
      console.log("[INVOXL-EXTRACT-REQ] Failed: No file uploaded");
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Extraction using pure Node.js (pdf-parse)
    const pdfPath = req.file.path;
    const isQuickExtract = req.body.quickExtract === 'true';

    console.log("[INVOXL-EXTRACT-REQ] Extracting data from PDF:", pdfPath);
    const invoices = await extractFromPDF(pdfPath);
    console.log("[INVOXL-EXTRACT-REQ] Extracted invoices count:", invoices ? invoices.length : 0);

    if (!invoices || invoices.length === 0) {
      return res.json({
        success: true, 
        message: "File uploaded successfully but no invoices were found.",
        file: req.file.filename,
        invoices: []
      });
    }

    if (isQuickExtract) {
      // In Quick Extract mode, just return the data (or simulated response)
      return res.json({
        success: true,
        message: "File uploaded successfully and data extracted (Quick Extract).",
        file: req.file.filename,
        invoices: invoices
      });
    }

    // Normal Save to Dashboard
    const saved = await saveInvoices(invoices, req.user._id, req.file.originalname);
    console.log("[INVOXL-EXTRACT-REQ] Invoices saved to database:", saved ? saved.length : 0);

    return res.json({
      success: true,
      message: "File uploaded and data saved successfully.",
      file: req.file.filename,
      invoices: saved,
      count: saved.length
    });

  } catch (error) {
    // 6. Debugging - Log errors clearly
    console.error("[INVOXL-EXTRACT-ERROR]", error);
    res.status(500).json({ error: error.message || "Extraction process failed" });
    
    // 6. Debugging - Ensure backend does NOT crash (try-catch prevents this)
  }
});

module.exports = router;