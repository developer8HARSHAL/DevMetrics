import Request from "../models/Request.js";
import ApiKey from "../models/ApiKey.js";
import Session from "../models/Session.js";
import { transaction } from "../config/db.js";

// Untouched per plan 2.5 — SDK compatibility.
export const handleTrack = async (req, res) => {
  try {
    const { endpoint, method, status, responseTime, timestamp, apiKey } = req.body;

    // req.apiKeyDoc already validated by auth middleware
    const apiKeyDoc = req.apiKeyDoc;

    // Rate limit check
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentRequests = await Request.countDocuments({
      apiKey,
      timestamp: { $gte: oneHourAgo }
    });

    const hourlyLimit = apiKeyDoc.requests_per_hour || 10000;
    if (recentRequests >= hourlyLimit) {
      return res.status(429).json({
        success: false,
        message: "Rate limit exceeded",
        limit: hourlyLimit,
        resetAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      });
    }

    const newRequest = new Request({
      apiKey,
      endpoint,
      method: method.toUpperCase(),
      status,
      responseTime,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    });

    await newRequest.save();

    ApiKey.incrementUsage(apiKey).catch(err =>
      console.error('Failed to increment usage:', err)
    );

    res.status(201).json({
      success: true,
      message: "Request tracked successfully",
      id: newRequest.id
    });

  } catch (err) {
    console.error('Track error:', err);
    res.status(500).json({
      success: false,
      message: "Failed to track request",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

const VALID_HTTP_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS', 'CONNECT', 'TRACE']);

// Per-event validation for POST /track/batch, run before any row is built
// or any DB call is made — fail fast on malformed input from the desktop
// agent rather than partially trusting it.
function validateEvent(e, index) {
  const errors = [];

  if (typeof e.endpoint !== 'string' || e.endpoint.trim().length === 0) {
    errors.push('endpoint must be a non-empty string');
  }
  if (typeof e.method !== 'string' || !VALID_HTTP_METHODS.has(e.method.toUpperCase())) {
    errors.push('method must be a valid HTTP method');
  }
  if (!Number.isInteger(e.status) || e.status < 100 || e.status > 599) {
    errors.push('status must be an integer between 100 and 599');
  }
  if (typeof e.responseTime !== 'number' || Number.isNaN(e.responseTime) || e.responseTime < 0) {
    errors.push('responseTime must be a number >= 0');
  }
  if (e.timestamp !== undefined && e.timestamp !== null) {
    if (Number.isNaN(new Date(e.timestamp).getTime())) {
      errors.push('timestamp must be a valid date when provided');
    }
  }

  return errors.length > 0 ? { index, errors } : null;
}

// New for Goal 2B — POST /track/batch. The desktop agent buffers events
// locally and calls this once per batch instead of once per event, which
// also fixes the current per-row countDocuments rate-limit cost: one
// rate-limit check covers the whole batch instead of N separate checks.
export const handleTrackBatch = async (req, res) => {
  try {
    const { sessionId, events } = req.body;
    // Always the authenticated key from validateApiKey — never a
    // client-supplied apiKey field, unlike legacy /track's req.body.apiKey.
    const apiKeyDoc = req.apiKeyDoc;
    const apiKey = apiKeyDoc.key;

    if (!sessionId) {
      return res.status(400).json({ success: false, message: "sessionId is required" });
    }
    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ success: false, message: "events must be a non-empty array" });
    }

    const validationErrors = events.map(validateEvent).filter(Boolean);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "One or more events failed validation",
        errors: validationErrors
      });
    }

    // Confirm the Run belongs to this API key before accepting events for it.
    const session = await Session.findById(sessionId);
    if (!session || session.api_key !== apiKey) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    // One rate-limit check for the entire batch, not per event.
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentRequests = await Request.countDocuments({
      apiKey,
      timestamp: { $gte: oneHourAgo }
    });

    const hourlyLimit = apiKeyDoc.requests_per_hour || 10000;
    if (recentRequests + events.length > hourlyLimit) {
      return res.status(429).json({
        success: false,
        message: "Rate limit exceeded",
        limit: hourlyLimit,
        remaining: Math.max(hourlyLimit - recentRequests, 0),
        resetAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      });
    }

    const rows = events.map(e => ({
      apiKey,
      endpoint: e.endpoint,
      method: e.method.toUpperCase(),
      status: e.status,
      responseTime: e.responseTime,
      timestamp: e.timestamp ? new Date(e.timestamp) : new Date(),
      sessionId,
      source: 'desktop'
    }));

    // Insert + usage bump now live in the SAME transaction: either both
    // land or neither does. Previously incrementUsage ran fire-and-forget
    // outside the transaction, which could leave inserted rows with no
    // corresponding usage accounting (or vice versa on a rare failure).
    const { inserted, apiKeyRow } = await transaction(async (client) => {
      const insertedRows = await Request.bulkCreate(rows, client);
      const updatedApiKeyRow = await ApiKey.incrementUsage(apiKey, events.length, client);
      return { inserted: insertedRows, apiKeyRow: updatedApiKeyRow };
    });

    res.status(201).json({
      success: true,
      message: "Batch tracked successfully",
      inserted: inserted.length,
      usageCount: apiKeyRow.usage_count
    });

  } catch (err) {
    console.error('Batch track error:', err);
    res.status(500).json({
      success: false,
      message: "Failed to track batch",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};