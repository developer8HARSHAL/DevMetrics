import http from "http";
import https from "https";
import dns from "dns";
import net from "net";
import { performance } from "perf_hooks";

import Test from "../models/Test.js";
import TestRequest from "../models/TestRequest.js";
import Session from "../models/Session.js";
import Request from "../models/Request.js";
import RunFinding from "../models/RunFinding.js";

import { analyzeRun } from "./analysis.js";

const dnsLookup = dns.promises.lookup;

const MAX_TEST_REQUESTS = 50;
const MAX_RESPONSE_BYTES = 1024 * 1024; // 1 MB
const MAX_REDIRECTS = 3;
const MAX_HEADERS = 40;
const MAX_HEADER_VALUE_LENGTH = 4096;
const DEFAULT_TIMEOUT_MS = 5000;
const MAX_TIMEOUT_MS = 30000;

const SYNTHETIC_NETWORK_ERROR_STATUS = 599;

const BLOCKED_REQUEST_HEADERS = new Set([
  "host",
  "content-length",
  "connection",
  "transfer-encoding",
  "upgrade"
]);

function isIPv4Private(address) {
  const parts = address.split(".").map(Number);

  if (parts.length !== 4 || parts.some(Number.isNaN)) {
    return false;
  }

  const [a, b] = parts;

  return (
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 0)
  );
}

function isIPv6Private(address) {
  const normalized = address.toLowerCase();

  if (
    normalized === "::1" ||
    normalized === "::"
  ) {
    return true;
  }

  if (
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb")
  ) {
    return true;
  }

  if (normalized.startsWith("ff")) {
    return true;
  }

  const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);

  if (mapped) {
    return isIPv4Private(mapped[1]);
  }

  return false;
}

function isPrivateAddress(address) {
  const family = net.isIP(address);

  if (family === 4) {
    return isIPv4Private(address);
  }

  if (family === 6) {
    return isIPv6Private(address);
  }

  return true;
}

async function resolveSafeAddress(hostname) {
  const ipFamily = net.isIP(hostname);

  if (ipFamily) {
    if (isPrivateAddress(hostname)) {
      throw new Error("Requests to private or local IP addresses are blocked");
    }

    return {
      address: hostname,
      family: ipFamily
    };
  }

  const addresses = await dnsLookup(hostname, {
    all: true,
    verbatim: true
  });

  if (!addresses || addresses.length === 0) {
    throw new Error("Unable to resolve target hostname");
  }

  // Fail closed. If ANY resolved address is private,
  // do not allow the request.
  for (const record of addresses) {
    if (isPrivateAddress(record.address)) {
      throw new Error(
        "Target hostname resolves to a private or local address"
      );
    }
  }

  const preferred =
    addresses.find((record) => record.family === 4) ||
    addresses.find((record) => record.family === 6);

  if (!preferred) {
    throw new Error("No usable public IP address found");
  }

  return preferred;
}

async function validateTarget(urlString) {
  let url;

  try {
    url = new URL(urlString);
  } catch {
    throw new Error("Invalid target URL");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs are allowed");
  }

  if (url.username || url.password) {
    throw new Error("URLs containing credentials are not allowed");
  }

  await resolveSafeAddress(url.hostname);

  return url;
}

function sanitizeHeaders(input) {
  if (
    input === null ||
    input === undefined
  ) {
    return {};
  }

  if (
    typeof input !== "object" ||
    Array.isArray(input)
  ) {
    throw new Error("Headers must be an object");
  }

  const entries = Object.entries(input);

  if (entries.length > MAX_HEADERS) {
    throw new Error(`A maximum of ${MAX_HEADERS} headers is allowed`);
  }

  const headers = {};

  for (const [rawName, rawValue] of entries) {
    const name = String(rawName).trim().toLowerCase();

    if (!name) {
      continue;
    }

    if (BLOCKED_REQUEST_HEADERS.has(name)) {
      continue;
    }

    const value = Array.isArray(rawValue)
      ? rawValue.map(String)
      : String(rawValue);

    const serializedValue = Array.isArray(value)
      ? value.join(", ")
      : value;

    if (serializedValue.length > MAX_HEADER_VALUE_LENGTH) {
      throw new Error(`Header "${name}" is too large`);
    }

    headers[name] = serializedValue;
  }

  return headers;
}

function serializeBody(body) {
  if (body === null || body === undefined) {
    return null;
  }

  if (typeof body === "string") {
    return body;
  }

  return JSON.stringify(body);
}

function createAssertionFinding(testRequest, result) {
  if (
    testRequest.expected_status === null ||
    testRequest.expected_status === undefined
  ) {
    return null;
  }

  if (result.status === testRequest.expected_status) {
    return null;
  }

  return {
    type: "assertion_failure",
    endpoint: testRequest.url,
    severity:
      result.status >= 500
        ? "critical"
        : "warning",
    occurrences: 1,
    meta: {
      expectedStatus: testRequest.expected_status,
      actualStatus: result.status,
      method: testRequest.method
    }
  };
}

function performHttpRequest(url, options) {
  return new Promise((resolve) => {
    const transport =
      url.protocol === "https:"
        ? https
        : http;

    const startedAt = performance.now();

    let finished = false;
    let responseBytes = 0;
    let timer = null;

    const finish = (result) => {
      if (finished) {
        return;
      }

      finished = true;

      if (timer) {
        clearTimeout(timer);
      }

      resolve({
        ...result,
        responseTime: Math.max(
          0,
          Math.round(performance.now() - startedAt)
        )
      });
    };

const requestOptions = {
  protocol: url.protocol,
  hostname: url.hostname,
  port:
    url.port ||
    (url.protocol === "https:" ? 443 : 80),
  path: `${url.pathname}${url.search}`,
  method: options.method,
  headers: options.headers
};

    if (url.protocol === "https:") {
      requestOptions.servername = url.hostname;
    }

    const request = transport.request(
      requestOptions,
      (response) => {
        const chunks = [];

        response.on("data", (chunk) => {
          responseBytes += chunk.length;

          if (responseBytes > MAX_RESPONSE_BYTES) {
            request.destroy(
              new Error("Response body exceeded size limit")
            );
            return;
          }

          chunks.push(chunk);
        });

        response.on("end", () => {
          const status = response.statusCode || SYNTHETIC_NETWORK_ERROR_STATUS;

          finish({
            status,
            redirectLocation:
              response.headers.location || null,
            error: null
          });
        });
      }
    );

    request.setTimeout(
      options.timeoutMs,
      () => {
        request.destroy(
          new Error(
            `Request timed out after ${options.timeoutMs} ms`
          )
        );
      }
    );

 request.on("error", (error) => {
  console.error(
    `HTTP execution failed for ${url.toString()}:`,
    error
  );

  finish({
    status: SYNTHETIC_NETWORK_ERROR_STATUS,
    redirectLocation: null,
    error: error.message
  });
});

    if (options.body !== null) {
      request.write(options.body);
    }

    request.end();

    timer = setTimeout(() => {
      request.destroy(
        new Error("Request timeout")
      );
    }, options.timeoutMs + 1000);
  });
}

async function executeOneRequest(testRequest) {
  let currentUrl = await validateTarget(testRequest.url);

  const method = testRequest.method.toUpperCase();

  const timeoutMs = Math.min(
    Math.max(
      Number(testRequest.timeout_ms) ||
        DEFAULT_TIMEOUT_MS,
      1
    ),
    MAX_TIMEOUT_MS
  );

  let headers = sanitizeHeaders(testRequest.headers);
  const body = serializeBody(testRequest.body);

  if (
    body !== null &&
    !headers["content-type"]
  ) {
    headers["content-type"] = "application/json";
  }

  if (body !== null) {
    headers["content-length"] = Buffer.byteLength(body);
  }

  for (let redirectCount = 0; ; redirectCount++) {
    const result = await performHttpRequest(
      currentUrl,
      {
        method,
        headers,
        body:
          method === "GET" ||
          method === "HEAD"
            ? null
            : body,
        timeoutMs
      }
    );

    if (
      !result.redirectLocation ||
      ![301, 302, 303, 307, 308].includes(
        result.status
      )
    ) {
      return {
        status: result.status,
        responseTime: result.responseTime,
        error: result.error
      };
    }

    if (redirectCount >= MAX_REDIRECTS) {
      return {
        status: SYNTHETIC_NETWORK_ERROR_STATUS,
        responseTime: result.responseTime,
        error: "Maximum redirect limit exceeded"
      };
    }

    const nextUrl = new URL(
      result.redirectLocation,
      currentUrl
    );

    currentUrl = await validateTarget(
      nextUrl.toString()
    );

    /*
     * We do not carry a manually supplied Host header
     * across redirects.
     */
    headers = {
      ...headers
    };

    delete headers.host;

    /*
     * RFC-style redirect behavior:
     * 303 becomes GET.
     */
    if (
      result.status === 303 &&
      method !== "GET" &&
      method !== "HEAD"
    ) {
      headers = { ...headers };
    }
  }
}

async function persistRequest({
  apiKey,
  sessionId,
  testRequest,
  result
}) {
  const saved = await Request.bulkCreate([
    {
      apiKey,
      endpoint: testRequest.url,
      method: testRequest.method,
      status: result.status,
      responseTime: result.responseTime,
      timestamp: new Date(),
      sessionId,
      source: "test"
    }
  ]);

  return saved[0];
}

export async function executeTestRun({
  testId,
  apiKey,
  runId
}) {
  const test = await Test.findByIdForApiKey(
    testId,
    apiKey
  );

  if (!test) {
    throw new Error("Test not found");
  }

  const testRequests =
    await TestRequest.findByTestId(testId);

  if (!testRequests.length) {
    await Session.fail(runId);
    throw new Error(
      "Test has no configured requests"
    );
  }

  if (
    testRequests.length >
    MAX_TEST_REQUESTS
  ) {
    await Session.fail(runId);
    throw new Error(
      `A test may contain at most ${MAX_TEST_REQUESTS} requests`
    );
  }

  await Session.updateStatus(
    runId,
    "running"
  );

  try {
    const runtimeFindings = [];

    for (const testRequest of testRequests) {
      let result;

      try {
        result = await executeOneRequest(
          testRequest
        );
      } catch (error) {
        result = {
          status:
            SYNTHETIC_NETWORK_ERROR_STATUS,
          responseTime: 0,
          error: error.message
        };
      }

      const savedRequest =
        await persistRequest({
          apiKey,
          sessionId: runId,
          testRequest,
          result
        });

      const assertionFinding =
        createAssertionFinding(
          testRequest,
          savedRequest
        );

      if (assertionFinding) {
        runtimeFindings.push(
          assertionFinding
        );
      }
    }

    await Session.updateStatus(
      runId,
      "analyzing"
    );

    const requests =
      await Request.findBySessionId(runId);

    const analysisFindings =
      analyzeRun(requests);

    const findings = [
      ...analysisFindings,
      ...runtimeFindings
    ];

    await RunFinding.bulkCreate(
      runId,
      findings
    );

    const completed =
      await Session.updateStatus(
        runId,
        "completed"
      );

    return {
      session: completed,
      findings
    };
  } catch (error) {
    await Session.fail(runId);
    throw error;
  }
}

export async function startTestRun({
  testId,
  apiKey,
  name
}) {
  const test =
    await Test.findByIdForApiKey(
      testId,
      apiKey
    );

  if (!test) {
    const error = new Error("Test not found");
    error.statusCode = 404;
    throw error;
  }

  const requests =
    await TestRequest.findByTestId(testId);

  if (!requests.length) {
    const error =
      new Error(
        "Add at least one request before running this test"
      );

    error.statusCode = 400;
    throw error;
  }

  if (
    requests.length >
    MAX_TEST_REQUESTS
  ) {
    const error =
      new Error(
        `A test may contain at most ${MAX_TEST_REQUESTS} requests`
      );

    error.statusCode = 400;
    throw error;
  }

  const run = await Session.create({
    apiKey,
    name:
      name ||
      `Test Run: ${test.name}`,
    hostname: null,
    runStatus: "queued"
  });

  /*
   * Deliberately start the execution without waiting.
   * The API returns the Run ID immediately and the frontend
   * can poll /sessions/:id.
   */
  void executeTestRun({
    testId,
    apiKey,
    runId: run.id
  }).catch((error) => {
    console.error(
      `Test run ${run.id} failed:`,
      error
    );
  });

  return run;
}