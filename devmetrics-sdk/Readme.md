# DevMetrics SDK

A lightweight JavaScript SDK for tracking and monitoring API requests in your applications. DevMetrics SDK automatically captures API performance metrics including response times, status codes, and endpoint usage.

## Features

- 🚀 **Easy Integration** - Get started with just a few lines of code
- 📊 **Automatic Tracking** - Auto-track `fetch()` and `axios` requests
- 📈 **Manual Tracking** - Track custom events and API calls
- 🎯 **Zero Dependencies** - Lightweight with no required dependencies
- 🔒 **Privacy-Focused** - Only tracks what you configure
- ⚡ **Performance Optimized** - Minimal overhead on your application

## Installation

```bash
npm install devmetrics-sdk
```

Or using yarn:

```bash
yarn add devmetrics-sdk
```

## Quick Start

```javascript
import { init, track } from 'devmetrics-sdk';

// Initialize the SDK
init({
  apiKey: 'your-api-key-here',
  backendUrl: 'https://your-backend.com',
  trackFetch: true,  // Auto-track fetch requests
  trackAxios: false  // Auto-track axios requests
});

// That's it! Your fetch requests are now being tracked automatically
```

## Configuration

### `init(options)`

Initialize the DevMetrics SDK with your configuration.

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `apiKey` | `string` | ✅ Yes | - | Your DevMetrics API key |
| `backendUrl` | `string` | No | `http://localhost:5000` | Your DevMetrics backend URL |
| `trackFetch` | `boolean` | No | `false` | Automatically track fetch requests |
| `trackAxios` | `boolean` | No | `false` | Automatically track axios requests |

#### Example

```javascript
import { init } from 'devmetrics-sdk';

init({
  apiKey: 'your-api-key-12345',
  backendUrl: 'https://api.devmetrics.io',
  trackFetch: true,
  trackAxios: true
});
```

## Usage

### Automatic Tracking

Once initialized with `trackFetch: true` or `trackAxios: true`, the SDK automatically tracks all outgoing HTTP requests.

#### Fetch Auto-Tracking

```javascript
import { init } from 'devmetrics-sdk';

init({
  apiKey: 'your-api-key',
  trackFetch: true
});

// This request will be automatically tracked
const response = await fetch('https://api.example.com/users');
const data = await response.json();
```

#### Axios Auto-Tracking

```javascript
import { init } from 'devmetrics-sdk';
import axios from 'axios';

init({
  apiKey: 'your-api-key',
  trackAxios: true
});

// This request will be automatically tracked
const response = await axios.get('https://api.example.com/users');
```

### Manual Tracking

For custom tracking or non-HTTP events, use the `track()` function.

```javascript
import { track } from 'devmetrics-sdk';

await track({
  endpoint: 'https://api.example.com/users',
  method: 'GET',
  status: 200,
  responseTime: 150,
  timestamp: new Date().toISOString() // Optional
});
```

#### Track Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `endpoint` | `string` | ✅ Yes | The API endpoint URL |
| `method` | `string` | No | HTTP method (GET, POST, etc.) |
| `status` | `number` | ✅ Yes | HTTP status code |
| `responseTime` | `number` | No | Response time in milliseconds |
| `timestamp` | `string` | No | ISO 8601 timestamp |

### Get Current Configuration

```javascript
import { getConfig } from 'devmetrics-sdk';

const config = getConfig();
console.log(config);
// {
//   apiKey: 'your-api-key',
//   backendUrl: 'https://api.devmetrics.io',
//   trackFetch: true,
//   trackAxios: false,
//   initialized: true
// }
```

## Advanced Usage

### Wrapping Functions Individually

You can manually wrap fetch or axios even if you didn't enable auto-tracking during initialization.

```javascript
import { init, wrapFetch, wrapAxios } from 'devmetrics-sdk';

init({ apiKey: 'your-api-key' });

// Wrap fetch later
wrapFetch();

// Wrap axios later
wrapAxios();
```

### URL Filtering

The SDK automatically excludes requests to your configured `backendUrl` to prevent infinite tracking loops. All other requests are tracked by default.

### Error Handling

Failed requests (network errors, timeouts) are tracked with a status code of `0`.

```javascript
// Network error - tracked with status: 0
try {
  await fetch('https://nonexistent-domain.com/api');
} catch (error) {
  // Request is still tracked even though it failed
}
```

## Examples

### Basic React App

```javascript
import React, { useEffect, useState } from 'react';
import { init } from 'devmetrics-sdk';

function App() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Initialize SDK once when app loads
    init({
      apiKey: process.env.REACT_APP_DEVMETRICS_KEY,
      backendUrl: 'https://api.devmetrics.io',
      trackFetch: true
    });
  }, []);

  useEffect(() => {
    // This fetch will be automatically tracked
    fetch('https://api.example.com/users')
      .then(res => res.json())
      .then(setUsers);
  }, []);

  return <div>{/* Your app */}</div>;
}
```

### Node.js Backend

```javascript
import express from 'express';
import { init, track } from 'devmetrics-sdk';

const app = express();

init({
  apiKey: process.env.DEVMETRICS_API_KEY,
  backendUrl: 'https://api.devmetrics.io'
});

app.get('/api/users', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const users = await fetchUsers();
    const responseTime = Date.now() - startTime;
    
    // Manual tracking
    await track({
      endpoint: '/api/users',
      method: 'GET',
      status: 200,
      responseTime
    });
    
    res.json(users);
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    await track({
      endpoint: '/api/users',
      method: 'GET',
      status: 500,
      responseTime
    });
    
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});
```

### Vue.js App

```javascript
// main.js
import { createApp } from 'vue';
import { init } from 'devmetrics-sdk';
import App from './App.vue';

init({
  apiKey: import.meta.env.VITE_DEVMETRICS_KEY,
  backendUrl: 'https://api.devmetrics.io',
  trackFetch: true
});

createApp(App).mount('#app');
```

## Best Practices

1. **Initialize Early** - Call `init()` as early as possible in your application lifecycle
2. **Use Environment Variables** - Store your API key in environment variables, never commit it to version control
3. **Enable Auto-Tracking** - Use `trackFetch` or `trackAxios` for automatic monitoring
4. **Handle Errors Gracefully** - The SDK logs warnings but won't break your application
5. **Monitor Performance** - The SDK has minimal overhead, but disable tracking in performance-critical paths if needed

## Environment Variables

Create a `.env` file in your project root:

```env
DEVMETRICS_API_KEY=your-api-key-here
DEVMETRICS_BACKEND_URL=https://api.devmetrics.io
```

Then use them in your code:

```javascript
init({
  apiKey: process.env.DEVMETRICS_API_KEY,
  backendUrl: process.env.DEVMETRICS_BACKEND_URL,
  trackFetch: true
});
```

## Troubleshooting

### SDK not tracking requests

**Problem**: Requests aren't appearing in your dashboard.

**Solutions**:
- Verify your API key is correct
- Check that `init()` is called before making requests
- Ensure `trackFetch` or `trackAxios` is set to `true`
- Check browser/console for error messages
- Verify your backend URL is correct and accessible

### Requests to backend are being tracked

**Problem**: The SDK is tracking requests to its own backend.

**Solution**: This shouldn't happen as the SDK automatically filters out requests to the configured `backendUrl`. Double-check your `backendUrl` configuration matches exactly.

### Axios not being tracked

**Problem**: Axios requests aren't being tracked even with `trackAxios: true`.

**Solutions**:
- Ensure axios is installed: `npm install axios`
- Make sure axios is imported before calling `init()`
- Check that you're using the same axios instance

## API Reference

### Functions

#### `init(options)`
Initialize the SDK with configuration options.

#### `track(data)`
Manually track an API request or custom event.

#### `getConfig()`
Get the current SDK configuration.

#### `wrapFetch()`
Manually wrap the global fetch function for tracking.

#### `wrapAxios()`
Manually wrap axios interceptors for tracking.

## TypeScript Support

TypeScript declarations are coming soon! For now, you can create a `devmetrics-sdk.d.ts` file:

```typescript
declare module 'devmetrics-sdk' {
  export interface InitOptions {
    apiKey: string;
    backendUrl?: string;
    trackFetch?: boolean;
    trackAxios?: boolean;
  }

  export interface TrackData {
    endpoint: string;
    method?: string;
    status: number;
    responseTime?: number;
    timestamp?: string;
  }

  export function init(options: InitOptions): void;
  export function track(data: TrackData): Promise<void>;
  export function getConfig(): InitOptions & { initialized: boolean };
  export function wrapFetch(): void;
  export function wrapAxios(): void;
}
```

## Browser Compatibility

- Modern browsers with ES6+ support
- Node.js 14.0.0 or higher
- Supports both ESM and CommonJS modules

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## How It Works
The SDK captures HTTP request metrics from your frontend or backend apps 
and sends them to your DevMetrics backend. You can then visualize performance 
and error trends in the DevMetrics Dashboard.

### v1.0.0
- Initial release
- Auto-tracking for fetch and axios
- Manual tracking API
- URL filtering and sanitization
- Error handling and logging