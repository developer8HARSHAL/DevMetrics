import { useMemo, useState } from "react";
import { Activity, Plus, Radio } from "lucide-react";
import { createRun, fetchRuns } from "../lib/runs";
import { useFetch } from "../hooks/useFetch";
import RunRow from "../components/RunRow";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import SectionHeader from "../components/ui/SectionHeader";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import Skeleton from "../components/ui/Skeleton";
import { cn } from "../lib/utils";

const SEVERITIES = ["critical", "warning", "info"];

function RunsSkeleton() {
  return (
    <Card className="overflow-hidden p-0">
      <div className="space-y-0 divide-y divide-border">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-5">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="hidden h-6 w-16 md:block" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function Home() {
  const { data, loading, error, refetch } = useFetch(fetchRuns);
  const [severity, setSeverity] = useState("all");
  const [starting, setStarting] = useState(false);

  const runs = useMemo(() => {
    const list = data?.data || [];
    return [...list]
      .filter((run) => severity === "all" || run.highest_severity === severity)
      .sort((a, b) => {
        const aActive = a.ended_at == null;
        const bActive = b.ended_at == null;
        if (aActive !== bActive) return aActive ? -1 : 1;
        return new Date(b.started_at) - new Date(a.started_at);
      });
  }, [data, severity]);

  const stats = useMemo(() => {
    const list = data?.data || [];
    return {
      total: list.length,
      live: list.filter((r) => r.ended_at == null).length,
      critical: list.filter((r) => r.highest_severity === "critical").length,
    };
  }, [data]);

  async function startRun() {
    setStarting(true);
    try {
      await createRun();
      await refetch();
    } finally {
      setStarting(false);
    }
  }

  const totalRuns = data?.data?.length || 0;

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Runs"
        title="Application runs"
        description="Recorded behavior and detected findings from your local sessions."
        actions={
          <Button onClick={startRun} loading={starting} leftIcon={<Plus size={16} />}>
            Start run
          </Button>
        }
      />

      {!loading && !error && totalRuns > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="dm-stat-tile">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Total runs</p>
            <p className="mt-1 font-data text-2xl font-semibold">{stats.total}</p>
          </div>
          <div className="dm-stat-tile">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Live now</p>
            <p className="mt-1 flex items-center gap-2 font-data text-2xl font-semibold text-primary">
              {stats.live}
              {stats.live > 0 && <Radio size={16} className="animate-pulse" />}
            </p>
          </div>
          <div className="dm-stat-tile">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Critical</p>
            <p className={cn("mt-1 font-data text-2xl font-semibold", stats.critical > 0 && "text-destructive-strong")}>
              {stats.critical}
            </p>
          </div>
        </div>
      )}

      <Card className="p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="font-data text-micro text-muted-foreground">
            Showing {runs.length} of {totalRuns} {totalRuns === 1 ? "run" : "runs"}
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {["all", ...SEVERITIES].map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={severity === value}
                onClick={() => setSeverity(value)}
                className="dm-filter-chip"
              >
                {value === "all" ? "All" : value}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {loading && <RunsSkeleton />}
      {error && <ErrorState description={error} onRetry={refetch} />}

      {!loading && !error && !runs.length && (
        <EmptyState
          icon={Activity}
          title={totalRuns ? "No matching runs" : "No runs yet"}
          description={
            totalRuns
              ? "Try a different severity filter."
              : "Start a run to begin recording application behavior."
          }
          action={!totalRuns && <Button onClick={startRun} loading={starting}>Start your first run</Button>}
        />
      )}

      {!loading && !error && runs.length > 0 && (
        <Card className="overflow-hidden p-0 shadow-sm">
          <div className="hidden border-b border-border bg-muted/30 px-6 py-3 font-data text-micro uppercase tracking-wider text-muted-foreground md:grid md:grid-cols-[minmax(220px,1fr)_72px_64px_96px_96px_88px_20px] md:gap-4">
            <span>Run</span>
            <span className="text-right">Requests</span>
            <span className="text-right">Errors</span>
            <span className="text-right">Severity</span>
            <span className="text-right">Findings</span>
            <span className="text-right">Status</span>
            <span />
          </div>
          <ul>
            {runs.map((run) => (
              <RunRow key={run.id} run={run} />
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
