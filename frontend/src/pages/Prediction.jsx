import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Prediction() {
  const [historical, setHistorical] = useState([]);
  const [forecast, setForecast]     = useState([]);
  const [tomorrow, setTomorrow]     = useState(null);
  const [summary, setSummary]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [noData, setNoData]         = useState(false);
  const [message, setMessage]       = useState('');

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        const token = localStorage.getItem('invoxl_token');
        const res = await axios.get('/api/analytics/forecast', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = res.data;

        if (!data.hasData) {
          setNoData(true);
          setMessage(data.message);
          return;
        }

        setNoData(false);
        setHistorical(data.historical);   // past daily orders
        setForecast(data.forecast);       // next 30 days predicted
        setTomorrow(data.tomorrow);       // { date, predicted, trend }
        setSummary(data.summary);         // { avgDailyOrders, totalDays, totalOrders }
      } catch (err) {
        console.error('Forecast fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchForecast();
  }, []);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--void)', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '58px' }}>
      <div style={{ width: '36px', height: '36px', border: '3px solid var(--rim)', borderTopColor: 'var(--sapphire)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  );

  const growthUp = tomorrow?.trend === 'up';

  return (
    <div style={{ background: 'var(--void)', minHeight: '100vh', paddingTop: '88px', paddingBottom: '70px', position: 'relative' }}>
      <div className="orb" style={{ width: '500px', height: '400px', top: '10%', right: '-10%', background: 'rgba(13,148,136,0.06)', zIndex: 0 }} />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 28px', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div className="rise-1" style={{ marginBottom: '40px' }}>
          <p className="label" style={{ marginBottom: '8px' }}>AI / Forecast</p>
          <h1 className="display" style={{ fontSize: '28px', color: 'var(--ink)' }}>Order Volume Prediction</h1>
          <p style={{ color: 'var(--ink3)', fontSize: '13px', marginTop: '4px' }}>
            30-day sales count forecast using historical invoice data
          </p>
        </div>

        {noData ? (
          <div className="surface-flat" style={{ padding: '80px', textAlign: 'center' }}>
            <div style={{ fontSize: '52px', marginBottom: '18px' }}>📊</div>
            <p style={{ fontFamily: "'Outfit', sans-serif", fontWeight: '700', color: 'var(--ink)', fontSize: '16px', marginBottom: '8px' }}>
              {message || 'Not enough data for prediction'}
            </p>
            <p style={{ color: 'var(--ink3)', fontSize: '13px' }}>
              Upload at least 3 days of invoices to generate a trend accurately
            </p>
          </div>
        ) : (
          <>
            {/* KPI row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px', marginBottom: '20px' }}>
              {[
                {
                  label: 'Total Orders Found',
                  value: `${(summary?.totalOrders || 0).toLocaleString()}`,
                  color: 'var(--sapphire)',
                  icon: '📦',
                },
                {
                  label: 'Tomorrow (Predicted)',
                  value: `${tomorrow?.predicted || 0} Orders`,
                  color: 'var(--teal)',
                  icon: '📈',
                },
                {
                  label: 'Trend Status',
                  value: tomorrow?.trend?.toUpperCase() || 'FLAT',
                  color: growthUp ? 'var(--teal)' : (tomorrow?.trend === 'down' ? 'var(--rose)' : 'var(--ink3)'),
                  icon: growthUp ? '↑' : (tomorrow?.trend === 'down' ? '↓' : '→'),
                },
              ].map(({ label, value, color, icon }) => (
                <div key={label} className="surface rise-2" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '100px', height: '100px', borderRadius: '50%', background: color, opacity: 0.1, filter: 'blur(20px)' }} />
                  <p className="label" style={{ marginBottom: '14px' }}>{label}</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <p style={{ fontFamily: "'Fraunces', serif", fontWeight: '700', fontSize: '32px', color, letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</p>
                    <span style={{ fontSize: '20px' }}>{icon}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="rise-3 surface-flat" style={{ padding: '28px' }}>
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: '700', fontSize: '15px', color: 'var(--ink)' }}>
                  30-Day Sales Volume Forecast
                </h3>
                <p style={{ fontSize: '11px', color: 'var(--ink3)', marginTop: '4px' }}>
                  Projected daily order count based on invoice density (Linear Trend + Moving Avg)
                </p>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={forecast}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#1e304d" strokeWidth={1} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10, fill: '#2a3a55', fontFamily: "'DM Mono', monospace" }} 
                    axisLine={false} 
                    tickLine={false} 
                    interval={4} 
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: '#2a3a55', fontFamily: "'DM Mono', monospace" }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <Tooltip
                    formatter={(v) => [`${v} Orders`, 'Predicted']}
                    contentStyle={{ background: 'var(--depth3)', border: '1px solid var(--rim2)', borderRadius: '12px', fontSize: '12px', fontFamily: "'DM Mono', monospace" }}
                  />
                  <Line
                    type="monotone" 
                    dataKey="predicted"
                    stroke="url(#gradient)" 
                    strokeWidth={2.5}
                    dot={false} 
                    strokeDasharray="6 4"
                    activeDot={{ r: 5, fill: '#14b8a6', stroke: 'var(--void)', strokeWidth: 2 }}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#2563eb" />
                      <stop offset="100%" stopColor="#14b8a6" />
                    </linearGradient>
                  </defs>
                </LineChart>
              </ResponsiveContainer>
              <p style={{ fontSize: '11px', color: 'var(--ink4)', marginTop: '16px', textAlign: 'center', fontFamily: "'DM Mono', monospace" }}>
                * Predictions are based on historical daily counts using Linear Regression. Actual results may vary.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}