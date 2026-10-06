import { randomUUID } from "node:crypto";

import type { Pool, PoolClient } from "pg";

export type TestAccount = {
  accountId: string;
  username: string;
};

type AccountRow = {
  account_id: string;
  username: string;
};

type Queryable = Pick<Pool, "query"> | PoolClient;

export async function createTestAccount(
  queryable: Queryable
): Promise<TestAccount> {
  const suffix = randomUUID().replaceAll("-", "");
  const username = `test_${suffix}`.slice(0, 32);

  const result = await queryable.query<AccountRow>(
    `
      INSERT INTO accounts (
        username,
        password_hash
      )
      VALUES ($1, $2)
      RETURNING
        account_id,
        username
    `,
    [
      username,
      "integration-test-password-hash",
    ]
  );

  const account = result.rows[0];

  if (!account) {
    throw new Error(
      "Test account insert did not return an account."
    );
  }

  return {
    accountId: account.account_id,
    username: account.username,
  };
}

export async function deleteTestAccount(
  queryable: Queryable,
  accountId: string
): Promise<void> {
  await queryable.query(
    `
      DELETE FROM characters
      WHERE account_id = $1
    `,
    [accountId]
  );

  await queryable.query(
    `
      DELETE FROM accounts
      WHERE account_id = $1
    `,
    [accountId]
  );
}