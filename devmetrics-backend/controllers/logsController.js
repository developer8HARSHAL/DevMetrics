import { query } from "../config/db.js";

export const getOverview = async (req, res) => {
  try {
    const { startDate, endDate, apiKey } = req.query;

    // Build WHERE clause
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (startDate) {
      conditions.push(`timestamp >= $${paramCount++}`);
      values.push(new Date(startDate));
    }
    if (endDate) {
      conditions.push(`timestamp <= $${paramCount++}`);
      values.push(new Date(endDate));
    }
    if (apiKey) {
      conditions.push(`api_key = $${paramCount++}`);
      values.push(apiKey);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Execute all queries in parallel
    const [
      totalResult,
      successResult,
      avgTimeResult,
      statusResult,
      methodResult,
      timeSeriesResult
    ] = await Promise.all([
      // Total requests
      query(`SELECT COUNT(*) as count FROM requests ${whereClause}`, values),
      
      // Success rate
      query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status < 400 THEN 1 END) as successful
        FROM requests ${whereClause}
      `, values),
      
      // Response time stats
      query(`
        SELECT 
          AVG(response_time) as avg,
          MIN(response_time) as min,
          MAX(response_time) as max
        FROM requests ${whereClause}
      `, values),
      
      // Requests by status
      query(`
        SELECT 
          CASE 
            WHEN status < 200 THEN '1xx'
            WHEN status < 300 THEN '2xx'
            WHEN status < 400 THEN '3xx'
            WHEN status < 500 THEN '4xx'
            ELSE '5xx'
          END as _id,
          COUNT(*) as count
        FROM requests ${whereClause}
        GROUP BY 
          CASE 
            WHEN status < 200 THEN '1xx'
            WHEN status < 300 THEN '2xx'
            WHEN status < 400 THEN '3xx'
            WHEN status < 500 THEN '4xx'
            ELSE '5xx'
          END
        ORDER BY _id
      `, values),
      
      // Requests by method
      query(`
        SELECT method as _id, COUNT(*) as count
        FROM requests ${whereClause}
        GROUP BY method
        ORDER BY count DESC
      `, values),
      
      // Requests over time
      query(`
        SELECT 
          TO_CHAR(DATE_TRUNC('hour', timestamp), 'YYYY-MM-DD HH24:00') as _id,
          COUNT(*) as count,
          AVG(response_time) as "avgResponseTime"
        FROM requests ${whereClause}
        GROUP BY DATE_TRUNC('hour', timestamp)
        ORDER BY DATE_TRUNC('hour', timestamp)
        LIMIT 168
      `, values)
    ]);

    const totalRequests = parseInt(totalResult.rows[0].count) || 0;
    const successData = successResult.rows[0];
    const avgTime = avgTimeResult.rows[0];
    
    // Calculate success rate
    const successRate = successData.total > 0
      ? ((successData.successful / successData.total) * 100).toFixed(2)
      : "0.00";

    res.json({
      success: true,
      data: {
        totalRequests,
        successRate,
        avgResponseTime: avgTime.avg ? parseFloat(avgTime.avg) : 0,  // NUMBER not string
        minResponseTime: avgTime.min ? parseInt(avgTime.min) : 0,
        maxResponseTime: avgTime.max ? parseInt(avgTime.max) : 0,
        requestsByStatus: statusResult.rows,
        requestsByMethod: methodResult.rows,
        requestsOverTime: timeSeriesResult.rows.map(row => ({
          _id: row._id,
          count: parseInt(row.count),
          avgResponseTime: parseFloat(row.avgResponseTime) || 0  // NUMBER not string
        }))
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

    // Build WHERE clause
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (startDate) {
      conditions.push(`timestamp >= $${paramCount++}`);
      values.push(new Date(startDate));
    }
    if (endDate) {
      conditions.push(`timestamp <= $${paramCount++}`);
      values.push(new Date(endDate));
    }
    if (apiKey) {
      conditions.push(`api_key = $${paramCount++}`);
      values.push(apiKey);
    }
    if (endpoint) {
      conditions.push(`endpoint = $${paramCount++}`);
      values.push(endpoint);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(`
      SELECT 
        endpoint,
        COUNT(*) as "totalRequests",
        AVG(response_time) as "avgResponseTime",
        MIN(response_time) as "minResponseTime",
        MAX(response_time) as "maxResponseTime",
        COUNT(CASE WHEN status < 400 THEN 1 END) as "successCount",
        COUNT(CASE WHEN status >= 400 THEN 1 END) as "errorCount",
        ARRAY_AGG(DISTINCT method) as methods
      FROM requests ${whereClause}
      GROUP BY endpoint
      ORDER BY "totalRequests" DESC
    `, values);

    const endpointStats = result.rows.map(stat => ({
      endpoint: stat.endpoint,
      totalRequests: parseInt(stat.totalRequests),
      avgResponseTime: parseFloat(stat.avgResponseTime),  // NUMBER not string
      minResponseTime: parseInt(stat.minResponseTime),
      maxResponseTime: parseInt(stat.maxResponseTime),
      successRate: parseFloat(((stat.successCount / stat.totalRequests) * 100).toFixed(2)),
      errorRate: parseFloat(((stat.errorCount / stat.totalRequests) * 100).toFixed(2)),
      methods: stat.methods
    }));

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

export const getRecentRequests = async (req, res) => {
  try {
    const { limit = 100, page = 1, apiKey, status, endpoint } = req.query;

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
    const offset = (parseInt(page) - 1) * parseInt(limit);

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

    const total = parseInt(totalResult.rows[0].count);

    res.json({
      success: true,
      data: requestsResult.rows,
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

    const conditions = [];
    const values = [];
    let paramCount = 1;

    conditions.push(`status >= $${paramCount++}`);
    values.push(parseInt(minStatus));

    if (apiKey) {
      conditions.push(`api_key = $${paramCount++}`);
      values.push(apiKey);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build parameterized queries with correct parameter numbers
    const limitParamNum = paramCount++;
    const offsetParamNum = paramCount++;
    const limitValue = parseInt(limit);
    const offsetValue = offset;

    const [errorsResult, totalResult, summaryResult] = await Promise.all([
      query(
        `SELECT * FROM requests ${whereClause} ORDER BY timestamp DESC LIMIT $${limitParamNum} OFFSET $${offsetParamNum}`,
        [...values, limitValue, offsetValue]
      ),
      query(
        `SELECT COUNT(*) as count FROM requests ${whereClause}`,
        values
      ),
      query(
        `SELECT 
          status as _id, 
          COUNT(*) as count, 
          ARRAY_AGG(DISTINCT endpoint) as endpoints 
         FROM requests ${whereClause} 
         GROUP BY status 
         ORDER BY count DESC`,
        values
      )
    ]);

    const total = parseInt(totalResult.rows[0].count);

    res.json({
      success: true,
      data: {
        errors: errorsResult.rows,
        summary: summaryResult.rows
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
