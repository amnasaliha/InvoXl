const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const Invoice = require('../models/Invoice');
const { predictRevenue } = require('../utils/predict');
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'missing',
});

router.post('/', auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const uid = req.user._id;

    // Fetch context data for the AI
    const historical = await Invoice.aggregate([
      { $match: { userId: uid } },
      { $group: { _id: '$invoiceDate', total: { $sum: '$finalAmount' } } },
      { $sort: { _id: 1 } }
    ]);
    
    const todayISO = new Date().toISOString().split('T')[0];
    
    const todayData = historical.find(d => d._id === todayISO);
    const todaySales = todayData ? todayData.total : 0;
    const prediction = predictRevenue(historical);

    const [revenue, orders, platforms, topProducts] = await Promise.all([
      Invoice.aggregate([{ $match: { userId: uid } }, { $group: { _id: null, total: { $sum: '$finalAmount' } } }]),
      Invoice.countDocuments({ userId: uid }),
      Invoice.aggregate([
        { $match: { userId: uid } },
        { $group: { _id: { $ifNull: ['$platform', 'Generic'] }, total: { $sum: '$finalAmount' } } }
      ]),
      Invoice.aggregate([
        { $match: { userId: uid } },
        { $group: { _id: '$productName', total: { $sum: '$finalAmount' } } },
        { $sort: { total: -1 } }, { $limit: 3 }
      ])
    ]);

    const totalRev = revenue[0]?.total || 0;
    
    const context = `
      User Analytics Context:
      - Total Orders: ${orders}
      - Total Revenue: ₹${totalRev}
      - Today's Sales: ₹${todaySales}
      - Predicted Tomorrow's Sales: ₹${prediction.tomorrow || 0}
      - Platform Revenue Breakdown: ${platforms.map(p => `${p._id}: ₹${p.total}`).join(', ')}
      - Top 3 Products by Revenue: ${topProducts.map(p => `${p._id} (₹${p.total})`).join(', ')}
    `;

    if (process.env.OPENAI_API_KEY) {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are an AI sales analytics assistant for INVOXL. Answer the user\'s question briefly based only on the provided context data.' },
          { role: 'system', content: context },
          { role: 'user', content: message }
        ],
        temperature: 0.3,
        max_tokens: 150
      });
      return res.json({ reply: response.choices[0].message.content });
    } else {
      // Fallback logic if API key is missing
      return res.json({ 
        reply: `⚠️ Please add OPENAI_API_KEY to your .env file to enable the AI Chatbot.\n\nHere is your current data context though:\nToday's Sales: ₹${todaySales}\nTomorrow's Prediction: ₹${prediction.tomorrow || 0}\nTop Product: ${topProducts[0]?._id || 'N/A'} (₹${topProducts[0]?.total || 0})`
      });
    }

  } catch (err) {
    console.error('Chat AI Error:', err.message);
    res.status(500).json({ error: 'Failed to process chat query' });
  }
});

module.exports = router;
