import { cn } from "../../lib/utils";

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

export function Loader({
  size = "md",
  text = "Loading...",
  className,
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center p-12",
        className
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          "animate-spin rounded-full border-[3px] border-border border-t-primary",
          sizeClasses[size] ?? sizeClasses.md
        )}
      />

      {text && (
        <p className="mt-4 text-sm text-muted-foreground">
          {text}
        </p>
      )}
    </div>
  );
}

export function Skeleton({
  className,
  ...props
}) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "animate-pulse rounded-md bg-muted",
        className
      )}
      {...props}
    />
  );
}

export function SkeletonText({
  lines = 1,
  className,
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        className
      )}
    >
      {Array.from({ length: lines }).map(
        (_, index) => (
          <Skeleton
            key={index}
            className={cn(
              "h-4",
              index === lines - 1 &&
                lines > 1 &&
                "w-3/4"
            )}
          />
        )
      )}
    </div>
  );
}