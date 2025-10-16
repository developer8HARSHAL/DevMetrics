import ApiKey from "../models/ApiKey.js";

// POST /apikey - Create new API key
export const createApiKey = async (req, res) => {
  try {
    const { owner, description, rateLimit, expiresAt } = req.body;

    if (!owner || typeof owner !== 'string') {
      return res.status(400).json({
        success: false,
        message: "Owner is required and must be a string"
      });
    }

    const key = ApiKey.generateKey();

    const apiKeyData = {
      key,
      owner,
      description: description || '',
      status: 'active'
    };

    if (rateLimit) {
      apiKeyData.rateLimit = {
        requestsPerHour: rateLimit.requestsPerHour || 10000,
        requestsPerDay: rateLimit.requestsPerDay || 100000
      };
    }

    if (expiresAt) {
      apiKeyData.expiresAt = new Date(expiresAt);
    }

    const newApiKey = new ApiKey(apiKeyData);
    await newApiKey.save();

    res.status(201).json({
      success: true,
      message: "API key created successfully",
      data: {
        key: newApiKey.key,
        owner: newApiKey.owner,
        description: newApiKey.description,
        status: newApiKey.status,
        rateLimit: newApiKey.rateLimit,
        createdAt: newApiKey.createdAt,
        expiresAt: newApiKey.expiresAt
      }
    });

  } catch (err) {
    console.error('Create API key error:', err);
    res.status(500).json({
      success: false,
      message: "Failed to create API key",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// GET /apikey - List all API keys
export const listApiKeys = async (req, res) => {
  try {
    const { status, owner, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (owner) filter.owner = owner;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [apiKeys, total] = await Promise.all([
      ApiKey.find(filter)
        .select('-__v')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean(),
      ApiKey.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: apiKeys,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (err) {
    console.error('List API keys error:', err);
    res.status(500).json({
      success: false,
      message: "Failed to list API keys",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// GET /apikey/:key - Get specific API key details
export const getApiKey = async (req, res) => {
  try {
    const { key } = req.params;

    const apiKey = await ApiKey.findOne({ key }).select('-__v').lean();

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: "API key not found"
      });
    }

    res.json({
      success: true,
      data: apiKey
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

// PUT /apikey/:key - Update API key
export const updateApiKey = async (req, res) => {
  try {
    const { key } = req.params;
    const { description, status, rateLimit, expiresAt } = req.body;

    const apiKey = await ApiKey.findOne({ key });

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: "API key not found"
      });
    }

    if (description !== undefined) apiKey.description = description;
    if (status && ['active', 'inactive', 'revoked'].includes(status)) {
      apiKey.status = status;
    }
    if (rateLimit) {
      if (rateLimit.requestsPerHour !== undefined) {
        apiKey.rateLimit.requestsPerHour = rateLimit.requestsPerHour;
      }
      if (rateLimit.requestsPerDay !== undefined) {
        apiKey.rateLimit.requestsPerDay = rateLimit.requestsPerDay;
      }
    }
    if (expiresAt !== undefined) {
      apiKey.expiresAt = expiresAt ? new Date(expiresAt) : null;
    }

    await apiKey.save();

    res.json({
      success: true,
      message: "API key updated successfully",
      data: apiKey
    });

  } catch (err) {
    console.error('Update API key error:', err);
    res.status(500).json({
      success: false,
      message: "Failed to update API key",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// DELETE /apikey/:key - Revoke/delete API key
export const revokeApiKey = async (req, res) => {
  try {
    const { key } = req.params;
    const { permanent = false } = req.query;

    if (permanent === 'true') {
      // Permanently delete
      const result = await ApiKey.deleteOne({ key });
      
      if (result.deletedCount === 0) {
        return res.status(404).json({
          success: false,
          message: "API key not found"
        });
      }

      res.json({
        success: true,
        message: "API key permanently deleted"
      });
    } else {
      // Just revoke (soft delete)
      const apiKey = await ApiKey.findOneAndUpdate(
        { key },
        { status: 'revoked' },
        { new: true }
      );

      if (!apiKey) {
        return res.status(404).json({
          success: false,
          message: "API key not found"
        });
      }

      res.json({
        success: true,
        message: "API key revoked successfully",
        data: apiKey
      });
    }

  } catch (err) {
    console.error('Revoke API key error:', err);
    res.status(500).json({
      success: false,
      message: "Failed to revoke API key",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// GET /apikey/:key/stats - Get usage statistics for a specific API key
export const getApiKeyStats = async (req, res) => {
  try {
    const { key } = req.params;
    const { startDate, endDate } = req.query;

    const apiKey = await ApiKey.findOne({ key });

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: "API key not found"
      });
    }

    const filter = { apiKey: key };
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const Request = (await import("../models/Request.js")).default;

    const stats = await Request.aggregate([
      { $match: filter },
      {
        $facet: {
          overview: [
            {
              $group: {
                _id: null,
                totalRequests: { $sum: 1 },
                avgResponseTime: { $avg: "$responseTime" },
                successCount: {
                  $sum: { $cond: [{ $lt: ["$status", 400] }, 1, 0] }
                },
                errorCount: {
                  $sum: { $cond: [{ $gte: ["$status", 400] }, 1, 0] }
                }
              }
            }
          ],
          topEndpoints: [
            {
              $group: {
                _id: "$endpoint",
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ]
        }
      }
    ]);

    const overview = stats[0].overview[0] || {};

    res.json({
      success: true,
      data: {
        apiKey: {
          key: apiKey.key,
          owner: apiKey.owner,
          status: apiKey.status,
          usageCount: apiKey.usageCount,
          lastUsedAt: apiKey.lastUsedAt,
          createdAt: apiKey.createdAt
        },
        statistics: {
          totalRequests: overview.totalRequests || 0,
          avgResponseTime: overview.avgResponseTime?.toFixed(2) || 0,
          successRate: overview.totalRequests 
            ? ((overview.successCount / overview.totalRequests) * 100).toFixed(2)
            : 0,
          errorCount: overview.errorCount || 0,
          topEndpoints: stats[0].topEndpoints
        }
      }
    });

  } catch (err) {
    console.error('Get API key stats error:', err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch API key statistics",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};