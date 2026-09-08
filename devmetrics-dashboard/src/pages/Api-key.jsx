import { useState } from "react";
import { KeyRound } from "lucide-react";
import { useFetch } from "../hooks/useFetch";
import { getApiKey, setApiKey, clearApiKey, createApiKey, fetchApiKeys, updateApiKey, revokeApiKey, deleteApiKey } from "../lib/auth";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import SectionHeader from "../components/ui/SectionHeader";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import Skeleton from "../components/ui/Skeleton";

function maskKey(key) {
  if (!key || key.length < 8) return key;
  return `${key.slice(0, 4)}${"•".repeat(Math.max(key.length - 8, 4))}${key.slice(-4)}`;
}

function formatDate(value) {
  if (!value) return "Never";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

export default function ApiKeyPage() {
  const [activeKey, setActiveKey] = useState(() => getApiKey());
  const [showCreate, setShowCreate] = useState(false);
  const [revealed, setRevealed] = useState({});
  const [editingKey, setEditingKey] = useState(null);
  const [owner, setOwner] = useState("");
  const [description, setDescription] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("active");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const { data, loading, error, refetch } = useFetch(fetchApiKeys);
  const keys = data?.data || [];

  const handleUseKey = (key) => { setApiKey(key); setActiveKey(key); };
  const handleClearKey = () => { clearApiKey(); setActiveKey(null); };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!owner.trim()) { setActionError("Owner is required."); return; }
    try {
      setBusy(true);
      setActionError("");
      const response = await createApiKey({ owner: owner.trim(), description: description.trim() });
      setOwner(""); setDescription(""); setShowCreate(false);
      await refetch();
      if (response.data?.data?.key) handleUseKey(response.data.data.key);
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || "Failed to create API key.");
    } finally {
      setBusy(false);
    }
  };

  const handleUpdate = async (key) => {
    try {
      setBusy(true);
      setActionError("");
      await updateApiKey(key, { description: editDescription.trim(), status: editStatus });
      setEditingKey(null);
      await refetch();
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || "Failed to update API key.");
    } finally {
      setBusy(false);
    }
  };

  const handleRevoke = async (key) => {
    if (!window.confirm("Revoke this API key?")) return;
    try {
      setBusy(true);
      await revokeApiKey(key);
      if (activeKey === key) handleClearKey();
      await refetch();
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || "Failed to revoke API key.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (key) => {
    if (!window.confirm("Permanently delete this API key?")) return;
    try {
      setBusy(true);
      await deleteApiKey(key);
      if (activeKey === key) handleClearKey();
      await refetch();
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || "Failed to delete API key.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SectionHeader eyebrow="Developer" title="API keys" description="Manage keys for your DevMetrics applications." />
        <Card className="p-10 text-center shadow-sm">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="mx-auto h-12 max-w-md" />)}
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <SectionHeader eyebrow="Developer" title="API keys" description="Manage keys for your DevMetrics applications." />
        <ErrorState description={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Developer"
        title="API keys"
        description="Create and manage keys used by your applications and this dashboard."
      />

      <Card className="p-5 shadow-sm md:p-6">
        <SectionHeader title="Active dashboard key" description="The key currently used for API requests in this browser." />
        {activeKey ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <code className="rounded-lg bg-muted px-3 py-2 font-mono text-sm">{maskKey(activeKey)}</code>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(activeKey)}>Copy</Button>
              <Button variant="outline" size="sm" onClick={handleClearKey}>Clear</Button>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">No API key selected. Choose one below or create a new key.</p>
        )}
      </Card>

      <Card className="p-5 shadow-sm md:p-6">
        <SectionHeader
          title="Managed keys"
          description="All keys registered with DevMetrics."
          actions={
            <Button size="sm" onClick={() => { setShowCreate((v) => !v); setActionError(""); }}>
              {showCreate ? "Cancel" : "Create key"}
            </Button>
          }
        />

        {showCreate && (
          <form onSubmit={handleCreate} className="mt-5 grid gap-4 border-t border-border pt-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm">
                <span className="font-medium">Owner</span>
                <input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="my-application" className="dm-input" />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="font-medium">Description</span>
                <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Application API key" className="dm-input" />
              </label>
            </div>
            <Button type="submit" disabled={busy} size="sm">{busy ? "Creating…" : "Create API key"}</Button>
          </form>
        )}

        {actionError && <p className="mt-4 text-sm text-destructive-strong">{actionError}</p>}

        <div className="mt-5 space-y-3">
          {keys.length === 0 ? (
            <EmptyState icon={KeyRound} title="No API keys" description="Create an API key to connect an application to DevMetrics." />
          ) : (
            keys.map((key) => {
              const isEditing = editingKey === key.key;
              const isActive = activeKey === key.key;
              return (
                <div key={key.key} className="rounded-xl border border-border bg-surface-1/30 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{key.owner}</span>
                        <Badge variant={key.status === "active" ? "success" : "outline"}>{key.status}</Badge>
                        {isActive && <Badge variant="primary">Dashboard</Badge>}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{key.description || "No description"}</p>
                      <code className="mt-3 block break-all rounded bg-muted/50 px-2 py-1 font-mono text-xs">
                        {revealed[key.key] ? key.key : maskKey(key.key)}
                      </code>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => setRevealed((r) => ({ ...r, [key.key]: !r[key.key] }))}>
                        {revealed[key.key] ? "Hide" : "Reveal"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(key.key)}>Copy</Button>
                      {!isActive && key.status === "active" && (
                        <Button variant="outline" size="sm" onClick={() => handleUseKey(key.key)}>Use</Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => { setEditingKey(key.key); setEditDescription(key.description || ""); setEditStatus(key.status || "active"); }}>Edit</Button>
                      {key.status !== "revoked" && (
                        <Button variant="outline" size="sm" onClick={() => handleRevoke(key.key)} disabled={busy}>Revoke</Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => handleDelete(key.key)} disabled={busy}>Delete</Button>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="mt-4 grid gap-4 border-t border-border pt-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="grid gap-2 text-sm">
                          <span className="font-medium">Description</span>
                          <input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="dm-input" />
                        </label>
                        <label className="grid gap-2 text-sm">
                          <span className="font-medium">Status</span>
                          <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="dm-input dm-select">
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="revoked">Revoked</option>
                          </select>
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleUpdate(key.key)} disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
                        <Button variant="outline" size="sm" onClick={() => setEditingKey(null)}>Cancel</Button>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm md:grid-cols-4">
                    <div><p className="text-muted-foreground">Usage</p><p className="font-medium">{key.usageCount ?? 0}</p></div>
                    <div><p className="text-muted-foreground">Hourly limit</p><p className="font-medium">{key.rateLimit?.requestsPerHour ?? "—"}</p></div>
                    <div><p className="text-muted-foreground">Last used</p><p className="font-medium">{formatDate(key.lastUsedAt)}</p></div>
                    <div><p className="text-muted-foreground">Created</p><p className="font-medium">{formatDate(key.createdAt)}</p></div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
