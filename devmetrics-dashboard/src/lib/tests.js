import api from "./api";
import { getApiKey } from "./auth";

function authHeaders() {
  const apiKey = getApiKey();

  return apiKey
    ? {
        "x-api-key": apiKey,
      }
    : {};
}

export const fetchTests = () =>
  api.get("/tests", {
    headers: authHeaders(),
  });

export const fetchTest = (id) =>
  api.get(`/tests/${encodeURIComponent(id)}`, {
    headers: authHeaders(),
  });

export const createTest = ({ name, description = "" }) =>
  api.post(
    "/tests",
    {
      name,
      description,
    },
    {
      headers: authHeaders(),
    }
  );

export const updateTest = (id, payload) =>
  api.patch(
    `/tests/${encodeURIComponent(id)}`,
    payload,
    {
      headers: authHeaders(),
    }
  );

export const deleteTest = (id) =>
  api.delete(
    `/tests/${encodeURIComponent(id)}`,
    {
      headers: authHeaders(),
    }
  );

export const createTestRequest = (testId, payload) =>
  api.post(
    `/tests/${encodeURIComponent(testId)}/requests`,
    payload,
    {
      headers: authHeaders(),
    }
  );

export const updateTestRequest = (
  testId,
  requestId,
  payload
) =>
  api.patch(
    `/tests/${encodeURIComponent(testId)}/requests/${encodeURIComponent(requestId)}`,
    payload,
    {
      headers: authHeaders(),
    }
  );

export const deleteTestRequest = (
  testId,
  requestId
) =>
  api.delete(
    `/tests/${encodeURIComponent(testId)}/requests/${encodeURIComponent(requestId)}`,
    {
      headers: authHeaders(),
    }
  );

  export async function fetchTestRuns(testId) {
  return api.get(`/tests/${testId}/runs`);
}

export async function runTest(testId) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API key not configured");
  const response = await api.post(`/tests/${encodeURIComponent(testId)}/runs`, {}, {
    headers: { "x-api-key": apiKey }
  });
  return response.data.data;
}