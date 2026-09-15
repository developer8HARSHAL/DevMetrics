import api from "./api";

export const fetchTests = () =>
  api.get("/tests");

export const fetchTest = (id) =>
  api.get(`/tests/${encodeURIComponent(id)}`);

export const createTest = ({ name, description = "", projectId }) =>
  api.post("/tests", {
    name,
    description,
    projectId,
  });

export const updateTest = (id, payload) =>
  api.patch(`/tests/${encodeURIComponent(id)}`, payload);

export const deleteTest = (id) =>
  api.delete(`/tests/${encodeURIComponent(id)}`);

export const createTestRequest = (testId, payload) =>
  api.post(
    `/tests/${encodeURIComponent(testId)}/requests`,
    payload
  );

export const updateTestRequest = (testId, requestId, payload) =>
  api.patch(
    `/tests/${encodeURIComponent(testId)}/requests/${encodeURIComponent(requestId)}`,
    payload
  );

export const deleteTestRequest = (testId, requestId) =>
  api.delete(
    `/tests/${encodeURIComponent(testId)}/requests/${encodeURIComponent(requestId)}`
  );

export const fetchTestRuns = (testId) =>
  api.get(`/tests/${encodeURIComponent(testId)}/runs`);

export const runTest = (testId) =>
  api.post(
    `/tests/${encodeURIComponent(testId)}/runs`,
    {}
  );