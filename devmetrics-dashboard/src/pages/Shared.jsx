import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Terminal } from "lucide-react";
import { useFetch } from "../hooks/useFetch";
import { fetchSharedRun } from "../lib/runs";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";

const SEVERITY = {
  critical: { label: "Critical — needs immediate attention", mark: "▲", variant: "destructive" },
  warning: { label: "Worth reviewing soon", mark: "●", variant: "warning" },
  info: { label: "Good to know", mark: "○", variant: "info" },
};

function clock(v) {
  return v ? new Date(v).toLocaleTimeString("en-US", { hour12: false }) : "";
}

function findingTitle(finding) {
  const ep = finding.endpoint || "an endpoint";
  return ({
    error: `Errors on ${ep}`,
    error_burst: `Error burst on ${ep}`,
    retry_pattern: `Retry pattern on ${ep}`,
    duplicate_request: `Duplicate requests on ${ep}`,
    latency_anomaly: `Latency spike on ${ep}`,
  }[finding.type] || `Finding on ${ep}`);
}

function narrative(session, timeline, findings) {
  const duration = session.ended_at
    ? ((new Date(session.ended_at) - new Date(session.started_at)) / 1000).toFixed(1)
    : null;
  const critical = findings.filter((f) => f.severity === "critical");
  const intro = duration
    ? `This run captured ${timeline.length} requests over ${duration}s against ${session.hostname || "the target host"}.`
    : `This run captured ${timeline.length} requests against ${session.hostname || "the target host"}.`;

  if (!findings.length) return `${intro} No issues were detected.`;
  if (critical.length) {
    return `${intro} ${findings.length} issue${findings.length === 1 ? "" : "s"} detected, ${critical.length} critical.`;
  }
  return `${intro} ${findings.length} issue${findings.length === 1 ? "" : "s"} detected, none critical.`;
}

export default function Shared() {
  const { token } = useParams();
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const { data, loading, error } = useFetch(() => fetchSharedRun(token), null, [token]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-6">
        <p className="font-data text-sm text-muted-foreground">Loading report…</p>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 text-center">
        <p className="text-foreground">This report link is invalid or no longer available.</p>
        <Link to="/" className="mt-4 text-sm text-primary hover:underline">Go to DevMetrics</Link>
      </div>
    );
  }

  const { session, timeline = [], findings = [] } = data.data;
  const groups = ["critical", "warning"]
    .map((severity) => ({ severity, items: findings.filter((f) => f.severity === severity) }))
    .filter((g) => g.items.length);

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-card/80 px-6 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Terminal size={16} />
          </span>
          <span className="font-mono text-sm">dev<span className="text-primary">/metrics</span></span>
          <Badge variant="outline" className="ml-auto">Shared report</Badge>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">{session.name || "Untitled run"}</h1>
        <p className="mt-4 text-body-sm leading-relaxed text-muted-foreground">{narrative(session, timeline, findings)}</p>

        {groups.length > 0 && (
          <section className="mt-10">
            <p className="mb-4 font-mono text-micro uppercase tracking-wider text-muted-foreground">What was found</p>
            <div className="space-y-4">
              {groups.map(({ severity, items }) => {
                const sev = SEVERITY[severity];
                return (
                  <Card key={severity} className="p-5">
                    <div className="flex gap-3">
                      <span aria-hidden="true">{sev.mark}</span>
                      <div>
                        <p className="font-medium">{sev.label}</p>
                        {items.map((f) => (
                          <p key={f.id} className="mt-1 text-sm text-muted-foreground">{findingTitle(f)}.</p>
                        ))}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {!findings.length && (
          <p className="mt-8 text-sm text-success">No issues were found in this run.</p>
        )}

        <section className="mt-10 border-t border-border pt-6">
          <button
            type="button"
            className="text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setEvidenceOpen((v) => !v)}
            aria-expanded={evidenceOpen}
          >
            {evidenceOpen ? "Hide" : "View"} supporting evidence
          </button>

          {evidenceOpen && (
            <div className="mt-6 space-y-6">
              {findings.map((f) => (
                <div key={f.id} className="border-b border-border pb-4">
                  <p className="text-sm font-medium">{findingTitle(f)}</p>
                  <p className="mt-1 font-data text-micro text-muted-foreground">
                    {Number(f.occurrences) || 0} occurrence{(Number(f.occurrences) || 0) === 1 ? "" : "s"}
                  </p>
                </div>
              ))}
              <div>
                <p className="mb-3 font-mono text-micro uppercase tracking-wider text-muted-foreground">Full timeline</p>
                <Card className="overflow-hidden p-0">
                  <div className="divide-y divide-border font-data text-micro">
                    {timeline.map((row) => (
                      <div key={row.id} className="flex gap-4 px-4 py-2 text-muted-foreground">
                        <span>{clock(row.timestamp)}</span>
                        <span>{row.method}</span>
                        <span className="min-w-0 flex-1 truncate">{row.endpoint}</span>
                        <span>{row.status}</span>
                        <span>{row.response_time}ms</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          )}
        </section>
      </article>
    </div>
  );
}
