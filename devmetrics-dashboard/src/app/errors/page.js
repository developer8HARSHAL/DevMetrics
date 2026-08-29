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
  '400': '#d97706',
  '401': '#dc2626',
  '403': '#b91c1c',
  '404': '#5b5cf6',
  '500': '#991b1b',
  '502': '#7f1d1d',
  '503': '#7f1d1d',
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
          <div
            className="rounded-2xl p-8 text-center border"
            style={{ background: 'var(--color-danger-bg)', borderColor: '#fecaca' }}
          >
            <p className="text-sm" style={{ color: 'var(--color-danger)' }}>{error}</p>
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
          <h3 className="text-lg font-semibold" style={{ color: 'var(--ink-strong)' }}>Overview</h3>
        </div>

        {/* Error Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="card p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl" style={{ background: 'var(--color-danger-bg)' }}>
                <AlertTriangle style={{ color: 'var(--color-danger)' }} size={24} strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm mb-1" style={{ color: 'var(--ink-muted)' }}>Total Errors</p>
                <p className="text-mono text-3xl font-semibold" style={{ color: 'var(--ink-strong)' }}>
                  {formatNumber(errorSummary.reduce((sum, item) => sum + item.count, 0))}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl" style={{ background: 'var(--color-warning-bg)' }}>
                <AlertTriangle style={{ color: 'var(--color-warning)' }} size={24} strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm mb-1" style={{ color: 'var(--ink-muted)' }}>Unique Status Codes</p>
                <p className="text-mono text-3xl font-semibold" style={{ color: 'var(--ink-strong)' }}>
                  {errorSummary.length}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl" style={{ background: '#fff7ed' }}>
                <AlertTriangle style={{ color: '#c2410c' }} size={24} strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm mb-1" style={{ color: 'var(--ink-muted)' }}>Affected Endpoints</p>
                <p className="text-mono text-3xl font-semibold" style={{ color: 'var(--ink-strong)' }}>
                  {new Set(errorSummary.flatMap(item => item.endpoints)).size}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Analytics */}
        <div>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--ink-strong)' }}>Error Analytics</h3>
        </div>

        {/* Error Distribution Chart */}
        <ChartCard
          title="Error Distribution"
          subtitle="By status code"
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={errorSummary}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="_id"
                tick={{ fontSize: 12, fill: '#9ca3af', fontFamily: 'var(--font-mono)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                }}
                formatter={(value) => formatNumber(value)}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {errorSummary.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={ERROR_COLORS[entry._id] || '#dc2626'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Recent Errors */}
        <div>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--ink-strong)' }}>Recent Failed Requests</h3>
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