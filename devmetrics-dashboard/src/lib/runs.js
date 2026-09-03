import axios from "axios";

import api from "./api";
import { getApiKey } from "./auth";

// -----------------------------------------------------------------------------
// Run API
// -----------------------------------------------------------------------------

function authHeaders() {
  const apiKey = getApiKey();
  return apiKey ? { "x-api-key": apiKey } : {};
}

export const createRun = ({ name, hostname } = {}) =>
  api.post(
    "/sessions",
    { name, hostname },
    { headers: authHeaders() }
  );

export const endRun = (id) =>
  api.patch(`/sessions/${encodeURIComponent(id)}/end`, {}, {
    headers: authHeaders(),
  });

export const fetchRuns = () =>
  api.get("/sessions", {
    headers: authHeaders(),
  });

export const fetchRun = (id) =>
  api.get(`/sessions/${encodeURIComponent(id)}`, {
    headers: authHeaders(),
  });

export const compareRuns = (aId, bId) =>
  api.get("/sessions/compare", {
    params: { a: aId, b: bId },
    headers: authHeaders(),
  });

// Shared reports are public and must not receive x-api-key.
export const fetchSharedRun = (token) => {
  const baseURL = (
    import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"
  ).replace(/\/$/, "");

  return axios.get(
    `${baseURL}/sessions/shared/${encodeURIComponent(token)}`,
    { timeout: 60000 }
  );
};

// -----------------------------------------------------------------------------
// Run presentation helpers
// -----------------------------------------------------------------------------

export function formatRelativeTime(isoString) {
  if (!isoString) return "—";

  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return "just now";

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return "yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;

  return new Date(isoString).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function formatDuration(ms) {
  if (ms == null) return null;

  const seconds = ms / 1000;

  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }

  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${Math.round(seconds % 60)}s`;
}

export function sortRuns(runs, sort = "newest") {
  return [...runs].sort((a, b) => {
    const aActive = a.ended_at == null;
    const bActive = b.ended_at == null;

    if (aActive !== bActive) {
      return aActive ? -1 : 1;
    }

    const aTime = new Date(a.started_at).getTime();
    const bTime = new Date(b.started_at).getTime();

    return sort === "newest" ? bTime - aTime : aTime - bTime;
  });
}
