import ApiKey from "../models/ApiKey.js";

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
      status: 'active',
      requestsPerHour: rateLimit?.requestsPerHour || 10000,
      requestsPerDay: rateLimit?.requestsPerDay || 100000,
      expiresAt: expiresAt ? new Date(expiresAt) : null
    };

    const newApiKey = await ApiKey.create(apiKeyData);

    res.status(201).json({
      success: true,
      message: "API key created successfully",
      data: {
        key: newApiKey.key,
        owner: newApiKey.owner,
        description: newApiKey.description,
        status: newApiKey.status,
        rateLimit: {
          requestsPerHour: newApiKey.requests_per_hour,
          requestsPerDay: newApiKey.requests_per_day
        },
        createdAt: newApiKey.created_at,
        expiresAt: newApiKey.expires_at
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

export const listApiKeys = async (req, res) => {
  try {
    const { status, owner, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (owner) filter.owner = owner;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [apiKeys, total] = await Promise.all([
      ApiKey.find(filter, { limit: parseInt(limit), offset: skip }),
      ApiKey.countDocuments(filter)
    ]);

    // Format to match MongoDB response structure
    const formattedKeys = apiKeys.map(key => ({
      key: key.key,
      owner: key.owner,
      description: key.description,
      status: key.status,
      usageCount: key.usage_count,
      rateLimit: {
        requestsPerHour: key.requests_per_hour,
        requestsPerDay: key.requests_per_day
      },
      lastUsedAt: key.last_used_at,
      createdAt: key.created_at,
      expiresAt: key.expires_at
    }));

    res.json({
      success: true,
      data: formattedKeys,
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

export const getApiKey = async (req, res) => {
  try {
    const { key } = req.params;
    const apiKey = await ApiKey.findOne({ key });

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: "API key not found"
      });
    }

    res.json({
      success: true,
      data: {
        key: apiKey.key,
        owner: apiKey.owner,
        description: apiKey.description,
        status: apiKey.status,
        usageCount: apiKey.usage_count,
        rateLimit: {
          requestsPerHour: apiKey.requests_per_hour,
          requestsPerDay: apiKey.requests_per_day
        },
        lastUsedAt: apiKey.last_used_at,
        createdAt: apiKey.created_at,
        expiresAt: apiKey.expires_at
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

    // Build update object
    const updates = {};
    if (description !== undefined) updates.description = description;
    if (status && ['active', 'inactive', 'revoked'].includes(status)) {
      updates.status = status;
    }
    if (rateLimit) {
      if (rateLimit.requestsPerHour !== undefined) {
        updates.requests_per_hour = rateLimit.requestsPerHour;
      }
      if (rateLimit.requestsPerDay !== undefined) {
        updates.requests_per_day = rateLimit.requestsPerDay;
      }
    }
    if (expiresAt !== undefined) {
      updates.expires_at = expiresAt ? new Date(expiresAt) : null;
    }

    // Update in database
    const sql = Object.keys(updates).length > 0
      ? `UPDATE api_keys SET ${Object.keys(updates).map((k, i) => `${k} = $${i + 1}`).join(', ')} WHERE key = $${Object.keys(updates).length + 1} RETURNING *`
      : null;

    if (!sql) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update"
      });
    }

    const { query } = await import("../config/db.js");
    const result = await query(sql, [...Object.values(updates), key]);
    const updatedKey = result.rows[0];

    res.json({
      success: true,
      message: "API key updated successfully",
      data: {
        key: updatedKey.key,
        owner: updatedKey.owner,
        description: updatedKey.description,
        status: updatedKey.status,
        usageCount: updatedKey.usage_count,
        rateLimit: {
          requestsPerHour: updatedKey.requests_per_hour,
          requestsPerDay: updatedKey.requests_per_day
        },
        lastUsedAt: updatedKey.last_used_at,
        createdAt: updatedKey.created_at,
        expiresAt: updatedKey.expires_at
      }
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

export const revokeApiKey = async (req, res) => {
  try {
    const { key } = req.params;
    const { permanent = false } = req.query;

    if (permanent === 'true') {
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
      const apiKey = await ApiKey.findOneAndUpdate(
        { key },
        { status: 'revoked' }
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
        data: {
          key: apiKey.key,
          status: apiKey.status
        }
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
    const stats = await Request.aggregate([{ $match: filter }, {
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
    }]);

    const overview = stats[0].overview[0] || {};

    res.json({
      success: true,
      data: {
        apiKey: {
          key: apiKey.key,
          owner: apiKey.owner,
          status: apiKey.status,
          usageCount: apiKey.usage_count,
          lastUsedAt: apiKey.last_used_at,
          createdAt: apiKey.created_at
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