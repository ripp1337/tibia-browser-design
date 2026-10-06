import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { PoolClient } from "pg";
import { databasePool } from "../src/database/pool.js";

interface AppliedSeed {
  seed_name: string;
  checksum_sha256: string;
}

function calculateChecksum(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

async function loadAppliedSeed(
  client: PoolClient,
  seedName: string
): Promise<AppliedSeed | undefined> {
  const result = await client.query<AppliedSeed>(
    `
      SELECT seed_name, checksum_sha256
      FROM seed_history
      WHERE seed_name = $1;
    `,
    [seedName]
  );

  return result.rows[0];
}

async function applySeed(
  client: PoolClient,
  seedName: string,
  sql: string,
  checksum: string
): Promise<void> {
  await client.query("BEGIN");

  try {
    await client.query(sql);

    await client.query(
      `
        INSERT INTO seed_history (
          seed_name,
          checksum_sha256
        )
        VALUES ($1, $2);
      `,
      [seedName, checksum]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function seedDatabase(): Promise<void> {
  const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
  const projectRoot = path.resolve(scriptDirectory, "..");
  const seedsDirectory = path.join(projectRoot, "database", "seeds");

  const seedFiles = (await readdir(seedsDirectory))
    .filter((fileName) => /^\d{3}_[a-z0-9_]+\.sql$/.test(fileName))
    .sort((left, right) => left.localeCompare(right));

  if (seedFiles.length === 0) {
    console.log("No seed files found.");
    return;
  }

  const client = await databasePool.connect();

  try {
    const historyTableCheck = await client.query<{ exists: boolean }>(
      `
        SELECT to_regclass('public.seed_history') IS NOT NULL AS exists;
      `
    );

    if (!historyTableCheck.rows[0]?.exists) {
      throw new Error(
        "The seed_history table does not exist. Apply migration 078 first."
      );
    }

    let appliedCount = 0;
    let skippedCount = 0;

    for (const seedName of seedFiles) {
      const seedPath = path.join(seedsDirectory, seedName);
      const sql = await readFile(seedPath, "utf8");
      const checksum = calculateChecksum(sql);
      const appliedSeed = await loadAppliedSeed(client, seedName);

      if (appliedSeed) {
        if (appliedSeed.checksum_sha256 !== checksum) {
          throw new Error(
            `Applied seed was modified: ${seedName}. ` +
              "Create a new seed instead of editing an applied seed."
          );
        }

        console.log(`SKIP  ${seedName}`);
        skippedCount += 1;
        continue;
      }

      console.log(`APPLY ${seedName}`);
      await applySeed(client, seedName, sql, checksum);
      appliedCount += 1;
    }

    console.log("");
    console.log("Database seeding completed.");
    console.log(`Applied: ${appliedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log(`Total: ${seedFiles.length}`);
  } finally {
    client.release();
    await databasePool.end();
  }
}

seedDatabase().catch((error: unknown) => {
  console.error("Database seeding failed.");

  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }

  process.exitCode = 1;
});