const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { User, Subscription } = require('../models');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Validation rules
const registerValidation = [
  body('nama')
    .trim()
    .notEmpty().withMessage('Nama tidak boleh kosong')
    .isLength({ min: 2, max: 100 }).withMessage('Nama harus antara 2-100 karakter'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email tidak boleh kosong')
    .isEmail().withMessage('Format email tidak valid')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password tidak boleh kosong')
    .isLength({ min: 6 }).withMessage('Password minimal 6 karakter')
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email tidak boleh kosong')
    .isEmail().withMessage('Format email tidak valid')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password tidak boleh kosong')
];

// Register
const register = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validasi gagal',
        errors: errors.array()
      });
    }

    const { nama, email, password, nomorTelepon } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah terdaftar. Silakan gunakan email lain.'
      });
    }

    // Create user
    const user = await User.create({
      nama,
      email,
      password,
      nomorTelepon
    });

    // Create free subscription for new user
    await Subscription.create({
      userId: user.id,
      tipePaket: 'gratis',
      batasScanHarian: 10
    });

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil! Selamat datang di Scan Tunai.',
      data: {
        user: user.toJSON(),
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mendaftar. Silakan coba lagi.'
    });
  }
};

// Login
const login = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validasi gagal',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({
      where: { email },
      include: [{
        model: Subscription,
        as: 'subscription'
      }]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah.'
      });
    }

    // Check password
    const isValidPassword = await user.validPassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah.'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Akun Anda telah dinonaktifkan. Hubungi customer service.'
      });
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Generate token
    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login berhasil! Selamat datang kembali.',
      data: {
        user: user.toJSON(),
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat login. Silakan coba lagi.'
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{
        model: Subscription,
        as: 'subscription'
      }]
    });

    res.json({
      success: true,
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil profil.'
    });
  }
};

// Update profile
const updateProfile = async (req, res) => {
  try {
    const { nama, nomorTelepon } = req.body;
    
    const updateData = {};
    if (nama) updateData.nama = nama;
    if (nomorTelepon !== undefined) updateData.nomorTelepon = nomorTelepon;

    await req.user.update(updateData);

    res.json({
      success: true,
      message: 'Profil berhasil diperbarui.',
      data: {
        user: req.user.toJSON()
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui profil.'
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password lama dan password baru harus diisi.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password baru minimal 6 karakter.'
      });
    }

    // Verify current password
    const isValidPassword = await req.user.validPassword(currentPassword);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Password lama tidak sesuai.'
      });
    }

    // Update password
    await req.user.update({ password: newPassword });

    res.json({
      success: true,
      message: 'Password berhasil diubah.'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengubah password.'
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  registerValidation,
  loginValidation
};
