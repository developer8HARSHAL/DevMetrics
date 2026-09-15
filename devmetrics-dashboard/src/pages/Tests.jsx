import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronRight, Folder, Plus, X, FlaskConical } from "lucide-react";
import TestRow from "../components/TestRow";
import { Button, EmptyState, ErrorState, SectionHeader, Skeleton } from "../components/ui";
import { Input, Textarea } from "../components/ui/Form";
import { unwrapData } from "../lib/api";
import { createProject, fetchProjectTests, fetchProjects } from "../lib/projects";
import { createTest } from "../lib/tests";

const PROJECT_SKELETONS = 5;
const TEST_SKELETONS = 5;

export default function Tests() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState("");
  const [tests, setTests] = useState([]);
  const [testsLoading, setTestsLoading] = useState(false);
  const [testsError, setTestsError] = useState("");

  const [creatingProject, setCreatingProject] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectSubmitting, setProjectSubmitting] = useState(false);
  const [projectCreateError, setProjectCreateError] = useState("");

  const [creatingTest, setCreatingTest] = useState(false);
  const [testName, setTestName] = useState("");
  const [testSubmitting, setTestSubmitting] = useState(false);
  const [testCreateError, setTestCreateError] = useState("");

  const selectedProject = projects.find((project) => project.id === selectedProjectId) || null;

  const loadProjects = useCallback(async () => {
    setProjectsLoading(true);
    setProjectsError("");
    try {
      const data = unwrapData(await fetchProjects());
      const nextProjects = Array.isArray(data) ? data : [];
      setProjects(nextProjects);
      setSelectedProjectId((current) =>
        nextProjects.some((project) => project.id === current) ? current : nextProjects[0]?.id ?? null
      );
    } catch (err) {
      setProjects([]);
      setSelectedProjectId(null);
      setProjectsError(err?.message || "We could not load your projects.");
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  const loadProjectTests = useCallback(async () => {
    if (!selectedProjectId) {
      setTests([]);
      setTestsLoading(false);
      return;
    }

    setTestsLoading(true);
    setTestsError("");
    try {
      const data = unwrapData(await fetchProjectTests(selectedProjectId));
      setTests(Array.isArray(data) ? data : []);
    } catch (err) {
      setTests([]);
      setTestsError(err?.message || "We could not load tests for this project.");
    } finally {
      setTestsLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    loadProjectTests();
  }, [loadProjectTests]);

  function openProject(id) {
    setSelectedProjectId(id);
    setCreatingTest(false);
    setTestName("");
    setTestCreateError("");
  }

  function startCreatingProject() {
    setCreatingProject(true);
    setProjectName("");
    setProjectDescription("");
    setProjectCreateError("");
  }

  function cancelCreatingProject() {
    setCreatingProject(false);
    setProjectName("");
    setProjectDescription("");
    setProjectCreateError("");
  }

  async function submitProject() {
    const name = projectName.trim();
    if (!name) {
      setProjectCreateError("Project name is required.");
      return;
    }

    setProjectSubmitting(true);
    setProjectCreateError("");
    try {
      const created = unwrapData(
        await createProject({ name, description: projectDescription.trim() })
      );
      if (!created?.id) throw new Error("Project was created but no id was returned.");
      setProjects((current) => [created, ...current]);
      setSelectedProjectId(created.id);
      cancelCreatingProject();
    } catch (err) {
      setProjectCreateError(err?.message || "Could not create this project.");
    } finally {
      setProjectSubmitting(false);
    }
  }

  function startCreatingTest() {
    setCreatingTest(true);
    setTestName("");
    setTestCreateError("");
  }

  function cancelCreatingTest() {
    setCreatingTest(false);
    setTestName("");
    setTestCreateError("");
  }

  async function submitTest() {
    const name = testName.trim();
    if (!name) {
      setTestCreateError("Test name is required.");
      return;
    }
    if (!selectedProjectId) {
      setTestCreateError("Select a project first.");
      return;
    }

    setTestSubmitting(true);
    setTestCreateError("");
    try {
      const created = unwrapData(await createTest({ name, projectId: selectedProjectId }));
      if (!created?.id) throw new Error("Test was created but no id was returned.");
      navigate(`/tests/${created.id}`);
    } catch (err) {
      setTestCreateError(err?.message || "Could not create this test.");
      setTestSubmitting(false);
    }
  }

  // Only true once we've actually confirmed the project has zero tests —
  // must stay false during load/error so the header CTA doesn't flicker off.
  const testsConfirmedEmpty = !testsLoading && !testsError && tests.length === 0;

  return (
    <div className="w-full max-w-[1440px] space-y-5">
      <SectionHeader
        eyebrow="Tests"
        title="Projects"
        description="Organize related API tests into focused workspaces."
        actions={
          !creatingProject ? (
            <Button variant="primary" size="sm" leftIcon={<Plus size={15} />} onClick={startCreatingProject}>
              New project
            </Button>
          ) : null
        }
      />

      {creatingProject && (
        <section className="border-y border-border bg-surface-1/40 px-4 py-4 sm:px-5">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_1.6fr_auto] lg:items-end">
            <label className="grid gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Project name
              </span>
              <Input
                autoFocus
                value={projectName}
                disabled={projectSubmitting}
                maxLength={255}
                placeholder="Payments API"
                onChange={(event) => setProjectName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") submitProject();
                  if (event.key === "Escape") cancelCreatingProject();
                }}
              />
            </label>

            <label className="grid gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Description
              </span>
              <Textarea
                rows={1}
                value={projectDescription}
                disabled={projectSubmitting}
                placeholder="Payment service regression checks"
                onChange={(event) => setProjectDescription(event.target.value)}
              />
            </label>

            <div className="flex gap-2 lg:justify-end">
              <Button variant="primary" loading={projectSubmitting} onClick={submitProject}>
                <Check size={15} />
                Create project
              </Button>
              <Button variant="ghost" disabled={projectSubmitting} onClick={cancelCreatingProject}>
                <X size={15} />
                Cancel
              </Button>
            </div>
          </div>
          {projectCreateError && <p className="mt-2 text-xs text-destructive-strong">{projectCreateError}</p>}
        </section>
      )}

      {projectsError ? (
        <ErrorState title="Could not load projects" description={projectsError} onRetry={loadProjects} />
      ) : projectsLoading ? (
        <div className="grid overflow-hidden rounded-lg border border-border lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="border-b border-border bg-surface-1/40 p-2 lg:border-b-0 lg:border-r">
            {Array.from({ length: PROJECT_SKELETONS }).map((_, index) => (
              <div key={index} className="px-3 py-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="mt-2 h-3 w-1/3" />
              </div>
            ))}
          </aside>
          <main className="min-w-0 p-5">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="mt-2 h-4 w-72" />
            <div className="mt-6 space-y-2">
              {Array.from({ length: TEST_SKELETONS }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full" />
              ))}
            </div>
          </main>
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={Folder}
          title="Create your first project"
          description="Start with a project, then add tests inside it."
          action={
            <Button variant="primary" onClick={startCreatingProject} leftIcon={<Plus size={15} />}>
              New project
            </Button>
          }
        />
      ) : (
        <div className="grid overflow-hidden rounded-lg border border-border bg-background lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="border-b border-border bg-surface-1/40 p-2 lg:border-b-0 lg:border-r">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Projects</span>
              <BadgeCount value={projects.length} />
            </div>

            <nav aria-label="Projects" className="space-y-0.5">
              {projects.map((project) => {
                const active = project.id === selectedProjectId;
                const count = Number(project.test_count ?? project.testCount ?? 0);

                return (
                  <button
                    key={project.id}
                    type="button"
                    aria-current={active ? "page" : undefined}
                    onClick={() => openProject(project.id)}
                    className={[
                      "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left",
                      "transition-colors duration-slow ease-standard",
                      active ? "bg-background text-foreground" : "text-muted-foreground hover:bg-background/70 hover:text-foreground",
                    ].join(" ")}
                  >
                    <Folder size={15} className="shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{project.name}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {count} {count === 1 ? "test" : "tests"}
                      </span>
                    </span>
                    <ChevronRight size={14} className={active ? "text-foreground" : "opacity-40"} />
                  </button>
                );
              })}
            </nav>
          </aside>

          <main className="min-w-0">
            <div className="border-b border-border px-5 py-4 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Project</p>
                  <h2 className="mt-1 truncate text-lg font-semibold text-foreground">{selectedProject?.name}</h2>
                  <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                    {selectedProject?.description || "Related API tests for this project."}
                  </p>
                </div>

                {creatingTest ? (
                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                    <Input
                      autoFocus
                      value={testName}
                      disabled={testSubmitting}
                      maxLength={255}
                      placeholder="Test name"
                      onChange={(event) => setTestName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") submitTest();
                        if (event.key === "Escape") cancelCreatingTest();
                      }}
                      className="sm:w-56"
                    />
                    <Button variant="primary" size="icon" aria-label="Create test" loading={testSubmitting} onClick={submitTest}>
                      {!testSubmitting && <Check size={16} />}
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Cancel" disabled={testSubmitting} onClick={cancelCreatingTest}>
                      <X size={16} />
                    </Button>
                  </div>
                ) : !testsConfirmedEmpty ? (
                  <Button variant="primary" size="sm" leftIcon={<Plus size={15} />} onClick={startCreatingTest}>
                    New test
                  </Button>
                ) : null}
              </div>
              {testCreateError && <p className="mt-2 text-xs text-destructive-strong">{testCreateError}</p>}
            </div>

            <div className="px-5 py-5 sm:px-6">
              <p className="mb-3 text-sm font-medium text-foreground">
                Tests <span className="font-data text-muted-foreground">{tests.length}</span>
              </p>

              {testsError ? (
                <ErrorState title="Could not load tests" description={testsError} onRetry={loadProjectTests} />
              ) : testsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: TEST_SKELETONS }).map((_, index) => (
                    <div key={index} className="border-b border-border px-1 py-4 last:border-b-0">
                      <Skeleton className="h-4 w-2/5" />
                      <Skeleton className="mt-2 h-3 w-1/3" />
                    </div>
                  ))}
                </div>
              ) : testsConfirmedEmpty && !creatingTest ? (
                <EmptyState
                  icon={FlaskConical}
                  title="No tests yet"
                  description="Add the first test to start building this project's API checks."
                  action={
                    <Button onClick={startCreatingTest} leftIcon={<Plus size={15} />}>
                      New test
                    </Button>
                  }
                />
              ) : tests.length > 0 ? (
                <ul role="rowgroup" className="overflow-hidden rounded-lg border border-border bg-card">
                  {tests.map((test) => <TestRow key={test.id} test={test} />)}
                </ul>
              ) : null}
            </div>
          </main>
        </div>
      )}
    </div>
  );
}

function BadgeCount({ value }) {
  return (
    <span className="inline-flex min-h-5 items-center rounded-full bg-muted px-1.5 font-mono text-[10px] leading-4 text-muted-foreground">
      {value}
    </span>
  );
}