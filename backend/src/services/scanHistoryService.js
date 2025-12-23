const { getRedis, SCAN_HISTORY_TTL } = require('../config/redis');
const { v4: uuidv4 } = require('uuid');

/**
 * Service untuk mengelola riwayat scan tunggal dengan Redis Cloud
 * Data disimpan selama 30 hari
 * No image storage - only scan data
 */

const SCAN_HISTORY_PREFIX = 'scan_history:';
const USER_SCANS_PREFIX = 'user_scans:';

/**
 * Simpan hasil scan tunggal ke Redis Cloud
 * Only stores: value, currency, timestamp (no images)
 */
const saveScanToRedis = async (userId, scanData) => {
  try {
    const redis = getRedis();
    
    const scanId = uuidv4();
    const timestamp = new Date().toISOString();
    
    // Only store essential data - no image paths
    const scanRecord = {
      id: scanId,
      userId,
      value: scanData.value,
      valueFormatted: `Rp ${scanData.value.toLocaleString('id-ID')}`,
      currency: scanData.currency || 'IDR',
      text: scanData.text,
      confidence: scanData.confidence,
      timestamp: timestamp,
      type: 'single_scan'
    };

    // Simpan data scan
    const scanKey = `${SCAN_HISTORY_PREFIX}${scanId}`;
    await redis.setex(scanKey, SCAN_HISTORY_TTL, JSON.stringify(scanRecord));

    // Tambahkan ke list scan user (sorted set dengan timestamp sebagai score)
    const userScansKey = `${USER_SCANS_PREFIX}${userId}`;
    await redis.zadd(userScansKey, Date.now(), scanId);
    
    // Set TTL untuk user scans key
    await redis.expire(userScansKey, SCAN_HISTORY_TTL);

    console.log(`Scan saved to Redis Cloud: ${scanId}`);
    return scanRecord;
  } catch (error) {
    console.error('Error saving scan to Redis Cloud:', error);
    return null;
  }
};

/**
 * Ambil riwayat scan tunggal dari Redis Cloud
 */
const getScanHistoryFromRedis = async (userId, page = 1, limit = 20) => {
  try {
    const redis = getRedis();
    
    const userScansKey = `${USER_SCANS_PREFIX}${userId}`;
    
    // Hitung total scan
    const total = await redis.zcard(userScansKey);
    
    // Ambil scan IDs dengan pagination (urut dari yang terbaru)
    const start = (page - 1) * limit;
    const end = start + limit - 1;
    const scanIds = await redis.zrevrange(userScansKey, start, end);

    if (scanIds.length === 0) {
      return { scans: [], total };
    }

    // Ambil data scan
    const scans = [];
    for (const scanId of scanIds) {
      const scanKey = `${SCAN_HISTORY_PREFIX}${scanId}`;
      const scanData = await redis.get(scanKey);
      
      if (scanData) {
        scans.push(JSON.parse(scanData));
      } else {
        // Hapus scan ID yang sudah expired dari sorted set
        await redis.zrem(userScansKey, scanId);
      }
    }

    return { scans, total };
  } catch (error) {
    console.error('Error getting scan history from Redis Cloud:', error);
    return { scans: [], total: 0 };
  }
};

/**
 * Ambil satu scan berdasarkan ID
 */
const getScanById = async (scanId) => {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const scanKey = `${SCAN_HISTORY_PREFIX}${scanId}`;
    const scanData = await redis.get(scanKey);
    
    return scanData ? JSON.parse(scanData) : null;
  } catch (error) {
    console.error('Error getting scan by ID:', error);
    return null;
  }
};

/**
 * Hapus scan dari Redis
 */
const deleteScan = async (userId, scanId) => {
  const redis = getRedis();
  if (!redis) return false;

  try {
    const scanKey = `${SCAN_HISTORY_PREFIX}${scanId}`;
    const userScansKey = `${USER_SCANS_PREFIX}${userId}`;
    
    await redis.del(scanKey);
    await redis.zrem(userScansKey, scanId);
    
    return true;
  } catch (error) {
    console.error('Error deleting scan:', error);
    return false;
  }
};

/**
 * Bersihkan scan yang sudah expired
 */
const cleanupExpiredScans = async (userId) => {
  const redis = getRedis();
  if (!redis) return;

  try {
    const userScansKey = `${USER_SCANS_PREFIX}${userId}`;
    const scanIds = await redis.zrange(userScansKey, 0, -1);
    
    for (const scanId of scanIds) {
      const scanKey = `${SCAN_HISTORY_PREFIX}${scanId}`;
      const exists = await redis.exists(scanKey);
      
      if (!exists) {
        await redis.zrem(userScansKey, scanId);
      }
    }
  } catch (error) {
    console.error('Error cleaning up expired scans:', error);
  }
};

module.exports = {
  saveScanToRedis,
  getScanHistoryFromRedis,
  getScanById,
  deleteScan,
  cleanupExpiredScans
};
