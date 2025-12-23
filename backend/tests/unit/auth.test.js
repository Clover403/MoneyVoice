/**
 * Unit Tests - Auth Controller
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

describe('Auth Controller Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('JWT Token Generation', () => {
    it('should generate valid JWT token', () => {
      const userId = 'test-user-id-123';
      const token = jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should decode JWT token correctly', () => {
      const userId = 'test-user-id-456';
      const token = jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.userId).toBe(userId);
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        jwt.verify('invalid-token', process.env.JWT_SECRET);
      }).toThrow();
    });

    it('should throw error for expired token', () => {
      const token = jwt.sign(
        { userId: 'test' },
        process.env.JWT_SECRET,
        { expiresIn: '-1s' } // Already expired
      );

      expect(() => {
        jwt.verify(token, process.env.JWT_SECRET);
      }).toThrow();
    });
  });

  describe('Password Hashing', () => {
    it('should hash password correctly', async () => {
      const password = 'TestPassword123';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(50);
    });

    it('should validate correct password', async () => {
      const password = 'TestPassword123';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const isValid = await bcrypt.compare(password, hashedPassword);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123';
      const wrongPassword = 'WrongPassword456';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const isValid = await bcrypt.compare(wrongPassword, hashedPassword);
      expect(isValid).toBe(false);
    });
  });

  describe('User Validation', () => {
    const validateUserData = (userData) => {
      const errors = [];

      if (!userData.nama || userData.nama.trim() === '') {
        errors.push({ field: 'nama', message: 'Nama tidak boleh kosong' });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!userData.email || !emailRegex.test(userData.email)) {
        errors.push({ field: 'email', message: 'Email tidak valid' });
      }

      if (!userData.password || userData.password.length < 6) {
        errors.push({ field: 'password', message: 'Password minimal 6 karakter' });
      }

      return { isValid: errors.length === 0, errors };
    };

    it('should validate correct user data', () => {
      const result = validateUserData({
        nama: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = validateUserData({
        nama: 'John Doe',
        email: 'invalid-email',
        password: 'password123'
      });
      expect(result.isValid).toBe(false);
    });

    it('should reject short password', () => {
      const result = validateUserData({
        nama: 'John Doe',
        email: 'john@example.com',
        password: '12345'
      });
      expect(result.isValid).toBe(false);
    });
  });
});
