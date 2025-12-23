/**
 * Unit Tests - Currency Detector
 */

describe('Currency Detector Unit Tests', () => {
  describe('Indonesian Rupiah Detection', () => {
    const INDONESIAN_DENOMINATIONS = [
      { value: 100000, text: 'seratus ribu rupiah' },
      { value: 75000, text: 'tujuh puluh lima ribu rupiah' },
      { value: 50000, text: 'lima puluh ribu rupiah' },
      { value: 20000, text: 'dua puluh ribu rupiah' },
      { value: 10000, text: 'sepuluh ribu rupiah' },
      { value: 5000, text: 'lima ribu rupiah' },
      { value: 2000, text: 'dua ribu rupiah' },
      { value: 1000, text: 'seribu rupiah' }
    ];

    it('should have valid denomination values', () => {
      INDONESIAN_DENOMINATIONS.forEach(denom => {
        expect(denom.value).toBeGreaterThan(0);
        expect(typeof denom.value).toBe('number');
      });
    });

    it('should have text for each denomination', () => {
      INDONESIAN_DENOMINATIONS.forEach(denom => {
        expect(denom.text).toBeDefined();
        expect(typeof denom.text).toBe('string');
        expect(denom.text.length).toBeGreaterThan(0);
      });
    });

    it('should contain rupiah in all text descriptions', () => {
      INDONESIAN_DENOMINATIONS.forEach(denom => {
        expect(denom.text).toContain('rupiah');
      });
    });
  });

  describe('Number to Indonesian Text Conversion', () => {
    const numberToIndonesianText = (value) => {
      if (value === 0) return 'nol rupiah';
      
      const units = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
      
      const convert = (num) => {
        if (num < 12) return units[num];
        if (num < 20) return units[num - 10] + ' belas';
        if (num < 100) return units[Math.floor(num / 10)] + ' puluh' + (num % 10 > 0 ? ' ' + units[num % 10] : '');
        if (num < 200) return 'seratus' + (num % 100 > 0 ? ' ' + convert(num % 100) : '');
        if (num < 1000) return units[Math.floor(num / 100)] + ' ratus' + (num % 100 > 0 ? ' ' + convert(num % 100) : '');
        if (num < 2000) return 'seribu' + (num % 1000 > 0 ? ' ' + convert(num % 1000) : '');
        if (num < 1000000) return convert(Math.floor(num / 1000)) + ' ribu' + (num % 1000 > 0 ? ' ' + convert(num % 1000) : '');
        if (num < 1000000000) return convert(Math.floor(num / 1000000)) + ' juta' + (num % 1000000 > 0 ? ' ' + convert(num % 1000000) : '');
        return convert(Math.floor(num / 1000000000)) + ' miliar' + (num % 1000000000 > 0 ? ' ' + convert(num % 1000000000) : '');
      };
      
      return convert(value) + ' rupiah';
    };

    it('should convert 0 to nol rupiah', () => {
      expect(numberToIndonesianText(0)).toBe('nol rupiah');
    });

    it('should convert 1000 to seribu rupiah', () => {
      expect(numberToIndonesianText(1000)).toBe('seribu rupiah');
    });

    it('should convert 5000 to lima ribu rupiah', () => {
      expect(numberToIndonesianText(5000)).toBe('lima ribu rupiah');
    });

    it('should convert 10000 to sepuluh ribu rupiah', () => {
      expect(numberToIndonesianText(10000)).toBe('sepuluh ribu rupiah');
    });

    it('should convert 50000 to lima puluh ribu rupiah', () => {
      expect(numberToIndonesianText(50000)).toBe('lima puluh ribu rupiah');
    });

    it('should convert 100000 to seratus ribu rupiah', () => {
      expect(numberToIndonesianText(100000)).toBe('seratus ribu rupiah');
    });

    it('should convert complex numbers correctly', () => {
      const result = numberToIndonesianText(125000);
      expect(result).toContain('seratus');
      expect(result).toContain('ribu');
      expect(result).toContain('rupiah');
    });
  });

  describe('Currency Value Formatting', () => {
    const formatCurrency = (value) => {
      return 'Rp ' + value.toLocaleString('id-ID');
    };

    it('should format 1000 correctly', () => {
      expect(formatCurrency(1000)).toBe('Rp 1.000');
    });

    it('should format 50000 correctly', () => {
      expect(formatCurrency(50000)).toBe('Rp 50.000');
    });

    it('should format 100000 correctly', () => {
      expect(formatCurrency(100000)).toBe('Rp 100.000');
    });

    it('should format 1000000 correctly', () => {
      expect(formatCurrency(1000000)).toBe('Rp 1.000.000');
    });

    it('should format large amounts correctly', () => {
      const formatted = formatCurrency(125500000);
      expect(formatted).toBe('Rp 125.500.000');
    });
  });

  describe('Confidence Score Validation', () => {
    it('should accept valid confidence scores', () => {
      const validScores = [0, 0.5, 0.75, 0.9, 1.0];
      
      validScores.forEach(score => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      });
    });

    it('should categorize confidence levels correctly', () => {
      const categorizeConfidence = (score) => {
        if (score >= 0.9) return 'very_high';
        if (score >= 0.75) return 'high';
        if (score >= 0.5) return 'medium';
        return 'low';
      };

      expect(categorizeConfidence(0.95)).toBe('very_high');
      expect(categorizeConfidence(0.85)).toBe('high');
      expect(categorizeConfidence(0.6)).toBe('medium');
      expect(categorizeConfidence(0.3)).toBe('low');
    });
  });

  describe('Detection Response Structure', () => {
    it('should have correct response structure for successful detection', () => {
      const successResponse = {
        value: 50000,
        currency: 'IDR',
        text: 'lima puluh ribu rupiah',
        confidence: 0.95,
        error: null
      };

      expect(successResponse).toHaveProperty('value');
      expect(successResponse).toHaveProperty('currency');
      expect(successResponse).toHaveProperty('text');
      expect(successResponse).toHaveProperty('confidence');
      expect(successResponse.value).toBeGreaterThan(0);
      expect(successResponse.currency).toBe('IDR');
    });

    it('should have correct response structure for failed detection', () => {
      const failedResponse = {
        value: 0,
        currency: null,
        text: null,
        confidence: 0,
        error: 'Tidak dapat mendeteksi uang'
      };

      expect(failedResponse.value).toBe(0);
      expect(failedResponse.error).toBeDefined();
    });
  });
});
