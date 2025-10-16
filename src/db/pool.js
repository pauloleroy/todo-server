import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  family: 4,
});

pool.on("error", (err) => {
  console.error("❌ Erro inesperado no Postgres", err);
  process.exit(-1);
});

export default pool;
