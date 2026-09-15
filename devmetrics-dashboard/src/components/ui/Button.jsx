import { forwardRef } from "react";
import { cn } from "../../lib/utils";

const variantClasses = {
  default:
    "bg-muted text-foreground hover:bg-border/50 active:bg-border/70",
  primary:
    "bg-primary text-primary-foreground hover:opacity-90 active:opacity-100",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-muted active:bg-muted",
  warning:
    "bg-warning text-warning-foreground hover:opacity-90 active:opacity-100",
  destructive:
    "bg-destructive text-destructive-foreground hover:bg-destructive-strong active:bg-destructive-strong",
  outline:
    "border border-border bg-background text-foreground hover:bg-muted active:bg-muted",
  ghost:
    "bg-transparent text-foreground hover:bg-muted active:bg-muted",
  link:
    "h-auto w-auto rounded-none p-0 bg-transparent text-primary underline-offset-4 hover:underline active:opacity-80",
};

const sizeClasses = {
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-sm gap-2",
  icon: "h-10 w-10 p-0",
};

/** Class-string helper for rendering a link that looks like a Button
 *  (e.g. <Link className={buttonVariants({ variant: "outline" })}>). */
export function buttonVariants({ variant = "primary", size = "md", className } = {}) {
  return cn(
    "inline-flex shrink-0 items-center justify-center rounded-md",
    "font-medium whitespace-nowrap",
    "transition-colors duration-slow ease-standard",
    "focus-visible:outline-none",
    "disabled:pointer-events-none disabled:opacity-20",
    sizeClasses[size] ?? sizeClasses.md,
    variantClasses[variant] ?? variantClasses.primary,
    className
  );
}

const Button = forwardRef(function Button(
  {
    variant = "primary",
    size = "md",
    className,
    disabled,
    loading = false,
    leftIcon,
    rightIcon,
    children,
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonVariants({ variant, size, className })}
      {...props}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : (
        leftIcon
      )}

      {children}

      {!loading && rightIcon}
    </button>
  );
});

export default Button;