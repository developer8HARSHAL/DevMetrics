// Format number with commas (handles strings and numbers)
export const formatNumber = (num) => {
  if (num === null || num === undefined || num === '') return '0';
  const parsed = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(parsed)) return '0';
  return new Intl.NumberFormat('en-US').format(parsed);
};

// Format response time in ms (handles strings and numbers)
export const formatResponseTime = (ms) => {
  if (ms === null || ms === undefined || ms === '') return '0ms';
  const num = typeof ms === 'string' ? parseFloat(ms) : ms;
  if (isNaN(num)) return '0ms';
  
  if (num < 1000) {
    return `${num.toFixed(0)}ms`;
  }
  return `${(num / 1000).toFixed(2)}s`;
};

// Format date to readable string
export const formatDate = (date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'N/A';
  
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
  if (isNaN(d.getTime())) return 'N/A';
  
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Format percentage (handles strings and numbers)
export const formatPercentage = (value) => {
  if (value === null || value === undefined || value === '') return '0%';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0%';
  return `${num.toFixed(1)}%`;
};

// Get status color based on HTTP status code
export const getStatusColor = (status) => {
  const code = typeof status === 'string' ? parseInt(status) : status;
  if (code < 200) return 'text-blue-600';
  if (code < 300) return 'text-green-600';
  if (code < 400) return 'text-yellow-600';
  if (code < 500) return 'text-orange-600';
  return 'text-red-600';
};

// Get status badge color
export const getStatusBadgeColor = (status) => {
  const code = typeof status === 'string' ? parseInt(status) : status;
  if (code < 200) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
  if (code < 300) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
  if (code < 400) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
  if (code < 500) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
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
