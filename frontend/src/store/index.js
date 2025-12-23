import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      subscription: null,

      setAuth: (user, token) => {
        set({
          user,
          token,
          isAuthenticated: true,
          subscription: user?.subscription || null
        });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          subscription: null
        });
      },

      updateUser: (userData) => {
        set((state) => ({
          user: { ...state.user, ...userData }
        }));
      },

      updateSubscription: (subscriptionData) => {
        set({ subscription: subscriptionData });
      },

      getToken: () => get().token,
    }),
    {
      name: 'auth-storage',
    }
  )
);

export const useScanStore = create((set, get) => ({
  // Current scan result
  currentScan: null,
  isScanning: false,
  
  // Calculation session
  calculationSession: null,
  calculationScans: [],
  calculationTotal: 0,
  isCalculationMode: false,

  // Actions
  setCurrentScan: (scan) => set({ currentScan: scan }),
  setIsScanning: (isScanning) => set({ isScanning }),
  
  clearCurrentScan: () => set({ currentScan: null }),

  // Calculation mode actions
  startCalculationMode: (session) => {
    set({
      isCalculationMode: true,
      calculationSession: session,
      calculationScans: [],
      calculationTotal: 0
    });
  },

  addToCalculation: (scan, total) => {
    set((state) => ({
      calculationScans: [...state.calculationScans, scan],
      calculationTotal: total
    }));
  },

  finishCalculation: () => {
    set({
      isCalculationMode: false,
      calculationSession: null,
      calculationScans: [],
      calculationTotal: 0
    });
  },

  resetCalculation: () => {
    set({
      calculationScans: [],
      calculationTotal: 0
    });
  }
}));

export const useUIStore = create((set) => ({
  isSpeaking: false,
  voiceEnabled: true,
  speechRate: 1,
  
  setIsSpeaking: (isSpeaking) => set({ isSpeaking }),
  toggleVoice: () => set((state) => ({ voiceEnabled: !state.voiceEnabled })),
  setSpeechRate: (rate) => set({ speechRate: rate }),
}));
