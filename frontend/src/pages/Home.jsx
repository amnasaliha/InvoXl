import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const platforms = ['Flipkart', 'Amazon', 'Meesho', 'GST Invoice'];

const features = [
  { icon: '⬡', title: 'OCR Extraction', desc: 'Reads every field — order IDs, GST numbers, amounts, addresses — from any PDF format automatically.', accent: '#7c3aed', tag: 'Core' },
  { icon: '◈', title: 'Live Analytics', desc: 'Revenue charts, state-wise breakdowns, GST summaries and payment splits, updated in real-time.', accent: '#2563eb', tag: 'Analytics' },
  { icon: '◉', title: 'Sales Forecast', desc: 'Linear regression model predicts your next 30 days of revenue with growth percentage estimates.', accent: '#0d9488', tag: 'AI' },
  { icon: '▤', title: 'Excel & CSV Export', desc: 'Export all structured invoice data as beautifully formatted spreadsheets with one click.', accent: '#d97706', tag: 'Export' },
  { icon: '◎', title: 'Private & Secure', desc: 'JWT authentication. Your invoices are completely isolated — no one else can access your data.', accent: '#e11d48', tag: 'Security' },
  { icon: '⬡', title: 'AI Assistant', desc: 'Built-in chatbot answers questions about your data, GST calculations, and platform features.', accent: '#7c3aed', tag: 'AI' },
];

const steps = [
  { num: '01', icon: '📤', title: 'Upload PDF', desc: 'Drag & drop invoices from any ecommerce platform. Bulk upload up to 10 files at once.' },
  { num: '02', icon: '⚙️', title: 'AI Extracts', desc: 'Our OCR parser reads every field — order IDs, GST, amounts, customer info — automatically.' },
  { num: '03', icon: '📈', title: 'Analyze & Export', desc: 'View rich dashboard insights, download formatted Excel files, and predict next month\'s sales.' },
];

const stats = [
  { value: '10×', label: 'Faster Processing' },
  { value: '99%', label: 'Data Accuracy' },
  { value: '∞',   label: 'Invoice Formats' },
  { value: '30d', label: 'Sales Forecasting' },
];

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ background: 'var(--void)', minHeight: '100vh', paddingTop: '58px', overflowX: 'hidden', position: 'relative' }}>

      {/* ── Global background atmosphere ── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div className="orb" style={{ width: '700px', height: '700px', top: '-20%', left: '-15%', background: 'rgba(37,99,235,0.07)' }} />
        <div className="orb" style={{ width: '600px', height: '600px', top: '35%', right: '-20%', background: 'rgba(124,58,237,0.06)' }} />
        <div className="orb" style={{ width: '500px', height: '500px', bottom: '-10%', left: '25%', background: 'rgba(13,148,136,0.05)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ═══════════ HERO ═══════════ */}
        <section style={{ maxWidth: '960px', margin: '0 auto', padding: '110px 24px 90px', textAlign: 'center' }}>

          <div className="rise-1 badge badge-violet" style={{ marginBottom: '28px', display: 'inline-flex' }}>
            <span>⚡</span> AI-Powered Invoice Intelligence
          </div>

          <h1 className="rise-2 display" style={{
            fontSize: 'clamp(44px, 6.5vw, 80px)',
            color: 'var(--ink)',
            marginBottom: '10px',
          }}>
            Turn invoices into
          </h1>
          <h1 className="rise-2 display gt-sapphire" style={{
            fontSize: 'clamp(44px, 6.5vw, 80px)',
            marginBottom: '28px',
          }}>
            revenue intelligence.
          </h1>

          <p className="rise-3" style={{
            color: 'var(--ink3)', fontSize: 'clamp(15px, 2vw, 18px)',
            lineHeight: '1.75', maxWidth: '560px', margin: '0 auto 52px',
            fontWeight: 400,
          }}>
            Upload any ecommerce invoice PDF. INVOXL extracts structured data, visualizes your revenue, and predicts future sales — all in seconds.
          </p>

          <div className="rise-4" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {user ? (
              <button className="btn btn-primary btn-xl" onClick={() => navigate('/dashboard')}>
                Open Dashboard →
              </button>
            ) : (
              <>
                <button className="btn btn-primary btn-xl" onClick={() => navigate('/register')}>
                  Start for Free →
                </button>
                <button className="btn btn-ghost btn-xl" onClick={() => navigate('/login')}>
                  Sign In
                </button>
              </>
            )}
          </div>

          {/* Platform pills */}
          <div className="rise-5" style={{
            marginTop: '52px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '8px', flexWrap: 'wrap',
          }}>
            <span style={{ color: 'var(--ink4)', fontSize: '11px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Works with</span>
            {platforms.map(p => (
              <span key={p} style={{
                fontSize: '12px', color: 'var(--ink3)',
                background: 'var(--depth2)', border: '1px solid var(--rim)',
                padding: '4px 13px', borderRadius: '999px',
                fontFamily: "'Outfit', sans-serif",
              }}>{p}</span>
            ))}
          </div>
        </section>

        {/* ═══════════ STATS BAR ═══════════ */}
        <div style={{ borderTop: '1px solid var(--rim)', borderBottom: '1px solid var(--rim)', background: 'rgba(12,17,32,0.7)', backdropFilter: 'blur(10px)' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
            {stats.map(({ value, label }, i) => (
              <div key={label} style={{
                textAlign: 'center', padding: '32px 16px',
                borderRight: i < 3 ? '1px solid var(--rim)' : 'none',
              }}>
                <div className="display gt-amber" style={{ fontSize: '38px', marginBottom: '6px' }}>{value}</div>
                <div style={{ color: 'var(--ink4)', fontSize: '12px', fontWeight: '500', letterSpacing: '0.04em' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══════════ FEATURES ═══════════ */}
        <section style={{ maxWidth: '1120px', margin: '0 auto', padding: '100px 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <p className="label" style={{ marginBottom: '12px' }}>Capabilities</p>
            <h2 className="display" style={{ fontSize: 'clamp(30px, 4vw, 46px)', color: 'var(--ink)' }}>
              Everything in one platform
            </h2>
            <p style={{ color: 'var(--ink3)', fontSize: '15px', marginTop: '12px' }}>Built for serious ecommerce sellers</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            {features.map(({ icon, title, desc, accent, tag }) => (
              <div key={title} className="surface" style={{ padding: '28px', position: 'relative', overflow: 'hidden' }}>
                <div style={{
                  position: 'absolute', top: 0, right: 0,
                  width: '120px', height: '120px', borderRadius: '50%',
                  background: `${accent}0d`, filter: 'blur(30px)',
                  pointerEvents: 'none',
                }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '12px',
                    background: `${accent}12`, border: `1px solid ${accent}22`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '20px', color: accent,
                    fontFamily: 'serif',
                  }}>{icon}</div>
                  <span className="badge badge-gray">{tag}</span>
                </div>
                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: '700', fontSize: '15px', color: 'var(--ink)', marginBottom: '9px' }}>{title}</h3>
                <p style={{ color: 'var(--ink3)', fontSize: '13px', lineHeight: '1.65' }}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════ HOW IT WORKS ═══════════ */}
        <section style={{ background: 'rgba(10,15,28,0.6)', borderTop: '1px solid var(--rim)', borderBottom: '1px solid var(--rim)', padding: '100px 24px' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
            <p className="label" style={{ marginBottom: '12px' }}>Process</p>
            <h2 className="display" style={{ fontSize: 'clamp(28px, 4vw, 42px)', color: 'var(--ink)', marginBottom: '64px' }}>
              Three steps to clarity
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '48px' }}>
              {steps.map(({ num, icon, title, desc }) => (
                <div key={num}>
                  <div style={{
                    fontFamily: "'DM Mono', monospace", fontSize: '10px', fontWeight: '500',
                    color: 'var(--sapphire)', letterSpacing: '0.12em', marginBottom: '18px',
                  }}>STEP {num}</div>
                  <div style={{
                    width: '60px', height: '60px',
                    background: 'rgba(37,99,235,0.07)', border: '1px solid rgba(37,99,235,0.15)',
                    borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '28px', margin: '0 auto 18px',
                  }}>{icon}</div>
                  <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: '700', color: 'var(--ink)', marginBottom: '10px', fontSize: '16px' }}>{title}</h3>
                  <p style={{ color: 'var(--ink3)', fontSize: '13px', lineHeight: '1.65' }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ CTA ═══════════ */}
        <section style={{ padding: '120px 24px', textAlign: 'center', position: 'relative' }}>
          <div className="orb" style={{ width: '500px', height: '300px', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'rgba(37,99,235,0.06)', zIndex: 0 }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p className="label" style={{ marginBottom: '16px' }}>Get started</p>
            <h2 className="display" style={{ fontSize: 'clamp(30px, 5vw, 56px)', color: 'var(--ink)', marginBottom: '16px' }}>
              Ready to get started?
            </h2>
            <p style={{ color: 'var(--ink3)', marginBottom: '40px', fontSize: '16px' }}>
              Join sellers automating their invoice analytics
            </p>
            {!user && (
              <button className="btn btn-primary btn-xl" onClick={() => navigate('/register')}
                style={{ boxShadow: '0 0 60px rgba(37,99,235,0.25)' }}>
                Create Free Account →
              </button>
            )}
          </div>
        </section>

        {/* ═══════════ FOOTER ═══════════ */}
        <footer style={{ borderTop: '1px solid var(--rim)', padding: '36px 24px', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px', marginBottom: '10px' }}>
            <img src="/logo.png" alt="IX" style={{
              width: '32px', height: '32px', borderRadius: '8px',
              objectFit: 'contain'
            }} />
            <span style={{ fontFamily: "'Fraunces', serif", fontWeight: '700', color: 'var(--ink)', fontSize: '15px' }}>INVOXL</span>
          </div>
          <p style={{ color: 'var(--ink4)', fontSize: '12px' }}>© 2024 INVOXL — AI-Powered Invoice Analytics Platform.</p>
        </footer>

      </div>
    </div>
  );
}