const { Subscription } = require('../models');

// Daftar paket berlangganan
const SUBSCRIPTION_PLANS = {
  gratis: {
    nama: 'Paket Gratis',
    harga: 0,
    batasScanHarian: 10,
    fitur: [
      '10 scan per hari',
      'Scan uang tunggal',
      'Mode hitung uang',
      'Riwayat scan 7 hari'
    ]
  },
  bulanan: {
    nama: 'Paket Bulanan',
    harga: 29000,
    batasScanHarian: -1, // unlimited
    durasiHari: 30,
    fitur: [
      'Unlimited scan',
      'Scan uang tunggal',
      'Mode hitung uang',
      'Riwayat scan tidak terbatas',
      'Dukungan prioritas'
    ]
  },
  tahunan: {
    nama: 'Paket Tahunan',
    harga: 249000,
    batasScanHarian: -1, // unlimited
    durasiHari: 365,
    fitur: [
      'Unlimited scan',
      'Scan uang tunggal',
      'Mode hitung uang',
      'Riwayat scan tidak terbatas',
      'Dukungan prioritas',
      'Hemat 28%'
    ]
  }
};

// Get subscription plans
const getPlans = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        plans: Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => ({
          id: key,
          ...plan,
          hargaFormatted: `Rp ${plan.harga.toLocaleString('id-ID')}`
        }))
      }
    });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil daftar paket.'
    });
  }
};

// Get current subscription
const getCurrentSubscription = async (req, res) => {
  try {
    let subscription = await Subscription.findOne({
      where: { userId: req.user.id }
    });

    if (!subscription) {
      subscription = await Subscription.create({
        userId: req.user.id,
        tipePaket: 'gratis',
        batasScanHarian: 10
      });
    }

    const plan = SUBSCRIPTION_PLANS[subscription.tipePaket];
    const today = new Date().toISOString().split('T')[0];
    
    // Reset scan counter if new day
    if (subscription.tanggalResetScan !== today) {
      await subscription.update({
        jumlahScanHariIni: 0,
        tanggalResetScan: today
      });
      subscription.jumlahScanHariIni = 0;
    }

    const sisaScan = subscription.tipePaket === 'gratis' 
      ? subscription.batasScanHarian - subscription.jumlahScanHariIni
      : -1; // unlimited

    res.json({
      success: true,
      data: {
        subscription: {
          id: subscription.id,
          tipePaket: subscription.tipePaket,
          namaPaket: plan.nama,
          harga: plan.harga,
          hargaFormatted: `Rp ${plan.harga.toLocaleString('id-ID')}`,
          fitur: plan.fitur,
          tanggalMulai: subscription.tanggalMulai,
          tanggalBerakhir: subscription.tanggalBerakhir,
          isActive: subscription.isActive,
          batasScanHarian: subscription.tipePaket === 'gratis' ? subscription.batasScanHarian : 'Unlimited',
          jumlahScanHariIni: subscription.jumlahScanHariIni,
          sisaScan: sisaScan === -1 ? 'Unlimited' : sisaScan
        }
      }
    });
  } catch (error) {
    console.error('Get current subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil informasi langganan.'
    });
  }
};

// Subscribe to a plan (simulasi - dalam implementasi nyata akan integrate dengan payment gateway)
const subscribe = async (req, res) => {
  try {
    const { tipePaket } = req.body;

    if (!tipePaket || !SUBSCRIPTION_PLANS[tipePaket]) {
      return res.status(400).json({
        success: false,
        message: 'Paket tidak valid.'
      });
    }

    if (tipePaket === 'gratis') {
      return res.status(400).json({
        success: false,
        message: 'Anda sudah memiliki paket gratis.'
      });
    }

    const plan = SUBSCRIPTION_PLANS[tipePaket];
    const now = new Date();
    const tanggalBerakhir = new Date(now.getTime() + plan.durasiHari * 24 * 60 * 60 * 1000);

    let subscription = await Subscription.findOne({
      where: { userId: req.user.id }
    });

    if (subscription) {
      await subscription.update({
        tipePaket,
        harga: plan.harga,
        tanggalMulai: now,
        tanggalBerakhir,
        isActive: true,
        batasScanHarian: plan.batasScanHarian
      });
    } else {
      subscription = await Subscription.create({
        userId: req.user.id,
        tipePaket,
        harga: plan.harga,
        tanggalMulai: now,
        tanggalBerakhir,
        isActive: true,
        batasScanHarian: plan.batasScanHarian
      });
    }

    res.json({
      success: true,
      message: `Berhasil berlangganan ${plan.nama}!`,
      data: {
        subscription: {
          id: subscription.id,
          tipePaket: subscription.tipePaket,
          namaPaket: plan.nama,
          tanggalMulai: subscription.tanggalMulai,
          tanggalBerakhir: subscription.tanggalBerakhir,
          isActive: subscription.isActive
        },
        // Dalam implementasi nyata, ini akan berisi URL payment gateway
        paymentInfo: {
          message: 'Simulasi pembayaran berhasil. Dalam implementasi nyata, Anda akan diarahkan ke payment gateway.',
          amount: plan.harga,
          amountFormatted: `Rp ${plan.harga.toLocaleString('id-ID')}`
        }
      }
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memproses langganan.'
    });
  }
};

// Cancel subscription
const cancelSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      where: { userId: req.user.id }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Langganan tidak ditemukan.'
      });
    }

    if (subscription.tipePaket === 'gratis') {
      return res.status(400).json({
        success: false,
        message: 'Anda menggunakan paket gratis.'
      });
    }

    // Downgrade to free plan
    await subscription.update({
      tipePaket: 'gratis',
      harga: 0,
      tanggalBerakhir: null,
      batasScanHarian: 10
    });

    res.json({
      success: true,
      message: 'Langganan berhasil dibatalkan. Anda sekarang menggunakan paket gratis.'
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat membatalkan langganan.'
    });
  }
};

module.exports = {
  getPlans,
  getCurrentSubscription,
  subscribe,
  cancelSubscription,
  SUBSCRIPTION_PLANS
};
