
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Play, Plus, Save, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  fetchTest,
  fetchTestRuns,
  updateTest,
  createTestRequest,
  updateTestRequest,
  deleteTestRequest,
  runTest,
} from "../lib/tests";
import Button from "../components/ui/Button";
import Card, { CardContent } from "../components/ui/Card";
import SectionHeader from "../components/ui/SectionHeader";
import ErrorState from "../components/ui/ErrorState";
import Skeleton from "../components/ui/Skeleton";
import Badge from "../components/ui/Badge";

function normalizeHeaders(headers) {
  if (!headers || typeof headers !== "object") return {};
  return headers;
}

function headersToText(headers) {
  return Object.entries(normalizeHeaders(headers))
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
}

function textToHeaders(value) {
  const result = {};
  const lines = String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    const headerValue = line.slice(separatorIndex + 1).trim();

    if (key) result[key] = headerValue;
  }

  return result;
}

function requestToForm(request) {
  return {
    id: request.id,
    position: request.position ?? 0,
    method: request.method ?? "GET",
    url: request.url ?? "",
    headers: headersToText(request.headers),
    body:
      request.body == null
        ? ""
        : typeof request.body === "string"
          ? request.body
          : JSON.stringify(request.body, null, 2),
    timeoutMs: request.timeout_ms ?? request.timeoutMs ?? 5000,
    expectedStatus:
      request.expected_status ?? request.expectedStatus ?? "",
    saving: false,
    deleting: false,
  };
}

function parseBody(bodyText) {
  const value = String(bodyText || "").trim();
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch {
    throw new Error("Request body must contain valid JSON.");
  }
}

export default function TestDetails() {
  const navigate = useNavigate();
  const { id: testId } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [test, setTest] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
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
      const data = response?.data?.data ?? response?.data;

      if (!data) throw new Error("Test data was not returned.");

      setTest(data);
      setName(data.name ?? "");
      setDescription(data.description ?? "");

      const testRequests = Array.isArray(data.requests) ? data.requests : [];

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

    async function loadRuns() {
      try {
        setRunsLoading(true);
        const response = await fetchTestRuns(testId);
        const data = response?.data?.data ?? response?.data;
        if (!cancelled) setRuns(data?.runs || []);
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load test runs:", err);
          setRuns([]);
        }
      } finally {
        if (!cancelled) setRunsLoading(false);
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
      setError("Test name is required.");
      return;
    }

    try {
      setSavingTest(true);
      setError("");

      const response = await updateTest(testId, {
        name: name.trim(),
        description: description.trim(),
      });

      const updated = response?.data?.data ?? response?.data;

      if (updated) {
        setTest((current) => ({
          ...current,
          ...updated,
        }));
      }
    } catch (err) {
      setError(err?.message || "Failed to save test.");
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

      const created = response?.data?.data ?? response?.data;

      if (!created) {
        throw new Error("Request was created but no request data was returned.");
      }

      setRequests((current) => [...current, requestToForm(created)]);
    } catch (err) {
      setError(err?.message || "Failed to add request.");
    }
  }

  function updateLocalRequest(index, field, value) {
    setRequests((current) =>
      current.map((request, requestIndex) =>
        requestIndex === index ? { ...request, [field]: value } : request
      )
    );
  }

  async function handleSaveRequest(index) {
    const request = requests[index];

    if (!request.url.trim()) {
      setError(`Request ${index + 1} needs a URL.`);
      return;
    }

    let parsedBody;

    try {
      parsedBody = parseBody(request.body);
    } catch (err) {
      setError(`Request ${index + 1}: ${err.message}`);
      return;
    }

    const expectedStatus =
      request.expectedStatus === "" ? null : Number(request.expectedStatus);

    if (
      expectedStatus !== null &&
      (!Number.isInteger(expectedStatus) ||
        expectedStatus < 100 ||
        expectedStatus > 599)
    ) {
      setError(
        `Request ${index + 1}: expected status must be between 100 and 599.`
      );
      return;
    }

    const timeoutMs = Number(request.timeoutMs);

    if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
      setError(
        `Request ${index + 1}: timeout must be a positive integer.`
      );
      return;
    }

    try {
      setError("");

      setRequests((current) =>
        current.map((item, itemIndex) =>
          itemIndex === index ? { ...item, saving: true } : item
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
        response = await updateTestRequest(testId, request.id, payload);
      } else {
        response = await createTestRequest(testId, payload);
      }

      const saved = response?.data?.data ?? response?.data;

      if (!saved) {
        throw new Error("Request was saved but no request data was returned.");
      }

      setRequests((current) =>
        current.map((item, itemIndex) =>
          itemIndex === index ? requestToForm(saved) : item
        )
      );
    } catch (err) {
      setError(err?.message || `Failed to save request ${index + 1}.`);

      setRequests((current) =>
        current.map((item, itemIndex) =>
          itemIndex === index ? { ...item, saving: false } : item
        )
      );
    }
  }

  async function handleDeleteRequest(index) {
    const request = requests[index];

    if (!request.id) {
      setRequests((current) =>
        current
          .filter((_, requestIndex) => requestIndex !== index)
          .map((item, position) => ({ ...item, position }))
      );
      return;
    }

    try {
      setError("");

      setRequests((current) =>
        current.map((item, itemIndex) =>
          itemIndex === index ? { ...item, deleting: true } : item
        )
      );

      await deleteTestRequest(testId, request.id);

      setRequests((current) =>
        current
          .filter((_, requestIndex) => requestIndex !== index)
          .map((item, position) => ({ ...item, position }))
      );
    } catch (err) {
      setError(err?.message || `Failed to delete request ${index + 1}.`);

      setRequests((current) =>
        current.map((item, itemIndex) =>
          itemIndex === index ? { ...item, deleting: false } : item
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

    await handleSaveTest();

    for (let index = 0; index < requests.length; index += 1) {
      await handleSaveRequest(index);
    }

    try {
      setRunningTest(true);
      setError("");

      const response = await runTest(testId);
      const runId = response?.runId || response?.data?.runId;

      if (!runId) {
        throw new Error("Run started but no Run ID was returned.");
      }

      navigate(`/sessions/${runId}`);
    } catch (err) {
      setError(err?.message || "Failed to start test run.");
      setRunningTest(false);
    }
  }

  function runStatusVariant(status) {
    if (status === "completed") return "outline";
    if (status === "failed") return "destructive";
    if (status === "cancelled") return "outline";
    if (status === "running") return "primary";
    return "warning";
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 max-w-md" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (error && !test) {
    return <ErrorState description={error} onRetry={loadTest} />;
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Tests"
        title={name || "Untitled test"}
        description="Configure the requests that DevMetrics will execute."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/tests")}
            >
              <ArrowLeft size={16} />
              Back
            </Button>

            <Button
              variant="outline"
              disabled={savingTest}
              onClick={handleSaveTest}
            >
              <Save size={16} />
              {savingTest ? "Saving..." : "Save"}
            </Button>

            <Button disabled={!canRun} onClick={handleRunTest}>
              <Play size={16} />
              {runningTest ? "Starting..." : "Run test"}
            </Button>
          </div>
        }
      />

      {error && (
        <Card className="border-destructive/30">
          <CardContent className="py-4">
            <p className="text-sm text-destructive-strong">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm">
        <CardContent className="space-y-5">
          <div>
            <label
              htmlFor="test-name"
              className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
            >
              Test name
            </label>
            <input
              id="test-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="dm-input w-full"
              maxLength={255}
              placeholder="e.g. Production API smoke test"
            />
          </div>

          <div>
            <label
              htmlFor="test-description"
              className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
            >
              Description
            </label>
            <textarea
              id="test-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="dm-input min-h-24 w-full resize-y"
              placeholder="What does this test validate?"
            />
          </div>
        </CardContent>
      </Card>

      <SectionHeader
        eyebrow="Requests"
        title={`${requestCount} request${requestCount === 1 ? "" : "s"}`}
        description="Requests run sequentially in their configured order."
        actions={
          <Button variant="outline" onClick={handleAddRequest}>
            <Plus size={16} />
            Add request
          </Button>
        }
      />

      {requests.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-12 text-center">
            <p className="font-data text-sm text-muted-foreground">
              No requests configured yet.
            </p>
            <Button className="mt-4" onClick={handleAddRequest}>
              <Plus size={16} />
              Add first request
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request, index) => (
            <Card
              key={request.id || `new-request-${index}`}
              className="shadow-sm"
            >
              <CardContent className="space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">#{index + 1}</Badge>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Request
                    </span>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={request.deleting}
                    onClick={() => handleDeleteRequest(index)}
                  >
                    <Trash2 size={15} />
                    {request.deleting ? "Deleting..." : "Delete"}
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-[150px_1fr]">
                  <label className="grid gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Method
                    </span>
                    <select
                      value={request.method}
                      onChange={(event) =>
                        updateLocalRequest(
                          index,
                          "method",
                          event.target.value
                        )
                      }
                      className="dm-input dm-select"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="PATCH">PATCH</option>
                      <option value="DELETE">DELETE</option>
                      <option value="OPTIONS">OPTIONS</option>
                      <option value="HEAD">HEAD</option>
                    </select>
                  </label>

                  <label className="grid gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      URL
                    </span>
                    <input
                      value={request.url}
                      onChange={(event) =>
                        updateLocalRequest(index, "url", event.target.value)
                      }
                      className="dm-input w-full font-data"
                      placeholder="https://api.example.com/health"
                    />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Headers
                    </span>
                    <textarea
                      value={request.headers}
                      onChange={(event) =>
                        updateLocalRequest(
                          index,
                          "headers",
                          event.target.value
                        )
                      }
                      className="dm-input min-h-32 resize-y font-mono text-xs"
                      placeholder={`Authorization: Bearer ...
Content-Type: application/json`}
                    />
                    <span className="text-[11px] text-muted-foreground">
                      One header per line: <code>Name: Value</code>
                    </span>
                  </label>

                  <label className="grid gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      JSON body
                    </span>
                    <textarea
                      value={request.body}
                      onChange={(event) =>
                        updateLocalRequest(
                          index,
                          "body",
                          event.target.value
                        )
                      }
                      className="dm-input min-h-32 resize-y font-mono text-xs"
                      placeholder={`{
  "example": true
}`}
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Timeout (ms)
                    </span>
                    <input
                      type="number"
                      min="1"
                      value={request.timeoutMs}
                      onChange={(event) =>
                        updateLocalRequest(
                          index,
                          "timeoutMs",
                          event.target.value
                        )
                      }
                      className="dm-input"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Expected status
                    </span>
                    <input
                      type="number"
                      min="100"
                      max="599"
                      value={request.expectedStatus}
                      onChange={(event) =>
                        updateLocalRequest(
                          index,
                          "expectedStatus",
                          event.target.value
                        )
                      }
                      className="dm-input"
                      placeholder="200"
                    />
                  </label>
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    disabled={request.saving}
                    onClick={() => handleSaveRequest(index)}
                  >
                    <Save size={15} />
                    {request.saving ? "Saving..." : "Save request"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

<section>
  <SectionHeader eyebrow="Runs" title="Run History" description="Previous executions of this test." />
  <Card className="mt-4 overflow-hidden shadow-sm">
    {runsLoading ? <div className="p-5 text-sm text-muted-foreground">Loading runs...</div> : runs.length === 0 ? <div className="p-5 text-sm text-muted-foreground">No runs yet.</div> : (
      <div className="divide-y divide-border">
        {runs.map((run) => (
          <div key={run.id} className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium">{run.name || "Untitled run"}</p>
                <Badge variant={run.run_status === "completed" ? "outline" : run.run_status === "failed" ? "destructive" : "warning"}>{run.run_status}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{run.started_at ? new Date(run.started_at).toLocaleString() : "Unknown time"}</p>
            </div>
            <div className="hidden gap-6 text-xs md:flex">
              <span>{run.request_count || 0} requests</span>
              <span>{run.error_count || 0} errors</span>
              <span>{Math.round(Number(run.avg_response_time || 0))} ms</span>
              <span>{run.finding_count || 0} findings</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate(`/sessions/${run.id}`)}>View report</Button>
          </div>
        ))}
      </div>
    )}
  </Card>
</section>
    </div>
  );
}
