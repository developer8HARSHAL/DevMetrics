import ApiKey from "../models/ApiKey.js";

// Register user and create API key automatically
export const registerUser = async (req, res) => {
  try {
    const { userId, email } = req.body;

    if (!userId || !email) {
      return res.status(400).json({
        success: false,
        message: "userId and email are required"
      });
    }

    // Check if user already has an API key
    const existing = await ApiKey.findOne({ user_id: userId });
    
    if (existing) {
      return res.json({
        success: true,
        message: "API key already exists",
        data: {
          key: existing.key,
          createdAt: existing.created_at
        }
      });
    }

    // Generate new API key for user
    const key = ApiKey.generateKey();
    
    const apiKey = await ApiKey.create({
      key,
      owner: email,
      description: `Auto-generated for ${email}`,
      status: 'active',
      requestsPerHour: 10000,
      requestsPerDay: 100000,
      expiresAt: null,
      userId,  // Add this
      userEmail: email  // Add this
    });

    res.status(201).json({
      success: true,
      message: "API key created successfully",
      data: {
        key: apiKey.key,
        createdAt: apiKey.created_at
      }
    });

  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({
      success: false,
      message: "Failed to create API key",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Get user's API key
export const getUserApiKey = async (req, res) => {
  try {
    const { userId } = req.params;

    const apiKey = await ApiKey.findOne({ user_id: userId });

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: "API key not found for this user"
      });
    }

    res.json({
      success: true,
      data: {
        key: apiKey.key,
        status: apiKey.status,
        usageCount: apiKey.usage_count,
        rateLimit: {
          requestsPerHour: apiKey.requests_per_hour,
          requestsPerDay: apiKey.requests_per_day
        },
        lastUsedAt: apiKey.last_used_at,
        createdAt: apiKey.created_at
      }
    });

  } catch (err) {
    console.error('Get API key error:', err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch API key",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};