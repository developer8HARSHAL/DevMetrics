import Test from "../models/Test.js";
import TestRequest from "../models/TestRequest.js";

const VALID_METHODS = new Set([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
  "HEAD",
]);

function validateTestInput({ name }) {
  if (typeof name !== "string" || !name.trim()) {
    return "name is required";
  }

  if (name.trim().length > 255) {
    return "name must be 255 characters or fewer";
  }

  return null;
}

function validateRequestInput({
  method,
  url,
  position,
  timeoutMs,
  expectedStatus,
}) {
  const normalizedMethod =
    typeof method === "string" ? method.toUpperCase() : "";

  if (!VALID_METHODS.has(normalizedMethod)) {
    return "method must be a supported HTTP method";
  }

  if (typeof url !== "string" || !url.trim()) {
    return "url is required";
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(url);
  } catch {
    return "url must be a valid URL";
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return "url must use http or https";
  }

  if (
    position !== undefined &&
    (!Number.isInteger(position) || position < 0)
  ) {
    return "position must be a non-negative integer";
  }

  if (
    timeoutMs !== undefined &&
    (!Number.isInteger(timeoutMs) || timeoutMs <= 0)
  ) {
    return "timeoutMs must be a positive integer";
  }

  if (
    expectedStatus !== undefined &&
    expectedStatus !== null &&
    (!Number.isInteger(expectedStatus) ||
      expectedStatus < 100 ||
      expectedStatus > 599)
  ) {
    return "expectedStatus must be between 100 and 599";
  }

  return null;
}

export const createTest = async (req, res) => {
  try {
    const { name, description } = req.body;
    const error = validateTestInput({ name });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    const test = await Test.create({
      apiKey: req.apiKeyDoc.key,
      name: name.trim(),
      description:
        typeof description === "string" ? description.trim() : "",
    });

    return res.status(201).json({
      success: true,
      data: test,
    });
  } catch (err) {
    console.error("Create test error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to create test",
      error:
        process.env.NODE_ENV === "development"
          ? err.message
          : undefined,
    });
  }
};

export const listTests = async (req, res) => {
  try {
    const tests = await Test.findAllByApiKey(req.apiKeyDoc.key);

    return res.json({
      success: true,
      data: tests,
    });
  } catch (err) {
    console.error("List tests error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch tests",
    });
  }
};

export const getTest = async (req, res) => {
  try {
    const test = await Test.findByIdForApiKey(
      req.params.id,
      req.apiKeyDoc.key
    );

    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found",
      });
    }

    const requests = await TestRequest.findByTestId(test.id);

    return res.json({
      success: true,
      data: {
        test,
        requests,
      },
    });
  } catch (err) {
    console.error("Get test error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch test",
    });
  }
};

export const updateTest = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (
      name !== undefined &&
      (typeof name !== "string" || !name.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "name must be a non-empty string",
      });
    }

    const test = await Test.update(
      req.params.id,
      req.apiKeyDoc.key,
      {
        name: name === undefined ? undefined : name.trim(),
        description:
          description === undefined
            ? undefined
            : String(description).trim(),
      }
    );

    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found or nothing to update",
      });
    }

    return res.json({
      success: true,
      data: test,
    });
  } catch (err) {
    console.error("Update test error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to update test",
    });
  }
};

export const deleteTest = async (req, res) => {
  try {
    const deleted = await Test.delete(
      req.params.id,
      req.apiKeyDoc.key
    );

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Test not found",
      });
    }

    return res.json({
      success: true,
      message: "Test deleted successfully",
    });
  } catch (err) {
    console.error("Delete test error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to delete test",
    });
  }
};

export const createTestRequest = async (req, res) => {
  try {
    const test = await Test.findByIdForApiKey(
      req.params.testId,
      req.apiKeyDoc.key
    );

    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found",
      });
    }

    const payload = req.body;

    const error = validateRequestInput(payload);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    const request = await TestRequest.create({
      testId: test.id,
      position: payload.position ?? 0,
      method: payload.method,
      url: payload.url.trim(),
      headers:
        payload.headers &&
        typeof payload.headers === "object" &&
        !Array.isArray(payload.headers)
          ? payload.headers
          : {},
      body:
        payload.body === undefined
          ? null
          : payload.body,
      timeoutMs: payload.timeoutMs ?? 5000,
      expectedStatus:
        payload.expectedStatus === undefined
          ? null
          : payload.expectedStatus,
    });

    return res.status(201).json({
      success: true,
      data: request,
    });
  } catch (err) {
    console.error("Create test request error:", err);

    if (err.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "A request already exists at this position",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create test request",
    });
  }
};

export const updateTestRequest = async (req, res) => {
  try {
    const test = await Test.findByIdForApiKey(
      req.params.testId,
      req.apiKeyDoc.key
    );

    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found",
      });
    }

    const existing = await TestRequest.findByIdForTest(
      req.params.requestId,
      test.id
    );

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Test request not found",
      });
    }

    const payload = {
      ...existing,
      ...req.body,
    };

    const error = validateRequestInput(payload);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    const request = await TestRequest.update(
      existing.id,
      test.id,
      {
        position: req.body.position,
        method: req.body.method,
        url: req.body.url,
        headers: req.body.headers,
        body:
          req.body.body === undefined
            ? undefined
            : req.body.body,
        timeoutMs: req.body.timeoutMs,
        expectedStatus:
          req.body.expectedStatus === undefined
            ? undefined
            : req.body.expectedStatus,
      }
    );

    return res.json({
      success: true,
      data: request,
    });
  } catch (err) {
    console.error("Update test request error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to update test request",
    });
  }
};

export async function listTestRuns(req, res) {
  try {
    const runs = await Session.findByTestId(req.params.testId);
    return res.json({ runs });
  } catch (error) {
    console.error("listTestRuns:", error);
    return res.status(500).json({ error: "Failed to load test runs" });
  }
}

export const deleteTestRequest = async (req, res) => {
  try {
    const test = await Test.findByIdForApiKey(
      req.params.testId,
      req.apiKeyDoc.key
    );

    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found",
      });
    }

    const deleted = await TestRequest.delete(
      req.params.requestId,
      test.id
    );

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Test request not found",
      });
    }

    return res.json({
      success: true,
      message: "Test request deleted successfully",
    });
  } catch (err) {
    console.error("Delete test request error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to delete test request",
    });
  }
};