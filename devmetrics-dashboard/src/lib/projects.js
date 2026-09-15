import api from "./api";

export const fetchProjects = () =>
  api.get("/projects");

export const fetchProject = (id) =>
  api.get(`/projects/${encodeURIComponent(id)}`);

export const createProject = ({ name, description = "" }) =>
  api.post("/projects", {
    name,
    description,
  });

export const updateProject = (id, payload) =>
  api.patch(`/projects/${encodeURIComponent(id)}`, payload);

export const deleteProject = (id) =>
  api.delete(`/projects/${encodeURIComponent(id)}`);

export const fetchProjectTests = (projectId) =>
  api.get(`/projects/${encodeURIComponent(projectId)}/tests`);