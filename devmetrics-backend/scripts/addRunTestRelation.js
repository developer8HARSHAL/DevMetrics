import { query } from "../config/db.js";

async function addRunTestRelation() {
  try {
    await query(`
      ALTER TABLE sessions
      ADD COLUMN IF NOT EXISTS test_id UUID
      REFERENCES tests(id)
      ON DELETE SET NULL;
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_sessions_test_id
      ON sessions(test_id);
    `);

    console.log("sessions.test_id relation added successfully");
  } catch (error) {
    console.error("Failed to add sessions.test_id:", error);
    process.exitCode = 1;
  }
}

addRunTestRelation();