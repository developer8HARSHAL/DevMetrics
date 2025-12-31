import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { query } from '../config/db.js';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables - try both .env and .env.production
const envPath = process.env.NODE_ENV === "production"
  ? join(__dirname, '..', '.env.production')
  : join(__dirname, '..', '.env');

dotenv.config({ path: envPath });

// Also try loading .env if .env.production doesn't exist
if (process.env.NODE_ENV === "production") {
  dotenv.config({ path: join(__dirname, '..', '.env') });
}

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

async function testDatabaseConnection() {
  console.log('\n📊 Testing Database Connection...\n');
  try {
    const result = await query('SELECT NOW(), version()');
    console.log('✅ Database connection successful!');
    console.log(`   Server time: ${result.rows[0].now}`);
    console.log(`   PostgreSQL version: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}\n`);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed!');
    console.error(`   Error: ${error.message}`);
    if (error.code) {
      console.error(`   Code: ${error.code}`);
    }
    return false;
  }
}

async function testTables() {
  console.log('📋 Checking Database Tables...\n');
  try {
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    const requiredTables = ['api_keys', 'requests'];
    const existingTables = tables.rows.map(row => row.table_name);
    
    console.log('Found tables:');
    tables.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });
    
    const missingTables = requiredTables.filter(t => !existingTables.includes(t));
    
    if (missingTables.length > 0) {
      console.log(`\n⚠️  Missing required tables: ${missingTables.join(', ')}`);
      console.log('   Run: npm run setup\n');
      return false;
    }
    
    console.log('\n✅ All required tables exist!\n');
    return true;
  } catch (error) {
    console.error('❌ Error checking tables:', error.message);
    return false;
  }
}

async function testApiKeysTable() {
  console.log('🔑 Testing API Keys Table...\n');
  try {
    // Check table structure
    const columns = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'api_keys'
      ORDER BY ordinal_position
    `);
    
    console.log('API Keys table columns:');
    columns.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });
    
    // Check if there are any API keys
    const count = await query('SELECT COUNT(*) as count FROM api_keys');
    const keyCount = parseInt(count.rows[0].count);
    
    console.log(`\n   Total API keys: ${keyCount}`);
    
    if (keyCount === 0) {
      console.log('   ⚠️  No API keys found. Run: npm run seed\n');
    } else {
      console.log('   ✅ API keys exist\n');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error testing API keys table:', error.message);
    return false;
  }
}

async function testRequestsTable() {
  console.log('📝 Testing Requests Table...\n');
  try {
    // Check table structure
    const columns = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'requests'
      ORDER BY ordinal_position
    `);
    
    console.log('Requests table columns:');
    columns.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });
    
    // Check if there are any requests
    const count = await query('SELECT COUNT(*) as count FROM requests');
    const requestCount = parseInt(count.rows[0].count);
    
    console.log(`\n   Total requests: ${requestCount}`);
    console.log('   ✅ Requests table is ready\n');
    
    return true;
  } catch (error) {
    console.error('❌ Error testing requests table:', error.message);
    return false;
  }
}

async function testInsertRequest() {
  console.log('🧪 Testing Request Insert...\n');
  try {
    // Get an API key if exists
    const apiKeyResult = await query('SELECT key FROM api_keys LIMIT 1');
    
    if (apiKeyResult.rows.length === 0) {
      console.log('   ⚠️  No API keys found. Skipping insert test.');
      console.log('   Create an API key first: npm run seed\n');
      return true;
    }
    
    const testApiKey = apiKeyResult.rows[0].key;
    
    // Try to insert a test request
    const insertResult = await query(`
      INSERT INTO requests (api_key, endpoint, method, status, response_time, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [
      testApiKey,
      '/test/endpoint',
      'GET',
      200,
      50,
      new Date()
    ]);
    
    console.log(`   ✅ Successfully inserted test request (ID: ${insertResult.rows[0].id})`);
    
    // Clean up test request
    await query('DELETE FROM requests WHERE endpoint = $1', ['/test/endpoint']);
    console.log('   ✅ Test request cleaned up\n');
    
    return true;
  } catch (error) {
    console.error('❌ Error testing request insert:', error.message);
    if (error.detail) {
      console.error(`   Detail: ${error.detail}`);
    }
    return false;
  }
}

async function testEnvironmentVariables() {
  console.log('🔧 Checking Environment Variables...\n');
  
  const required = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
  const missing = [];
  
  required.forEach(key => {
    if (!process.env[key]) {
      missing.push(key);
      console.log(`   ❌ ${key}: MISSING`);
    } else {
      const value = key === 'DB_PASSWORD' ? '***' : process.env[key];
      console.log(`   ✅ ${key}: ${value}`);
    }
  });
  
  if (missing.length > 0) {
    console.log(`\n   ⚠️  Missing environment variables: ${missing.join(', ')}`);
    console.log('   Create a .env or .env.production file\n');
    return false;
  }
  
  console.log('\n✅ All required environment variables are set!\n');
  return true;
}

async function runAllTests() {
  console.log('🚀 Starting Backend Tests\n');
  console.log('='.repeat(50));
  
  const results = {
    environment: await testEnvironmentVariables(),
    database: await testDatabaseConnection(),
    tables: false,
    apiKeys: false,
    requests: false,
    insert: false
  };
  
  if (results.database) {
    results.tables = await testTables();
    if (results.tables) {
      results.apiKeys = await testApiKeysTable();
      results.requests = await testRequestsTable();
      results.insert = await testInsertRequest();
    }
  }
  
  console.log('='.repeat(50));
  console.log('\n📊 Test Results Summary:\n');
  
  const allPassed = Object.values(results).every(r => r === true);
  
  Object.entries(results).forEach(([test, passed]) => {
    const icon = passed ? '✅' : '❌';
    const status = passed ? 'PASS' : 'FAIL';
    console.log(`   ${icon} ${test.padEnd(15)} ${status}`);
  });
  
  console.log('\n' + '='.repeat(50));
  
  if (allPassed) {
    console.log('\n🎉 All tests passed! Backend is ready to use.\n');
    console.log('Next steps:');
    console.log('   1. Start the server: npm start');
    console.log('   2. Test endpoints: GET http://localhost:5000/health');
    console.log('   3. Create API key: npm run seed');
  } else {
    console.log('\n⚠️  Some tests failed. Please fix the issues above.\n');
    process.exit(1);
  }
}

runAllTests().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

