import crypto from "crypto";
import { query } from "../config/db.js";

class ApiKey {
  static generateKey() {
    return 'dm_' + crypto.randomBytes(32).toString('hex');
  }

  static async create({ key, owner, description = '', status = 'active', requestsPerHour = 10000, requestsPerDay = 100000, expiresAt = null, userId = null, userEmail = null }) {
    const sql = `
      INSERT INTO api_keys (key, owner, description, status, requests_per_hour, requests_per_day, expires_at, user_id, user_email)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const values = [key, owner, description, status, requestsPerHour, requestsPerDay, expiresAt, userId, userEmail];
    const result = await query(sql, values);
    return result.rows[0];
  }

  static async findByKey(key) {
    const sql = 'SELECT * FROM api_keys WHERE key = $1';
    const result = await query(sql, [key]);
    return result.rows[0] || null;
  }

  static async findOne(filter) {
    if (filter.key) {
      const sql = 'SELECT * FROM api_keys WHERE key = $1';
      const result = await query(sql, [filter.key]);
      return result.rows[0] || null;
    }
    if (filter.user_id) {
      const sql = 'SELECT * FROM api_keys WHERE user_id = $1';
      const result = await query(sql, [filter.user_id]);
      return result.rows[0] || null;
    }
    return null;
  }

  static async find(filters = {}, options = {}) {
    const { status, owner } = filters;
    const { limit = 50, offset = 0 } = options;
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (status) {
      conditions.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (owner) {
      conditions.push(`owner = $${paramCount++}`);
      values.push(owner);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT * FROM api_keys ${whereClause} ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);
    
    const result = await query(sql, values);
    return result.rows;
  }

  static async countDocuments(filter = {}) {
    const { status, owner } = filter;
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (status) {
      conditions.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (owner) {
      conditions.push(`owner = $${paramCount++}`);
      values.push(owner);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT COUNT(*) as count FROM api_keys ${whereClause}`;
    const result = await query(sql, values);
    return parseInt(result.rows[0].count);
  }

  static async findOneAndUpdate(filter, update, options = {}) {
    const sql = `UPDATE api_keys SET status = $1 WHERE key = $2 RETURNING *`;
    const result = await query(sql, [update.status, filter.key]);
    return result.rows[0] || null;
  }

  static async deleteOne(filter) {
    const sql = `DELETE FROM api_keys WHERE key = $1`;
    const result = await query(sql, [filter.key]);
    return { deletedCount: result.rowCount };
  }

  static isValid(apiKeyData) {
    if (apiKeyData.status !== 'active') return false;
    if (apiKeyData.expires_at && new Date(apiKeyData.expires_at) < new Date()) return false;
    return true;
  }

  static async incrementUsage(key) {
    const sql = `UPDATE api_keys SET usage_count = usage_count + 1, last_used_at = CURRENT_TIMESTAMP WHERE key = $1 RETURNING *`;
    const result = await query(sql, [key]);
    return result.rows[0];
  }
}

export default ApiKey;