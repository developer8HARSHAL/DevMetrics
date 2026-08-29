export default function MetricCard({ title, value, subtitle, icon: Icon, trend, color = 'blue' }) {
  const iconBgColors = {
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    yellow: 'bg-amber-50',
    red: 'bg-red-50',
    purple: 'bg-violet-50',
  };

  const iconColors = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    yellow: 'text-amber-600',
    red: 'text-red-600',
    purple: 'text-violet-600',
  };

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${iconBgColors[color]}`}>
          <Icon size={22} className={iconColors[color]} strokeWidth={1.5} />
        </div>
        {trend && (
          <div
            className="badge"
            style={
              trend.positive
                ? { background: 'var(--color-success-bg)', color: 'var(--color-success)' }
                : { background: 'var(--color-danger-bg)', color: 'var(--color-danger)' }
            }
          >
            {trend.value}
          </div>
        )}
      </div>

      <div>
        <p className="text-sm mb-2" style={{ color: 'var(--ink-muted)' }}>{title}</p>
        <p className="text-mono text-3xl font-semibold mb-1" style={{ color: 'var(--ink-strong)' }}>
          {value}
        </p>
        {subtitle && (
          <p className="text-xs" style={{ color: 'var(--ink-subtle)' }}>{subtitle}</p>
        )}
      </div>
    </div>
  );
}