import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') !== 'light');

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const links = user
    ? [
        { path: '/dashboard', label: 'Dashboard' },
        { path: '/upload',    label: 'Upload'    },
        { path: '/prediction',label: 'Forecast'  },
        { path: '/help',      label: 'Help'      },
      ]
    : [];

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      height: '58px',
      background: scrolled ? 'rgba(7,11,20,0.97)' : 'rgba(7,11,20,0.7)',
      borderBottom: `1px solid ${scrolled ? 'rgba(30,48,77,0.8)' : 'transparent'}`,
      backdropFilter: 'blur(24px)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 28px',
      transition: 'background 0.3s, border-color 0.3s',
    }}>

      {/* ── Logo ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo.png" alt="IX" style={{
            width: '38px', height: '38px', borderRadius: '10px',
            boxShadow: '0 0 20px rgba(37,99,235,0.3)',
            objectFit: 'contain'
          }} />
          <span style={{
            fontFamily: "'Fraunces', serif", fontWeight: '700', fontSize: '17px',
            color: '#f4f7ff', letterSpacing: '0.01em',
          }}>INVOXL</span>
          <span style={{
            fontSize: '9px', fontWeight: '700',
            background: 'rgba(245,158,11,0.1)', color: '#f59e0b',
            border: '1px solid rgba(245,158,11,0.22)',
            padding: '2px 6px', borderRadius: '999px', letterSpacing: '0.07em',
            fontFamily: "'Outfit', sans-serif",
          }}>PRO</span>
        </Link>

        {links.length > 0 && (
          <>
            <div style={{ width: '1px', height: '16px', background: 'rgba(30,48,77,0.9)' }} />
            <div style={{ display: 'flex', gap: '2px' }}>
              {links.map(({ path, label }) => {
                const active = pathname === path;
                return (
                  <Link key={path} to={path} style={{
                    padding: '6px 13px', borderRadius: '8px', fontSize: '13px',
                    fontWeight: active ? 600 : 500,
                    color: active ? '#60a5fa' : '#4a5a78',
                    background: active ? 'rgba(37,99,235,0.09)' : 'transparent',
                    border: `1px solid ${active ? 'rgba(37,99,235,0.2)' : 'transparent'}`,
                    textDecoration: 'none', transition: 'all 0.18s',
                    fontFamily: "'Outfit', sans-serif",
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'rgba(16,23,42,0.8)'; }}}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.color = '#4a5a78'; e.currentTarget.style.background = 'transparent'; }}}
                  >{label}</Link>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Right side ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {user ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#2a3a55', marginRight: '4px' }}>
              <span className="dot-live" />
              <span style={{ color: '#4a5a78' }}>live</span>
            </div>

            <Link to="/profile" style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'rgba(12,17,32,0.9)',
              border: '1px solid rgba(30,48,77,0.8)',
              borderRadius: '10px', padding: '5px 12px 5px 6px',
              textDecoration: 'none', transition: 'border-color 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(37,99,235,0.35)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(30,48,77,0.8)'; }}
            >
              <div style={{
                width: '26px', height: '26px', borderRadius: '7px',
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Outfit', sans-serif", fontWeight: '700', fontSize: '11px', color: '#fff',
              }}>{user.name?.charAt(0)?.toUpperCase()}</div>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#f4f7ff', fontFamily: "'Outfit', sans-serif" }}>
                {user.name?.split(' ')[0]}
              </span>
            </Link>

            <button onClick={() => setIsDark(!isDark)} className="btn btn-ghost btn-sm"
              title="Toggle Theme"
              style={{ fontSize: '14px', padding: '4px 8px', borderRadius: '8px', border: '1px solid rgba(30,48,77,0.4)', background: 'transparent' }}>
              {isDark ? '☀️' : '🌙'}
            </button>

            <button onClick={() => { logout(); navigate('/'); }} className="btn btn-ghost btn-sm"
              style={{ fontSize: '12px', color: '#4a5a78', padding: '6px 11px' }}>
              Exit
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={{
              fontSize: '13px', fontWeight: '500', color: '#4a5a78',
              textDecoration: 'none', padding: '6px 14px',
              fontFamily: "'Outfit', sans-serif",
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#94a3b8'}
            onMouseLeave={e => e.currentTarget.style.color = '#4a5a78'}
            >Sign In</Link>
            <Link to="/register" className="btn btn-primary"
              style={{ textDecoration: 'none', padding: '8px 18px', fontSize: '13px' }}>
              Get Started →
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}