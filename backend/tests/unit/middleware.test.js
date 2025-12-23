/**
 * Unit Tests - Middleware
 */

const jwt = require('jsonwebtoken');

describe('Middleware Unit Tests', () => {
  describe('JWT Authentication Middleware', () => {
    const mockRequest = (authHeader) => ({
      headers: {
        authorization: authHeader
      }
    });

    const mockResponse = () => {
      const res = {};
      res.status = jest.fn().mockReturnValue(res);
      res.json = jest.fn().mockReturnValue(res);
      return res;
    };

    const extractToken = (authHeader) => {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
      }
      return authHeader.split(' ')[1];
    };

    it('should extract token from valid Bearer header', () => {
      const authHeader = 'Bearer validtoken123';
      const token = extractToken(authHeader);
      expect(token).toBe('validtoken123');
    });

    it('should return null for missing header', () => {
      const token = extractToken(undefined);
      expect(token).toBeNull();
    });

    it('should return null for non-Bearer header', () => {
      const token = extractToken('Basic sometoken');
      expect(token).toBeNull();
    });

    it('should verify valid JWT token', () => {
      const userId = 'user-123';
      const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.userId).toBe(userId);
    });

    it('should throw for expired token', () => {
      const token = jwt.sign(
        { userId: 'user-123' },
        process.env.JWT_SECRET,
        { expiresIn: '-1s' }
      );
      
      expect(() => jwt.verify(token, process.env.JWT_SECRET)).toThrow();
    });

    it('should throw for invalid token', () => {
      expect(() => jwt.verify('invalid.token.here', process.env.JWT_SECRET)).toThrow();
    });
  });

  describe('Scan Limit Middleware', () => {
    const checkScanLimit = (subscription) => {
      const today = new Date().toISOString().split('T')[0];
      
      // Reset if new day
      if (subscription.tanggalResetScan !== today) {
        subscription.jumlahScanHariIni = 0;
        subscription.tanggalResetScan = today;
      }
      
      // Check limit
      if (subscription.tipePaket === 'gratis') {
        if (subscription.jumlahScanHariIni >= subscription.batasScanHarian) {
          return {
            allowed: false,
            message: 'Batas scan harian sudah tercapai',
            remaining: 0
          };
        }
        return {
          allowed: true,
          remaining: subscription.batasScanHarian - subscription.jumlahScanHariIni
        };
      }
      
      // Premium users - unlimited
      return {
        allowed: true,
        remaining: -1 // unlimited
      };
    };

    it('should allow scan for user with remaining quota', () => {
      const subscription = {
        tipePaket: 'gratis',
        batasScanHarian: 10,
        jumlahScanHariIni: 5,
        tanggalResetScan: new Date().toISOString().split('T')[0]
      };

      const result = checkScanLimit(subscription);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5);
    });

    it('should block scan for user at limit', () => {
      const subscription = {
        tipePaket: 'gratis',
        batasScanHarian: 10,
        jumlahScanHariIni: 10,
        tanggalResetScan: new Date().toISOString().split('T')[0]
      };

      const result = checkScanLimit(subscription);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should allow unlimited scans for premium users', () => {
      const subscription = {
        tipePaket: 'bulanan',
        batasScanHarian: -1,
        jumlahScanHariIni: 1000,
        tanggalResetScan: new Date().toISOString().split('T')[0]
      };

      const result = checkScanLimit(subscription);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(-1);
    });

    it('should reset counter on new day', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const subscription = {
        tipePaket: 'gratis',
        batasScanHarian: 10,
        jumlahScanHariIni: 10,
        tanggalResetScan: yesterday.toISOString().split('T')[0]
      };

      const result = checkScanLimit(subscription);
      expect(result.allowed).toBe(true);
      expect(subscription.jumlahScanHariIni).toBe(0);
    });
  });

  describe('File Upload Middleware', () => {
    const validateUpload = (file, maxSize = 10485760) => {
      const errors = [];
      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

      if (!file) {
        errors.push('File tidak ditemukan');
        return { valid: false, errors };
      }

      if (file.size > maxSize) {
        errors.push(`File terlalu besar. Maksimal ${maxSize / 1024 / 1024}MB`);
      }

      if (!allowedMimes.includes(file.mimetype)) {
        errors.push('Format file tidak didukung. Gunakan JPG, PNG, atau WebP');
      }

      const ext = file.originalname.toLowerCase().match(/\.[^.]+$/);
      if (!ext || !allowedExtensions.includes(ext[0])) {
        errors.push('Ekstensi file tidak valid');
      }

      return {
        valid: errors.length === 0,
        errors
      };
    };

    it('should accept valid JPEG file', () => {
      const file = {
        originalname: 'image.jpg',
        mimetype: 'image/jpeg',
        size: 1024 * 1024 // 1MB
      };

      const result = validateUpload(file);
      expect(result.valid).toBe(true);
    });

    it('should accept valid PNG file', () => {
      const file = {
        originalname: 'image.png',
        mimetype: 'image/png',
        size: 2 * 1024 * 1024 // 2MB
      };

      const result = validateUpload(file);
      expect(result.valid).toBe(true);
    });

    it('should reject file that is too large', () => {
      const file = {
        originalname: 'large.jpg',
        mimetype: 'image/jpeg',
        size: 15 * 1024 * 1024 // 15MB
      };

      const result = validateUpload(file);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('terlalu besar'))).toBe(true);
    });

    it('should reject unsupported mime type', () => {
      const file = {
        originalname: 'document.pdf',
        mimetype: 'application/pdf',
        size: 1024 * 1024
      };

      const result = validateUpload(file);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Format file'))).toBe(true);
    });

    it('should reject missing file', () => {
      const result = validateUpload(null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('File tidak ditemukan');
    });
  });

  describe('Request Validation', () => {
    const validateEmail = (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    const validatePassword = (password) => {
      if (!password || typeof password !== 'string') return false;
      return password.length >= 6;
    };

    it('should validate correct email format', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.id')).toBe(true);
    });

    it('should reject invalid email format', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('missing@tld')).toBe(false);
      expect(validateEmail('@nodomain.com')).toBe(false);
    });

    it('should validate password length', () => {
      expect(validatePassword('123456')).toBe(true);
      expect(validatePassword('longpassword123')).toBe(true);
    });

    it('should reject short password', () => {
      expect(validatePassword('12345')).toBe(false);
      expect(validatePassword('')).toBe(false);
      expect(validatePassword(null)).toBe(false);
    });
  });
});
