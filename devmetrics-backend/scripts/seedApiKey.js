import mongoose from "mongoose";
import dotenv from "dotenv";
import ApiKey from "../models/ApiKey.js";

dotenv.config();

// Script to create an initial API key for testing
async function seedApiKey() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/devmetrics", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✓ Connected to MongoDB");

    // Check if any API keys exist
    const existingKeys = await ApiKey.countDocuments();
    
    if (existingKeys > 0) {
      console.log(`\n⚠ ${existingKeys} API key(s) already exist.`);
      const confirm = process.argv.includes('--force');
      
      if (!confirm) {
        console.log('Use --force flag to create a new key anyway.');
        process.exit(0);
      }
    }

    // Create a new API key
    const owner = process.argv[2] || "default-owner";
    const description = process.argv[3] || "Initial API key for testing";

    const key = ApiKey.generateKey();
    
    const newApiKey = new ApiKey({
      key,
      owner,
      description,
      status: 'active',
      rateLimit: {
        requestsPerHour: 10000,
        requestsPerDay: 100000
      }
    });

    await newApiKey.save();

    console.log('\n✓ API Key created successfully!');
    console.log('\n┌─────────────────────────────────────────────────────────────────┐');
    console.log('│ SAVE THIS API KEY - IT WILL NOT BE SHOWN AGAIN                 │');
    console.log('└─────────────────────────────────────────────────────────────────┘\n');
    console.log(`  API Key:     ${newApiKey.key}`);
    console.log(`  Owner:       ${newApiKey.owner}`);
    console.log(`  Description: ${newApiKey.description}`);
    console.log(`  Status:      ${newApiKey.status}`);
    console.log(`  Created:     ${newApiKey.createdAt}`);
    console.log('\n─────────────────────────────────────────────────────────────────\n');
    console.log('Use this key in your SDK configuration:');
    console.log(`\n  DevMetrics.init({\n    apiKey: "${newApiKey.key}",\n    serverUrl: "http://localhost:5000"\n  });\n`);

    process.exit(0);
  } catch (err) {
    console.error('✗ Error creating API key:', err);
    process.exit(1);
  }
}

seedApiKey();