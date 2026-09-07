import dotenv from "dotenv";
import pool, { query } from "../config/db.js";

dotenv.config();

async function addTestTables() {
  try {
    console.log("Adding Test/TestRequest tables...");

    await query(`
      CREATE TABLE IF NOT EXISTS tests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        api_key VARCHAR(255) NOT NULL
          REFERENCES api_keys(key)
          ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      )
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_tests_api_key
      ON tests(api_key)
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS test_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        test_id UUID NOT NULL
          REFERENCES tests(id)
          ON DELETE CASCADE,
        position INTEGER NOT NULL DEFAULT 0,
        method VARCHAR(10) NOT NULL
          CHECK (
            method IN (
              'GET',
              'POST',
              'PUT',
              'PATCH',
              'DELETE',
              'OPTIONS',
              'HEAD'
            )
          ),
        url TEXT NOT NULL,
        headers JSONB NOT NULL DEFAULT '{}'::jsonb,
        body JSONB,
        timeout_ms INTEGER NOT NULL DEFAULT 5000
          CHECK (timeout_ms > 0),
        expected_status INTEGER
          CHECK (
            expected_status IS NULL
            OR (expected_status >= 100 AND expected_status <= 599)
          ),
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now(),

        UNIQUE (test_id, position)
      )
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_test_requests_test_id
      ON test_requests(test_id)
    `);

    console.log("Test/TestRequest tables created successfully.");

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("Failed to create Test/TestRequest tables:");
    console.error(error);
    await pool.end();
    process.exit(1);
  }
}

addTestTables();