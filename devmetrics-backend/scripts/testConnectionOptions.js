import dotenv from 'dotenv';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment
dotenv.config({ path: join(__dirname, '..', '.env.production') });

const { Client } = pg;

async function testConnection(config, name) {
  console.log(`\n🧪 Testing: ${name}`);
  console.log(`   Host: ${config.host}`);
  console.log(`   SSL: ${config.ssl ? JSON.stringify(config.ssl) : 'false'}`);
  
  const client = new Client(config);
  
  try {
    await client.connect();
    const result = await client.query('SELECT NOW()');
    console.log(`   ✅ SUCCESS! Connected at ${result.rows[0].now}`);
    await client.end();
    return true;
  } catch (error) {
    console.log(`   ❌ FAILED: ${error.message}`);
    if (error.code) {
      console.log(`   Code: ${error.code}`);
    }
    return false;
  }
}

async function runTests() {
  console.log('🔍 Testing Different Connection Configurations\n');
  console.log('='.repeat(60));
  
  const baseConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  };
  
  const configs = [
    {
      ...baseConfig,
      ssl: { rejectUnauthorized: false }
    },
    {
      ...baseConfig,
      ssl: true
    },
    {
      ...baseConfig,
      ssl: false
    },
    {
      ...baseConfig,
      ssl: { require: true, rejectUnauthorized: false }
    }
  ];
  
  const names = [
    'SSL with rejectUnauthorized: false',
    'SSL: true',
    'SSL: false',
    'SSL require: true'
  ];
  
  let success = false;
  for (let i = 0; i < configs.length; i++) {
    const result = await testConnection(configs[i], names[i]);
    if (result) {
      success = true;
      console.log(`\n✅ Working configuration found: ${names[i]}`);
      break;
    }
  }
  
  if (!success) {
    console.log('\n⚠️  None of the configurations worked.');
    console.log('\nPossible issues:');
    console.log('1. Password might still be incorrect');
    console.log('2. Supabase project might be paused');
    console.log('3. Network/firewall blocking connection');
    console.log('4. Need to use connection pooling URL instead');
  }
}

runTests().catch(console.error);



