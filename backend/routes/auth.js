
const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const bcrypt = require('bcryptjs');

const secret = process.env.JWT_SECRET || "default_secret";
const signToken = (id) => jwt.sign({ id }, secret, { expiresIn: '7d' });

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Explicit Validation
    if (!name || !email || !password) {
      console.log('[INVOXL AUTH] Registration failed: Missing Required Fields');
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (await User.findOne({ email })) {
      console.log(`[INVOXL AUTH] Registration failed: Email ${email} already exists`);
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const user = await User.create({ name, email, password });
    const token = signToken(user._id);

    console.log(`[INVOXL AUTH] Registration success: ${email}`);
    res.status(201).json({ success: true, token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.log('[INVOXL AUTH] Registration Error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('[INVOXL AUTH] Login failed: Missing credentials');
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log(`[INVOXL AUTH] Login failed: User ${email} not found`);
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log(`[INVOXL AUTH] Login failed: Incorrect password for ${email}`);
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = signToken(user._id);
    console.log(`[INVOXL AUTH] Login success: ${email}`);
    res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.log('[INVOXL AUTH] Login Error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/me', require('../middleware/authMiddleware'), (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;