import express from "express";
import { handleTrack } from "../controllers/trackController.js";

const router = express.Router();

// POST /track → receives SDK data
router.post("/", handleTrack);

export default router;
