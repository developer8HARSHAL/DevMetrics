import express from "express";
import {
  createApiKey,
  listApiKeys,
  getApiKey,
  updateApiKey,
  revokeApiKey,
  getApiKeyStats
} from "../controllers/apiKeyController.js";
import { validateAdminKey } from "../middleware/auth.js";

const router = express.Router();

// All API key management routes require admin authentication
router.use(validateAdminKey);

// CRUD operations for API keys
router.post("/", createApiKey);           // Create new API key
router.get("/", listApiKeys);             // List all API keys
router.get("/:key", getApiKey);           // Get specific API key
router.put("/:key", updateApiKey);        // Update API key
router.delete("/:key", revokeApiKey);     // Revoke/delete API key
router.get("/:key/stats", getApiKeyStats); // Get API key usage stats

export default router;