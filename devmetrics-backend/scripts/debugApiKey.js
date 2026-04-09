import "../bootstrap.js";
import { query } from "../config/db.js";

const result = await query(
  "SELECT key, owner FROM api_keys LIMIT 1"
);

console.log("Your API Key:", result.rows[0]);
process.exit(0);
