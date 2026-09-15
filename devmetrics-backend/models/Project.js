import { query } from "../config/db.js";

class Project {
  static async create({ apiKey, name, description = "" }) {
    const sql = `
      INSERT INTO projects (
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
        FROM projects
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
        FROM projects
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
          p.id,
          p.name,
          p.description,
          p.created_at,
          p.updated_at,
          COUNT(t.id)::INTEGER AS test_count
        FROM projects p
        LEFT JOIN tests t
          ON t.project_id = p.id
        WHERE p.api_key = $1
        GROUP BY
          p.id,
          p.name,
          p.description,
          p.created_at,
          p.updated_at
        ORDER BY p.updated_at DESC
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
        UPDATE projects
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
        DELETE FROM projects
        WHERE id = $1
          AND api_key = $2
        RETURNING id
      `,
      [id, apiKey]
    );

    return result.rows[0] || null;
  }


  
}

export default Project;