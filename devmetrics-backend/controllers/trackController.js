import Request from "../models/Request.js";
import ApiKey from "../models/ApiKey.js";

// Validation helper
const validateTrackData = (data) => {
  const errors = [];
  
  if (!data.apiKey || typeof data.apiKey !== 'string') {
    errors.push('apiKey is required and must be a string');
  }
  
  if (!data.endpoint || typeof data.endpoint !== 'string') {
    errors.push('endpoint is required and must be a string');
  }
  
  if (!data.method || typeof data.method !== 'string') {
    errors.push('method is required and must be a string');
  }
  
  if (data.status === undefined || typeof data.status !== 'number') {
    errors.push('status is required and must be a number');
  } else if (data.status < 100 || data.status > 599) {
    errors.push('status must be a valid HTTP status code (100-599)');
  }
  
  if (data.responseTime === undefined || typeof data.responseTime !== 'number') {
    errors.push('responseTime is required and must be a number');
  } else if (data.responseTime < 0) {
    errors.push('responseTime must be a non-negative number');
  }
  
  if (data.timestamp && isNaN(Date.parse(data.timestamp))) {
    errors.push('timestamp must be a valid ISO date string');
  }
  
  return errors;
};

// Main tracking handler
export const handleTrack = async (req, res) => {
  try {
    const { apiKey, endpoint, method, status, responseTime, timestamp } = req.body;

    // Validate incoming data
    const validationErrors = validateTrackData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: "Validation failed",
        errors: validationErrors 
      });
    }

    // Validate API key exists and is active
    const apiKeyDoc = await ApiKey.findOne({ key: apiKey });
    
    if (!apiKeyDoc) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid API key" 
      });
    }

    if (!apiKeyDoc.isValid()) {
      return res.status(401).json({ 
        success: false,
        message: "API key is inactive or expired" 
      });
    }

    // Check rate limits (optional, basic implementation)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentRequests = await Request.countDocuments({
      apiKey: apiKey,
      timestamp: { $gte: oneHourAgo }
    });

    if (recentRequests >= apiKeyDoc.rateLimit.requestsPerHour) {
      return res.status(429).json({
        success: false,
        message: "Rate limit exceeded",
        limit: apiKeyDoc.rateLimit.requestsPerHour,
        resetAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      });
    }

    // Create and save the request log
    const newRequest = new Request({
      apiKey,
      endpoint,
      method: method.toUpperCase(),
      status,
      responseTime,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    });

    await newRequest.save();

    // Increment API key usage (fire and forget)
    apiKeyDoc.incrementUsage().catch(err => 
      console.error('Failed to increment usage:', err)
    );

    res.status(201).json({ 
      success: true,
      message: "Request tracked successfully",
      id: newRequest._id
    });

  } catch (err) {
    console.error('Track error:', err);
    res.status(500).json({ 
      success: false,
      message: "Failed to track request",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};