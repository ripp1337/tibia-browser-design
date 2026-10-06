import type { PoolClient } from "pg";
import { describe, expect, it, vi } from "vitest";

import {
  withTransaction,
  type TransactionPool,
} from "../../../src/infrastructure/database/transaction.js";

type FakeClient = Pick<PoolClient, "query" | "release">;

function createFakeTransaction(): {
  pool: TransactionPool;
  client: FakeClient;
  query: ReturnType<typeof vi.fn>;
  release: ReturnType<typeof vi.fn>;
} {
  const query = vi.fn().mockResolvedValue({
    rows: [],
    rowCount: 0,
  });

  const release = vi.fn();

  const client: FakeClient = {
    query: query as PoolClient["query"],
    release,
  };

  const pool: TransactionPool = {
    connect: vi.fn().mockResolvedValue(client as PoolClient),
  };

  return {
    pool,
    client,
    query,
    release,
  };
}

describe("withTransaction", () => {
  it("commits and returns the callback result", async () => {
    const { pool, query, release } = createFakeTransaction();

    const result = await withTransaction(pool, async () => {
      return "completed";
    });

    expect(result).toBe("completed");
    expect(query).toHaveBeenNthCalledWith(1, "BEGIN");
    expect(query).toHaveBeenNthCalledWith(2, "COMMIT");
    expect(query).not.toHaveBeenCalledWith("ROLLBACK");
    expect(release).toHaveBeenCalledOnce();
  });

  it("passes the connected client to the callback", async () => {
    const { pool, client } = createFakeTransaction();

    const callback = vi.fn().mockResolvedValue(undefined);

    await withTransaction(pool, callback);

    expect(callback).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledWith(client);
  });

  it("rolls back and rethrows callback errors", async () => {
    const { pool, query, release } = createFakeTransaction();
    const failure = new Error("Callback failed");

    await expect(
      withTransaction(pool, async () => {
        throw failure;
      })
    ).rejects.toBe(failure);

    expect(query).toHaveBeenNthCalledWith(1, "BEGIN");
    expect(query).toHaveBeenNthCalledWith(2, "ROLLBACK");
    expect(query).not.toHaveBeenCalledWith("COMMIT");
    expect(release).toHaveBeenCalledOnce();
  });

  it("releases the client when commit fails", async () => {
    const { pool, query, release } = createFakeTransaction();

    query
      .mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      })
      .mockRejectedValueOnce(new Error("Commit failed"))
      .mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

    await expect(
      withTransaction(pool, async () => "result")
    ).rejects.toThrow("Commit failed");

    expect(query).toHaveBeenNthCalledWith(1, "BEGIN");
    expect(query).toHaveBeenNthCalledWith(2, "COMMIT");
    expect(query).toHaveBeenNthCalledWith(3, "ROLLBACK");
    expect(release).toHaveBeenCalledOnce();
  });

  it("throws AggregateError when work and rollback both fail", async () => {
    const { pool, query, release } = createFakeTransaction();

    query
      .mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      })
      .mockRejectedValueOnce(new Error("Rollback failed"));

    await expect(
      withTransaction(pool, async () => {
        throw new Error("Work failed");
      })
    ).rejects.toBeInstanceOf(AggregateError);

    expect(release).toHaveBeenCalledOnce();
  });
});