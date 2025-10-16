export const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const getTimestamp = () => {
  return new Date().toISOString();
};

export const calculateResponseTime = (startTime, endTime) => {
  return endTime - startTime;
};

export const sanitizeUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return `${urlObj.origin}${urlObj.pathname}`;
  } catch (err) {
    return url;
  }
};

export const shouldTrackUrl = (url, backendUrl) => {
  return !url.startsWith(backendUrl);
};