export default function AnalyticsLineChart({ points, height = 180 }) {
  if (!points || points.length < 2) {
    return (
      <div className="flex h-[180px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
        <p className="font-data text-sm text-muted-foreground">Not enough data to chart yet.</p>
      </div>
    );
  }

  const width = 800;
  const pad = 8;
  const values = points.map((p) => p.count);
  const max = Math.max(...values, 1);

  const coords = points.map((p, i) => {
    const x = pad + (i / (points.length - 1)) * (width - pad * 2);
    const y = height - pad - ((p.count / max) * (height - pad * 2));
    return [x, y];
  });

  const line = coords.map(([x, y]) => `${x},${y}`).join(" ");
  const area = `${coords[0][0]},${height - pad} ${line} ${coords[coords.length - 1][0]},${height - pad}`;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} className="overflow-visible" preserveAspectRatio="none">
        <defs>
          <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((pct) => (
          <line
            key={pct}
            x1={pad}
            x2={width - pad}
            y1={height - pad - pct * (height - pad * 2)}
            y2={height - pad - pct * (height - pad * 2)}
            stroke="var(--color-border)"
            strokeWidth="1"
            strokeDasharray="4 4"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <polygon points={area} fill="url(#chart-fill)" />
        <polyline
          points={line}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {coords.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3" fill="var(--color-background)" stroke="var(--color-primary)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
    </div>
  );
}
