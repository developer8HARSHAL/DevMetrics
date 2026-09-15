import axios from "axios";
import { getApiKey } from "./auth";

const api = axios.create({
  baseURL: (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(
    /\/$/,
    ""
  ),
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60000,
});

api.interceptors.request.use(
  (config) => {
    const apiKey = getApiKey();

    if (apiKey) {
      config.headers["x-api-key"] = apiKey;
    }

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

export default api;

export function unwrapData(response) {
  return response?.data?.data ?? response?.data;
}