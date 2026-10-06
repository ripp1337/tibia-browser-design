import { Pool } from "pg";
import { env } from "../config/env.js";

export const databasePool = new Pool({
  host: env.database.host,
  port: env.database.port,
  database: env.database.name,
  user: env.database.user,
  password: env.database.password,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000
});

databasePool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error);
});
