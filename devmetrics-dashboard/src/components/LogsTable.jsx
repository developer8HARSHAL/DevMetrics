import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function LogsTable({ logs, pagination, onPageChange }) {
  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatResponseTime = (ms) => {
    if (ms === null || ms === undefined) return '0ms';
    const num = parseFloat(ms);
    if (num < 1000) {
      return `${num.toFixed(0)}ms`;
    }
    return `${(num / 1000).toFixed(2)}s`;
  };

  const getStatusBadgeStyle = (status) => {
    if (status < 200) return { background: 'var(--color-info-bg)', color: 'var(--color-info)' };
    if (status < 300) return { background: 'var(--color-success-bg)', color: 'var(--color-success)' };
    if (status < 400) return { background: 'var(--color-warning-bg)', color: 'var(--color-warning)' };
    if (status < 500) return { background: '#fff7ed', color: '#c2410c' };
    return { background: 'var(--color-danger-bg)', color: 'var(--color-danger)' };
  };

  const getMethodStyle = (method) => {
    const styles = {
      GET: { background: 'var(--color-info-bg)', color: 'var(--color-info)' },
      POST: { background: 'var(--color-success-bg)', color: 'var(--color-success)' },
      PUT: { background: 'var(--color-warning-bg)', color: 'var(--color-warning)' },
      PATCH: { background: 'var(--brand-light)', color: 'var(--brand-text)' },
      DELETE: { background: 'var(--color-danger-bg)', color: 'var(--color-danger)' },
    };
    return styles[method?.toUpperCase()] || { background: 'var(--surface-sunken)', color: 'var(--ink-muted)' };
  };

  if (!logs || logs.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p style={{ color: 'var(--ink-subtle)' }}>No logs found</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead style={{ background: 'var(--surface-sunken)', borderBottom: '1px solid var(--border)' }}>
            <tr>
              {['Endpoint', 'Method', 'Status', 'Response Time', 'Timestamp'].map((h) => (
                <th key={h} className="eyebrow px-6 py-3 text-left whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {logs.map((log, index) => (
              <tr
                key={log.id || index}
                className="transition-colors"
                style={{ borderColor: 'var(--border)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <td className="text-mono px-6 py-4 text-sm" style={{ color: 'var(--ink-strong)' }}>
                  {log.endpoint}
                </td>
                <td className="px-6 py-4">
                  <span className="badge" style={getMethodStyle(log.method)}>{log.method}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="badge text-mono" style={getStatusBadgeStyle(log.status)}>{log.status}</span>
                </td>
                <td className="text-mono px-6 py-4 text-sm font-medium" style={{ color: 'var(--ink-strong)' }}>
                  {formatResponseTime(log.response_time)}
                </td>
                <td className="px-6 py-4 text-sm" style={{ color: 'var(--ink-subtle)' }}>
                  {formatDate(log.timestamp)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.pages > 1 && (
        <div
          className="px-6 py-4 flex items-center justify-between border-t"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="text-sm" style={{ color: 'var(--ink-muted)' }}>
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-1.5 rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              style={{ borderColor: 'var(--border)' }}
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-mono px-2 text-sm font-medium" style={{ color: 'var(--ink)' }}>
              {pagination.page} / {pagination.pages}
            </span>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="p-1.5 rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              style={{ borderColor: 'var(--border)' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}