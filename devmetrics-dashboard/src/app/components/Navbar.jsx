import { RefreshCw } from 'lucide-react';

export default function Navbar({ onRefresh, loading = false, title = "Dashboard Overview", subtitle }) {
  return (
    <header className="bg-white border-b border-gray-100">
      <div className="px-8 py-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors text-sm font-medium"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} strokeWidth={2} />
          <span>Refresh</span>
        </button>
      </div>
    </header>
  );
}