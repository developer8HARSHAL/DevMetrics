import Request from "../models/Request.js";
import { query } from "../config/db.js";

export const getOverview = async (req, res) => {
  try {
    const { startDate, endDate, apiKey } = req.query;

    const matchFilter = {};
    if (startDate || endDate) {
      matchFilter.timestamp = {};
      if (startDate) matchFilter.timestamp.$gte = new Date(startDate);
      if (endDate) matchFilter.timestamp.$lte = new Date(endDate);
    }
    if (apiKey) {
      matchFilter.apiKey = apiKey;
    }

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
            { $limit: 168 }
          ]
        }
      }
    ]);

    const result = stats[0];

    const avgTime = result.avgResponseTime[0];
    
    res.json({
      success: true,
      data: {
        totalRequests: result.totalRequests[0]?.count || 0,
        successRate: result.successRate[0] 
          ? ((result.successRate[0].successful / result.successRate[0].total) * 100).toFixed(2)
          : 0,
        avgResponseTime: avgTime?.avg ? parseFloat(avgTime.avg).toFixed(2) : 0,
        minResponseTime: avgTime?.min ? parseInt(avgTime.min) : 0,
        maxResponseTime: avgTime?.max ? parseInt(avgTime.max) : 0,
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
      }
    ]);

    res.json({
      success: true,
      data: endpointStats.map(stat => ({
        endpoint: stat._id,
        totalRequests: stat.totalRequests,
        avgResponseTime: parseFloat(stat.avgResponseTime).toFixed(2),
        minResponseTime: stat.minResponseTime,
        maxResponseTime: stat.maxResponseTime,
        successRate: ((stat.successCount / stat.totalRequests) * 100).toFixed(2),
        errorRate: ((stat.errorCount / stat.totalRequests) * 100).toFixed(2),
        methods: stat.methods
      }))
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

export const getRecentRequests = async (req, res) => {
  try {
    const { limit = 100, page = 1, apiKey, status, endpoint } = req.query;

    const filter = {};
    if (apiKey) filter.apiKey = apiKey;
    if (status) filter.status = parseInt(status);
    if (endpoint) filter.endpoint = endpoint;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build SQL query
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (apiKey) {
      conditions.push(`api_key = $${paramCount++}`);
      values.push(apiKey);
    }
    if (status) {
      conditions.push(`status = $${paramCount++}`);
      values.push(parseInt(status));
    }
    if (endpoint) {
      conditions.push(`endpoint = $${paramCount++}`);
      values.push(endpoint);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [requestsResult, totalResult] = await Promise.all([
      query(
        `SELECT * FROM requests ${whereClause} ORDER BY timestamp DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
        [...values, parseInt(limit), offset]
      ),
      query(
        `SELECT COUNT(*) as count FROM requests ${whereClause}`,
        values
      )
    ]);

    const requests = requestsResult.rows;
    const total = parseInt(totalResult.rows[0].count);

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

export const getErrors = async (req, res) => {
  try {
    const { limit = 100, page = 1, apiKey, minStatus = 400 } = req.query;

    const filter = {
      status: { $gte: parseInt(minStatus) }
    };
    if (apiKey) filter.apiKey = apiKey;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build SQL query
    const conditions = [`status >= $1`];
    const values = [parseInt(minStatus)];
    let paramCount = 2;

    if (apiKey) {
      conditions.push(`api_key = $${paramCount++}`);
      values.push(apiKey);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const [errorsResult, totalResult, summaryResult] = await Promise.all([
      query(
        `SELECT * FROM requests ${whereClause} ORDER BY timestamp DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
        [...values, parseInt(limit), offset]
      ),
      query(
        `SELECT COUNT(*) as count FROM requests ${whereClause}`,
        values
      ),
      query(
        `SELECT status as _id, COUNT(*) as count, ARRAY_AGG(DISTINCT endpoint) as endpoints 
         FROM requests ${whereClause} 
         GROUP BY status 
         ORDER BY count DESC`,
        values
      )
    ]);

    const errors = errorsResult.rows;
    const total = parseInt(totalResult.rows[0].count);
    const errorsByStatus = summaryResult.rows;

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