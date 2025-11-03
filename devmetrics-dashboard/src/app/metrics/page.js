'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Navbar from '../components/Navbar';
import ChartCard from '../components/ChartCard';
import Loader from '../components/Loader';
import { fetchEndpointMetrics } from '../lib/api';
import { formatNumber, formatResponseTime, formatPercentage } from '../utils/formatters';

const COLORS = ['#60a5fa', '#4ade80', '#fbbf24', '#a78bfa', '#f87171', '#06b6d4', '#ec4899', '#14b8a6'];

export default function MetricsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchEndpointMetrics();
      setData(response.data.data);
    } catch (err) {
      setError(err.message || 'Failed to load metrics');
      console.error('Metrics error:', err);
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
        <Navbar onRefresh={loadData} loading={loading} title="Detailed Metrics" />
        <div className="p-8">
          <Loader text="Loading metrics..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Navbar onRefresh={loadData} loading={loading} title="Detailed Metrics" />
        <div className="p-8">
          <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const sortedByRequests = [...(data || [])].sort((a, b) => b.totalRequests - a.totalRequests).slice(0, 10);
  const sortedByResponseTime = [...(data || [])].sort((a, b) => b.avgResponseTime - a.avgResponseTime).slice(0, 10);

  return (
    <div>
      <Navbar onRefresh={loadData} loading={loading} title="Detailed Metrics" subtitle="Endpoint-level performance analysis" />
      
      <div className="p-8 space-y-6">
        {/* Top Endpoints */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Endpoints</h3>
        </div>

        <ChartCard
          title="Most Active"
          subtitle="By request volume"
        >
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={sortedByRequests} layout="vertical" margin={{ left: 150 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="endpoint"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                width={140}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #f3f4f6',
                  borderRadius: '12px',
                  fontSize: '12px'
                }}
                formatter={(value) => formatNumber(value)}
              />
              <Bar dataKey="totalRequests" fill="#60a5fa" radius={[0, 8, 8, 0]}>
                {sortedByRequests.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Slowest Endpoints */}
        <ChartCard
          title="Slowest Endpoints"
          subtitle="Highest average response time"
        >
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={sortedByResponseTime} layout="vertical" margin={{ left: 150 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="endpoint"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                width={140}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #f3f4f6',
                  borderRadius: '12px',
                  fontSize: '12px'
                }}
                formatter={(value) => `${value.toFixed(2)}ms`}
              />
              <Bar dataKey="avgResponseTime" fill="#fbbf24" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* All Endpoints */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">All Endpoints</h3>
        </div>

        <ChartCard title="Complete Statistics" subtitle="Detailed endpoint metrics">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Endpoint
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Requests
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Avg Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Success Rate
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Methods
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(data || []).map((endpoint, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-gray-900">
                      {endpoint.endpoint}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      {formatNumber(endpoint.totalRequests)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatResponseTime(endpoint.avgResponseTime)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`font-semibold ${
                        endpoint.successRate > 95 ? 'text-green-600' :
                        endpoint.successRate > 80 ? 'text-amber-600' :
                        'text-red-600'
                      }`}>
                        {formatPercentage(endpoint.successRate)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {endpoint.methods?.join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}