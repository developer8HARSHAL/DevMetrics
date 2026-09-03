import Session from "../models/Session.js";
import Request from "../models/Request.js";
import RunFinding from "../models/RunFinding.js";
import { analyzeRun } from "../services/analysis.js";
import { compareRuns } from "../services/compare.js";

export const createSession = async (req, res) => {
  try {
    const { name, hostname } = req.body;
    const apiKey = req.apiKeyDoc.key;

    const session = await Session.create({ apiKey, name, hostname });

    res.status(201).json({
      success: true,
      message: "Run started",
      sessionId: session.id,
      shareToken: session.share_token
    });
  } catch (err) {
    console.error('Create session error:', err);
    res.status(500).json({
      success: false,
      message: "Failed to start run",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

export const endSession = async (req, res) => {
  try {
    const { id } = req.params;
    const apiKey = req.apiKeyDoc.key;

    const session = await Session.findById(id);
    if (!session || session.api_key !== apiKey) {
      return res.status(404).json({ success: false, message: "Run not found" });
    }

    const ended = await Session.end(id);

    // Analysis runs synchronously here, per plan 2.8 — findings are
    // persisted before the response goes out, not recomputed per view.
    const requests = await Request.findBySessionId(id);
    const findings = analyzeRun(requests);
    const savedFindings = await RunFinding.bulkCreate(id, findings);

    res.json({
      success: true,
      message: "Run ended",
      data: {
        session: ended,
        findings: savedFindings
      }
    });
  } catch (err) {
    console.error('End session error:', err);
    res.status(500).json({
      success: false,
      message: "Failed to end run",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

export const listSessions = async (req, res) => {
  try {
    const apiKey = req.apiKeyDoc.key;
    const sessions = await Session.findByApiKeyWithStats(apiKey);

    res.json({
      success: true,
      data: sessions
    });
  } catch (err) {
    console.error('List sessions error:', err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch runs",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

export const getSessionDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const apiKey = req.apiKeyDoc.key;

    const session = await Session.findById(id);
    if (!session || session.api_key !== apiKey) {
      return res.status(404).json({ success: false, message: "Run not found" });
    }

    const [timeline, findings] = await Promise.all([
      Request.findBySessionId(id),
      RunFinding.findBySessionId(id)
    ]);

    res.json({
      success: true,
      data: { session, timeline, findings }
    });
  } catch (err) {
    console.error('Session detail error:', err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch run",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Public, unauthenticated path — scoped strictly by the unguessable
// share_token. Owner-only fields (api_key, user_id) are stripped.
export const getSharedSession = async (req, res) => {
  try {
    const { token } = req.params;

    const session = await Session.findByShareToken(token);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Shared run not found"
      });
    }

    const [timeline, findings] = await Promise.all([
      Request.findPublicBySessionId(session.id),
      RunFinding.findBySessionId(session.id)
    ]);

    const {
      api_key,
      user_id,
      ...publicSession
    } = session;

    res.json({
      success: true,
      data: {
        session: publicSession,
        timeline,
        findings
      }
    });
  } catch (err) {
    console.error("Shared session error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to fetch shared run",
      error:
        process.env.NODE_ENV === "development"
          ? err.message
          : undefined
    });
  }
};

export const compareSessions = async (req, res) => {
  try {
    const { a, b } = req.query;
    const apiKey = req.apiKeyDoc.key;

    if (!a || !b) {
      return res.status(400).json({ success: false, message: "Both a and b run IDs are required" });
    }

    const [sessionA, sessionB] = await Promise.all([
      Session.findById(a),
      Session.findById(b)
    ]);

    if (!sessionA || sessionA.api_key !== apiKey) {
      return res.status(404).json({ success: false, message: "Run A not found" });
    }
    if (!sessionB || sessionB.api_key !== apiKey) {
      return res.status(404).json({ success: false, message: "Run B not found" });
    }

    const [requestsA, requestsB, findingsA, findingsB] = await Promise.all([
      Request.findBySessionId(a),
      Request.findBySessionId(b),
      RunFinding.findBySessionId(a),
      RunFinding.findBySessionId(b)
    ]);

    const diff = compareRuns(
      { session: sessionA, requests: requestsA, findings: findingsA },
      { session: sessionB, requests: requestsB, findings: findingsB }
    );

    res.json({
      success: true,
      data: diff
    });
  } catch (err) {
    console.error('Compare sessions error:', err);
    res.status(500).json({
      success: false,
      message: "Failed to compare runs",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};