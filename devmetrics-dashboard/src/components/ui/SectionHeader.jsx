function SectionHeader({
  eyebrow,
  title,
  description,
  actions,
  as: Heading = 'h2',
  className = '',
}) {
  return (
    <div
      className={[
        'flex flex-col gap-3',
        'sm:flex-row sm:items-end sm:justify-between',
        className,
      ].join(' ')}
    >
      <div className="min-w-0">
        {/* Optional, and meant to stay optional — only pass this when a
            section genuinely needs a context label, not on every header
            by default. */}
        {eyebrow && (
          <p className="font-mono text-micro uppercase tracking-[0.16em] text-muted-foreground">
            {eyebrow}
          </p>
        )}

        <Heading className="mt-1 text-heading-md font-semibold tracking-tight text-foreground">
          {title}
        </Heading>

        {description && (
          <p className="mt-1 max-w-2xl text-body-sm leading-6 text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex shrink-0 items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}

export default SectionHeader;