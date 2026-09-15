import api from "./api";

function adminHeaders() {
  return {
    "x-admin-key": import.meta.env.VITE_ADMIN_KEY || "",
  };
}

export const registerUser = async (userId, email) => {
  const response = await api.post("/auth/register", {
    userId,
    email,
  });

  return response.data;
};

export const getUserApiKey = async (userId) => {
  const response = await api.get(
    `/auth/api-key/${encodeURIComponent(userId)}`
  );

  return response.data;
};

export const createApiKey = (data) =>
  api.post("/apikey", data, {
    headers: adminHeaders(),
  }).then((res) => res.data);

export const fetchApiKeys = () =>
  api.get("/apikey", {
    headers: adminHeaders(),
  }).then((res) => res.data);

export const updateApiKey = (key, data) =>
  api
    .put(`/apikey/${encodeURIComponent(key)}`, data, {
      headers: adminHeaders(),
    })
    .then((res) => res.data);

export const revokeApiKey = (key) =>
  api
    .delete(`/apikey/${encodeURIComponent(key)}`, {
      headers: adminHeaders(),
    })
    .then((res) => res.data);

export const deleteApiKey = (key) =>
  api
    .delete(`/apikey/${encodeURIComponent(key)}`, {
      params: { permanent: true },
      headers: adminHeaders(),
    })
    .then((res) => res.data);