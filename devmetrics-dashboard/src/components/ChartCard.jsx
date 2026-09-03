export default function ChartCard({ title, subtitle, children, actions }) {
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold" style={{ color: 'var(--ink-strong)' }}>{title}</h3>
          {subtitle && (
            <p className="text-sm mt-1" style={{ color: 'var(--ink-muted)' }}>{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
      <div className="w-full">{children}</div>
    </div>
  );
}