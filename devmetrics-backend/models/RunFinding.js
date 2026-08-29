import { query } from "../config/db.js";

// Persisted output of services/analysis.js — computed once when a Run ends
// (PATCH /sessions/:id/end), not recomputed on every dashboard view.
class RunFinding {
  static async bulkCreate(sessionId, findings) {
    if (!findings || findings.length === 0) return [];

    const columns = ['session_id', 'type', 'endpoint', 'severity', 'occurrences', 'meta'];
    const values = [];

    const rowPlaceholders = findings.map((f, i) => {
      const base = i * columns.length;
      values.push(
        sessionId,
        f.type,
        f.endpoint || null,
        f.severity,
        f.occurrences || 1,
        f.meta ? JSON.stringify(f.meta) : null
      );
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`;
    });

    const sql = `
      INSERT INTO run_findings (${columns.join(', ')})
      VALUES ${rowPlaceholders.join(', ')}
      RETURNING *
    `;
    const result = await query(sql, values);
    return result.rows;
  }

  static async findBySessionId(sessionId) {
    const sql = `
      SELECT * FROM run_findings
      WHERE session_id = $1
      ORDER BY
        CASE severity WHEN 'critical' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END,
        created_at ASC
    `;
    const result = await query(sql, [sessionId]);
    return result.rows;
  }
}

export default RunFinding;