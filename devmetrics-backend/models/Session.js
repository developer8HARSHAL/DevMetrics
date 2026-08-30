import { query } from "../config/db.js";

// "Session" is the DB/internal term for what the product calls a "Run".
class Session {
  static async create({ apiKey, name = null, hostname = null }) {
    const sql = `
      INSERT INTO sessions (api_key, name, hostname)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const result = await query(sql, [apiKey, name, hostname]);
    return result.rows[0];
  }

  static async end(id) {
    const sql = `
      UPDATE sessions
      SET ended_at = now()
      WHERE id = $1
      RETURNING *
    `;

    const result = await query(sql, [id]);
    return result.rows[0] || null;
  }

  static async findById(id) {
    const sql = `
      SELECT *
      FROM sessions
      WHERE id = $1
    `;

    const result = await query(sql, [id]);
    return result.rows[0] || null;
  }

  static async findByApiKeyWithStats(apiKey) {
    const sql = `
      SELECT
        s.id,
        s.name,
        s.hostname,
        s.started_at,
        s.ended_at,

        CASE
          WHEN s.ended_at IS NOT NULL
          THEN CAST(
            EXTRACT(EPOCH FROM (s.ended_at - s.started_at)) * 1000
            AS DOUBLE PRECISION
          )
          ELSE NULL
        END AS duration_ms,

        COALESCE(r.request_count, 0) AS request_count,
        COALESCE(r.error_count, 0) AS error_count,
        COALESCE(f.finding_count, 0) AS finding_count,
        f.highest_severity

      FROM sessions s

      LEFT JOIN LATERAL (
        SELECT
          COUNT(*) AS request_count,
          COUNT(*) FILTER (WHERE status >= 400) AS error_count
        FROM requests
        WHERE requests.session_id = s.id
      ) r ON true

      LEFT JOIN LATERAL (
        SELECT
          COUNT(*) AS finding_count,
          (
            ARRAY_AGG(
              severity
              ORDER BY
                CASE severity
                  WHEN 'critical' THEN 1
                  WHEN 'warning' THEN 2
                  WHEN 'info' THEN 3
                  ELSE 4
                END
            )
          )[1] AS highest_severity
        FROM run_findings
        WHERE run_findings.session_id = s.id
      ) f ON true

      WHERE s.api_key = $1
      ORDER BY s.started_at DESC
    `;

    const result = await query(sql, [apiKey]);
    return result.rows;
  }

  static async findByShareToken(token) {
    const sql = `
      SELECT *
      FROM sessions
      WHERE share_token = $1
    `;

    const result = await query(sql, [token]);
    return result.rows[0] || null;
  }
}

export default Session;