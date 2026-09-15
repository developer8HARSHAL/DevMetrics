import { cn } from "../lib/utils";


const TONE = {
  info: { bg: "bg-info/10", text: "text-info-strong" },
  success: { bg: "bg-success/10", text: "text-success" },
  warning: { bg: "bg-warning/10", text: "text-warning-strong" },
  destructive: { bg: "bg-destructive/10", text: "text-destructive-strong" },
  mixed: { bg: "bg-mixed/10", text: "text-mixed" },
};


export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  status,
  color,
  variant = "default",
  className,
}) {
  const tone = TONE[status ?? color] ?? null;
  const compact = variant === "compact";

  return (
    <div
      className={cn(
        "rounded-md border border-border bg-card text-card-foreground",
        compact ? "p-4" : "p-6",
        className
      )}
    >
      <div
        className={cn(
          "flex items-start justify-between",
          compact ? "mb-2" : "mb-4"
        )}
      >
        {Icon && !compact && (
          <div
            className={cn(
              "rounded-xl p-3",
              tone ? tone.bg : "bg-muted"
            )}
          >
            <Icon
              size={22}
              strokeWidth={1.5}
              className={tone ? tone.text : "text-muted-foreground"}
            />
          </div>
        )}

        {trend && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              trend.positive
                ? "bg-success/10 text-success"
                : "bg-destructive/10 text-destructive-strong"
            )}
          >
            {trend.value}
          </span>
        )}
      </div>

      <div>
        <p
          className={cn(
            "text-muted-foreground",
            compact ? "mb-1 text-xs" : "mb-2 text-sm"
          )}
        >
          {title}
        </p>

        <p
          className={cn(
            "font-data font-semibold text-foreground",
            compact ? "text-xl" : "mb-1 text-3xl"
          )}
        >
          {value}
        </p>

        {subtitle && !compact && (
          <p className="text-xs text-muted-foreground/80">{subtitle}</p>
        )}
      </div>
    </div>
  );
}