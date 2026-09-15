function Badge({
  children,
  variant = "default",
  size = "sm",
  dot = false,
  className = "",
  ...props
}) {
  const variants = {
    default: "bg-muted text-muted-foreground",

    primary: "bg-primary/10 text-primary",

    secondary: "bg-transparent text-secondary-foreground",

    success: "bg-success/10 text-success",

    info: "bg-info/10 text-info-strong",

    warning: "bg-warning/10 text-warning-strong",

    destructive: "bg-destructive/10 text-destructive-strong",

    outline: "border border-border bg-background text-muted-foreground",

    // HTTP method identity — fixed per verb, not a severity judgement,
    // so kept separate from the semantic status variants above.
    get: "bg-method-get/10 text-method-get",
    post: "bg-method-post/10 text-method-post",
    put: "bg-method-put/10 text-method-put",
    patch: "bg-method-patch/10 text-method-patch",
    delete: "bg-method-delete/10 text-method-delete",
  };

  const sizes = {
    xs: "min-h-5 px-1.5 text-[10px] leading-4",
    sm: "min-h-6 px-2 text-xs leading-4",
    md: "min-h-7 px-2.5 text-sm leading-5",
  };

  const dotColors = {
    default: "bg-muted-foreground",
    primary: "bg-primary",
    secondary: "bg-secondary-foreground",
    success: "bg-success",
    info: "bg-info",
    warning: "bg-warning",
    destructive: "bg-destructive",
    outline: "bg-muted-foreground",
    get: "bg-method-get",
    post: "bg-method-post",
    put: "bg-method-put",
    patch: "bg-method-patch",
    delete: "bg-method-delete",
  };

  return (
    <span
      className={[
        "inline-flex w-fit items-center gap-1.5",
        "rounded-full font-medium whitespace-nowrap",
        variants[variant] ?? variants.default,
        sizes[size] ?? sizes.sm,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
            dotColors[variant] ?? dotColors.default
          }`}
        />
      )}

      {children}
    </span>
  );
}

export default Badge;