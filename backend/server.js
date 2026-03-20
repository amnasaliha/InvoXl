'use strict';
require('dotenv').config();

const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const path     = require('path');
const fs       = require('fs');

// Global Error Handling (CRITICAL for Render)
process.on('uncaughtException', (err) => {
  console.error('[CRITICAL] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

const app = express();

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('✅ Created uploads directory');
}

// CORS & JSON Middleware
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

  // Serve static frontend files (ONLY if they exist - for unified deployment)
  const frontendBuildPath = path.join(__dirname, '../frontend/build');
  if (fs.existsSync(frontendBuildPath)) {
    console.log('✅ Serving frontend build from:', frontendBuildPath);
    app.use(express.static(frontendBuildPath));
    // Any route not caught by API should serve React's index.html
    app.get('*', (req, res, next) => {
      // Don't intercept API routes starting with /api
      if (req.url.startsWith('/api')) return next();
      res.sendFile(path.join(frontendBuildPath, 'index.html'));
    });
  }
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
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/invoxl';
    
    // Explicitly check for missing URI in production
    if (!process.env.MONGO_URI && process.env.NODE_ENV === 'production') {
       console.error('❌ MONGODB ERROR: MONGO_URI environment variable is NOT SET.');
       console.error('⚠️ FIX: Go to Render Dashboard > Environment > Add MONGO_URI.');
       process.exit(1);
    }

    console.log('⏳ Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected');
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Server startup failed:', err.message);
    process.exit(1);
  }
}

start();