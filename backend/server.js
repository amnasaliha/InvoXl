'use strict';
require('dotenv').config();

const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const path     = require('path');
const fs       = require('fs');

const app = express();

// 5. CORS Fix
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 6. Debugging - Log when request hits backend
app.use((req, res, next) => {
  console.log(`[INVOXL-REQ] ${new Date().toISOString()} | ${req.method} ${req.url}`);
  next();
});

// Routes
try {
  const authRoutes      = require('./routes/auth');
  const invoiceRoutes   = require('./routes/invoices');
  const analyticsRoutes = require('./routes/analytics');
  const reparseRoutes   = require('./routes/invoiceReparse.route');
  const extractRoutes   = require('./routes/extract'); // Ensure this exists
  const exportRoutes    = require('./routes/export');
  const chatRoutes      = require('./routes/chat');

  app.use('/api/auth',       authRoutes);
  app.use('/api/invoices',   invoiceRoutes);
  app.use('/api/invoices',   reparseRoutes);
  app.use('/api/analytics',  analyticsRoutes);
  
  // 3. Route Fix - server.js mounts at /api
  app.use('/api',            extractRoutes); 
  
  app.use('/api/export',     exportRoutes);
  app.use('/api/chat',       chatRoutes);

  console.log('✅ All routes loaded');
} catch (err) {
  console.error('❌ Route loading failed:', err.message);
  process.exit(1);
}

// Global Error Handler (JSON Enforced)
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');
app.use(notFoundHandler);
app.use(errorHandler);

// 2. Backend Server Port 5001
const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/invoxl';

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected');
    
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`); // Requested log format
      console.log(`✅ Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Server startup failed:', err.message);
    process.exit(1);
  }
}

start();