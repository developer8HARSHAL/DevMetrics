
import { useState, useEffect } from 'react';
import { Search, Filter, AlertTriangle } from 'lucide-react';
import Navbar from '../layouts/Navbar';
import LogsTable from '../components/LogsTable';
import Loader from '../components/Loader';
import { fetchRecentRequests } from '../lib/api';

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    endpoint: '',
    status: '',
    limit: 50
  });

  const loadLogs = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        limit: filters.limit,
        ...(filters.endpoint && { endpoint: filters.endpoint }),
        ...(filters.status && { status: filters.status })
      };
      const response = await fetchRecentRequests(params);
      setLogs(response.data.data);
      setPagination(response.data.pagination);
      setCurrentPage(page);
    } catch (err) {
      setError(err.message || 'Failed to load logs');
      console.error('Logs error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(1);
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    loadLogs(1);
  };

  const handlePageChange = (page) => {
    loadLogs(page);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onRefresh={() => loadLogs(currentPage)} loading={loading} />

      <div className="p-8 space-y-6">

        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Request Logs</h1>
          <p className="text-sm text-gray-400 mt-1">View and filter all API requests</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex flex-wrap gap-4 items-end">

            {/* Endpoint search */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Search Endpoint
              </label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-6.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent bg-white">
  <Search className="text-gray-400 shrink-0 pointer-events-none" size={16} />
  <input
    type="text"
    value={filters.endpoint}
    onChange={(e) => handleFilterChange('endpoint', e.target.value)}
    onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
    placeholder="e.g. /api/users"
    className="w-full py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent"
  />
</div>
            </div>

            {/* Status code */}
            <div className="w-48">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Status Code
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="200">200 — OK</option>
                <option value="201">201 — Created</option>
                <option value="400">400 — Bad Request</option>
                <option value="401">401 — Unauthorized</option>
                <option value="404">404 — Not Found</option>
                <option value="500">500 — Server Error</option>
              </select>
            </div>

            {/* Per page */}
            <div className="w-32">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Per Page
              </label>
              <select
                value={filters.limit}
                onChange={(e) => handleFilterChange('limit', e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>

            {/* Apply button */}
            <button
              onClick={handleApplyFilters}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-700 transition-colors"
            >
              <Filter size={16} />
              Apply
            </button>
          </div>
        </div>

        {/* Content area */}
        {loading && !logs.length ? (
          <Loader text="Loading logs..." />
        ) : error ? (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-5">
            <AlertTriangle className="text-red-500 shrink-0" size={20} />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        ) : (
          <LogsTable
            logs={logs}
            pagination={pagination}
            onPageChange={handlePageChange}
          />
        )}

      </div>
    </div>
  );
}