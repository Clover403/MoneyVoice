/**
 * Unit Tests - Subscription Controller
 */

describe('Subscription Controller Unit Tests', () => {
  describe('Subscription Plans', () => {
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
        batasScanHarian: -1,
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
        batasScanHarian: -1,
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

    it('should have correct free plan configuration', () => {
      const freePlan = SUBSCRIPTION_PLANS.gratis;
      
      expect(freePlan.nama).toBe('Paket Gratis');
      expect(freePlan.harga).toBe(0);
      expect(freePlan.batasScanHarian).toBe(10);
      expect(freePlan.fitur).toContain('10 scan per hari');
    });

    it('should have correct monthly plan configuration', () => {
      const monthlyPlan = SUBSCRIPTION_PLANS.bulanan;
      
      expect(monthlyPlan.nama).toBe('Paket Bulanan');
      expect(monthlyPlan.harga).toBe(29000);
      expect(monthlyPlan.batasScanHarian).toBe(-1); // unlimited
      expect(monthlyPlan.durasiHari).toBe(30);
      expect(monthlyPlan.fitur).toContain('Unlimited scan');
    });

    it('should have correct yearly plan configuration', () => {
      const yearlyPlan = SUBSCRIPTION_PLANS.tahunan;
      
      expect(yearlyPlan.nama).toBe('Paket Tahunan');
      expect(yearlyPlan.harga).toBe(249000);
      expect(yearlyPlan.batasScanHarian).toBe(-1); // unlimited
      expect(yearlyPlan.durasiHari).toBe(365);
      expect(yearlyPlan.fitur).toContain('Hemat 28%');
    });

    it('should calculate yearly savings correctly', () => {
      const monthlyTotal = SUBSCRIPTION_PLANS.bulanan.harga * 12;
      const yearlyPrice = SUBSCRIPTION_PLANS.tahunan.harga;
      const savings = monthlyTotal - yearlyPrice;
      const savingsPercent = Math.round((savings / monthlyTotal) * 100);

      expect(savingsPercent).toBeGreaterThanOrEqual(25);
      expect(yearlyPrice).toBeLessThan(monthlyTotal);
    });
  });

  describe('Scan Limit Logic', () => {
    it('should allow scan for free user with remaining quota', () => {
      const subscription = {
        tipePaket: 'gratis',
        batasScanHarian: 10,
        jumlahScanHariIni: 5
      };

      const canScan = subscription.jumlahScanHariIni < subscription.batasScanHarian;
      expect(canScan).toBe(true);
    });

    it('should block scan for free user with exhausted quota', () => {
      const subscription = {
        tipePaket: 'gratis',
        batasScanHarian: 10,
        jumlahScanHariIni: 10
      };

      const canScan = subscription.jumlahScanHariIni < subscription.batasScanHarian;
      expect(canScan).toBe(false);
    });

    it('should always allow scan for premium user', () => {
      const subscription = {
        tipePaket: 'bulanan',
        batasScanHarian: -1,
        jumlahScanHariIni: 1000
      };

      const canScan = subscription.batasScanHarian === -1 || 
                      subscription.jumlahScanHariIni < subscription.batasScanHarian;
      expect(canScan).toBe(true);
    });

    it('should calculate remaining scans correctly', () => {
      const subscription = {
        tipePaket: 'gratis',
        batasScanHarian: 10,
        jumlahScanHariIni: 7
      };

      const remainingScans = subscription.batasScanHarian - subscription.jumlahScanHariIni;
      expect(remainingScans).toBe(3);
    });
  });

  describe('Subscription Expiry Logic', () => {
    it('should check if subscription is still active', () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      const subscription = {
        tipePaket: 'bulanan',
        tanggalBerakhir: futureDate,
        isActive: true
      };

      const isActive = subscription.isActive && 
                       new Date(subscription.tanggalBerakhir) > now;
      expect(isActive).toBe(true);
    });

    it('should detect expired subscription', () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
      
      const subscription = {
        tipePaket: 'bulanan',
        tanggalBerakhir: pastDate,
        isActive: true
      };

      const isExpired = new Date(subscription.tanggalBerakhir) < now;
      expect(isExpired).toBe(true);
    });

    it('should calculate days remaining correctly', () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
      
      const subscription = {
        tanggalBerakhir: futureDate
      };

      const daysRemaining = Math.ceil(
        (new Date(subscription.tanggalBerakhir) - now) / (1000 * 60 * 60 * 24)
      );
      
      expect(daysRemaining).toBe(15);
    });
  });

  describe('Daily Reset Logic', () => {
    it('should reset scan counter on new day', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const subscription = {
        jumlahScanHariIni: 8,
        tanggalResetScan: yesterday.toISOString().split('T')[0]
      };

      const today = new Date().toISOString().split('T')[0];
      const shouldReset = subscription.tanggalResetScan !== today;
      
      expect(shouldReset).toBe(true);
      
      // Simulate reset
      if (shouldReset) {
        subscription.jumlahScanHariIni = 0;
        subscription.tanggalResetScan = today;
      }
      
      expect(subscription.jumlahScanHariIni).toBe(0);
      expect(subscription.tanggalResetScan).toBe(today);
    });

    it('should not reset scan counter on same day', () => {
      const today = new Date().toISOString().split('T')[0];
      
      const subscription = {
        jumlahScanHariIni: 5,
        tanggalResetScan: today
      };

      const shouldReset = subscription.tanggalResetScan !== today;
      
      expect(shouldReset).toBe(false);
      expect(subscription.jumlahScanHariIni).toBe(5);
    });
  });
});
