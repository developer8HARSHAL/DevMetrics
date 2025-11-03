'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Navbar from '../components/Navbar';
import LogsTable from '../components/LogsTable';
import ChartCard from '../components/ChartCard';
import Loader from '../components/Loader';
import { fetchErrors } from '../lib/api';
import { formatNumber } from '../utils/formatters';

const ERROR_COLORS = {
  '400': '#fbbf24',
  '401': '#f87171',
  '403': '#dc2626',
  '404': '#818cf8',
  '500': '#b91c1c',
  '502': '#991b1b',
  '503': '#7f1d1d'
};

export default function ErrorsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchErrors({ page, limit: 50 });
      setData(response.data.data);
      setCurrentPage(page);
    } catch (err) {
      setError(err.message || 'Failed to load errors');
      console.error('Errors page error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !data) {
    return (
      <div>
        <Navbar onRefresh={() => loadData(currentPage)} loading={loading} title="Error Tracking" />
        <div className="p-8">
          <Loader text="Loading errors..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Navbar onRefresh={() => loadData(currentPage)} loading={loading} title="Error Tracking" />
        <div className="p-8">
          <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const errorSummary = data?.summary || [];
  const errorLogs = data?.errors || [];

  return (
    <div>
      <Navbar onRefresh={() => loadData(currentPage)} loading={loading} title="Error Tracking" subtitle="Monitor and analyze failed requests" />
      
      <div className="p-8 space-y-6">
        {/* Overview */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Overview</h3>
        </div>

        {/* Error Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-50 rounded-xl">
                <AlertTriangle className="text-red-600" size={24} strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Errors</p>
                <p className="text-3xl font-semibold text-gray-900">
                  {formatNumber(errorSummary.reduce((sum, item) => sum + item.count, 0))}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-50 rounded-xl">
                <AlertTriangle className="text-amber-600" size={24} strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Unique Status Codes</p>
                <p className="text-3xl font-semibold text-gray-900">
                  {errorSummary.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-orange-50 rounded-xl">
                <AlertTriangle className="text-orange-600" size={24} strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Affected Endpoints</p>
                <p className="text-3xl font-semibold text-gray-900">
                  {new Set(errorSummary.flatMap(item => item.endpoints)).size}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Analytics */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Error Analytics</h3>
        </div>

        {/* Error Distribution Chart */}
        <ChartCard
          title="Error Distribution"
          subtitle="By status code"
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={errorSummary}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis
                dataKey="_id"
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #f3f4f6',
                  borderRadius: '12px',
                  fontSize: '12px'
                }}
                formatter={(value) => formatNumber(value)}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {errorSummary.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={ERROR_COLORS[entry._id] || '#f87171'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Recent Errors */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Recent Failed Requests</h3>
        </div>

        <LogsTable
          logs={errorLogs}
          pagination={data?.pagination}
          onPageChange={loadData}
        />
      </div>
    </div>
  );
}