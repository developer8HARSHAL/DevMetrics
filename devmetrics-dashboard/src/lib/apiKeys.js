import api from "./api";

export const createApiKey = (data) =>
  api.post("/apikey", data).then((res) => res.data);

export const fetchApiKeys = () =>
  api.get("/apikey").then((res) => res.data);

export const updateApiKey = (key, data) =>
  api.put(`/apikey/${encodeURIComponent(key)}`, data).then((res) => res.data);

export const revokeApiKey = (key) =>
  api.delete(`/apikey/${encodeURIComponent(key)}`).then((res) => res.data);

export const deleteApiKey = (key) =>
  api.delete(`/apikey/${encodeURIComponent(key)}?permanent=true`).then((res) => res.data);