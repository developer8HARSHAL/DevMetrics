# DevMetrics Backend

Backend server for DevMetrics - API monitoring and analytics platform.

## Features

✅ **Tracking API** - Receive and store API request metrics from SDK
✅ **API Key Management** - Create, manage, and revoke API keys
✅ **Analytics APIs** - Provide metrics for dashboard
✅ **Rate Limiting** - Per-key rate limiting support
✅ **MongoDB Storage** - Efficient data storage and aggregation
✅ **Authentication** - Admin and API key authentication

## Prerequisites

- Node.js >= 16.0.0
- MongoDB (local or cloud instance)

## Installation

```bash
cd devmetrics-backend
npm install
```

## Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Update `.env` with your configuration:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/devmetrics
ADMIN_KEY=your_super_secure_admin_key_here
DASHBOARD_KEY=your_dashboard_key_here
```

3. Generate a secure admin key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

## Creating Your First API Key

Run the seed script to create an initial API key:

```bash
npm run seed <owner-name> <description>
```

Example:
```bash
npm run seed "my-app" "Production API key"
```

This will output an API key that you can use in your SDK configuration.

## API Endpoints

### 1. Tracking Endpoint (Used by SDK)

#### `POST /track`
Receives tracking data from SDK.

**Request Body:**
```json
{
  "apiKey": "dm_abc123...",
  "endpoint": "/api/users",
  "method": "GET",
  "status": 200,
  "responseTime": 145,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Request tracked successfully",
  "id": "..."
}
```

### 2. Analytics Endpoints (For Dashboard)

#### `GET /logs/metrics/overview`
Get high-level statistics.

**Query Parameters:**
- `startDate` (optional) - Start date for filtering
- `endDate` (optional) - End date for filtering
- `apiKey` (optional) - Filter by specific API key

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRequests": 1500,
    "successRate": "95.50",
    "avgResponseTime": "234.56",
    "minResponseTime": 45,
    "maxResponseTime": 2300,
    "requestsByStatus": [...],
    "requestsByMethod": [...],
    "requestsOverTime": [...]
  }
}
```

#### `GET /logs/metrics/endpoint`
Get statistics per endpoint.

**Query Parameters:**
- `startDate`, `endDate`, `apiKey`, `endpoint`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "endpoint": "/api/users",
      "totalRequests": 500,
      "avgResponseTime": 150.25,
      "successRate": 98.5,
      "errorRate": 1.5,
      "methods": ["GET", "POST"]
    }
  ]
}
```

#### `GET /logs/metrics/recent`
Get recent requests.

**Query Parameters:**
- `limit` (default: 100) - Number of results
- `page` (default: 1) - Page number
- `apiKey`, `status`, `endpoint` - Filters

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 1500,
    "pages": 15
  }
}
```

#### `GET /logs/metrics/errors`
Get failed requests.

**Query Parameters:**
- `limit`, `page`, `apiKey`, `minStatus` (default: 400)

### 3. API Key Management (Requires Admin Key)

All these endpoints require `x-admin-key` header.

#### `POST /apikey`
Create a new API key.

**Headers:**
```
x-admin-key: your_admin_key
```

**Request Body:**
```json
{
  "owner": "my-application",
  "description": "Production API key",
  "rateLimit": {
    "requestsPerHour": 10000,
    "requestsPerDay": 100000
  },
  "expiresAt": "2025-12-31T23:59:59.000Z"
}
```

#### `GET /apikey`
List all API keys.

**Query Parameters:**
- `status` - Filter by status (active/inactive/revoked)
- `owner` - Filter by owner
- `page`, `limit` - Pagination

#### `GET /apikey/:key`
Get specific API key details.

#### `PUT /apikey/:key`
Update API key.

**Request Body:**
```json
{
  "description": "Updated description",
  "status": "active",
  "rateLimit": {
    "requestsPerHour": 5000
  }
}
```

#### `DELETE /apikey/:key`
Revoke or delete API key.

**Query Parameters:**
- `permanent=true` - Permanently delete (default is soft delete/revoke)

#### `GET /apikey/:key/stats`
Get usage statistics for a specific API key.

### 4. Health Check

#### `GET /health`
Check server health and database connection.

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "mongodb": "connected"
}
```

## Database Schema

### Collections

#### `requests` (API Logs)
- `apiKey` - String (indexed)
- `endpoint` - String (indexed)
- `method` - String (GET, POST, etc.)
- `status` - Number (HTTP status code)
- `responseTime` - Number (milliseconds)
- `timestamp` - Date (indexed)

#### `apikeys` (API Key Management)
- `key` - String (unique, indexed)
- `owner` - String
- `description` - String
- `status` - String (active/inactive/revoked)
- `usageCount` - Number
- `rateLimit` - Object
- `lastUsedAt` - Date
- `createdAt` - Date
- `expiresAt` - Date

## Rate Limiting

Each API key has configurable rate limits:
- `requestsPerHour` - Maximum requests per hour
- `requestsPerDay` - Maximum requests per day

When rate limit is exceeded, the API returns:
```json
{
  "success": false,
  "message": "Rate limit exceeded",
  "limit": 10000,
  "resetAt": "2024-01-15T11:00:00.000Z"
}
```

## Error Handling

All errors follow this format:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

## Security Best Practices

1. **Always use HTTPS in production**
2. **Keep ADMIN_KEY secure** - Never commit to git
3. **Use strong MongoDB passwords**
4. **Enable MongoDB authentication**
5. **Set appropriate CORS origins**
6. **Regularly rotate API keys**
7. **Monitor rate limits**
8. **Set up proper logging**

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a process manager (PM2, systemd)
3. Set up MongoDB replica set
4. Configure reverse proxy (nginx)
5. Enable SSL/TLS
6. Set up monitoring and alerts
7. Configure backup strategy

### Example PM2 Configuration

```json
{
  "apps": [{
    "name": "devmetrics-backend",
    "script": "app.js",
    "instances": "max",
    "exec_mode": "cluster",
    "env": {
      "NODE_ENV": "production"
    }
  }]
}
```

## Troubleshooting

### MongoDB Connection Issues
```bash
# Check MongoDB is running
mongosh

# Check connection string
echo $MONGODB_URI
```

### API Key Not Working
```bash
# List all API keys
curl -H "x-admin-key: YOUR_ADMIN_KEY" http://localhost:5000/apikey

# Check API key status
curl -H "x-admin-key: YOUR_ADMIN_KEY" http://localhost:5000/apikey/YOUR_API_KEY
```

### High Response Times
- Check MongoDB indexes: `db.requests.getIndexes()`
- Monitor query performance
- Consider data archiving for old logs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT