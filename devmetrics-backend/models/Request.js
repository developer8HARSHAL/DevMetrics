import { query } from "../config/db.js";

class Request {
  constructor(data) {
    Object.assign(this, data);
  }

  async save() {
    const sql = `
      INSERT INTO requests (api_key, endpoint, method, status, response_time, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [
      this.apiKey,
      this.endpoint,
      this.method.toUpperCase(),
      this.status,
      this.responseTime,
      this.timestamp || new Date()
    ];
    const result = await query(sql, values);
    Object.assign(this, result.rows[0]);
    return this;
  }

  static async find(filter = {}) {
    const { apiKey, status, endpoint } = filter;
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (apiKey) {
      conditions.push(`api_key = $${paramCount++}`);
      values.push(apiKey);
    }
    if (status) {
      conditions.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (endpoint) {
      conditions.push(`endpoint = $${paramCount++}`);
      values.push(endpoint);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT * FROM requests ${whereClause} ORDER BY timestamp DESC`;
    const result = await query(sql, values);
    return result.rows;
  }

  static async countDocuments(filter = {}) {
    const { apiKey, status, timestamp } = filter;
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (apiKey) {
      conditions.push(`api_key = $${paramCount++}`);
      values.push(apiKey);
    }
    if (status) {
      if (status.$gte) {
        conditions.push(`status >= $${paramCount++}`);
        values.push(status.$gte);
      }
    }
    if (timestamp && timestamp.$gte) {
      conditions.push(`timestamp >= $${paramCount++}`);
      values.push(timestamp.$gte);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT COUNT(*) as count FROM requests ${whereClause}`;
    const result = await query(sql, values);
    return parseInt(result.rows[0].count);
  }

  static async aggregate(pipeline) {
    const matchStage = pipeline.find(stage => stage.$match);
    const filter = matchStage ? matchStage.$match : {};
    
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (filter.apiKey) {
      conditions.push(`api_key = $${paramCount++}`);
      values.push(filter.apiKey);
    }
    if (filter.timestamp) {
      if (filter.timestamp.$gte) {
        conditions.push(`timestamp >= $${paramCount++}`);
        values.push(filter.timestamp.$gte);
      }
      if (filter.timestamp.$lte) {
        conditions.push(`timestamp <= $${paramCount++}`);
        values.push(filter.timestamp.$lte);
      }
    }
    if (filter.status && filter.status.$gte) {
      conditions.push(`status >= $${paramCount++}`);
      values.push(filter.status.$gte);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Handle facet queries (from logsController)
    const facetStage = pipeline.find(stage => stage.$facet);
    if (facetStage) {
      const results = {};
      
      // Total requests
      const totalSql = `SELECT COUNT(*) as count FROM requests ${whereClause}`;
      const totalResult = await query(totalSql, values);
      results.totalRequests = [{ count: parseInt(totalResult.rows[0].count) }];

      // Success rate
      const successSql = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status < 400 THEN 1 END) as successful
        FROM requests ${whereClause}
      `;
      const successResult = await query(successSql, values);
      results.successRate = [successResult.rows[0]];

      // Avg response time
      const avgSql = `
        SELECT 
          AVG(response_time) as avg,
          MIN(response_time) as min,
          MAX(response_time) as max
        FROM requests ${whereClause}
      `;
      const avgResult = await query(avgSql, values);
      results.avgResponseTime = [avgResult.rows[0]];

      // Requests by status
      const statusSql = `
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
        GROUP BY _id
        ORDER BY _id
      `;
      const statusResult = await query(statusSql, values);
      results.requestsByStatus = statusResult.rows;

      // Requests by method
      const methodSql = `
        SELECT method as _id, COUNT(*) as count
        FROM requests ${whereClause}
        GROUP BY method
        ORDER BY count DESC
      `;
      const methodResult = await query(methodSql, values);
      results.requestsByMethod = methodResult.rows;

      // Requests over time
      const timeSql = `
        SELECT 
          TO_CHAR(DATE_TRUNC('hour', timestamp), 'YYYY-MM-DD HH24:00') as _id,
          COUNT(*) as count,
          AVG(response_time) as "avgResponseTime"
        FROM requests ${whereClause}
        GROUP BY DATE_TRUNC('hour', timestamp)
        ORDER BY _id
        LIMIT 168
      `;
      const timeResult = await query(timeSql, values);
      results.requestsOverTime = timeResult.rows;

      return [results];
    }

    // Handle endpoint metrics
    if (pipeline.find(stage => stage.$group && stage.$group._id === "$endpoint")) {
      const sql = `
        SELECT 
          endpoint as _id,
          COUNT(*) as "totalRequests",
          ROUND(AVG(response_time)::numeric, 2) as "avgResponseTime",
          MIN(response_time) as "minResponseTime",
          MAX(response_time) as "maxResponseTime",
          COUNT(CASE WHEN status < 400 THEN 1 END) as "successCount",
          COUNT(CASE WHEN status >= 400 THEN 1 END) as "errorCount",
          ARRAY_AGG(DISTINCT method) as methods
        FROM requests ${whereClause}
        GROUP BY endpoint
        ORDER BY "totalRequests" DESC
      `;
      const result = await query(sql, values);
      return result.rows.map(row => ({
        ...row,
        successRate: row.totalRequests > 0 ? (row.successCount / row.totalRequests) * 100 : 0,
        errorRate: row.totalRequests > 0 ? (row.errorCount / row.totalRequests) * 100 : 0
      }));
    }

    // Handle error summary
    if (pipeline.find(stage => stage.$group && stage.$group._id === "$status")) {
      const sql = `
        SELECT 
          status as _id,
          COUNT(*) as count,
          ARRAY_AGG(DISTINCT endpoint) as endpoints
        FROM requests ${whereClause}
        GROUP BY status
        ORDER BY count DESC
      `;
      const result = await query(sql, values);
      return result.rows;
    }

    return [];
  }
}

export default Request;