'use strict';

/**
 * Perform simple linear regression on a dataset of [index, value] points.
 */
function linearRegression(points) {
  const n = points.length;
  if (n < 2) return null;
  
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  points.forEach((p, i) => {
    sumX += i;
    sumY += p.value;
    sumXY += i * p.value;
    sumXX += i * i;
  });
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return { slope, intercept };
}

/**
 * predictSalesCount
 * Takes historical aggregation [{ _id: 'YYYY-MM-DD' or 'DD/MM/YYYY', count: N }]
 */
function predictSalesCount(data) {
  if (!data || data.length === 0) {
    return { tomorrow: 0, trend: 'flat', predictions: [], growthPct: 0 };
  }
  
  // 1. Sort historical data by date
  const sorted = [...data].sort((a, b) => {
    const parseDate = (s) => {
      if (!s) return new Date(0);
      if (s.includes('-')) return new Date(s); // YYYY-MM-DD
      const parts = s.split('/');
      if (parts.length === 3) {
        return new Date(parts[2], parts[1] - 1, parts[0]); // DD/MM/YYYY
      }
      return new Date(s);
    };
    return parseDate(a._id) - parseDate(b._id);
  });

  // 2. Prepare points for modeling
  const modelPoints = sorted.map(d => ({ value: d.count || 0 }));
  
  // ── Calculation 1: Moving Average (User requested logic) ──
  const last3 = modelPoints.slice(-3);
  const movingAverage = last3.length > 0
    ? Math.round(last3.reduce((sum, p) => sum + p.value, 0) / last3.length)
    : 0;

  // ── Calculation 2: Linear Regression ──
  const model = linearRegression(modelPoints);

  // 3. Generate 30-day forecast
  // We use the moving average for 'tomorrow' if regression fails or is too volatile
  const tomorrowPred = model ? Math.max(0, Math.round(model.intercept + model.slope * modelPoints.length)) : movingAverage;
  
  // Create prediction array for charts
  const lastDateStr = sorted[sorted.length - 1]._id;
  const parseLastDate = (s) => {
    if (s.includes('-')) return new Date(s);
    const [d, m, y] = s.split('/').map(Number);
    return new Date(y, m - 1, d);
  };
  const lastDate = parseLastDate(lastDateStr);
  
  const predictions = [];
  for (let i = 1; i <= 30; i++) {
    const nextDate = new Date(lastDate);
    nextDate.setDate(lastDate.getDate() + i);
    
    let val;
    if (model) {
      val = Math.max(0, Math.round(model.intercept + model.slope * (modelPoints.length + i - 1)));
    } else {
      val = movingAverage;
    }
    
    predictions.push({
      date: nextDate.toISOString().split('T')[0],
      predicted: val
    });
  }

  const avgCount = modelPoints.reduce((acc, p) => acc + p.value, 0) / modelPoints.length;
  const slope = model ? model.slope : 0;
  const growthPct = avgCount ? ((slope / avgCount) * 100).toFixed(1) : 0;

  return {
    tomorrow: tomorrowPred || movingAverage, // Ensure it's not 0 if we have data
    trend: slope > 0.1 ? 'up' : (slope < -0.1 ? 'down' : 'flat'),
    predictions,
    growthPct,
    predictedMonthlyOrders: predictions.reduce((acc, p) => acc + p.predicted, 0)
  };
}

module.exports = { predictSalesCount };