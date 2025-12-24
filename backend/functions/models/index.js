const sequelize = require('../config/sequelize');
const User = require('./User');
const Subscription = require('./Subscription');
const ScanHistory = require('./ScanHistory');
const CalculationSession = require('./CalculationSession');

// Define associations
User.hasOne(Subscription, {
  foreignKey: 'userId',
  as: 'subscription',
  onDelete: 'CASCADE'
});
Subscription.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

User.hasMany(ScanHistory, {
  foreignKey: 'userId',
  as: 'scanHistories',
  onDelete: 'CASCADE'
});
ScanHistory.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

User.hasMany(CalculationSession, {
  foreignKey: 'userId',
  as: 'calculationSessions',
  onDelete: 'CASCADE'
});
CalculationSession.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

CalculationSession.hasMany(ScanHistory, {
  foreignKey: 'sessionId',
  as: 'scans'
});
ScanHistory.belongsTo(CalculationSession, {
  foreignKey: 'sessionId',
  as: 'session'
});

// Sync database - hanya cek koneksi, tidak alter table setiap startup
const syncDatabase = async () => {
  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Koneksi database berhasil!');
    
    // Hanya sync() tanpa alter:true untuk production
    // ALTER TABLE hanya dijalankan saat ada perubahan model dan perlu di-apply manual
    // atau gunakan migrations untuk production
    if (process.env.NODE_ENV === 'development' && process.env.DB_SYNC === 'true') {
      // Hanya sync dengan alter jika DB_SYNC=true di .env
      await sequelize.sync({ alter: true });
      console.log('✅ Sinkronisasi model database berhasil (dengan alter)!');
    } else {
      // Default: hanya cek bahwa tabel ada, tidak ubah struktur
      await sequelize.sync();
      console.log('✅ Database siap!');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Gagal koneksi ke database:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  User,
  Subscription,
  ScanHistory,
  CalculationSession,
  syncDatabase
};
