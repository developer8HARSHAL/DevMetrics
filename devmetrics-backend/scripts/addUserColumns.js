import dotenv from 'dotenv';
import pool, { query } from '../config/db.js';

dotenv.config();

async function addUserColumns() {
  try {
    console.log('🔧 Adding user columns to api_keys table...\n');

    // Add user_id column (UUID to match Supabase)
    await query(`
      ALTER TABLE api_keys 
      ADD COLUMN IF NOT EXISTS user_id UUID
    `);
    console.log('✅ Added user_id column');

    // Add user_email column
    await query(`
      ALTER TABLE api_keys 
      ADD COLUMN IF NOT EXISTS user_email VARCHAR(255)
    `);
    console.log('✅ Added user_email column');

    // Add index for faster queries
    await query(`
      CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id)
    `);
    console.log('✅ Added index on user_id');

    // Also add user_id to requests table (optional but recommended)
    await query(`
      ALTER TABLE requests 
      ADD COLUMN IF NOT EXISTS user_id UUID
    `);
    console.log('✅ Added user_id to requests table');

    await query(`
      CREATE INDEX IF NOT EXISTS idx_requests_user_id ON requests(user_id)
    `);
    console.log('✅ Added index on requests.user_id');

    // Create trigger to auto-populate user_id in requests
    await query(`
      CREATE OR REPLACE FUNCTION set_request_user_id()
      RETURNS TRIGGER AS $$
      BEGIN
        SELECT user_id INTO NEW.user_id 
        FROM api_keys 
        WHERE key = NEW.api_key;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('✅ Created user_id trigger function');

    await query(`
      DROP TRIGGER IF EXISTS trigger_set_request_user_id ON requests;
    `);
    
    await query(`
      CREATE TRIGGER trigger_set_request_user_id
        BEFORE INSERT ON requests
        FOR EACH ROW
        EXECUTE FUNCTION set_request_user_id();
    `);
    console.log('✅ Created trigger on requests');

    console.log('\n🎉 User columns added successfully!\n');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

addUserColumns();