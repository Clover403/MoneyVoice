const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { authenticate } = require('../middleware/auth');

// Public route - get available plans
router.get('/plans', subscriptionController.getPlans);

// Protected routes
router.get('/current', authenticate, subscriptionController.getCurrentSubscription);
router.post('/subscribe', authenticate, subscriptionController.subscribe);
router.post('/cancel', authenticate, subscriptionController.cancelSubscription);

module.exports = router;
