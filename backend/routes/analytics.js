const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const Invoice = require('../models/Invoice');

const { parseToISO } = require('../utils/dateUtils');

// Reliably get numeric amount from any invoice (covers all field aliases)

// Reliably get numeric amount from any invoice (covers all field aliases)
const getAmount = (inv) => {
  const v = parseFloat(
    inv.finalAmount || inv.grandTotal || inv.total || 0
  );
  return isNaN(v) ? 0 : v;
};

// Get the effective date of an invoice (prefer invoiceDate, fall back to orderDate)
const getInvoiceDate = (inv) =>
  parseToISO(inv.invoiceDate) || parseToISO(inv.orderDate) || null;

// GET /api/analytics/summary
router.get('/summary', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const invoices = await Invoice.find({ userId }).lean();

    if (!invoices.length) {
      return res.json({
        totalRevenue: 0,
        totalOrders: 0,
        todayOrders: 0,
        invoiceCount: 0,
        revenueByDate: [],
        ordersByDate: [],
        platformDistribution: [],
        stateBreakdown: [],
        topProducts: []
      });
    }

    // Core totals
    const totalRevenue = invoices.reduce((sum, inv) => sum + getAmount(inv), 0);
    const totalOrders  = invoices.length;

    // Revenue by date (for trend chart)
    const revByDate = {};
    const ordByDate = {};
    for (const inv of invoices) {
      const d = getInvoiceDate(inv) || 'unknown';
      revByDate[d] = (revByDate[d] || 0) + getAmount(inv);
      ordByDate[d] = (ordByDate[d] || 0) + 1;
    }

    const revenueByDate = Object.entries(revByDate)
      .filter(([d]) => d !== 'unknown')
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({ date, revenue: parseFloat(revenue.toFixed(2)) }));

    const ordersByDate = Object.entries(ordByDate)
      .filter(([d]) => d !== 'unknown')
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, orders]) => ({ date, orders }));

    // "Today's" Orders = orders on the LATEST date that exists in the database
    // (invoices are historical; comparing to server today would always give 0)
    const latestDate = revenueByDate.length
      ? revenueByDate[revenueByDate.length - 1].date
      : null;
    const todayOrders = latestDate
      ? (ordByDate[latestDate] || 0)
      : 0;

    // Platform distribution — prefer platform field, then supplierName, default 'Meesho'
    const platformMap = {};
    for (const inv of invoices) {
      const platform = inv.platform || inv.supplierName || 'Meesho';
      platformMap[platform] = (platformMap[platform] || 0) + getAmount(inv);
    }
    const platformDistribution = Object.entries(platformMap)
      .map(([platform, revenue]) => ({ platform, revenue: parseFloat(revenue.toFixed(2)) }));

    // State breakdown
    const stateMap = {};
    for (const inv of invoices) {
      const s = (inv.state || 'Unknown').trim();
      if (s) stateMap[s] = (stateMap[s] || 0) + getAmount(inv);
    }
    const stateBreakdown = Object.entries(stateMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([state, revenue]) => ({ state, revenue: parseFloat(revenue.toFixed(2)) }));

    // Top products
    const productMap = {};
    for (const inv of invoices) {
      const p = (inv.productName || 'Unknown').slice(0, 60).trim();
      if (p && p !== 'Unknown') {
        productMap[p] = productMap[p] || { revenue: 0, orders: 0 };
        productMap[p].revenue += getAmount(inv);
        productMap[p].orders  += 1;
      }
    }
    const topProducts = Object.entries(productMap)
      .sort(([, a], [, b]) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(([product, stats]) => ({
        product,
        revenue: parseFloat(stats.revenue.toFixed(2)),
        orders: stats.orders
      }));

    res.json({
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalOrders,
      todayOrders,
      latestDate,
      invoiceCount: totalOrders,
      revenueByDate,
      ordersByDate,
      platformDistribution,
      stateBreakdown,
      topProducts
    });

  } catch (err) {
    console.error('Analytics summary error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/forecast
router.get('/forecast', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const invoices = await Invoice.find({ userId }).lean();

    // Aggregate orders per day
    const dailyMap = {};
    for (const inv of invoices) {
      const d = parseToISO(inv.invoiceDate) || parseToISO(inv.orderDate);
      if (d) {
        dailyMap[d] = (dailyMap[d] || 0) + 1;
      }
    }

    const dailySeries = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, orders]) => ({ date, orders }));

    // Need at least 3 data points for meaningful forecast
    if (dailySeries.length < 3) {
      return res.json({
        hasData: false,
        message: 'Upload at least 3 days of invoices to generate a forecast.',
        forecast: []
      });
    }

    // Simple linear trend + 7-day moving average forecast (30 days)
    const values = dailySeries.map(d => d.orders);
    const n = values.length;

    // Linear regression
    const xMean = (n - 1) / 2;
    const yMean = values.reduce((a, b) => a + b, 0) / n;
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
      num += (i - xMean) * (values[i] - yMean);
      den += (i - xMean) ** 2;
    }
    const slope = den !== 0 ? num / den : 0;
    const intercept = yMean - slope * xMean;

    // Moving average window
    const window = Math.min(7, n);
    const recentAvg = values.slice(-window).reduce((a, b) => a + b, 0) / window;

    // Generate 30-day forecast
    const lastDate = new Date(dailySeries[dailySeries.length - 1].date);
    const forecast = [];
    for (let i = 1; i <= 30; i++) {
      const d = new Date(lastDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      // Blend linear trend (60%) with recent average (40%)
      const trendVal = intercept + slope * (n + i - 1);
      const predicted = Math.max(0, Math.round(trendVal * 0.6 + recentAvg * 0.4));
      forecast.push({ date: dateStr, predicted });
    }

    // Tomorrow specifically
    const tomorrow = forecast[0];

    res.json({
      hasData: true,
      historical: dailySeries,
      forecast,
      tomorrow: {
        date: tomorrow.date,
        predicted: tomorrow.predicted,
        trend: slope > 0.1 ? 'up' : slope < -0.1 ? 'down' : 'flat'
      },
      summary: {
        avgDailyOrders: parseFloat(yMean.toFixed(1)),
        totalDays: n,
        totalOrders: values.reduce((a, b) => a + b, 0)
      }
    });

  } catch (err) {
    console.error('Forecast error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;