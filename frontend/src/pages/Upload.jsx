import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Configure axios base URL and auth interceptor once
// Configure API base URL dynamically
const isProd = process.env.NODE_ENV === 'production';
const API_URL = process.env.REACT_APP_API_URL || (isProd ? window.location.origin : 'http://localhost:5001');

const api = axios.create({ baseURL: API_URL + '/api' });
api.interceptors.request.use(config => {
  const token = localStorage.getItem('invoxl_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const payStyle = (t) => {
  if (t === 'COD') return { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: 'rgba(245,158,11,0.2)' };
  if (t === 'Prepaid') return { bg: 'rgba(20,184,166,0.1)', color: '#14b8a6', border: 'rgba(20,184,166,0.2)' };
  return { bg: 'rgba(74,90,120,0.15)', color: '#4a5a78', border: 'rgba(30,48,77,0.5)' };
};

function Checkbox({ checked, indeterminate, onChange }) {
  return (
    <div
      onClick={onChange}
      style={{
        width: '16px', height: '16px', borderRadius: '5px', flexShrink: 0,
        border: `1.5px solid ${checked || indeterminate ? '#3b82f6' : 'var(--rim2)'}`,
        background: checked || indeterminate
          ? 'linear-gradient(135deg,#2563eb,#7c3aed)'
          : 'var(--depth1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'all 0.15s',
        boxShadow: checked || indeterminate ? '0 0 0 3px rgba(37,99,235,0.12)' : 'none',
      }}
    >
      {indeterminate && !checked && (
        <div style={{ width: '8px', height: '1.5px', background: '#fff', borderRadius: '1px' }} />
      )}
      {checked && (
        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
          <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}

export default function Upload() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drag, setDrag] = useState(false);
  const [message, setMessage] = useState(null);
  const [progress, setProgress] = useState(0);
  const [selected, setSelected] = useState(new Set());
  const [deleting, setDeleting] = useState(false);
  const [isQuickExtract, setIsQuickExtract] = useState(false);

  const allSelected = invoices.length > 0 && selected.size === invoices.length;
  const someSelected = selected.size > 0 && !allSelected;

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(invoices.map(i => i._id)));
  };

  const toggleOne = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ✅ FIX: use /invoices (api base is http://localhost:5000/api)
  const fetchInvoices = useCallback(async () => {
    try {
      const { data } = await api.get('/invoices');
      setInvoices(data.invoices || []);
    } catch (e) {
      console.error('fetchInvoices error:', e.response?.status, e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this invoice?')) return;
    setDeleting(true);
    try {
      // ✅ FIX: correct path with auth
      await api.delete(`/invoices/${id}`);
      fetchInvoices();
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to delete.' });
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selected.size} invoices?`)) return;
    setDeleting(true);
    try {
      // ✅ FIX: correct path with auth
      await Promise.all(Array.from(selected).map(id => api.delete(`/invoices/${id}`)));
      setSelected(new Set());
      fetchInvoices();
      setMessage({ type: 'success', text: 'Deleted successfully.' });
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to delete some invoices.' });
    } finally {
      setDeleting(false);
    }
  };

  const addFiles = (newFiles) => {
    const pdfs = [...newFiles].filter(f => f.type === 'application/pdf');
    if (pdfs.length !== newFiles.length) setMessage({ type: 'error', text: 'Only PDF files accepted.' });
    setFiles(prev => [...prev, ...pdfs].slice(0, 10));
  };

  const [reparseResult, setReparseResult] = useState(null);
  const [reparsing, setReparsing] = useState(false);

  const handleReparse = async () => {
    if (!window.confirm('Re-extract data from all stored invoices using the latest parser? This will overwrite product name, taxable value, shipping and other fields.')) return;
    setReparsing(true); setReparseResult(null);
    try {
      // ✅ FIX: correct path with auth
      const { data } = await api.post('/invoices/reparse');
      setReparseResult({ type: 'success', text: data.message });
      fetchInvoices();
    } catch (e) {
      setReparseResult({ type: 'error', text: e.response?.data?.message || 'Re-parse failed.' });
    } finally { setReparsing(false); }
  };

  // 7. Frontend Upload Fix:
  const handleUpload = async () => {
    if (!files.length) return;
    setUploading(true); setMessage(null); setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', files[0]); // Using the first selected file
      formData.append('quickExtract', isQuickExtract.toString());

      const token = localStorage.getItem('invoxl_token');

      // Progress Simulation
      const progressInterval = setInterval(() => {
        setProgress(p => p < 90 ? p + 10 : p);
      }, 500);

      // 1. Proxy Fix (Frontend) - Calling relative path /api/extract
      // 7. Frontend Upload Fix - fetch POST with body formData 
      // Use a relative path so it automatically stays on the same domain
      const uploadUrl = isProd ? '/api/extract' : 'http://localhost:5001/api/extract';
      
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      const text = await res.text();
      let data;
      try { 
        data = JSON.parse(text); 
      } catch (e) {
        // 8. Error Handling - Show backend error instead of generic proxy error
        console.error('Non-JSON response:', text.slice(0, 500));
        throw new Error(`Server Error: ${text.substring(0, 100)}... Check if backend is running on port 5001.`);
      }

      if (!res.ok) {
        // 8. Error Handling - Backend error reported
        throw new Error(data.error || data.message || "Upload failed");
      }

      // Success logic 
      if (isQuickExtract) {
        // Simple download trigger for quick extract simulation (in practice, might return a blob)
        setMessage({ type: 'success', text: '✓ Quick extraction complete. Check console for data.' });
        console.log("Quick Extraction Response:", data);
      } else {
        const count = data.invoices?.length || 0;
        setMessage({
          type: count > 0 ? 'success' : 'error',
          text: count > 0 
            ? `✓ Saved ${count} invoice${count > 1 ? 's' : ''} successfully` 
            : data.message || 'PDF processed but no invoices extracted.'
        });
        await fetchInvoices(); // Refresh history
      }

      setFiles([]); setProgress(0);
    } catch (e) {
      // 6. Debugging - Log errors clearly
      console.error("Upload error:", e.message);
      setMessage({ type: 'error', text: e.message || 'Upload failed. Ensure backend is running.' });
    } finally {
      setUploading(false);
    }
  };

  const handleExport = async (type) => {
    try {
      const token = localStorage.getItem('invoxl_token');
      // ✅ /api/export/excel for xlsx, /api/invoices/export/csv for csv
      const urlPath = type === 'xlsx' ? '/api/export/excel' : `/api/invoices/export/${type}`;
      const exportUrl = isProd ? urlPath : 'http://localhost:5001' + urlPath;
      const res = await fetch(exportUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = type === 'xlsx' ? 'invoxl_invoices.xlsx' : `invoices.${type}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error('Export failed:', err);
      setMessage({ type: 'error', text: 'Failed to export invoices.' });
    }
  };

  return (
    <div style={{ background: 'var(--void)', minHeight: '100vh', paddingTop: '88px', paddingBottom: '70px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 28px' }}>

        {/* Page Header */}
        <div className="rise-1" style={{ marginBottom: '40px' }}>
          <p className="label" style={{ marginBottom: '8px' }}>Data / Import</p>
          <h1 className="display" style={{ fontSize: '28px', color: 'var(--ink)' }}>Invoice Upload</h1>
          <p style={{ color: 'var(--ink3)', fontSize: '13px', marginTop: '4px' }}>
            Flipkart, Amazon, Meesho or any GST invoice PDF
          </p>
        </div>

        {/* Drop Zone */}
        <div className="rise-2"
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
          style={{
            border: `2px dashed ${drag ? 'var(--sapphire)' : 'var(--rim)'}`,
            borderRadius: '20px', padding: '72px 24px', textAlign: 'center',
            background: drag ? 'rgba(37,99,235,0.04)' : 'rgba(12,17,32,0.6)',
            transition: 'all 0.25s', cursor: 'pointer', marginBottom: '20px',
          }}
        >
          <div className="anim-float" style={{ fontSize: '52px', marginBottom: '16px' }}>📄</div>
          <p style={{ fontFamily: "'Outfit', sans-serif", fontWeight: '700', fontSize: '17px', color: 'var(--ink)', marginBottom: '8px' }}>
            Drop PDF invoices here
          </p>
          <p style={{ color: 'var(--ink3)', fontSize: '13px', marginBottom: '26px' }}>
            Supports all ecommerce invoice formats · Max 10 files
          </p>
          <label style={{ cursor: 'pointer' }}>
            <span className="btn btn-ghost" style={{ display: 'inline-flex' }}>Browse Files</span>
            <input type="file" style={{ display: 'none' }} multiple accept=".pdf,application/pdf" onChange={e => addFiles(e.target.files)} />
          </label>
        </div>

        {/* Selected files list */}
        {files.length > 0 && (
          <div className="rise-3 surface-flat" style={{ padding: '24px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <p style={{ fontFamily: "'Outfit', sans-serif", fontWeight: '700', color: 'var(--ink)', fontSize: '14px' }}>
                {files[0].name} selected
              </p>
              <button onClick={() => setFiles([])} style={{ background: 'none', border: 'none', color: 'var(--ink3)', cursor: 'pointer', fontSize: '12px', fontFamily: "'Outfit', sans-serif" }}>
                Clear
              </button>
            </div>

            {/* Mode Toggle */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px',
              background: 'rgba(37,99,235,0.04)', padding: '12px 16px', borderRadius: '10px',
              border: '1px solid rgba(37,99,235,0.1)'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', color: !isQuickExtract ? 'var(--ink)' : 'var(--ink3)' }}>
                <input type="radio" name="extractMode" checked={!isQuickExtract} onChange={() => setIsQuickExtract(false)} style={{ accentColor: '#2563eb' }} />
                Save to Dashboard
              </label>
              <div style={{ width: '1px', height: '14px', background: 'var(--rim)' }} />
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', color: isQuickExtract ? '#14b8a6' : 'var(--ink3)' }}>
                <input type="radio" name="extractMode" checked={isQuickExtract} onChange={() => setIsQuickExtract(true)} style={{ accentColor: '#14b8a6' }} />
                Quick Extract (Download Only)
              </label>
            </div>

            {uploading && (
              <div style={{ marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--ink3)', marginBottom: '6px', fontFamily: "'DM Mono', monospace" }}>
                  <span>Processing document...</span><span>{progress}%</span>
                </div>
                <div style={{ background: 'var(--depth1)', borderRadius: '999px', height: '3px' }}>
                  <div style={{ background: 'linear-gradient(90deg, #2563eb, #7c3aed)', height: '3px', borderRadius: '999px', width: `${progress}%`, transition: 'width 0.3s' }} />
                </div>
              </div>
            )}
            <button onClick={handleUpload} disabled={uploading} className="btn"
              style={{
                width: '100%', justifyContent: 'center', padding: '12px', opacity: uploading ? 0.7 : 1,
                background: isQuickExtract ? 'linear-gradient(135deg,#0d9488,#14b8a6)' : 'linear-gradient(135deg,#2563eb,#7c3aed)',
                border: 'none', color: '#fff', borderRadius: '10px', fontWeight: '600'
              }}>
              {uploading
                ? <><span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', marginRight: '8px' }} /> Extracting...</>
                : (isQuickExtract ? '⬇ Download Excel' : '🚀 Upload & Save Data')
              }
            </button>
          </div>
        )}

        {/* Message banner */}
        {message && (
          <div style={{
            marginBottom: '20px', padding: '13px 18px', borderRadius: '12px', fontSize: '13px', fontWeight: '500',
            background: message.type === 'success' ? 'rgba(20,184,166,0.08)' : 'rgba(225,29,72,0.08)',
            border: `1px solid ${message.type === 'success' ? 'rgba(20,184,166,0.2)' : 'rgba(244,63,94,0.2)'}`,
            color: message.type === 'success' ? '#14b8a6' : '#f43f5e',
            display: 'flex', alignItems: 'center', gap: '9px',
          }}>
            {message.type === 'success' ? '✓' : '⚠'} {message.text}
          </div>
        )}

        {/* Re-parse banner */}
        {reparseResult && (
          <div style={{
            marginBottom: '20px', padding: '13px 18px', borderRadius: '12px', fontSize: '13px', fontWeight: '500',
            background: reparseResult.type === 'success' ? 'rgba(20,184,166,0.08)' : 'rgba(225,29,72,0.08)',
            border: `1px solid ${reparseResult.type === 'success' ? 'rgba(20,184,166,0.2)' : 'rgba(244,63,94,0.2)'}`,
            color: reparseResult.type === 'success' ? '#14b8a6' : '#f43f5e',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span>{reparseResult.type === 'success' ? '✓' : '⚠'} {reparseResult.text}</span>
            <button onClick={() => setReparseResult(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', opacity: 0.6, fontSize: '14px' }}>✕</button>
          </div>
        )}

        {/* Invoice table */}
        <div style={{ background: 'var(--depth2)', border: '1px solid var(--rim)', borderRadius: '20px', overflow: 'hidden' }}>

          {/* Table toolbar */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '18px 24px', borderBottom: '1px solid var(--rim)', minHeight: '68px',
            transition: 'background 0.2s',
            background: selected.size > 0 ? 'rgba(37,99,235,0.04)' : 'transparent',
          }}>
            {selected.size > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Checkbox checked={allSelected} indeterminate={someSelected} onChange={toggleAll} />
                <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: '600', fontSize: '13px', color: 'var(--sapphire3)' }}>
                  {selected.size} selected
                </span>
                <div style={{ width: '1px', height: '16px', background: 'var(--rim)' }} />
                <button
                  onClick={handleBulkDelete}
                  disabled={deleting}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    background: 'rgba(225,29,72,0.08)', border: '1px solid rgba(244,63,94,0.22)',
                    color: '#f43f5e', borderRadius: '9px', padding: '6px 14px',
                    fontSize: '12px', fontWeight: '600', cursor: deleting ? 'not-allowed' : 'pointer',
                    fontFamily: "'Outfit', sans-serif", transition: 'all 0.18s', opacity: deleting ? 0.6 : 1,
                  }}
                >
                  {deleting ? 'Deleting...' : `🗑 Delete ${selected.size} invoice${selected.size > 1 ? 's' : ''}`}
                </button>
                <button
                  onClick={() => setSelected(new Set())}
                  style={{ background: 'none', border: 'none', color: 'var(--ink3)', cursor: 'pointer', fontSize: '12px', fontFamily: "'Outfit', sans-serif", padding: '4px 2px' }}
                >Cancel</button>
              </div>
            ) : (
              <div>
                <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: '700', fontSize: '15px', color: 'var(--ink)' }}>Invoice History</h2>
                <p style={{ fontSize: '12px', color: 'var(--ink3)', marginTop: '2px' }}>{invoices.length} records</p>
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={handleReparse} disabled={reparsing}
                title="Re-run the latest parser on all stored invoices"
                className="btn btn-ghost btn-sm"
                style={{ color: '#a78bfa', borderColor: 'rgba(167,139,250,0.2)', background: 'rgba(167,139,250,0.07)', opacity: reparsing ? 0.6 : 1 }}
              >
                {reparsing ? 'Re-extracting...' : '⚡ Re-extract All'}
              </button>
              <div style={{ width: '1px', height: '16px', background: 'var(--rim)' }} />
              <button onClick={() => handleExport('xlsx')} className="btn btn-ghost btn-sm" style={{ color: '#14b8a6', borderColor: 'rgba(20,184,166,0.2)', background: 'rgba(20,184,166,0.07)' }}>
                ⬇ Excel
              </button>
              <button onClick={() => handleExport('csv')} className="btn btn-ghost btn-sm" style={{ color: 'var(--sapphire3)', borderColor: 'rgba(59,130,246,0.2)', background: 'rgba(59,130,246,0.07)' }}>
                ⬇ CSV
              </button>
            </div>
          </div>

          {/* Table body */}
          <div style={{ overflowX: 'auto' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '64px', color: 'var(--ink4)' }}>
                <div style={{ width: '32px', height: '32px', border: '3px solid var(--rim)', borderTopColor: 'var(--sapphire)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
                <p style={{ fontSize: '13px' }}>Loading invoices...</p>
              </div>
            ) : invoices.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 24px' }}>
                <div style={{ fontSize: '52px', marginBottom: '16px' }}>📭</div>
                <p style={{ fontFamily: "'Outfit', sans-serif", fontWeight: '700', color: 'var(--ink)', fontSize: '15px' }}>No invoices yet</p>
                <p style={{ color: 'var(--ink3)', fontSize: '13px', marginTop: '6px' }}>Upload your first PDF to get started</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '44px', padding: '10px 8px 10px 20px' }}>
                      <Checkbox checked={allSelected} indeterminate={someSelected} onChange={toggleAll} />
                    </th>
                    {['Date', 'Invoice No', 'Supplier', 'Buyer', 'Product', 'Qty', 'Tax', 'Total', ''].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => {
                    const sel = selected.has(inv._id);
                    return (
                      <tr key={inv._id} style={{ background: sel ? 'rgba(37,99,235,0.06)' : undefined, transition: 'background 0.15s' }}>
                        <td style={{ padding: '13px 8px 13px 20px', width: '44px' }}>
                          <Checkbox checked={sel} onChange={() => toggleOne(inv._id)} />
                        </td>
                        <td style={{ fontFamily: "'DM Mono', monospace", color: 'var(--ink3)', whiteSpace: 'nowrap' }}>{inv.invoiceDate || '—'}</td>
                        <td style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px' }}>{inv.invoiceNumber || '—'}</td>
                        <td style={{ color: 'var(--ink)', fontWeight: '500' }}>{inv.supplierName || '—'}</td>
                        <td>{inv.buyerName || inv.customerName || '—'}</td>
                        <td style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--ink)' }}>{inv.items?.[0]?.productName || inv.productName || '—'}</td>
                        <td style={{ textAlign: 'center' }}>{inv.items?.[0]?.quantity || inv.quantity || 1}</td>
                        <td style={{ fontFamily: "'DM Mono', monospace", color: 'var(--ink3)' }}>₹{(inv.items?.[0]?.tax || inv.tax || 0).toLocaleString()}</td>
                        <td style={{ fontFamily: "'DM Mono', monospace", fontWeight: '600', color: 'var(--ink)', whiteSpace: 'nowrap' }}>₹{(inv.grandTotal || inv.finalAmount || 0).toLocaleString()}</td>
                        <td>
                          <button
                            onClick={() => handleDelete(inv._id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink4)', fontSize: '15px', transition: 'color 0.2s', padding: '4px' }}
                            onMouseEnter={e => e.target.style.color = '#f43f5e'}
                            onMouseLeave={e => e.target.style.color = 'var(--ink4)'}
                          >✕</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
