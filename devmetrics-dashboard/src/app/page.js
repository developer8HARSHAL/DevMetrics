'use client';

import { useState, useEffect } from 'react';
import { Activity, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import Navbar from './components/Navbar';
import MetricCard from './components/MetricCard';
import ChartCard from './components/ChartCard';
import Loader from './components/Loader';
import { fetchOverview } from './lib/api';
import { formatNumber, formatResponseTime, formatPercentage } from './utils/formatters';

const STATUS_COLORS = ['#4ade80', '#60a5fa', '#fbbf24', '#f87171'];
const METHOD_COLORS = ['#60a5fa', '#4ade80', '#fbbf24', '#a78bfa', '#f87171'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchOverview();
      setData(response.data.data);
    } catch (err) {
      setError(err.message || 'Failed to load data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

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

  if (error) {
    return (
      <div>
        <Navbar onRefresh={loadData} loading={loading} />
        <div className="p-8">
          <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
            <AlertTriangle className="mx-auto mb-4 text-red-600" size={48} strokeWidth={1.5} />
            <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Data</h3>
            <p className="text-red-700 text-sm">{error}</p>
            <button
              onClick={loadData}
              className="mt-6 px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const errorRate = data ? (100 - parseFloat(data.successRate)).toFixed(2) : 0;

  return (
    <div>
      <Navbar onRefresh={loadData} loading={loading} />
      
      <div className="p-8 space-y-6">
        {/* Section Title */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Overview</h3>
        </div>

        {/* Metric Cards */}
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

        {/* Charts Section Title */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Request Analytics</h3>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ChartCard
            title="Requests"
            subtitle="Hourly volume"
          >
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data?.requestsOverTime || []}>
                <defs>
                  <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis
                  dataKey="_id"
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #f3f4f6',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#60a5fa"
                  strokeWidth={2}
                  fill="url(#colorRequests)"
                  name="Requests"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Status Codes"
            subtitle="Distribution"
          >
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={data?.requestsByStatus || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ _id }) => _id}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="_id"
                  strokeWidth={0}
                >
                  {(data?.requestsByStatus || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #f3f4f6',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 gap-5">
          <ChartCard
            title="HTTP Methods"
            subtitle="Request distribution"
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.requestsByMethod || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis
                  dataKey="_id"
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #f3f4f6',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="count" fill="#60a5fa" radius={[8, 8, 0, 0]}>
                  {(data?.requestsByMethod || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={METHOD_COLORS[index % METHOD_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}