import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FolderKanban, Plus, Trash2,Copy,AlertTriangle, CheckCircle2, FlaskConical, Send } from "lucide-react";
import {
  fetchProjects,
  fetchProject,
  createProject,
  updateProject,
  deleteProject,
  fetchProjectTests,
} from "../lib/projects";
import { unwrapData } from "../lib/api";
import Button from "../components/ui/Button";
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from "../components/ui/Card";
import { Label, Input, Textarea } from "../components/ui/Form";
import SectionHeader from "../components/ui/SectionHeader";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import { Skeleton, SkeletonText } from "../components/ui/Loader";
import TestRow from "../components/TestRow";
import { cn } from "../lib/utils";

function ProjectListItem({ project, active, onClick }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex w-full items-center gap-2.5 border-b border-border/80 px-3 py-3 text-left last:border-b-0",
          "transition-colors duration-fast ease-standard",
          active ? "bg-primary/10" : "hover:bg-surface-1/80"
        )}
      >
        <FolderKanban size={15} className={cn("shrink-0", active ? "text-primary" : "text-muted-foreground")} />
        <span className={cn("min-w-0 flex-1 truncate text-sm", active ? "font-medium text-foreground" : "text-foreground")}>
          {project.name || "Untitled project"}
        </span>
      </button>
    </li>
  );
}

export default function ProjectSettings() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [createError, setCreateError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadProjects = useCallback(async () => {
    try {
      setListLoading(true);
      setListError("");
      const response = await fetchProjects();
      const data = unwrapData(response);
      const list = Array.isArray(data) ? data : data?.projects || [];
      setProjects(list);

      if (!id && list.length > 0) {
        navigate(`/projects/${list[0].id}`, { replace: true });
      }
    } catch (err) {
      setListError(err?.message || "Failed to load projects.");
    } finally {
      setListLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate() {
    if (!newName.trim()) {
      setCreateError("Project name is required.");
      return;
    }

    try {
      setSubmitting(true);
      setCreateError("");
      const response = await createProject({ name: newName.trim() });
      const created = unwrapData(response);
      setNewName("");
      setCreating(false);

      const response2 = await fetchProjects();
      const list = unwrapData(response2);
      setProjects(Array.isArray(list) ? list : list?.projects || []);

      if (created?.id) navigate(`/projects/${created.id}`);
    } catch (err) {
      setCreateError(err?.message || "Failed to create project.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Projects" description="Manage projects and their tests." />

      <div className="flex flex-col gap-6 lg:flex-row">
        <Card className="lg:w-72 lg:shrink-0">
          <CardHeader className="pb-3">
            <CardTitle as="h3" className="text-sm">Projects</CardTitle>
            <Button size="icon" variant="ghost" aria-label="New project" onClick={() => setCreating((v) => !v)}>
              <Plus size={16} />
            </Button>
          </CardHeader>

          {creating && (
            <div className="space-y-2 border-b border-border px-4 pb-4">
              <Input
                autoFocus
                placeholder="Project name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
              {createError && <p className="text-xs text-destructive-strong">{createError}</p>}
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCreate} loading={submitting}>Create</Button>
                <Button size="sm" variant="ghost" onClick={() => { setCreating(false); setCreateError(""); }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {listLoading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-10 rounded-md" />
              <Skeleton className="h-10 rounded-md" />
              <Skeleton className="h-10 rounded-md" />
            </div>
          ) : listError ? (
            <div className="p-4">
              <ErrorState compact description={listError} onRetry={loadProjects} />
            </div>
          ) : projects.length === 0 ? (
            <div className="p-4">
              <p className="text-sm text-muted-foreground">No projects yet.</p>
            </div>
          ) : (
            <ul>
              {projects.map((project) => (
                <ProjectListItem
                  key={project.id}
                  project={project}
                  active={project.id === id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                />
              ))}
            </ul>
          )}
        </Card>

        <div className="min-w-0 flex-1">
          {id ? (
            <ProjectSettingsPanel key={id} projectId={id} onDeleted={loadProjects} />
          ) : !listLoading && projects.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="No projects yet"
              description="Create a project to start organizing your tests."
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}


function ProjectSettingsPanel({ projectId, onDeleted }) {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [copied, setCopied] = useState(false);

  const [tests, setTests] = useState([]);
  const [testsLoading, setTestsLoading] = useState(true);

  const [deleteArmed, setDeleteArmed] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const loadProject = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetchProject(projectId);
      const data = unwrapData(response);
      if (!data) throw new Error("Project not found.");
      setName(data.name ?? "");
      setDescription(data.description ?? "");
    } catch (err) {
      setError(err?.message || "Failed to load project.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const loadTests = useCallback(async () => {
    try {
      setTestsLoading(true);
      const response = await fetchProjectTests(projectId);
      const data = unwrapData(response);
      setTests(Array.isArray(data) ? data : data?.tests || []);
    } catch {
      setTests([]);
    } finally {
      setTestsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadProject();
    loadTests();
  }, [loadProject, loadTests]);

  async function handleSave() {
    if (!name.trim()) {
      setSaveError("Project name is required.");
      return;
    }
    try {
      setSaving(true);
      setSaveError("");
      await updateProject(projectId, { name: name.trim(), description: description.trim() });
    } catch (err) {
      setSaveError(err?.message || "Failed to save project.");
    } finally {
      setSaving(false);
    }
  }

  function copyId() {
    navigator.clipboard?.writeText(projectId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleDelete() {
    if (!deleteArmed) {
      setDeleteArmed(true);
      return;
    }
    try {
      setDeleting(true);
      setDeleteError("");
      await deleteProject(projectId);
      onDeleted?.();
      navigate("/projects");
    } catch (err) {
      setDeleteError(err?.message || "Failed to delete project.");
      setDeleting(false);
      setDeleteArmed(false);
    }
  }

  if (loading) return <Skeleton className="h-64 rounded-lg" />;
  if (error) return <ErrorState description={error} onRetry={loadProject} />;

  const totalRequests = tests.reduce((sum, t) => {
    const count = t.request_count ?? (Array.isArray(t.requests) ? t.requests.length : 0);
    return sum + (Number(count) || 0);
  }, 0);

  const failingTests = tests.filter((t) => {
    const status = t.last_run_status ?? t.last_run?.status ?? t.lastRun?.status;
    return status === "failed";
  });

  const healthy = !testsLoading && tests.length > 0 && failingTests.length === 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>About this project</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="space-y-2">
            <Label required>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What API is this project testing, and what does it cover?"
            />
          </div>

          <div className="space-y-2">
            <Label>Project ID</Label>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded-md border border-border bg-muted px-3 py-2 font-data text-xs text-muted-foreground">
                {projectId}
              </code>
              <Button variant="outline" size="sm" onClick={copyId} leftIcon={<Copy size={13} />}>
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>

          {saveError && <p className="text-sm text-destructive-strong">{saveError}</p>}
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave} loading={saving}>Save changes</Button>
        </CardFooter>
      </Card>

      {!testsLoading && tests.length > 0 && (
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg border px-5 py-4",
            healthy ? "border-success/25 bg-success/5" : "border-destructive/25 bg-destructive/5"
          )}
        >
          {healthy ? (
            <CheckCircle2 size={18} strokeWidth={1.8} className="shrink-0 text-success" />
          ) : (
            <AlertTriangle size={18} strokeWidth={1.8} className="shrink-0 text-destructive-strong" />
          )}
          <div className="min-w-0">
            <p className={cn("text-sm font-semibold", healthy ? "text-success" : "text-destructive-strong")}>
              {healthy ? "All tests passing" : `${failingTests.length} test${failingTests.length === 1 ? "" : "s"} failing`}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">Based on each test's most recent run.</p>
          </div>
        </div>
      )}

      {!testsLoading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-md border border-border bg-card px-4 py-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
              <FlaskConical size={16} strokeWidth={1.7} className="text-muted-foreground" />
            </div>
            <div>
              <p className="font-mono text-micro uppercase tracking-[0.1em] text-muted-foreground">API tests</p>
              <p className="font-data text-lg font-semibold text-foreground">{tests.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-md border border-border bg-card px-4 py-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
              <Send size={16} strokeWidth={1.7} className="text-muted-foreground" />
            </div>
            <div>
              <p className="font-mono text-micro uppercase tracking-[0.1em] text-muted-foreground">Requests configured</p>
              <p className="font-data text-lg font-semibold text-foreground">{totalRequests}</p>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Tests in this project</CardTitle>

        </CardHeader>
        {testsLoading ? (
          <CardContent className="pt-0"><SkeletonText lines={3} /></CardContent>
        ) : tests.length === 0 ? (
          <CardContent className="pt-0">
            <EmptyState title="No API tests yet" description="Add a test to start running and tracking requests for this project." />
          </CardContent>
        ) : (
          <ul>
            {tests.map((test) => <TestRow key={test.id} test={test} />)}
          </ul>
        )}
      </Card>

      <Card className="border-destructive/25">
        <CardHeader>
          <CardTitle className="text-destructive-strong">Danger zone</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground">
            Deleting this project cannot be undone.
            {!testsLoading && tests.length > 0 && (
              <> Its <strong className="text-foreground">{tests.length}</strong> test{tests.length === 1 ? "" : "s"} and their full run history — including any findings and regression comparisons — will no longer belong to a project. Tests themselves are not deleted.</>
            )}
          </p>
          {deleteError && <p className="mt-2 text-sm text-destructive-strong">{deleteError}</p>}
        </CardContent>
        <CardFooter>
          <Button variant="destructive" leftIcon={<Trash2 size={14} />} loading={deleting} onClick={handleDelete}>
            {deleteArmed ? "Click again to confirm" : "Delete project"}
          </Button>
          {deleteArmed && !deleting && (
            <Button variant="ghost" onClick={() => setDeleteArmed(false)}>Cancel</Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
