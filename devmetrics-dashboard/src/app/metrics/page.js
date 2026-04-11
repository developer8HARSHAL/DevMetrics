'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Navbar from '../components/Navbar';
import ChartCard from '../components/ChartCard';
import Loader from '../components/Loader';
import { fetchEndpointMetrics, getApiKey, getDemoEndpoints } from '../lib/api';
import { formatNumber, formatResponseTime, formatPercentage } from '../utils/formatters';

import { AlertTriangle } from 'lucide-react';

const COLORS = ['#60a5fa', '#4ade80', '#fbbf24', '#a78bfa', '#f87171', '#06b6d4', '#ec4899', '#14b8a6'];

const TOOLTIP_STYLE = {
  backgroundColor: '#ffffff',
  border: '1px solid #f3f4f6',
  borderRadius: '12px',
  fontSize: '12px',
  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
};

// Colored pill for each HTTP method
function MethodBadge({ method }) {
  const colors = {
    GET: 'bg-blue-50 text-blue-600',
    POST: 'bg-emerald-50 text-emerald-600',
    PUT: 'bg-amber-50 text-amber-600',
    PATCH: 'bg-purple-50 text-purple-600',
    DELETE: 'bg-rose-50 text-rose-600',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${colors[method] ?? 'bg-gray-100 text-gray-600'}`}>
      {method}
    </span>
  );
}

// Mini progress bar + value for rate columns
function RateBar({ value, positive }) {
  const barColor = positive
    ? value > 95 ? 'bg-emerald-500' : value > 80 ? 'bg-amber-400' : 'bg-rose-500'
    : value > 20 ? 'bg-rose-500' : value > 5 ? 'bg-amber-400' : 'bg-emerald-500';

  const textColor = positive
    ? value > 95 ? 'text-emerald-600' : value > 80 ? 'text-amber-600' : 'text-rose-600'
    : value > 20 ? 'text-rose-600' : value > 5 ? 'text-amber-600' : 'text-emerald-600';

  return (
    <div className="flex items-center gap-2">
      <span className={`text-sm font-semibold tabular-nums ${textColor}`}>
        {formatPercentage(value)}
      </span>
      <div className="w-14 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );
}

export default function MetricsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDemo, setIsDemo] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const apiKey = getApiKey();

      if (!apiKey) {
        setData(getDemoEndpoints());
        setIsDemo(true);
        setLoading(false);
        return;
      }

      const response = await fetchEndpointMetrics();
      const fetchedData = response.data.data;

      if (!fetchedData || fetchedData.length === 0) {
        setData(getDemoEndpoints());
        setIsDemo(true);
      } else {
        setData(fetchedData);
        setIsDemo(false);
      }
    } catch (err) {
      console.error('Metrics error:', err);
      setData(getDemoEndpoints());
      setIsDemo(true);
      setError('Using demo data - connect your API key to see live metrics');
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

  const sortedByRequests = [...(data || [])].sort((a, b) => b.totalRequests - a.totalRequests).slice(0, 10);
  const sortedByResponseTime = [...(data || [])].sort((a, b) => b.avgResponseTime - a.avgResponseTime).slice(0, 10);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        onRefresh={loadData}
        loading={loading}
        title="Detailed Metrics"
        subtitle={isDemo ? 'Demo Data — Add API key for live metrics' : 'Endpoint-level performance analysis'}
      />

      {error && (
        <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mx-8 mt-6">
          <AlertTriangle className="text-yellow-600 shrink-0" size={20} />
          <p className="text-sm text-yellow-800">{error}</p>
        </div>
      )}

      <div className="p-8 space-y-8">


        <section className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Top Endpoints</p>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

            <ChartCard title="Most Active" subtitle="By request volume">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={sortedByRequests}
                  layout="vertical"
                  margin={{ top: 4, right: 52, left: 0, bottom: 4 }}
                  barCategoryGap="25%"
                >
                  <defs>
                    {sortedByRequests.map((_, i) => {
                      const color = COLORS[i % COLORS.length];
                      return (
                        <linearGradient key={`rg-${i}`} id={`rg-${i}`} x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                          <stop offset="100%" stopColor={color} stopOpacity={0.45} />
                        </linearGradient>
                      );
                    })}
                  </defs>

                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(0,0,0,0.04)" horizontal={false} />

                  <XAxis
                    type="number"
                    domain={[0, 'dataMax']}
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
                  />

                  <YAxis
                    type="category"
                    dataKey="endpoint"
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                    width={140}
                  />

                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.03)', radius: 4 }}
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(value) => [formatNumber(value), 'Requests']}
                  />

                  <Bar
                    dataKey="totalRequests"
                    radius={[0, 6, 6, 0]}
                    animationDuration={900}
                    animationEasing="ease-out"
                    label={{
                      position: 'right',
                      fontSize: 11,
                      fontWeight: 600,
                      fill: '#9ca3af',
                      formatter: (v) => formatNumber(v),
                    }}
                  >
                    {sortedByRequests.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={`url(#rg-${i})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Slowest */}
            <ChartCard title="Slowest Endpoints" subtitle="Highest average response time">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={sortedByResponseTime}
                  layout="vertical"
                  margin={{ top: 4, right: 56, left: 0, bottom: 4 }}
                  barCategoryGap="25%"
                >
                  <defs>
                    {sortedByResponseTime.map((_, i) => (
                      <linearGradient key={`sg-${i}`} id={`sg-${i}`} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#f97316" stopOpacity={0.5} />
                      </linearGradient>
                    ))}
                  </defs>

                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(0,0,0,0.04)" horizontal={false} />

                  <XAxis
                    type="number"
                    domain={[0, 'dataMax']}
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}ms`}
                  />

                  <YAxis
                    type="category"
                    dataKey="endpoint"
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                    width={140}
                  />

                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.03)', radius: 4 }}
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(value) => [`${value.toFixed(2)}ms`, 'Avg Response']}
                  />

                  <Bar
                    dataKey="avgResponseTime"
                    radius={[0, 6, 6, 0]}
                    animationDuration={900}
                    animationEasing="ease-out"
                    label={{
                      position: 'right',
                      fontSize: 11,
                      fontWeight: 600,
                      fill: '#9ca3af',
                      formatter: (v) => `${v.toFixed(0)}ms`,
                    }}
                  >
                    {sortedByResponseTime.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={`url(#sg-${i})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </section>

        {/* ── All Endpoints table ── */}
        <section className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">All Endpoints</p>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            {/* Card header */}
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Complete Statistics</h3>
              <p className="text-xs text-gray-400 mt-0.5">Detailed per-endpoint breakdown</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Endpoint', 'Requests', 'Avg Time', 'Min / Max', 'Success', 'Errors', 'Methods'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(data || []).map((endpoint, index) => (
                    <tr key={index} className="hover:bg-gray-50/60 transition-colors group">

                      {/* Endpoint */}
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded-md group-hover:bg-gray-200 transition-colors">
                          {endpoint.endpoint}
                        </span>
                      </td>

                      {/* Requests */}
                      <td className="px-5 py-3.5 text-sm font-semibold text-gray-900 tabular-nums">
                        {formatNumber(endpoint.totalRequests)}
                      </td>

                      {/* Avg response time */}
                      <td className="px-5 py-3.5 text-sm text-gray-700 tabular-nums">
                        {formatResponseTime(endpoint.avgResponseTime)}
                      </td>

                      {/* Min / Max */}
                      <td className="px-5 py-3.5 text-xs text-gray-400 tabular-nums whitespace-nowrap">
                        {formatResponseTime(endpoint.minResponseTime)}
                        <span className="mx-1 text-gray-300">/</span>
                        {formatResponseTime(endpoint.maxResponseTime)}
                      </td>

                      {/* Success rate */}
                      <td className="px-5 py-3.5">
                        <RateBar value={endpoint.successRate} positive />
                      </td>

                      {/* Error rate */}
                      <td className="px-5 py-3.5">
                        <RateBar value={endpoint.errorRate} positive={false} />
                      </td>

                      {/* Methods */}
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {endpoint.methods?.map((m) => (
                            <MethodBadge key={m} method={m} />
                          ))}
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}