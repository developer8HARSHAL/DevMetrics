import { ArrowLeft, Play, Plus, Save } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useTestEditor } from "../hooks/useTestEditor";
import { getRunStatusVariant } from "../lib/runs";
import Button from "../components/ui/Button";
import Card, { CardContent } from "../components/ui/Card";
import SectionHeader from "../components/ui/SectionHeader";
import ErrorState from "../components/ui/ErrorState";
import EmptyState from "../components/ui/EmptyState";
import { Skeleton } from "../components/ui/Loader";
import Badge from "../components/ui/Badge";
import { Input, Select, Textarea } from "../components/ui/Form";
import RequestRow from "../components/RequestRow";
import { FlaskConical } from "lucide-react";

export default function TestDetails() {
  const navigate = useNavigate();
  const { id: testId } = useParams();

  const {
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
    handleSaveRequest,
    handleDeleteRequest,
    handleRunTest,
  } = useTestEditor(testId);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
    );
  }

  if (error && !test) {
    return <ErrorState description={error} onRetry={loadTest} />;
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow={
          projectId ? (
            <button
              type="button"
              className="hover:text-foreground"
              onClick={() => navigate("/tests")}
            >
              Tests / {projects.find((project) => project.id === projectId)?.name || "Project"}
            </button>
          ) : (
            "Tests"
          )
        }
        title={name || "Untitled test"}
        description="Configure the requests DevMetrics will execute."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate("/tests")}>
              <ArrowLeft size={16} />
              Back
            </Button>
            <Button variant="outline" disabled={savingTest} onClick={handleSaveTest}>
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

      <section>
        <SectionHeader eyebrow="Configuration" title="Test setup" description="Define this test and where it belongs." />
        <Card className="mt-4">
          <CardContent className="grid gap-5 md:grid-cols-[1.4fr_1fr]">
            <label className="grid gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Test name</span>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={255}
                placeholder="e.g. Production API smoke test"
              />
            </label>

            <label className="grid gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Project</span>
              <Select
                value={projectId || ""}
                onChange={(e) => setProjectId(e.target.value || null)}
                disabled={projectsLoading || projects.length === 0}
              >
                <option value="">Select a project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </Select>
            </label>

            <label className="grid gap-2 md:col-span-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Description</span>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-24"
                placeholder="What does this test validate?"
              />
            </label>
          </CardContent>
        </Card>
      </section>

      <section>
        <SectionHeader
          eyebrow="Requests"
          title={`${requestCount} request${requestCount === 1 ? "" : "s"}`}
          description="Requests run sequentially in their configured order."
          actions={
            requestCount > 0 ? (
              <Button variant="outline" onClick={handleAddRequest}>
                <Plus size={16} />
                Add request
              </Button>
            ) : null
          }
        />

        {requests.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={FlaskConical}
              title="No requests configured yet"
              description="Add the first request this test should execute."
              action={
                <Button onClick={handleAddRequest}>
                  <Plus size={16} />
                  Add first request
                </Button>
              }
            />
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {requests.map((request, index) => (
              <RequestRow
                key={request.id || `new-request-${index}`}
                request={request}
                index={index}
                onUpdate={updateLocalRequest}
                onSave={handleSaveRequest}
                onDelete={handleDeleteRequest}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeader eyebrow="Runs" title="Run history" description="Previous executions of this test." />
        <Card className="mt-4 overflow-hidden">
          {runsLoading ? (
            <div className="space-y-3 p-5">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : runs.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-muted-foreground">No runs yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {runs.map((run) => (
                <button
                  key={run.id}
                  type="button"
                  onClick={() => navigate(`/sessions/${run.id}`)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-medium">{run.name || "Untitled run"}</span>
                      <Badge variant={getRunStatusVariant(run.run_status)}>{run.run_status}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {run.started_at ? new Date(run.started_at).toLocaleString() : "Unknown time"}
                    </p>
                  </div>
                  <div className="hidden items-center gap-5 text-xs text-muted-foreground lg:flex">
                    <span>{run.request_count || 0} requests</span>
                    <span>{run.error_count || 0} errors</span>
                    <span>{Math.round(Number(run.avg_response_time || 0))} ms</span>
                    <span>{run.finding_count || 0} findings</span>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">View</span>
                </button>
              ))}
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}