import { getConfig } from './init.js';
import { getTimestamp } from './utils.js';

export const track = async (data) => {
  try {
    const config = getConfig();

    if (!config.initialized) {
      console.warn('DevMetrics SDK: Not initialized. Skipping tracking.');
      return;
    }

    if (!data.endpoint || !data.status) {
      console.warn('DevMetrics SDK: Missing required fields (endpoint, status)');
      return;
    }

    const payload = {
      apiKey: config.apiKey,
      endpoint: data.endpoint,
      method: data.method || 'GET',
      status: data.status,
      responseTime: data.responseTime || 0,
      timestamp: data.timestamp || getTimestamp(),
    };

    const response = await fetch(`${config.backendUrl}/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('DevMetrics SDK: Failed to track request', response.statusText);
    }
  } catch (err) {
    console.error('DevMetrics SDK: Error tracking request', err.message);
  }
};