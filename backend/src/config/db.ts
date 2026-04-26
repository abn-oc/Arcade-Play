import "dotenv/config";
import { Pool, QueryResult, QueryResultRow } from "pg";

const pgConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || "postgres",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASS || "postgres",
  max: 10,
  idleTimeoutMillis: 30000,
};

let pool: Pool | null = null;

export async function connectDB(): Promise<Pool> {
  if (!pool) {
    try {
      pool = new Pool(pgConfig);
      await pool.query("SELECT 1");
      console.log("Connected to Database");
    } catch (err) {
      console.error("Error connecting to database:", err);
      throw err;
    }
  }
  return pool;
}

export async function disconnectDB() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log("Database connection closed");
  }
}

export async function dbQuery<T extends QueryResultRow = any>(
  text: string,
  params: any[] = []
): Promise<QueryResult<T>> {
  const activePool = await connectDB();
  return activePool.query<T>(text, params);
}
