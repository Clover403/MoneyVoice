const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  nama: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Nama tidak boleh kosong'
      },
      len: {
        args: [2, 100],
        msg: 'Nama harus antara 2-100 karakter'
      }
    }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: {
      msg: 'Email sudah terdaftar'
    },
    validate: {
      isEmail: {
        msg: 'Format email tidak valid'
      },
      notEmpty: {
        msg: 'Email tidak boleh kosong'
      }
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Password tidak boleh kosong'
      },
      len: {
        args: [6, 255],
        msg: 'Password minimal 6 karakter'
      }
    }
  },
  nomorTelepon: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'nomor_telepon'
  },
  fotoProfil: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'foto_profil'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_login'
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Instance method untuk validasi password
User.prototype.validPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Method untuk menghilangkan password dari response
User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password;
  return values;
};

module.exports = User;
