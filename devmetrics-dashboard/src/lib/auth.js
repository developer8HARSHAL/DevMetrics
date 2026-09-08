import { createClient } from "@supabase/supabase-js";
import api from "./api";

const API_KEY_STORAGE = "devmetrics_api_key";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// -----------------------------------------------------------------------------
// User API key
// -----------------------------------------------------------------------------

let userApiKey = null;

export function setApiKey(key) {
  userApiKey = key;

  if (typeof window !== "undefined") {
    localStorage.setItem(API_KEY_STORAGE, key);
  }
}

export function getApiKey() {
  if (!userApiKey && typeof window !== "undefined") {
    userApiKey = localStorage.getItem(API_KEY_STORAGE);
  }

  return userApiKey;
}

export function clearApiKey() {
  userApiKey = null;

  if (typeof window !== "undefined") {
    localStorage.removeItem(API_KEY_STORAGE);
  }
}

// -----------------------------------------------------------------------------
// Backend auth bootstrap
// -----------------------------------------------------------------------------

export async function registerUser(userId, email) {
  const response = await api.post("/auth/register", {
    userId,
    email,
  });

  return response.data;
}

export async function getUserApiKey(userId) {
  const response = await api.get(`/auth/api-key/${encodeURIComponent(userId)}`);
  return response.data;
}

// -----------------------------------------------------------------------------
// Supabase auth
// -----------------------------------------------------------------------------

export async function signIn(email, password) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(email, password) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase.auth.signUp({ email, password });
}

export async function signOut() {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase.auth.signOut();
}

export async function getAuthUser() {
  if (!supabase) return null;

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;

  return user;
}

// -----------------------------------------------------------------------------
// API-key management
// -----------------------------------------------------------------------------
// These routes currently require x-admin-key.
// VITE_ADMIN_KEY is browser-exposed and should not be treated as a production
// secret. Keep these methods isolated so the transport/security boundary can
// later move server-side without changing page-level code.

function adminHeaders() {
  return {
    "x-admin-key": import.meta.env.VITE_ADMIN_KEY || "",
  };
}

export const createApiKey = ({
  owner,
  description = "",
  rateLimit,
  expiresAt,
}) => {
  const payload = {
    owner,
    description,
  };

  if (rateLimit) payload.rateLimit = rateLimit;
  if (expiresAt !== undefined) payload.expiresAt = expiresAt;

  return api.post("/apikey", payload, {
    headers: adminHeaders(),
  });
};

export const fetchApiKeys = (params = {}) =>
  api.get("/apikey", {
    params,
    headers: adminHeaders(),
  });

export const fetchApiKey = (key) =>
  api.get(`/apikey/${encodeURIComponent(key)}`, {
    headers: adminHeaders(),
  });

export const updateApiKey = (key, payload) =>
  api.put(`/apikey/${encodeURIComponent(key)}`, payload, {
    headers: adminHeaders(),
  });

export const revokeApiKey = (key) =>
  api.delete(`/apikey/${encodeURIComponent(key)}`, {
    headers: adminHeaders(),
  });

export const deleteApiKey = (key) =>
  api.delete(`/apikey/${encodeURIComponent(key)}`, {
    params: { permanent: true },
    headers: adminHeaders(),
  });

export const fetchApiKeyStats = (key, params = {}) =>
  api.get(`/apikey/${encodeURIComponent(key)}/stats`, {
    params,
    headers: adminHeaders(),
  });
