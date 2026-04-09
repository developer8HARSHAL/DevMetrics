import express from "express";
import { handleTrack } from "../controllers/trackController.js";
import { validateApiKey } from "../middleware/auth.js";

const router = express.Router();

// POST /track → receives SDK data
router.post("/",validateApiKey, handleTrack);

export default router;
