import axios from 'axios';

const api = axios.create({
  baseURL: (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000')
    .replace(/\/$/, ''),
  headers: {
    'Content-Type': 'application/json',
    'x-admin-key': process.env.NEXT_PUBLIC_ADMIN_KEY || ''
  },
  timeout: 60000
});


// Store API key
let userApiKey = null;

// Set API key
export const setApiKey = (key) => {
  userApiKey = key;
  if (typeof window !== 'undefined') {
    localStorage.setItem('devmetrics_api_key', key);
  }
};

// Get stored API key
export const getApiKey = () => {
  if (!userApiKey && typeof window !== 'undefined') {
    userApiKey = localStorage.getItem('devmetrics_api_key');
  }
  return userApiKey;
};

// Clear API key
export const clearApiKey = () => {
  userApiKey = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('devmetrics_api_key');
  }
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      error.message = 'Request timeout. Please try again.';
    } else if (!error.response) {
      error.message = 'Cannot connect to backend. Please check your connection.';
    }
    return Promise.reject(error);
  }
);

// API Methods
export const fetchOverview = (params = {}) => {
  const apiKey = getApiKey();
  return api.get('/logs/metrics/overview', { 
    params: apiKey ? { ...params, apiKey } : params 
  });
};

export const fetchEndpointMetrics = (params = {}) => {
  const apiKey = getApiKey();
  return api.get('/logs/metrics/endpoint', { 
    params: apiKey ? { ...params, apiKey } : params 
  });
};

export const fetchRecentRequests = (params = {}) => {
  const apiKey = getApiKey();
  return api.get('/logs/metrics/recent', { 
    params: apiKey ? { ...params, apiKey } : params 
  });
};

export const fetchErrors = (params = {}) => {
  const apiKey = getApiKey();
  return api.get('/logs/metrics/errors', { 
    params: apiKey ? { ...params, apiKey } : params 
  });
};

// Demo data for when no API key or no real data exists
export const getDemoData = () => ({
  totalRequests: 1247,
  successRate: 94.40,  // Number, not string
  avgResponseTime: 142.50,  // Number, not string
  minResponseTime: 23,
  maxResponseTime: 1580,
  requestsByStatus: [
    { _id: "2xx", count: 1177 },
    { _id: "5xx", count: 70 }
  ],
  requestsByMethod: [
    { _id: "GET", count: 856 },
    { _id: "POST", count: 245 },
    { _id: "PUT", count: 89 },
    { _id: "DELETE", count: 57 }
  ],
  requestsOverTime: [
    { _id: "2025-11-08 10:00", count: 45, avgResponseTime: 120 },
    { _id: "2025-11-08 11:00", count: 67, avgResponseTime: 135 },
    { _id: "2025-11-08 12:00", count: 89, avgResponseTime: 150 },
    { _id: "2025-11-08 13:00", count: 102, avgResponseTime: 145 },
    { _id: "2025-11-08 14:00", count: 95, avgResponseTime: 140 },
    { _id: "2025-11-08 15:00", count: 78, avgResponseTime: 138 },
    { _id: "2025-11-08 16:00", count: 56, avgResponseTime: 142 }
  ]
});

export const getDemoEndpoints = () => [
  {
    endpoint: "/api/users",
    totalRequests: 450,
    avgResponseTime: 125.5,
    minResponseTime: 45,
    maxResponseTime: 890,
    successRate: 96.8,
    errorRate: 3.2,
    methods: ["GET", "POST"]
  },
  {
    endpoint: "/api/posts",
    totalRequests: 320,
    avgResponseTime: 210.3,
    minResponseTime: 67,
    maxResponseTime: 1200,
    successRate: 92.5,
    errorRate: 7.5,
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
];

export default api;
