import axios from "axios";

const api = axios.create({
  baseURL: (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(/\/$/, ""),
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60000,
});

api.interceptors.request.use(
  (config) => {
    if (import.meta.env.DEV) {
      console.log(
        `API Request: ${config.method?.toUpperCase()} ${config.url}`
      );
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ECONNABORTED") {
      error.message = "Request timeout. Please try again.";
    } else if (!error.response) {
      error.message =
        "Cannot connect to backend. Please check your connection.";
    }

    return Promise.reject(error);
  }
);

// Analytics endpoints use ?apiKey= because that is the current backend contract.
// Do not reuse these methods for /sessions; Run endpoints use x-api-key headers.
export const fetchOverview = (params = {}, apiKey) =>
  api.get("/logs/metrics/overview", {
    params: apiKey ? { ...params, apiKey } : params,
  });

export const fetchEndpointMetrics = (params = {}, apiKey) =>
  api.get("/logs/metrics/endpoint", {
    params: apiKey ? { ...params, apiKey } : params,
  });

export const fetchRecentRequests = (params = {}, apiKey) =>
  api.get("/logs/metrics/recent", {
    params: apiKey ? { ...params, apiKey } : params,
  });

export const fetchErrors = (params = {}, apiKey) =>
  api.get("/logs/metrics/errors", {
    params: apiKey ? { ...params, apiKey } : params,
  });

export default api;
