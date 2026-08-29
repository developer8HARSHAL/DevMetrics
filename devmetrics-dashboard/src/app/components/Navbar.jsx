import { RefreshCw } from 'lucide-react';

export default function Navbar({ onRefresh, loading = false, title = "Dashboard Overview", subtitle }) {
  return (
    <header
      className="border-b"
      style={{ background: 'var(--surface-page)', borderColor: 'var(--border)' }}
    >
      <div className="px-8 py-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold" style={{ color: 'var(--ink-strong)' }}>
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm mt-1" style={{ color: 'var(--ink-muted)' }}>
              {subtitle}
            </p>
          )}
        </div>

        <button onClick={onRefresh} disabled={loading} className="btn-primary">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} strokeWidth={2} />
          <span>Refresh</span>
        </button>
      </div>
    </header>
  );
}