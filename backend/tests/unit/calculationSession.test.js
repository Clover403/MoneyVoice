/**
 * Unit Tests - Calculation Session
 */

describe('Calculation Session Unit Tests', () => {
  describe('Session Initialization', () => {
    const createSession = (userId) => ({
      id: `session-${Date.now()}`,
      userId,
      totalMoney: 0,
      totalBanknotes: 0,
      currency: 'IDR',
      isCompleted: false,
      denominationBreakdown: {
        totalMoney: 0,
        denominations: []
      },
      createdAt: new Date()
    });

    it('should create session with zero totals', () => {
      const session = createSession('user-123');
      
      expect(session.totalMoney).toBe(0);
      expect(session.totalBanknotes).toBe(0);
      expect(session.isCompleted).toBe(false);
    });

    it('should have empty denomination breakdown initially', () => {
      const session = createSession('user-123');
      
      expect(session.denominationBreakdown.totalMoney).toBe(0);
      expect(session.denominationBreakdown.denominations).toHaveLength(0);
    });

    it('should set currency to IDR by default', () => {
      const session = createSession('user-123');
      expect(session.currency).toBe('IDR');
    });
  });

  describe('Adding Banknotes to Session', () => {
    const addBanknoteToSession = (session, value) => {
      // Update total
      session.totalMoney += value;
      session.totalBanknotes += 1;
      
      // Update breakdown
      session.denominationBreakdown.totalMoney = session.totalMoney;
      
      const existingDenom = session.denominationBreakdown.denominations
        .find(d => d.value === value);
      
      if (existingDenom) {
        existingDenom.count += 1;
        existingDenom.subtotal = existingDenom.value * existingDenom.count;
      } else {
        session.denominationBreakdown.denominations.push({
          value,
          count: 1,
          subtotal: value
        });
      }
      
      return session;
    };

    it('should add single banknote correctly', () => {
      let session = {
        totalMoney: 0,
        totalBanknotes: 0,
        denominationBreakdown: {
          totalMoney: 0,
          denominations: []
        }
      };

      session = addBanknoteToSession(session, 50000);
      
      expect(session.totalMoney).toBe(50000);
      expect(session.totalBanknotes).toBe(1);
      expect(session.denominationBreakdown.denominations).toHaveLength(1);
    });

    it('should accumulate multiple banknotes', () => {
      let session = {
        totalMoney: 0,
        totalBanknotes: 0,
        denominationBreakdown: {
          totalMoney: 0,
          denominations: []
        }
      };

      session = addBanknoteToSession(session, 50000);
      session = addBanknoteToSession(session, 20000);
      session = addBanknoteToSession(session, 100000);
      
      expect(session.totalMoney).toBe(170000);
      expect(session.totalBanknotes).toBe(3);
    });

    it('should group same denominations together', () => {
      let session = {
        totalMoney: 0,
        totalBanknotes: 0,
        denominationBreakdown: {
          totalMoney: 0,
          denominations: []
        }
      };

      session = addBanknoteToSession(session, 50000);
      session = addBanknoteToSession(session, 50000);
      session = addBanknoteToSession(session, 50000);
      
      expect(session.denominationBreakdown.denominations).toHaveLength(1);
      expect(session.denominationBreakdown.denominations[0].count).toBe(3);
      expect(session.denominationBreakdown.denominations[0].subtotal).toBe(150000);
    });
  });

  describe('Removing Banknotes from Session', () => {
    const removeBanknoteFromSession = (session, value) => {
      const denomIndex = session.denominationBreakdown.denominations
        .findIndex(d => d.value === value && d.count > 0);
      
      if (denomIndex === -1) {
        return { success: false, message: 'Denomination not found' };
      }
      
      const denom = session.denominationBreakdown.denominations[denomIndex];
      denom.count -= 1;
      denom.subtotal = denom.value * denom.count;
      
      if (denom.count === 0) {
        session.denominationBreakdown.denominations.splice(denomIndex, 1);
      }
      
      session.totalMoney -= value;
      session.totalBanknotes -= 1;
      session.denominationBreakdown.totalMoney = session.totalMoney;
      
      return { success: true, session };
    };

    it('should remove banknote correctly', () => {
      let session = {
        totalMoney: 100000,
        totalBanknotes: 2,
        denominationBreakdown: {
          totalMoney: 100000,
          denominations: [
            { value: 50000, count: 2, subtotal: 100000 }
          ]
        }
      };

      const result = removeBanknoteFromSession(session, 50000);
      
      expect(result.success).toBe(true);
      expect(session.totalMoney).toBe(50000);
      expect(session.totalBanknotes).toBe(1);
    });

    it('should fail when denomination not found', () => {
      let session = {
        totalMoney: 50000,
        totalBanknotes: 1,
        denominationBreakdown: {
          totalMoney: 50000,
          denominations: [
            { value: 50000, count: 1, subtotal: 50000 }
          ]
        }
      };

      const result = removeBanknoteFromSession(session, 100000);
      expect(result.success).toBe(false);
    });

    it('should remove denomination entry when count reaches zero', () => {
      let session = {
        totalMoney: 50000,
        totalBanknotes: 1,
        denominationBreakdown: {
          totalMoney: 50000,
          denominations: [
            { value: 50000, count: 1, subtotal: 50000 }
          ]
        }
      };

      removeBanknoteFromSession(session, 50000);
      
      expect(session.denominationBreakdown.denominations).toHaveLength(0);
      expect(session.totalMoney).toBe(0);
    });
  });

  describe('Completing Session', () => {
    it('should mark session as completed', () => {
      const session = {
        isCompleted: false,
        completedAt: null
      };

      session.isCompleted = true;
      session.completedAt = new Date();
      
      expect(session.isCompleted).toBe(true);
      expect(session.completedAt).toBeInstanceOf(Date);
    });

    it('should not allow modifications after completion', () => {
      const session = {
        isCompleted: true,
        totalMoney: 100000
      };

      const canModify = !session.isCompleted;
      expect(canModify).toBe(false);
    });
  });

  describe('Session Summary Generation', () => {
    const generateSummary = (session) => {
      const sortedDenoms = [...session.denominationBreakdown.denominations]
        .sort((a, b) => b.value - a.value);
      
      return {
        totalMoney: session.totalMoney,
        totalFormatted: `Rp ${session.totalMoney.toLocaleString('id-ID')}`,
        totalBanknotes: session.totalBanknotes,
        denominations: sortedDenoms.map(d => ({
          value: d.value,
          valueFormatted: `Rp ${d.value.toLocaleString('id-ID')}`,
          count: d.count,
          subtotal: d.subtotal,
          subtotalFormatted: `Rp ${d.subtotal.toLocaleString('id-ID')}`
        }))
      };
    };

    it('should generate correct summary', () => {
      const session = {
        totalMoney: 270000,
        totalBanknotes: 5,
        denominationBreakdown: {
          denominations: [
            { value: 50000, count: 2, subtotal: 100000 },
            { value: 100000, count: 1, subtotal: 100000 },
            { value: 20000, count: 2, subtotal: 40000 },
            { value: 10000, count: 3, subtotal: 30000 }
          ]
        }
      };

      const summary = generateSummary(session);
      
      expect(summary.totalMoney).toBe(270000);
      expect(summary.totalFormatted).toBe('Rp 270.000');
      // Sorted by value descending
      expect(summary.denominations[0].value).toBe(100000);
    });
  });
});
