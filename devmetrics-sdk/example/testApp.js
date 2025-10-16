import { init, track } from '../index.js';

console.log('🚀 Initializing DevMetrics SDK...\n');

init({
  apiKey: 'test-api-key-12345',
  backendUrl: 'http://localhost:5000',
  trackFetch: true,
  trackAxios: false,
});

console.log('\n📊 Testing SDK functionality...\n');

console.log('Test 1: Manual tracking');
await track({
  endpoint: 'https://api.example.com/users',
  method: 'GET',
  status: 200,
  responseTime: 150,
});
console.log('✅ Manual track sent\n');

console.log('Test 2: Auto-tracked fetch (success)');
try {
  const response = await fetch('https://jsonplaceholder.typicode.com/posts/1');
  const data = await response.json();
  console.log('✅ Fetch successful, should be auto-tracked\n');
} catch (err) {
  console.error('❌ Fetch failed:', err.message);
}

console.log('Test 3: Auto-tracked fetch (different endpoint)');
try {
  const response = await fetch('https://jsonplaceholder.typicode.com/users/1');
  const data = await response.json();
  console.log('✅ Fetch successful, should be auto-tracked\n');
} catch (err) {
  console.error('❌ Fetch failed:', err.message);
}

console.log('🎉 All tests completed! Check your backend logs/database.\n');
