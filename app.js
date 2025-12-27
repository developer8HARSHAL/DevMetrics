import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool, { query } from "./config/db.js";

import trackRoutes from "./routes/track.js";
import logsRoutes from "./routes/logs.js";
import apiKeyRoutes from "./routes/apiKey.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.use("/track", trackRoutes);
app.use("/logs", logsRoutes);
app.use("/apikey", apiKeyRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "DevMetrics Backend is running!",
    version: "1.0.0",
    endpoints: {
      tracking: "/track",
      analytics: {
        overview: "/logs/metrics/overview",
        endpoint: "/logs/metrics/endpoint",
        recent: "/logs/metrics/recent",
        errors: "/logs/metrics/errors"
      },
      apiKeyManagement: "/apikey"
    }
  });
});

app.get("/health", async (req, res) => {
  let dbStatus = "disconnected";
  try {
    await query('SELECT 1');
    dbStatus = "connected";
  } catch (err) {
    console.error('Health check error:', err);
  }

  res.json({
    status: dbStatus === "connected" ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    postgresql: dbStatus
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
    path: req.path
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

async function startServer() {
  try {
    await query('SELECT NOW()');
    console.log("✓ Connected to PostgreSQL");
    console.log(`  Database: ${process.env.DB_NAME || 'devmetrics'}`);
    
    app.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
      console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('\nEndpoints:');
      console.log('  POST /track');
      console.log('  GET  /logs/metrics/overview');
      console.log('  GET  /logs/metrics/endpoint');
      console.log('  GET  /logs/metrics/recent');
      console.log('  GET  /logs/metrics/errors');
      console.log('  POST /apikey');
      console.log('  GET  /apikey');
      console.log('  GET  /health');
    });
  } catch (err) {
    console.error("✗ PostgreSQL connection failed:", err.message);
    console.error("Run: npm run setup");
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  await pool.end();
  process.exit(0);
});

startServer();