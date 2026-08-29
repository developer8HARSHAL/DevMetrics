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

  // Goal 2 (2C/3A): Run detail + compare pages need a run's full timeline.
  static async findBySessionId(sessionId) {
    const sql = 'SELECT * FROM requests WHERE session_id = $1 ORDER BY timestamp ASC';
    const result = await query(sql, [sessionId]);
    return result.rows;
  }

  // Goal 2 (2B): batch ingestion — one multi-row INSERT for the whole batch
  // instead of one round-trip per event. Accepts an optional transaction
  // `client` (see config/db.js `transaction`); falls back to the pool-level
  // `query` when called outside a transaction.
  static async bulkCreate(rows, client = null) {
    if (!rows || rows.length === 0) return [];

    const runQuery = client ? client.query.bind(client) : query;
    const columns = ['api_key', 'endpoint', 'method', 'status', 'response_time', 'timestamp', 'session_id', 'source'];
    const values = [];

    const rowPlaceholders = rows.map((r, i) => {
      const base = i * columns.length;
      values.push(
        r.apiKey,
        r.endpoint,
        r.method.toUpperCase(),
        r.status,
        r.responseTime,
        r.timestamp || new Date(),
        r.sessionId,
        r.source || 'desktop'
      );
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8})`;
    });

    const sql = `
      INSERT INTO requests (${columns.join(', ')})
      VALUES ${rowPlaceholders.join(', ')}
      RETURNING *
    `;
    const result = await runQuery(sql, values);
    return result.rows;
  }
}

export default Request;