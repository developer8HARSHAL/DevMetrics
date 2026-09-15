import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchTest,
  fetchTestRuns,
  updateTest,
  createTestRequest,
  updateTestRequest,
  deleteTestRequest,
  runTest,
} from "../lib/tests";
import { fetchProjects } from "../lib/projects";
import { unwrapData } from "../lib/api";
import {
  requestToForm,
  textToHeaders,
  parseBody,
} from "../lib/testFormHelpers";

/**
 * Owns everything about editing and running a single test:
 * loading the test + requests + run history, saving edits,
 * deleting requests, and starting a run.
 */
export function useTestEditor(testId) {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [test, setTest] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [savingTest, setSavingTest] = useState(false);
  const [runningTest, setRunningTest] = useState(false);
  const [runs, setRuns] = useState([]);
  const [runsLoading, setRunsLoading] = useState(true);

  const loadTest = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetchTest(testId);
      const data = unwrapData(response);

      if (!data) {
        throw new Error("Test data was not returned.");
      }

      setTest(data);
      setName(data.name ?? "");
      setDescription(data.description ?? "");
      setProjectId(data.project_id ?? null);

      const testRequests = Array.isArray(data.requests)
        ? data.requests
        : [];

      setRequests(
        [...testRequests]
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
          .map(requestToForm)
      );
    } catch (err) {
      setError(err?.message || "Failed to load test.");
    } finally {
      setLoading(false);
    }
  }, [testId]);

  useEffect(() => {
    loadTest();
  }, [loadTest]);

  useEffect(() => {
    let cancelled = false;

    async function loadProjects() {
      try {
        setProjectsLoading(true);

        const response = await fetchProjects();
        const data = unwrapData(response);

        if (!cancelled) {
          setProjects(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load projects:", err);
          setProjects([]);
        }
      } finally {
        if (!cancelled) {
          setProjectsLoading(false);
        }
      }
    }

    loadProjects();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadRuns() {
      try {
        setRunsLoading(true);

        const response = await fetchTestRuns(testId);
        const data = unwrapData(response);

        if (!cancelled) {
          setRuns(data?.runs || []);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load test runs:", err);
          setRuns([]);
        }
      } finally {
        if (!cancelled) {
          setRunsLoading(false);
        }
      }
    }

    loadRuns();

    return () => {
      cancelled = true;
    };
  }, [testId]);

  const requestCount = requests.length;

  const canRun = useMemo(() => {
    return (
      !runningTest &&
      requestCount > 0 &&
      requests.every((request) => request.url.trim().length > 0)
    );
  }, [runningTest, requestCount, requests]);

  async function handleSaveTest() {
    if (!name.trim()) {
      const message = "Test name is required.";
      setError(message);
      return false;
    }

    if (!projectId) {
      const message = "Test must belong to a project.";
      setError(message);
      return false;
    }

    try {
      setSavingTest(true);
      setError("");

      const response = await updateTest(testId, {
        name: name.trim(),
        description: description.trim(),
        projectId,
      });

      const updated = unwrapData(response);

      if (updated) {
        setTest((current) => ({
          ...current,
          ...updated,
        }));
      }

      return true;
    } catch (err) {
      setError(err?.message || "Failed to save test.");
      return false;
    } finally {
      setSavingTest(false);
    }
  }

  async function handleAddRequest() {
    try {
      setError("");

      const position = requests.length;

      const response = await createTestRequest(testId, {
        position,
        method: "GET",
        url: "https://example.com",
        headers: {},
        body: null,
        timeoutMs: 5000,
        expectedStatus: 200,
      });

      const created = unwrapData(response);

      if (!created) {
        throw new Error(
          "Request was created but no request data was returned."
        );
      }

      setRequests((current) => [
        ...current,
        requestToForm(created),
      ]);
    } catch (err) {
      setError(err?.message || "Failed to add request.");
    }
  }

  function updateLocalRequest(index, field, value) {
    setRequests((current) =>
      current.map((request, requestIndex) =>
        requestIndex === index
          ? { ...request, [field]: value }
          : request
      )
    );
  }

  async function handleSaveRequest(index) {
    const request = requests[index];

    if (!request.url.trim()) {
      const message = `Request ${index + 1} needs a URL.`;
      setError(message);
      throw new Error(message);
    }

    let parsedBody;

    try {
      parsedBody = parseBody(request.body);
    } catch (err) {
      const message = `Request ${index + 1}: ${err.message}`;
      setError(message);
      throw new Error(message);
    }

    const expectedStatus =
      request.expectedStatus === ""
        ? null
        : Number(request.expectedStatus);

    if (
      expectedStatus !== null &&
      (!Number.isInteger(expectedStatus) ||
        expectedStatus < 100 ||
        expectedStatus > 599)
    ) {
      const message =
        `Request ${index + 1}: expected status must be between 100 and 599.`;

      setError(message);
      throw new Error(message);
    }

    const timeoutMs = Number(request.timeoutMs);

    if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
      const message =
        `Request ${index + 1}: timeout must be a positive integer.`;

      setError(message);
      throw new Error(message);
    }

    try {
      setError("");

      setRequests((current) =>
        current.map((item, itemIndex) =>
          itemIndex === index
            ? { ...item, saving: true }
            : item
        )
      );

      const payload = {
        position: request.position,
        method: request.method,
        url: request.url.trim(),
        headers: textToHeaders(request.headers),
        body: parsedBody,
        timeoutMs,
        expectedStatus,
      };

      let response;

      if (request.id) {
        response = await updateTestRequest(
          testId,
          request.id,
          payload
        );
      } else {
        response = await createTestRequest(testId, payload);
      }

      const saved = unwrapData(response);

      if (!saved) {
        throw new Error(
          "Request was saved but no request data was returned."
        );
      }

      setRequests((current) =>
        current.map((item, itemIndex) =>
          itemIndex === index
            ? requestToForm(saved)
            : item
        )
      );

      return true;
    } catch (err) {
      setError(
        err?.message || `Failed to save request ${index + 1}.`
      );

      setRequests((current) =>
        current.map((item, itemIndex) =>
          itemIndex === index
            ? { ...item, saving: false }
            : item
        )
      );

      throw err;
    }
  }

  function handleSaveRequestFromUI(index) {
    handleSaveRequest(index).catch(() => {});
  }

  async function handleDeleteRequest(index) {
    const request = requests[index];

    if (!request.id) {
      setRequests((current) =>
        current
          .filter((_, requestIndex) => requestIndex !== index)
          .map((item, position) => ({
            ...item,
            position,
          }))
      );

      return;
    }

    try {
      setError("");

      setRequests((current) =>
        current.map((item, itemIndex) =>
          itemIndex === index
            ? { ...item, deleting: true }
            : item
        )
      );

      await deleteTestRequest(testId, request.id);

      setRequests((current) =>
        current
          .filter((_, requestIndex) => requestIndex !== index)
          .map((item, position) => ({
            ...item,
            position,
          }))
      );
    } catch (err) {
      setError(
        err?.message || `Failed to delete request ${index + 1}.`
      );

      setRequests((current) =>
        current.map((item, itemIndex) =>
          itemIndex === index
            ? { ...item, deleting: false }
            : item
        )
      );
    }
  }

async function handleRunTest() {
  if (!name.trim()) {
    setError("Test name is required.");
    return;
  }

  if (requests.length === 0) {
    setError("Add at least one request before running the test.");
    return;
  }

  const testSaved = await handleSaveTest();

  if (!testSaved) {
    return;
  }

  for (let index = 0; index < requests.length; index += 1) {
    try {
      await handleSaveRequest(index);
    } catch {
      return;
    }
  }

  try {
    setRunningTest(true);
    setError("");


const response = await runTest(testId);
const run = unwrapData(response);

if (!run?.runId) {
  throw new Error("Run started, but no Run ID was returned.");
}

navigate(`/sessions/${run.runId}`);
  } catch (err) {
    setError(err?.message || "Failed to start test run.");
    setRunningTest(false);
  }
}

  return {
    loading,
    error,
    test,
    name,
    description,
    projectId,
    projects,
    projectsLoading,
    requests,
    savingTest,
    runningTest,
    runs,
    runsLoading,
    requestCount,
    canRun,
    setName,
    setDescription,
    setProjectId,
    loadTest,
    handleSaveTest,
    handleAddRequest,
    updateLocalRequest,
    handleSaveRequest: handleSaveRequestFromUI,
    handleDeleteRequest,
    handleRunTest,
  };
}