/**
 * Deterministic run-comparison engine.
 * Pure function: given two runs, returns a structured diff.
 * Zero DB/HTTP dependency by design — independently unit-testable.
 *
 * Input shape for each run:
 *   { session: {id, name, ...}, requests: [{endpoint, method, status, response_time, timestamp}, ...] }
 */

function summarize(requests) {
  const errorCount = requests.filter(r => r.status >= 400).length;
  const times = requests.map(r => Number(r.response_time)).filter(n => !Number.isNaN(n));
  const avgResponseTime = times.length > 0
    ? times.reduce((a, b) => a + b, 0) / times.length
    : 0;

  return {
    requestCount: requests.length,
    errorCount,
    avgResponseTime: Math.round(avgResponseTime)
  };
}

/** endpoint -> { count, errorCount, lastStatus, lastTimestamp } */
function byEndpoint(requests) {
  const map = new Map();
  for (const r of requests) {
    if (!map.has(r.endpoint)) {
      map.set(r.endpoint, { count: 0, errorCount: 0, lastStatus: null, lastTimestamp: null });
    }
    const entry = map.get(r.endpoint);
    entry.count++;
    if (r.status >= 400) entry.errorCount++;
    if (!entry.lastTimestamp || new Date(r.timestamp) > new Date(entry.lastTimestamp)) {
      entry.lastStatus = r.status;
      entry.lastTimestamp = r.timestamp;
    }
  }
  return map;
}

/**
 * @param {{session: object, requests: Array<object>}} runA
 * @param {{session: object, requests: Array<object>}} runB
 */
export function compareRuns(runA, runB) {
  const summaryA = summarize(runA.requests);
  const summaryB = summarize(runB.requests);

  const endpointsA = byEndpoint(runA.requests);
  const endpointsB = byEndpoint(runB.requests);

  const onlyInA = [...endpointsA.keys()].filter(e => !endpointsB.has(e));
  const onlyInB = [...endpointsB.keys()].filter(e => !endpointsA.has(e));
  const shared = [...endpointsA.keys()].filter(e => endpointsB.has(e));

  // 'status_change' findings live here (not in analysis.js) because a
  // status *change* only exists relative to a second run.
  const statusChanges = shared
    .map(endpoint => {
      const a = endpointsA.get(endpoint);
      const b = endpointsB.get(endpoint);
      return a.lastStatus !== b.lastStatus
        ? { type: 'status_change', endpoint, statusA: a.lastStatus, statusB: b.lastStatus }
        : null;
    })
    .filter(Boolean);

  return {
    runA: { id: runA.session.id, name: runA.session.name, ...summaryA },
    runB: { id: runB.session.id, name: runB.session.name, ...summaryB },
    deltas: {
      requestCount: summaryB.requestCount - summaryA.requestCount,
      errorCount: summaryB.errorCount - summaryA.errorCount,
      avgResponseTime: summaryB.avgResponseTime - summaryA.avgResponseTime
    },
    endpoints: { onlyInA, onlyInB, shared },
    statusChanges
  };
}