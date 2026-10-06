import type { IncomingMessage } from "node:http";

import { Pool } from "pg";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import { env } from "../../../src/config/env.js";
import {
  PostgresAuthenticationProvider,
  hashSessionToken,
} from "../../../src/http/postgres-authentication.provider.js";
import {
  createTestAccount,
  deleteTestAccount,
} from "../../helpers/test-account.js";

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

const provider = new PostgresAuthenticationProvider(
  testPool
);

const createdAccountIds: string[] = [];

function createRequest(
  token: string
): IncomingMessage {
  return {
    headers: {
      authorization: `Bearer ${token}`,
    },
  } as IncomingMessage;
}

async function createTrackedAccount(): Promise<string> {
  const account = await createTestAccount(testPool);

  createdAccountIds.push(account.accountId);

  return account.accountId;
}

async function createSession(
  accountId: string,
  token: string,
  options: {
    createdAt?: Date;
    expiresAt?: Date;
    revokedAt?: Date | null;
  } = {}
): Promise<void> {
  const createdAt =
    options.createdAt ??
    new Date(Date.now() - 60 * 1_000);

  const expiresAt =
    options.expiresAt ??
    new Date(Date.now() + 60 * 60 * 1_000);

  const revokedAt = options.revokedAt ?? null;
  const isRevoked = revokedAt !== null;

  await testPool.query(
    `
      INSERT INTO account_sessions (
        account_id,
        session_token_hash,
        created_at,
        last_activity_at,
        expires_at,
        is_revoked,
        revoked_at
      )
      VALUES ($1, $2, $3, $3, $4, $5, $6)
    `,
    [
      accountId,
      hashSessionToken(token),
      createdAt,
      expiresAt,
      isRevoked,
      revokedAt,
    ]
  );
}

describe("PostgresAuthenticationProvider integration", () => {
  beforeAll(async () => {
    await testPool.query("SELECT 1");
  });

  afterEach(async () => {
    while (createdAccountIds.length > 0) {
      const accountId = createdAccountIds.pop();

      if (accountId) {
        await deleteTestAccount(
          testPool,
          accountId
        );
      }
    }
  });

  afterAll(async () => {
    await testPool.end();
  });

  it("authenticates an active non-expired session", async () => {
    const accountId = await createTrackedAccount();
    const token = "valid-integration-session";

    await createSession(accountId, token);

    const beforeAuthentication =
      await testPool.query<{
        last_activity_at: Date;
      }>(
        `
          SELECT last_activity_at
          FROM account_sessions
          WHERE session_token_hash = $1
        `,
        [hashSessionToken(token)]
      );

    const context = await provider.authenticate(
      createRequest(token)
    );

    expect(context).toEqual({
      accountId,
    });

    const afterAuthentication =
      await testPool.query<{
        last_activity_at: Date;
      }>(
        `
          SELECT last_activity_at
          FROM account_sessions
          WHERE session_token_hash = $1
        `,
        [hashSessionToken(token)]
      );

    expect(
      afterAuthentication.rows[0]?.last_activity_at.getTime()
    ).toBeGreaterThanOrEqual(
      beforeAuthentication.rows[0]?.last_activity_at.getTime() ??
        0
    );
  });

  it("rejects an expired session", async () => {
    const accountId = await createTrackedAccount();
    const token = "expired-integration-session";

    const now = Date.now();

    await createSession(accountId, token, {
      createdAt: new Date(
        now - 2 * 60 * 60 * 1_000
      ),
      expiresAt: new Date(
        now - 60 * 60 * 1_000
      ),
    });

    await expect(
      provider.authenticate(createRequest(token))
    ).resolves.toBeNull();
  });

  it("rejects a revoked session", async () => {
    const accountId = await createTrackedAccount();
    const token = "revoked-integration-session";

    const now = Date.now();

    await createSession(accountId, token, {
      createdAt: new Date(now - 60 * 1_000),
      revokedAt: new Date(now),
    });

    await expect(
      provider.authenticate(createRequest(token))
    ).resolves.toBeNull();
  });

  it("rejects a session belonging to an inactive account", async () => {
    const accountId = await createTrackedAccount();
    const token = "inactive-account-session";

    await createSession(accountId, token);

    await testPool.query(
      `
        UPDATE accounts
        SET status = 'Suspended'
        WHERE account_id = $1
      `,
      [accountId]
    );

    await expect(
      provider.authenticate(createRequest(token))
    ).resolves.toBeNull();
  });

  it("rejects an unknown token", async () => {
    await expect(
      provider.authenticate(
        createRequest("unknown-session-token")
      )
    ).resolves.toBeNull();
  });
});