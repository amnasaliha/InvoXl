import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try { await register(form.name, form.email, form.password); navigate('/dashboard'); }
    catch (err) { setError(err.response?.data?.message || 'Registration failed'); }
    finally { setLoading(false); }
  };

  const fields = [
    { k: 'name',     l: 'Full Name',     t: 'text',     p: 'Your name' },
    { k: 'email',    l: 'Email address', t: 'email',    p: 'you@example.com' },
    { k: 'password', l: 'Password',      t: 'password', p: '••••••••' },
  ];

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--void)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', paddingTop: '80px', position: 'relative', overflow: 'hidden',
    }}>
      <div className="orb" style={{ width: '500px', height: '400px', top: '15%', right: '5%', background: 'rgba(124,58,237,0.07)', zIndex: 0 }} />

      <div className="rise-1" style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>

        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <img src="/logo.png" alt="IX" style={{
            width: '54px', height: '54px',
            borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 18px', boxShadow: '0 8px 32px rgba(37,99,235,0.3)',
            objectFit: 'contain'
          }} />
          <h1 className="display" style={{ fontSize: '26px', color: 'var(--ink)', marginBottom: '6px' }}>
            Create account
          </h1>
          <p style={{ color: 'var(--ink3)', fontSize: '14px' }}>Start your invoice analytics journey</p>
        </div>

        <div className="surface-flat" style={{ padding: '32px' }}>
          {error && (
            <div style={{
              background: 'rgba(225,29,72,0.07)', border: '1px solid rgba(244,63,94,0.2)',
              borderRadius: '10px', padding: '11px 15px', marginBottom: '22px',
              color: '#fb7185', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'center',
            }}>
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {fields.map(({ k, l, t, p }) => (
              <div className="field" key={k}>
                <label className="field-label">{l}</label>
                <input
                  type={t} required className="input" placeholder={p}
                  value={form[k]}
                  onChange={e => setForm({ ...form, [k]: e.target.value })}
                />
              </div>
            ))}
            <button
              type="submit" disabled={loading}
              className="btn btn-primary"
              style={{ marginTop: '6px', justifyContent: 'center', opacity: loading ? 0.7 : 1, width: '100%', padding: '12px' }}
            >
              {loading ? (
                <><span style={{ display:'inline-block', width:'14px', height:'14px', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} /> Creating...</>
              ) : 'Create Account →'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--ink4)', marginTop: '22px' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--sapphire3)', fontWeight: '600', textDecoration: 'none' }}>
            Sign in →
          </Link>
        </p>
      </div>
    </div>
  );
}