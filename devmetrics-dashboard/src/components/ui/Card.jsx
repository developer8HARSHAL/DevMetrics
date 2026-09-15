import { cn } from "../../lib/utils";

export default function Card({
  interactive = false,
  elevated = false,
  className,
  children,
  ...props
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-border bg-card text-card-foreground",
        elevated && "shadow-sm",
        interactive &&
          "cursor-pointer transition-colors duration-fast ease-standard hover:bg-muted/40",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 px-5 py-4 md:px-6 md:py-5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  as: Heading = "h3",
  className,
  children,
  ...props
}) {
  return (
    <Heading
      className={cn(
        "text-base font-medium tracking-tight text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </Heading>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}) {
  return (
    <p
      className={cn(
        "mt-1 text-sm leading-5 text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }) {
  return (
    <div
      className={cn("px-5 py-4 md:px-6 md:py-5", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 border-t border-border px-5 py-4 md:px-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}