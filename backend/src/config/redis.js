const Redis = require('ioredis');

let redis = null;

const connectRedis = async () => {
  if (redis) return redis;

  try {
    // Use REDIS_URL for Redis Cloud connection
    const redisUrl = process.env.REDIS_URL;
    
    if (redisUrl) {
      // Check if URL uses rediss:// (SSL) or redis:// (no SSL)
      const useSSL = redisUrl.startsWith('rediss://');
      
      const options = {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        connectTimeout: 10000,
        commandTimeout: 5000
      };
      
      // Only add TLS if using rediss:// protocol
      if (useSSL) {
        options.tls = {
          rejectUnauthorized: false
        };
      }
      
      redis = new Redis(redisUrl, options);
    } else {
      redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true
      });
    }

    redis.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    redis.on('ready', () => {
      console.log('✅ Redis is ready');
    });

    redis.on('error', (err) => {
      console.error('❌ Redis connection error:', err.message);
    });

    // Test connection
    await redis.connect();
    const pong = await redis.ping();
    console.log('✅ Redis PING:', pong);
    
    return redis;
  } catch (error) {
    console.error('❌ Failed to create Redis client:', error);
    return null;
  }
};

const getRedis = () => {
  if (!redis) {
    throw new Error('Redis not initialized. Call connectRedis() first.');
  }
  return redis;
};

// TTL untuk scan history (30 hari dalam detik)
const SCAN_HISTORY_TTL = parseInt(process.env.SCAN_HISTORY_TTL) || 2592000;

module.exports = {
  connectRedis,
  getRedis,
  SCAN_HISTORY_TTL
};
