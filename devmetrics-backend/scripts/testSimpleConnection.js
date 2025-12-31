import dotenv from 'dotenv';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment
dotenv.config({ path: join(__dirname, '..', '.env') });
dotenv.config({ path: join(__dirname, '..', '.env.production') });

const { Client } = pg;

console.log('🔍 Testing Connection with Current Environment\n');
console.log('Configuration:');
console.log(`  Host: ${process.env.DB_HOST}`);
console.log(`  Port: ${process.env.DB_PORT}`);
console.log(`  Database: ${process.env.DB_NAME}`);
console.log(`  User: ${process.env.DB_USER}`);
console.log(`  Password: ${process.env.DB_PASSWORD ? '***' + process.env.DB_PASSWORD.slice(-2) : 'MISSING'}\n`);

const client = new Client({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false
  }
});

async function test() {
  try {
    console.log('🔌 Connecting...');
    await client.connect();
    console.log('✅ Connected successfully!\n');
    
    const result = await client.query('SELECT NOW(), version()');
    console.log('✅ Query successful!');
    console.log(`   Server time: ${result.rows[0].now}`);
    console.log(`   PostgreSQL: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}\n`);
    
    // Check tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log('✅ Tables found:');
    tables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    await client.end();
    console.log('\n🎉 All tests passed! Backend should work now.\n');
    
  } catch (error) {
    console.error('❌ Connection failed!\n');
    console.error(`Error: ${error.message}`);
    if (error.code) {
      console.error(`Code: ${error.code}`);
    }
    console.error('\nTroubleshooting:');
    console.error('1. Check password in .env or .env.production');
    console.error('2. Verify Supabase project is active');
    console.error('3. Check network connection');
    process.exit(1);
  }
}

test();



