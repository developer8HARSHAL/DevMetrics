import express from "express";
import {
  getOverview,
  getEndpointMetrics,
  getRecentRequests,
  getErrors
} from "../controllers/logsController.js";

const router = express.Router();

// Analytics endpoints for dashboard
router.get("/metrics/overview", getOverview);
router.get("/metrics/endpoint", getEndpointMetrics);
router.get("/metrics/recent", getRecentRequests);
router.get("/metrics/errors", getErrors);

export default router;