import mongoose from "mongoose";
import crypto from "crypto";

const apiKeySchema = new mongoose.Schema({
  key: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  },
  owner: { 
    type: String, 
    required: true 
  },
  description: {
    type: String,
    default: ""
  },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'revoked'],
    default: 'active',
    index: true
  },
  usageCount: {
    type: Number,
    default: 0
  },
  rateLimit: {
    requestsPerHour: {
      type: Number,
      default: 10000 // Default rate limit
    },
    requestsPerDay: {
      type: Number,
      default: 100000
    }
  },
  lastUsedAt: {
    type: Date
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  expiresAt: {
    type: Date // Optional expiration
  }
}, {
  timestamps: true
});

// Generate a secure API key
apiKeySchema.statics.generateKey = function() {
  return 'dm_' + crypto.randomBytes(32).toString('hex');
};

// Method to check if key is valid
apiKeySchema.methods.isValid = function() {
  if (this.status !== 'active') return false;
  if (this.expiresAt && this.expiresAt < new Date()) return false;
  return true;
};

// Method to increment usage
apiKeySchema.methods.incrementUsage = async function() {
  this.usageCount += 1;
  this.lastUsedAt = new Date();
  await this.save();
};

const ApiKey = mongoose.model("ApiKey", apiKeySchema);

export default ApiKey;