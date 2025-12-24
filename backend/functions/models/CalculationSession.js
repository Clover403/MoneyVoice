const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const CalculationSession = sequelize.define('CalculationSession', {
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
  // Total money value
  totalMoney: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    field: 'total_money'
  },
  // Number of banknotes scanned
  totalBanknotes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_banknotes',
    comment: 'Total number of banknotes scanned'
  },
  // Currency type
  currency: {
    type: DataTypes.STRING(10),
    defaultValue: 'IDR',
    field: 'currency'
  },
  // Denomination breakdown in JSON format
  // Example: { totalMoney: 6000, denominations: [{ value: 1000, count: 1 }, { value: 5000, count: 1 }] }
  denominationBreakdown: {
    type: DataTypes.JSONB,
    defaultValue: { totalMoney: 0, denominations: [] },
    field: 'denomination_breakdown',
    comment: 'Breakdown of denominations'
  },
  isCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_completed'
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'note'
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'completed_at'
  }
}, {
  tableName: 'calculation_sessions',
  timestamps: true,
  underscored: true
});

module.exports = CalculationSession;
