const path = require('path');
const fs = require('fs');
const { CalculationSession, Subscription, ScanHistory } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { detectCurrency, numberToIndonesianText, CURRENCY_TEXT } = require('../services/geminiCurrencyDetector');

/**
 * Single currency scan
 * Image is analyzed by AI then deleted - only data is stored in PostgreSQL
 */
const scanCurrency = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Gambar tidak ditemukan. Silakan upload gambar uang.'
      });
    }

    console.log('Processing scan for file:', req.file.path);

    // Detect currency using Gemini AI (image will be deleted after processing)
    const detection = await detectCurrency(req.file.path);
    
    // Check if detection was successful
    if (detection.value === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak dapat mendeteksi uang. Pastikan gambar jelas dan uang terlihat dengan baik.',
        data: {
          error: detection.error
        }
      });
    }

    // Update scan counter for free users
    const subscription = req.user.subscription;
    if (subscription && subscription.tipePaket === 'gratis') {
      await subscription.increment('jumlahScanHariIni');
    }

    // Save to PostgreSQL (ScanHistory table)
    const scanRecord = await ScanHistory.create({
      userId: req.user.id,
      nilaiUang: detection.value,
      confidence: detection.confidence,
      tipeOperasi: 'scan_tunggal'
    });

    // Calculate remaining scans for free users
    let remainingScans = null;
    if (subscription && subscription.tipePaket === 'gratis') {
      await subscription.reload();
      remainingScans = Math.max(0, subscription.batasScanHarian - subscription.jumlahScanHariIni);
    }

    res.json({
      success: true,
      message: 'Scan berhasil!',
      data: {
        id: scanRecord.id,
        value: detection.value,
        valueFormatted: 'Rp ' + detection.value.toLocaleString('id-ID'),
        currency: detection.currency,
        text: detection.text,
        confidence: detection.confidence,
        remainingScans
      }
    });
  } catch (error) {
    console.error('Scan currency error:', error);
    
    // Try to delete the uploaded file on error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {}
    }
    
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memproses gambar.'
    });
  }
};

/**
 * Start calculation session
 */
const startCalculationSession = async (req, res) => {
  try {
    const session = await CalculationSession.create({
      userId: req.user.id,
      totalMoney: 0,
      totalBanknotes: 0,
      currency: 'IDR',
      denominationBreakdown: {
        totalMoney: 0,
        denominations: []
      }
    });

    res.status(201).json({
      success: true,
      message: 'Sesi perhitungan dimulai. Silakan mulai scan uang satu per satu.',
      data: {
        sessionId: session.id,
        totalMoney: 0,
        totalFormatted: 'Rp 0',
        totalText: 'nol rupiah',
        totalBanknotes: 0,
        currency: 'IDR',
        denominationBreakdown: {
          totalMoney: 0,
          denominations: []
        }
      }
    });
  } catch (error) {
    console.error('Start calculation session error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memulai sesi perhitungan.'
    });
  }
};

/**
 * Add scan to calculation session
 * Image is analyzed by AI then deleted - only data is stored
 */
const addToCalculation = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Gambar tidak ditemukan. Silakan upload gambar uang.'
      });
    }

    // Find session
    const session = await CalculationSession.findOne({
      where: {
        id: sessionId,
        userId: req.user.id,
        isCompleted: false
      }
    });

    if (!session) {
      // Delete uploaded file
      try { fs.unlinkSync(req.file.path); } catch (e) {}
      
      return res.status(404).json({
        success: false,
        message: 'Sesi perhitungan tidak ditemukan atau sudah selesai.'
      });
    }

    // Detect currency using Gemini AI (image will be deleted after processing)
    const detection = await detectCurrency(req.file.path);

    // Check if detection was successful
    if (detection.value === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak dapat mendeteksi uang. Pastikan gambar jelas dan uang terlihat dengan baik.'
      });
    }

    // Update scan counter for free users
    const subscription = req.user.subscription;
    if (subscription && subscription.tipePaket === 'gratis') {
      await subscription.increment('jumlahScanHariIni');
    }

    // Save scan to ScanHistory with session reference
    await ScanHistory.create({
      userId: req.user.id,
      nilaiUang: detection.value,
      confidence: detection.confidence,
      sessionId: sessionId,
      tipeOperasi: 'hitung_jumlah'
    });

    // Update session data
    const newTotalMoney = parseInt(session.totalMoney) + detection.value;
    const newTotalBanknotes = session.totalBanknotes + 1;
    
    // Update denomination breakdown
    const breakdown = session.denominationBreakdown || { totalMoney: 0, denominations: [] };
    
    // Find existing denomination or add new one
    const existingDenom = breakdown.denominations.find(d => d.value === detection.value);
    if (existingDenom) {
      existingDenom.count += 1;
    } else {
      breakdown.denominations.push({
        value: detection.value,
        count: 1,
        text: detection.text,
        timestamp: new Date().toISOString()
      });
    }
    
    // Sort denominations by value (descending)
    breakdown.denominations.sort((a, b) => b.value - a.value);
    breakdown.totalMoney = newTotalMoney;

    await session.update({
      totalMoney: newTotalMoney,
      totalBanknotes: newTotalBanknotes,
      denominationBreakdown: breakdown
    });

    // Calculate remaining scans
    let remainingScans = null;
    if (subscription && subscription.tipePaket === 'gratis') {
      await subscription.reload();
      remainingScans = Math.max(0, subscription.batasScanHarian - subscription.jumlahScanHariIni);
    }

    res.json({
      success: true,
      message: 'Uang berhasil ditambahkan!',
      data: {
        scannedValue: detection.value,
        scannedText: detection.text,
        scannedFormatted: 'Rp ' + detection.value.toLocaleString('id-ID'),
        totalMoney: newTotalMoney,
        totalFormatted: 'Rp ' + newTotalMoney.toLocaleString('id-ID'),
        totalText: numberToIndonesianText(newTotalMoney),
        totalBanknotes: newTotalBanknotes,
        currency: 'IDR',
        confidence: detection.confidence,
        remainingScans,
        denominationBreakdown: breakdown
      }
    });
  } catch (error) {
    console.error('Add to calculation error:', error);
    
    // Try to delete the uploaded file on error
    if (req.file && req.file.path) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memproses gambar.'
    });
  }
};

/**
 * Finish calculation session
 */
const finishCalculation = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { note } = req.body;

    const session = await CalculationSession.findOne({
      where: {
        id: sessionId,
        userId: req.user.id
      }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Sesi perhitungan tidak ditemukan.'
      });
    }

    await session.update({
      isCompleted: true,
      note: note || null,
      completedAt: new Date()
    });

    const breakdown = session.denominationBreakdown || { totalMoney: 0, denominations: [] };

    res.json({
      success: true,
      message: 'Sesi perhitungan selesai!',
      data: {
        sessionId: session.id,
        totalMoney: parseInt(session.totalMoney),
        totalFormatted: 'Rp ' + parseInt(session.totalMoney).toLocaleString('id-ID'),
        totalText: numberToIndonesianText(parseInt(session.totalMoney)),
        totalBanknotes: session.totalBanknotes,
        currency: session.currency,
        denominationBreakdown: breakdown,
        note: session.note,
        createdAt: session.createdAt,
        completedAt: session.completedAt
      }
    });
  } catch (error) {
    console.error('Finish calculation error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menyelesaikan perhitungan.'
    });
  }
};

/**
 * Get current session info
 */
const getSessionInfo = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await CalculationSession.findOne({
      where: {
        id: sessionId,
        userId: req.user.id
      }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Sesi tidak ditemukan.'
      });
    }

    const breakdown = session.denominationBreakdown || { totalMoney: 0, denominations: [] };

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        totalMoney: parseInt(session.totalMoney),
        totalFormatted: 'Rp ' + parseInt(session.totalMoney).toLocaleString('id-ID'),
        totalText: numberToIndonesianText(parseInt(session.totalMoney)),
        totalBanknotes: session.totalBanknotes,
        currency: session.currency,
        isCompleted: session.isCompleted,
        denominationBreakdown: breakdown,
        note: session.note,
        createdAt: session.createdAt,
        completedAt: session.completedAt
      }
    });
  } catch (error) {
    console.error('Get session info error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil informasi sesi.'
    });
  }
};

/**
 * Get scan history from PostgreSQL (ScanHistory table)
 */
const getScanHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: scans } = await ScanHistory.findAndCountAll({
      where: { 
        userId: req.user.id,
        tipeOperasi: 'scan_tunggal'
      },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    // Currency text mapping
    const currencyTextMap = {
      1000: 'seribu rupiah',
      2000: 'dua ribu rupiah',
      5000: 'lima ribu rupiah',
      10000: 'sepuluh ribu rupiah',
      20000: 'dua puluh ribu rupiah',
      50000: 'lima puluh ribu rupiah',
      100000: 'seratus ribu rupiah'
    };

    res.json({
      success: true,
      data: {
        scans: scans.map(scan => ({
          id: scan.id,
          value: scan.nilaiUang,
          valueFormatted: 'Rp ' + scan.nilaiUang.toLocaleString('id-ID'),
          currency: 'IDR',
          text: currencyTextMap[scan.nilaiUang] || (scan.nilaiUang + ' rupiah'),
          confidence: parseFloat(scan.confidence) || 0,
          type: 'single_scan',
          timestamp: scan.createdAt
        })),
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get scan history error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil riwayat scan.'
    });
  }
};

/**
 * Get calculation sessions history from PostgreSQL
 */
const getCalculationHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: sessions } = await CalculationSession.findAndCountAll({
      where: { 
        userId: req.user.id,
        isCompleted: true
      },
      order: [['completed_at', 'DESC'], ['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        sessions: sessions.map(session => {
          const breakdown = session.denominationBreakdown || { totalMoney: 0, denominations: [] };

          return {
            id: session.id,
            totalMoney: parseInt(session.totalMoney),
            totalFormatted: 'Rp ' + parseInt(session.totalMoney).toLocaleString('id-ID'),
            totalText: numberToIndonesianText(parseInt(session.totalMoney)),
            totalBanknotes: session.totalBanknotes,
            currency: session.currency,
            denominationBreakdown: breakdown,
            isCompleted: session.isCompleted,
            note: session.note,
            createdAt: session.createdAt,
            completedAt: session.completedAt
          };
        }),
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get calculation history error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil riwayat perhitungan.'
    });
  }
};

module.exports = {
  scanCurrency,
  startCalculationSession,
  addToCalculation,
  finishCalculation,
  getSessionInfo,
  getScanHistory,
  getCalculationHistory
};
