import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;

const isSupabase = process.env.DB_HOST && process.env.DB_HOST.includes('supabase.co');

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'devmetrics',
      ssl: isSupabase ? { rejectUnauthorized: false } : false
    };

if (!process.env.DATABASE_URL && !process.env.DB_HOST) {
  throw new Error("No database config found. Set DATABASE_URL or DB_HOST in .env");
}

const pool = new Pool(poolConfig);

pool.on("connect", () => {
  console.log("✅ Connected to PostgreSQL");
});

pool.on("error", (err) => {
  console.error("Postgres pool error:", err);
});

export default pool;
export const query = (q, p) => pool.query(q, p);