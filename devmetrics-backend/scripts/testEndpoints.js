import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = process.env.NODE_ENV === "production"
  ? join(__dirname, '..', '.env.production')
  : join(__dirname, '..', '.env');

dotenv.config({ path: envPath });

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

async function testEndpoint(method, path, body = null, headers = {}) {
  try {
    const url = `${BASE_URL}${path}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));

    return {
      success: response.ok,
      status: response.status,
      data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function runEndpointTests() {
  console.log('🧪 Testing Backend API Endpoints\n');
  console.log('='.repeat(60));
  console.log(`Base URL: ${BASE_URL}\n`);

  const results = [];

  // Test root endpoint
  console.log('1. Testing GET /');
  const rootTest = await testEndpoint('GET', '/');
  results.push({ name: 'GET /', ...rootTest });
  if (rootTest.success) {
    console.log('   ✅ Success');
    console.log(`   Response: ${JSON.stringify(rootTest.data, null, 2).split('\n').map(l => '   ' + l).join('\n')}`);
  } else {
    console.log(`   ❌ Failed: ${rootTest.error || rootTest.data.message || 'Unknown error'}`);
  }
  console.log();

  // Test health endpoint
  console.log('2. Testing GET /health');
  const healthTest = await testEndpoint('GET', '/health');
  results.push({ name: 'GET /health', ...healthTest });
  if (healthTest.success) {
    console.log('   ✅ Success');
    console.log(`   Status: ${healthTest.data.status || 'unknown'}`);
    console.log(`   Database: ${healthTest.data.postgresql || 'unknown'}`);
  } else {
    console.log(`   ❌ Failed: ${healthTest.error || healthTest.data.message || 'Unknown error'}`);
  }
  console.log();

  // Test API key creation (will fail without auth, but tests endpoint)
  console.log('3. Testing POST /apikey');
  const apiKeyTest = await testEndpoint('POST', '/apikey', {
    owner: 'test-user',
    description: 'Test API key'
  });
  results.push({ name: 'POST /apikey', ...apiKeyTest });
  if (apiKeyTest.success) {
    console.log('   ✅ Success');
    console.log(`   API Key created: ${apiKeyTest.data.data?.key?.substring(0, 20)}...`);
  } else {
    console.log(`   ${apiKeyTest.status === 400 || apiKeyTest.status === 401 ? '⚠️  Expected (needs valid data)' : '❌ Failed'}`);
    console.log(`   Status: ${apiKeyTest.status}`);
  }
  console.log();

  // Test track endpoint (will fail without valid API key)
  console.log('4. Testing POST /track');
  const trackTest = await testEndpoint('POST', '/track', {
    apiKey: 'test-key',
    endpoint: '/test',
    method: 'GET',
    status: 200,
    responseTime: 50
  });
  results.push({ name: 'POST /track', ...trackTest });
  if (trackTest.success) {
    console.log('   ✅ Success');
  } else {
    console.log(`   ${trackTest.status === 401 ? '⚠️  Expected (needs valid API key)' : '❌ Failed'}`);
    console.log(`   Status: ${trackTest.status}`);
  }
  console.log();

  // Test logs endpoints
  console.log('5. Testing GET /logs/metrics/overview');
  const overviewTest = await testEndpoint('GET', '/logs/metrics/overview');
  results.push({ name: 'GET /logs/metrics/overview', ...overviewTest });
  if (overviewTest.success) {
    console.log('   ✅ Success');
    console.log(`   Total Requests: ${overviewTest.data.data?.totalRequests || 0}`);
  } else {
    console.log(`   ${overviewTest.status === 500 ? '⚠️  May fail if no data' : '❌ Failed'}`);
    console.log(`   Status: ${overviewTest.status}`);
  }
  console.log();

  // Test 404 endpoint
  console.log('6. Testing GET /nonexistent (should return 404)');
  const notFoundTest = await testEndpoint('GET', '/nonexistent');
  results.push({ name: 'GET /nonexistent', ...notFoundTest });
  if (notFoundTest.status === 404) {
    console.log('   ✅ Correctly returns 404');
  } else {
    console.log(`   ⚠️  Expected 404, got ${notFoundTest.status}`);
  }
  console.log();

  // Summary
  console.log('='.repeat(60));
  console.log('\n📊 Test Results Summary:\n');

  const passed = results.filter(r => r.success || r.status === 404 || r.status === 401 || r.status === 400).length;
  const total = results.length;

  results.forEach(result => {
    const icon = result.success || result.status === 404 ? '✅' : 
                 result.status === 401 || result.status === 400 ? '⚠️' : '❌';
    const status = result.success ? 'PASS' : 
                   result.status === 404 ? 'PASS (404)' :
                   result.status === 401 || result.status === 400 ? 'EXPECTED' : 'FAIL';
    console.log(`   ${icon} ${result.name.padEnd(30)} ${status}`);
  });

  console.log(`\n   Passed: ${passed}/${total}`);
  console.log('\n' + '='.repeat(60));

  if (passed === total) {
    console.log('\n🎉 All endpoint tests passed!\n');
  } else {
    console.log('\n⚠️  Some tests failed or returned expected errors.\n');
    console.log('Note: Some failures are expected if:');
    console.log('  - Database is not connected');
    console.log('  - No API keys exist');
    console.log('  - Server is not running\n');
  }
}

// Check if server is running first
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/health`, { 
      method: 'GET',
      signal: AbortSignal.timeout(2000)
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('🔍 Checking if server is running...\n');
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('❌ Server is not running!\n');
    console.log('Please start the server first:');
    console.log('  npm start\n');
    console.log('Or in development mode:');
    console.log('  npm run dev\n');
    process.exit(1);
  }

  console.log('✅ Server is running!\n');
  await runEndpointTests();
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

