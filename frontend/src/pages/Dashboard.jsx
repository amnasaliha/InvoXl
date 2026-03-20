import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';

const PALETTE = ['#3b82f6', '#7c3aed', '#14b8a6', '#f59e0b', '#8b5cf6', '#f43f5e'];

const ChartTip = ({ active, payload, label }) =>
  active && payload?.length ? (
    <div style={{
      background: 'var(--depth3)', border: '1px solid var(--rim2)',
      borderRadius: '12px', padding: '10px 14px',
    }}>
      <p style={{ fontFamily: "'Outfit', sans-serif", fontWeight: '600', fontSize: '11px', color: 'var(--ink)', marginBottom: '4px' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize: '13px', color: p.color, fontFamily: "'DM Mono', monospace" }}>
          {p.name === 'Orders' ? `${p.value} Orders` : `₹${(p.value || 0).toLocaleString()}`}
        </p>
      ))}
    </div>
  ) : null;

function KPI({ title, value, icon, color, sub, delay }) {
  return (
    <div className={`surface rise-${delay}`} style={{ padding: '22px', position: 'relative', overflow: 'hidden', cursor: 'default' }}>
      <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '120px', height: '120px', borderRadius: '50%', background: color, opacity: 0.07, filter: 'blur(20px)' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p className="label" style={{ marginBottom: '14px' }}>{title}</p>
          <p style={{ fontFamily: "'Fraunces', serif", fontWeight: '700', fontSize: '30px', color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1 }}>
            {value}
          </p>
          {sub && <p style={{ fontSize: '11px', color: 'var(--ink4)', marginTop: '7px' }}>{sub}</p>}
        </div>
        <div style={{
          width: '40px', height: '40px', borderRadius: '11px',
          background: `${color}12`, border: `1px solid ${color}20`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
        }}>{icon}</div>
      </div>
    </div>
  );
}

const chartCard = { background: 'var(--depth2)', border: '1px solid var(--rim)', borderRadius: '18px', padding: '24px' };
const axisProps  = { tick: { fontSize: 10, fill: '#2a3a55', fontFamily: "'DM Mono', monospace" }, axisLine: false, tickLine: false };
const gridProps  = { strokeDasharray: '4 4', stroke: '#1e304d', strokeWidth: 1 };
const emptyState = (msg) => (
  <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink4)', fontSize: '13px' }}>
    {msg}
  </div>
);

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [byDate, setByDate]   = useState([]);
  const [byState, setByState] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('invoxl_token');
        const headers = { Authorization: `Bearer ${token}` };

        const [sumRes, foreRes] = await Promise.all([
          axios.get('/api/analytics/summary', { headers }),
          axios.get('/api/analytics/forecast', { headers })
        ]);

        const data = sumRes.data;
        const foreData = foreRes.data;

        setSummary({
          ...data,
          predictedTomorrow: foreData?.tomorrow?.predicted || 0,
          trend: foreData?.tomorrow?.trend || 'flat'
        });

        if (data.revenueByDate?.length) {
          setByDate(data.revenueByDate.map((x, i) => ({
            date: x.date,
            revenue: x.revenue,
            orders: data.ordersByDate[i]?.orders || 0
          })));
        }

        if (data.stateBreakdown?.length) {
          setByState(data.stateBreakdown.map(x => ({
            state: x.state,
            revenue: x.revenue
          })));
        }

        if (data.platformDistribution?.length) {
          setPlatforms(data.platformDistribution.map(x => ({
            name: x.platform,
            value: x.revenue
          })));
        }

        if (data.topProducts?.length) {
          setTopProducts(data.topProducts.map(x => ({
            name: x.product,
            revenue: x.revenue,
            orders: x.orders
          })));
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleExport = async () => {
    try {
    const isProd = process.env.NODE_ENV === 'production';
    const apiBase = process.env.REACT_APP_API_URL || (isProd ? window.location.origin : 'http://localhost:5001');
    const response = await fetch(apiBase + "/api/export/excel", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('invoxl_token')}`
      }
    });
      if(!response.ok) throw new Error("Failed to generate excel");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "invoxl_invoices.xlsx";
      a.click();
    } catch (e) {
      console.error(e);
      alert("Error exporting excel file");
    }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--void)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', paddingTop: '58px' }}>
      <div style={{ width: '36px', height: '36px', border: '3px solid var(--rim)', borderTopColor: 'var(--sapphire)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '13px', color: 'var(--ink3)' }}>Loading analytics...</p>
    </div>
  );

  return (
    <div style={{ background: 'var(--void)', minHeight: '100vh', paddingTop: '80px', paddingBottom: '70px' }}>
      <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '0 28px' }}>

        {/* Header */}
        <div className="rise-1" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <p className="label" style={{ marginBottom: '8px' }}>Analytics / Overview</p>
            <h1 className="display" style={{ fontSize: '28px', color: 'var(--ink)' }}>INVOXL Intelligence</h1>
            <p style={{ color: 'var(--ink3)', fontSize: '13px', marginTop: '4px' }}>
              {summary?.totalOrders || 0} invoices processed & analyzed
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={handleExport} className="btn btn-primary btn-sm">⬇ Download Full Excel</button>
          </div>
        </div>

        <div className="divider-glow" style={{ marginBottom: '28px' }} />

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '20px' }}>
          <KPI title="Total Revenue" value={`₹${(summary?.totalRevenue||0).toLocaleString()}`}       icon="💰" color="#3b82f6" delay="1" />
          <KPI title="Total Orders"  value={summary?.totalOrders||0}                                   icon="📦" color="#14b8a6" delay="2" />
          <KPI title="Today's Orders"  value={summary?.todayOrders||0}                                   icon="🔥" color="#f59e0b" delay="3" sub={summary?.latestDate ? `Latest: ${summary.latestDate}` : undefined} />
          <KPI title="Tomorrow Prediction" value={`${summary?.predictedTomorrow||0} Orders`}             icon="🔮" color="#7c3aed" delay="4" sub={`Trend: ${summary?.trend||'flat'}`} />
        </div>

        {/* Charts row 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '14px', marginBottom: '14px' }}>

          <div style={chartCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px' }}>
              <div>
                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: '700', fontSize: '14px', color: 'var(--ink)' }}>Sales & Revenue Trend</h3>
                <p style={{ fontSize: '11px', color: 'var(--ink3)', marginTop: '3px' }}>Daily performance metrics</p>
              </div>
              <div style={{display: 'flex', gap: '6px'}}>
                <span className="badge badge-blue">Revenue</span>
                <span className="badge badge-teal">Orders</span>
              </div>
            </div>
            {byDate.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={byDate}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="date" {...axisProps} />
                  <YAxis yAxisId="left" {...axisProps} />
                  <YAxis yAxisId="right" orientation="right" {...axisProps} />
                  <Tooltip content={<ChartTip />} />
                  <Line yAxisId="left" type="monotone" name="Revenue" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
                  <Line yAxisId="right" type="monotone" name="Orders" dataKey="orders" stroke="#14b8a6" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            ) : emptyState('Upload invoices to see trends')}
          </div>

          <div style={chartCard}>
            <div style={{ marginBottom: '22px' }}>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: '700', fontSize: '14px', color: 'var(--ink)' }}>Platform Distribution</h3>
              <p style={{ fontSize: '11px', color: 'var(--ink3)', marginTop: '3px' }}>Revenue share by platform</p>
            </div>
            {platforms.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={platforms} cx="50%" cy="50%" innerRadius={54} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {platforms.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--depth3)', border: '1px solid var(--rim2)', borderRadius: '10px', fontSize: '12px', fontFamily: "'DM Mono', monospace" }} />
                  <Legend iconType="circle" iconSize={7} formatter={v => <span style={{ color: 'var(--ink3)', fontSize: '11px' }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : emptyState('No platform data yet')}
          </div>
        </div>

        {/* Charts row 2 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>

          <div style={chartCard}>
            <div style={{ marginBottom: '22px' }}>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: '700', fontSize: '14px', color: 'var(--ink)' }}>State Breakdown</h3>
              <p style={{ fontSize: '11px', color: 'var(--ink3)', marginTop: '3px' }}>Revenue by region</p>
            </div>
            {byState.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={byState}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="state" {...axisProps} />
                  <YAxis {...axisProps} />
                  <Tooltip content={<ChartTip />} />
                  <Bar dataKey="revenue" radius={[5,5,0,0]}>
                    {byState.map((_, i) => <Cell key={i} fill={i === 0 ? '#3b82f6' : '#162035'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : emptyState('No state data yet')}
          </div>

          <div style={chartCard}>
            <div style={{ marginBottom: '22px' }}>
              <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: '700', fontSize: '14px', color: 'var(--ink)' }}>Inventory Success</h3>
              <p style={{ fontSize: '11px', color: 'var(--ink3)', marginTop: '3px' }}>Best selling products</p>
            </div>
            {topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={topProducts} layout="vertical" margin={{ left: -20, right: 10 }}>
                  <CartesianGrid {...gridProps} horizontal={true} vertical={false} />
                  <XAxis type="number" {...axisProps} />
                  <YAxis type="category" dataKey="name" {...axisProps} width={100} tickFormatter={v => v.length > 12 ? v.substring(0,12)+'...' : v} />
                  <Tooltip content={<ChartTip />} />
                  <Bar dataKey="revenue" radius={[0,5,5,0]}>
                    {topProducts.map((_, i) => <Cell key={i} fill={['#f59e0b','#3b82f6','#7c3aed','#14b8a6'][i % 4]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : emptyState('No product data yet')}
          </div>
        </div>

      </div>
    </div>
  );
}