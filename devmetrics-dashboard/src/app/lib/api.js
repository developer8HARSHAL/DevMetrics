import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
    'x-admin-key': process.env.NEXT_PUBLIC_ADMIN_KEY || ''
  },
  timeout: 10000
});

// Request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('Network Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// API Methods
export const fetchOverview = (params = {}) => {
  return api.get('/logs/metrics/overview', { params });
};

export const fetchEndpointMetrics = (params = {}) => {
  return api.get('/logs/metrics/endpoint', { params });
};

export const fetchRecentRequests = (params = {}) => {
  return api.get('/logs/metrics/recent', { params });
};

export const fetchErrors = (params = {}) => {
  return api.get('/logs/metrics/errors', { params });
};

export default api;