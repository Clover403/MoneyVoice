import axios from 'axios';
import { useAuthStore } from '../store';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (data) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
  
  login: async (data) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },
  
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
  
  updateProfile: async (data) => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },
  
  changePassword: async (data) => {
    const response = await api.put('/auth/change-password', data);
    return response.data;
  },
};

// Scan API
export const scanAPI = {
  scanSingle: async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await api.post('/scan/single', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  startCalculation: async () => {
    const response = await api.post('/scan/calculation/start');
    return response.data;
  },
  
  addToCalculation: async (sessionId, imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await api.post(`/scan/calculation/${sessionId}/add`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  finishCalculation: async (sessionId, catatan) => {
    const response = await api.post(`/scan/calculation/${sessionId}/finish`, { catatan });
    return response.data;
  },
  
  getSessionInfo: async (sessionId) => {
    const response = await api.get(`/scan/calculation/${sessionId}`);
    return response.data;
  },
  
  getScanHistory: async (page = 1, limit = 20) => {
    const response = await api.get(`/scan/history?page=${page}&limit=${limit}`);
    return response.data;
  },
  
  getCalculationHistory: async (page = 1, limit = 10) => {
    const response = await api.get(`/scan/calculation/history?page=${page}&limit=${limit}`);
    return response.data;
  },
};

// Subscription API
export const subscriptionAPI = {
  getPlans: async () => {
    const response = await api.get('/subscription/plans');
    return response.data;
  },
  
  getCurrentSubscription: async () => {
    const response = await api.get('/subscription/current');
    return response.data;
  },
  
  subscribe: async (tipePaket) => {
    const response = await api.post('/subscription/subscribe', { tipePaket });
    return response.data;
  },
  
  cancelSubscription: async () => {
    const response = await api.post('/subscription/cancel');
    return response.data;
  },
};

export default api;
