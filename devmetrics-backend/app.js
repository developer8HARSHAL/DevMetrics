import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

// Import routes
import trackRoutes from "./routes/track.js";
import logsRoutes from "./routes/logs.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/track", trackRoutes);
app.use("/logs", logsRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("DevMetrics Backend is running!");
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/devmetrics", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log("Connected to MongoDB");
  // Start server only after DB connection
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
})
.catch((err) => {
  console.error("Failed to connect to MongoDB:", err);
});
