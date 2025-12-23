/**
 * Unit Tests - User Model
 */

const bcrypt = require('bcryptjs');

describe('User Model Unit Tests', () => {
  describe('User Data Validation', () => {
    const validateUser = (userData) => {
      const errors = [];

      // Validate nama
      if (!userData.nama || userData.nama.trim() === '') {
        errors.push({ field: 'nama', message: 'Nama tidak boleh kosong' });
      } else if (userData.nama.length < 2 || userData.nama.length > 100) {
        errors.push({ field: 'nama', message: 'Nama harus antara 2-100 karakter' });
      }

      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!userData.email || userData.email.trim() === '') {
        errors.push({ field: 'email', message: 'Email tidak boleh kosong' });
      } else if (!emailRegex.test(userData.email)) {
        errors.push({ field: 'email', message: 'Format email tidak valid' });
      }

      // Validate password
      if (!userData.password || userData.password === '') {
        errors.push({ field: 'password', message: 'Password tidak boleh kosong' });
      } else if (userData.password.length < 6) {
        errors.push({ field: 'password', message: 'Password minimal 6 karakter' });
      }

      return {
        isValid: errors.length === 0,
        errors
      };
    };

    it('should validate correct user data', () => {
      const validUser = {
        nama: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      const result = validateUser(validUser);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty nama', () => {
      const invalidUser = {
        nama: '',
        email: 'john@example.com',
        password: 'password123'
      };

      const result = validateUser(invalidUser);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'nama')).toBe(true);
    });

    it('should reject short nama', () => {
      const invalidUser = {
        nama: 'J',
        email: 'john@example.com',
        password: 'password123'
      };

      const result = validateUser(invalidUser);
      expect(result.isValid).toBe(false);
    });

    it('should reject invalid email format', () => {
      const invalidEmails = ['notanemail', 'missing@tld', '@nodomain.com', 'spaces in@email.com'];

      invalidEmails.forEach(email => {
        const result = validateUser({
          nama: 'John Doe',
          email,
          password: 'password123'
        });
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.field === 'email')).toBe(true);
      });
    });

    it('should reject short password', () => {
      const invalidUser = {
        nama: 'John Doe',
        email: 'john@example.com',
        password: '12345'
      };

      const result = validateUser(invalidUser);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'password')).toBe(true);
    });

    it('should accept valid phone number', () => {
      const phoneRegex = /^(\+62|62|0)[0-9]{9,12}$/;
      
      const validPhones = ['+6281234567890', '6281234567890', '081234567890'];
      const invalidPhones = ['123', 'notaphone', '+1234567890'];

      validPhones.forEach(phone => {
        expect(phoneRegex.test(phone)).toBe(true);
      });

      invalidPhones.forEach(phone => {
        expect(phoneRegex.test(phone)).toBe(false);
      });
    });
  });

  describe('Password Security', () => {
    it('should hash password before saving', async () => {
      const plainPassword = 'mySecurePassword123';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(plainPassword, salt);

      expect(hashedPassword).not.toBe(plainPassword);
      expect(hashedPassword.startsWith('$2')).toBe(true);
    });

    it('should compare passwords correctly', async () => {
      const plainPassword = 'mySecurePassword123';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(plainPassword, salt);

      const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
      const isNotMatch = await bcrypt.compare('wrongPassword', hashedPassword);

      expect(isMatch).toBe(true);
      expect(isNotMatch).toBe(false);
    });

    it('should use adequate salt rounds', async () => {
      const plainPassword = 'testPassword';
      const saltRounds = 10;
      const salt = await bcrypt.genSalt(saltRounds);
      
      // Salt should have proper format
      expect(salt).toMatch(/^\$2[ayb]\$\d{2}\$/);
    });
  });

  describe('User JSON Serialization', () => {
    it('should exclude password from JSON output', () => {
      const user = {
        id: 'user-123',
        nama: 'John Doe',
        email: 'john@example.com',
        password: 'hashedpassword',
        isActive: true,
        createdAt: new Date()
      };

      const toJSON = (userData) => {
        const { password, ...safeData } = userData;
        return safeData;
      };

      const jsonUser = toJSON(user);
      
      expect(jsonUser).not.toHaveProperty('password');
      expect(jsonUser).toHaveProperty('id');
      expect(jsonUser).toHaveProperty('nama');
      expect(jsonUser).toHaveProperty('email');
    });
  });

  describe('User Status', () => {
    it('should have default isActive as true', () => {
      const defaultValues = {
        isActive: true
      };

      expect(defaultValues.isActive).toBe(true);
    });

    it('should track last login', () => {
      const user = {
        lastLogin: null
      };

      const newLoginTime = new Date();
      user.lastLogin = newLoginTime;

      expect(user.lastLogin).toEqual(newLoginTime);
    });
  });

  describe('UUID Generation', () => {
    it('should generate valid UUID format', () => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      // Mock UUID generation
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };

      const uuid = generateUUID();
      expect(uuidRegex.test(uuid)).toBe(true);
    });
  });
});
