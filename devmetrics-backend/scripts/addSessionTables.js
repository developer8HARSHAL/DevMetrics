import dotenv from 'dotenv';
import pool, { query } from '../config/db.js';

dotenv.config();

async function addSessionTables() {
  try {
    console.log('🔧 Adding session/run tables to database...\n');

    // ── Stage 1: sessions table (Run lifecycle + metadata) ──────────────
    await query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        api_key VARCHAR(255) REFERENCES api_keys(key),
        user_id UUID,
        name TEXT,
        hostname TEXT,
        started_at TIMESTAMPTZ DEFAULT now(),
        ended_at TIMESTAMPTZ,
        share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex')
      )
    `);
    console.log('✅ Created sessions table');

    await query(`
      CREATE INDEX IF NOT EXISTS idx_sessions_api_key ON sessions(api_key)
    `);
    console.log('✅ Added index on sessions.api_key');

    await query(`
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)
    `);
    console.log('✅ Added index on sessions.user_id');

    // ── Stage 2: trigger to auto-populate sessions.user_id ───────────────
    // Mirrors the set_request_user_id trigger convention from addUserColumns.js
    await query(`
      CREATE OR REPLACE FUNCTION set_session_user_id()
      RETURNS TRIGGER AS $$
      BEGIN
        SELECT user_id INTO NEW.user_id
        FROM api_keys
        WHERE key = NEW.api_key;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('✅ Created set_session_user_id trigger function');

    await query(`
      DROP TRIGGER IF EXISTS trigger_set_session_user_id ON sessions;
    `);

    await query(`
      CREATE TRIGGER trigger_set_session_user_id
        BEFORE INSERT ON sessions
        FOR EACH ROW
        EXECUTE FUNCTION set_session_user_id();
    `);
    console.log('✅ Created trigger on sessions');

    // ── Stage 3: extend requests (additive only, requests.id stays SERIAL) ─
    await query(`
      ALTER TABLE requests
      ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES sessions(id)
    `);
    console.log('✅ Added session_id column to requests table');

    await query(`
      ALTER TABLE requests
      ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'sdk' CHECK (source IN ('sdk', 'desktop'))
    `);
    console.log('✅ Added source column to requests table');

    await query(`
      CREATE INDEX IF NOT EXISTS idx_requests_session_id ON requests(session_id)
    `);
    console.log('✅ Added index on requests.session_id');

    // ── Stage 4: run_findings (persisted analysis output) ───────────────
    await query(`
      CREATE TABLE IF NOT EXISTS run_findings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        endpoint TEXT,
        severity TEXT NOT NULL,
        occurrences INT DEFAULT 1,
        meta JSONB,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `);
    console.log('✅ Created run_findings table');

    await query(`
      CREATE INDEX IF NOT EXISTS idx_run_findings_session_id ON run_findings(session_id)
    `);
    console.log('✅ Added index on run_findings.session_id');

    console.log('\n🎉 Session/run tables added successfully!\n');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

addSessionTables();