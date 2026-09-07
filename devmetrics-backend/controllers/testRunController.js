import {
  startTestRun
} from "../services/testRunner.js";

export const createTestRun = async (
  req,
  res
) => {
  try {
    const { testId } = req.params;
    const { name } = req.body || {};

    const apiKey =
      req.apiKeyDoc.key;

    const run =
      await startTestRun({
        testId,
        apiKey,
        name
      });

    return res.status(202).json({
      success: true,
      message: "Test run started",
      data: {
        runId: run.id,
        status: run.run_status
      }
    });
  } catch (error) {
    console.error(
      "Create test run error:",
      error
    );

    const status =
      error.statusCode || 500;

    return res.status(status).json({
      success: false,
      message: error.message,
      error:
        process.env.NODE_ENV === "development"
          ? error.stack
          : undefined
    });
  }
};