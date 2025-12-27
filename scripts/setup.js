import dotenv from 'dotenv';
import pg from 'pg';
dotenv.config();

const { Client } = pg;

const schema = `
CREATE TABLE IF NOT EXISTS api_keys (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    owner VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'revoked')),
    usage_count INTEGER DEFAULT 0,
    requests_per_hour INTEGER DEFAULT 10000,
    requests_per_day INTEGER DEFAULT 100000,
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(key);
CREATE INDEX IF NOT EXISTS idx_api_keys_status ON api_keys(status);

CREATE TABLE IF NOT EXISTS requests (
    id SERIAL PRIMARY KEY,
    api_key VARCHAR(255) NOT NULL,
    endpoint VARCHAR(500) NOT NULL,
    method VARCHAR(10) NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD')),
    status INTEGER NOT NULL CHECK (status >= 100 AND status <= 599),
    response_time INTEGER NOT NULL CHECK (response_time >= 0),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_requests_api_key ON requests(api_key);
CREATE INDEX IF NOT EXISTS idx_requests_endpoint ON requests(endpoint);
CREATE INDEX IF NOT EXISTS idx_requests_timestamp ON requests(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_api_key_timestamp ON requests(api_key, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_requests_endpoint_timestamp ON requests(endpoint, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_requests_status_timestamp ON requests(status, timestamp DESC);
`;

async function setup() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: 'postgres'
  });

  try {
    console.log('🔌 Connecting to PostgreSQL...');
    await client.connect();
    
    const dbName = process.env.DB_NAME || 'Devmetrics';
    
    // Create database
    try {
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Database '${dbName}' created`);
    } catch (err) {
      if (err.code === '42P04') {
        console.log(`✅ Database '${dbName}' already exists`);
      } else {
        throw err;
      }
    }
    
    await client.end();

    // Create tables
    const dbClient = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      database: dbName
    });

    console.log(`🔌 Connecting to ${dbName}...`);
    await dbClient.connect();
    console.log('📋 Creating tables...');
    await dbClient.query(schema);
    await dbClient.end();

    console.log('✅ Setup complete!\n');
    console.log('Next: npm run seed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setup();