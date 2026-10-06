import { randomUUID } from "node:crypto";

import { Pool } from "pg";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import { env } from "../../../src/config/env.js";
import { withTransaction } from "../../../src/infrastructure/database/transaction.js";

const testPool = new Pool({
  host: env.database.host,
  port: env.database.port,
  database: env.database.name,
  user: env.database.user,
  password: env.database.password,
  max: 2,
  idleTimeoutMillis: 5_000,
  connectionTimeoutMillis: 5_000,
});

const TEST_TABLE = "integration_test_transactions";

describe("withTransaction PostgreSQL integration", () => {
  beforeAll(async () => {
    await testPool.query(`
      CREATE TABLE IF NOT EXISTS ${TEST_TABLE} (
        test_id uuid PRIMARY KEY,
        value text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
  });

  beforeEach(async () => {
    await testPool.query(`TRUNCATE TABLE ${TEST_TABLE}`);
  });

  afterAll(async () => {
    try {
      await testPool.query(`DROP TABLE IF EXISTS ${TEST_TABLE}`);
    } finally {
      await testPool.end();
    }
  });

  it("commits data when the callback succeeds", async () => {
    const testId = randomUUID();

    const result = await withTransaction(testPool, async (client) => {
      await client.query(
        `
          INSERT INTO ${TEST_TABLE} (
            test_id,
            value
          )
          VALUES ($1, $2)
        `,
        [testId, "committed"]
      );

      return {
        testId,
        value: "committed",
      };
    });

    expect(result).toEqual({
      testId,
      value: "committed",
    });

    const stored = await testPool.query<{
      test_id: string;
      value: string;
    }>(
      `
        SELECT
          test_id,
          value
        FROM ${TEST_TABLE}
        WHERE test_id = $1
      `,
      [testId]
    );

    expect(stored.rows).toEqual([
      {
        test_id: testId,
        value: "committed",
      },
    ]);
  });

  it("rolls back data when the callback fails", async () => {
    const testId = randomUUID();
    const failure = new Error("Forced transaction failure");

    await expect(
      withTransaction(testPool, async (client) => {
        await client.query(
          `
            INSERT INTO ${TEST_TABLE} (
              test_id,
              value
            )
            VALUES ($1, $2)
          `,
          [testId, "must be rolled back"]
        );

        throw failure;
      })
    ).rejects.toBe(failure);

    const stored = await testPool.query<{
      test_id: string;
    }>(
      `
        SELECT test_id
        FROM ${TEST_TABLE}
        WHERE test_id = $1
      `,
      [testId]
    );

    expect(stored.rows).toEqual([]);
  });
});