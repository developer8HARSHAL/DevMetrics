import Request from "../models/Request.js";

// GET /metrics/overview - High-level stats
export const getOverview = async (req, res) => {
  try {
    const { startDate, endDate, apiKey } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const matchFilter = {};
    if (Object.keys(dateFilter).length > 0) {
      matchFilter.timestamp = dateFilter;
    }
    if (apiKey) {
      matchFilter.apiKey = apiKey;
    }

    // Aggregate statistics
    const stats = await Request.aggregate([
      { $match: matchFilter },
      {
        $facet: {
          totalRequests: [{ $count: "count" }],
          successRate: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                successful: {
                  $sum: { $cond: [{ $lt: ["$status", 400] }, 1, 0] }
                }
              }
            }
          ],
          avgResponseTime: [
            {
              $group: {
                _id: null,
                avg: { $avg: "$responseTime" },
                min: { $min: "$responseTime" },
                max: { $max: "$responseTime" }
              }
            }
          ],
          requestsByStatus: [
            {
              $group: {
                _id: {
                  $switch: {
                    branches: [
                      { case: { $lt: ["$status", 200] }, then: "1xx" },
                      { case: { $lt: ["$status", 300] }, then: "2xx" },
                      { case: { $lt: ["$status", 400] }, then: "3xx" },
                      { case: { $lt: ["$status", 500] }, then: "4xx" },
                      { case: { $gte: ["$status", 500] }, then: "5xx" }
                    ],
                    default: "unknown"
                  }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ],
          requestsByMethod: [
            {
              $group: {
                _id: "$method",
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1 } }
          ],
          requestsOverTime: [
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d %H:00", date: "$timestamp" }
                },
                count: { $sum: 1 },
                avgResponseTime: { $avg: "$responseTime" }
              }
            },
            { $sort: { _id: 1 } },
            { $limit: 168 } // Last 7 days of hourly data
          ]
        }
      }
    ]);

    const result = stats[0];

    res.json({
      success: true,
      data: {
        totalRequests: result.totalRequests[0]?.count || 0,
        successRate: result.successRate[0] 
          ? ((result.successRate[0].successful / result.successRate[0].total) * 100).toFixed(2)
          : 0,
        avgResponseTime: result.avgResponseTime[0]?.avg?.toFixed(2) || 0,
        minResponseTime: result.avgResponseTime[0]?.min || 0,
        maxResponseTime: result.avgResponseTime[0]?.max || 0,
        requestsByStatus: result.requestsByStatus,
        requestsByMethod: result.requestsByMethod,
        requestsOverTime: result.requestsOverTime
      }
    });

  } catch (err) {
    console.error('Overview error:', err);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch overview",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// GET /metrics/endpoint - Stats per endpoint
export const getEndpointMetrics = async (req, res) => {
  try {
    const { startDate, endDate, apiKey, endpoint } = req.query;

    const matchFilter = {};
    if (startDate || endDate) {
      matchFilter.timestamp = {};
      if (startDate) matchFilter.timestamp.$gte = new Date(startDate);
      if (endDate) matchFilter.timestamp.$lte = new Date(endDate);
    }
    if (apiKey) matchFilter.apiKey = apiKey;
    if (endpoint) matchFilter.endpoint = endpoint;

    const endpointStats = await Request.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: "$endpoint",
          totalRequests: { $sum: 1 },
          avgResponseTime: { $avg: "$responseTime" },
          minResponseTime: { $min: "$responseTime" },
          maxResponseTime: { $max: "$responseTime" },
          successCount: {
            $sum: { $cond: [{ $lt: ["$status", 400] }, 1, 0] }
          },
          errorCount: {
            $sum: { $cond: [{ $gte: ["$status", 400] }, 1, 0] }
          },
          methods: { $addToSet: "$method" }
        }
      },
      {
        $project: {
          endpoint: "$_id",
          totalRequests: 1,
          avgResponseTime: { $round: ["$avgResponseTime", 2] },
          minResponseTime: 1,
          maxResponseTime: 1,
          successRate: {
            $multiply: [
              { $divide: ["$successCount", "$totalRequests"] },
              100
            ]
          },
          errorRate: {
            $multiply: [
              { $divide: ["$errorCount", "$totalRequests"] },
              100
            ]
          },
          methods: 1
        }
      },
      { $sort: { totalRequests: -1 } }
    ]);

    res.json({
      success: true,
      data: endpointStats
    });

  } catch (err) {
    console.error('Endpoint metrics error:', err);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch endpoint metrics",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// GET /metrics/recent - Latest requests
export const getRecentRequests = async (req, res) => {
  try {
    const { limit = 100, page = 1, apiKey, status, endpoint } = req.query;

    const filter = {};
    if (apiKey) filter.apiKey = apiKey;
    if (status) filter.status = parseInt(status);
    if (endpoint) filter.endpoint = endpoint;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [requests, total] = await Promise.all([
      Request.find(filter)
        .sort({ timestamp: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .select('-__v')
        .lean(),
      Request.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: requests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (err) {
    console.error('Recent requests error:', err);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch recent requests",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// GET /metrics/errors - Failed requests for debugging
export const getErrors = async (req, res) => {
  try {
    const { limit = 100, page = 1, apiKey, minStatus = 400 } = req.query;

    const filter = {
      status: { $gte: parseInt(minStatus) }
    };
    if (apiKey) filter.apiKey = apiKey;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [errors, total] = await Promise.all([
      Request.find(filter)
        .sort({ timestamp: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .select('-__v')
        .lean(),
      Request.countDocuments(filter)
    ]);

    // Group errors by status code
    const errorsByStatus = await Request.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          endpoints: { $addToSet: "$endpoint" }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        errors,
        summary: errorsByStatus
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (err) {
    console.error('Errors fetch error:', err);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch errors",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};