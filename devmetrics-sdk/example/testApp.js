import { init, track } from '../index.js';

// ⚠️ IMPORTANT: Replace with your actual API key from 'npm run seed'
const API_KEY = 'dm_25c2dfd79cf245f79527364818189809114d4f07026be5f17dc9d8eb7038963c';

// Initialize SDK
init({
  apiKey: API_KEY,
  backendUrl: 'http://localhost:5000',
  trackFetch: false,  // We'll track manually for now
  trackAxios: false
});

console.log('🧪 DevMetrics SDK Test\n');

// Simulate API requests
async function simulateRequests() {
  const testData = [
    { endpoint: '/api/users', method: 'GET', status: 200, responseTime: 45 },
    { endpoint: '/api/posts', method: 'GET', status: 200, responseTime: 67 },
    { endpoint: '/api/users/1', method: 'GET', status: 200, responseTime: 23 },
    { endpoint: '/api/posts/1', method: 'POST', status: 201, responseTime: 120 },
    { endpoint: '/api/users/999', method: 'GET', status: 404, responseTime: 15 },
    { endpoint: '/api/posts', method: 'POST', status: 400, responseTime: 30 },
    { endpoint: '/api/comments', method: 'GET', status: 200, responseTime: 85 },
    { endpoint: '/api/users/1', method: 'PUT', status: 200, responseTime: 95 },
    { endpoint: '/api/posts/1', method: 'DELETE', status: 204, responseTime: 40 },
    { endpoint: '/api/auth/login', method: 'POST', status: 401, responseTime: 50 },
  ];

  console.log(`📊 Tracking ${testData.length} requests...\n`);

  for (let i = 0; i < testData.length; i++) {
    const request = testData[i];
    
    try {
      console.log(`[${i + 1}/${testData.length}] ${request.method} ${request.endpoint} - Status: ${request.status}`);
      
      // Track the request
      await track(request);
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`❌ Error tracking request: ${error.message}`);
    }
  }

  console.log('\n✅ All requests tracked!\n');
  console.log('📈 Check your metrics:');
  console.log('   • Overview:  http://localhost:5000/logs/metrics/overview');
  console.log('   • Recent:    http://localhost:5000/logs/metrics/recent');
  console.log('   • Endpoints: http://localhost:5000/logs/metrics/endpoint');
  console.log('   • Errors:    http://localhost:5000/logs/metrics/errors');
}

// Test with real HTTP requests (optional)
async function testWithRealRequests() {
  console.log('\n🌐 Testing with real HTTP requests...\n');

  const endpoints = [
    'https://jsonplaceholder.typicode.com/posts/1',
    'https://jsonplaceholder.typicode.com/users/1',
    'https://jsonplaceholder.typicode.com/comments?postId=1'
  ];

  for (const url of endpoints) {
    const startTime = Date.now();
    
    try {
      console.log(`📡 Fetching: ${url}`);
      const response = await fetch(url);
      const responseTime = Date.now() - startTime;
      
      // Track this request
      await track({
        endpoint: new URL(url).pathname,
        method: 'GET',
        status: response.status,
        responseTime
      });
      
      console.log(`✅ Status: ${response.status} - ${responseTime}ms\n`);
      
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      await track({
        endpoint: new URL(url).pathname,
        method: 'GET',
        status: 500,
        responseTime
      });
      
      console.log(`❌ Error: ${error.message}\n`);
    }
  }
}

// Run tests
async function runAllTests() {
  try {
    // Test 1: Simulated requests
    await simulateRequests();
    
    // Test 2: Real HTTP requests (optional)
    // Uncomment to test with actual HTTP calls
    // await testWithRealRequests();
    
    console.log('\n🎉 Testing complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

runAllTests();