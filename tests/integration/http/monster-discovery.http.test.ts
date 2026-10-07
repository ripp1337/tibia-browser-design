import { randomUUID } from "node:crypto";
import type { AddressInfo } from "node:net";

import { Pool } from "pg";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import { createApplicationServer } from "../../../src/app.js";
import { env } from "../../../src/config/env.js";
import {
  hashSessionToken,
} from "../../../src/http/postgres-authentication.provider.js";
import { PostgresCharacterRepository } from "../../../src/modules/characters/infrastructure/postgres-character.repository.js";
import {
  createTestAccount,
  deleteTestAccount,
  type TestAccount,
} from "../../helpers/test-account.js";

const testPool = new Pool({
  host: env.database.host,
  port: env.database.port,
  database: env.database.name,
  user: env.database.user,
  password: env.database.password,
  max: 3,
  idleTimeoutMillis: 5_000,
  connectionTimeoutMillis: 5_000,
});

const characterRepository =
  new PostgresCharacterRepository(
    testPool
  );

const createdAccountIds: string[] = [];

async function createTrackedAccount():
Promise<TestAccount> {
  const account =
    await createTestAccount(testPool);

  createdAccountIds.push(
    account.accountId
  );

  return account;
}

async function createCharacter(
  accountId: string,
  name: string
) {
  return characterRepository.createCharacterGraph({
    accountId,
    seasonId: null,
    name,
    spellLoadoutName: "Default Spells",
    equipmentLoadoutName:
      "Default Equipment",
  });
}

async function createSession(
  accountId: string
): Promise<string> {
  const token =
    `monster-http-${randomUUID()}`;

  const now = Date.now();

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
      VALUES (
        $1,
        $2,
        $3,
        $3,
        $4,
        FALSE,
        NULL
      )
    `,
    [
      accountId,
      hashSessionToken(token),
      new Date(now - 60_000),
      new Date(
        now + 60 * 60 * 1_000
      ),
    ]
  );

  return token;
}

async function startApplicationServer() {
  const server =
    createApplicationServer();

  await new Promise<void>(
    (resolve, reject) => {
      server.once("error", reject);

      server.listen(
        0,
        "127.0.0.1",
        () => resolve()
      );
    }
  );

  const address =
    server.address() as AddressInfo;

  return {
    server,

    baseUrl:
      `http://127.0.0.1:${address.port}`,
  };
}

function createAuthorization(
  token: string
): Record<string, string> {
  return {
    authorization:
      `Bearer ${token}`,
  };
}

describe(
  "monster discovery HTTP integration",
  () => {
    beforeAll(async () => {
      await testPool.query("SELECT 1");
    });

    afterEach(async () => {
      while (
        createdAccountIds.length > 0
      ) {
        const accountId =
          createdAccountIds.pop();

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

    it("requires authentication", async () => {
      const account =
        await createTrackedAccount();

      const character =
        await createCharacter(
          account.accountId,
          `NoAuth-${randomUUID().slice(0, 8)}`
        );

      const {
        server,
        baseUrl,
      } = await startApplicationServer();

      try {
        const response = await fetch(
          `${baseUrl}/characters/${character.characterId}/monsters`
        );

        expect(response.status).toBe(401);

        await expect(
          response.json()
        ).resolves.toEqual({
          error: {
            code:
              "AUTHENTICATION_REQUIRED",

            message:
              "Authentication is required.",
          },
        });
      } finally {
        await new Promise<void>(
          (resolve, reject) => {
            server.close((error) => {
              if (error) {
                reject(error);
                return;
              }

              resolve();
            });
          }
        );
      }
    });

    it("returns the monster list", async () => {
      const account =
        await createTrackedAccount();

      const character =
        await createCharacter(
          account.accountId,
          `List-${randomUUID().slice(0, 8)}`
        );

      const token =
        await createSession(
          account.accountId
        );

      const {
        server,
        baseUrl,
      } = await startApplicationServer();

      try {
        const response = await fetch(
          `${baseUrl}/characters/${character.characterId}/monsters`,
          {
            headers:
              createAuthorization(token),
          }
        );

        expect(response.status).toBe(200);

        const body = await response.json() as {
          data: unknown[];
        };

        expect(
          body.data.length
        ).toBeGreaterThan(0);

        expect(body.data[0]).toMatchObject({
          code: expect.any(String),
          name: expect.any(String),
          level: expect.any(Number),
          monsterType:
            expect.any(String),
          energyCost:
            expect.any(Number),
          eligibility: {
            isEligible:
              expect.any(Boolean),
            reasons:
              expect.any(Array),
          },
          cooldown: {
            isActive:
              expect.any(Boolean),
          },
          bestiaryVisible:
            expect.any(Boolean),
        });
      } finally {
        await new Promise<void>(
          (resolve, reject) => {
            server.close((error) => {
              if (error) {
                reject(error);
                return;
              }

              resolve();
            });
          }
        );
      }
    });

    it("returns monster details by stable code", async () => {
      const account =
        await createTrackedAccount();

      const character =
        await createCharacter(
          account.accountId,
          `Details-${randomUUID().slice(0, 8)}`
        );

      const token =
        await createSession(
          account.accountId
        );

      const {
        server,
        baseUrl,
      } = await startApplicationServer();

      try {
        const response = await fetch(
          `${baseUrl}/characters/${character.characterId}/monsters/dev_monster_01`,
          {
            headers:
              createAuthorization(token),
          }
        );

        expect(response.status).toBe(200);

        await expect(
          response.json()
        ).resolves.toMatchObject({
          data: {
            code: "dev_monster_01",
            name: "Dev Monster 1",
            description:
              expect.any(String),
            eligibility: {
              isEligible:
                expect.any(Boolean),
              reasons:
                expect.any(Array),
            },
          },
        });
      } finally {
        await new Promise<void>(
          (resolve, reject) => {
            server.close((error) => {
              if (error) {
                reject(error);
                return;
              }

              resolve();
            });
          }
        );
      }
    });

    it("returns 404 for an unknown monster code", async () => {
      const account =
        await createTrackedAccount();

      const character =
        await createCharacter(
          account.accountId,
          `Unknown-${randomUUID().slice(0, 8)}`
        );

      const token =
        await createSession(
          account.accountId
        );

      const {
        server,
        baseUrl,
      } = await startApplicationServer();

      try {
        const response = await fetch(
          `${baseUrl}/characters/${character.characterId}/monsters/unknown_monster_code`,
          {
            headers:
              createAuthorization(token),
          }
        );

        expect(response.status).toBe(404);

        await expect(
          response.json()
        ).resolves.toMatchObject({
          error: {
            code: "MONSTER_NOT_FOUND",
          },
        });
      } finally {
        await new Promise<void>(
          (resolve, reject) => {
            server.close((error) => {
              if (error) {
                reject(error);
                return;
              }

              resolve();
            });
          }
        );
      }
    });

    it("does not expose a foreign character", async () => {
      const owner =
        await createTrackedAccount();

      const stranger =
        await createTrackedAccount();

      const character =
        await createCharacter(
          owner.accountId,
          `Foreign-${randomUUID().slice(0, 8)}`
        );

      const strangerToken =
        await createSession(
          stranger.accountId
        );

      const {
        server,
        baseUrl,
      } = await startApplicationServer();

      try {
        const response = await fetch(
          `${baseUrl}/characters/${character.characterId}/monsters`,
          {
            headers:
              createAuthorization(
                strangerToken
              ),
          }
        );

        expect(response.status).toBe(404);

        await expect(
          response.json()
        ).resolves.toMatchObject({
          error: {
            code:
              "CHARACTER_NOT_FOUND",
          },
        });
      } finally {
        await new Promise<void>(
          (resolve, reject) => {
            server.close((error) => {
              if (error) {
                reject(error);
                return;
              }

              resolve();
            });
          }
        );
      }
    });
  }
);
