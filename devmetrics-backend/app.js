import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

// Import routes
import trackRoutes from "./routes/track.js";
import logsRoutes from "./routes/logs.js";
import apiKeyRoutes from "./routes/apiKey.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware (optional, for debugging)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use("/track", trackRoutes);           // SDK tracking endpoint
app.use("/logs", logsRoutes);             // Analytics/dashboard endpoints
app.use("/apikey", apiKeyRoutes);         // API key management

// Test route
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

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
    path: req.path
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/devmetrics", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log("✓ Connected to MongoDB");
  console.log(`  Database: ${mongoose.connection.name}`);
  
  // Start server only after DB connection
  app.listen(PORT, () => {
    console.log(`✓ Server is running on http://localhost:${PORT}`);
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('\nAvailable endpoints:');
    console.log('  POST   /track                    - Track API requests');
    console.log('  GET    /logs/metrics/overview    - Get overview metrics');
    console.log('  GET    /logs/metrics/endpoint    - Get endpoint metrics');
    console.log('  GET    /logs/metrics/recent      - Get recent requests');
    console.log('  GET    /logs/metrics/errors      - Get error logs');
    console.log('  POST   /apikey                   - Create API key (admin)');
    console.log('  GET    /apikey                   - List API keys (admin)');
    console.log('  GET    /health                   - Health check');
  });
})
.catch((err) => {
  console.error("✗ Failed to connect to MongoDB:", err);
  process.exit(1);
});