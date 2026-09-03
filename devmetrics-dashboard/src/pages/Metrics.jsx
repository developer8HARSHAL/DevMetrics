import { useState } from "react";
import { BarChart3, TrendingUp } from "lucide-react";
import { useFetch } from "../hooks/useFetch";
import { fetchOverview, fetchEndpointMetrics } from "../lib/api";
import { getApiKey } from "../lib/auth";
import AnalyticsLineChart from "../components/AnalyticsLineChart";
import Card, { CardContent } from "../components/ui/Card";
import SectionHeader from "../components/ui/SectionHeader";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import Skeleton from "../components/ui/Skeleton";

function pct(count, total) {
  if (!total) return "0.0";
  return ((count / total) * 100).toFixed(1);
}

function rangeToDates(range) {
  const endDate = new Date();
  const startDate = new Date();
  if (range === "24h") startDate.setHours(startDate.getHours() - 24);
  if (range === "7d") startDate.setDate(startDate.getDate() - 7);
  if (range === "30d") startDate.setDate(startDate.getDate() - 30);
  return { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
}

const RANGE_LABELS = { "24h": "Last 24 hours", "7d": "Last 7 days", "30d": "Last 30 days" };

export default function AnalyticsPage() {
  const [range, setRange] = useState("24h");
  const hasApiKey = Boolean(getApiKey());
  const params = rangeToDates(range);

  const { data: overviewRes, loading, error, refetch } = useFetch(
    (p) => fetchOverview(p, getApiKey()),
    params,
    [range]
  );
  const { data: endpointsRes, loading: loadingEndpoints } = useFetch(
    (p) => fetchEndpointMetrics(p, getApiKey()),
    params,
    [range]
  );

  if (!hasApiKey) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Connect an API key"
        description="Add your DevMetrics API key to view live analytics from your application."
      />
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full max-w-lg" />
        <Skeleton className="h-52 w-full rounded-xl" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) return <ErrorState description={error} onRetry={refetch} />;

  // NOTE: useFetch's `data` is already response.data (the {success, data}
  // body), so the real payload is one level shallower than it looks —
  // overviewRes.data, not overviewRes.data.data. The double-unwrap here
  // was silently producing `undefined` -> `if (!overview) return null`
  // -> blank page, with no console error and a perfectly fine network response.
  const overview = overviewRes?.data;
  const endpoints = endpointsRes?.data;
  if (!overview) return null;

  const totalByStatus = overview.requestsByStatus?.reduce((sum, s) => sum + s.count, 0) || 0;
  const topEndpoints = [...(endpoints || [])].sort((a, b) => b.totalRequests - a.totalRequests).slice(0, 5);
  const totalRequests = overview.requestsByStatus?.reduce((s, r) => s + r.count, 0) || 0;
  const errorCount = overview.requestsByStatus?.filter((s) => s._id?.startsWith("5") || s._id?.startsWith("4")).reduce((s, r) => s + r.count, 0) || 0;

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Analytics"
        title="Request analytics"
        description={RANGE_LABELS[range]}
        actions={
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="dm-input dm-select w-auto min-w-[140px] font-data text-sm"
          >
            <option value="24h">24 hours</option>
            <option value="7d">7 days</option>
            <option value="30d">30 days</option>
          </select>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="dm-stat-tile">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Total requests</p>
          <p className="mt-1 font-data text-2xl font-semibold">{totalRequests.toLocaleString()}</p>
        </div>
        <div className="dm-stat-tile">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Error rate</p>
          <p className="mt-1 font-data text-2xl font-semibold">{pct(errorCount, totalRequests)}%</p>
        </div>
        <div className="dm-stat-tile sm:col-span-2 lg:col-span-1">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Top endpoints</p>
          <p className="mt-1 flex items-center gap-2 font-data text-2xl font-semibold">
            {topEndpoints.length}
            <TrendingUp size={18} className="text-primary" />
          </p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent>
          <p className="mb-4 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Request volume</p>
          <AnalyticsLineChart points={overview.requestsOverTime} />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardContent>
            <p className="mb-4 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">By status</p>
            {totalByStatus === 0 ? (
              <p className="text-sm text-muted-foreground">No requests recorded.</p>
            ) : (
              ["2xx", "4xx", "5xx"].map((cls) => {
                const entry = overview.requestsByStatus?.find((s) => s._id === cls);
                if (!entry) return null;
                const barColor = cls === "2xx" ? "bg-success" : cls === "4xx" ? "bg-warning" : "bg-destructive";
                const pctVal = parseFloat(pct(entry.count, totalByStatus));
                return (
                  <div key={cls} className="mb-4 last:mb-0">
                    <div className="mb-1.5 flex justify-between font-data text-sm">
                      <span className="text-muted-foreground">{cls}</span>
                      <span className="font-medium">{pct(entry.count, totalByStatus)}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${pctVal}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent>
            <p className="mb-4 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Top endpoints</p>
            {loadingEndpoints ? (
              <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-8" />)}</div>
            ) : !topEndpoints.length ? (
              <p className="text-sm text-muted-foreground">No endpoint activity.</p>
            ) : (
              topEndpoints.map((e, i) => (
                <div key={e.endpoint} className="flex items-center gap-3 border-b border-border/80 py-2.5 last:border-0">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted font-mono text-[10px] text-muted-foreground">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-data text-sm text-muted-foreground">{e.endpoint}</span>
                  <span className="shrink-0 font-data text-sm font-medium">
                    {e.totalRequests >= 1000 ? `${(e.totalRequests / 1000).toFixed(1)}k` : e.totalRequests}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}