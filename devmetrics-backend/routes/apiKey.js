import express from "express";
import {
  createApiKey,
  listApiKeys,
  getApiKey,
  updateApiKey,
  revokeApiKey
} from "../controllers/apiKeyController.js";
import { validateAdminKey } from "../middleware/auth.js";

const router = express.Router();

router.use(validateAdminKey);

router.post("/", createApiKey);
router.get("/", listApiKeys);
router.get("/:key", getApiKey);
router.put("/:key", updateApiKey);
router.delete("/:key", revokeApiKey);

export default router;