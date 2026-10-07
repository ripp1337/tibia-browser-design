import { createHash } from "node:crypto";
import {
  readdir,
  readFile,
} from "node:fs/promises";
import path from "node:path";

import {
  Pool,
  type PoolClient,
} from "pg";

import { env } from "../src/config/env.js";

type Migration = {
  name: string;
  sql: string;
  checksum: string;
};

type AppliedMigrationRow = {
  migration_name: string;
  checksum: string;
  applied_at: Date;
};

const migrationsDirectory = path.resolve(
  process.cwd(),
  "database",
  "migrations"
);

const statusOnly =
  process.argv.includes("--status");

const baselineArgument =
  process.argv.find((argument) =>
    argument.startsWith("--baseline-through=")
  );

const baselineThrough =
  baselineArgument?.slice(
    "--baseline-through=".length
  ) ?? null;

function calculateChecksum(
  content: string
): string {
  return createHash("sha256")
    .update(content)
    .digest("hex");
}

async function loadMigrations():
Promise<readonly Migration[]> {
  const names = (
    await readdir(migrationsDirectory)
  )
    .filter((name) =>
      /^\d+_.+\.sql$/u.test(name)
    )
    .sort((first, second) =>
      first.localeCompare(second)
    );

  return Promise.all(
    names.map(async (name) => {
      const filePath = path.join(
        migrationsDirectory,
        name
      );

      const rawContent = await readFile(
        filePath,
        "utf8"
      );

      const sql = rawContent.replace(
        /^\uFEFF/u,
        ""
      );

      return {
        name,
        sql,
        checksum:
          calculateChecksum(sql),
      };
    })
  );
}

async function ensureMigrationTable(
  client: PoolClient
): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      migration_name TEXT PRIMARY KEY,
      checksum TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function loadAppliedMigrations(
  client: PoolClient
): Promise<Map<string, AppliedMigrationRow>> {
  const result =
    await client.query<AppliedMigrationRow>(`
      SELECT
        migration_name,
        checksum,
        applied_at
      FROM schema_migrations
      ORDER BY migration_name
    `);

  return new Map(
    result.rows.map((row) => [
      row.migration_name,
      row,
    ])
  );
}

function validateAppliedChecksums(
  migrations: readonly Migration[],
  applied: ReadonlyMap<
    string,
    AppliedMigrationRow
  >
): void {
  const migrationByName = new Map(
    migrations.map((migration) => [
      migration.name,
      migration,
    ])
  );

  for (
    const [
      name,
      appliedMigration,
    ] of applied
  ) {
    const localMigration =
      migrationByName.get(name);

    if (!localMigration) {
      throw new Error(
        `Applied migration is missing locally: ${name}`
      );
    }

    if (
      localMigration.checksum !==
      appliedMigration.checksum
    ) {
      throw new Error(
        `Applied migration was modified: ${name}`
      );
    }
  }
}

async function baselineMigrations(
  client: PoolClient,
  migrations: readonly Migration[],
  applied: ReadonlyMap<
    string,
    AppliedMigrationRow
  >,
  targetName: string
): Promise<void> {
  const targetIndex =
    migrations.findIndex(
      (migration) =>
        migration.name === targetName
    );

  if (targetIndex < 0) {
    throw new Error(
      `Baseline migration was not found: ${targetName}`
    );
  }

  const migrationsToBaseline =
    migrations
      .slice(0, targetIndex + 1)
      .filter(
        (migration) =>
          !applied.has(migration.name)
      );

  if (migrationsToBaseline.length === 0) {
    console.log(
      `Baseline already recorded through ${targetName}.`
    );

    return;
  }

  await client.query("BEGIN");

  try {
    for (
      const migration
      of migrationsToBaseline
    ) {
      await client.query(
        `
          INSERT INTO schema_migrations (
            migration_name,
            checksum
          )
          VALUES ($1, $2)
        `,
        [
          migration.name,
          migration.checksum,
        ]
      );

      console.log(
        `Baselined: ${migration.name}`
      );
    }

    await client.query("COMMIT");
  } catch (error: unknown) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function runMigration(
  client: PoolClient,
  migration: Migration
): Promise<void> {
  console.log(
    `Applying: ${migration.name}`
  );

  await client.query("BEGIN");

  try {
    await client.query(migration.sql);

    await client.query(
      `
        INSERT INTO schema_migrations (
          migration_name,
          checksum
        )
        VALUES ($1, $2)
      `,
      [
        migration.name,
        migration.checksum,
      ]
    );

    await client.query("COMMIT");

    console.log(
      `Applied: ${migration.name}`
    );
  } catch (error: unknown) {
    await client.query("ROLLBACK");

    throw new Error(
      `Migration failed: ${migration.name}`,
      {
        cause: error,
      }
    );
  }
}

function printStatus(
  migrations: readonly Migration[],
  applied: ReadonlyMap<
    string,
    AppliedMigrationRow
  >
): void {
  console.log(
    `Database: ${env.database.name}`
  );

  console.log(
    `Migrations: ${migrations.length}`
  );

  for (const migration of migrations) {
    const state = applied.has(
      migration.name
    )
      ? "applied"
      : "pending";

    console.log(
      `${state.padEnd(8)} ${migration.name}`
    );
  }

  const pendingCount =
    migrations.filter(
      (migration) =>
        !applied.has(migration.name)
    ).length;

  console.log(
    `Pending: ${pendingCount}`
  );
}

async function main(): Promise<void> {
  const pool = new Pool({
    host: env.database.host,
    port: env.database.port,
    database: env.database.name,
    user: env.database.user,
    password: env.database.password,
    max: 1,
    idleTimeoutMillis: 5_000,
    connectionTimeoutMillis: 5_000,
  });

  const client = await pool.connect();

  try {
    await client.query(
      `
        SELECT pg_advisory_lock(
          hashtext(
            'ostatnia_szansa_schema_migrations'
          )
        )
      `
    );

    await ensureMigrationTable(client);

    const migrations =
      await loadMigrations();

    let applied =
      await loadAppliedMigrations(client);

    validateAppliedChecksums(
      migrations,
      applied
    );

    if (baselineThrough) {
      await baselineMigrations(
        client,
        migrations,
        applied,
        baselineThrough
      );

      applied =
        await loadAppliedMigrations(
          client
        );

      validateAppliedChecksums(
        migrations,
        applied
      );
    }

    if (statusOnly) {
      printStatus(
        migrations,
        applied
      );

      return;
    }

    const pending =
      migrations.filter(
        (migration) =>
          !applied.has(migration.name)
      );

    if (pending.length === 0) {
      console.log(
        "No pending migrations."
      );

      return;
    }

    for (const migration of pending) {
      await runMigration(
        client,
        migration
      );
    }

    console.log(
      `Applied ${pending.length} migration(s).`
    );
  } finally {
    try {
      await client.query(
        `
          SELECT pg_advisory_unlock(
            hashtext(
              'ostatnia_szansa_schema_migrations'
            )
          )
        `
      );
    } finally {
      client.release();
      await pool.end();
    }
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
