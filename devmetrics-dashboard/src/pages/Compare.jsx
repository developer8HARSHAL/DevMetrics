import { useCallback, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, GitCompareArrows } from "lucide-react";
import { useFetch } from "../hooks/useFetch";
import { compareRuns, fetchRuns } from "../lib/runs";
import Button from "../components/ui/Button";
import Card, { CardContent } from "../components/ui/Card";
import SectionHeader from "../components/ui/SectionHeader";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import Badge from "../components/ui/Badge";
import Skeleton from "../components/ui/Skeleton";
import { cn } from "../lib/utils";

const VERDICTS = {
  improved: { mark: "✓", label: "Improved", variant: "success" },
  regressed: { mark: "✕", label: "Regressed", variant: "destructive" },
  unchanged: { mark: "—", label: "Unchanged", variant: "outline" },
  mixed: { mark: "△", label: "Mixed", variant: "warning" },
};

function Delta({ label, value, direction, negative }) {
  const up = direction === "up";
  const down = direction === "down";
  const color = negative
    ? down ? "text-success" : up ? "text-destructive-strong" : "text-muted-foreground"
    : up ? "text-success" : down ? "text-destructive-strong" : "text-muted-foreground";

  return (
    <div className="dm-stat-tile">
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-1 font-data text-xl font-semibold", color)}>
        {direction === "up" && "↑ "}
        {direction === "down" && "↓ "}
        {value ?? "—"}
      </p>
    </div>
  );
}

function EndpointDiff({ endpoints = {}, statusChanges = [] }) {
  const [open, setOpen] = useState(false);
  const onlyA = endpoints.onlyInA || [];
  const onlyB = endpoints.onlyInB || [];
  const shared = endpoints.shared || [];

  return (
    <Card className="shadow-sm">
      <CardContent className="py-4">
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-lg px-1 py-1 text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <span className="font-data text-micro">
            {shared.length} shared endpoint{shared.length === 1 ? "" : "s"}
          </span>
          <span className="text-xs">{open ? "Hide diff" : "View diff"}</span>
        </button>

        {open && (
          <div className="mt-5 space-y-4 rounded-lg bg-muted/25 p-4 font-data text-micro">
            {onlyA.length > 0 && (
              <div>
                <p className="mb-2 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Only in run A</p>
                {onlyA.map((ep) => <p key={ep} className="py-0.5">{ep}</p>)}
              </div>
            )}
            {onlyB.length > 0 && (
              <div>
                <p className="mb-2 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Only in run B</p>
                {onlyB.map((ep) => <p key={ep} className="py-0.5">{ep}</p>)}
              </div>
            )}
            {statusChanges.length > 0 && (
              <div>
                <p className="mb-2 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Status changes</p>
                {statusChanges.map((c) => (
                  <p key={c.endpoint} className="py-0.5">{c.endpoint}: {c.statusA} → {c.statusB}</p>
                ))}
              </div>
            )}
            {!onlyA.length && !onlyB.length && !statusChanges.length && (
              <p className="text-muted-foreground">No endpoint-level differences.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Compare() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const a = searchParams.get("a");
  const b = searchParams.get("b");
  const [runA, setRunA] = useState(a || "");
  const [runB, setRunB] = useState(b || "");

  const runsQuery = useFetch(fetchRuns);
  const compareFetcher = useCallback(() => {
    if (!a || !b) return Promise.resolve({ data: { data: null } });
    return compareRuns(a, b);
  }, [a, b]);
  const compareQuery = useFetch(compareFetcher, {}, [a, b]);

  const runs = runsQuery.data?.data || [];
  const compare = compareQuery.data?.data;

  if (runsQuery.loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 max-w-md" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (runsQuery.error) return <ErrorState description={runsQuery.error} onRetry={runsQuery.refetch} />;

  if (runs.length < 2) {
    return (
      <EmptyState
        icon={GitCompareArrows}
        title="Need more runs"
        description="Record at least two runs before comparing them."
      />
    );
  }

  if (!a || !b) {
    return (
      <div className="space-y-6">
        <SectionHeader
          eyebrow="Compare"
          title="Compare runs"
          description="Pick a before and after run to see what changed."
        />
        <Card className="shadow-sm">
          <CardContent>
            <div className="grid items-end gap-4 md:grid-cols-[1fr_auto_1fr]">
              <label className="grid gap-2">
                <span className="font-mono text-micro uppercase tracking-wider text-muted-foreground">Run A — before</span>
                <select value={runA} onChange={(e) => setRunA(e.target.value)} className="dm-input dm-select font-data text-sm">
                  <option value="">Select a run</option>
                  {runs.map((run) => (
                    <option key={run.id} value={run.id}>{run.name || "Untitled run"}</option>
                  ))}
                </select>
              </label>
              <div className="hidden justify-center pb-3 text-muted-foreground md:flex">
                <ArrowRight size={20} />
              </div>
              <label className="grid gap-2">
                <span className="font-mono text-micro uppercase tracking-wider text-muted-foreground">Run B — after</span>
                <select value={runB} onChange={(e) => setRunB(e.target.value)} className="dm-input dm-select font-data text-sm">
                  <option value="">Select a run</option>
                  {runs.map((run) => (
                    <option key={run.id} value={run.id}>{run.name || "Untitled run"}</option>
                  ))}
                </select>
              </label>
            </div>
            {runA && runB && runA === runB && (
              <p className="mt-4 text-sm text-warning-strong">Choose two different runs.</p>
            )}
            <Button className="mt-6" disabled={!runA || !runB || runA === runB} onClick={() => navigate(`/compare?a=${runA}&b=${runB}`)}>
              Compare runs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (compareQuery.loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 max-w-lg" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  if (compareQuery.error) return <ErrorState description={compareQuery.error} onRetry={compareQuery.refetch} />;
  if (!compare) return <EmptyState title="No comparison data" description="Could not load comparison for these runs." />;

  const verdict = VERDICTS[compare.verdict] || VERDICTS.unchanged;
  const deltas = compare.deltas || {};

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Compare"
        title={`${compare.runA?.name || "Run A"} → ${compare.runB?.name || "Run B"}`}
        description="Side-by-side delta between two recorded sessions."
        actions={<Button variant="outline" onClick={() => navigate("/compare")}>New comparison</Button>}
      />

      <Card className="overflow-hidden shadow-sm">
        <CardContent>
          <Badge variant={verdict.variant} size="md">{verdict.mark} {verdict.label}</Badge>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Delta label="Requests" value={deltas.requestCount?.value ?? deltas.requestCount} direction={deltas.requestCount?.direction} />
            <Delta label="Errors" value={deltas.errorCount?.value ?? deltas.errorCount} direction={deltas.errorCount?.direction} negative />
            <Delta label="Avg latency" value={deltas.avgLatency?.value ?? deltas.avgLatency} direction={deltas.avgLatency?.direction} negative />
          </div>
        </CardContent>
      </Card>

      <EndpointDiff endpoints={compare.endpoints} statusChanges={compare.statusChanges} />

      <section>
        <h2 className="text-heading-md font-semibold">Findings</h2>
        {compare.findings?.length ? (
          <Card className="mt-4 divide-y divide-border p-0 shadow-sm">
            {compare.findings.map((f, i) => (
              <div key={f.id || `${f.type}-${f.endpoint}-${i}`} className="px-5 py-3.5 font-data text-sm transition-colors hover:bg-muted/30">
                {f.type.replace(/_/g, " ")} · {f.endpoint}
              </div>
            ))}
          </Card>
        ) : (
          <p className="mt-3 font-data text-micro text-muted-foreground">No finding changes between these runs.</p>
        )}
      </section>
    </div>
  );
}
