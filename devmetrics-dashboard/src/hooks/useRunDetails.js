import { useCallback, useEffect, useRef, useState } from "react";
import { fetchRun } from "../lib/runs";
import { unwrapData } from "../lib/api";

export function useRunDetails(id) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pollingError, setPollingError] = useState(null);
  const requestInFlightRef = useRef(false);

  const loadRun = useCallback(async () => {
    if (requestInFlightRef.current) return;

    requestInFlightRef.current = true;

    try {
      setLoading(true);
      setError(null);
      setPollingError(null);
      const response = await fetchRun(id);
      setData(response.data);
    } catch (err) {
      setError(err?.message || "Failed to load Run.");
    } finally {
      requestInFlightRef.current = false;
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadRun();
  }, [loadRun]);

  // unwrapData handles both {data:{data:{...}}} and {data:{...}} response
  // shapes, reused here instead of hardcoding the .data.data chain.
  const session = unwrapData({ data })?.session;
  const runStatus =
    session?.run_status || (session?.ended_at ? "completed" : "running");

  useEffect(() => {
    if (!session || !["queued", "running", "analyzing"].includes(runStatus)) {
      return;
    }

    let cancelled = false;

    const poll = async () => {
      if (cancelled || requestInFlightRef.current) return;

      requestInFlightRef.current = true;

      try {
        const response = await fetchRun(id);
        if (!cancelled) {
          setData(response.data);
          setPollingError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setPollingError(err?.message || "Failed to refresh Run.");
        }
      } finally {
        requestInFlightRef.current = false;
      }
    };

    const intervalId = setInterval(poll, 1500);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [id, runStatus]);

  return {
    data,
    loading,
    error,
    pollingError,
    retry: loadRun,
  };
}