import { useMemo } from "react";
import {
  CheckCircle2,
  CircleAlert,
  Clock3,
} from "lucide-react";

import { useFetch } from "../hooks/useFetch";
import { fetchRuns } from "../lib/runs";

import Card, { CardContent } from "../components/ui/Card";
import SectionHeader from "../components/ui/SectionHeader";
import ErrorState from "../components/ui/ErrorState";
import { Skeleton } from "../components/ui/Loader";

export default function AnalyticsPage() {
  const { data, loading, error, refetch } = useFetch(fetchRuns);

  const runs = Array.isArray(data)
    ? data
    : data?.runs || [];

  const stats = useMemo(() => {
    const completed = runs.filter(
      (run) => run.run_status === "completed"
    );

    const failed = runs.filter(
      (run) => Number(run.error_count) > 0
    );

    const totalRequests = runs.reduce(
      (sum, run) =>
        sum + Number(run.request_count || 0),
      0
    );

    const totalErrors = runs.reduce(
      (sum, run) =>
        sum + Number(run.error_count || 0),
      0
    );

    const durations = completed
      .map((run) => Number(run.duration_ms))
      .filter((duration) => Number.isFinite(duration));

    const averageDuration = durations.length
      ? Math.round(
          durations.reduce(
            (sum, duration) => sum + duration,
            0
          ) / durations.length
        )
      : 0;

    return {
      totalRuns: runs.length,
      completedRuns: completed.length,
      failedRuns: failed.length,
      totalRequests,
      totalErrors,
      errorRate: totalRequests
        ? ((totalErrors / totalRequests) * 100).toFixed(1)
        : "0.0",
      averageDuration,
    };
  }, [runs]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full max-w-lg" />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((index) => (
            <Skeleton
              key={index}
              className="h-24 rounded-xl"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        description={error}
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Analytics"
        title="Run analytics"
        description="Performance and reliability across your recorded runs."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Total runs
            </p>

            <p className="mt-2 text-2xl font-semibold">
              {stats.totalRuns}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Completed
            </p>

            <p className="mt-2 flex items-center gap-2 text-2xl font-semibold">
              {stats.completedRuns}
              <CheckCircle2 size={18} />
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Failed runs
            </p>

            <p className="mt-2 flex items-center gap-2 text-2xl font-semibold">
              {stats.failedRuns}
              <CircleAlert size={18} />
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Avg. duration
            </p>

            <p className="mt-2 flex items-center gap-2 text-2xl font-semibold">
              {stats.averageDuration}ms
              <Clock3 size={18} />
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Request volume
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {stats.totalRequests.toLocaleString()}
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            {stats.totalErrors.toLocaleString()} errors ·{" "}
            {stats.errorRate}% error rate
          </p>
        </CardContent>
      </Card>
    </div>
  );
}