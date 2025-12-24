/**
 * Express App untuk Firebase Functions
 * 
 * Versi modifikasi dari server.js yang kompatibel dengan Firebase Functions
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const routes = require('./routes');

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration - lebih permissive untuk Firebase Functions
app.use(cors({
  origin: true, // Allow all origins, atau specify domain frontend Anda
  credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api', routes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Selamat datang di Scan Tunai API (Firebase)!',
    version: '1.0.0',
    documentation: '/api/health'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint tidak ditemukan.'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan pada server.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;
