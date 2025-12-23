/**
 * Unit Tests - Scan History
 */

describe('Scan History Unit Tests', () => {
  describe('Scan History Record', () => {
    const createScanRecord = (data) => ({
      id: `scan-${Date.now()}`,
      userId: data.userId,
      sessionId: data.sessionId || null,
      nilaiUang: data.nilaiUang,
      confidence: data.confidence || 0.95,
      tipeOperasi: data.tipeOperasi || 'scan_tunggal',
      createdAt: new Date()
    });

    it('should create scan record with correct data', () => {
      const record = createScanRecord({
        userId: 'user-123',
        nilaiUang: 50000,
        confidence: 0.98
      });

      expect(record.userId).toBe('user-123');
      expect(record.nilaiUang).toBe(50000);
      expect(record.confidence).toBe(0.98);
      expect(record.tipeOperasi).toBe('scan_tunggal');
    });

    it('should associate with session when provided', () => {
      const record = createScanRecord({
        userId: 'user-123',
        sessionId: 'session-456',
        nilaiUang: 100000,
        tipeOperasi: 'hitung'
      });

      expect(record.sessionId).toBe('session-456');
      expect(record.tipeOperasi).toBe('hitung');
    });
  });

  describe('Scan Statistics', () => {
    const calculateStats = (scans) => {
      if (!scans || scans.length === 0) {
        return {
          totalScans: 0,
          totalValue: 0,
          averageValue: 0,
          mostScannedDenomination: null
        };
      }

      const totalValue = scans.reduce((sum, s) => sum + s.nilaiUang, 0);
      
      // Count denominations
      const denomCounts = {};
      scans.forEach(s => {
        denomCounts[s.nilaiUang] = (denomCounts[s.nilaiUang] || 0) + 1;
      });

      // Find most scanned
      let mostScanned = null;
      let maxCount = 0;
      for (const [value, count] of Object.entries(denomCounts)) {
        if (count > maxCount) {
          maxCount = count;
          mostScanned = parseInt(value);
        }
      }

      return {
        totalScans: scans.length,
        totalValue,
        averageValue: Math.round(totalValue / scans.length),
        mostScannedDenomination: mostScanned
      };
    };

    it('should calculate stats for empty array', () => {
      const stats = calculateStats([]);
      
      expect(stats.totalScans).toBe(0);
      expect(stats.totalValue).toBe(0);
      expect(stats.mostScannedDenomination).toBeNull();
    });

    it('should calculate correct total value', () => {
      const scans = [
        { nilaiUang: 50000 },
        { nilaiUang: 20000 },
        { nilaiUang: 100000 }
      ];

      const stats = calculateStats(scans);
      
      expect(stats.totalScans).toBe(3);
      expect(stats.totalValue).toBe(170000);
    });

    it('should find most scanned denomination', () => {
      const scans = [
        { nilaiUang: 50000 },
        { nilaiUang: 50000 },
        { nilaiUang: 50000 },
        { nilaiUang: 20000 },
        { nilaiUang: 100000 }
      ];

      const stats = calculateStats(scans);
      expect(stats.mostScannedDenomination).toBe(50000);
    });

    it('should calculate correct average', () => {
      const scans = [
        { nilaiUang: 50000 },
        { nilaiUang: 100000 }
      ];

      const stats = calculateStats(scans);
      expect(stats.averageValue).toBe(75000);
    });
  });

  describe('History Filtering', () => {
    const filterByDate = (scans, startDate, endDate) => {
      return scans.filter(scan => {
        const scanDate = new Date(scan.createdAt);
        return scanDate >= startDate && scanDate <= endDate;
      });
    };

    const filterByOperation = (scans, operationType) => {
      return scans.filter(scan => scan.tipeOperasi === operationType);
    };

    it('should filter by date range', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const scans = [
        { nilaiUang: 50000, createdAt: today },
        { nilaiUang: 20000, createdAt: yesterday },
        { nilaiUang: 100000, createdAt: twoDaysAgo }
      ];

      const filtered = filterByDate(scans, yesterday, today);
      expect(filtered.length).toBe(2);
    });

    it('should filter by operation type', () => {
      const scans = [
        { nilaiUang: 50000, tipeOperasi: 'scan_tunggal' },
        { nilaiUang: 20000, tipeOperasi: 'hitung' },
        { nilaiUang: 100000, tipeOperasi: 'scan_tunggal' }
      ];

      const filtered = filterByOperation(scans, 'scan_tunggal');
      expect(filtered.length).toBe(2);
    });
  });

  describe('History Pagination', () => {
    const paginate = (items, page, limit) => {
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      
      return {
        data: items.slice(startIndex, endIndex),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(items.length / limit),
          totalItems: items.length,
          itemsPerPage: limit,
          hasNextPage: endIndex < items.length,
          hasPrevPage: page > 1
        }
      };
    };

    it('should paginate correctly', () => {
      const items = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }));
      
      const page1 = paginate(items, 1, 10);
      expect(page1.data.length).toBe(10);
      expect(page1.pagination.totalPages).toBe(3);
      expect(page1.pagination.hasNextPage).toBe(true);
      expect(page1.pagination.hasPrevPage).toBe(false);

      const page2 = paginate(items, 2, 10);
      expect(page2.data.length).toBe(10);
      expect(page2.pagination.hasNextPage).toBe(true);
      expect(page2.pagination.hasPrevPage).toBe(true);

      const page3 = paginate(items, 3, 10);
      expect(page3.data.length).toBe(5);
      expect(page3.pagination.hasNextPage).toBe(false);
      expect(page3.pagination.hasPrevPage).toBe(true);
    });
  });

  describe('History Grouping', () => {
    const groupByDate = (scans) => {
      const groups = {};
      
      scans.forEach(scan => {
        const date = new Date(scan.createdAt).toISOString().split('T')[0];
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(scan);
      });

      return Object.entries(groups).map(([date, items]) => ({
        date,
        scans: items,
        totalValue: items.reduce((sum, s) => sum + s.nilaiUang, 0),
        count: items.length
      })).sort((a, b) => new Date(b.date) - new Date(a.date));
    };

    it('should group scans by date', () => {
      const today = new Date().toISOString();
      const yesterday = new Date(Date.now() - 86400000).toISOString();

      const scans = [
        { nilaiUang: 50000, createdAt: today },
        { nilaiUang: 20000, createdAt: today },
        { nilaiUang: 100000, createdAt: yesterday }
      ];

      const grouped = groupByDate(scans);
      
      expect(grouped.length).toBe(2);
      expect(grouped[0].count).toBe(2); // Today
      expect(grouped[0].totalValue).toBe(70000);
    });
  });
});
