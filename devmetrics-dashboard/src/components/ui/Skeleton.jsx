import { cn } from "../../lib/utils";

export default function Skeleton({ className, ...props }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

/** A run of skeleton text lines — last line shorter, like real wrapped text. */
export function SkeletonText({ lines = 1, className }) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn("h-4", i === lines - 1 && lines > 1 && "w-3/4")} />
      ))}
    </div>
  );
}