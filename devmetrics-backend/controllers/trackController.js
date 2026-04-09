import Request from "../models/Request.js";
import ApiKey from "../models/ApiKey.js";

export const handleTrack = async (req, res) => {
  try {
    const { endpoint, method, status, responseTime, timestamp, apiKey } = req.body;

    // req.apiKeyDoc already validated by auth middleware
    const apiKeyDoc = req.apiKeyDoc;

    // Rate limit check
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentRequests = await Request.countDocuments({
      apiKey,
      timestamp: { $gte: oneHourAgo }
    });

    const hourlyLimit = apiKeyDoc.requests_per_hour || 10000;
    if (recentRequests >= hourlyLimit) {
      return res.status(429).json({
        success: false,
        message: "Rate limit exceeded",
        limit: hourlyLimit,
        resetAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      });
    }

    const newRequest = new Request({
      apiKey,
      endpoint,
      method: method.toUpperCase(),
      status,
      responseTime,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    });

    await newRequest.save();

    ApiKey.incrementUsage(apiKey).catch(err =>
      console.error('Failed to increment usage:', err)
    );

    res.status(201).json({
      success: true,
      message: "Request tracked successfully",
      id: newRequest.id
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