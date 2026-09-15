import { createClient } from "@supabase/supabase-js";

const API_KEY_STORAGE = "devmetrics_api_key";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

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

export async function updatePassword(newPassword) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;

  return data;
}