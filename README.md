# 📊 DevMetrics

> **Real-time API Monitoring & Analytics Platform**

[![NPM Version](https://img.shields.io/npm/v/devmetrics-sdk?color=4f46e5)](https://www.npmjs.com/package/devmetrics-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org)

Track, analyze, and optimize your API performance with beautiful real-time dashboards. Get started in 2 minutes with just 3 lines of code.

**[Live Demo](https://dev-metrics-six.vercel.app/)** • **[NPM Package](https://www.npmjs.com/package/devmetrics-sdk)** • **[API Docs](#-api-reference)**

---

## ✨ Features

- **🚀 Quick Setup** - Install SDK, add 3 lines, done!
- **📊 Real-time Dashboard** - Beautiful charts and analytics
- **🔄 Auto-Tracking** - Monitors `fetch()` and `axios` automatically
- **🎯 Zero Dependencies** - Lightweight SDK (<5KB)
- **🔐 Secure** - API key authentication with rate limiting
- **🌐 Framework Agnostic** - Works with React, Vue, Next.js, Node.js, and more

---

## 🚀 Quick Start

### 1. Install SDK

```bash
npm install devmetrics-sdk
```

### 2. Initialize in Your App

```javascript
import { init } from 'devmetrics-sdk';

init({
  apiKey: 'your-api-key',
  backendUrl: 'https://devmetrics-backend.onrender.com',
  trackFetch: true
});
```

### 3. View Dashboard

Visit **https://dev-metrics-six.vercel.app** to see your metrics!

---

## 📖 Usage Examples

### React / Vite

```javascript
// src/main.jsx
import { init } from 'devmetrics-sdk';

init({
  apiKey: import.meta.env.VITE_DEVMETRICS_KEY,
  backendUrl: 'https://devmetrics-backend.onrender.com',
  trackFetch: true
});

// All fetch() calls are now tracked automatically!
```

### Next.js

```javascript
// app/layout.js
'use client';
import { useEffect } from 'react';
import { init } from 'devmetrics-sdk';

export default function RootLayout({ children }) {
  useEffect(() => {
    init({
      apiKey: process.env.NEXT_PUBLIC_DEVMETRICS_KEY,
      backendUrl: 'https://devmetrics-backend.onrender.com',
      trackFetch: true
    });
  }, []);

  return <html><body>{children}</body></html>;
}
```

### Node.js / Express

```javascript
import { init, track } from 'devmetrics-sdk';

init({
  apiKey: process.env.DEVMETRICS_API_KEY,
  backendUrl: 'https://devmetrics-backend.onrender.com'
});

// Track all routes
app.use(async (req, res, next) => {
  const start = Date.now();
  res.on('finish', async () => {
    await track({
      endpoint: req.originalUrl,
      method: req.method,
      status: res.statusCode,
      responseTime: Date.now() - start
    });
  });
  next();
});
```

### Manual Tracking

```javascript
import { track } from 'devmetrics-sdk';

await track({
  endpoint: '/api/users',
  method: 'GET',
  status: 200,
  responseTime: 145
});
```

---

## 🏗️ Architecture

```
Your App (SDK) → DevMetrics Backend (Express + MongoDB) → Dashboard (Next.js)
```

- **SDK** - Tracks API calls and sends metrics
- **Backend** - Stores data and provides analytics APIs
- **Dashboard** - Visualizes metrics with interactive charts

---

## 📦 Project Structure

```
devmetrics/
├── devmetrics-sdk/          # NPM package (published)
├── devmetrics-backend/      # Express API (deployed on Render)
└── devmetrics-dashboard/    # Next.js UI (deployed on Vercel)
```

---

## 🛠️ Tech Stack

| Component | Technologies |
|-----------|-------------|
| **SDK** | JavaScript (ES6+), Zero dependencies |
| **Backend** | Node.js, Express.js, MongoDB, Mongoose |
| **Dashboard** | Next.js 15, React 19, Tailwind CSS, Recharts |
| **Deployment** | Render (Backend), Vercel (Dashboard), NPM (SDK) |

---

## 📊 What Gets Tracked?

- ✅ Endpoint URLs
- ✅ HTTP Methods (GET, POST, PUT, DELETE, etc.)
- ✅ Status Codes (200, 404, 500, etc.)
- ✅ Response Times (in milliseconds)
- ✅ Timestamps

**What's NOT tracked:**
- ❌ Request/Response bodies
- ❌ Headers (except method)
- ❌ Personal information
- ❌ Authentication tokens

---

## 🔌 API Reference

### SDK Methods

#### `init(options)`
Initialize the SDK.

```javascript
init({
  apiKey: 'dm_your_key',              // Required
  backendUrl: 'https://...',          // Required
  trackFetch: true,                   // Optional
  trackAxios: false                   // Optional
});
```

#### `track(data)`
Manually track an API call.

```javascript
await track({
  endpoint: '/api/users',             // Required
  method: 'GET',                      // Optional
  status: 200,                        // Required
  responseTime: 145,                  // Optional
  timestamp: '2024-01-15T10:00:00Z'   // Optional
});
```

#### `getConfig()`
Get current SDK configuration.

```javascript
const config = getConfig();
```

---

## 🌐 Live Services

| Service | URL |
|---------|-----|
| **Dashboard** | https://dev-metrics-six.vercel.app |
| **Backend API** | https://devmetrics-backend.onrender.com |
| **NPM Package** | https://www.npmjs.com/package/devmetrics-sdk |

---

## 🔐 Getting an API Key

API keys are managed by the DevMetrics administrator. To get a key:

1. Contact the admin
2. Receive your key (format: `dm_[64-character-hex]`)
3. Store it in environment variables
4. Use it in your SDK initialization

**Never commit API keys to Git!**

---

## 🐛 Troubleshooting

### SDK not tracking?

1. ✅ Check `init()` is called before API calls
2. ✅ Verify API key is correct
3. ✅ Ensure `trackFetch: true` or `trackAxios: true`
4. ✅ Check browser console for errors

### Dashboard showing no data?

1. ✅ Wait 30 seconds for auto-refresh
2. ✅ Verify SDK is installed and initialized
3. ✅ Check backend health: `https://devmetrics-backend.onrender.com/health`

### Rate limit exceeded?

Default limits: 10,000 req/hour, 100,000 req/day per API key.
Contact admin to increase limits.

---

## 📈 Dashboard Features

### Overview Page
- 📊 Total Requests
- ✅ Success Rate
- ⏱️ Average Response Time
- ❌ Error Rate
- 📈 Request Volume Chart
- 🥧 Status Code Distribution
- 📊 HTTP Methods Chart

### Metrics Page
- 🔝 Top Endpoints
- 🐢 Slowest Endpoints
- 📋 Complete Endpoint Statistics

---

## 🚀 Local Development

### Backend Setup

```bash
cd devmetrics-backend
npm install
cp .env.example .env
# Edit .env with MongoDB URI
npm run dev
```

### Dashboard Setup

```bash
cd devmetrics-dashboard
npm install
cp .env.example .env.local
# Edit .env.local with backend URL
npm run dev
```

### SDK Development

```bash
cd devmetrics-sdk
npm install
npm run dev
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

Built with:
- [Express.js](https://expressjs.com/) - Web framework
- [Next.js](https://nextjs.org/) - React framework
- [MongoDB](https://www.mongodb.com/) - Database
- [Recharts](https://recharts.org/) - Charts
- [Tailwind CSS](https://tailwindcss.com/) - Styling

---

## 📞 Support

- 📧 Email: your.email@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/devmetrics/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/yourusername/devmetrics/discussions)

---

<div align="center">

**⭐ Star this repo if you find it useful!**

Made with ❤️ by [Your Name]

</div>