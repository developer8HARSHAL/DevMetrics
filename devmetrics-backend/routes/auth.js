import express from "express";
import { registerUser, getUserApiKey } from "../controllers/authController.js";

const router = express.Router();

// Register new user and create API key
router.post("/register", registerUser);

// Get user's API key
router.get("/api-key/:userId", getUserApiKey);

export default router;