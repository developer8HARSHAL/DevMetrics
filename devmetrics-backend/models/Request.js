import mongoose from "mongoose";

const requestSchema = new mongoose.Schema({
  apiKey: { 
    type: String, 
    required: true,
    index: true // Index for faster queries
  },
  endpoint: { 
    type: String, 
    required: true,
    index: true // Index for endpoint-based queries
  },
  method: { 
    type: String, 
    required: true,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    uppercase: true
  },
  status: { 
    type: Number, 
    required: true,
    min: 100,
    max: 599
  },
  responseTime: { 
    type: Number, 
    required: true,
    min: 0
  },
  timestamp: { 
    type: Date, 
    default: Date.now,
    index: true // Index for time-based queries
  },
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Compound index for common queries
requestSchema.index({ apiKey: 1, timestamp: -1 });
requestSchema.index({ endpoint: 1, timestamp: -1 });
requestSchema.index({ status: 1, timestamp: -1 });

const Request = mongoose.model("Request", requestSchema);

export default Request;