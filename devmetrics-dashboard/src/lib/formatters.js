export const formatNumber = (num) => {
  if (num === null || num === undefined || num === "") {
    return "0";
  }

  const parsed =
    typeof num === "string"
      ? parseFloat(num)
      : num;

  if (Number.isNaN(parsed)) return "0";

  return new Intl.NumberFormat("en-US").format(parsed);
};

export const formatResponseTime = (ms) => {
  if (ms === null || ms === undefined || ms === "") {
    return "0ms";
  }

  const num =
    typeof ms === "string"
      ? parseFloat(ms)
      : ms;

  if (Number.isNaN(num)) return "0ms";

  if (num < 1000) {
    return `${num.toFixed(0)}ms`;
  }

  return `${(num / 1000).toFixed(2)}s`;
};

export const formatDate = (
  isoString,
  options = {}
) => {
  if (!isoString) return "—";

  return new Date(isoString).toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric",
      year: "numeric",
      ...options,
    }
  );
};

export const formatDateShort = (date) => {
  if (!date) return "N/A";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "N/A";
  }

  return value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatRelativeTime = (isoString) => {
  if (!isoString) return "—";

  const diffMs =
    Date.now() - new Date(isoString).getTime();

  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return "just now";

  const diffMin = Math.floor(diffSec / 60);

  if (diffMin < 60) {
    return `${diffMin}m ago`;
  }

  const diffHr = Math.floor(diffMin / 60);

  if (diffHr < 24) {
    return `${diffHr}h ago`;
  }

  const diffDay = Math.floor(diffHr / 24);

  if (diffDay === 1) return "yesterday";

  if (diffDay < 7) {
    return `${diffDay}d ago`;
  }

  return new Date(isoString).toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric",
    }
  );
};

export const formatDuration = (ms) => {
  if (ms == null) return null;

  const seconds = ms / 1000;

  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }

  const minutes = Math.floor(seconds / 60);

  return `${minutes}m ${Math.round(seconds % 60)}s`;
};

export const formatPercentage = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "0%";
  }

  const num =
    typeof value === "string"
      ? parseFloat(value)
      : value;

  if (Number.isNaN(num)) return "0%";

  return `${num.toFixed(1)}%`;
};

export const getStatusColor = (status) => {
  const code =
    typeof status === "string"
      ? parseInt(status, 10)
      : status;

  if (code < 200) return "text-blue-600";
  if (code < 300) return "text-green-600";
  if (code < 400) return "text-yellow-600";
  if (code < 500) return "text-orange-600";

  return "text-red-600";
};

export const getStatusBadgeColor = (status) => {
  const code =
    typeof status === "string"
      ? parseInt(status, 10)
      : status;

  if (code < 200) {
    return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
  }

  if (code < 300) {
    return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
  }

  if (code < 400) {
    return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
  }

  if (code < 500) {
    return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
  }

  return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
};

export const getMethodColor = (method) => {
  const colors = {
    GET: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    POST: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    PUT: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    PATCH:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    DELETE:
      "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  };

  return (
    colors[method?.toUpperCase()] ||
    "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
  );
};