import express from "express";

import {
  createProject,
  listProjects,
  getProject,
  updateProject,
  deleteProject,
  listProjectTests
} from "../controllers/projectController.js";

import { validateApiKey } from "../middleware/auth.js";

const router = express.Router();

router.use(validateApiKey);

router.post("/", createProject);
router.get("/", listProjects);
router.get("/:projectId/tests", listProjectTests);
router.get("/:id", getProject);
router.patch("/:id", updateProject);
router.delete("/:id", deleteProject);

export default router;