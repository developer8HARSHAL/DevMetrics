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
}

export default Request;
