const jwt = require('jsonwebtoken');
const { User, Subscription } = require('../models');

// Middleware untuk verifikasi JWT token
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token tidak ditemukan. Silakan login terlebih dahulu.'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await User.findByPk(decoded.userId, {
        include: [{
          model: Subscription,
          as: 'subscription'
        }]
      });
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User tidak ditemukan.'
        });
      }
      
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Akun Anda telah dinonaktifkan.'
        });
      }
      
      req.user = user;
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token sudah kadaluarsa. Silakan login ulang.'
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Token tidak valid.'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.'
    });
  }
};

// Middleware untuk cek subscription dan batas scan
const checkScanLimit = async (req, res, next) => {
  try {
    const subscription = req.user.subscription;
    
    if (!subscription) {
      // Buat subscription gratis jika belum ada
      const newSubscription = await Subscription.create({
        userId: req.user.id,
        tipePaket: 'gratis',
        batasScanHarian: 10
      });
      req.user.subscription = newSubscription;
    }
    
    const sub = req.user.subscription;
    const today = new Date().toISOString().split('T')[0];
    
    // Reset counter jika hari baru
    if (sub.tanggalResetScan !== today) {
      await sub.update({
        jumlahScanHariIni: 0,
        tanggalResetScan: today
      });
    }
    
    // Cek apakah masih bisa scan
    if (!sub.canScan()) {
      return res.status(429).json({
        success: false,
        message: 'Batas scan harian sudah tercapai. Upgrade ke paket berbayar untuk unlimited scan.',
        data: {
          batasScanHarian: sub.batasScanHarian,
          jumlahScanHariIni: sub.jumlahScanHariIni,
          sisaScan: 0
        }
      });
    }
    
    next();
  } catch (error) {
    console.error('Check scan limit error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.'
    });
  }
};

// Middleware opsional - tidak wajib login
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.userId, {
          include: [{
            model: Subscription,
            as: 'subscription'
          }]
        });
        
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (jwtError) {
        // Ignore JWT errors for optional auth
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  authenticate,
  checkScanLimit,
  optionalAuth
};
