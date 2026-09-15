import axios from "axios";
import api from "./api";

export const createRun = ({ name, hostname } = {}) =>
  api.post("/sessions", {
    name,
    hostname,
  });

export const endRun = (id) =>
  api.patch(`/sessions/${encodeURIComponent(id)}/end`, {});

export const fetchRuns = () =>
  api.get("/sessions");

export const fetchRun = (id) =>
  api.get(`/sessions/${encodeURIComponent(id)}`);

export const compareRuns = (aId, bId) =>
  api.get("/sessions/compare", {
    params: {
      a: aId,
      b: bId,
    },
  });

export const fetchSharedRun = (token) => {
  const baseURL = (
    import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"
  ).replace(/\/$/, "");

  return axios.get(
    `${baseURL}/sessions/shared/${encodeURIComponent(token)}`,
    {
      timeout: 60000,
    }
  );
};

export const RUNS_GRID_COLS =
  "grid-cols-[minmax(220px,1fr)_72px_64px_96px_96px_88px_20px]";

export const SEVERITY_VARIANT = {
  critical: "destructive",
  warning: "warning",
  info: "info",
};

export function getRunStatus(run) {
  if (!run) return "unknown";

  return (
    run.run_status ||
    (run.ended_at ? "completed" : "running")
  );
}

export function isRunActive(run) {
  return ["queued", "running", "analyzing"].includes(
    getRunStatus(run)
  );
}

export function getRunStatusVariant(statusOrRun) {
  const status =
    typeof statusOrRun === "string"
      ? statusOrRun
      : getRunStatus(statusOrRun);

  if (status === "completed") return "outline";
  if (status === "failed") return "destructive";
  if (status === "cancelled") return "outline";
  if (status === "running") return "primary";
  if (status === "queued") return "warning";
  if (status === "analyzing") return "warning";

  return "warning";
}

export function sortRuns(runs, sort = "newest") {
  return [...runs].sort((a, b) => {
    const aActive = isRunActive(a);
    const bActive = isRunActive(b);

    if (aActive !== bActive) {
      return aActive ? -1 : 1;
    }

    const aTime = new Date(a.started_at).getTime();
    const bTime = new Date(b.started_at).getTime();

    return sort === "newest"
      ? bTime - aTime
      : aTime - bTime;
  });
}