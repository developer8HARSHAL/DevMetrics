import { query } from "../config/db.js";

class TestRequest {
  static async create({
    testId,
    position = 0,
    method,
    url,
    headers = {},
    body = null,
    timeoutMs = 5000,
    expectedStatus = null,
  }) {
    const result = await query(
      `
        INSERT INTO test_requests (
          test_id,
          position,
          method,
          url,
          headers,
          body,
          timeout_ms,
          expected_status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `,
      [
        testId,
        position,
        method.toUpperCase(),
        url,
        JSON.stringify(headers),
        body === null ? null : JSON.stringify(body),
        timeoutMs,
        expectedStatus,
      ]
    );

    return result.rows[0];
  }

  static async findById(id) {
    const result = await query(
      `
        SELECT *
        FROM test_requests
        WHERE id = $1
      `,
      [id]
    );

    return result.rows[0] || null;
  }

  static async findByIdForTest(id, testId) {
    const result = await query(
      `
        SELECT *
        FROM test_requests
        WHERE id = $1
          AND test_id = $2
      `,
      [id, testId]
    );

    return result.rows[0] || null;
  }

  static async findByTestId(testId) {
    const result = await query(
      `
        SELECT *
        FROM test_requests
        WHERE test_id = $1
        ORDER BY position ASC, created_at ASC
      `,
      [testId]
    );

    return result.rows;
  }

  static async update(
    id,
    testId,
    {
      position,
      method,
      url,
      headers,
      body,
      timeoutMs,
      expectedStatus,
    }
  ) {
    const fields = [];
    const values = [];
    let parameter = 1;

    if (position !== undefined) {
      fields.push(`position = $${parameter++}`);
      values.push(position);
    }

    if (method !== undefined) {
      fields.push(`method = $${parameter++}`);
      values.push(method.toUpperCase());
    }

    if (url !== undefined) {
      fields.push(`url = $${parameter++}`);
      values.push(url);
    }

    if (headers !== undefined) {
      fields.push(`headers = $${parameter++}`);
      values.push(JSON.stringify(headers));
    }

    if (body !== undefined) {
      fields.push(`body = $${parameter++}`);
      values.push(body === null ? null : JSON.stringify(body));
    }

    if (timeoutMs !== undefined) {
      fields.push(`timeout_ms = $${parameter++}`);
      values.push(timeoutMs);
    }

    if (expectedStatus !== undefined) {
      fields.push(`expected_status = $${parameter++}`);
      values.push(expectedStatus);
    }

    if (fields.length === 0) {
      return null;
    }

    fields.push("updated_at = now()");

    values.push(id);
    values.push(testId);

    const result = await query(
      `
        UPDATE test_requests
        SET ${fields.join(", ")}
        WHERE id = $${parameter++}
          AND test_id = $${parameter}
        RETURNING *
      `,
      values
    );

    return result.rows[0] || null;
  }

  static async delete(id, testId) {
    const result = await query(
      `
        DELETE FROM test_requests
        WHERE id = $1
          AND test_id = $2
        RETURNING id
      `,
      [id, testId]
    );

    return result.rows[0] || null;
  }
}

export default TestRequest;