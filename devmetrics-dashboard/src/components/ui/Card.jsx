import { cn } from "../../lib/utils";

/**
 * Card
 * -----------------------------------------------------------------------
 * The atomic unit of this design system (design doc §2.3) — every stat,
 * chart, list, or table sits inside one. Base: --color-card bg, --radius-xl,
 * --shadow-sm, border. `interactive` is for cards that act as a single
 * clickable surface (e.g. a Run rendered as a card) — no wrapping <button>
 * needed, uses the duration-normal/ease-standard utilities already defined
 * in globals.css.
 */
export default function Card({ interactive = false, className, children, ...props }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card shadow-sm",
        interactive &&
          "cursor-pointer transition-shadow duration-normal ease-standard hover:shadow-md",
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
      className={cn("flex items-start justify-between gap-4 px-5 pt-5 md:px-6 md:pt-6", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ as: Heading = "h3", className, children, ...props }) {
  return (
    <Heading className={cn("text-heading-md font-semibold text-foreground", className)} {...props}>
      {children}
    </Heading>
  );
}

export function CardDescription({ className, children, ...props }) {
  return (
    <p className={cn("mt-1 text-body-sm text-muted-foreground", className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }) {
  return (
    <div className={cn("px-5 py-5 md:px-6 md:py-6", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 border-t border-border px-5 pb-5 pt-4 md:px-6 md:pb-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}