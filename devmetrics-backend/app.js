import "../devmetrics-backend/config/bootstrap.js"; // 🔑 MUST BE FIRST

import express from "express";
import cors from "cors";

import pool, { query } from "./config/db.js";

import trackRoutes from "./routes/track.js";
import logsRoutes from "./routes/logs.js";
import apiKeyRoutes from "./routes/apiKey.js";
import authRoutes from "./routes/auth.js";



const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.use("/auth", authRoutes);
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
    // Test database connection
    const result = await query('SELECT NOW()');
    console.log("✓ Connected to PostgreSQL");
    console.log(`  Database: ${process.env.DB_NAME || 'devmetrics'}`);
    console.log(`  Host: ${process.env.DB_HOST || 'localhost'}`);
    if (process.env.DB_HOST && process.env.DB_HOST.includes('supabase.co')) {
      console.log(`  Provider: Supabase`);
    }
    
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
    console.error("✗ PostgreSQL connection failed:");
    console.error(`  Error: ${err.message}`);
    if (err.code) {
      console.error(`  Code: ${err.code}`);
    }
    if (err.detail) {
      console.error(`  Detail: ${err.detail}`);
    }
    console.error("\nTroubleshooting:");
    console.error("  1. Check your .env or .env.production file has correct credentials");
    console.error("  2. Verify database is accessible");
    if (process.env.DB_HOST && process.env.DB_HOST.includes('supabase.co')) {
      console.error("  3. For Supabase: Check connection pooling settings");
      console.error("  4. For Supabase: Verify project is active");
    } else {
      console.error("  3. Run: npm run setup");
    }
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  await pool.end();
  process.exit(0);
});

startServer();