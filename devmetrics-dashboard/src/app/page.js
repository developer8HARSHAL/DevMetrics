'use client';

import { useState, useEffect } from 'react';
import { Activity, Clock, CheckCircle, AlertTriangle, Key, X } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import Navbar from './components/Navbar';
import MetricCard from './components/MetricCard';
import ChartCard from './components/ChartCard';
import Loader from './components/Loader';
import Sidebar from './components/Sidebar';
import { fetchOverview, getApiKey, setApiKey, clearApiKey, getDemoData } from './lib/api';
import { formatNumber, formatResponseTime, formatPercentage } from './utils/formatters';

const STATUS_COLORS = ['#4ade80', '#60a5fa', '#fbbf24', '#f87171'];
const METHOD_COLORS = ['#60a5fa', '#4ade80', '#fbbf24', '#a78bfa', '#f87171'];

// Shared tooltip styles reused across all charts
const TOOLTIP_STYLE = {
  backgroundColor: '#111827',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '10px',
  fontSize: '12px',
  padding: '10px 14px',
};
const TOOLTIP_LABEL_STYLE = { color: '#9ca3af', marginBottom: '4px', fontSize: '11px' };
const TOOLTIP_ITEM_STYLE = { color: '#e5e7eb' };

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [currentApiKey, setCurrentApiKey] = useState('');
  const [isDemo, setIsDemo] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const apiKey = getApiKey();

      if (!apiKey) {
        setData(getDemoData());
        setIsDemo(true);
        setLoading(false);
        return;
      }

      const response = await fetchOverview();
      const fetchedData = response.data.data;

      if (!fetchedData || fetchedData.totalRequests === 0) {
        setData(getDemoData());
        setIsDemo(true);
      } else {
        setData(fetchedData);
        setIsDemo(false);
      }
    } catch (err) {
      console.error('Dashboard error:', err);
      setData(getDemoData());
      setIsDemo(true);
      setError(err.message || 'Using demo data - connect your API key to see live data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedKey = getApiKey();
    setCurrentApiKey(savedKey || '');
    loadData();

    const interval = setInterval(() => {
      if (getApiKey()) loadData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleSaveApiKey = () => {
    if (apiKeyInput.trim()) {
      setApiKey(apiKeyInput.trim());
      setCurrentApiKey(apiKeyInput.trim());
      setShowApiKeyModal(false);
      setApiKeyInput('');
      loadData();
    }
  };

  const handleRemoveApiKey = () => {
    clearApiKey();
    setCurrentApiKey('');
    setIsDemo(true);
    setData(getDemoData());
  };

  if (loading && !data) {
    return (
      <div>
        <Navbar onRefresh={loadData} loading={loading} />
        <div className="p-8">
          <Loader text="Loading dashboard..." />
        </div>
      </div>
    );
  }

  const errorRate = data ? (100 - parseFloat(data.successRate)).toFixed(2) : 0;

  return (
    <div className="bg-white">
      <Navbar onRefresh={loadData} loading={loading} />

      <div className="p-8 space-y-6">

        {/* Demo / no-data banner */}
        {isDemo && (
          <div className="flex items-start justify-between bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Key className="text-blue-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {currentApiKey ? 'No Data Yet - Start Tracking!' : 'Demo Dashboard'}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {currentApiKey
                    ? 'API key connected! Integrate the SDK in your app to see real data here.'
                    : "You're viewing demo data. Connect your API key to see real metrics."}
                </p>
                {!currentApiKey && (
                  <button
                    onClick={() => setShowApiKeyModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Connect API Key
                  </button>
                )}
              </div>
            </div>
            {currentApiKey && (
              <button
                onClick={handleRemoveApiKey}
                title="Remove API Key"
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        {/* Connected banner */}
        {currentApiKey && !isDemo && (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-green-600" size={20} />
              <span className="text-sm font-medium text-green-800">
                Connected • API Key: {currentApiKey.substring(0, 8)}...
              </span>
            </div>
            <button
              onClick={handleRemoveApiKey}
              className="text-sm text-green-700 underline hover:text-green-900"
            >
              Disconnect
            </button>
          </div>
        )}

        {/* Error banner */}
        {error && !isDemo && (
          <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
            <AlertTriangle className="text-yellow-600 shrink-0" size={20} />
            <p className="text-sm text-yellow-800">{error}</p>
          </div>
        )}

        {/* Overview header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Overview</h3>
          {!currentApiKey && (
            <button
              onClick={() => setShowApiKeyModal(true)}
              className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              <Key size={16} />
              Add API Key
            </button>
          )}
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <MetricCard
            title="Total Requests"
            value={formatNumber(data?.totalRequests)}
            icon={Activity}
            color="blue"
          />
          <MetricCard
            title="Success Rate"
            value={formatPercentage(data?.successRate)}
            subtitle="vs last period"
            icon={CheckCircle}
            color="green"
          />
          <MetricCard
            title="Avg Response"
            value={formatResponseTime(data?.avgResponseTime)}
            subtitle={`Min: ${formatResponseTime(data?.minResponseTime)} | Max: ${formatResponseTime(data?.maxResponseTime)}`}
            icon={Clock}
            color="yellow"
          />
          <MetricCard
            title="Error Rate"
            value={`${errorRate}%`}
            subtitle="failed requests"
            icon={AlertTriangle}
            color="red"
          />
        </div>

        {/* Analytics header */}
        <h3 className="text-lg font-semibold text-gray-900">Request Analytics</h3>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Response time area chart */}
          <ChartCard title="Requests" subtitle="Hourly volume">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart
                data={data?.requestsOverTime || []}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorResponseTime" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.25} />
                    <stop offset="60%" stopColor="#fbbf24" stopOpacity={0.08} />
                    <stop offset="100%" stopColor="#fbbf24" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.04)" vertical={false} />

                <XAxis
                  dataKey="_id"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  dy={6}
                />

                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  dx={4}
                  tickFormatter={(v) => `${v}ms`}
                />

                <Tooltip
                  cursor={{ stroke: '#fbbf24', strokeWidth: 1, strokeDasharray: '4 4', strokeOpacity: 0.5 }}
                  contentStyle={{ ...TOOLTIP_STYLE, border: '1px solid rgba(251,191,36,0.2)' }}
                  labelStyle={TOOLTIP_LABEL_STYLE}
                  itemStyle={{ color: '#fbbf24' }}
                  formatter={(value) => [`${value} ms`, 'Avg Response']}
                />

                <Area
                  type="monotone"
                  dataKey="avgResponseTime"
                  stroke="#fbbf24"
                  strokeWidth={2}
                  fill="url(#colorResponseTime)"
                  name="Avg Response (ms)"
                  yAxisId="right"
                  dot={false}
                  activeDot={{ r: 5, fill: '#fbbf24', stroke: '#111827', strokeWidth: 2 }}
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Status codes donut */}
          <ChartCard title="Status Codes" subtitle="Distribution">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <defs>
                  {(data?.requestsByStatus || []).map((_, index) => {
                    const color = STATUS_COLORS[index % STATUS_COLORS.length];
                    return (
                      <radialGradient key={`radGrad-${index}`} id={`pieGrad-${index}`} cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor={color} stopOpacity={1} />
                        <stop offset="100%" stopColor={color} stopOpacity={0.75} />
                      </radialGradient>
                    );
                  })}
                </defs>

                <Pie
                  data={data?.requestsByStatus || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={96}
                  dataKey="count"
                  nameKey="_id"
                  strokeWidth={2}
                  stroke="#111827"
                  paddingAngle={3}
                  animationBegin={0}
                  animationDuration={900}
                  animationEasing="ease-out"
                  label={({ cx, cy, midAngle, outerRadius, percent, _id }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = outerRadius + 20;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    return percent > 0.04 ? (
                      <text
                        x={x}
                        y={y}
                        fill="#9ca3af"
                        textAnchor={x > cx ? 'start' : 'end'}
                        dominantBaseline="central"
                        fontSize={11}
                        fontWeight={600}
                      >
                        {_id}
                      </text>
                    ) : null;
                  }}
                  labelLine={false}
                >
                  {(data?.requestsByStatus || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#pieGrad-${index})`} />
                  ))}
                </Pie>

                {/* Donut centre: total count */}
                {(() => {
                  const total = (data?.requestsByStatus || []).reduce((s, d) => s + d.count, 0);
                  return (
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                      <tspan x="50%" dy="-8" fontSize="22" fontWeight="700" fill="black">
                        {total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total}
                      </tspan>
                      <tspan x="50%" dy="20" fontSize="11" fill="#6b7280" 
                      >
                        total reqs
                      </tspan>
                    </text>
                  );
                })()}

                <Tooltip
                  cursor={false}
                  contentStyle={TOOLTIP_STYLE}
                  labelStyle={TOOLTIP_LABEL_STYLE}
                  itemStyle={TOOLTIP_ITEM_STYLE}
                  formatter={(value, name) => [value.toLocaleString(), name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Charts row 2 — HTTP methods */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1">
 <ChartCard title="HTTP Methods" subtitle="Request distribution">
  <ResponsiveContainer width="100%" height={240}>
    <BarChart
      data={data?.requestsByMethod || []}
      layout="vertical"
      margin={{ top: 4, right: 48, left: 0, bottom: 4 }}
      barCategoryGap="25%"
    >
      <defs>
        {(data?.requestsByMethod || []).map((_, index) => {
          const color = METHOD_COLORS[index % METHOD_COLORS.length];
          return (
            <linearGradient key={`grad-${index}`} id={`barGrad-${index}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={color} stopOpacity={0.95} />
              <stop offset="100%" stopColor={color} stopOpacity={0.5} />
            </linearGradient>
          );
        })}
      </defs>

      <XAxis
        type="number"
        domain={[0, 'dataMax']}
        tick={{ fontSize: 11, fill: '#6b7280' }}
        axisLine={false}
        tickLine={false}
        tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
      />

      <YAxis
        type="category"
        dataKey="_id"
        tick={{ fontSize: 12, fill: '#374151', fontWeight: 600 }}
        axisLine={false}
        tickLine={false}
        width={48}
      />

      <Tooltip
        cursor={{ fill: 'rgba(0,0,0,0.04)', radius: 6 }}
        contentStyle={TOOLTIP_STYLE}
        labelStyle={TOOLTIP_LABEL_STYLE}
        itemStyle={TOOLTIP_ITEM_STYLE}
        formatter={(value) => [value.toLocaleString(), 'Requests']}
      />

      <Bar
        dataKey="count"
        radius={[0, 6, 6, 0]}
        animationDuration={900}
        animationEasing="ease-out"
        label={{
          position: 'right',
          fontSize: 11,
          fontWeight: 600,
          fill: '#6b7280',
          formatter: (v) => v.toLocaleString(),
        }}
      >
        {(data?.requestsByMethod || []).map((_, index) => (
          <Cell key={`cell-${index}`} fill={`url(#barGrad-${index})`} />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
</ChartCard>
</div>
      </div>

      {/* API Key modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6">

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Connect API Key</h3>
              <button
                onClick={() => { setShowApiKeyModal(false); setApiKeyInput(''); }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <p className="mb-4 text-sm text-gray-600">
              Enter your DevMetrics API key to see your application's real-time metrics.
            </p>

            <input
              type="text"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSaveApiKey()}
              placeholder="Enter your API key..."
              className="mb-4 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex gap-3">
              <button
                onClick={() => { setShowApiKeyModal(false); setApiKeyInput(''); }}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveApiKey}
                disabled={!apiKeyInput.trim()}
                className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                Connect
              </button>
            </div>

            <div className="mt-4 rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-600">
                <strong>Don't have an API key?</strong><br />
                Contact your DevMetrics admin to generate one.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}