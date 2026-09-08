import dotenv from "dotenv";
import pool, { query } from "../config/db.js";

dotenv.config();

async function addRunExecutionStatus() {
  try {
    console.log("Adding Run execution status...");

    await query(`
      ALTER TABLE sessions
      ADD COLUMN IF NOT EXISTS run_status VARCHAR(20)
      NOT NULL DEFAULT 'completed'
    `);

    await query(`
      UPDATE sessions
      SET run_status = CASE
        WHEN ended_at IS NOT NULL THEN 'completed'
        ELSE 'running'
      END
      WHERE run_status IS NULL
    `);

    await query(`
      ALTER TABLE sessions
      DROP CONSTRAINT IF EXISTS sessions_run_status_check
    `);

    await query(`
      ALTER TABLE sessions
      ADD CONSTRAINT sessions_run_status_check
      CHECK (
        run_status IN (
          'queued',
          'running',
          'analyzing',
          'completed',
          'failed',
          'cancelled'
        )
      )
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_sessions_run_status
      ON sessions(run_status)
    `);

    /*
     * The existing requests.source column originally allowed only:
     * sdk / desktop
     *
     * Backend-generated test execution is a third legitimate source.
     */
    await query(`
      ALTER TABLE requests
      DROP CONSTRAINT IF EXISTS requests_source_check
    `);

    await query(`
      ALTER TABLE requests
      ADD CONSTRAINT requests_source_check
      CHECK (source IN ('sdk', 'desktop', 'test'))
    `);

    console.log("Run execution status migration complete.");

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    await pool.end();
    process.exit(1);
  }
}

addRunExecutionStatus();