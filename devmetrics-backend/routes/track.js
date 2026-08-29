import express from "express";
import { handleTrack, handleTrackBatch } from "../controllers/trackController.js";
import { validateApiKey } from "../middleware/auth.js";

const router = express.Router();

// POST /track → receives SDK data (single event)
router.post("/", validateApiKey, handleTrack);

// POST /track/batch → receives batched desktop-agent data
router.post("/batch", validateApiKey, handleTrackBatch);

export default router;