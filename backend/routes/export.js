const express = require('express');
const router  = express.Router();
const ExcelJS = require('exceljs');
const Invoice = require('../models/Invoice');
const auth    = require('../middleware/authMiddleware');

function styleHeader(sheet) {
  sheet.getRow(1).eachCell(cell => {
    cell.fill      = { type:'pattern', pattern:'solid', fgColor:{ argb:'0F172A' } };
    cell.font      = { color:{ argb:'FFFFFF' }, bold:true, size:11 };
    cell.alignment = { vertical:'middle', horizontal:'center' };
    cell.border    = { bottom:{ style:'thin', color:{ argb:'10B981' } } };
  });
}

router.get('/excel', auth, async (req, res) => {
  try {
    const invoices = await Invoice.find({ userId: req.user._id }).lean();
    console.log("Exporting invoices:", invoices.length);

    if(!Array.isArray(invoices) || invoices.length === 0){
      return res.status(500).json({
        success:false,
        message:"Invalid invoice data"
      });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Invoices");

    worksheet.columns = [
      { header: 'Date',           key: 'invoiceDate',      width: 14 },
      { header: 'Order No',       key: 'orderId',          width: 24 },
      { header: 'Invoice No',     key: 'invoiceNumber',    width: 18 },
      { header: 'Tracking ID',    key: 'trackingId',       width: 20 },
      { header: 'Customer Name',  key: 'customerName',     width: 22 },
      { header: 'State',          key: 'state',            width: 18 },
      { header: 'SKU',            key: 'sku',              width: 15 },
      { header: 'Product Name',   key: 'productName',      width: 45 },
      { header: 'Qty',            key: 'quantity',         width: 6  },
      { header: 'Taxable Amount', key: 'taxableAmount',    width: 14 },
      { header: 'CGST',           key: 'cgst',             width: 10 },
      { header: 'SGST',           key: 'sgst',             width: 10 },
      { header: 'IGST',           key: 'igst',             width: 10 },
      { header: 'Shipping',       key: 'shippingCharges',  width: 10 },
      { header: 'Final Amount',   key: 'finalAmount',      width: 14 },
      { header: 'Payment Type',   key: 'paymentType',      width: 13 }
    ];

    styleHeader(worksheet);

    invoices.forEach(inv => {
      worksheet.addRow(inv);
    });

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=invoxl_invoices.xlsx"
    );

    res.send(buffer);

  } catch (error) {
    console.error("Excel export error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate Excel file"
    });
  }
});

router.get('/excel/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user._id });
    if (!invoice) return res.status(404).json({ message: 'Not found' });
    const wb = new ExcelJS.Workbook();
    const s  = wb.addWorksheet('Invoice');
    s.mergeCells('A1:F1');
    s.getCell('A1').value = 'INVOICE'; s.getCell('A1').font = { size:22, bold:true };
    s.getCell('A3').value = 'Invoice No:'; s.getCell('B3').value = invoice.invoiceNumber;
    s.getCell('A4').value = 'Date:';       s.getCell('B4').value = new Date(invoice.invoiceDate).toLocaleDateString('en-IN');
    s.getCell('D3').value = 'From:';       s.getCell('E3').value = invoice.vendor;
    s.getCell('D4').value = 'To:';         s.getCell('E4').value = invoice.customer;
    s.addRow([]);
    const h = s.addRow(['Description','Category','Qty','Unit Price','Amount']);
    h.eachCell(c => { c.font={bold:true}; c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'E8FDF5'}}; });
    (invoice.lineItems||[]).forEach(item => s.addRow([item.description,item.category,item.quantity,item.unitPrice,item.amount]));
    s.addRow([]); s.addRow(['','','','Subtotal:',invoice.subtotal]); s.addRow(['','','','Tax (18%):',invoice.taxAmount]);
    const tr = s.addRow(['','','','TOTAL:',invoice.totalAmount]); tr.getCell(5).font={bold:true,size:13};
    res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition',`attachment; filename="${invoice.invoiceNumber}.xlsx"`);
    const buffer = await wb.xlsx.writeBuffer();
    res.send(buffer);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;