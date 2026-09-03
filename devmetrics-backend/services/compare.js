/**
 * Deterministic run-comparison engine.
 * Pure function: given two runs, returns a structured diff.
 * Zero DB/HTTP dependency by design — independently unit-testable.
 *
 * Input shape for each run:
 *   {
 *     session: {id, name, started_at, ended_at, ...},
 *     requests: [{endpoint, method, status, response_time, timestamp}, ...],
 *     findings: [{id, type, endpoint, severity, occurrences, meta}, ...]   // NEW
 *   }
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

function durationMs(session) {
  if (!session.ended_at) return null; // still recording — no duration yet
  return new Date(session.ended_at) - new Date(session.started_at);
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

// Percentage change, null when the baseline is 0 (undefined/meaningless ratio
// rather than a misleading Infinity or 0%).
function pctChange(from, to) {
  if (from === 0) return null;
  return Math.round(((to - from) / from) * 100);
}

// A "finding identity" for diffing across runs — same type at the same
// endpoint is treated as the same underlying issue recurring or resolving.
// This is a heuristic, not a backend-guaranteed identity key.
function findingKey(finding) {
  return `${finding.type}::${finding.endpoint ?? ''}`;
}

function diffFindings(findingsA, findingsB) {
  const keysA = new Set(findingsA.map(findingKey));
  const keysB = new Set(findingsB.map(findingKey));

  const resolved = findingsA.filter(f => !keysB.has(findingKey(f)));
  const newFindings = findingsB.filter(f => !keysA.has(findingKey(f)));

  return { resolved, new: newFindings };
}

// Deterministic verdict rule — see services/compare.js comment history /
// implementation notes for reasoning. Not a confirmed product spec; derived
// from the one reference example available. Revisit if it misjudges real data.
function computeVerdict({ errorDelta, resolvedCount, newCount, hasNewCritical }) {
  if (hasNewCritical) return 'regressed';
  if (errorDelta > 0) return 'regressed';
  if (errorDelta < 0 && resolvedCount >= newCount) return 'improved';
  if (errorDelta === 0 && resolvedCount === 0 && newCount === 0) return 'unchanged';
  return 'mixed';
}

/**
 * @param {{session: object, requests: Array<object>, findings: Array<object>}} runA
 * @param {{session: object, requests: Array<object>, findings: Array<object>}} runB
 */
export function compareRuns(runA, runB) {
  const summaryA = summarize(runA.requests);
  const summaryB = summarize(runB.requests);

  const durationA = durationMs(runA.session);
  const durationB = durationMs(runB.session);

  const findingsA = runA.findings || [];
  const findingsB = runB.findings || [];
  const { resolved, new: newFindings } = diffFindings(findingsA, findingsB);
  const hasNewCritical = newFindings.some(f => f.severity === 'critical');

  const endpointsA = byEndpoint(runA.requests);
  const endpointsB = byEndpoint(runB.requests);

  const onlyInA = [...endpointsA.keys()].filter(e => !endpointsB.has(e));
  const onlyInB = [...endpointsB.keys()].filter(e => !endpointsA.has(e));
  const shared = [...endpointsA.keys()].filter(e => endpointsB.has(e));

  const statusChanges = shared
    .map(endpoint => {
      const a = endpointsA.get(endpoint);
      const b = endpointsB.get(endpoint);
      return a.lastStatus !== b.lastStatus
        ? { type: 'status_change', endpoint, statusA: a.lastStatus, statusB: b.lastStatus }
        : null;
    })
    .filter(Boolean);

  const errorDelta = summaryB.errorCount - summaryA.errorCount;

  return {
    runA: { id: runA.session.id, name: runA.session.name, ...summaryA, durationMs: durationA, findingCount: findingsA.length },
    runB: { id: runB.session.id, name: runB.session.name, ...summaryB, durationMs: durationB, findingCount: findingsB.length },
    deltas: {
      requestCount: summaryB.requestCount - summaryA.requestCount,
      errorCount: errorDelta,
      errorCountPct: pctChange(summaryA.errorCount, summaryB.errorCount),
      avgResponseTime: summaryB.avgResponseTime - summaryA.avgResponseTime,
      durationMs: (durationA != null && durationB != null) ? durationB - durationA : null,
      durationPct: (durationA != null && durationB != null) ? pctChange(durationA, durationB) : null,
      findingCount: findingsB.length - findingsA.length,
      findingCountPct: pctChange(findingsA.length, findingsB.length)
    },
    endpoints: { onlyInA, onlyInB, shared },
    statusChanges,
    findings: { resolved, new: newFindings },
    verdict: computeVerdict({
      errorDelta,
      resolvedCount: resolved.length,
      newCount: newFindings.length,
      hasNewCritical
    })
  };
}