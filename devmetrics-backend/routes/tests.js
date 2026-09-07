import express from "express";

import {
  createTest,
  listTests,
  getTest,
  updateTest,
  deleteTest,
  createTestRequest,
  updateTestRequest,
  deleteTestRequest,
  listTestRuns
} from "../controllers/testController.js";

import {
  createTestRun
} from "../controllers/testRunController.js";

import { validateApiKey } from "../middleware/auth.js";

const router = express.Router();

router.use(validateApiKey);

router.post("/", createTest);
router.get("/", listTests);
router.get("/:testId/runs", listTestRuns);
router.get("/:id", getTest);
router.patch("/:id", updateTest);
router.delete("/:id", deleteTest);

/*
 * Start a real backend-generated Run.
 */
router.post(
  "/:testId/runs",
  createTestRun
);

router.post(
  "/:testId/requests",
  createTestRequest
);

router.patch(
  "/:testId/requests/:requestId",
  updateTestRequest
);

router.delete(
  "/:testId/requests/:requestId",
  deleteTestRequest
);

export default router;