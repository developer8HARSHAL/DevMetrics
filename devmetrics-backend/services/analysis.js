const ERROR_BURST_WINDOW_MS = 10_000;   
const ERROR_BURST_MIN_COUNT = 3;

const DUPLICATE_WINDOW_MS = 10_000;     
const DUPLICATE_MIN_COUNT = 5;

const RETRY_GAP_MS = 5_000;         

const LATENCY_STDDEV_MULTIPLIER = 2;
const LATENCY_MIN_SAMPLES = 5;       
const LATENCY_MIN_MS = 200;            

function toMillis(ts) {
  return new Date(ts).getTime();
}

function sortByTime(requests) {
  return [...requests].sort((a, b) => toMillis(a.timestamp) - toMillis(b.timestamp));
}

function groupByEndpoint(requests) {
  const map = new Map();
  for (const r of requests) {
    if (!map.has(r.endpoint)) map.set(r.endpoint, []);
    map.get(r.endpoint).push(r);
  }
  return map;
}

function groupByMethod(requests) {
  const map = new Map();
  for (const r of requests) {
    if (!map.has(r.method)) map.set(r.method, []);
    map.get(r.method).push(r);
  }
  return map;
}

/** Rule: isolated + aggregate error counts per endpoint. */
function detectErrors(endpoint, requests) {
  const errors = requests.filter(r => r.status >= 400);
  if (errors.length === 0) return [];

  return [{
    type: 'error',
    endpoint,
    severity: errors.some(r => r.status >= 500) ? 'critical' : 'warning',
    occurrences: errors.length,
    meta: {
      statusCounts: errors.reduce((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      }, {})
    }
  }];
}

function detectErrorBursts(endpoint, requests) {
  const errors = sortByTime(requests.filter(r => r.status >= 400));
  if (errors.length < ERROR_BURST_MIN_COUNT) return [];

  let best = null;
  let windowStart = 0;

  for (let i = 0; i < errors.length; i++) {
    while (toMillis(errors[i].timestamp) - toMillis(errors[windowStart].timestamp) > ERROR_BURST_WINDOW_MS) {
      windowStart++;
    }
    const size = i - windowStart + 1;
    if (size >= ERROR_BURST_MIN_COUNT && (!best || size > best.size)) {
      best = { size, start: errors[windowStart], end: errors[i] };
    }
  }

  if (!best) return [];

  return [{
    type: 'error_burst',
    endpoint,
    severity: 'critical',
    occurrences: best.size,
    meta: { windowMs: ERROR_BURST_WINDOW_MS, firstAt: best.start.timestamp, lastAt: best.end.timestamp }
  }];
}

function detectDuplicates(endpoint, requests) {
  const findings = [];

  for (const [method, methodRequests] of groupByMethod(requests)) {
    const sorted = sortByTime(methodRequests);
    let windowStart = 0;
    let best = null;

    for (let i = 0; i < sorted.length; i++) {
      while (toMillis(sorted[i].timestamp) - toMillis(sorted[windowStart].timestamp) > DUPLICATE_WINDOW_MS) {
        windowStart++;
      }
      const size = i - windowStart + 1;
      if (size >= DUPLICATE_MIN_COUNT && (!best || size > best.size)) {
        best = { size, start: sorted[windowStart], end: sorted[i] };
      }
    }

    if (best) {
      findings.push({
        type: 'duplicate_request',
        endpoint,
        severity: 'warning',
        occurrences: best.size,
        meta: { method, windowMs: DUPLICATE_WINDOW_MS, firstAt: best.start.timestamp, lastAt: best.end.timestamp }
      });
    }
  }
  return findings;
}

function detectRetryPatterns(endpoint, requests) {
  const findings = [];

  for (const [method, methodRequests] of groupByMethod(requests)) {
    const sorted = sortByTime(methodRequests);
    let chainLength = 1;
    let chainStart = sorted[0] || null;
    let sawFailure = false;

    const flush = (last) => {
      if (chainLength >= 2 && sawFailure && chainStart) {
        findings.push({
          type: 'retry_pattern',
          endpoint,
          severity: 'warning',
          occurrences: chainLength,
          meta: { method, gapMs: RETRY_GAP_MS, firstAt: chainStart.timestamp, lastAt: last.timestamp }
        });
      }
    };

    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const gap = toMillis(sorted[i].timestamp) - toMillis(prev.timestamp);

      if (gap <= RETRY_GAP_MS) {
        chainLength++;
        if (prev.status >= 400) sawFailure = true;
      } else {
        flush(prev);
        chainLength = 1;
        chainStart = sorted[i];
        sawFailure = false;
      }
    }
    if (sorted.length > 0) flush(sorted[sorted.length - 1]);
  }
  return findings;
}

function median(sortedNums) {
  const mid = Math.floor(sortedNums.length / 2);
  return sortedNums.length % 2 !== 0
    ? sortedNums[mid]
    : (sortedNums[mid - 1] + sortedNums[mid]) / 2;
}


function detectLatencyAnomalies(endpoint, requests) {
  const times = requests.map(r => Number(r.response_time)).filter(n => !Number.isNaN(n));
  if (times.length < LATENCY_MIN_SAMPLES) return [];

  const sorted = [...times].sort((a, b) => a - b);
  const med = median(sorted);
  const absDeviations = sorted.map(t => Math.abs(t - med)).sort((a, b) => a - b);
  const mad = median(absDeviations);
  const scaledMad = mad * 1.4826;
  const threshold = med + LATENCY_STDDEV_MULTIPLIER * scaledMad;

  const anomalies = requests.filter(r => {
    const t = Number(r.response_time);
    return !Number.isNaN(t) && t > threshold && t > LATENCY_MIN_MS;
  });

  if (anomalies.length === 0) return [];

  return [{
    type: 'latency_anomaly',
    endpoint,
    severity: 'warning',
    occurrences: anomalies.length,
    meta: {
      median: Math.round(med),
      mad: Math.round(mad),
      threshold: Math.round(threshold),
      maxObserved: Math.round(Math.max(...anomalies.map(r => Number(r.response_time))))
    }
  }];
}

/**
 * @param {Array<object>} requests - rows from the `requests` table for one session
 * @returns {Array<object>} findings ready to insert via RunFinding.bulkCreate
 */
export function analyzeRun(requests) {
  if (!Array.isArray(requests) || requests.length === 0) return [];

  const findings = [];
  for (const [endpoint, endpointRequests] of groupByEndpoint(requests)) {
    findings.push(...detectErrors(endpoint, endpointRequests));
    findings.push(...detectErrorBursts(endpoint, endpointRequests));
    findings.push(...detectDuplicates(endpoint, endpointRequests));
    findings.push(...detectRetryPatterns(endpoint, endpointRequests));
    findings.push(...detectLatencyAnomalies(endpoint, endpointRequests));
  }
  return findings;
}