import dotenv from 'dotenv';
import pg from 'pg';

// Load production env
dotenv.config({ path: '.env.production' });

const { Client } = pg;

async function testConnection() {
  console.log('🧪 Testing Supabase PostgreSQL Connection\n');
  console.log('Configuration:');
  console.log(`  Host: ${process.env.DB_HOST}`);
  console.log(`  Port: ${process.env.DB_PORT}`);
  console.log(`  Database: ${process.env.DB_NAME}`);
  console.log(`  User: ${process.env.DB_USER}`);
  console.log(`  Password: ${process.env.DB_PASSWORD ? '***' : 'MISSING!'}\n`);

  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Connecting...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Test query
    console.log('📊 Testing query...');
    const result = await client.query('SELECT NOW(), version()');
    console.log('✅ Query successful!');
    console.log(`  Server time: ${result.rows[0].now}`);
    console.log(`  PostgreSQL version: ${result.rows[0].version}\n`);

    // Check if tables exist
    console.log('📋 Checking existing tables...');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    if (tables.rows.length === 0) {
      console.log('⚠️  No tables found - run setupProduction.js to create them\n');
    } else {
      console.log('✅ Found tables:');
      tables.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
      console.log();
    }

    await client.end();
    console.log('🎉 All tests passed!\n');
    console.log('Next steps:');
    console.log('  1. If no tables: run `node scripts/setupProduction.js`');
    console.log('  2. Update backend to use .env.production');
    console.log('  3. Test backend with production database');
    
  } catch (error) {
    console.error('❌ Connection failed!\n');
    console.error('Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('  1. Check your .env.production file has correct credentials');
    console.error('  2. Verify Supabase project is active');
    console.error('  3. Check firewall/network settings');
    console.error('  4. Ensure connection pooling is enabled in Supabase');
    process.exit(1);
  }
}

testConnection();