import dotenv from 'dotenv';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Client } = pg;

const passwords = [
  'Hars08@h4@2',  // From .env
  'Hars@08',      // From .env.production
  'Harshal@.08$'  // From DATABASE_URL in .env.production
];

async function testPassword(password, name) {
  console.log(`\n🧪 Testing password: ${name}`);
  
  const client = new Client({
    host: 'db.ciosohwjqmhzitwmvolp.supabase.co',
    port: 5432,
    user: 'postgres',
    password: password,
    database: 'postgres',
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    const result = await client.query('SELECT NOW()');
    console.log(`✅ ${name} WORKS! Connected at ${result.rows[0].now}`);
    await client.end();
    return true;
  } catch (error) {
    console.log(`❌ ${name} FAILED: ${error.message.substring(0, 50)}`);
    return false;
  }
}

async function main() {
  console.log('🔍 Testing All Passwords from Your Files\n');
  console.log('='.repeat(60));
  
  const results = await Promise.all([
    testPassword(passwords[0], 'Hars08@h4@2 (.env)'),
    testPassword(passwords[1], 'Hars@08 (.env.production)'),
    testPassword(passwords[2], 'Harshal@.08$ (DATABASE_URL)')
  ]);
  
  console.log('\n' + '='.repeat(60));
  
  const workingIndex = results.findIndex(r => r === true);
  
  if (workingIndex >= 0) {
    console.log(`\n✅ WORKING PASSWORD FOUND: ${passwords[workingIndex]}`);
    console.log(`\nUpdate your .env.production file:`);
    console.log(`DB_PASSWORD=${passwords[workingIndex]}`);
  } else {
    console.log('\n❌ None of the passwords work!');
    console.log('\nYou need to:');
    console.log('1. Go to Supabase Dashboard');
    console.log('2. Settings → Database → Reset database password');
    console.log('3. Copy the new password');
    console.log('4. Update .env.production with the new password');
  }
}

main().catch(console.error);



