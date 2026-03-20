import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const FAQ = [
  { q: 'upload',  a: 'Go to the Upload page, drag & drop PDF invoices, or click Browse Files. Supports up to 10 files at once.' },
  { q: 'revenue', a: "Revenue is the sum of all Final Amounts across your invoices. It's shown as the first KPI card on your Dashboard." },
  { q: 'gst',     a: 'INVOXL auto-detects IGST (inter-state) vs CGST+SGST (intra-state) from your invoice and fills the correct fields.' },
  { q: 'predict', a: 'Sales Prediction uses Linear Regression on your historical daily revenue to forecast the next 30 days.' },
  { q: 'excel',   a: 'Click the "⬇ Excel" button on the Upload page to download all extracted invoice data as a formatted .xlsx file.' },
  { q: 'delete',  a: 'Find the invoice in the table on the Upload page and click the ✕ icon to delete it.' },
  { q: 'format',  a: 'INVOXL works with Flipkart, Amazon, Meesho, and any standard GST invoice PDF with selectable text.' },
  { q: 'cod',     a: "Payment type is auto-detected. If 'COD' appears in the invoice, it's marked COD. Otherwise Prepaid." },
];

export default function Chatbot() {
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState([{ from: 'bot', text: "Hi! I'm your INVOXL assistant 👋 Ask me anything about the platform." }]);
  const [input, setInput]     = useState('');
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!input.trim()) return;
    const userMessage = input;
    setInput('');
    setMessages(p => [...p, { from: 'user', text: userMessage }, { from: 'bot', text: '...', loading: true }]);

    try {
      const res = await axios.post('/api/chat', { message: userMessage });
      const reply = res.data.reply;
      setMessages(p => p.map((m, i) => i === p.length - 1 ? { from: 'bot', text: reply } : m));
    } catch (err) {
      setMessages(p => p.map((m, i) => i === p.length - 1 ? { from: 'bot', text: 'Error connecting to Chat API.' } : m));
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 200 }}>

      {/* Chat panel */}
      {open && (
        <div style={{
          background: 'var(--depth2)', border: '1px solid var(--rim2)',
          borderRadius: '20px', width: '330px', marginBottom: '12px', overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.55)',
          animation: 'rise 0.3s cubic-bezier(0.16,1,0.3,1) both',
        }}>

          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            padding: '16px 20px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.15)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🤖</div>
              <div>
                <p style={{ fontFamily: "'Outfit', sans-serif", fontWeight: '700', color: 'white', fontSize: '13px' }}>INVOXL Assistant</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="dot-live" style={{ width: '5px', height: '5px', background: '#4ade80' }} />
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '10px' }}>Online</span>
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{
              background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '8px',
              width: '28px', height: '28px', color: 'white', cursor: 'pointer', fontSize: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.2s',
            }}>✕</button>
          </div>

          {/* Messages */}
          <div style={{ height: '290px', overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.from === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '85%', padding: '10px 14px',
                  borderRadius: m.from === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: m.from === 'user' ? 'linear-gradient(135deg, #2563eb, #7c3aed)' : 'var(--depth3)',
                  border: m.from === 'user' ? 'none' : '1px solid var(--rim)',
                  color: m.from === 'user' ? 'white' : 'var(--ink2)',
                  fontSize: '13px', lineHeight: '1.55',
                  fontFamily: "'Outfit', sans-serif",
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ borderTop: '1px solid var(--rim)', padding: '12px 14px', display: 'flex', gap: '8px', background: 'var(--depth1)' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Ask a question..."
              style={{
                flex: 1, background: 'var(--depth2)', border: '1px solid var(--rim)',
                borderRadius: '10px', padding: '9px 13px',
                color: 'var(--ink)', fontSize: '13px', outline: 'none',
                fontFamily: "'Outfit', sans-serif", transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--sapphire)'}
              onBlur={e => e.target.style.borderColor = 'var(--rim)'}
            />
            <button onClick={send} style={{
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)', border: 'none',
              borderRadius: '10px', width: '38px', height: '38px', color: 'white',
              cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>→</button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '52px', height: '52px',
          background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
          border: 'none', borderRadius: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: '22px',
          boxShadow: '0 8px 32px rgba(37,99,235,0.4)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          float: 'right',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(37,99,235,0.55)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(37,99,235,0.4)'; }}
      >
        {open ? '✕' : '💬'}
      </button>
    </div>
  );
}