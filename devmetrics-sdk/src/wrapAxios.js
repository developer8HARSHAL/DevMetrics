import { getConfig } from './init.js';
import { track } from './track.js';
import { calculateResponseTime, sanitizeUrl, shouldTrackUrl } from './utils.js';

let isAxiosWrapped = false;

export const wrapAxios = () => {
  if (isAxiosWrapped) {
    return;
  }

  try {
    const axios = globalThis.axios || require('axios');

    if (!axios || !axios.interceptors) {
      console.warn('DevMetrics SDK: axios not found. Make sure axios is installed.');
      return;
    }

    const config = getConfig();

    axios.interceptors.request.use(
      (requestConfig) => {
        requestConfig.metadata = { startTime: Date.now() };
        return requestConfig;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    axios.interceptors.response.use(
      (response) => {
        const endTime = Date.now();
        const startTime = response.config.metadata?.startTime || endTime;
        const responseTime = calculateResponseTime(startTime, endTime);

        const url = response.config.url || '';
        const shouldTrack = shouldTrackUrl(url, config.backendUrl);

        if (shouldTrack) {
          track({
            endpoint: sanitizeUrl(url),
            method: (response.config.method || 'GET').toUpperCase(),
            status: response.status,
            responseTime,
          }).catch(() => {});
        }

        return response;
      },
      (error) => {
        if (error.config) {
          const endTime = Date.now();
          const startTime = error.config.metadata?.startTime || endTime;
          const responseTime = calculateResponseTime(startTime, endTime);

          const url = error.config.url || '';
          const shouldTrack = shouldTrackUrl(url, config.backendUrl);

          if (shouldTrack) {
            track({
              endpoint: sanitizeUrl(url),
              method: (error.config.method || 'GET').toUpperCase(),
              status: error.response?.status || 0,
              responseTime,
            }).catch(() => {});
          }
        }

        return Promise.reject(error);
      }
    );

    isAxiosWrapped = true;
  } catch (err) {
    console.warn('DevMetrics SDK: Failed to wrap axios', err.message);
  }
};

