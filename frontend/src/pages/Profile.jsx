import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const quickLinks = [
  { label: 'Dashboard',     path: '/dashboard', icon: '◈' },
  { label: 'Upload Invoice', path: '/upload',   icon: '↑' },
  { label: 'Sales Forecast', path: '/prediction', icon: '◉' },
  { label: 'Help Center',   path: '/help',      icon: '?' },
];

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('invoxl_token');
    if (!token) return;

    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    axios.get('/api/analytics/summary')
      .then(res => setStats(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div style={{ background: 'var(--void)', minHeight: '100vh', paddingTop: '88px', paddingBottom: '70px', position: 'relative' }}>
      <div className="orb" style={{ width: '400px', height: '400px', top: '5%', right: '5%', background: 'rgba(124,58,237,0.06)', zIndex: 0 }} />

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 28px', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Profile card */}
        <div className="rise-1 surface-flat" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              width: '72px', height: '72px',
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Outfit', sans-serif", fontWeight: '800', fontSize: '28px', color: '#fff',
              boxShadow: '0 8px 32px rgba(37,99,235,0.35)', flexShrink: 0,
            }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <h1 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: '800', fontSize: '22px', color: 'var(--ink)', marginBottom: '5px' }}>
                {user?.name}
              </h1>
              <p style={{ color: 'var(--ink3)', fontSize: '13px', marginBottom: '10px' }}>{user?.email}</p>
              <span className="badge badge-teal">✓ Active Account</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="rise-2 surface-flat" style={{ padding: '24px' }}>
          <p className="label" style={{ marginBottom: '18px' }}>Account Stats</p>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--ink4)' }}>
              <div style={{ width: '28px', height: '28px', border: '3px solid var(--rim)', borderTopColor: 'var(--sapphire)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto' }} />
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}>
              {[
                { label: 'Total Invoices', value: stats?.totalOrders || 0, color: '#3b82f6' },
                { label: 'Total Revenue',  value: `₹${(stats?.totalRevenue || 0).toLocaleString()}`, color: '#14b8a6' },
                { label: 'Avg Order',      value: `₹${(stats?.averageOrderValue || 0).toLocaleString()}`, color: '#f59e0b' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: 'var(--depth1)', borderRadius: '12px', padding: '18px', border: '1px solid var(--rim)', textAlign: 'center' }}>
                  <p style={{ fontFamily: "'Fraunces', serif", fontWeight: '700', fontSize: '24px', color, marginBottom: '5px', lineHeight: 1 }}>{value}</p>
                  <p style={{ fontSize: '11px', color: 'var(--ink3)', fontWeight: '500' }}>{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="rise-3 surface-flat" style={{ padding: '24px' }}>
          <p className="label" style={{ marginBottom: '16px' }}>Quick Actions</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {quickLinks.map(({ label, path, icon }) => (
              <button key={path} onClick={() => navigate(path)} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                background: 'var(--depth1)', border: '1px solid var(--rim)',
                borderRadius: '11px', padding: '13px 16px', cursor: 'pointer',
                color: 'var(--ink2)', fontSize: '13px', fontWeight: '500',
                fontFamily: "'Outfit', sans-serif", transition: 'all 0.18s', textAlign: 'left',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(37,99,235,0.35)'; e.currentTarget.style.color = 'var(--ink)'; e.currentTarget.style.background = 'var(--depth3)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--rim)'; e.currentTarget.style.color = 'var(--ink2)'; e.currentTarget.style.background = 'var(--depth1)'; }}
              >
                <span style={{ fontSize: '15px', opacity: 0.6 }}>{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Account Info */}
        <div className="rise-4 surface-flat" style={{ padding: '24px' }}>
          <p className="label" style={{ marginBottom: '18px' }}>Account Information</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {[
              { label: 'Full Name',   value: user?.name },
              { label: 'Email',       value: user?.email },
              { label: 'Account ID',  value: user?.id },
              { label: 'Platform',    value: 'INVOXL v1.0.0' },
            ].map(({ label, value }, i, arr) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '13px 0',
                borderBottom: i < arr.length - 1 ? '1px solid rgba(30,48,77,0.4)' : 'none',
              }}>
                <span style={{ fontSize: '12px', color: 'var(--ink3)', fontWeight: '500' }}>{label}</span>
                <span style={{ fontSize: '13px', color: 'var(--ink)', fontFamily: label === 'Account ID' ? "'DM Mono', monospace" : "'Outfit', sans-serif", maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Logout */}
        <button className="rise-5 btn btn-danger"
          onClick={handleLogout}
          style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '14px' }}>
          Sign Out
        </button>
      </div>
    </div>
  );
}