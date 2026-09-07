import { query } from "../config/db.js";

// "Session" is the DB/internal term for what the product calls a "Run".
class Session {
 static async create({
  apiKey,
  name = null,
  hostname = null,
  testId = null,
}) {
  const sql = `
    INSERT INTO sessions (
      api_key,
      name,
      hostname,
      test_id,
      run_status
    )
    VALUES ($1, $2, $3, $4, 'queued')
    RETURNING *
  `;

  const result = await query(sql, [
    apiKey,
    name,
    hostname,
    testId,
  ]);

  return result.rows[0];
}

static async updateStatus(id, runStatus) {
  const sql = `
    UPDATE sessions
    SET
      run_status = $2::VARCHAR(20),
      ended_at = CASE
        WHEN $2::VARCHAR(20) IN (
          'completed',
          'failed',
          'cancelled'
        )
        THEN COALESCE(ended_at, now())
        ELSE ended_at
      END
    WHERE id = $1
    RETURNING *
  `;

  const result = await query(sql, [
    id,
    runStatus
  ]);

  return result.rows[0] || null;
}

  static async end(id) {
    const sql = `
      UPDATE sessions
      SET
        ended_at = COALESCE(ended_at, now()),
        run_status = 'completed'
      WHERE id = $1
      RETURNING *
    `;

    const result = await query(sql, [id]);
    return result.rows[0] || null;
  }

  static async fail(id) {
    const sql = `
      UPDATE sessions
      SET
        ended_at = COALESCE(ended_at, now()),
        run_status = 'failed'
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
        s.run_status,

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


  static async findByTestId(testId) {
  const sql = `
    SELECT
      s.id,
      s.name,
      s.hostname,
      s.test_id,
      s.run_status,
      s.started_at,
      s.ended_at,
      s.share_token,

      COALESCE(COUNT(r.id), 0)::int AS request_count,

      COALESCE(
        COUNT(r.id) FILTER (WHERE r.status >= 400),
        0
      )::int AS error_count,

      COALESCE(
        AVG(r.response_time),
        0
      )::float AS avg_response_time,

      COALESCE(
        COUNT(f.id),
        0
      )::int AS finding_count

    FROM sessions s

    LEFT JOIN requests r
      ON r.session_id = s.id

    LEFT JOIN run_findings f
      ON f.session_id = s.id

    WHERE s.test_id = $1

    GROUP BY s.id

    ORDER BY s.started_at DESC
  `;

  const result = await query(sql, [testId]);
  return result.rows;
}
static async findByTestId(testId) {
  const sql = `
    SELECT
      s.id,
      s.name,
      s.test_id,
      s.run_status,
      s.started_at,
      s.ended_at,
      COUNT(DISTINCT r.id)::int AS request_count,
      COUNT(DISTINCT r.id) FILTER (WHERE r.status >= 400)::int AS error_count,
      COALESCE(AVG(r.response_time), 0)::float AS avg_response_time,
      COUNT(DISTINCT f.id)::int AS finding_count
    FROM sessions s
    LEFT JOIN requests r ON r.session_id = s.id
    LEFT JOIN run_findings f ON f.session_id = s.id
    WHERE s.test_id = $1
    GROUP BY s.id
    ORDER BY s.started_at DESC
  `;
  const result = await query(sql, [testId]);
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