import React, { useState } from 'react';

const faqs = [
  { q: 'Which invoice formats are supported?', a: 'INVOXL supports any PDF invoice — Flipkart, Amazon, Meesho, or any generic GST invoice. Multi-page and multi-invoice PDFs are also supported.' },
  { q: 'How does OCR extraction work?', a: 'We convert your PDF to images and use Tesseract OCR to read the text, then apply intelligent regex patterns to extract all structured fields automatically.' },
  { q: 'Why is some data showing as blank?', a: 'OCR accuracy depends on PDF quality. Scanned or low-resolution PDFs may have incomplete extraction. Try uploading a higher-quality PDF for better results.' },
  { q: 'How is GST handled (CGST/SGST vs IGST)?', a: 'INVOXL automatically detects whether the invoice uses IGST (inter-state) or CGST+SGST (intra-state) and populates the correct fields accordingly.' },
  { q: 'How does Sales Prediction work?', a: 'We group your historical revenue by date and apply Linear Regression to forecast the next 30 days of sales with a growth percentage estimate.' },
  { q: 'Is my data private?', a: 'Yes. Each account has completely isolated data secured by JWT authentication. You can only see invoices you uploaded — no other user can access them.' },
];

export default function Help() {
  const [open, setOpen] = useState(null);

  return (
    <div style={{ background: 'var(--void)', minHeight: '100vh', paddingTop: '88px', paddingBottom: '70px', position: 'relative' }}>
      <div className="orb" style={{ width: '400px', height: '300px', top: '20%', left: '50%', transform: 'translateX(-50%)', background: 'rgba(37,99,235,0.05)', zIndex: 0 }} />

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '0 28px', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div className="rise-1" style={{ textAlign: 'center', marginBottom: '56px' }}>
          <p className="label" style={{ marginBottom: '12px' }}>Support</p>
          <h1 className="display" style={{ fontSize: 'clamp(28px, 4vw, 40px)', color: 'var(--ink)', marginBottom: '12px' }}>
            Help Center
          </h1>
          <p style={{ color: 'var(--ink3)', fontSize: '15px' }}>Everything you need to know about INVOXL</p>
        </div>

        {/* FAQ accordion */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {faqs.map(({ q, a }, i) => (
            <div
              key={q}
              className={`rise-${Math.min(i + 2, 5)} surface-flat`}
              style={{ overflow: 'hidden', transition: 'all 0.25s', cursor: 'pointer' }}
              onClick={() => setOpen(open === i ? null : i)}
            >
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '18px 22px',
              }}>
                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: '600', fontSize: '14px', color: open === i ? 'var(--ink)' : 'var(--ink2)', transition: 'color 0.2s' }}>
                  {q}
                </h3>
                <span style={{
                  color: open === i ? 'var(--sapphire3)' : 'var(--ink4)',
                  fontSize: '18px', lineHeight: 1, transform: open === i ? 'rotate(45deg)' : 'none',
                  transition: 'transform 0.25s, color 0.2s', flexShrink: 0, marginLeft: '12px',
                }}>+</span>
              </div>
              {open === i && (
                <div style={{ padding: '0 22px 18px' }}>
                  <div className="divider" style={{ marginBottom: '14px' }} />
                  <p style={{ color: 'var(--ink3)', fontSize: '13px', lineHeight: '1.7' }}>{a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact footer */}
        <div className="rise-5" style={{ textAlign: 'center', marginTop: '56px' }}>
          <p style={{ color: 'var(--ink4)', fontSize: '13px' }}>
            Still have questions? Check the{' '}
            <span style={{ color: 'var(--sapphire3)', cursor: 'pointer' }}>chatbot</span>{' '}
            in the bottom right corner.
          </p>
        </div>
      </div>
    </div>
  );
}