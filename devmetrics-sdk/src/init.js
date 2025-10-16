import { wrapFetch } from './wrapFetch.js';
import { wrapAxios } from './wrapAxios.js';

let sdkConfig = {
  apiKey: null,
  backendUrl: null,
  trackFetch: false,
  trackAxios: false,
  initialized: false,
};

export const init = ({
  apiKey,
  backendUrl = 'http://localhost:5000',
  trackFetch = false,
  trackAxios = false,
} = {}) => {
  if (!apiKey || typeof apiKey !== 'string') {
    throw new Error('DevMetrics SDK: apiKey is required and must be a string');
  }

  sdkConfig = {
    apiKey,
    backendUrl: backendUrl.replace(/\/$/, ''),
    trackFetch,
    trackAxios,
    initialized: true,
  };

  console.log('✅ DevMetrics SDK initialized successfully');

  if (trackFetch) {
    wrapFetch();
    console.log('✅ Auto-tracking enabled for fetch()');
  }

  if (trackAxios) {
    wrapAxios();
    console.log('✅ Auto-tracking enabled for axios');
  }

  return sdkConfig;
};

export const getConfig = () => {
  if (!sdkConfig.initialized) {
    console.warn('DevMetrics SDK: Not initialized. Call init() first.');
  }
  return { ...sdkConfig };
};