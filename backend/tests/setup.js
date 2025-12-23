/**
 * Jest Test Setup
 * Setup dan teardown untuk semua test
 */

require('dotenv').config();

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.JWT_EXPIRES_IN = '1h';

// Mock Redis untuk testing
jest.mock('../src/config/redis', () => ({
  connectRedis: jest.fn().mockResolvedValue(true),
  getRedis: jest.fn().mockReturnValue({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    setex: jest.fn().mockResolvedValue('OK'),
    quit: jest.fn().mockResolvedValue('OK')
  }),
  disconnectRedis: jest.fn().mockResolvedValue(true)
}));

// Global test utilities
global.testUtils = {
  generateTestEmail: () => `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@test.com`,
  generateTestPassword: () => 'TestPassword123!',
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};

// Increase timeout for slow operations
jest.setTimeout(30000);

// Clean up after all tests
afterAll(async () => {
  // Close any open handles
  await new Promise(resolve => setTimeout(resolve, 500));
});
