import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * FIXED: previously depended on [fetchFunction, ...dependencies]. Any
 * caller passing an inline arrow (e.g. `useFetch(() => fetchRun(id), {}, [id])`)
 * got a new fetchFunction identity every render, which made `fetchData`
 * (and therefore the effect that calls it) refire every render — an
 * infinite fetch loop that starved the Postgres pool for every other
 * endpoint. Callers passing a stable reference (e.g. `useFetch(fetchSessions)`)
 * never hit this, which is why only the Run detail page looped.
 *
 * Fix: always call the LATEST fetchFunction via a ref, but only
 * recreate `fetchData` (and re-run the effect) when the caller's own
 * `dependencies` array actually changes — exactly the intent the
 * `dependencies` param already implied.
 */
export const useFetch = (fetchFunction, params = {}, dependencies = []) => {
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
      const response = await fetchFunctionRef.current(paramsRef.current);
      setData(response.data);
    } catch (err) {
      setError(err.message || 'An error occurred');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = () => {
    fetchData();
  };

  return { data, loading, error, refetch };
};