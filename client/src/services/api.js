// client/src/services/api.js
import axios from 'axios';
import config from '../config';

console.log('🔧 [api] Initializing with base URL:', config.API_BASE_URL);

const api = axios.create({
  baseURL: config.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log('📤 [api] Request:', config.method.toUpperCase(), config.url);
    console.log('📤 [api] Data:', config.data);
    
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('📤 [api] Token added to request');
    }
    return config;
  },
  (error) => {
    console.error('❌ [api] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('📥 [api] Response:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('❌ [api] Response error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

export default api;