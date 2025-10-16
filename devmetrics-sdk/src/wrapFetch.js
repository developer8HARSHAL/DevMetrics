import { getConfig } from './init.js';
import { track } from './track.js';
import { calculateResponseTime, sanitizeUrl, shouldTrackUrl } from './utils.js';

const originalFetch = globalThis.fetch;
let isFetchWrapped = false;

export const wrapFetch = () => {
  if (isFetchWrapped) {
    return;
  }

  globalThis.fetch = async function (...args) {
    const config = getConfig();
    const startTime = Date.now();

    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
    const options = args[1] || {};
    const method = options.method || 'GET';

    const shouldTrack = shouldTrackUrl(url, config.backendUrl);

    try {
      const response = await originalFetch.apply(this, args);

      if (shouldTrack) {
        const endTime = Date.now();
        const responseTime = calculateResponseTime(startTime, endTime);

        track({
          endpoint: sanitizeUrl(url),
          method: method.toUpperCase(),
          status: response.status,
          responseTime,
        }).catch(() => {});
      }

      return response;
    } catch (error) {
      if (shouldTrack) {
        const endTime = Date.now();
        const responseTime = calculateResponseTime(startTime, endTime);

        track({
          endpoint: sanitizeUrl(url),
          method: method.toUpperCase(),
          status: 0,
          responseTime,
        }).catch(() => {});
      }

      throw error;
    }
  };

  isFetchWrapped = true;
};

export const unwrapFetch = () => {
  if (isFetchWrapped) {
    globalThis.fetch = originalFetch;
    isFetchWrapped = false;
  }
};