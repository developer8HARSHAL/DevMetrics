import express from "express";
import {
  createSession,
  endSession,
  listSessions,
  getSessionDetail,
  getSharedSession,
  compareSessions
} from "../controllers/sessioncontroller.js";
import { validateApiKey } from "../middleware/auth.js";

const router = express.Router();

router.post("/", validateApiKey, createSession);
router.patch("/:id/end", validateApiKey, endSession);

// NOTE: /compare and /shared/:token must be declared before the /:id route
// below, or Express will match them as { id: "compare" } / { id: "shared" }.
router.get("/compare", validateApiKey, compareSessions);
router.get("/shared/:token", getSharedSession); // public — no auth, scoped by share_token

router.get("/", validateApiKey, listSessions);
router.get("/:id", validateApiKey, getSessionDetail);

export default router;