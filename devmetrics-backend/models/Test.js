import { query } from "../config/db.js";

class Test {
  static async create({ apiKey, name, description = "" }) {
    const sql = `
      INSERT INTO tests (
        api_key,
        name,
        description
      )
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const result = await query(sql, [
      apiKey,
      name,
      description,
    ]);

    return result.rows[0];
  }

  static async findById(id) {
    const result = await query(
      `
        SELECT *
        FROM tests
        WHERE id = $1
      `,
      [id]
    );

    return result.rows[0] || null;
  }

  static async findByIdForApiKey(id, apiKey) {
    const result = await query(
      `
        SELECT *
        FROM tests
        WHERE id = $1
          AND api_key = $2
      `,
      [id, apiKey]
    );

    return result.rows[0] || null;
  }

  static async findAllByApiKey(apiKey) {
    const result = await query(
      `
        SELECT
          t.id,
          t.name,
          t.description,
          t.created_at,
          t.updated_at,
          COUNT(tr.id)::INTEGER AS request_count
        FROM tests t
        LEFT JOIN test_requests tr
          ON tr.test_id = t.id
        WHERE t.api_key = $1
        GROUP BY
          t.id,
          t.name,
          t.description,
          t.created_at,
          t.updated_at
        ORDER BY t.updated_at DESC
      `,
      [apiKey]
    );

    return result.rows;
  }

  static async update(id, apiKey, { name, description }) {
    const fields = [];
    const values = [];
    let parameter = 1;

    if (name !== undefined) {
      fields.push(`name = $${parameter++}`);
      values.push(name);
    }

    if (description !== undefined) {
      fields.push(`description = $${parameter++}`);
      values.push(description);
    }

    if (fields.length === 0) {
      return null;
    }

    fields.push("updated_at = now()");

    values.push(id);
    values.push(apiKey);

    const result = await query(
      `
        UPDATE tests
        SET ${fields.join(", ")}
        WHERE id = $${parameter++}
          AND api_key = $${parameter}
        RETURNING *
      `,
      values
    );

    return result.rows[0] || null;
  }

  static async delete(id, apiKey) {
    const result = await query(
      `
        DELETE FROM tests
        WHERE id = $1
          AND api_key = $2
        RETURNING id
      `,
      [id, apiKey]
    );

    return result.rows[0] || null;
  }
}

export default Test;