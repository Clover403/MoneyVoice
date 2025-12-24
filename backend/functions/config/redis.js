/**
 * Redis Configuration untuk Firebase Functions
 * 
 * Redis bersifat opsional di Firebase Functions.
 * Jika tidak ada REDIS_URL, fungsi akan berjalan tanpa Redis caching.
 */

let redis = null;

const connectRedis = async () => {
  // Skip Redis di Firebase Functions jika tidak dikonfigurasi
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    console.log('⚠️ Redis tidak dikonfigurasi - berjalan tanpa cache');
    return null;
  }

  try {
    const Redis = require('ioredis');
    
    if (redis) return redis;

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

    redis.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    redis.on('ready', () => {
      console.log('✅ Redis is ready');
    });

    redis.on('error', (err) => {
      console.error('❌ Redis connection error:', err.message);
      // Don't crash the app if Redis fails
    });

    // Test connection
    await redis.connect();
    const pong = await redis.ping();
    console.log('✅ Redis PING:', pong);
    
    return redis;
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
    console.log('⚠️ Melanjutkan tanpa Redis cache...');
    return null;
  }
};

const getRedis = () => redis;

const disconnectRedis = async () => {
  if (redis) {
    try {
      await redis.disconnect();
      redis = null;
      console.log('Redis disconnected');
    } catch (error) {
      console.error('Error disconnecting Redis:', error.message);
    }
  }
};

module.exports = {
  connectRedis,
  getRedis,
  disconnectRedis
};
