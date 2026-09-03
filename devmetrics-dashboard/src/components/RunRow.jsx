import { Activity, CheckCircle2, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Badge from "./ui/Badge";
import { formatRelativeTime } from "../lib/runs";
import { cn, toNumber } from "../lib/utils";

const SEVERITY_VARIANT = {
  critical: "destructive",
  warning: "warning",
  info: "info",
};

export default function RunRow({ run }) {
  const navigate = useNavigate();
  const active = run.ended_at == null;

  const requests = toNumber(run.request_count);
  const errors = toNumber(run.error_count);
  const findings = toNumber(run.finding_count);
  const severityVariant = SEVERITY_VARIANT[run.highest_severity];

  const open = () => navigate(`/sessions/${run.id}`);

  return (
    <li
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      }}
      className={cn(
        "group relative cursor-pointer border-b border-border/80 px-4 py-4 transition-all duration-normal ease-standard last:border-b-0",
        "hover:bg-surface-1/80 hover:shadow-[inset_3px_0_0_0_var(--color-primary)]",
        "md:grid md:grid-cols-[minmax(220px,1fr)_72px_64px_96px_96px_88px_20px] md:items-center md:gap-4 md:px-6"
      )}
    >
      {/* Mobile card layout */}
      <div className="flex items-start justify-between gap-3 md:contents">
        <div className="min-w-0 flex-1 md:min-w-0">
          <p className="truncate text-sm font-medium text-foreground group-hover:text-foreground">
            {run.name || "Untitled run"}
          </p>
          <p className="mt-1 truncate font-data text-micro text-muted-foreground">
            {run.hostname || "Unknown host"} · {formatRelativeTime(run.started_at)}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 md:hidden">
            <span className="font-data text-xs text-muted-foreground">{requests} req</span>
            <span className="text-muted-foreground/40">·</span>
            <span className="font-data text-xs text-muted-foreground">{errors} err</span>
            <span className="text-muted-foreground/40">·</span>
            <span className="font-data text-xs text-muted-foreground">{findings} findings</span>
            {severityVariant && <Badge variant={severityVariant} size="xs">{run.highest_severity}</Badge>}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 md:hidden">
          <Badge variant={active ? "primary" : "outline"} dot>
            {active ? "Live" : "Ended"}
          </Badge>
          <ChevronRight size={16} className="text-muted-foreground/50" />
        </div>
      </div>

      {/* Desktop columns */}
      <span className="hidden justify-self-end font-data text-sm md:block">{requests}</span>
      <span className={cn("hidden justify-self-end font-data text-sm md:block", errors > 0 && "text-destructive-strong")}>{errors}</span>
      <span className="hidden justify-self-end md:block">
        {severityVariant ? (
          <Badge variant={severityVariant} size="xs">{run.highest_severity}</Badge>
        ) : (
          <span className="font-data text-micro text-muted-foreground">—</span>
        )}
      </span>
      <span className="hidden justify-self-end font-data text-sm text-muted-foreground md:block">{findings}</span>
      <div className="hidden justify-self-end md:block">
        <Badge variant={active ? "primary" : "outline"} dot>
          {active ? <Activity size={11} /> : <CheckCircle2 size={11} />}
          {active ? "Live" : "Ended"}
        </Badge>
      </div>
      <ChevronRight size={16} className="hidden text-muted-foreground/0 transition-colors group-hover:text-muted-foreground md:block" />
    </li>
  );
}
