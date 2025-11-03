// Format number with commas
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return new Intl.NumberFormat('en-US').format(num);
};

// Format response time in ms
export const formatResponseTime = (ms) => {
  if (ms === null || ms === undefined) return '0ms';
  const num = parseFloat(ms);
  if (num < 1000) {
    return `${num.toFixed(0)}ms`;
  }
  return `${(num / 1000).toFixed(2)}s`;
};

// Format date to readable string
export const formatDate = (date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Format date to short format
export const formatDateShort = (date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Format percentage
export const formatPercentage = (value) => {
  if (value === null || value === undefined) return '0%';
  return `${parseFloat(value).toFixed(1)}%`;
};

// Get status color based on HTTP status code
export const getStatusColor = (status) => {
  if (status < 200) return 'text-blue-600';
  if (status < 300) return 'text-green-600';
  if (status < 400) return 'text-yellow-600';
  if (status < 500) return 'text-orange-600';
  return 'text-red-600';
};

// Get status badge color
export const getStatusBadgeColor = (status) => {
  if (status < 200) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
  if (status < 300) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
  if (status < 400) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
  if (status < 500) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
  return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
};

// Get method color
export const getMethodColor = (method) => {
  const colors = {
    GET: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    POST: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    PUT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    PATCH: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    DELETE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  };
  return colors[method?.toUpperCase()] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
};