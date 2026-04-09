import dotenv from 'dotenv';
import { query } from '../config/db.js';
dotenv.config();

async function checkSchema() {
  try {
    const result = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'api_keys'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 api_keys table columns:\n');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name} - ${row.data_type}`);
    });
    
    const hasUserId = result.rows.some(r => r.column_name === 'user_id');
    const hasUserEmail = result.rows.some(r => r.column_name === 'user_email');
    
    console.log('\n✅ Status:');
    console.log(`  user_id column: ${hasUserId ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`  user_email column: ${hasUserEmail ? '✅ EXISTS' : '❌ MISSING'}`);
    
    if (!hasUserId || !hasUserEmail) {
      console.log('\n⚠️  Need to add user columns!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkSchema();