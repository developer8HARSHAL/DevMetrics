import pg from "pg";
const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
    rejectUnauthorized: false
  }
});

pool.on("connect", () => {
  console.log("✅ Connected to Supabase PostgreSQL (SSL)");
});

pool.on("error", (err) => {
  console.error("Postgres pool error:", err);
});

export default pool;
export const query = (q, p) => pool.query(q, p);
