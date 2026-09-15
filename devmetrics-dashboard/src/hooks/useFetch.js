import { useState, useEffect, useCallback, useRef } from "react";
import { unwrapData } from "../lib/api";

export const useFetch = (
  fetchFunction,
  params = {},
  dependencies = []
) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFunctionRef = useRef(fetchFunction);
  const paramsRef = useRef(params);

  useEffect(() => {
    fetchFunctionRef.current = fetchFunction;
    paramsRef.current = params;
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchFunctionRef.current(
        paramsRef.current
      );

      setData(unwrapData(response));
    } catch (err) {
      setError(err?.message || "An error occurred");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [...dependencies]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
  };
};