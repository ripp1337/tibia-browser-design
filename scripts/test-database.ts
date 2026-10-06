import { databasePool } from "../src/database/pool.js";

async function testDatabaseConnection(): Promise<void> {
  try {
    const connectionResult = await databasePool.query<{
      database_name: string;
      database_user: string;
      server_time: Date;
      table_count: string;
    }>(`
      SELECT
        current_database() AS database_name,
        current_user AS database_user,
        NOW() AS server_time,
        (
          SELECT COUNT(*)
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
        )::text AS table_count;
    `);

    const result = connectionResult.rows[0];

    if (!result) {
      throw new Error("Database test returned no result.");
    }

    const tableCount = Number.parseInt(result.table_count, 10);

    if (tableCount !== 78) {
      throw new Error(
        `Expected 78 database tables, but PostgreSQL returned ${tableCount}.`
      );
    }

    console.log("PostgreSQL connection successful.");
    console.log(`Database: ${result.database_name}`);
    console.log(`User: ${result.database_user}`);
    console.log(`Server time: ${result.server_time.toISOString()}`);
    console.log(`Tables: ${tableCount}`);
  } finally {
    await databasePool.end();
  }
}

testDatabaseConnection().catch((error: unknown) => {
  console.error("PostgreSQL connection failed.");

  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }

  process.exitCode = 1;
});
