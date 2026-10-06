import type { Pool, PoolClient } from "pg";

export type TransactionCallback<TResult> = (
  client: PoolClient
) => Promise<TResult>;

export type TransactionPool = Pick<Pool, "connect">;

export async function withTransaction<TResult>(
  pool: TransactionPool,
  callback: TransactionCallback<TResult>
): Promise<TResult> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await callback(client);

    await client.query("COMMIT");

    return result;
  } catch (error: unknown) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError: unknown) {
      throw new AggregateError(
        [error, rollbackError],
        "Transaction failed and rollback also failed."
      );
    }

    throw error;
  } finally {
    client.release();
  }
}