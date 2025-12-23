const express = require('express');
const router = express.Router();
const scanController = require('../controllers/scanController');
const { authenticate, checkScanLimit } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');

// All routes require authentication
router.use(authenticate);

// Single scan
router.post(
  '/single',
  checkScanLimit,
  upload.single('image'),
  handleUploadError,
  scanController.scanCurrency
);

// History routes - MUST be defined BEFORE :sessionId routes
router.get('/history', scanController.getScanHistory);
router.get('/calculation/history', scanController.getCalculationHistory);

// Calculation session routes
router.post('/calculation/start', scanController.startCalculationSession);
router.post(
  '/calculation/:sessionId/add',
  checkScanLimit,
  upload.single('image'),
  handleUploadError,
  scanController.addToCalculation
);
router.post('/calculation/:sessionId/finish', scanController.finishCalculation);
router.get('/calculation/:sessionId', scanController.getSessionInfo);

module.exports = router;
