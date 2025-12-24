const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const ScanHistory = sequelize.define('ScanHistory', {
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
  nilaiUang: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'nilai_uang',
    validate: {
      isIn: {
        args: [[1000, 2000, 5000, 10000, 20000, 50000, 100000]],
        msg: 'Nilai uang tidak valid'
      }
    }
  },
  confidence: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Tingkat kepercayaan hasil scan dalam persen'
  },
  imagePath: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'image_path'
  },
  sessionId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'session_id',
    comment: 'ID sesi untuk mengelompokkan scan dalam mode hitung'
  },
  tipeOperasi: {
    type: DataTypes.ENUM('scan_tunggal', 'hitung_jumlah'),
    defaultValue: 'scan_tunggal',
    field: 'tipe_operasi'
  }
}, {
  tableName: 'scan_histories',
  timestamps: true,
  underscored: true
});

module.exports = ScanHistory;
