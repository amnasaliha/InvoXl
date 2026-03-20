'use strict';

/**
 * Global Error Handler Middleware
 * Ensures all unhandled errors return a valid JSON response instead of HTML.
 */
function errorHandler(err, req, res, next) {
  console.error('[GLOBAL ERROR]', err.stack);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
}

function notFoundHandler(req, res, next) {
  try {
    const fs = require('fs');
    const path = require('path');
    fs.appendFileSync(path.join(__dirname, '../err_trace.txt'), `[404 ${new Date().toISOString()}] ${req.method} ${req.originalUrl}\n`);
  } catch (e) {}

  res.status(404).json({
    success: false,
    message: `Not Found - ${req.originalUrl}`
  });
}

module.exports = { errorHandler, notFoundHandler };
