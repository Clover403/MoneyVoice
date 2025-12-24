const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const scanRoutes = require('./scan');
const subscriptionRoutes = require('./subscription');
const sequelize = require('../config/sequelize');

// Mount routes
router.use('/auth', authRoutes);
router.use('/scan', scanRoutes);
router.use('/subscription', subscriptionRoutes);

// Health check - basic
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Scan Tunai API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Health check - detailed (untuk monitoring)
router.get('/health/detailed', async (req, res) => {
  const healthCheck = {
    success: true,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    platform: 'firebase-functions',
    services: {
      database: 'unknown'
    }
  };

  try {
    // Check database connection
    await sequelize.authenticate();
    healthCheck.services.database = 'healthy';
  } catch (error) {
    healthCheck.services.database = 'unhealthy';
    healthCheck.success = false;
  }

  const statusCode = healthCheck.success ? 200 : 503;
  res.status(statusCode).json(healthCheck);
});

module.exports = router;
