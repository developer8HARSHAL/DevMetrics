import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeftRight,
  ArrowRight,
  CheckCircle2,
  GitCompareArrows,
  Minus,
  Send,
  Timer,
  Waypoints,
  X,
} from "lucide-react";
import {
  fetchRuns,
  compareRuns,
} from "../lib/runs";
import { formatRelativeTime } from "../lib/formatters";
import { unwrapData } from "../lib/api";
import { cn, toNumber } from "../lib/utils";
import Button from "../components/ui/Button";
import Card, { CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import SectionHeader from "../components/ui/SectionHeader";
import { Skeleton } from "../components/ui/Loader";

const SEVERITY_VARIANT = { critical: "destructive", warning: "warning", info: "info" };
const MAX_SELECTED = 2;

function formatMs(value) {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${Math.round(value)}ms`;
}

function statusVariant(status) {
  const code = Number(status);
  if (!Number.isFinite(code)) return "outline";
  if (code >= 500) return "destructive";
  if (code >= 400) return "warning";
  if (code >= 300) return "info";
  return "success";
}

function statusIsError(code) {
  const n = Number(code);
  return Number.isFinite(n) && n >= 400;
}

function computeVerdict({ deltas, statusChanges, endpoints }) {
  const errorDelta = deltas?.errorCount ?? 0;
  const latencyDelta = deltas?.avgResponseTime ?? 0;

  const regressed = (statusChanges || []).filter(
    (c) => !statusIsError(c.statusA) && statusIsError(c.statusB)
  );
  const fixed = (statusChanges || []).filter(
    (c) => statusIsError(c.statusA) && !statusIsError(c.statusB)
  );
  const endpointDiff = (endpoints?.onlyInA?.length || 0) + (endpoints?.onlyInB?.length || 0);

  const reasons = [];
  if (errorDelta > 0) reasons.push(`errors up ${errorDelta}`);
  if (errorDelta < 0) reasons.push(`errors down ${Math.abs(errorDelta)}`);
  if (latencyDelta > 0) reasons.push(`response time up ${Math.round(latencyDelta)}ms`);
  if (latencyDelta < 0) reasons.push(`response time down ${Math.abs(Math.round(latencyDelta))}ms`);
  if (regressed.length) reasons.push(`${regressed.length} endpoint${regressed.length > 1 ? "s" : ""} now failing`);
  if (fixed.length) reasons.push(`${fixed.length} endpoint${fixed.length > 1 ? "s" : ""} fixed`);
  if (endpointDiff) reasons.push(`${endpointDiff} endpoint${endpointDiff > 1 ? "s" : ""} added/removed`);

  const hasRegression = errorDelta > 0 || latencyDelta > 0 || regressed.length > 0;
  const hasImprovement = errorDelta < 0 || latencyDelta < 0 || fixed.length > 0;

  if (hasRegression) return { tone: "destructive", icon: AlertTriangle, label: "Regression detected", reasons };
  if (hasImprovement) return { tone: "success", icon: CheckCircle2, label: "Improved", reasons };
  return { tone: "muted", icon: Minus, label: "No meaningful change", reasons };
}

const VERDICT_STYLES = {
  destructive: "border-destructive/25 bg-destructive/5 text-destructive-strong",
  success: "border-success/25 bg-success/5 text-success",
  muted: "border-border bg-muted/30 text-muted-foreground",
};

function VerdictBanner({ verdict }) {
  const Icon = verdict.icon;
  return (
    <div className={cn("flex items-start gap-3 rounded-lg border px-5 py-4", VERDICT_STYLES[verdict.tone])}>
      <Icon size={18} strokeWidth={1.8} className="mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-sm font-semibold">{verdict.label}</p>
        <p className="mt-0.5 text-xs opacity-90">
          {verdict.reasons.length > 0 ? verdict.reasons.join(" · ") : "Both runs behaved identically."}
        </p>
      </div>
    </div>
  );
}

function DeltaTag({ value, invert = false }) {
  if (!value) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
        <Minus size={11} />0
      </span>
    );
  }
  const good = invert ? value < 0 : value > 0;
  return (
    <span className={cn("text-xs font-medium", good ? "text-success" : "text-destructive-strong")}>
      {value > 0 ? "+" : ""}{Math.round(value)}
    </span>
  );
}

function StatTile({ icon: Icon, label, value, delta }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-card">
        <Icon size={18} strokeWidth={1.6} className="text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="font-mono text-micro uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
        <p className="mt-0.5 flex items-baseline gap-2">
          <span className="font-data text-sm font-semibold text-foreground">{value}</span>
          {delta}
        </p>
      </div>
    </div>
  );
}

export default function Compare() {
  const [searchParams] = useSearchParams();
  const aId = searchParams.get("a");
  const bId = searchParams.get("b");

  if (aId && bId) return <CompareResults aId={aId} bId={bId} />;
  return <ComparePicker initialA={aId} />;
}

function RunPickRow({ run, order, disabled, onToggle }) {
  const active = run.ended_at == null;
  const severityVariant = SEVERITY_VARIANT[run.highest_severity];
  const selected = order != null;

  return (
    <li
      role="row"
      aria-selected={selected}
      tabIndex={disabled ? -1 : 0}
      onClick={() => !disabled && onToggle(run.id)}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onToggle(run.id);
        }
      }}
      className={cn(
        "flex cursor-pointer items-center gap-3 border-b border-border/80 px-4 py-3.5 last:border-b-0",
        "transition-colors duration-fast ease-standard",
        selected && "bg-primary/5",
        disabled ? "cursor-not-allowed opacity-30" : "hover:bg-surface-1/80"
      )}
    >
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-data text-[10px] font-semibold",
          selected ? "border-primary bg-primary text-primary-foreground" : "border-border text-transparent"
        )}
      >
        {selected ? (order === 0 ? "A" : "B") : ""}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{run.name || "Untitled run"}</p>
        <p className="mt-0.5 truncate font-data text-micro text-muted-foreground">
          {formatRelativeTime(run.started_at)} · {toNumber(run.request_count)} req · {toNumber(run.error_count)} err
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {severityVariant && <Badge variant={severityVariant} size="xs">{run.highest_severity}</Badge>}
        <Badge variant={active ? "primary" : "outline"} dot size="xs">{active ? "Live" : "Ended"}</Badge>
      </div>
    </li>
  );
}

function SelectionRail({ selectedRuns, onRemove, onCompare }) {
  return (
    <Card className="lg:sticky lg:top-6">
      <CardHeader className="pb-3">
        <CardTitle as="h3" className="text-sm">
          Comparing ({selectedRuns.length}/{MAX_SELECTED})
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {selectedRuns.length === 0 ? (
          <p className="text-sm text-muted-foreground">Select two runs from the list to compare.</p>
        ) : (
          <ul className="space-y-2">
            {selectedRuns.map((run, i) => (
              <li key={run.id} className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2.5 py-2">
                <span className="font-data text-[10px] font-semibold text-muted-foreground">{i === 0 ? "A" : "B"}</span>
                <span className="min-w-0 flex-1 truncate text-xs text-foreground">{run.name || "Untitled run"}</span>
                <button
                  type="button"
                  aria-label={`Remove ${run.name || "run"}`}
                  onClick={() => onRemove(run.id)}
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <X size={13} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <Button className="mt-4 w-full" disabled={selectedRuns.length !== MAX_SELECTED} onClick={onCompare}>
          Compare
          <ArrowRight size={15} />
        </Button>
      </CardContent>
    </Card>
  );
}

function ComparePicker({ initialA }) {
  const navigate = useNavigate();
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(initialA ? [initialA] : []);

  const loadRuns = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetchRuns();
      const data = unwrapData(response);
      setRuns(Array.isArray(data) ? data : data?.runs || []);
    } catch (err) {
      setError(err?.message || "Failed to load runs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  function toggle(id) {
    setSelected((current) => {
      if (current.includes(id)) return current.filter((x) => x !== id);
      if (current.length >= MAX_SELECTED) return current;
      return [...current, id];
    });
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <SectionHeader title="Compare runs" description="Pick two runs to diff." />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <SectionHeader title="Compare runs" />
        <ErrorState description={error} onRetry={loadRuns} />
      </div>
    );
  }

  if (runs.length < 2) {
    return (
      <div className="space-y-6">
        <SectionHeader title="Compare runs" />
        <EmptyState
          icon={GitCompareArrows}
          title="Not enough runs yet"
          description="You need at least two runs to compare results."
        />
      </div>
    );
  }

  const selectedRuns = selected.map((id) => runs.find((r) => r.id === id)).filter(Boolean);

  return (
    <div className="space-y-6">
      <SectionHeader title="Compare runs" description="Pick two runs to diff requests, errors, and endpoint changes." />

      <div className="flex flex-col gap-6 lg:flex-row">
        <Card className="min-w-0 flex-1">
          <ul role="grid" className="max-h-[32rem] overflow-y-auto">
            {runs.map((run) => (
              <RunPickRow
                key={run.id}
                run={run}
                order={selected.indexOf(run.id) === -1 ? null : selected.indexOf(run.id)}
                disabled={selected.length >= MAX_SELECTED && !selected.includes(run.id)}
                onToggle={toggle}
              />
            ))}
          </ul>
        </Card>

        <div className="lg:w-72 lg:shrink-0">
          <SelectionRail
            selectedRuns={selectedRuns}
            onRemove={toggle}
            onCompare={() => navigate(`/compare?a=${selected[0]}&b=${selected[1]}`)}
          />
        </div>
      </div>
    </div>
  );
}

function CompareResults({ aId, bId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadComparison = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await compareRuns(aId, bId);
      setData(unwrapData(response));
    } catch (err) {
      setError(err?.message || "Failed to compare runs.");
    } finally {
      setLoading(false);
    }
  }, [aId, bId]);

  useEffect(() => {
    loadComparison();
  }, [loadComparison]);

  if (loading) {
    return (
      <div className="space-y-6">
        <SectionHeader title="Compare runs" />
        <Skeleton className="h-14 rounded-lg" />
        <Skeleton className="h-40 rounded-lg" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <SectionHeader title="Compare runs" />
        <ErrorState description={error} onRetry={loadComparison} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <SectionHeader title="Compare runs" />
        <EmptyState title="No comparison data" description="This comparison could not be generated." />
      </div>
    );
  }

  const { runA, runB, deltas, endpoints, statusChanges } = data;
  const verdict = computeVerdict({ deltas, statusChanges, endpoints });
  const endpointDiff = (endpoints?.onlyInA?.length || 0) + (endpoints?.onlyInB?.length || 0);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Compare runs"
        actions={
          <Link to="/compare" className="text-sm text-muted-foreground hover:text-foreground">
            Pick different runs
          </Link>
        }
      />

      <div className="flex flex-wrap items-center justify-center gap-3 rounded-md border border-border bg-card px-5 py-3">
        <span className="truncate text-sm font-medium text-foreground">{runA?.name || "Untitled run"}</span>
        <span className="font-data text-micro text-muted-foreground">A</span>
        <ArrowRight size={14} className="shrink-0 text-muted-foreground/50" />
        <span className="truncate text-sm font-medium text-foreground">{runB?.name || "Untitled run"}</span>
        <span className="font-data text-micro text-muted-foreground">B</span>
      </div>

      <VerdictBanner verdict={verdict} />

      <Card>
        <CardContent className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          <StatTile
            icon={Send}
            label="Requests"
            value={runB?.requestCount ?? "—"}
            delta={<DeltaTag value={deltas?.requestCount} />}
          />
          <StatTile
            icon={AlertTriangle}
            label="Errors"
            value={runB?.errorCount ?? "—"}
            delta={<DeltaTag value={deltas?.errorCount} invert />}
          />
          <StatTile
            icon={Timer}
            label="Avg response"
            value={formatMs(runB?.avgResponseTime)}
            delta={<DeltaTag value={deltas?.avgResponseTime} invert />}
          />
          <StatTile icon={Waypoints} label="Endpoints changed" value={endpointDiff} />
          <StatTile icon={ArrowLeftRight} label="Status changes" value={statusChanges?.length ?? 0} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Endpoint coverage</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 pt-0 sm:grid-cols-2">
            <EndpointList title="Only in Run A" items={endpoints?.onlyInA} />
            <EndpointList title="Only in Run B" items={endpoints?.onlyInB} />
            <EndpointList title="Shared" items={endpoints?.shared} className="sm:col-span-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status changes</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {!statusChanges?.length ? (
              <p className="text-sm text-muted-foreground">No status changes between these runs.</p>
            ) : (
              <ul className="divide-y divide-border">
                {statusChanges.map((change, index) => (
                  <li key={`${change.endpoint}-${index}`} className="flex items-center justify-between gap-4 py-2.5">
                    <span className="truncate font-data text-sm text-foreground">{change.endpoint}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      <Badge variant={statusVariant(change.statusA)} size="xs">{change.statusA}</Badge>
                      <ArrowRight size={13} className="text-muted-foreground/50" />
                      <Badge variant={statusVariant(change.statusB)} size="xs">{change.statusB}</Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EndpointList({ title, items, className }) {
  const list = Array.isArray(items) ? items : [];
  return (
    <div className={className}>
      <p className="mb-2 font-mono text-micro uppercase tracking-[0.1em] text-muted-foreground">
        {title} ({list.length})
      </p>
      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">None</p>
      ) : (
        <ul className="space-y-1.5">
          {list.map((item, index) => {
            const endpoint = typeof item === "string" ? item : item?.endpoint || item?.path;
            return (
              <li
                key={`${endpoint}-${index}`}
                title={endpoint}
                className="truncate rounded-md border border-border bg-muted/40 px-2.5 py-1.5 font-data text-xs text-foreground"
              >
                {endpoint}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}