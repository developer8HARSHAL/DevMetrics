#!/usr/bin/env node
/**
 * DevMetrics — Live Run E2E test
 * ---------------------------------------------------------------
 * Acts like a minimal "desktop agent": makes REAL HTTP calls to
 * public APIs, measures their REAL status/latency, then relays
 * those real events into DevMetrics via the actual backend:
 *
 *   POST  /sessions            (start a Run)
 *   POST  /track/batch         (relay the real traffic)
 *   PATCH /sessions/:id/end    (end Run, trigger analysis)
 *   GET   /sessions/:id        (pull back findings for inspection)
 *
 * Traffic is shaped to exercise all 5 finding types:
 *   - error            (individual 4xx/5xx)
 *   - error_burst      (/checkout hit repeatedly, all 500s)
 *   - duplicate_request(/posts/1 hit repeatedly, all 200s)
 *   - retry_pattern    (/payment: 503, 503, 503, then 200 — real backoff gaps)
 *   - latency_anomaly  (/reports/export: 3 fast calls, 1 real slow call)
 *
 * Requires Node 18+ (uses global fetch). No dependencies.
 *
 * Usage:
 *   BACKEND_URL=http://localhost:5000 \
 *   API_KEY=your_devmetrics_api_key \
 *   node live-run-test.js
 *
 * Optional env vars:
 *   DASHBOARD_URL   default http://localhost:3000  (only used to print the share link)
 *   RUN_NAME        default "Live traffic test"
 * ---------------------------------------------------------------
 */

const BACKEND_URL = (process.env.BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");
const DASHBOARD_URL = (process.env.DASHBOARD_URL || "http://localhost:5173").replace(/\/$/, "");
const API_KEY = "dm_e95365b0778383092728fa8baf571572fd1fd8d9e4d2bcab33f47f71aa2d9d61";
const RUN_NAME = process.env.RUN_NAME || "Live traffic test";

if (!API_KEY) {
  console.error("\n[FAIL] Missing API_KEY.\n");
  console.error("Run it like:");
  console.error('  BACKEND_URL=http://localhost:5000 API_KEY=your_key node live-run-test.js\n');
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function log(step, msg) {
  console.log(`\n[${step}] ${msg}`);
}

/**
 * Makes a REAL HTTP call and returns a DevMetrics-shaped event.
 * `label` is the endpoint name we report to DevMetrics (lets us
 * group otherwise-varied real URLs under one logical endpoint,
 * the same way a real app's routes would be grouped).
 */
async function realCall(label, method, url, options = {}) {
  const start = Date.now();
  let status;
  try {
    const res = await fetch(url, { method, ...options });
    status = res.status;
    // Drain body so timing reflects a full real round trip.
    await res.text().catch(() => {});
  } catch (err) {
    status = 0; // network-level failure
    console.warn(`   (warning) real call to ${url} failed: ${err.message}`);
  }
  const responseTime = Date.now() - start;
  const event = {
    endpoint: label,
    method,
    status: status || 599,
    responseTime,
    timestamp: new Date().toISOString(),
  };
  console.log(`   ${method} ${label.padEnd(18)} -> real ${url}  [${event.status}, ${responseTime}ms]`);
  return event;
}

async function warmUp() {
  // Pre-establish TLS/DNS to both hosts so the FIRST timed call isn't
  // skewed by handshake overhead (this was inflating the latency
  // baseline and masking the real anomaly in the previous run).
  log("WARMUP", "Priming connections to jsonplaceholder.typicode.com and httpbin.org (untimed, not sent to DevMetrics)");
  await fetch("https://jsonplaceholder.typicode.com/users/1").catch(() => {});
  await fetch("https://httpbin.org/get").catch(() => {});
}

async function buildTraffic() {
  const events = [];

  log("1/5", "Normal traffic (5 real calls, varied endpoints, should be clean)");
  events.push(await realCall("/users", "GET", "https://jsonplaceholder.typicode.com/users"));
  events.push(await realCall("/todos/1", "GET", "https://jsonplaceholder.typicode.com/todos/1"));
  events.push(await realCall("/comments", "GET", "https://jsonplaceholder.typicode.com/comments?postId=1"));
  events.push(await realCall("/albums/1", "GET", "https://jsonplaceholder.typicode.com/albums/1"));
  events.push(await realCall("/photos/1", "GET", "https://jsonplaceholder.typicode.com/photos/1"));

  log("2/5", "Duplicate requests (7x real calls to the same endpoint, tight rapid-fire -> duplicate_request)");
  for (let i = 0; i < 7; i++) {
    events.push(await realCall("/posts/1", "GET", "https://jsonplaceholder.typicode.com/posts/1"));
    await sleep(100);
  }

  log("3/5", "Error burst (4x real 500s on the same endpoint, rapid -> error_burst + error findings)");
  for (let i = 0; i < 4; i++) {
    events.push(await realCall("/checkout", "GET", "https://httpbin.org/status/500"));
    await sleep(200);
  }

  log("4/5", "Retry pattern (real 503, 503, 503, then real 200, widening real gaps -> retry_pattern)");
  events.push(await realCall("/payment", "POST", "https://httpbin.org/status/503"));
  await sleep(500);
  events.push(await realCall("/payment", "POST", "https://httpbin.org/status/503"));
  await sleep(1000);
  events.push(await realCall("/payment", "POST", "https://httpbin.org/status/503"));
  await sleep(1500);
  events.push(await realCall("/payment", "POST", "https://httpbin.org/status/200"));

  log("5/5", "Latency anomaly (4 real fast calls + 1 real slow call, same endpoint -> latency_anomaly)");
  events.push(await realCall("/reports/export", "GET", "https://httpbin.org/delay/0"));
  events.push(await realCall("/reports/export", "GET", "https://httpbin.org/delay/0"));
  events.push(await realCall("/reports/export", "GET", "https://httpbin.org/delay/0"));
  events.push(await realCall("/reports/export", "GET", "https://httpbin.org/delay/0"));
  events.push(await realCall("/reports/export", "GET", "https://httpbin.org/delay/5")); // real ~5s round trip, clear outlier

  return events;
}

async function main() {
  console.log("=".repeat(70));
  console.log("DevMetrics — Live Run E2E test");
  console.log(`Backend:   ${BACKEND_URL}`);
  console.log(`Dashboard: ${DASHBOARD_URL}`);
  console.log("=".repeat(70));

  // 1. Start a Run
  log("START", `POST ${BACKEND_URL}/sessions`);
  const startRes = await fetch(`${BACKEND_URL}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
    body: JSON.stringify({ name: RUN_NAME, hostname: "live-e2e-script" }),
  });
  const startBody = await startRes.json();
  if (!startRes.ok || !startBody.sessionId) {
    console.error("\n[FAIL] Could not start Run. Response:", startRes.status, startBody);
    process.exit(1);
  }
  const { sessionId, shareToken } = startBody;
  console.log(`   Run created: ${sessionId}`);

  // 2. Generate + relay real traffic
  await warmUp();
  const events = await buildTraffic();

  log("BATCH", `POST ${BACKEND_URL}/track/batch  (${events.length} real events)`);
  const batchRes = await fetch(`${BACKEND_URL}/track/batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
    body: JSON.stringify({ sessionId, events }),
  });
  const batchBody = await batchRes.json().catch(() => ({}));
  if (!batchRes.ok) {
    console.error("\n[FAIL] Batch insert failed. Response:", batchRes.status, batchBody);
    process.exit(1);
  }
  console.log("   Batch accepted:", JSON.stringify(batchBody));

  // 3. End the Run (triggers analysis synchronously)
  log("END", `PATCH ${BACKEND_URL}/sessions/${sessionId}/end`);
  const endRes = await fetch(`${BACKEND_URL}/sessions/${sessionId}/end`, {
    method: "PATCH",
    headers: { "x-api-key": API_KEY },
  });
  const endBody = await endRes.json().catch(() => ({}));
  if (!endRes.ok) {
    console.error("\n[FAIL] End Run failed. Response:", endRes.status, endBody);
    process.exit(1);
  }
  const findings = endBody?.data?.findings || [];
  console.log(`   Run ended. Findings returned inline: ${findings.length}`);

  // 4. Re-fetch Run detail to double-check persisted state
  log("VERIFY", `GET ${BACKEND_URL}/sessions/${sessionId}`);
  const detailRes = await fetch(`${BACKEND_URL}/sessions/${sessionId}`, {
    headers: { "x-api-key": API_KEY },
  });
  const detailBody = await detailRes.json().catch(() => ({}));
  const timeline = detailBody?.data?.timeline || [];
  const persistedFindings = detailBody?.data?.findings || [];

  console.log("\n" + "=".repeat(70));
  console.log("RESULTS");
  console.log("=".repeat(70));
  console.log(`Events sent:            ${events.length}`);
  console.log(`Timeline rows in DB:    ${timeline.length}  (should equal events sent)`);
  console.log(`Findings persisted:     ${persistedFindings.length}`);
  console.log("\nFinding breakdown:");
  const byType = {};
  for (const f of persistedFindings) byType[f.type] = (byType[f.type] || 0) + 1;
  for (const [type, count] of Object.entries(byType)) {
    console.log(`   - ${type}: ${count}`);
  }
  const expectedTypes = ["error", "error_burst", "duplicate_request", "retry_pattern", "latency_anomaly"];
  const missing = expectedTypes.filter((t) => !byType[t]);
  if (missing.length) {
    console.log(`\n[WARN] Expected finding types not seen: ${missing.join(", ")}`);
    console.log("       (Check thresholds in services/analysis.js against real gaps above.)");
  } else {
    console.log("\n[OK] All 5 expected finding types were produced.");
  }

  console.log("\nOpen in dashboard:");
  console.log(`   Run detail:  ${DASHBOARD_URL}/sessions/${sessionId}`);
  console.log(`   Share link:  ${DASHBOARD_URL}/shared/${shareToken}   (open in an incognito window — no login)`);
  console.log("=".repeat(70) + "\n");
}

main().catch((err) => {
  console.error("\n[FAIL] Unexpected error:", err);
  process.exit(1);
});