'use client';

import { useState, useEffect } from 'react';
import { Activity, Clock, CheckCircle, AlertTriangle, Key, X } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import Navbar from './components/Navbar';
import MetricCard from './components/MetricCard';
import ChartCard from './components/ChartCard';
import Loader from './components/Loader';
import { fetchOverview, getApiKey, setApiKey, clearApiKey, getDemoData } from './lib/api';
import { formatNumber, formatResponseTime, formatPercentage } from './utils/formatters';


const STATUS_COLORS = ['#4ade80', '#60a5fa', '#fbbf24', '#f87171'];
const METHOD_COLORS = ['#60a5fa', '#4ade80', '#fbbf24', '#a78bfa', '#f87171'];

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
      
      // If no API key, show demo data
      if (!apiKey) {
        setData(getDemoData());
        setIsDemo(true);
        setLoading(false);
        return;
      }

      // Try to fetch real data
      const response = await fetchOverview();
      const fetchedData = response.data.data;
      
      // If no real data exists, show demo data with a note
      if (!fetchedData || fetchedData.totalRequests === 0) {
        setData(getDemoData());
        setIsDemo(true);
      } else {
        setData(fetchedData);
        setIsDemo(false);
      }
    } catch (err) {
      console.error('Dashboard error:', err);
      
      // On error, show demo data instead of breaking
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
    
    // Refresh every 30 seconds only if we have a real API key
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
      loadData(); // Reload with new API key
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
    <div>
      <Navbar onRefresh={loadData} loading={loading} />
      
      <div className="p-8 space-y-6">
        {/* API Key Banner */}
        {isDemo && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
            <div className="flex items-start justify-between">
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
                      : 'You\'re viewing demo data. Connect your API key to see real metrics.'}
                  </p>
                  {!currentApiKey && (
                    <button
                      onClick={() => setShowApiKeyModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Connect API Key
                    </button>
                  )}
                </div>
              </div>
              {currentApiKey && (
                <button
                  onClick={handleRemoveApiKey}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Remove API Key"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* API Key Status */}
        {currentApiKey && !isDemo && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-green-600" size={20} />
              <span className="text-sm text-green-800 font-medium">
                Connected • API Key: {currentApiKey.substring(0, 8)}...
              </span>
            </div>
            <button
              onClick={handleRemoveApiKey}
              className="text-sm text-green-700 hover:text-green-900 underline"
            >
              Disconnect
            </button>
          </div>
        )}

        {/* Error Banner */}
        {error && !isDemo && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-yellow-600" size={20} />
              <p className="text-sm text-yellow-800">{error}</p>
            </div>
          </div>
        )}

        {/* Section Title */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Overview</h3>
          {!currentApiKey && (
            <button
              onClick={() => setShowApiKeyModal(true)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
            >
              <Key size={16} />
              Add API Key
            </button>
          )}
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

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Connect API Key</h3>
              <button
                onClick={() => {
                  setShowApiKeyModal(false);
                  setApiKeyInput('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Enter your DevMetrics API key to see your application's real-time metrics.
            </p>
            
            <input
              type="text"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="Enter your API key..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              onKeyPress={(e) => e.key === 'Enter' && handleSaveApiKey()}
            />
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowApiKeyModal(false);
                  setApiKeyInput('');
                }}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveApiKey}
                disabled={!apiKeyInput.trim()}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Connect
              </button>
            </div>
            
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                <strong>Don't have an API key?</strong><br/>
                Contact your DevMetrics admin to generate one.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}