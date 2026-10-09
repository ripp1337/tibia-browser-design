import { randomUUID } from "node:crypto";
import type { Server } from "node:http";
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

import {
  createApplicationServer,
} from "../../../src/app.js";
import { env } from "../../../src/config/env.js";
import {
  hashSessionToken,
} from "../../../src/http/postgres-authentication.provider.js";
import {
  PostgresCharacterRepository,
} from "../../../src/modules/characters/infrastructure/postgres-character.repository.js";
import type {
  RandomSource,
} from "../../../src/modules/combat/ports/random-source.js";
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
  max: 4,
  idleTimeoutMillis: 5_000,
  connectionTimeoutMillis: 5_000,
});

const characterRepository =
  new PostgresCharacterRepository(
    testPool
  );

const createdAccountIds: string[] = [];
const createdMonsterIds: string[] = [];
const openedServers: Server[] = [];

async function createAuthorizationSession(
  accountId: string
): Promise<string> {
  const token =
    `combat-http-${randomUUID()}`;

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
      new Date(now + 3_600_000),
    ]
  );

  return token;
}

async function createCombatMonster() {
  const suffix =
    randomUUID().replaceAll("-", "");

  const result = await testPool.query<{
    monster_id: string;
    code: string;
  }>(
    `
      INSERT INTO monsters (
        monster_family_id,
        code,
        name,
        description,
        monster_type,
        level,
        health,
        attack,
        defense,
        energy_cost,
        experience_reward,
        gold_min,
        gold_max
      )
      SELECT
        monster_family_id,
        $1,
        $2,
        $3,
        'Normal',
        1,
        100,
        5,
        2,
        5,
        75,
        11,
        22
      FROM monster_families
      ORDER BY monster_family_id
      LIMIT 1
      RETURNING
        monster_id,
        code
    `,
    [
      `combat_http_${suffix}`,
      `Combat HTTP ${suffix}`,
      "HTTP integration-test monster.",
    ]
  );

  const monster = result.rows[0];

  if (!monster) {
    throw new Error(
      "Could not create the HTTP combat test monster."
    );
  }

  createdMonsterIds.push(
    monster.monster_id
  );

  return monster;
}

class DefeatRandomSource
  implements RandomSource {
  private floatCall = 0;

  public nextFloat(): number {
    this.floatCall += 1;

    return this.floatCall === 1
      ? 0.99
      : 0;
  }

  public nextInt(
    _minimum: number,
    maximum: number
  ): number {
    return maximum;
  }

  public nextBigInt(
    minimum: bigint,
    _maximum: bigint
  ): bigint {
    return minimum;
  }
}

class VictoryRandomSource
  implements RandomSource {
  public nextFloat(): number {
    return 0;
  }

  public nextInt(
    _minimum: number,
    maximum: number
  ): number {
    return maximum;
  }

  public nextBigInt(
    minimum: bigint,
    _maximum: bigint
  ): bigint {
    return minimum;
  }
}

async function startServer(
  randomSource?: RandomSource
) {
  const server =
    createApplicationServer({
      randomSource,
    });

  openedServers.push(server);

  await new Promise<void>(
    (resolve, reject) => {
      server.once("error", reject);

      server.listen(
        0,
        "127.0.0.1",
        resolve
      );
    }
  );

  const address =
    server.address() as AddressInfo;

  return {
    baseUrl:
      `http://127.0.0.1:${address.port}`,
  };
}

function authorization(
  token: string
): Record<string, string> {
  return {
    authorization:
      `Bearer ${token}`,
  };
}

function jsonRequest(
  token: string,
  body: unknown
): RequestInit {
  return {
    method: "POST",
    headers: {
      ...authorization(token),
      "content-type":
        "application/json",
    },
    body: JSON.stringify(body),
  };
}

describe(
  "persistent combat HTTP integration",
  () => {
    beforeAll(async () => {
      await testPool.query("SELECT 1");
    });

    afterEach(async () => {
      while (openedServers.length > 0) {
        const server =
          openedServers.pop();

        if (server) {
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
      }

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

      while (
        createdMonsterIds.length > 0
      ) {
        const monsterId =
          createdMonsterIds.pop();

        if (monsterId) {
          await testPool.query(
            `
              DELETE FROM monsters
              WHERE monster_id = $1
            `,
            [monsterId]
          );
        }
      }
    });

    afterAll(async () => {
      await testPool.end();
    });

    it(
      "supports the complete authenticated combat flow",
      async () => {
        const account =
          await createTestAccount(
            testPool
          );

        createdAccountIds.push(
          account.accountId
        );

        const character =
          await characterRepository
            .createCharacterGraph({
              accountId:
                account.accountId,
              seasonId: null,
              name:
                `Http-${randomUUID().slice(0, 8)}`,
              spellLoadoutName:
                "Default Spells",
              equipmentLoadoutName:
                "Default Equipment",
            });

        await testPool.query(
          `
            UPDATE characters
            SET
              current_health = 100,
              current_energy = 50,
              resources_updated_at = NOW()
            WHERE character_id = $1
          `,
          [character.characterId]
        );

        const monster =
          await createCombatMonster();

        const token =
          await createAuthorizationSession(
            account.accountId
          );

        const { baseUrl } =
          await startServer();

        const combatUrl =
          `${baseUrl}/characters/${character.characterId}/combat`;

        const startResponse =
          await fetch(
            combatUrl,
            jsonRequest(token, {
              monsterCode:
                monster.code,
            })
          );

        expect(
          startResponse.status
        ).toBe(201);

        const startBody =
          await startResponse.json() as {
            data: {
              combatSessionId: string;
              status: string;
              currentTurn: number;
              events: unknown[];
            };
          };

        expect(startBody.data).toMatchObject({
          status: "Active",
          currentTurn: 1,
          events: [],
        });

        const combatSessionId =
          startBody.data.combatSessionId;

        const activeResponse =
          await fetch(combatUrl, {
            headers:
              authorization(token),
          });

        expect(
          activeResponse.status
        ).toBe(200);

        await expect(
          activeResponse.json()
        ).resolves.toMatchObject({
          data: {
            combatSessionId,
            status: "Active",
            currentTurn: 1,
          },
        });

        const actionResponse =
          await fetch(
            `${combatUrl}/actions`,
            jsonRequest(token, {
              expectedTurn: 1,
              action: {
                type: "basic_attack",
              },
            })
          );

        expect(
          actionResponse.status
        ).toBe(200);

        const actionBody =
          await actionResponse.json() as {
            data: {
              combatSessionId: string;
              events: unknown[];
            };
          };

        expect(
          actionBody.data.combatSessionId
        ).toBe(combatSessionId);

        expect(
          actionBody.data.events.length
        ).toBeGreaterThan(0);

        const sessionResponse =
          await fetch(
            `${combatUrl}/${combatSessionId}`,
            {
              headers:
                authorization(token),
            }
          );

        expect(
          sessionResponse.status
        ).toBe(200);

        await expect(
          sessionResponse.json()
        ).resolves.toMatchObject({
          data: {
            combatSessionId,
          },
        });

        const logResponse =
          await fetch(
            `${combatUrl}/${combatSessionId}/log`,
            {
              headers:
                authorization(token),
            }
          );

        expect(
          logResponse.status
        ).toBe(200);

        const logBody =
          await logResponse.json() as {
            data: {
              combatSessionId: string;
              events: unknown[];
            };
          };

        expect(logBody.data).toMatchObject({
          combatSessionId,
        });

        expect(
          logBody.data.events.length
        ).toBeGreaterThan(0);
      }
    );

    it(
      "returns a terminal Victory settlement with string amounts",
      async () => {
        const account =
          await createTestAccount(
            testPool
          );

        createdAccountIds.push(
          account.accountId
        );

        const character =
          await characterRepository
            .createCharacterGraph({
              accountId:
                account.accountId,
              seasonId: null,
              name:
                `Http-Victory-${randomUUID()
                  .slice(0, 8)}`,
              spellLoadoutName:
                "Default Spells",
              equipmentLoadoutName:
                "Default Equipment",
            });

        await testPool.query(
          `
            UPDATE characters
            SET
              current_health = 100,
              current_energy = 50,
              resources_updated_at = NOW()
            WHERE character_id = $1
          `,
          [
            character.characterId,
          ]
        );

        const monster =
          await createCombatMonster();

        await testPool.query(
          `
            UPDATE monsters
            SET
              health = 1,
              defense = 0,
              attack = 0,
              experience_reward =
                9007199254740993,
              gold_min =
                9007199254740994,
              gold_max =
                9007199254740994
            WHERE monster_id = $1
          `,
          [
            monster.monster_id,
          ]
        );

        const token =
          await createAuthorizationSession(
            account.accountId
          );

        const { baseUrl } =
          await startServer(
            new VictoryRandomSource()
          );

        const combatUrl =
          `${baseUrl}/characters/${character.characterId}/combat`;

        const startResponse =
          await fetch(
            combatUrl,
            jsonRequest(token, {
              monsterCode:
                monster.code,
            })
          );

        expect(
          startResponse.status
        ).toBe(201);

        const startBody =
          await startResponse.json() as {
            data: {
              combatSessionId:
                string;
            };
          };

        const actionResponse =
          await fetch(
            `${combatUrl}/actions`,
            jsonRequest(token, {
              expectedTurn: 1,
              action: {
                type:
                  "basic_attack",
              },
            })
          );

        expect(
          actionResponse.status
        ).toBe(200);

        const body =
          await actionResponse.json() as {
            data: {
              status: string;
              settlement: {
                outcome: string;
                experience: {
                  before: string;
                  awarded: string;
                  lost: string;
                  after: string;
                };
                gold: {
                  before: string;
                  baseRolled: string;
                  awarded: string;
                  after: string;
                };
                bestiary: {
                  killCount:
                    string | null;
                };
                statistics: {
                  damageDealt: string;
                  damageTaken: string;
                  highestPhysicalHit:
                    string;
                };
                finalSummary: {
                  combatSessionId:
                    string;
                  outcome: string;
                  startedAt: string;
                  endedAt: string;
                };
              };
            };
          };

        expect(
          body.data.status
        ).toBe("Victory");

        expect(
          body.data.settlement
        ).toMatchObject({
          outcome: "Victory",

          experience: {
            before: "0",
            awarded:
              "9007199254740993",
            lost: "0",
            after:
              "9007199254740993",
          },

          gold: {
            before: "0",
            baseRolled:
              "9007199254740994",
            awarded:
              "9007199254740994",
            after:
              "9007199254740994",
          },

          bestiary: {
            killCount: "1",
          },

          finalSummary: {
            combatSessionId:
              startBody.data
                .combatSessionId,
            outcome: "Victory",
          },
        });

        expect(
          typeof body.data.settlement
            .statistics.damageDealt
        ).toBe("string");

        expect(
          typeof body.data.settlement
            .statistics.damageTaken
        ).toBe("string");

        expect(
          typeof body.data.settlement
            .statistics
            .highestPhysicalHit
        ).toBe("string");

        expect(
          Number.isNaN(
            Date.parse(
              body.data.settlement
                .finalSummary.startedAt
            )
          )
        ).toBe(false);

        expect(
          Number.isNaN(
            Date.parse(
              body.data.settlement
                .finalSummary.endedAt
            )
          )
        ).toBe(false);
      }
    );

    it(
      "returns a terminal Defeat settlement with string amounts",
      async () => {
        const account =
          await createTestAccount(
            testPool
          );

        createdAccountIds.push(
          account.accountId
        );

        const character =
          await characterRepository
            .createCharacterGraph({
              accountId:
                account.accountId,
              seasonId: null,
              name:
                `Http-Defeat-${randomUUID()
                  .slice(0, 8)}`,
              spellLoadoutName:
                "Default Spells",
              equipmentLoadoutName:
                "Default Equipment",
            });

        await testPool.query(
          `
            UPDATE characters
            SET
              experience = 0,
              gold =
                9007199254740994,
              current_health = 1,
              current_energy = 50,
              resources_updated_at =
                NOW()
            WHERE character_id = $1
          `,
          [
            character.characterId,
          ]
        );

        const monster =
          await createCombatMonster();

        await testPool.query(
          `
            UPDATE monsters
            SET
              health = 100,
              attack = 1000,
              defense = 1000,
              experience_reward = 75,
              gold_min = 11,
              gold_max = 22
            WHERE monster_id = $1
          `,
          [
            monster.monster_id,
          ]
        );

        const token =
          await createAuthorizationSession(
            account.accountId
          );

        const { baseUrl } =
          await startServer(
            new DefeatRandomSource()
          );

        const combatUrl =
          `${baseUrl}/characters/${character.characterId}/combat`;

        const startResponse =
          await fetch(
            combatUrl,
            jsonRequest(token, {
              monsterCode:
                monster.code,
            })
          );

        expect(
          startResponse.status
        ).toBe(201);

        const startBody =
          await startResponse.json() as {
            data: {
              combatSessionId:
                string;
            };
          };

        const actionResponse =
          await fetch(
            `${combatUrl}/actions`,
            jsonRequest(token, {
              expectedTurn: 1,
              action: {
                type:
                  "basic_attack",
              },
            })
          );

        expect(
          actionResponse.status
        ).toBe(200);

        const body =
          await actionResponse.json() as {
            data: {
              status: string;
              defeatReason:
                string | null;
              settlement: {
                outcome: string;
                experience: {
                  before: string;
                  awarded: string;
                  lost: string;
                  after: string;
                };
                gold: {
                  before: string;
                  baseRolled: string;
                  awarded: string;
                  after: string;
                };
                statistics: {
                  damageDealt: string;
                  damageTaken: string;
                  highestPhysicalHit:
                    string;
                };
                finalSummary: {
                  combatSessionId:
                    string;
                  outcome: string;
                  startedAt: string;
                  endedAt: string;
                };
              };
            };
          };

        expect(
          body.data.status
        ).toBe("Defeat");

        expect(
          body.data.defeatReason
        ).toBe("PlayerHealthDepleted");

        expect(
          body.data.settlement
        ).toMatchObject({
          outcome: "Defeat",

          experience: {
            before: "0",
            awarded: "0",
            lost: "0",
            after: "0",
          },

          gold: {
            before:
              "9007199254740994",
            baseRolled: "0",
            awarded: "0",
            after:
              "9007199254740994",
          },

          finalSummary: {
            combatSessionId:
              startBody.data
                .combatSessionId,
            outcome: "Defeat",
          },
        });

        expect(
          typeof body.data.settlement
            .experience.lost
        ).toBe("string");

        expect(
          typeof body.data.settlement
            .experience.after
        ).toBe("string");

        expect(
          typeof body.data.settlement
            .statistics.damageDealt
        ).toBe("string");

        expect(
          typeof body.data.settlement
            .statistics.damageTaken
        ).toBe("string");

        expect(
          typeof body.data.settlement
            .statistics
            .highestPhysicalHit
        ).toBe("string");

        expect(
          Number.isNaN(
            Date.parse(
              body.data.settlement
                .finalSummary.startedAt
            )
          )
        ).toBe(false);

        expect(
          Number.isNaN(
            Date.parse(
              body.data.settlement
                .finalSummary.endedAt
            )
          )
        ).toBe(false);
      }
    );

    it("requires authentication", async () => {
      const { baseUrl } =
        await startServer();

      const response = await fetch(
        `${baseUrl}/characters/character-1/combat`
      );

      expect(response.status).toBe(401);
    });
  }
);
