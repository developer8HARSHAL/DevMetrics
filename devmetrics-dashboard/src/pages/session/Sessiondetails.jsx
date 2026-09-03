import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ChevronDown, Share2, Check } from "lucide-react";
import { useFetch } from "../../hooks/useFetch";
import { fetchRun } from "../../lib/runs";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import ErrorState from "../../components/ui/ErrorState";
import Skeleton from "../../components/ui/Skeleton";
import { cn } from "../../lib/utils";

const SEVERITY = {
  critical: { label: "Critical", variant: "destructive" },
  warning: { label: "Warning", variant: "warning" },
  info: { label: "Info", variant: "info" },
};

function clock(v) {
  return v ? new Date(v).toLocaleTimeString("en-US", { hour12: false }) : "";
}

function ms(v) {
  if (v == null) return "—";
  return v >= 1000 ? `${(v / 1000).toFixed(1)}s` : `${Math.round(v)}ms`;
}

function statusTone(status) {
  if (status >= 500) return "text-destructive-strong";
  if (status >= 400) return "text-warning-strong";
  return "text-success";
}

function findingTitle({ type, endpoint }) {
  const path = endpoint || "an endpoint";
  return ({
    error: `Errors on ${path}`,
    error_burst: `Error burst on ${path}`,
    retry_pattern: `Retry pattern on ${path}`,
    duplicate_request: `Duplicate requests on ${path}`,
    latency_anomaly: `Latency spike on ${path}`,
  }[type] || `Finding on ${path}`);
}

function findingSubtitle(finding) {
  const count = Number(finding.occurrences) || 0;
  const meta = finding.meta || {};
  switch (finding.type) {
    case "error": return `${count} error${count === 1 ? "" : "s"}`;
    case "error_burst":
    case "retry_pattern":
      return `${count} between ${clock(meta.firstAt)} – ${clock(meta.lastAt)}`;
    case "duplicate_request":
      return `${count} repeats within ${ms(meta.windowMs)}`;
    case "latency_anomaly":
      return `avg ${ms(meta.maxObserved)}, baseline ${ms(meta.median)}`;
    default:
      return `${count} occurrence${count === 1 ? "" : "s"}`;
  }
}

function Finding({ finding, timeline }) {
  const [open, setOpen] = useState(finding.severity === "critical");
  const meta = finding.meta || {};
  const sev = SEVERITY[finding.severity] || { label: finding.severity, variant: "outline" };

  const evidence = useMemo(() => {
    const start = meta.firstAt ? new Date(meta.firstAt).getTime() : null;
    const end = meta.lastAt ? new Date(meta.lastAt).getTime() : null;
    return (timeline || [])
      .filter((row) => {
        if (row.endpoint !== finding.endpoint) return false;
        if (start == null || end == null) return true;
        return new Date(row.timestamp).getTime() >= start && new Date(row.timestamp).getTime() <= end;
      })
      .slice(0, 3);
  }, [finding.endpoint, meta.firstAt, meta.lastAt, timeline]);

  return (
    <article className="border-b border-border/80 py-4 last:border-0">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-4 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium">{findingTitle(finding)}</h3>
          <p className="mt-1 font-data text-micro text-muted-foreground">{findingSubtitle(finding)}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant={sev.variant}>{sev.label}</Badge>
          <ChevronDown size={16} className={cn("text-muted-foreground transition-transform", open && "rotate-180")} />
        </div>
      </button>

      {open && (
        <div className="mt-4 rounded-xl border border-border/80 bg-muted/20 p-4">
          <p className="mb-3 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
            Evidence{meta.firstAt && ` · ${clock(meta.firstAt)} – ${clock(meta.lastAt)}`}
          </p>
          {evidence.length ? (
            <div className="space-y-1.5 font-data text-micro text-muted-foreground">
              {evidence.map((row) => (
                <div key={row.id} className="flex gap-3 rounded-md bg-background/60 px-2 py-1.5">
                  <span className="w-14 shrink-0">{clock(row.timestamp)}</span>
                  <span className="w-10 shrink-0">{row.method}</span>
                  <span className="min-w-0 flex-1 truncate">{row.endpoint}</span>
                  <span className={statusTone(row.status)}>{row.status}</span>
                  <span>{row.response_time}ms</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-data text-micro text-muted-foreground">No matching evidence in this run's timeline.</p>
          )}
        </div>
      )}
    </article>
  );
}

// Builds the public report URL from the run's share_token and copies it to
// the clipboard. share_token is already returned on both POST /sessions
// and GET /sessions/:id (per the data contract) — this was previously
// unused in the UI, so the share flow existed end-to-end on the backend
// but had no entry point for a person to actually reach it.
function ShareLinkButton({ token }) {
  const [copied, setCopied] = useState(false);

  if (!token) return null;

  const shareUrl = `${window.location.origin}/shared/${token}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Clipboard API can fail (permissions, non-secure context) — fall
      // back to a visible prompt so the link is still recoverable.
      window.prompt("Copy this share link:", shareUrl);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {copied ? <Check size={14} className="text-success" /> : <Share2 size={14} />}
      {copied ? "Copied" : "Copy share link"}
    </button>
  );
}

export default function Sessiondetails() {
  const { id } = useParams();
  const { data, loading, error, refetch } = useFetch(() => fetchRun(id), {}, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (error) return <ErrorState description={error} onRetry={refetch} />;

  const session = data?.data?.session;
  const timeline = data?.data?.timeline || [];
  const findings = data?.data?.findings || [];

  if (!session) {
    return <Card className="p-10 text-center text-sm text-muted-foreground">Run not found.</Card>;
  }

  const active = !session.ended_at;
  const errors = timeline.filter((r) => r.status >= 400).length;

  return (
    <div className="space-y-8">
      <div>
        <Link
          to="/"
          className="mb-5 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft size={16} /> Back to runs
        </Link>

        <Card className="overflow-hidden shadow-sm">
          <div className="border-b border-border/80 bg-muted/20 px-5 py-5 md:px-6">
            <div className="flex items-center justify-between gap-3">
              <Badge variant={active ? "primary" : "outline"} dot>{active ? "Recording" : "Ended"}</Badge>
              <ShareLinkButton token={session.share_token} />
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight">{session.name || "Untitled run"}</h1>
            <p className="mt-2 font-data text-micro text-muted-foreground">
              {session.hostname || "Unknown host"} ·{" "}
              {session.started_at ? new Date(session.started_at).toLocaleString() : "Unknown time"}
            </p>
          </div>
          <div className="grid divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="px-5 py-4 md:px-6">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Requests</p>
              <p className="mt-1 font-data text-xl font-semibold">{timeline.length}</p>
            </div>
            <div className="px-5 py-4 md:px-6">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Errors</p>
              <p className={cn("mt-1 font-data text-xl font-semibold", errors > 0 && "text-destructive-strong")}>{errors}</p>
            </div>
            <div className="px-5 py-4 md:px-6">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Findings</p>
              <p className="mt-1 font-data text-xl font-semibold">{findings.length}</p>
            </div>
          </div>
        </Card>
      </div>

      <section>
        <h2 className="text-heading-md font-semibold">Findings</h2>
        <Card className="mt-4 p-5 shadow-sm">
          {findings.length ? findings.map((f) => (
            <Finding key={f.id} finding={f} timeline={timeline} />
          )) : (
            <p className="py-4 text-center font-data text-micro text-muted-foreground">No findings detected in this run.</p>
          )}
        </Card>
      </section>

      <section>
        <h2 className="text-heading-md font-semibold">Timeline</h2>
        <Card className="mt-4 overflow-hidden p-0 shadow-sm">
          {!timeline.length ? (
            <p className="p-5 font-data text-micro text-muted-foreground">No requests captured.</p>
          ) : (
            <div className="hidden border-b border-border bg-muted/30 px-5 py-2.5 font-data text-micro uppercase tracking-wider text-muted-foreground md:grid md:grid-cols-[4rem_3rem_1fr_4rem_4rem] md:gap-4">
              <span>Time</span><span>Method</span><span>Endpoint</span><span>Status</span><span className="text-right">Latency</span>
            </div>
          )}
          <div className="divide-y divide-border/80 font-data text-micro">
            {timeline.map((row) => (
              <div key={row.id} className="grid gap-2 px-5 py-2.5 text-muted-foreground md:grid-cols-[4rem_3rem_1fr_4rem_4rem] md:items-center md:gap-4">
                <span className="shrink-0">{clock(row.timestamp)}</span>
                <span className="font-medium text-foreground">{row.method}</span>
                <span className="min-w-0 truncate">{row.endpoint}</span>
                <span className={cn("font-medium", statusTone(row.status))}>{row.status}</span>
                <span className="md:text-right">{row.response_time}ms</span>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}