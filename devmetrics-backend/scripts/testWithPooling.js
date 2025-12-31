import dotenv from 'dotenv';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment
dotenv.config({ path: join(__dirname, '..', '.env.production') });

const { Client } = pg;

async function testConnection(port, description) {
  console.log(`\n🧪 Testing ${description} (Port ${port})...\n`);
  
  const client = new Client({
    host: process.env.DB_HOST,
    port: port,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    const result = await client.query('SELECT NOW(), version()');
    console.log(`✅ ${description} SUCCESS!`);
    console.log(`   Server time: ${result.rows[0].now}`);
    await client.end();
    return true;
  } catch (error) {
    console.log(`❌ ${description} FAILED: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🔍 Testing Both Connection Methods\n');
  console.log('='.repeat(60));
  
  const direct = await testConnection(5432, 'Direct Connection');
  const pooling = await testConnection(6543, 'Connection Pooling');
  
  console.log('\n' + '='.repeat(60));
  
  if (direct) {
    console.log('\n✅ Use port 5432 (Direct Connection)');
    console.log('   Your .env.production should have: DB_PORT=5432');
  } else if (pooling) {
    console.log('\n✅ Use port 6543 (Connection Pooling)');
    console.log('   Update your .env.production: DB_PORT=6543');
  } else {
    console.log('\n❌ Both connection methods failed.');
    console.log('   Check your password in .env.production');
    console.log('   Verify Supabase project is active');
  }
}

main().catch(console.error);



