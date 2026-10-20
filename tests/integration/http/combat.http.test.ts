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
const createdItemBaseIds: string[] = [];
const createdMaterialIds: string[] = [];
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

/**
 * Deterministic Victories that always succeed the Equipment and Other Loot
 * probability rolls (both use nextInt(1, 1000) and return the minimum) while
 * rolling the maximum for any other integer range. Bigint rolls use the
 * inclusive minimum, which is a valid edge for weighted selections and
 * quantity ranges.
 */
class LootVictoryRandomSource
  implements RandomSource {
  public nextFloat(): number {
    return 0;
  }

  public nextInt(
    minimum: number,
    maximum: number
  ): number {
    if (minimum === 1 && maximum === 1000) {
      return 1;
    }

    return maximum;
  }

  public nextBigInt(
    minimum: bigint,
    _maximum: bigint
  ): bigint {
    return minimum;
  }
}

async function createLootBearingMonster() {
  const monster =
    await createCombatMonster();

  const suffix =
    randomUUID().replaceAll("-", "");

  // Create a dedicated Item Base for this Monster instead of relying on a
  // non-deterministic `SELECT ... LIMIT 1` over shared seed data. The
  // inserted row is tracked and removed during cleanup, so concurrent test
  // files never observe or depend on each other's loot data.
  const itemBaseResult =
    await testPool.query<{
      item_base_id: string;
    }>(
      `
        INSERT INTO item_bases (
          code,
          name,
          description,
          item_level,
          required_level,
          slot,
          base_item_score
        )
        VALUES ($1, $2, $3, 1, 1, 'Helmet', 1)
        RETURNING item_base_id
      `,
      [
        `loot_http_base_${suffix}`,
        `Loot HTTP Base ${suffix}`,
        "HTTP integration-test loot Item Base.",
      ]
    );

  const itemBaseId =
    itemBaseResult.rows[0]?.item_base_id;

  if (!itemBaseId) {
    throw new Error(
      "Could not create the HTTP loot Item Base."
    );
  }

  createdItemBaseIds.push(itemBaseId);

  await testPool.query(
    `
      INSERT INTO loot_tables (
        monster_id,
        item_base_id,
        selection_weight
      )
      VALUES ($1, $2, 1)
    `,
    [
      monster.monster_id,
      itemBaseId,
    ]
  );

  // Likewise, insert a dedicated Material instead of selecting a shared row.
  const materialResult =
    await testPool.query<{
      material_id: string;
    }>(
      `
        INSERT INTO materials (
          code,
          name,
          description,
          material_level,
          is_lootable
        )
        VALUES ($1, $2, $3, 1, TRUE)
        RETURNING material_id
      `,
      [
        `loot_http_material_${suffix}`,
        `Loot HTTP Material ${suffix}`,
        "HTTP integration-test loot Material.",
      ]
    );

  const materialId =
    materialResult.rows[0]?.material_id;

  if (!materialId) {
    throw new Error(
      "Could not create the HTTP loot Material."
    );
  }

  createdMaterialIds.push(materialId);

  await testPool.query(
    `
      INSERT INTO other_loot_tables (
        monster_id,
        material_id,
        min_quantity,
        max_quantity,
        selection_weight
      )
      VALUES ($1, $2, 1, 3, 1)
    `,
    [
      monster.monster_id,
      materialId,
    ]
  );

  return monster;
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

/**
 * Asserts that every listed property is serialized as a string. BigInt
 * amounts (Experience, Gold, Item Score, quantities, statistics) must cross
 * the HTTP boundary as strings, never as lossy numbers.
 */
function expectStringFields(
  record: Record<string, unknown>,
  fieldNames: readonly string[]
): void {
  for (const fieldName of fieldNames) {
    expect(
      typeof record[fieldName],
      `${fieldName} must be serialized as a string`
    ).toBe("string");
  }
}

describe(
  "persistent combat HTTP integration",
  () => {
    beforeAll(async () => {
      await testPool.query("SELECT 1");
    });

    afterEach(async () => {
      // Drain the tracked collections atomically up front. Each collection is
      // snapshotted and cleared before any awaited cleanup runs, so a failing
      // or re-entrant cleanup can never leave stale ids behind for the next
      // test and every id is still processed.
      const servers =
        openedServers.splice(
          0,
          openedServers.length
        );
      const accountIds =
        createdAccountIds.splice(
          0,
          createdAccountIds.length
        );
      const monsterIds =
        createdMonsterIds.splice(
          0,
          createdMonsterIds.length
        );
      const itemBaseIds =
        createdItemBaseIds.splice(
          0,
          createdItemBaseIds.length
        );
      const materialIds =
        createdMaterialIds.splice(
          0,
          createdMaterialIds.length
        );

      // Close every HTTP server independently. A failure closing one server
      // must not prevent closing the others or removing database rows.
      await Promise.allSettled(
        servers.map(async (server) => {
          try {
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
          } catch {
            // Ignore individual close errors so cleanup continues.
          }
        })
      );

      // Accounts own characters and combat sessions; deleting an Account
      // cascades those rows. Each delete runs in isolation.
      await Promise.allSettled(
        accountIds.map(async (accountId) => {
          try {
            await deleteTestAccount(
              testPool,
              accountId
            );
          } catch {
            // Ignore individual delete errors (e.g. foreign-key conflicts)
            // so unrelated records are still cleaned up.
          }
        })
      );

      // Monsters cascade loot_tables, other_loot_tables and any dependent
      // session rows via ON DELETE CASCADE.
      await Promise.allSettled(
        monsterIds.map(async (monsterId) => {
          try {
            await testPool.query(
              `
                DELETE FROM monsters
                WHERE monster_id = $1
              `,
              [monsterId]
            );
          } catch {
            // Ignore individual delete errors so cleanup continues.
          }
        })
      );

      // Remove dedicated loot Item Bases and Materials after the Monsters
      // that reference them have been deleted.
      await Promise.allSettled(
        itemBaseIds.map(async (itemBaseId) => {
          try {
            await testPool.query(
              `
                DELETE FROM item_bases
                WHERE item_base_id = $1
              `,
              [itemBaseId]
            );
          } catch {
            // Ignore individual delete errors so cleanup continues.
          }
        })
      );

      await Promise.allSettled(
        materialIds.map(async (materialId) => {
          try {
            await testPool.query(
              `
                DELETE FROM materials
                WHERE material_id = $1
              `,
              [materialId]
            );
          } catch {
            // Ignore individual delete errors so cleanup continues.
          }
        })
      );
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

        const settlement =
          body.data.settlement;

        // BigInt amounts (Experience, Gold, Bestiary counts) must be
        // serialized as strings and preserve their exact large values.
        expect(settlement).toMatchObject({
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

        // Explicit string-typed expectations for BigInt-derived fields.
        expectStringFields(
          settlement.experience,
          ["awarded", "after"]
        );
        expectStringFields(
          settlement.gold,
          ["baseRolled", "awarded", "after"]
        );
        expectStringFields(
          settlement.statistics,
          [
            "damageDealt",
            "damageTaken",
            "highestPhysicalHit",
          ]
        );

        expect(
          Number.isNaN(
            Date.parse(
              settlement
                .finalSummary.startedAt
            )
          )
        ).toBe(false);

        expect(
          Number.isNaN(
            Date.parse(
              settlement
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
              loot: unknown;
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

        expect(body.data.loot).toBeNull();

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

    it(
      "returns Loot settlement for terminal Victory",
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
                `Http-Loot-${randomUUID()
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
          await createLootBearingMonster();

        await testPool.query(
          `
            UPDATE monsters
            SET
              health = 1,
              defense = 0,
              attack = 0
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
            new LootVictoryRandomSource()
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
              loot: {
                regularEquipment: {
                  generated: {
                    itemLevel: number;
                    requiredLevel: number;
                    rarity: string;
                    itemScore: string;
                    affixes: Array<{
                      statType: string;
                      rollValue: string;
                    }>;
                  } | null;
                  persisted: {
                    itemId: string;
                    inventoryPosition: number;
                  } | null;
                  lossReason:
                    "InventoryFull" | null;
                };
                specialEquipment: {
                  generated: unknown | null;
                  persisted: unknown | null;
                  lossReason:
                    "InventoryFull" | null;
                };
                specialRollOutcome: string;
                otherLoot: {
                  kind: string;
                  otherLootTableId: string;
                  quantity: string;
                } | null;
                pity: {
                  eligibleKillCount: number;
                  chancePerMille: number;
                };
              };
            };
          };

        expect(body.data.status).toBe(
          "Victory"
        );

        const loot = body.data.loot;

        expect(loot).not.toBeNull();

        // regularEquipment: generated and persisted, string Item Score.
        expect(
          loot.regularEquipment.generated
        ).not.toBeNull();

        expect(
          loot.regularEquipment.persisted
        ).not.toBeNull();

        expect(
          loot.regularEquipment.lossReason
        ).toBeNull();

        // BigInt-derived amounts are serialized as strings.
        expect(
          typeof loot.regularEquipment
            .generated?.itemScore
        ).toBe("string");

        expect(
          typeof loot.regularEquipment
            .generated?.itemLevel
        ).toBe("number");

        expect(
          typeof loot.regularEquipment
            .persisted?.itemId
        ).toBe("string");

        const affixes =
          loot.regularEquipment
            .generated?.affixes ?? [];

        for (
          const affix of affixes
        ) {
          expect(
            typeof affix.rollValue
          ).toBe("string");
        }

        // specialEquipment: no eligible source for this monster.
        expect(
          loot.specialEquipment.generated
        ).toBeNull();

        expect(
          loot.specialEquipment.persisted
        ).toBeNull();

        expect(
          loot.specialEquipment.lossReason
        ).toBeNull();

        expect([
          "Ineligible",
          "Failed",
          "Generated",
        ]).toContain(
          loot.specialRollOutcome
        );

        expect(
          loot.specialRollOutcome
        ).toBe("Ineligible");

        // otherLoot: present with a string-serialized quantity.
        expect(loot.otherLoot).not.toBeNull();

        expect(
          typeof loot.otherLoot?.quantity
        ).toBe("string");

        expect([
          "Material",
          "Consumable",
        ]).toContain(
          loot.otherLoot?.kind
        );

        // pity: numeric canonical state.
        expect(
          typeof loot.pity
            .eligibleKillCount
        ).toBe("number");

        expect(
          typeof loot.pity
            .chancePerMille
        ).toBe("number");
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
