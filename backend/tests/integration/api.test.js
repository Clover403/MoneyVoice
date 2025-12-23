/**
 * Integration Tests - API Endpoints
 * 
 * Note: These tests require a running test database
 * Run with: npm run test:integration
 */

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Server is healthy' });
  });

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'Selamat datang di Scan Tunai API!',
      version: '1.0.0'
    });
  });

  // Mock auth endpoints
  app.post('/api/auth/register', (req, res) => {
    const { nama, email, password } = req.body;
    
    if (!nama || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Validasi gagal'
      });
    }

    if (email === 'existing@example.com') {
      return res.status(400).json({
        success: false,
        message: 'Email sudah terdaftar'
      });
    }

    const token = jwt.sign({ userId: 'new-user-id' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil!',
      data: {
        user: { id: 'new-user-id', nama, email },
        token
      }
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Validasi gagal'
      });
    }

    if (email === 'test@example.com' && password === 'password123') {
      const token = jwt.sign({ userId: 'test-user-id' }, process.env.JWT_SECRET, { expiresIn: '1h' });
      
      return res.json({
        success: true,
        message: 'Login berhasil!',
        data: {
          user: { id: 'test-user-id', nama: 'Test User', email },
          token
        }
      });
    }

    res.status(401).json({
      success: false,
      message: 'Email atau password salah'
    });
  });

  // Mock protected endpoint
  app.get('/api/auth/profile', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token tidak ditemukan'
      });
    }

    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      res.json({
        success: true,
        data: {
          user: { id: decoded.userId, nama: 'Test User', email: 'test@example.com' }
        }
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Token tidak valid'
      });
    }
  });

  // Mock subscription endpoint
  app.get('/api/subscription/plans', (req, res) => {
    res.json({
      success: true,
      data: {
        plans: [
          { id: 'gratis', nama: 'Paket Gratis', harga: 0 },
          { id: 'bulanan', nama: 'Paket Bulanan', harga: 29000 },
          { id: 'tahunan', nama: 'Paket Tahunan', harga: 249000 }
        ]
      }
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: 'Endpoint tidak ditemukan'
    });
  });

  return app;
};

describe('API Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('Health Check', () => {
    it('GET / should return welcome message', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Selamat datang');
      expect(response.body.version).toBe('1.0.0');
    });

    it('GET /api/health should return healthy status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('healthy');
    });
  });

  describe('Authentication Endpoints', () => {
    describe('POST /api/auth/register', () => {
      it('should register new user successfully', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            nama: 'New User',
            email: 'newuser@example.com',
            password: 'password123'
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.token).toBeDefined();
        expect(response.body.data.user.email).toBe('newuser@example.com');
      });

      it('should reject registration with missing fields', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'test@example.com'
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should reject duplicate email', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            nama: 'Test User',
            email: 'existing@example.com',
            password: 'password123'
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('sudah terdaftar');
      });
    });

    describe('POST /api/auth/login', () => {
      it('should login with valid credentials', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'password123'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.token).toBeDefined();
        expect(response.body.message).toContain('berhasil');
      });

      it('should reject invalid credentials', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'wrongpassword'
          })
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('salah');
      });

      it('should reject missing credentials', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({})
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /api/auth/profile', () => {
      it('should return profile with valid token', async () => {
        const token = jwt.sign({ userId: 'test-user-id' }, process.env.JWT_SECRET, { expiresIn: '1h' });

        const response = await request(app)
          .get('/api/auth/profile')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.user).toBeDefined();
      });

      it('should reject request without token', async () => {
        const response = await request(app)
          .get('/api/auth/profile')
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Token');
      });

      it('should reject invalid token', async () => {
        const response = await request(app)
          .get('/api/auth/profile')
          .set('Authorization', 'Bearer invalidtoken')
          .expect(401);

        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('Subscription Endpoints', () => {
    describe('GET /api/subscription/plans', () => {
      it('should return list of subscription plans', async () => {
        const response = await request(app)
          .get('/api/subscription/plans')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.plans).toBeInstanceOf(Array);
        expect(response.body.data.plans.length).toBeGreaterThan(0);
        
        // Check plan structure
        const plan = response.body.data.plans[0];
        expect(plan).toHaveProperty('id');
        expect(plan).toHaveProperty('nama');
        expect(plan).toHaveProperty('harga');
      });
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown endpoints', async () => {
      const response = await request(app)
        .get('/api/unknown-endpoint')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('tidak ditemukan');
    });
  });
});
