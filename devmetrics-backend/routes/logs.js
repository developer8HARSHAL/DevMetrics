import express from "express";
import { getLogs, getLogsSummary } from "../controllers/logsController.js";

const router = express.Router();

// GET /logs → get all logs
router.get("/", getLogs);

// GET /logs/summary → aggregated stats
router.get("/summary", getLogsSummary);

export default router;
