/**
 * Firebase Cloud Functions - Scan Tunai API
 * 
 * File ini merupakan entry point untuk Firebase Functions
 * yang mengexpose Express app sebagai Cloud Function
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

// Import Express app
const app = require('./app');

// Export Express app sebagai Firebase Cloud Function
// Region asia-southeast1 (Singapore) untuk latency yang lebih baik di Indonesia
exports.api = functions
  .region('asia-southeast1')
  .runWith({
    timeoutSeconds: 60,
    memory: '512MB'
  })
  .https.onRequest(app);
