import Project from "../models/Project.js";
import Test from "../models/Test.js";

function validateProjectInput({ name }) {
  if (typeof name !== "string" || !name.trim()) {
    return "name is required";
  }

  if (name.trim().length > 255) {
    return "name must be 255 characters or fewer";
  }

  return null;
}

export const createProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    const error = validateProjectInput({ name });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    const project = await Project.create({
      apiKey: req.apiKeyDoc.key,
      name: name.trim(),
      description:
        typeof description === "string" ? description.trim() : "",
    });

    return res.status(201).json({
      success: true,
      data: project,
    });
  } catch (err) {
    console.error("Create project error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to create project",
      error:
        process.env.NODE_ENV === "development"
          ? err.message
          : undefined,
    });
  }
};

export const listProjects = async (req, res) => {
  try {
    const projects = await Project.findAllByApiKey(req.apiKeyDoc.key);

    return res.json({
      success: true,
      data: projects,
    });
  } catch (err) {
    console.error("List projects error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch projects",
    });
  }
};

export const getProject = async (req, res) => {
  try {
    const project = await Project.findByIdForApiKey(
      req.params.id,
      req.apiKeyDoc.key
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    return res.json({
      success: true,
      data: project,
    });
  } catch (err) {
    console.error("Get project error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch project",
    });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (
      name !== undefined &&
      (typeof name !== "string" || !name.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "name must be a non-empty string",
      });
    }

    const project = await Project.update(
      req.params.id,
      req.apiKeyDoc.key,
      {
        name: name === undefined ? undefined : name.trim(),
        description:
          description === undefined
            ? undefined
            : String(description).trim(),
      }
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found or nothing to update",
      });
    }

    return res.json({
      success: true,
      data: project,
    });
  } catch (err) {
    console.error("Update project error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to update project",
    });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const deleted = await Project.delete(
      req.params.id,
      req.apiKeyDoc.key
    );

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    return res.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (err) {
    console.error("Delete project error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to delete project",
    });
  }
};

export const listProjectTests = async (req, res) => {
  try {
    const project = await Project.findByIdForApiKey(
      req.params.projectId,
      req.apiKeyDoc.key
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const tests = await Test.findAllByProject(
      project.id,
      req.apiKeyDoc.key
    );

    return res.json({
      success: true,
      data: tests,
    });
  } catch (err) {
    console.error("List project tests error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch project tests",
    });
  }
};