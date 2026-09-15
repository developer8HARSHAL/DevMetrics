import { useState } from "react";
import { Activity } from "lucide-react";
import { Link } from "react-router-dom";

import {
  fetchRuns,
  sortRuns,
} from "../lib/runs";
import {
  formatDuration,
  formatRelativeTime,
} from "../lib/formatters";
import { useFetch } from "../hooks/useFetch";
import { cn, toNumber } from "../lib/utils";

import Badge from "../components/ui/Badge";
import ChartCard from "../components/ChartCard";
import {
  Button,
  EmptyState,
  ErrorState,
  Pagination,
  Skeleton,
} from "../components/ui";

const PAGE_SIZE = 12;
const SKELETON_CARDS = 6;

const SEVERITY_VARIANT = {
  critical: "destructive",
  warning: "warning",
  info: "info",
};

function isActive(run) {
  const status =
    run.run_status || (run.ended_at ? "completed" : "running");

  return ["queued", "running", "analyzing"].includes(status);
}

function outcomeTone(run, active) {
  if (active) return null;

  if (
    toNumber(run.error_count) > 0 ||
    run.highest_severity === "critical"
  ) {
    return "destructive";
  }

  if (run.highest_severity === "warning") {
    return "warning";
  }

  return null;
}

export default function Home() {
  const [page, setPage] = useState(1);

  const { data, loading, error, refetch } = useFetch(fetchRuns);

  const runs = sortRuns(
    Array.isArray(data) ? data : data?.runs || [],
    "newest"
  );

  const total = runs.length;
  const pageRuns = runs.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  return (
    <ChartCard
      title="Runs"
      subtitle="Every execution across all your tests."
    >
      {error ? (
        <ErrorState description={error} onRetry={refetch} />
      ) : loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: SKELETON_CARDS }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-36 rounded-md"
            />
          ))}
        </div>
      ) : total === 0 ? (
        <EmptyState
          icon={Activity}
          title="No runs yet"
          description="Runs are started from a test's editor — go to Tests to run one."
          action={
            <Link to="/tests">
              <Button>Go to Tests</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {pageRuns.map((run) => {
              const active = isActive(run);
              const tone = outcomeTone(run, active);
              const requests = toNumber(run.request_count);
              const errors = toNumber(run.error_count);
              const findings = toNumber(run.finding_count);

              const findingVariant =
                findings > 0
                  ? SEVERITY_VARIANT[run.highest_severity] ||
                    "warning"
                  : "default";

              return (
                <Link
                  key={run.id}
                  to={`/sessions/${run.id}`}
                  className={cn(
                    "group flex flex-col gap-3.5 rounded-md border border-border p-4",
                    "transition-colors duration-normal ease-standard hover:bg-surface-1/70",
                    tone === "destructive"
                      ? "bg-destructive/5"
                      : tone === "warning"
                        ? "bg-warning/5"
                        : "bg-card"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {run.name || "Untitled run"}
                      </p>

                      <p className="mt-1 truncate font-data text-micro text-muted-foreground">
                        {run.hostname || "Unknown host"} ·{" "}
                        {formatRelativeTime(run.started_at)}
                      </p>
                    </div>

                    <Badge
                      variant={active ? "primary" : "outline"}
                      size="xs"
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          active
                            ? "animate-pulse bg-primary"
                            : "bg-muted-foreground"
                        )}
                      />
                      {active ? "Live" : "Ended"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-t border-border pt-3.5">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        Requests
                      </p>

                      <p className="mt-1 font-data text-sm font-medium text-foreground">
                        {requests}
                      </p>
                    </div>

                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        Errors
                      </p>

                      <Badge
                        variant={
                          errors > 0
                            ? "destructive"
                            : "default"
                        }
                        size="sm"
                        className="mt-1 font-data"
                      >
                        {errors}
                      </Badge>
                    </div>

                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        Findings
                      </p>

                      <Badge
                        variant={findingVariant}
                        size="sm"
                        className="mt-1 font-data"
                      >
                        {findings}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between font-data text-micro text-muted-foreground">
                    <span>
                      {active
                        ? "Running..."
                        : formatDuration(run.duration_ms) || "—"}
                    </span>

                    {!active && run.highest_severity && (
                      <Badge
                        variant={
                          SEVERITY_VARIANT[run.highest_severity] ||
                          "outline"
                        }
                        size="xs"
                      >
                        {run.highest_severity}
                      </Badge>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="rounded-md border border-border">
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={total}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}
    </ChartCard>
  );
}