'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Navbar from '../components/Navbar';
import ChartCard from '../components/ChartCard';
import Loader from '../components/Loader';
import { fetchEndpointMetrics, getApiKey, getDemoEndpoints } from '../lib/api';
import { formatNumber, formatResponseTime, formatPercentage } from '../utils/formatters';

import { AlertTriangle } from 'lucide-react';

const COLORS = ['#5b5cf6', '#16a34a', '#d97706', '#818cf8', '#dc2626', '#06b6d4', '#ec4899', '#14b8a6'];

const TOOLTIP_STYLE = {
  backgroundColor: '#ffffff',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  fontSize: '12px',
  boxShadow: 'var(--shadow-md)',
  fontFamily: 'var(--font-mono)',
};

// Colored pill for each HTTP method
function MethodBadge({ method }) {
  const styles = {
    GET: { background: 'var(--color-info-bg)', color: 'var(--color-info)' },
    POST: { background: 'var(--color-success-bg)', color: 'var(--color-success)' },
    PUT: { background: 'var(--color-warning-bg)', color: 'var(--color-warning)' },
    PATCH: { background: 'var(--brand-light)', color: 'var(--brand-text)' },
    DELETE: { background: 'var(--color-danger-bg)', color: 'var(--color-danger)' },
  };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold"
      style={styles[method] ?? { background: 'var(--surface-sunken)', color: 'var(--ink-muted)' }}
    >
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
      <span className={`text-mono text-sm font-semibold ${textColor}`}>
        {formatPercentage(value)}
      </span>
      <div className="w-14 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-sunken)' }}>
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
    <div>
      <Navbar
        onRefresh={loadData}
        loading={loading}
        title="Detailed Metrics"
        subtitle={isDemo ? 'Demo Data — Add API key for live metrics' : 'Endpoint-level performance analysis'}
      />

      {error && (
        <div
          className="flex items-center gap-3 rounded-2xl p-4 mx-8 mt-6 border"
          style={{ background: 'var(--color-warning-bg)', borderColor: '#fde68a' }}
        >
          <AlertTriangle style={{ color: 'var(--color-warning)' }} className="shrink-0" size={20} />
          <p className="text-sm" style={{ color: '#92400e' }}>{error}</p>
        </div>
      )}

      <div className="p-8 space-y-8">

        <section className="space-y-4">
          <p className="eyebrow">Top Endpoints</p>

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
                    tick={{ fontSize: 10, fill: '#6b7280', fontFamily: 'var(--font-mono)' }}
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
                        <stop offset="0%" stopColor="#d97706" stopOpacity={0.9} />
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
                    tick={{ fontSize: 10, fill: '#6b7280', fontFamily: 'var(--font-mono)' }}
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
          <p className="eyebrow">All Endpoints</p>

          <div className="card-elevated overflow-hidden">

            {/* Card header */}
            <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--ink-strong)' }}>Complete Statistics</h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--ink-subtle)' }}>Detailed per-endpoint breakdown</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: 'var(--surface-sunken)', borderBottom: '1px solid var(--border)' }}>
                    {['Endpoint', 'Requests', 'Avg Time', 'Min / Max', 'Success', 'Errors', 'Methods'].map((h) => (
                      <th key={h} className="eyebrow px-5 py-3 text-left whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {(data || []).map((endpoint, index) => (
                    <tr
                      key={index}
                      className="transition-colors group"
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >

                      {/* Endpoint */}
                      <td className="px-5 py-3.5">
                        <span
                          className="text-mono text-xs px-2 py-1 rounded-md"
                          style={{ color: 'var(--ink)', background: 'var(--surface-sunken)' }}
                        >
                          {endpoint.endpoint}
                        </span>
                      </td>

                      {/* Requests */}
                      <td className="text-mono px-5 py-3.5 text-sm font-semibold" style={{ color: 'var(--ink-strong)' }}>
                        {formatNumber(endpoint.totalRequests)}
                      </td>

                      {/* Avg response time */}
                      <td className="text-mono px-5 py-3.5 text-sm" style={{ color: 'var(--ink)' }}>
                        {formatResponseTime(endpoint.avgResponseTime)}
                      </td>

                      {/* Min / Max */}
                      <td className="text-mono px-5 py-3.5 text-xs whitespace-nowrap" style={{ color: 'var(--ink-subtle)' }}>
                        {formatResponseTime(endpoint.minResponseTime)}
                        <span className="mx-1">/</span>
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