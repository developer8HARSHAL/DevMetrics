import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import pg from 'pg';

// Load production environment
dotenv.config({ path: '.env.production.backup' });

const { Pool } = pg;
const app = express();
const PORT = 5001; // Different port so it doesn't conflict

// Create production pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
});

app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW(), COUNT(*) as api_keys FROM api_keys');
    res.json({
      status: 'ok',
      database: 'Supabase PostgreSQL',
      connection: 'success',
      timestamp: result.rows[0].now,
      api_keys_count: result.rows[0].api_keys
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Test API key creation
app.post('/test/create-key', async (req, res) => {
  try {
    const key = 'dm_test_' + Math.random().toString(36).substr(2, 9);
    await pool.query(
      `INSERT INTO api_keys (key, owner, description, status, user_id, user_email) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [key, 'test-user', 'Test key', 'active', null, 'test@example.com']
    );
    res.json({ success: true, key });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test request tracking
app.post('/test/track', async (req, res) => {
  try {
    await pool.query(
      `INSERT INTO requests (api_key, endpoint, method, status, response_time) 
       VALUES ($1, $2, $3, $4, $5)`,
      ['test-key', '/api/test', 'GET', 200, 50]
    );
    res.json({ success: true, message: 'Request tracked' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

async function startTestServer() {
  try {
    console.log('🧪 Starting Production Database Test Server\n');
    console.log('Configuration:');
    console.log(`  Database: ${process.env.DB_HOST}`);
    console.log(`  Port: ${process.env.DB_PORT}`);
    console.log(`  User: ${process.env.DB_USER}\n`);

    // Test connection
    await pool.query('SELECT 1');
    console.log('✅ Connected to Supabase PostgreSQL\n');

    app.listen(PORT, () => {
      console.log(`✅ Test server running on http://localhost:${PORT}\n`);
      console.log('Test these endpoints:');
      console.log(`  GET  http://localhost:${PORT}/health`);
      console.log(`  POST http://localhost:${PORT}/test/create-key`);
      console.log(`  POST http://localhost:${PORT}/test/track\n`);
      console.log('Press Ctrl+C to stop');
    });
  } catch (error) {
    console.error('❌ Failed to start:', error.message);
    process.exit(1);
  }
}

startTestServer();