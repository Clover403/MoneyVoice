const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Subscription = sequelize.define('Subscription', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  tipePaket: {
    type: DataTypes.ENUM('gratis', 'bulanan', 'tahunan'),
    defaultValue: 'gratis',
    field: 'tipe_paket'
  },
  harga: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  },
  tanggalMulai: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'tanggal_mulai'
  },
  tanggalBerakhir: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'tanggal_berakhir'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  batasScanHarian: {
    type: DataTypes.INTEGER,
    defaultValue: 10, // User gratis dapat 10 scan per hari
    field: 'batas_scan_harian'
  },
  jumlahScanHariIni: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'jumlah_scan_hari_ini'
  },
  tanggalResetScan: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW,
    field: 'tanggal_reset_scan'
  }
}, {
  tableName: 'subscriptions',
  timestamps: true,
  underscored: true
});

// Method untuk cek apakah subscription masih aktif
Subscription.prototype.isSubscriptionActive = function() {
  if (this.tipePaket === 'gratis') return true;
  if (!this.tanggalBerakhir) return false;
  return new Date() < new Date(this.tanggalBerakhir) && this.isActive;
};

// Method untuk cek apakah masih bisa scan
Subscription.prototype.canScan = function() {
  const today = new Date().toISOString().split('T')[0];
  const resetDate = this.tanggalResetScan;
  
  // Reset counter jika hari baru
  if (today !== resetDate) {
    return true; // Will be reset in the scan process
  }
  
  // Untuk paket berbayar, unlimited scan
  if (this.tipePaket !== 'gratis' && this.isSubscriptionActive()) {
    return true;
  }
  
  // Untuk paket gratis, cek batas harian
  return this.jumlahScanHariIni < this.batasScanHarian;
};

module.exports = Subscription;
