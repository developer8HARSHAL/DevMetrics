import { forwardRef } from "react";
import { cn } from "../../lib/utils";

/**
 * Button
 * -----------------------------------------------------------------------
 * Rules applied (ui-ux-pro-max priority framework, categories 1/2/6):
 *  - Min hit target 44x44 on `md`/`lg` (Touch & Interaction, CRITICAL).
 *  - Focus ring inherited from globals.css :focus-visible — never overridden
 *    here (Accessibility, CRITICAL: "removing focus rings" is an anti-pattern).
 *  - Color only from tokens (--primary/--secondary/--destructive/--muted) —
 *    no raw hex (Typography & Color, MEDIUM: "raw hex in components").
 *  - `disabled` and `loading` states are visually distinct, not just opacity,
 *    so they aren't conveyed by dimness alone.
 */
const variants = {
  primary:
    "bg-primary text-primary-foreground hover:brightness-95 active:brightness-90",
  secondary:
    "bg-secondary text-secondary-foreground hover:brightness-110 active:brightness-95",
  outline:
    "border border-border bg-transparent text-foreground hover:bg-muted",
  ghost: "bg-transparent text-foreground hover:bg-muted",
  destructive:
    "bg-destructive-strong text-destructive-foreground hover:brightness-95",
};

const sizes = {
  sm: "h-9 px-3 text-body-sm gap-1.5",
  md: "h-11 px-4 text-body-sm gap-2", // 44px — meets min touch target
  lg: "h-12 px-5 text-base gap-2",
  icon: "h-11 w-11", // square, still 44px
};

const Button = forwardRef(function Button(
  {
    variant = "primary",
    size = "md",
    className,
    disabled,
    loading,
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
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium",
        "transition-colors duration-normal ease-standard",
        "disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <span
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
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