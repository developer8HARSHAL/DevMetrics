import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Check,
  Copy,
  GitCompareArrows,
  Square,
  TriangleAlert,
} from "lucide-react";

import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card, { CardContent } from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import ErrorState from "../../components/ui/ErrorState";
import SectionHeader from "../../components/ui/SectionHeader";
import { Skeleton, SkeletonText } from "../../components/ui/Loader";

import { useRunDetails } from "../../hooks/useRunDetails";
import { endRun, getRunStatusVariant } from "../../lib/runs";
import {
  formatDuration,
  formatRelativeTime,
} from "../../lib/formatters";
import { unwrapData } from "../../lib/api";
import { cn, toNumber } from "../../lib/utils";

// Duplicated from RunRow.jsx's local SEVERITY_VARIANT — flagged to
// consolidate into lib/runs.js if a shared-file edit is later approved.
const SEVERITY_VARIANT = {
  critical: "destructive",
  warning: "warning",
  info: "info",
};

const SEVERITY_BORDER = {
  destructive: "border-l-destructive",
  warning: "border-l-warning",
  info: "border-l-info",
  default: "border-l-transparent",
};

// Raw `type` values from run_findings, humanized for display. Unknown
// values fall back to a title-cased rewrite rather than showing raw
// snake_case in the UI.
const FINDING_TYPE_LABEL = {
  error: "Request error",
  assertion_failure: "Assertion failed",
  timeout: "Timeout",
  validation_error: "Validation error",
};

function humanizeFindingType(type) {
  if (!type) return "Finding";
  if (FINDING_TYPE_LABEL[type]) return FINDING_TYPE_LABEL[type];
  return type
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function capitalize(value) {
  if (!value) return "Unknown";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function statusVariant(status) {
  const code = toNumber(status);
  if (code >= 500) return "destructive";
  if (code >= 400) return "warning";
  if (code >= 300) return "info";
  if (code >= 200) return "success";
  return "default";
}

// Header badge reflects outcome, not just execution state: a run that
// technically "completed" but produced critical findings should read as
// failed, not neutral — that's the actual news the user needs first.
function getVerdict({ runStatus, isLive, findings }) {
  if (isLive) {
    return { label: capitalize(runStatus), variant: getRunStatusVariant(runStatus) };
  }

  if (runStatus === "cancelled") {
    return { label: "Cancelled", variant: "outline" };
  }

  const hasCritical = findings.some((f) => f.severity === "critical");
  if (runStatus === "failed" || hasCritical) {
    return { label: "Failed", variant: "destructive" };
  }

  const hasWarning = findings.some((f) => f.severity === "warning");
  if (hasWarning) {
    return { label: "Completed with warnings", variant: "warning" };
  }

  return { label: "Completed", variant: "success" };
}

function StatStripItem({ label, value, tone }) {
  const toneClass =
    tone === "destructive"
      ? "text-destructive-strong"
      : tone === "warning"
        ? "text-warning-strong"
        : "text-foreground";

  return (
    <div className="flex flex-1 items-center justify-between gap-3 px-4 py-2.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("font-data text-sm font-semibold", toneClass)}>{value}</span>
    </div>
  );
}

function MethodBadge({ method }) {
  const key = (method || "").toLowerCase();
  const known = ["get", "post", "put", "patch", "delete"].includes(key);

  return (
    <Badge variant={known ? key : "default"} size="xs" className="font-data uppercase">
      {method || "—"}
    </Badge>
  );
}

function TimelineRow({ entry }) {
  const code = toNumber(entry.status);

  return (
    <li
      role="row"
      className={cn(
        "border-b border-border/80 px-4 py-2.5 last:border-b-0",
        "md:grid md:grid-cols-[64px_minmax(160px,1fr)_64px_80px_100px] md:items-center md:gap-3 md:px-6"
      )}
    >
      <div role="gridcell" className="flex items-center justify-between gap-3 md:contents">
        <div className="flex min-w-0 items-center gap-3 md:contents">
          <MethodBadge method={entry.method} />

          <span className="truncate font-data text-sm text-foreground">
            {entry.endpoint || "—"}
          </span>
        </div>

        <Badge variant={statusVariant(entry.status)} size="xs" className="md:justify-self-end">
          {code || "—"}
        </Badge>
      </div>

      <span className="hidden font-data text-sm text-muted-foreground md:block md:justify-self-end">
        {entry.response_time != null ? `${toNumber(entry.response_time)}ms` : "—"}
      </span>

      <span className="hidden font-data text-micro text-muted-foreground md:block md:justify-self-end">
        {formatRelativeTime(entry.timestamp || entry.created_at)}
      </span>
    </li>
  );
}

function FindingRow({ finding }) {
  const variant = SEVERITY_VARIANT[finding.severity] ?? "default";
  const borderClass = SEVERITY_BORDER[variant] ?? SEVERITY_BORDER.default;
  const hasMeta = finding.meta && Object.keys(finding.meta).length > 0;

  return (
    <li
      role="row"
      className={cn(
        "border-b border-l-2 border-border/80 px-4 py-3 last:border-b-0 md:px-6",
        borderClass
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={variant} size="xs" dot>
              {capitalize(finding.severity)}
            </Badge>
            <span className="text-sm font-medium text-foreground">
              {humanizeFindingType(finding.type)}
            </span>
          </div>

          {finding.endpoint && (
            <p className="mt-1 truncate font-data text-xs text-muted-foreground">
              {finding.endpoint}
            </p>
          )}
        </div>

        {finding.occurrences != null && (
          <span className="shrink-0 font-data text-xs text-muted-foreground">
            {toNumber(finding.occurrences)}× occurred
          </span>
        )}
      </div>

      {hasMeta && (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
            Details
          </summary>
          <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-3 font-data text-micro text-muted-foreground">
            {JSON.stringify(finding.meta, null, 2)}
          </pre>
        </details>
      )}
    </li>
  );
}

function TabBar({ tabs, active, onChange }) {
  return (
    <div role="tablist" className="flex gap-1 border-b border-border">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative px-3 py-2.5 text-sm font-medium transition-colors duration-fast ease-standard",
              isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {isActive && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function SessionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, pollingError, retry } = useRunDetails(id);

  const [ending, setEnding] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState("overview");

  const payload = unwrapData({ data }) ?? {};
  const session = payload.session ?? null;
  const timeline = Array.isArray(payload.timeline) ? payload.timeline : [];
  const findings = Array.isArray(payload.findings) ? payload.findings : [];

  const runStatus =
    session?.run_status || (session?.ended_at ? "completed" : "running");
  const isLive = ["queued", "running", "analyzing"].includes(runStatus);
  const verdict = getVerdict({ runStatus, isLive, findings });

  const errorCount = timeline.filter((entry) => toNumber(entry.status) >= 400).length;
  const criticalCount = findings.filter((f) => f.severity === "critical").length;
  const warningCount = findings.filter((f) => f.severity === "warning").length;
  const infoCount = findings.filter((f) => f.severity === "info").length;

  const duration =
    session?.started_at && session?.ended_at
      ? formatDuration(
          new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()
        )
      : null;

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "timeline", label: `Timeline (${timeline.length})` },
    { id: "findings", label: `Findings (${findings.length})` },
  ];

  async function handleEndRun() {
    if (!session) return;
    setEnding(true);
    try {
      await endRun(session.id);
      await retry();
    } catch {
      // surfaced via next poll/retry error state
    } finally {
      setEnding(false);
    }
  }

  async function handleShare() {
    if (!session?.share_token) return;
    const link = `${window.location.origin}/shared/${session.share_token}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — silently no-op
    }
  }

  if (loading && !session) {
    return (
      <div className="space-y-5 p-4 md:p-6">
        <Skeleton className="h-4 w-24" />
        <div className="flex items-center justify-between">
          <SkeletonText lines={2} className="w-64" />
          <Skeleton className="h-9 w-40" />
        </div>
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="p-4 md:p-6">
        <ErrorState
          title="Couldn't load this run."
          description={error}
          onRetry={retry}
        />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-4 md:p-6">
        <EmptyState title="Run not found" description="This run may have been deleted." />
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4 md:p-6">
      <Link
        to="/sessions"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={13} />
        Back to Runs
      </Link>

      {pollingError && (
        <div className="flex items-center gap-2 rounded-md border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-warning-strong">
          <TriangleAlert size={13} />
          Live updates paused — retrying in the background.
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="truncate text-heading-lg font-semibold text-foreground">
              {session.name || "Untitled run"}
            </h1>
            <Badge variant={verdict.variant} dot>
              {verdict.label}
            </Badge>
          </div>

          <p className="mt-1.5 font-data text-micro text-muted-foreground">
            {session.hostname || "Unknown host"} · started {formatRelativeTime(session.started_at)}
            {duration && ` · ran for ${duration}`}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {session.share_token && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              leftIcon={copied ? <Check size={13} /> : <Copy size={13} />}
            >
              {copied ? "Copied" : "Share"}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/compare?a=${session.id}`)}
            leftIcon={<GitCompareArrows size={13} />}
          >
            Compare
          </Button>

          {isLive && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleEndRun}
              loading={ending}
              leftIcon={<Square size={12} />}
            >
              End run
            </Button>
          )}
        </div>
      </div>

      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {tab === "overview" && (
        <div className="space-y-5">
          <div className="flex divide-x divide-border rounded-md border border-border bg-card">
            <StatStripItem label="Requests" value={timeline.length} />
            <StatStripItem
              label="Errors"
              value={errorCount}
              tone={errorCount > 0 ? "destructive" : undefined}
            />
            <StatStripItem
              label="Findings"
              value={findings.length}
              tone={findings.length > 0 ? "warning" : undefined}
            />
            <StatStripItem label="Duration" value={duration || (isLive ? "Live" : "—")} />
          </div>

          {findings.length > 0 ? (
            <div>
              <SectionHeader
                title="Findings summary"
                description="Jump to the Findings tab for full detail."
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {criticalCount > 0 && (
                  <Badge variant="destructive" dot>
                    {criticalCount} critical
                  </Badge>
                )}
                {warningCount > 0 && (
                  <Badge variant="warning" dot>
                    {warningCount} warning
                  </Badge>
                )}
                {infoCount > 0 && (
                  <Badge variant="info" dot>
                    {infoCount} info
                  </Badge>
                )}
              </div>
            </div>
          ) : (
            <EmptyState
              icon={CheckCircle2}
              title="No findings"
              description="Nothing flagged for this run."
            />
          )}
        </div>
      )}

      {tab === "timeline" && (
        <Card>
          {timeline.length === 0 ? (
            <CardContent>
              <EmptyState
                title={isLive ? "Waiting for requests" : "No requests recorded"}
                description={
                  isLive
                    ? "This run hasn't executed any requests yet."
                    : "This run ended without recording any requests."
                }
              />
            </CardContent>
          ) : (
            <ul role="list">
              {timeline.map((entry) => (
                <TimelineRow key={entry.id} entry={entry} />
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab === "findings" && (
        <Card>
          {findings.length === 0 ? (
            <CardContent>
              <EmptyState
                icon={CheckCircle2}
                title="No findings"
                description="Nothing flagged for this run."
              />
            </CardContent>
          ) : (
            <ul role="list">
              {findings.map((finding) => (
                <FindingRow key={finding.id} finding={finding} />
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}