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
      minute: '2-digit'
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

  const getStatusBadgeColor = (status) => {
    if (status < 200) return 'bg-blue-50 text-blue-700';
    if (status < 300) return 'bg-green-50 text-green-700';
    if (status < 400) return 'bg-amber-50 text-amber-700';
    if (status < 500) return 'bg-orange-50 text-orange-700';
    return 'bg-red-50 text-red-700';
  };

  const getMethodColor = (method) => {
    const colors = {
      GET: 'bg-blue-50 text-blue-700',
      POST: 'bg-green-50 text-green-700',
      PUT: 'bg-amber-50 text-amber-700',
      PATCH: 'bg-purple-50 text-purple-700',
      DELETE: 'bg-red-50 text-red-700',
    };
    return colors[method?.toUpperCase()] || 'bg-gray-50 text-gray-700';
  };

  if (!logs || logs.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <p className="text-gray-500">No logs found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">
                Endpoint
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">
                Method
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">
                Response Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">
                Timestamp
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map((log, index) => (
              <tr key={log._id || index} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-900 font-mono">
                  {log.endpoint}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${getMethodColor(log.method)}`}>
                    {log.method}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(log.status)}`}>
                    {log.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                  {formatResponseTime(log.responseTime)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {formatDate(log.timestamp)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} results
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-4 py-1.5 text-sm text-gray-700 font-medium">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}