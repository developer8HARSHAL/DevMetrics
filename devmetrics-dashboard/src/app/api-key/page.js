'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Key, Copy, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import Navbar from '../components/Navbar';
import Loader from '../components/Loader';

export default function ApiKeyPage() {
  const [apiKey, setApiKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadApiKey();
  }, []);

  const loadApiKey = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user from Supabase
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('Not authenticated');
        return;
      }

      setUser(user);

      // Fetch API key from backend
      // Fetch API key from backend
      const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/api-key/${user.id}`;
      console.log('Fetching from:', url);

      const response = await fetch(url);
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to fetch API key: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      setApiKey(data.data);

    } catch (err) {
      console.error('Error loading API key:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (apiKey?.key) {
      navigator.clipboard.writeText(apiKey.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="p-8">
          <Loader text="Loading API key..." />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />

      <div className="p-8 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">API Key</h1>
          <p className="text-gray-600 mt-2">
            Use this key to integrate DevMetrics SDK in your application
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-red-800 font-medium">Error loading API key</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* API Key Card */}
        {apiKey && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Status Banner */}
            <div className={`px-6 py-3 ${apiKey.status === 'active'
                ? 'bg-green-50 border-b border-green-100'
                : 'bg-gray-50 border-b border-gray-200'
              }`}>
              <div className="flex items-center gap-2">
                <CheckCircle
                  className={apiKey.status === 'active' ? 'text-green-600' : 'text-gray-400'}
                  size={18}
                />
                <span className={`text-sm font-medium ${apiKey.status === 'active' ? 'text-green-800' : 'text-gray-600'
                  }`}>
                  Status: {apiKey.status.toUpperCase()}
                </span>
              </div>
            </div>

            {/* API Key Display */}
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Key className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Your API Key</h3>
                  <p className="text-sm text-gray-600">Keep this secret and secure</p>
                </div>
              </div>

              {/* Key Display with Copy */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between gap-4">
                  <code className="text-sm font-mono text-gray-800 break-all flex-1">
                    {apiKey.key}
                  </code>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
                  >
                    {copied ? (
                      <>
                        <CheckCircle size={18} />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={18} />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Usage Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Total Requests</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {apiKey.usageCount?.toLocaleString() || 0}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Rate Limit</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {apiKey.rateLimit?.requestsPerHour?.toLocaleString() || 0}/hr
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {apiKey.rateLimit?.requestsPerDay?.toLocaleString() || 0}/day
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Last Used</p>
                  <p className="text-sm font-medium text-gray-900">
                    {apiKey.lastUsedAt
                      ? new Date(apiKey.lastUsedAt).toLocaleDateString()
                      : 'Never'}
                  </p>
                </div>
              </div>

              {/* Created Date */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Created on {formatDate(apiKey.createdAt)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Integration Guide */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Start Guide
          </h3>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">1. Install SDK</h4>
              <div className="bg-gray-900 rounded-lg p-4">
                <code className="text-sm text-green-400">
                  npm install devmetrics-sdk
                </code>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">2. Initialize in your app</h4>
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-300">
                  {`import { init } from 'devmetrics-sdk';

init({
  apiKey: '${apiKey?.key || 'YOUR_API_KEY'}',
  backendUrl: '${process.env.NEXT_PUBLIC_BACKEND_URL}',
  trackFetch: true  // Auto-track fetch requests
});`}
                </pre>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">3. Start tracking</h4>
              <p className="text-sm text-gray-600">
                All your API requests will now be automatically tracked and visible in your dashboard!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}