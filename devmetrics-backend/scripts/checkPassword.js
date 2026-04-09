import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Checking Environment Files...\n');

// Check .env file
const envPath = join(__dirname, '..', '.env');
const envProdPath = join(__dirname, '..', '.env.production');

if (existsSync(envPath)) {
  console.log('✅ .env file exists');
  dotenv.config({ path: envPath });
  console.log(`   DB_HOST: ${process.env.DB_HOST || 'NOT SET'}`);
  console.log(`   DB_PASSWORD: ${process.env.DB_PASSWORD ? '***SET***' : 'NOT SET'}\n`);
} else {
  console.log('❌ .env file NOT FOUND\n');
}

// Reset and check .env.production
delete process.env.DB_HOST;
delete process.env.DB_PASSWORD;

if (existsSync(envProdPath)) {
  console.log('✅ .env.production file exists');
  dotenv.config({ path: envProdPath });
  console.log(`   DB_HOST: ${process.env.DB_HOST || 'NOT SET'}`);
  console.log(`   DB_PASSWORD: ${process.env.DB_PASSWORD ? '***SET***' : 'NOT SET'}\n`);
} else {
  console.log('❌ .env.production file NOT FOUND\n');
}

console.log('💡 Tip: Make sure you update the password in the correct file!');
console.log('   - If NODE_ENV=production, use .env.production');
console.log('   - Otherwise, use .env\n');




