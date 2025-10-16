// Example alert: log if threshold exceeded
export const checkThreshold = (totalRequests, limit = 1000) => {
  if (totalRequests >= limit) {
    console.warn("Warning: API request limit reached!");
    // Later: you can add email or push notification logic here
  }
};
