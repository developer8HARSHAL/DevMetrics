function Badge({
  children,
  variant = 'default',
  size = 'sm',
  dot = false,
  className = '',
  ...props
}) {
  const variants = {
    default: [
      'bg-muted',
      'text-muted-foreground',
    ].join(' '),

    primary: [
      'bg-primary/15',
      'text-foreground',
    ].join(' '),

    secondary: [
      'bg-secondary/10',
      'text-secondary',
    ].join(' '),

    success: [
      'bg-success/10',
      'text-success',
    ].join(' '),

    // Fixed: raw --info (accent cyan) as text on a light tint tests at
    // ~1.6:1 — fails AA badly. --info-strong tests at ~5.4:1.
    info: [
      'bg-info/10',
      'text-info-strong',
    ].join(' '),

    // Fixed: raw --warning as text tests at ~2.1:1 — fails AA.
    // --warning-strong tests at ~5.0:1.
    warning: [
      'bg-warning/10',
      'text-warning-strong',
    ].join(' '),

    // Fixed: raw --destructive as text tests at ~3.76:1 — fails AA for
    // normal-size text (needs 4.5:1). --destructive-strong tests at ~4.8:1.
    destructive: [
      'bg-destructive/10',
      'text-destructive-strong',
    ].join(' '),

    outline: [
      'border border-border',
      'bg-background',
      'text-muted-foreground',
    ].join(' '),
  };

  const sizes = {
    xs: 'min-h-5 px-1.5 text-[9px]',
    sm: 'min-h-6 px-2 text-micro',
    md: 'min-h-7 px-2.5 text-xs',
  };

  return (
    <span
      className={[
        'inline-flex w-fit items-center gap-1.5',
        'rounded-full font-medium',
        sizes[size] ?? sizes.sm,
        variants[variant] ?? variants.default,
        className,
      ].join(' ')}
      {...props}
    >
      {/* Dot stays full-saturation brand hue (fill, not text) — it's a
          3:1 non-text contrast requirement, not 4.5:1, and it never
          carries meaning alone since it always sits beside the label. */}
      {dot && (
        <span
          aria-hidden="true"
          className={[
            'h-1.5 w-1.5 shrink-0 rounded-full',
            variant === 'success' && 'bg-success',
            variant === 'info' && 'bg-info',
            variant === 'warning' && 'bg-warning',
            variant === 'destructive' && 'bg-destructive',
            variant === 'primary' && 'bg-primary',
            variant === 'secondary' && 'bg-secondary',
            variant === 'default' && 'bg-muted-foreground',
            variant === 'outline' && 'bg-muted-foreground',
          ]
            .filter(Boolean)
            .join(' ')}
        />
      )}

      {children}
    </span>
  );
}

export default Badge;