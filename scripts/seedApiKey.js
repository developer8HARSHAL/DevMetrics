import dotenv from "dotenv";
import ApiKey from "../models/ApiKey.js";
import pool from "../config/db.js";

dotenv.config();

async function seedApiKey() {
  try {
    const existingKeys = await ApiKey.countDocuments();
    
    if (existingKeys > 0) {
      console.log(`\n⚠  ${existingKeys} API key(s) already exist.`);
      if (!process.argv.includes('--force')) {
        console.log('Use --force to create anyway.\n');
        process.exit(0);
      }
    }

    const owner = process.argv[2] || "default-owner";
    const description = process.argv[3] || "Initial API key for testing";
    const key = ApiKey.generateKey();
    
    const newApiKey = await ApiKey.create({
      key,
      owner,
      description,
      status: 'active',
      requestsPerHour: 10000,
      requestsPerDay: 100000
    });

    console.log('\n✅ API Key created!\n');
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│ SAVE THIS API KEY                                       │');
    console.log('└─────────────────────────────────────────────────────────┘\n');
    console.log(`  Key:         ${newApiKey.key}`);
    console.log(`  Owner:       ${newApiKey.owner}`);
    console.log(`  Description: ${newApiKey.description}`);
    console.log(`  Status:      ${newApiKey.status}`);
    console.log(`  Created:     ${newApiKey.created_at}`);
    console.log('\n─────────────────────────────────────────────────────────\n');
    console.log('Usage:\n');
    console.log(`  DevMetrics.init({\n    apiKey: "${newApiKey.key}"\n  });\n`);

    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    await pool.end();
    process.exit(1);
  }
}

seedApiKey();