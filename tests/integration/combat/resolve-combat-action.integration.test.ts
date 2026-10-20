import { randomUUID } from "node:crypto";

import { Pool } from "pg";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import type {
  Clock,
} from "../../../src/application/ports/clock.js";
import { env } from "../../../src/config/env.js";
import {
  CombatTurnMismatchError,
} from "../../../src/modules/combat/application/combat-session.errors.js";
import {
  ResolveCombatActionService,
} from "../../../src/modules/combat/application/resolve-combat-action.service.js";
import {
  PLAYER_ACTION_TYPE,
} from "../../../src/modules/combat/domain/combat.constants.js";
import {
  PostgresCombatSessionRepository,
  type CombatSettlementFailurePoint,
} from "../../../src/modules/combat/infrastructure/postgres-combat-session.repository.js";
import type {
  RandomSource,
} from "../../../src/modules/combat/ports/random-source.js";
import {
  PostgresCharacterRepository,
} from "../../../src/modules/characters/infrastructure/postgres-character.repository.js";
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
  max: 5,
  idleTimeoutMillis: 5_000,
  connectionTimeoutMillis: 5_000,
});

const observedAt = new Date(
  "2026-10-07T20:00:00.000Z"
);

const clock: Clock = {
  now: () => observedAt,
};

const characterRepository =
  new PostgresCharacterRepository(testPool);

const combatRepository =
  new PostgresCombatSessionRepository(testPool);

const createdAccountIds: string[] = [];

type Fixture = {
  accountId: string;
  characterId: string;
  combatSessionId: string;
};

class MissRandomSource
  implements RandomSource {
  public nextFloat(): number {
    return 0.99;
  }

  public nextInt(
    minimum: number,
    maximum: number
  ): number {
    void maximum;
    return minimum;
  }
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
    minimum: number,
    maximum: number
  ): number {
    void maximum;
    return minimum;
  }
}

class VictoryRandomSource
  implements RandomSource {
  public nextFloat(): number {
    return 0;
  }

  public nextInt(
    minimum: number,
    maximum: number
  ): number {
    void minimum;
    return maximum;
  }
}

class InvalidLootRandomSource
  implements RandomSource {
  private integerCall = 0;

  public nextFloat(): number {
    return 0;
  }

  public nextInt(
    minimum: number,
    maximum: number
  ): number {
    this.integerCall += 1;

    if (this.integerCall === 1) {
      return maximum;
    }

    if (this.integerCall === 2) {
      return minimum;
    }

    return maximum + 1;
  }
}

async function createFixture(
  monsterHealth = 100
): Promise<Fixture> {
  const account =
    await createTestAccount(testPool);

  createdAccountIds.push(
    account.accountId
  );

  const character =
    await characterRepository
      .createCharacterGraph({
        accountId: account.accountId,
        seasonId: null,
        name:
          `Action ${randomUUID().slice(0, 8)}`,
        spellLoadoutName:
          "Default Spells",
        equipmentLoadoutName:
          "Default Equipment",
      });

  const sessionResult =
    await testPool.query<{
      combat_session_id: string;
    }>(
      `
        INSERT INTO combat_sessions (
          character_id,
          monster_id,
          status,
          current_turn,
          character_health,
          character_mana,
          monster_health,
          character_maximum_health,
          character_attack,
          character_defense,
          monster_maximum_health,
          monster_attack,
          monster_defense,
          started_at
        )
        SELECT
          $1,
          m.monster_id,
          'Active',
          1,
          100,
          35,
          $2,
          100,
          20,
          10,
          $2,
          15,
          5,
          $3
        FROM monsters AS m
        WHERE m.monster_type = 'Normal'
        ORDER BY m.monster_id
        LIMIT 1
        RETURNING combat_session_id
      `,
      [
        character.characterId,
        monsterHealth,
        new Date(
          observedAt.getTime() - 60_000
        ),
      ]
    );

  const session =
    sessionResult.rows[0];

  if (!session) {
    throw new Error(
      "Combat session was not created."
    );
  }

  return {
    accountId: account.accountId,
    characterId:
      character.characterId,
    combatSessionId:
      session.combat_session_id,
  };
}

type RollbackState = {
  status: string;
  current_turn: number;
  session_health: number;
  monster_health: number;
  defeat_reason: string | null;
  ended_at: Date | null;
  settled_at: Date | null;
  level: number;
  experience: string;
  gold: string;
  character_health: string;
  total_gold_earned: string;
  total_monsters_killed: string;
  total_deaths: string;
  total_damage_dealt: string;
  total_damage_taken: string;
  highest_physical_hit: string;
  event_count: string;
  log_count: string;
  bestiary_entry_count: string;
  bestiary_statistics_count: string;
  cooldown_count: string;
  blessing_count: string;
  fight_buff_count: string;
  fight_buff_duration: string | null;
};

async function readRollbackState(
  fixture: Fixture
): Promise<RollbackState> {
  const result =
    await testPool.query<RollbackState>(
      `
        SELECT
          cs.status,
          cs.current_turn,
          cs.character_health
            AS session_health,
          cs.monster_health,
          cs.defeat_reason,
          cs.ended_at,
          cs.settled_at,
          character.level,
          character.experience,
          character.gold,
          character.current_health
            AS character_health,
          statistics.total_gold_earned,
          statistics.total_monsters_killed,
          statistics.total_deaths,
          statistics.total_damage_dealt,
          statistics.total_damage_taken,
          statistics.highest_physical_hit,
          (
            SELECT COUNT(*)::text
            FROM combat_session_events
            WHERE combat_session_id =
              cs.combat_session_id
          ) AS event_count,
          (
            SELECT COUNT(*)::text
            FROM combat_logs
            WHERE combat_session_id =
              cs.combat_session_id
          ) AS log_count,
          (
            SELECT COUNT(*)::text
            FROM bestiary_entries
            WHERE character_id =
              cs.character_id
              AND monster_id =
                cs.monster_id
          ) AS bestiary_entry_count,
          (
            SELECT COUNT(*)::text
            FROM bestiary_statistics
            WHERE character_id =
              cs.character_id
              AND monster_id =
                cs.monster_id
          ) AS bestiary_statistics_count,
          (
            SELECT COUNT(*)::text
            FROM character_cooldowns
            WHERE character_id =
              cs.character_id
              AND target_id =
                cs.monster_id
          ) AS cooldown_count,
          (
            SELECT COUNT(*)::text
            FROM character_blessings
            WHERE character_id =
              cs.character_id
          ) AS blessing_count,
          (
            SELECT COUNT(*)::text
            FROM character_buffs
            WHERE character_id =
              cs.character_id
              AND duration_type =
                'Fights'
          ) AS fight_buff_count,
          (
            SELECT
              MAX(
                duration_remaining
              )::text
            FROM character_buffs
            WHERE character_id =
              cs.character_id
              AND duration_type =
                'Fights'
          ) AS fight_buff_duration
        FROM combat_sessions AS cs
        INNER JOIN characters
          AS character
          ON character.character_id =
            cs.character_id
        INNER JOIN character_statistics
          AS statistics
          ON statistics.character_id =
            cs.character_id
        WHERE cs.combat_session_id = $1
      `,
      [
        fixture.combatSessionId,
      ]
    );

  const state = result.rows[0];

  if (!state) {
    throw new Error(
      "Rollback state was not found."
    );
  }

  return state;
}

function createService(
  randomSource: RandomSource
): ResolveCombatActionService {
  return new ResolveCombatActionService(
    combatRepository,
    randomSource,
    clock
  );
}

function actionInput(
  fixture: Fixture
) {
  return {
    accountId: fixture.accountId,
    characterId:
      fixture.characterId,
    expectedTurn: 1,
    action: {
      type:
        PLAYER_ACTION_TYPE.basicAttack,
    },
  } as const;
}

describe(
  "Transactional combat action integration",
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

    it(
      "loads authoritative settlement context under transaction locks",
      async () => {
        const fixture =
          await createFixture();

        const context =
          await combatRepository
            .withActionTransaction(
              {
                accountId:
                  fixture.accountId,
                characterId:
                  fixture.characterId,
                observedAt,
              },
              async (transaction) =>
                transaction
                  .loadSettlementContext()
            );

        expect(context).toMatchObject({
          character: {
            characterId:
              fixture.characterId,
            level: 1,
            experience: 0n,
            gold: 0n,
          },
          promoted: false,
          blessed: false,
          rewardBonuses: {
            goldBonusPercent: 0,
            experienceBonusPercent: 0,
          },
          statistics: {
            totalGoldEarned: 0n,
            totalMonstersKilled: 0n,
            totalDeaths: 0n,
            currentNoDeathStreak: 0n,
          },
        });

        expect(
          context.character.resources
            .currentHealth
        ).toBeGreaterThanOrEqual(0);

        expect(
          context.monster.powerScore
        ).toBeGreaterThanOrEqual(0n);

        expect(
          context.monster.cooldownSeconds
        ).toBeGreaterThanOrEqual(0);

        expect(context.events).toEqual([]);
        expect(context.fightBuffs).toEqual([]);
        expect(context.task).toBeNull();
        expect(context.dailyBoss).toBeNull();
      }
    );

    it(
      "persists the next state and ordered events atomically",
      async () => {
        const fixture =
          await createFixture();

        const service = createService(
          new MissRandomSource()
        );

        const result =
          await service.execute(
            actionInput(fixture)
          );

        expect(result).toMatchObject({
          combatSessionId:
            fixture.combatSessionId,
          status: "Active",
          currentTurn: 2,
        });

        const storedSession =
          await testPool.query<{
            current_turn: number;
            status: string;
          }>(
            `
              SELECT
                current_turn,
                status
              FROM combat_sessions
              WHERE combat_session_id = $1
            `,
            [
              fixture.combatSessionId,
            ]
          );

        expect(
          storedSession.rows[0]
        ).toEqual({
          current_turn: 2,
          status: "Active",
        });

        const events =
          await testPool.query<{
            turn_number: number;
            event_order: number;
            event_type: string;
          }>(
            `
              SELECT
                turn_number,
                event_order,
                event_type
              FROM combat_session_events
              WHERE combat_session_id = $1
              ORDER BY
                turn_number,
                event_order
            `,
            [
              fixture.combatSessionId,
            ]
          );

        expect(events.rows).toEqual([
          {
            turn_number: 1,
            event_order: 0,
            event_type:
              "AttackResolved",
          },
          {
            turn_number: 1,
            event_order: 1,
            event_type:
              "AttackResolved",
          },
          {
            turn_number: 1,
            event_order: 2,
            event_type:
              "TurnAdvanced",
          },
        ]);
      }
    );

    it(
      "rejects a stale turn without creating additional events",
      async () => {
        const fixture =
          await createFixture();

        const service = createService(
          new MissRandomSource()
        );

        await service.execute(
          actionInput(fixture)
        );

        await expect(
          service.execute(
            actionInput(fixture)
          )
        ).rejects.toBeInstanceOf(
          CombatTurnMismatchError
        );

        const events =
          await testPool.query<{
            count: string;
          }>(
            `
              SELECT COUNT(*)::text
                AS count
              FROM combat_session_events
              WHERE combat_session_id = $1
            `,
            [
              fixture.combatSessionId,
            ]
          );

        expect(
          events.rows[0]?.count
        ).toBe("3");
      }
    );

    it(
      "persists victory and synchronizes final character Health",
      async () => {
        const fixture =
          await createFixture(10);

        const service = createService(
          new VictoryRandomSource()
        );

        const result =
          await service.execute(
            actionInput(fixture)
          );

        expect(result).toMatchObject({
          status: "Victory",
          currentTurn: 1,
          endedAt: observedAt,
          monster: {
            currentHealth: 0,
          },
        });

        const stored =
          await testPool.query<{
            status: string;
            ended_at: Date | null;
            current_health: string;
          }>(
            `
              SELECT
                cs.status,
                cs.ended_at,
                c.current_health
              FROM combat_sessions AS cs
              INNER JOIN characters AS c
                ON c.character_id =
                  cs.character_id
              WHERE cs.combat_session_id = $1
            `,
            [
              fixture.combatSessionId,
            ]
          );

        expect(
          stored.rows[0]?.status
        ).toBe("Victory");

        expect(
          stored.rows[0]?.ended_at
        ).toEqual(observedAt);

        expect(
          stored.rows[0]?.current_health
        ).toBe("100");
      }
    );

    it(
      "rolls back Combat settlement when Loot generation fails",
      async () => {
        const fixture =
          await createFixture(10);

        const before =
          await readRollbackState(
            fixture
          );

        const service = createService(
          new InvalidLootRandomSource()
        );

        await expect(
          service.execute(
            actionInput(fixture)
          )
        ).rejects.toThrow(
          "Random Item Level is outside the canonical inclusive range."
        );

        const after =
          await readRollbackState(
            fixture
          );

        expect(after).toEqual(before);
        expect(after.status).toBe("Active");
        expect(after.event_count).toBe("0");
        expect(after.log_count).toBe("0");
        expect(after.bestiary_entry_count).toBe("0");
        expect(after.bestiary_statistics_count).toBe("0");
      }
    );

    it(
      "persists Health-depletion Defeat and applies death progression",
      async () => {
        const fixture =
          await createFixture();

        await testPool.query(
          `
            UPDATE characters
            SET
              level = 3,
              experience = 220,
              current_health = 5,
              max_health = 240,
              current_mana = 60,
              max_mana = 65,
              current_energy = 90,
              max_energy = 100
            WHERE character_id = $1
          `,
          [
            fixture.characterId,
          ]
        );

        await testPool.query(
          `
            UPDATE combat_sessions
            SET
              character_health = 5,
              character_maximum_health = 240
            WHERE combat_session_id = $1
          `,
          [
            fixture.combatSessionId,
          ]
        );

        const service = createService(
          new DefeatRandomSource()
        );

        const result =
          await service.execute(
            actionInput(fixture)
          );

        expect(result).toMatchObject({
          status: "Defeat",
          defeatReason:
            "PlayerHealthDepleted",
          currentTurn: 1,
          endedAt: observedAt,
          settledAt: observedAt,

          player: {
            currentHealth: 0,
          },

          settlement: {
            outcome: "Defeat",

            experience: {
              before: 220n,
              awarded: 0n,
              lost: 22n,
              after: 198n,
            },

            gold: {
              awarded: 0n,
            },

            level: {
              before: 3,
              after: 2,
              levelsChanged: -1,
            },

            blessingConsumed: false,
          },
        });

        const stored =
          await testPool.query<{
            status: string;
            defeat_reason: string | null;
            ended_at: Date | null;
            settled_at: Date | null;
            session_health: number;
            character_health: string;
            level: number;
            experience: string;
            total_deaths: string;
            current_no_death_streak: string;
            log_count: string;
          }>(
            `
              SELECT
                cs.status,
                cs.defeat_reason,
                cs.ended_at,
                cs.settled_at,
                cs.character_health
                  AS session_health,
                c.current_health
                  AS character_health,
                c.level,
                c.experience,
                statistics.total_deaths,
                statistics.current_no_death_streak,
                COUNT(logs.combat_log_id)::text
                  AS log_count
              FROM combat_sessions AS cs
              INNER JOIN characters AS c
                ON c.character_id =
                  cs.character_id
              INNER JOIN character_statistics
                AS statistics
                ON statistics.character_id =
                  c.character_id
              LEFT JOIN combat_logs AS logs
                ON logs.combat_session_id =
                  cs.combat_session_id
              WHERE cs.combat_session_id = $1
              GROUP BY
                cs.combat_session_id,
                c.character_id,
                statistics.character_id,
                statistics.total_deaths,
                statistics.current_no_death_streak
            `,
            [
              fixture.combatSessionId,
            ]
          );

        expect(stored.rows[0]).toEqual({
          status: "Defeat",
          defeat_reason:
            "PlayerHealthDepleted",
          ended_at: observedAt,
          settled_at: observedAt,
          session_health: "0",
          character_health: "0",
          level: 2,
          experience: "198",
          total_deaths: "1",
          current_no_death_streak: "0",
          log_count: "1",
        });
      }
    );

    it(
      "retains ten newest final logs without deleting old sessions or events",
      async () => {
        const fixture =
          await createFixture(10);

        const historicalSessionIds:
          string[] = [];

        for (
          let index = 0;
          index < 10;
          index += 1
        ) {
          const endedAt =
            new Date(
              observedAt.getTime() -
              (10 - index) * 60_000
            );

          const startedAt =
            new Date(
              endedAt.getTime() -
              30_000
            );

          const sessionInsert =
            await testPool.query<{
              combat_session_id: string;
            }>(
              `
                INSERT INTO combat_sessions (
                  character_id,
                  monster_id,
                  status,
                  current_turn,
                  character_health,
                  character_mana,
                  monster_health,
                  started_at,
                  ended_at,
                  character_maximum_health,
                  character_attack,
                  character_defense,
                  monster_maximum_health,
                  monster_attack,
                  monster_defense,
                  defeat_reason,
                  settled_at,
                  monster_experience_reward,
                  monster_gold_min,
                  monster_gold_max
                )
                SELECT
                  character_id,
                  monster_id,
                  'Victory',
                  1,
                  character_health,
                  character_mana,
                  0,
                  $2,
                  $3,
                  character_maximum_health,
                  character_attack,
                  character_defense,
                  monster_maximum_health,
                  monster_attack,
                  monster_defense,
                  NULL,
                  $3,
                  monster_experience_reward,
                  monster_gold_min,
                  monster_gold_max
                FROM combat_sessions
                WHERE combat_session_id = $1
                RETURNING
                  combat_session_id
              `,
              [
                fixture.combatSessionId,
                startedAt,
                endedAt,
              ]
            );

          const historicalSessionId =
            sessionInsert.rows[0]
              ?.combat_session_id;

          if (!historicalSessionId) {
            throw new Error(
              "Historical combat session was not created."
            );
          }

          historicalSessionIds.push(
            historicalSessionId
          );

          await testPool.query(
            `
              INSERT INTO combat_logs (
                combat_session_id,
                character_id,
                monster_id,
                combat_result,
                turn_count,
                started_at,
                ended_at,
                combat_data_json,
                created_at
              )
              SELECT
                combat_session_id,
                character_id,
                monster_id,
                'Victory',
                1,
                started_at,
                ended_at,
                jsonb_build_object(
                  'version',
                  1,
                  'sequence',
                  $2::integer
                ),
                ended_at
              FROM combat_sessions
              WHERE combat_session_id = $1
            `,
            [
              historicalSessionId,
              index + 1,
            ]
          );
        }

        const oldestSessionId =
          historicalSessionIds[0];

        if (!oldestSessionId) {
          throw new Error(
            "Oldest historical session is missing."
          );
        }

        await testPool.query(
          `
            INSERT INTO combat_session_events (
              combat_session_id,
              turn_number,
              event_order,
              event_type,
              event_data_json,
              created_at
            )
            VALUES (
              $1,
              1,
              0,
              'AttackResolved',
              $2::jsonb,
              $3
            )
          `,
          [
            oldestSessionId,
            JSON.stringify({
              type:
                "AttackResolved",
              attacker: "Player",
              defender: "Monster",
              hit: true,
              critical: false,
              damage: 1,
            }),
            new Date(
              observedAt.getTime() -
              10 * 60_000
            ),
          ]
        );

        const service = createService(
          new VictoryRandomSource()
        );

        const result =
          await service.execute(
            actionInput(fixture)
          );

        expect(
          result.settlement
        ).toMatchObject({
          outcome: "Victory",
          finalSummary: {
            combatSessionId:
              fixture.combatSessionId,
            outcome: "Victory",
            endedAt: observedAt,
          },
        });

        const retainedLogs =
          await testPool.query<{
            combat_session_id: string;
            created_at: Date;
            combat_data_json: {
              version?: number;
              outcome?: string;
              sequence?: number;
            };
          }>(
            `
              SELECT
                combat_session_id,
                created_at,
                combat_data_json
              FROM combat_logs
              WHERE character_id = $1
              ORDER BY
                created_at DESC,
                combat_log_id DESC
            `,
            [
              fixture.characterId,
            ]
          );

        expect(
          retainedLogs.rows
        ).toHaveLength(10);

        expect(
          retainedLogs.rows[0]
            ?.combat_session_id
        ).toBe(
          fixture.combatSessionId
        );

        expect(
          retainedLogs.rows[0]
            ?.combat_data_json
        ).toMatchObject({
          version: 1,
          outcome: "Victory",
        });

        expect(
          retainedLogs.rows.some(
            (row) =>
              row.combat_session_id ===
              oldestSessionId
          )
        ).toBe(false);

        const preserved =
          await testPool.query<{
            session_count: string;
            event_count: string;
          }>(
            `
              SELECT
                (
                  SELECT COUNT(*)::text
                  FROM combat_sessions
                  WHERE combat_session_id = $1
                ) AS session_count,
                (
                  SELECT COUNT(*)::text
                  FROM combat_session_events
                  WHERE combat_session_id = $1
                ) AS event_count
            `,
            [
              oldestSessionId,
            ]
          );

        expect(
          preserved.rows[0]
        ).toEqual({
          session_count: "1",
          event_count: "1",
        });

        const totalSessions =
          await testPool.query<{
            count: string;
          }>(
            `
              SELECT COUNT(*)::text
                AS count
              FROM combat_sessions
              WHERE character_id = $1
            `,
            [
              fixture.characterId,
            ]
          );

        expect(
          totalSessions.rows[0]?.count
        ).toBe("11");
      }
    );

    it(
      "isolates retention per character and resolves timestamp ties by log id",
      async () => {
        const primary =
          await createFixture(10);

        const secondary =
          await createFixture(100);

        const tiedCreatedAt =
          new Date(
            observedAt.getTime() -
            60_000
          );

        const primaryLogIds = [
          "00000000-0000-0000-0000-000000000001",
          "00000000-0000-0000-0000-000000000002",
          "00000000-0000-0000-0000-000000000003",
          "00000000-0000-0000-0000-000000000004",
          "00000000-0000-0000-0000-000000000005",
          "00000000-0000-0000-0000-000000000006",
          "00000000-0000-0000-0000-000000000007",
          "00000000-0000-0000-0000-000000000008",
          "00000000-0000-0000-0000-000000000009",
          "00000000-0000-0000-0000-00000000000a",
        ] as const;

        const secondaryLogIds = [
          "00000000-0000-0000-0000-000000000011",
          "00000000-0000-0000-0000-000000000012",
          "00000000-0000-0000-0000-000000000013",
          "00000000-0000-0000-0000-000000000014",
          "00000000-0000-0000-0000-000000000015",
          "00000000-0000-0000-0000-000000000016",
          "00000000-0000-0000-0000-000000000017",
          "00000000-0000-0000-0000-000000000018",
          "00000000-0000-0000-0000-000000000019",
          "00000000-0000-0000-0000-00000000001a",
        ] as const;

        const insertHistoricalLog =
          async (
            fixture: Fixture,
            combatLogId: string,
            sequence: number
          ): Promise<string> => {
            const startedAt =
              new Date(
                tiedCreatedAt.getTime() -
                30_000
              );

            const sessionInsert =
              await testPool.query<{
                combat_session_id: string;
              }>(
                `
                  INSERT INTO combat_sessions (
                    character_id,
                    monster_id,
                    status,
                    current_turn,
                    character_health,
                    character_mana,
                    monster_health,
                    started_at,
                    ended_at,
                    character_maximum_health,
                    character_attack,
                    character_defense,
                    monster_maximum_health,
                    monster_attack,
                    monster_defense,
                    defeat_reason,
                    settled_at,
                    monster_experience_reward,
                    monster_gold_min,
                    monster_gold_max
                  )
                  SELECT
                    character_id,
                    monster_id,
                    'Victory',
                    1,
                    character_health,
                    character_mana,
                    0,
                    $2,
                    $3,
                    character_maximum_health,
                    character_attack,
                    character_defense,
                    monster_maximum_health,
                    monster_attack,
                    monster_defense,
                    NULL,
                    $3,
                    monster_experience_reward,
                    monster_gold_min,
                    monster_gold_max
                  FROM combat_sessions
                  WHERE combat_session_id = $1
                  RETURNING
                    combat_session_id
                `,
                [
                  fixture.combatSessionId,
                  startedAt,
                  tiedCreatedAt,
                ]
              );

            const sessionId =
              sessionInsert.rows[0]
                ?.combat_session_id;

            if (!sessionId) {
              throw new Error(
                "Historical session was not created."
              );
            }

            await testPool.query(
              `
                INSERT INTO combat_logs (
                  combat_log_id,
                  combat_session_id,
                  character_id,
                  monster_id,
                  combat_result,
                  turn_count,
                  started_at,
                  ended_at,
                  combat_data_json,
                  created_at
                )
                SELECT
                  $2::uuid,
                  combat_session_id,
                  character_id,
                  monster_id,
                  'Victory',
                  1,
                  started_at,
                  ended_at,
                  jsonb_build_object(
                    'version',
                    1,
                    'sequence',
                    $3::integer
                  ),
                  $4
                FROM combat_sessions
                WHERE combat_session_id = $1
              `,
              [
                sessionId,
                combatLogId,
                sequence,
                tiedCreatedAt,
              ]
            );

            return sessionId;
          };

        const primarySessionIds:
          string[] = [];

        for (
          let index = 0;
          index < primaryLogIds.length;
          index += 1
        ) {
          const logId =
            primaryLogIds[index];

          if (!logId) {
            throw new Error(
              "Primary log ID is missing."
            );
          }

          primarySessionIds.push(
            await insertHistoricalLog(
              primary,
              logId,
              index + 1
            )
          );
        }

        for (
          let index = 0;
          index < secondaryLogIds.length;
          index += 1
        ) {
          const logId =
            secondaryLogIds[index];

          if (!logId) {
            throw new Error(
              "Secondary log ID is missing."
            );
          }

          await insertHistoricalLog(
            secondary,
            logId,
            index + 1
          );
        }

        const service = createService(
          new VictoryRandomSource()
        );

        await service.execute(
          actionInput(primary)
        );

        const primaryLogs =
          await testPool.query<{
            combat_log_id: string;
            combat_session_id: string;
          }>(
            `
              SELECT
                combat_log_id,
                combat_session_id
              FROM combat_logs
              WHERE character_id = $1
              ORDER BY
                created_at DESC,
                combat_log_id DESC
            `,
            [
              primary.characterId,
            ]
          );

        expect(
          primaryLogs.rows
        ).toHaveLength(10);

        expect(
          primaryLogs.rows[0]
            ?.combat_session_id
        ).toBe(
          primary.combatSessionId
        );

        expect(
          primaryLogs.rows.some(
            (row) =>
              row.combat_log_id ===
              primaryLogIds[0]
          )
        ).toBe(false);

        for (
          const retainedId of
          primaryLogIds.slice(1)
        ) {
          expect(
            primaryLogs.rows.some(
              (row) =>
                row.combat_log_id ===
                retainedId
            )
          ).toBe(true);
        }

        const secondaryLogs =
          await testPool.query<{
            combat_log_id: string;
          }>(
            `
              SELECT combat_log_id
              FROM combat_logs
              WHERE character_id = $1
              ORDER BY
                created_at DESC,
                combat_log_id DESC
            `,
            [
              secondary.characterId,
            ]
          );

        expect(
          secondaryLogs.rows
        ).toHaveLength(10);

        expect(
          secondaryLogs.rows.map(
            (row) =>
              row.combat_log_id
          )
        ).toEqual(
          [...secondaryLogIds].reverse()
        );

        const deletedLogSession =
          primarySessionIds[0];

        if (!deletedLogSession) {
          throw new Error(
            "Deleted log session is missing."
          );
        }

        const preservedSession =
          await testPool.query<{
            count: string;
          }>(
            `
              SELECT COUNT(*)::text
                AS count
              FROM combat_sessions
              WHERE combat_session_id = $1
            `,
            [
              deletedLogSession,
            ]
          );

        expect(
          preservedSession.rows[0]
            ?.count
        ).toBe("1");
      }
    );

    it(
      "persists turn-limit Defeat for a Normal Monster",
      async () => {
        const fixture =
          await createFixture();

        await testPool.query(
          `
            UPDATE combat_sessions
            SET current_turn = 100
            WHERE combat_session_id = $1
          `,
          [
            fixture.combatSessionId,
          ]
        );

        const service = createService(
          new MissRandomSource()
        );

        const result =
          await service.execute({
            ...actionInput(fixture),
            expectedTurn: 100,
          });

        expect(result).toMatchObject({
          status: "Defeat",
          currentTurn: 100,
          defeatReason:
            "TurnLimitExceeded",
          endedAt: observedAt,
        });

        expect(result.settlement).toMatchObject({
          outcome: "Defeat",
        });

        const stored =
          await testPool.query<{
            status: string;
            current_turn: number;
            defeat_reason:
              string | null;
            ended_at:
              Date | null;
          }>(
            `
              SELECT
                status,
                current_turn,
                defeat_reason,
                ended_at
              FROM combat_sessions
              WHERE combat_session_id = $1
            `,
            [
              fixture.combatSessionId,
            ]
          );

        expect(stored.rows[0]).toMatchObject({
          status: "Defeat",
          current_turn: 100,
          defeat_reason:
            "TurnLimitExceeded",
          ended_at: observedAt,
        });
      }
    );

    it(
      "persists Mini Boss Victory",
      async () => {
        const fixture =
          await createFixture(10);

        const miniBoss =
          await testPool.query<{
            monster_id: string;
          }>(
            `
              SELECT boss.monster_id
              FROM bosses AS boss
              WHERE boss.boss_type =
                'MiniBoss'
              ORDER BY boss.boss_id
              LIMIT 1
            `
          );

        const miniBossId =
          miniBoss.rows[0]
            ?.monster_id;

        if (!miniBossId) {
          throw new Error(
            "Mini Boss fixture was not found."
          );
        }

        await testPool.query(
          `
            UPDATE combat_sessions
            SET monster_id = $2
            WHERE combat_session_id = $1
          `,
          [
            fixture.combatSessionId,
            miniBossId,
          ]
        );

        const service = createService(
          new VictoryRandomSource()
        );

        const result =
          await service.execute(
            actionInput(fixture)
          );

        expect(result).toMatchObject({
          status: "Victory",
          monsterId: miniBossId,
          monster: {
            currentHealth: 0,
          },
          settlement: {
            outcome: "Victory",
          },
        });

        const stored =
          await testPool.query<{
            status: string;
            monster_id: string;
          }>(
            `
              SELECT
                status,
                monster_id
              FROM combat_sessions
              WHERE combat_session_id = $1
            `,
            [
              fixture.combatSessionId,
            ]
          );

        expect(stored.rows[0]).toEqual({
          status: "Victory",
          monster_id: miniBossId,
        });
      }
    );

    it(
      "persists Mini Boss Defeat",
      async () => {
        const fixture =
          await createFixture();

        const miniBoss =
          await testPool.query<{
            monster_id: string;
          }>(
            `
              SELECT boss.monster_id
              FROM bosses AS boss
              WHERE boss.boss_type =
                'MiniBoss'
              ORDER BY boss.boss_id
              LIMIT 1
            `
          );

        const miniBossId =
          miniBoss.rows[0]
            ?.monster_id;

        if (!miniBossId) {
          throw new Error(
            "Mini Boss fixture was not found."
          );
        }

        await testPool.query(
          `
            UPDATE characters
            SET current_health = 5
            WHERE character_id = $1
          `,
          [
            fixture.characterId,
          ]
        );

        await testPool.query(
          `
            UPDATE combat_sessions
            SET
              monster_id = $2,
              character_health = 5
            WHERE combat_session_id = $1
          `,
          [
            fixture.combatSessionId,
            miniBossId,
          ]
        );

        const service = createService(
          new DefeatRandomSource()
        );

        const result =
          await service.execute(
            actionInput(fixture)
          );

        expect(result).toMatchObject({
          status: "Defeat",
          monsterId: miniBossId,
          defeatReason:
            "PlayerHealthDepleted",
          player: {
            currentHealth: 0,
          },
          settlement: {
            outcome: "Defeat",
          },
        });

        const stored =
          await testPool.query<{
            status: string;
            monster_id: string;
            defeat_reason:
              string | null;
          }>(
            `
              SELECT
                status,
                monster_id,
                defeat_reason
              FROM combat_sessions
              WHERE combat_session_id = $1
            `,
            [
              fixture.combatSessionId,
            ]
          );

        expect(stored.rows[0]).toEqual({
          status: "Defeat",
          monster_id: miniBossId,
          defeat_reason:
            "PlayerHealthDepleted",
        });
      }
    );

    it(
      "persists Task progress monster Victory",
      async () => {
        const fixture =
          await createFixture(10);

        const task =
          await testPool.query<{
            progress_monster_id: string;
            required_kills: string;
          }>(
            `
              SELECT
                task.monster_id
                  AS progress_monster_id,
                task.required_kills::text
                  AS required_kills
              FROM monster_tasks AS task
              INNER JOIN bosses AS boss
                ON boss.boss_id =
                  task.boss_id
              WHERE boss.boss_type =
                'TaskBoss'
              ORDER BY
                task.monster_task_id
              LIMIT 1
            `
          );

        const taskRow =
          task.rows[0];

        if (!taskRow) {
          throw new Error(
            "Task progress fixture was not found."
          );
        }

        const requiredKills =
          BigInt(taskRow.required_kills);

        await testPool.query(
          `
            UPDATE combat_sessions
            SET monster_id = $2
            WHERE combat_session_id = $1
          `,
          [
            fixture.combatSessionId,
            taskRow.progress_monster_id,
          ]
        );

        await testPool.query(
          `
            INSERT INTO bestiary_statistics (
              character_id,
              monster_id,
              kill_count,
              first_kill_at,
              last_kill_at,
              task_progress,
              task_status,
              created_at,
              updated_at
            )
            VALUES (
              $1,
              $2,
              1,
              $3,
              $3,
              $4,
              'ACTIVE',
              $3,
              $3
            )
          `,
          [
            fixture.characterId,
            taskRow.progress_monster_id,
            new Date(
              observedAt.getTime() -
              60_000
            ),
            (
              requiredKills -
              1n
            ).toString(),
          ]
        );

        const service = createService(
          new VictoryRandomSource()
        );

        const result =
          await service.execute(
            actionInput(fixture)
          );

        expect(result).toMatchObject({
          status: "Victory",
          monsterId:
            taskRow.progress_monster_id,
          settlement: {
            outcome: "Victory",
            taskBoss: {
              progressed: true,
              status: "UNLOCKED",
            },
          },
        });

        const progress =
          await testPool.query<{
            task_progress: string;
            task_status: string;
          }>(
            `
              SELECT
                task_progress,
                task_status
              FROM bestiary_statistics
              WHERE character_id = $1
                AND monster_id = $2
            `,
            [
              fixture.characterId,
              taskRow.progress_monster_id,
            ]
          );

        expect(progress.rows[0]).toEqual({
          task_progress:
            requiredKills.toString(),
          task_status: "UNLOCKED",
        });
      }
    );

    it(
      "persists Task Boss Victory",
      async () => {
        const fixture =
          await createFixture(10);

        const task =
          await testPool.query<{
            progress_monster_id: string;
            boss_monster_id: string;
            required_kills: string;
          }>(
            `
              SELECT
                task.monster_id
                  AS progress_monster_id,
                boss.monster_id
                  AS boss_monster_id,
                task.required_kills::text
                  AS required_kills
              FROM monster_tasks AS task
              INNER JOIN bosses AS boss
                ON boss.boss_id =
                  task.boss_id
              WHERE boss.boss_type =
                'TaskBoss'
              ORDER BY
                task.monster_task_id
              LIMIT 1
            `
          );

        const taskRow =
          task.rows[0];

        if (!taskRow) {
          throw new Error(
            "Task Boss fixture was not found."
          );
        }

        await testPool.query(
          `
            UPDATE combat_sessions
            SET monster_id = $2
            WHERE combat_session_id = $1
          `,
          [
            fixture.combatSessionId,
            taskRow.boss_monster_id,
          ]
        );

        await testPool.query(
          `
            INSERT INTO bestiary_statistics (
              character_id,
              monster_id,
              kill_count,
              first_kill_at,
              last_kill_at,
              task_progress,
              task_status,
              created_at,
              updated_at
            )
            VALUES (
              $1,
              $2,
              10,
              $3,
              $3,
              $4,
              'UNLOCKED',
              $3,
              $3
            )
          `,
          [
            fixture.characterId,
            taskRow.progress_monster_id,
            new Date(
              observedAt.getTime() -
              60_000
            ),
            taskRow.required_kills,
          ]
        );

        const service = createService(
          new VictoryRandomSource()
        );

        const result =
          await service.execute(
            actionInput(fixture)
          );

        expect(result).toMatchObject({
          status: "Victory",
          monsterId:
            taskRow.boss_monster_id,
          settlement: {
            outcome: "Victory",
            taskBoss: {
              progressed: true,
              status:
                "WAITING_FOR_REUNLOCK",
            },
          },
        });

        const progress =
          await testPool.query<{
            task_progress: string;
            task_status: string;
          }>(
            `
              SELECT
                task_progress,
                task_status
              FROM bestiary_statistics
              WHERE character_id = $1
                AND monster_id = $2
            `,
            [
              fixture.characterId,
              taskRow.progress_monster_id,
            ]
          );

        expect(progress.rows[0]).toEqual({
          task_progress:
            taskRow.required_kills,
          task_status:
            "WAITING_FOR_REUNLOCK",
        });
      }
    );

    it(
      "rolls back every main Victory settlement phase",
      async () => {
        const points:
          CombatSettlementFailurePoint[] = [
            "victory.character",
            "victory.statistics",
            "victory.core",
            "victory.bestiary",
            "victory.consequences",
            "victory.finalLog",
            "victory.retention",
            "victory.terminalSession",
          ];

        for (const point of points) {
          const fixture =
            await createFixture(10);

          const before =
            await readRollbackState(
              fixture
            );

          const failure =
            new Error(
              `Injected failure at ${point}.`
            );

          const repository =
            new PostgresCombatSessionRepository(
              testPool,
              {
                settlementFailureInjector:
                  async (currentPoint) => {
                    if (
                      currentPoint === point
                    ) {
                      throw failure;
                    }
                  },
              }
            );

          const service =
            new ResolveCombatActionService(
              repository,
              new VictoryRandomSource(),
              clock
            );

          await expect(
            service.execute(
              actionInput(fixture)
            )
          ).rejects.toBe(failure);

          const after =
            await readRollbackState(
              fixture
            );

          expect(
            after,
            `Rollback mismatch at ${point}`
          ).toEqual(before);
        }
      }
    );

    it(
      "rolls back every main Defeat settlement phase",
      async () => {
        const points:
          CombatSettlementFailurePoint[] = [
            "defeat.character",
            "defeat.statistics",
            "defeat.core",
            "defeat.finalLog",
            "defeat.retention",
            "defeat.terminalSession",
          ];

        for (const point of points) {
          const fixture =
            await createFixture();

          await testPool.query(
            `
              UPDATE characters
              SET
                level = 3,
                experience = 220,
                current_health = 5,
                max_health = 240,
                current_mana = 60,
                max_mana = 65,
                current_energy = 90,
                max_energy = 100
              WHERE character_id = $1
            `,
            [
              fixture.characterId,
            ]
          );

          await testPool.query(
            `
              UPDATE combat_sessions
              SET
                character_health = 5,
                character_maximum_health =
                  240
              WHERE combat_session_id = $1
            `,
            [
              fixture.combatSessionId,
            ]
          );

          const before =
            await readRollbackState(
              fixture
            );

          const failure =
            new Error(
              `Injected failure at ${point}.`
            );

          const repository =
            new PostgresCombatSessionRepository(
              testPool,
              {
                settlementFailureInjector:
                  async (currentPoint) => {
                    if (
                      currentPoint === point
                    ) {
                      throw failure;
                    }
                  },
              }
            );

          const service =
            new ResolveCombatActionService(
              repository,
              new DefeatRandomSource(),
              clock
            );

          await expect(
            service.execute(
              actionInput(fixture)
            )
          ).rejects.toBe(failure);

          const after =
            await readRollbackState(
              fixture
            );

          expect(
            after,
            `Rollback mismatch at ${point}`
          ).toEqual(before);
        }
      }
    );

    it(
      "rolls back Victory when cooldown persistence is followed by failure",
      async () => {
        const fixture =
          await createFixture(10);

        const monster =
          await testPool.query<{
            monster_id: string;
            cooldown_seconds: number;
          }>(
            `
              SELECT
                monster.monster_id,
                monster.cooldown_seconds
              FROM combat_sessions
                AS session
              INNER JOIN monsters
                AS monster
                ON monster.monster_id =
                  session.monster_id
              WHERE
                session.combat_session_id =
                  $1
            `,
            [
              fixture.combatSessionId,
            ]
          );

        const monsterRow =
          monster.rows[0];

        if (!monsterRow) {
          throw new Error(
            "Cooldown rollback monster was not found."
          );
        }

        try {
          await testPool.query(
            `
              UPDATE monsters
              SET cooldown_seconds = 30
              WHERE monster_id = $1
            `,
            [
              monsterRow.monster_id,
            ]
          );

          const before =
            await readRollbackState(
              fixture
            );

          expect(
            before.cooldown_count
          ).toBe("0");

          const failure =
            new Error(
              "Injected failure at victory.cooldown."
            );

          const repository =
            new PostgresCombatSessionRepository(
              testPool,
              {
                settlementFailureInjector:
                  async (point) => {
                    if (
                      point ===
                      "victory.cooldown"
                    ) {
                      throw failure;
                    }
                  },
              }
            );

          const service =
            new ResolveCombatActionService(
              repository,
              new VictoryRandomSource(),
              clock
            );

          await expect(
            service.execute(
              actionInput(fixture)
            )
          ).rejects.toBe(failure);

          const after =
            await readRollbackState(
              fixture
            );

          expect(after).toEqual(before);
          expect(
            after.cooldown_count
          ).toBe("0");
          expect(after.status).toBe(
            "Active"
          );
          expect(after.log_count).toBe(
            "0"
          );
          expect(after.event_count).toBe(
            "0"
          );
        }
        finally {
          await testPool.query(
            `
              UPDATE monsters
              SET cooldown_seconds = $2
              WHERE monster_id = $1
            `,
            [
              monsterRow.monster_id,
              monsterRow.cooldown_seconds,
            ]
          );
        }
      }
    );

    it(
      "rolls back Victory fight-buff consumption",
      async () => {
        const fixture =
          await createFixture(10);

        await testPool.query(
          `
            INSERT INTO character_buffs (
              character_id,
              buff_type,
              buff_source_type,
              value,
              duration_type,
              duration_remaining,
              is_positive,
              applied_at,
              expires_at
            )
            VALUES (
              $1,
              'ExperienceBoost',
              'System',
              4.5,
              'Fights',
              1,
              TRUE,
              $2,
              NULL
            )
          `,
          [
            fixture.characterId,
            new Date(
              observedAt.getTime() -
              60_000
            ),
          ]
        );

        const before =
          await readRollbackState(
            fixture
          );

        expect(
          before.fight_buff_count
        ).toBe("1");

        expect(
          before.fight_buff_duration
        ).toBe("1");

        const failure =
          new Error(
            "Injected failure at victory.fightBuff."
          );

        const repository =
          new PostgresCombatSessionRepository(
            testPool,
            {
              settlementFailureInjector:
                async (point) => {
                  if (
                    point ===
                    "victory.fightBuff"
                  ) {
                    throw failure;
                  }
                },
            }
          );

        const service =
          new ResolveCombatActionService(
            repository,
            new VictoryRandomSource(),
            clock
          );

        await expect(
          service.execute(
            actionInput(fixture)
          )
        ).rejects.toBe(failure);

        const after =
          await readRollbackState(
            fixture
          );

        expect(after).toEqual(before);

        expect(
          after.fight_buff_duration
        ).toBe("1");

        expect(after.status).toBe(
          "Active"
        );

        expect(after.log_count).toBe(
          "0"
        );

        expect(after.event_count).toBe(
          "0"
        );
      }
    );

    it(
      "rolls back conditional Defeat Blessing and fight-buff phases",
      async () => {
        const points:
          CombatSettlementFailurePoint[] = [
            "defeat.blessing",
            "defeat.fightBuff",
          ];

        for (const point of points) {
          const fixture =
            await createFixture();

          await testPool.query(
            `
              UPDATE characters
              SET
                level = 3,
                experience = 220,
                current_health = 5,
                max_health = 240,
                current_mana = 60,
                max_mana = 65,
                current_energy = 90,
                max_energy = 100
              WHERE character_id = $1
            `,
            [
              fixture.characterId,
            ]
          );

          await testPool.query(
            `
              UPDATE combat_sessions
              SET
                character_health = 5,
                character_maximum_health =
                  240
              WHERE combat_session_id = $1
            `,
            [
              fixture.combatSessionId,
            ]
          );

          await testPool.query(
            `
              INSERT INTO character_blessings (
                character_id,
                activated_at
              )
              VALUES ($1, $2)
            `,
            [
              fixture.characterId,
              new Date(
                observedAt.getTime() -
                60_000
              ),
            ]
          );

          await testPool.query(
            `
              INSERT INTO character_buffs (
                character_id,
                buff_type,
                buff_source_type,
                value,
                duration_type,
                duration_remaining,
                is_positive,
                applied_at,
                expires_at
              )
              VALUES (
                $1,
                'GoldBoost',
                'System',
                3.5,
                'Fights',
                1,
                TRUE,
                $2,
                NULL
              )
            `,
            [
              fixture.characterId,
              new Date(
                observedAt.getTime() -
                60_000
              ),
            ]
          );

          const before =
            await readRollbackState(
              fixture
            );

          expect(
            before.blessing_count
          ).toBe("1");

          expect(
            before.fight_buff_count
          ).toBe("1");

          expect(
            before.fight_buff_duration
        ).toBe("1");

          const failure =
            new Error(
              `Injected failure at ${point}.`
            );

          const repository =
            new PostgresCombatSessionRepository(
              testPool,
              {
                settlementFailureInjector:
                  async (currentPoint) => {
                    if (
                      currentPoint === point
                    ) {
                      throw failure;
                    }
                  },
              }
            );

          const service =
            new ResolveCombatActionService(
              repository,
              new DefeatRandomSource(),
              clock
            );

          await expect(
            service.execute(
              actionInput(fixture)
            )
          ).rejects.toBe(failure);

          const after =
            await readRollbackState(
              fixture
            );

          expect(
            after,
            `Rollback mismatch at ${point}`
          ).toEqual(before);

          expect(
            after.blessing_count
          ).toBe("1");

          expect(
            after.fight_buff_duration
        ).toBe("1");

          expect(after.status).toBe(
            "Active"
          );

          expect(after.log_count).toBe(
            "0"
          );

          expect(after.event_count).toBe(
            "0"
          );
        }
      }
    );

    it(
      "rolls back Task Boss progression after Victory failure",
      async () => {
        const fixture =
          await createFixture(10);

        const task =
          await testPool.query<{
            progress_monster_id: string;
            boss_monster_id: string;
          }>(
            `
              SELECT
                task.monster_id
                  AS progress_monster_id,
                boss.monster_id
                  AS boss_monster_id
              FROM monster_tasks AS task
              INNER JOIN bosses AS boss
                ON boss.boss_id =
                  task.boss_id
              WHERE boss.boss_type =
                'TaskBoss'
              ORDER BY
                task.monster_task_id
              LIMIT 1
            `
          );

        const taskRow =
          task.rows[0];

        if (!taskRow) {
          throw new Error(
            "Task Boss rollback fixture was not found."
          );
        }

        await testPool.query(
          `
            UPDATE combat_sessions
            SET monster_id = $2
            WHERE combat_session_id = $1
          `,
          [
            fixture.combatSessionId,
            taskRow.boss_monster_id,
          ]
        );

        await testPool.query(
          `
            INSERT INTO bestiary_statistics (
              character_id,
              monster_id,
              kill_count,
              first_kill_at,
              last_kill_at,
              task_progress,
              task_status,
              created_at,
              updated_at
            )
            VALUES (
              $1,
              $2,
              10,
              $3,
              $3,
              10,
              'UNLOCKED',
              $3,
              $3
            )
            ON CONFLICT (
              character_id,
              monster_id
            )
            DO UPDATE
            SET
              task_progress = 10,
              task_status = 'UNLOCKED',
              updated_at = EXCLUDED.updated_at
          `,
          [
            fixture.characterId,
            taskRow.progress_monster_id,
            new Date(
              observedAt.getTime() -
              60_000
            ),
          ]
        );

        const readTaskState =
          async (): Promise<{
            task_progress: string;
            task_status: string;
          }> => {
            const result =
              await testPool.query<{
                task_progress: string;
                task_status: string;
              }>(
                `
                  SELECT
                    task_progress,
                    task_status
                  FROM bestiary_statistics
                  WHERE character_id = $1
                    AND monster_id = $2
                `,
                [
                  fixture.characterId,
                  taskRow.progress_monster_id,
                ]
              );

            const row = result.rows[0];

            if (!row) {
              throw new Error(
                "Task Boss progress state was not found."
              );
            }

            return row;
          };

        const beforeSession =
          await readRollbackState(
            fixture
          );

        const beforeTask =
          await readTaskState();

        expect(beforeTask).toEqual({
          task_progress: "10",
          task_status: "UNLOCKED",
        });

        const failure =
          new Error(
            "Injected failure at victory.task."
          );

        const repository =
          new PostgresCombatSessionRepository(
            testPool,
            {
              settlementFailureInjector:
                async (point) => {
                  if (
                    point ===
                    "victory.task"
                  ) {
                    throw failure;
                  }
                },
            }
          );

        const service =
          new ResolveCombatActionService(
            repository,
            new VictoryRandomSource(),
            clock
          );

        await expect(
          service.execute(
            actionInput(fixture)
          )
        ).rejects.toBe(failure);

        const afterSession =
          await readRollbackState(
            fixture
          );

        const afterTask =
          await readTaskState();

        expect(afterSession).toEqual(
          beforeSession
        );

        expect(afterTask).toEqual(
          beforeTask
        );

        expect(
          afterTask.task_status
        ).toBe("UNLOCKED");

        expect(afterSession.status).toBe(
          "Active"
        );

        expect(
          afterSession.log_count
        ).toBe("0");

        expect(
          afterSession.event_count
        ).toBe("0");
      }
    );

    it(
      "persists Daily Boss Victory",
      async () => {
        const fixture =
          await createFixture(10);

        const temporaryMonsterIds:
          string[] = [];

        const temporaryBossIds:
          string[] = [];

        const temporaryDefinitionIds:
          string[] = [];

        const createSupportDefinition =
          async (
            tier: number
          ): Promise<{
            daily_boss_definition_id:
              string;
            monster_id: string;
            tier: number;
          }> => {
            const suffix =
              randomUUID().replaceAll(
                "-",
                ""
              );

            const monster =
              await testPool.query<{
                monster_id: string;
              }>(
                `
                  INSERT INTO monsters (
                    monster_family_id,
                    name,
                    description,
                    artwork,
                    monster_type,
                    level,
                    health,
                    attack,
                    defense,
                    spell_power_percent,
                    cooldown_seconds,
                    ability_chance_percent,
                    gold_min,
                    gold_max,
                    loot_level_modifier,
                    power_score,
                    code,
                    energy_cost,
                    experience_reward
                  )
                  SELECT
                    monster_family_id,
                    $1,
                    description,
                    artwork,
                    'DailyBoss',
                    level,
                    health,
                    attack,
                    defense,
                    spell_power_percent,
                    0,
                    ability_chance_percent,
                    gold_min,
                    gold_max,
                    loot_level_modifier,
                    power_score,
                    $2,
                    energy_cost,
                    experience_reward
                  FROM monsters
                  WHERE code =
                    'dev_monster_10'
                  RETURNING monster_id
                `,
                [
                  `P14 Daily Support ${tier} ${suffix}`,
                  `p14_daily_${tier}_${suffix}`,
                ]
              );

            const monsterId =
              monster.rows[0]
                ?.monster_id;

            if (!monsterId) {
              throw new Error(
                "Temporary Daily Boss monster was not created."
              );
            }

            temporaryMonsterIds.push(
              monsterId
            );

            const boss =
              await testPool.query<{
                boss_id: string;
              }>(
                `
                  INSERT INTO bosses (
                    monster_id,
                    boss_type
                  )
                  VALUES (
                    $1,
                    'DailyBoss'
                  )
                  RETURNING boss_id
                `,
                [
                  monsterId,
                ]
              );

            const bossId =
              boss.rows[0]?.boss_id;

            if (!bossId) {
              throw new Error(
                "Temporary Daily Boss record was not created."
              );
            }

            temporaryBossIds.push(
              bossId
            );

            const definition =
              await testPool.query<{
                daily_boss_definition_id:
                  string;
              }>(
                `
                  INSERT INTO
                    daily_boss_definitions (
                      boss_id,
                      tier,
                      recommended_level,
                      attempts_per_day
                    )
                  VALUES (
                    $1,
                    $2,
                    1,
                    3
                  )
                  RETURNING
                    daily_boss_definition_id
                `,
                [
                  bossId,
                  tier,
                ]
              );

            const definitionId =
              definition.rows[0]
                ?.daily_boss_definition_id;

            if (!definitionId) {
              throw new Error(
                "Temporary Daily Boss definition was not created."
              );
            }

            temporaryDefinitionIds.push(
              definitionId
            );

            return {
              daily_boss_definition_id:
                definitionId,
              monster_id: monsterId,
              tier,
            };
          };

        const existingDefinition =
          await testPool.query<{
            daily_boss_definition_id:
              string;
            monster_id: string;
            tier: number;
          }>(
            `
              SELECT
                definition
                  .daily_boss_definition_id,
                boss.monster_id,
                definition.tier
              FROM daily_boss_definitions
                AS definition
              INNER JOIN bosses AS boss
                ON boss.boss_id =
                  definition.boss_id
              WHERE boss.boss_type =
                'DailyBoss'
              ORDER BY
                definition
                  .daily_boss_definition_id
              LIMIT 1
            `
          );

        const target =
          existingDefinition.rows[0];

        if (!target) {
          throw new Error(
            "Seeded Daily Boss definition was not found."
          );
        }

        const tierTwo =
          await createSupportDefinition(
            2
          );

        const tierThree =
          await createSupportDefinition(
            3
          );

        const rotation =
          await testPool.query<{
            daily_boss_rotation_id: string;
          }>(
            `
              INSERT INTO daily_boss_rotation (
                tier_1_boss_id,
                tier_2_boss_id,
                tier_3_boss_id,
                reset_timestamp,
                created_at
              )
              VALUES (
                $1,
                $2,
                $3,
                $4,
                $5
              )
              RETURNING
                daily_boss_rotation_id
            `,
            [
              target
                .daily_boss_definition_id,
              tierTwo
                .daily_boss_definition_id,
              tierThree
                .daily_boss_definition_id,
              new Date(
                observedAt.getTime() +
                60 * 60 * 1000
              ),
              new Date(
                observedAt.getTime() -
                60 * 60 * 1000
              ),
            ]
          );

        const rotationId =
          rotation.rows[0]
            ?.daily_boss_rotation_id;

        if (!rotationId) {
          throw new Error(
            "Daily Boss rollback rotation was not created."
          );
        }

        try {
          await testPool.query(
            `
              UPDATE combat_sessions
              SET monster_id = $2
              WHERE combat_session_id = $1
            `,
            [
              fixture.combatSessionId,
              target.monster_id,
            ]
          );

          await testPool.query(
            `
              INSERT INTO
                character_daily_boss_progress (
                  character_id,
                  daily_boss_definition_id,
                  daily_boss_rotation_id,
                  attempts_used_in_rotation,
                  total_attempts,
                  total_victories,
                  last_attempt_at,
                  last_victory_at,
                  highest_tier_defeated
                )
              VALUES (
                $1,
                $2,
                $3,
                1,
                1,
                0,
                $4,
                NULL,
                NULL
              )
            `,
            [
              fixture.characterId,
              target
                .daily_boss_definition_id,
              rotationId,
              observedAt,
            ]
          );

          const readDailyState =
            async (): Promise<{
              attempts_used_in_rotation:
                number;
              total_attempts: string;
              total_victories: string;
              last_attempt_at:
                Date | null;
              last_victory_at:
                Date | null;
              highest_tier_defeated:
                number | null;
            }> => {
              const result =
                await testPool.query<{
                  attempts_used_in_rotation:
                    number;
                  total_attempts: string;
                  total_victories: string;
                  last_attempt_at:
                    Date | null;
                  last_victory_at:
                    Date | null;
                  highest_tier_defeated:
                    number | null;
                }>(
                  `
                    SELECT
                      attempts_used_in_rotation,
                      total_attempts,
                      total_victories,
                      last_attempt_at,
                      last_victory_at,
                      highest_tier_defeated
                    FROM
                      character_daily_boss_progress
                    WHERE character_id = $1
                      AND
                        daily_boss_definition_id =
                          $2
                      AND
                        daily_boss_rotation_id =
                          $3
                  `,
                  [
                    fixture.characterId,
                    target
                      .daily_boss_definition_id,
                    rotationId,
                  ]
                );

              const row =
                result.rows[0];

              if (!row) {
                throw new Error(
                  "Daily Boss progress state was not found."
                );
              }

              return row;
            };

          const beforeSession =
            await readRollbackState(
              fixture
            );

          const beforeDaily =
            await readDailyState();

          expect(
            beforeDaily.total_victories
          ).toBe("0");

          expect(
            beforeDaily
              .highest_tier_defeated
          ).toBeNull();

          const service =
            createService(
              new VictoryRandomSource()
            );

          const result =
            await service.execute(
              actionInput(fixture)
            );

          expect(result).toMatchObject({
            status: "Victory",
            monsterId:
              target.monster_id,
            settlement: {
              outcome: "Victory",
            },
          });

          const afterSession =
            await readRollbackState(
              fixture
            );

          const afterDaily =
            await readDailyState();

          expect(afterSession.status).toBe(
            "Victory"
          );

          expect(
            afterSession.log_count
          ).toBe("1");

          expect(
            afterSession.event_count
          ).not.toBe("0");

          expect(
            afterDaily
              .attempts_used_in_rotation
          ).toBe(
            beforeDaily
              .attempts_used_in_rotation
          );

          expect(
            afterDaily.total_attempts
          ).toBe(
            beforeDaily.total_attempts
          );

          expect(
            afterDaily.total_victories
          ).toBe(
            (
              BigInt(
                beforeDaily
                  .total_victories
              ) +
              1n
            ).toString()
          );

          expect(
            afterDaily.last_attempt_at
          ).toEqual(
            beforeDaily.last_attempt_at
          );

          expect(
            afterDaily.last_victory_at
          ).toEqual(observedAt);

          expect(
            afterDaily
              .highest_tier_defeated
          ).toBe(target.tier);
        }
        finally {
          await testPool.query(
            `
              DELETE FROM
                character_daily_boss_progress
              WHERE character_id = $1
                AND
                  daily_boss_definition_id =
                    $2
                AND
                  daily_boss_rotation_id =
                    $3
            `,
            [
              fixture.characterId,
              target
                .daily_boss_definition_id,
              rotationId,
            ]
          );

          await testPool.query(
            `
              DELETE FROM
                daily_boss_rotation
              WHERE
                daily_boss_rotation_id =
                  $1
            `,
            [
              rotationId,
            ]
          );

          if (
            temporaryDefinitionIds
              .length > 0
          ) {
            await testPool.query(
              `
                DELETE FROM
                  daily_boss_definitions
                WHERE
                  daily_boss_definition_id =
                    ANY($1::uuid[])
              `,
              [
                temporaryDefinitionIds,
              ]
            );
          }

          if (
            temporaryBossIds.length > 0
          ) {
            await testPool.query(
              `
                DELETE FROM bosses
                WHERE boss_id =
                  ANY($1::uuid[])
              `,
              [
                temporaryBossIds,
              ]
            );
          }

          if (
            temporaryMonsterIds
              .length > 0
          ) {
            await testPool.query(
              `
                DELETE FROM monsters
                WHERE monster_id =
                  ANY($1::uuid[])
              `,
              [
                temporaryMonsterIds,
              ]
            );
          }
        }
      }
    );

    it(
      "rolls back Daily Boss Victory progress",
      async () => {
        const fixture =
          await createFixture(10);

        const temporaryMonsterIds:
          string[] = [];

        const temporaryBossIds:
          string[] = [];

        const temporaryDefinitionIds:
          string[] = [];

        const createSupportDefinition =
          async (
            tier: number
          ): Promise<{
            daily_boss_definition_id:
              string;
            monster_id: string;
            tier: number;
          }> => {
            const suffix =
              randomUUID().replaceAll(
                "-",
                ""
              );

            const monster =
              await testPool.query<{
                monster_id: string;
              }>(
                `
                  INSERT INTO monsters (
                    monster_family_id,
                    name,
                    description,
                    artwork,
                    monster_type,
                    level,
                    health,
                    attack,
                    defense,
                    spell_power_percent,
                    cooldown_seconds,
                    ability_chance_percent,
                    gold_min,
                    gold_max,
                    loot_level_modifier,
                    power_score,
                    code,
                    energy_cost,
                    experience_reward
                  )
                  SELECT
                    monster_family_id,
                    $1,
                    description,
                    artwork,
                    'DailyBoss',
                    level,
                    health,
                    attack,
                    defense,
                    spell_power_percent,
                    0,
                    ability_chance_percent,
                    gold_min,
                    gold_max,
                    loot_level_modifier,
                    power_score,
                    $2,
                    energy_cost,
                    experience_reward
                  FROM monsters
                  WHERE code =
                    'dev_monster_10'
                  RETURNING monster_id
                `,
                [
                  `P14 Daily Support ${tier} ${suffix}`,
                  `p14_daily_${tier}_${suffix}`,
                ]
              );

            const monsterId =
              monster.rows[0]
                ?.monster_id;

            if (!monsterId) {
              throw new Error(
                "Temporary Daily Boss monster was not created."
              );
            }

            temporaryMonsterIds.push(
              monsterId
            );

            const boss =
              await testPool.query<{
                boss_id: string;
              }>(
                `
                  INSERT INTO bosses (
                    monster_id,
                    boss_type
                  )
                  VALUES (
                    $1,
                    'DailyBoss'
                  )
                  RETURNING boss_id
                `,
                [
                  monsterId,
                ]
              );

            const bossId =
              boss.rows[0]?.boss_id;

            if (!bossId) {
              throw new Error(
                "Temporary Daily Boss record was not created."
              );
            }

            temporaryBossIds.push(
              bossId
            );

            const definition =
              await testPool.query<{
                daily_boss_definition_id:
                  string;
              }>(
                `
                  INSERT INTO
                    daily_boss_definitions (
                      boss_id,
                      tier,
                      recommended_level,
                      attempts_per_day
                    )
                  VALUES (
                    $1,
                    $2,
                    1,
                    3
                  )
                  RETURNING
                    daily_boss_definition_id
                `,
                [
                  bossId,
                  tier,
                ]
              );

            const definitionId =
              definition.rows[0]
                ?.daily_boss_definition_id;

            if (!definitionId) {
              throw new Error(
                "Temporary Daily Boss definition was not created."
              );
            }

            temporaryDefinitionIds.push(
              definitionId
            );

            return {
              daily_boss_definition_id:
                definitionId,
              monster_id: monsterId,
              tier,
            };
          };

        const existingDefinition =
          await testPool.query<{
            daily_boss_definition_id:
              string;
            monster_id: string;
            tier: number;
          }>(
            `
              SELECT
                definition
                  .daily_boss_definition_id,
                boss.monster_id,
                definition.tier
              FROM daily_boss_definitions
                AS definition
              INNER JOIN bosses AS boss
                ON boss.boss_id =
                  definition.boss_id
              WHERE boss.boss_type =
                'DailyBoss'
              ORDER BY
                definition
                  .daily_boss_definition_id
              LIMIT 1
            `
          );

        const target =
          existingDefinition.rows[0];

        if (!target) {
          throw new Error(
            "Seeded Daily Boss definition was not found."
          );
        }

        const tierTwo =
          await createSupportDefinition(
            2
          );

        const tierThree =
          await createSupportDefinition(
            3
          );

        const rotation =
          await testPool.query<{
            daily_boss_rotation_id: string;
          }>(
            `
              INSERT INTO daily_boss_rotation (
                tier_1_boss_id,
                tier_2_boss_id,
                tier_3_boss_id,
                reset_timestamp,
                created_at
              )
              VALUES (
                $1,
                $2,
                $3,
                $4,
                $5
              )
              RETURNING
                daily_boss_rotation_id
            `,
            [
              target
                .daily_boss_definition_id,
              tierTwo
                .daily_boss_definition_id,
              tierThree
                .daily_boss_definition_id,
              new Date(
                observedAt.getTime() +
                60 * 60 * 1000
              ),
              new Date(
                observedAt.getTime() -
                60 * 60 * 1000
              ),
            ]
          );

        const rotationId =
          rotation.rows[0]
            ?.daily_boss_rotation_id;

        if (!rotationId) {
          throw new Error(
            "Daily Boss rollback rotation was not created."
          );
        }

        try {
          await testPool.query(
            `
              UPDATE combat_sessions
              SET monster_id = $2
              WHERE combat_session_id = $1
            `,
            [
              fixture.combatSessionId,
              target.monster_id,
            ]
          );

          await testPool.query(
            `
              INSERT INTO
                character_daily_boss_progress (
                  character_id,
                  daily_boss_definition_id,
                  daily_boss_rotation_id,
                  attempts_used_in_rotation,
                  total_attempts,
                  total_victories,
                  last_attempt_at,
                  last_victory_at,
                  highest_tier_defeated
                )
              VALUES (
                $1,
                $2,
                $3,
                1,
                1,
                0,
                $4,
                NULL,
                NULL
              )
            `,
            [
              fixture.characterId,
              target
                .daily_boss_definition_id,
              rotationId,
              observedAt,
            ]
          );

          const readDailyState =
            async (): Promise<{
              attempts_used_in_rotation:
                number;
              total_attempts: string;
              total_victories: string;
              last_attempt_at:
                Date | null;
              last_victory_at:
                Date | null;
              highest_tier_defeated:
                number | null;
            }> => {
              const result =
                await testPool.query<{
                  attempts_used_in_rotation:
                    number;
                  total_attempts: string;
                  total_victories: string;
                  last_attempt_at:
                    Date | null;
                  last_victory_at:
                    Date | null;
                  highest_tier_defeated:
                    number | null;
                }>(
                  `
                    SELECT
                      attempts_used_in_rotation,
                      total_attempts,
                      total_victories,
                      last_attempt_at,
                      last_victory_at,
                      highest_tier_defeated
                    FROM
                      character_daily_boss_progress
                    WHERE character_id = $1
                      AND
                        daily_boss_definition_id =
                          $2
                      AND
                        daily_boss_rotation_id =
                          $3
                  `,
                  [
                    fixture.characterId,
                    target
                      .daily_boss_definition_id,
                    rotationId,
                  ]
                );

              const row =
                result.rows[0];

              if (!row) {
                throw new Error(
                  "Daily Boss progress state was not found."
                );
              }

              return row;
            };

          const beforeSession =
            await readRollbackState(
              fixture
            );

          const beforeDaily =
            await readDailyState();

          expect(
            beforeDaily.total_victories
          ).toBe("0");

          expect(
            beforeDaily
              .highest_tier_defeated
          ).toBeNull();

          const failure =
            new Error(
              "Injected failure at victory.dailyBoss."
            );

          const repository =
            new PostgresCombatSessionRepository(
              testPool,
              {
                settlementFailureInjector:
                  async (point) => {
                    if (
                      point ===
                      "victory.dailyBoss"
                    ) {
                      throw failure;
                    }
                  },
              }
            );

          const service =
            new ResolveCombatActionService(
              repository,
              new VictoryRandomSource(),
              clock
            );

          await expect(
            service.execute(
              actionInput(fixture)
            )
          ).rejects.toBe(failure);

          const afterSession =
            await readRollbackState(
              fixture
            );

          const afterDaily =
            await readDailyState();

          expect(afterSession).toEqual(
            beforeSession
          );

          expect(afterDaily).toEqual(
            beforeDaily
          );

          expect(
            afterDaily.total_victories
          ).toBe("0");

          expect(
            afterDaily
              .last_victory_at
          ).toBeNull();

          expect(afterSession.status).toBe(
            "Active"
          );

          expect(
            afterSession.log_count
          ).toBe("0");

          expect(
            afterSession.event_count
          ).toBe("0");
        }
        finally {
          await testPool.query(
            `
              DELETE FROM
                character_daily_boss_progress
              WHERE character_id = $1
                AND
                  daily_boss_definition_id =
                    $2
                AND
                  daily_boss_rotation_id =
                    $3
            `,
            [
              fixture.characterId,
              target
                .daily_boss_definition_id,
              rotationId,
            ]
          );

          await testPool.query(
            `
              DELETE FROM
                daily_boss_rotation
              WHERE
                daily_boss_rotation_id =
                  $1
            `,
            [
              rotationId,
            ]
          );

          if (
            temporaryDefinitionIds
              .length > 0
          ) {
            await testPool.query(
              `
                DELETE FROM
                  daily_boss_definitions
                WHERE
                  daily_boss_definition_id =
                    ANY($1::uuid[])
              `,
              [
                temporaryDefinitionIds,
              ]
            );
          }

          if (
            temporaryBossIds.length > 0
          ) {
            await testPool.query(
              `
                DELETE FROM bosses
                WHERE boss_id =
                  ANY($1::uuid[])
              `,
              [
                temporaryBossIds,
              ]
            );
          }

          if (
            temporaryMonsterIds
              .length > 0
          ) {
            await testPool.query(
              `
                DELETE FROM monsters
                WHERE monster_id =
                  ANY($1::uuid[])
              `,
              [
                temporaryMonsterIds,
              ]
            );
          }
        }
      }
    );

    it(
      "applies cooldown after Victory",
      async () => {
        const fixture =
          await createFixture(10);

        const monster =
          await testPool.query<{
            monster_id: string;
            cooldown_seconds: number;
          }>(
            `
              SELECT
                monster.monster_id,
                monster.cooldown_seconds
              FROM combat_sessions AS session
              INNER JOIN monsters AS monster
                ON monster.monster_id =
                  session.monster_id
              WHERE session.combat_session_id = $1
            `,
            [
              fixture.combatSessionId,
            ]
          );

        const monsterRow =
          monster.rows[0];

        if (!monsterRow) {
          throw new Error(
            "Cooldown test monster was not found."
          );
        }

        try {
          await testPool.query(
            `
              UPDATE monsters
              SET cooldown_seconds = 30
              WHERE monster_id = $1
            `,
            [
              monsterRow.monster_id,
            ]
          );

          const service =
            createService(
              new VictoryRandomSource()
            );

          const result =
            await service.execute(
              actionInput(fixture)
            );

          expect(result).toMatchObject({
            status: "Victory",
            settlement: {
              outcome: "Victory",
              cooldown: {
                applied: true,
                availableAt: new Date(
                  observedAt.getTime() +
                  30_000
                ),
              },
            },
          });

          const storedCooldown =
            await testPool.query<{
              available_at: Date;
            }>(
              `
                SELECT available_at
                FROM character_cooldowns
                WHERE character_id = $1
                  AND target_id = $2
              `,
              [
                fixture.characterId,
                monsterRow.monster_id,
              ]
            );

          expect(
            storedCooldown.rows
          ).toHaveLength(1);

          expect(
            storedCooldown.rows[0]
              ?.available_at
          ).toEqual(
            new Date(
              observedAt.getTime() +
              30_000
            )
          );
        } finally {
          await testPool.query(
            `
              UPDATE monsters
              SET cooldown_seconds = $2
              WHERE monster_id = $1
            `,
            [
              monsterRow.monster_id,
              monsterRow.cooldown_seconds,
            ]
          );
        }
      }
    );
    it(
      "applies cooldown after Defeat",
      async () => {
        const fixture =
          await createFixture();

        await testPool.query(
          `
            UPDATE characters
            SET current_health = 5
            WHERE character_id = $1
          `,
          [
            fixture.characterId,
          ]
        );

        await testPool.query(
          `
            UPDATE combat_sessions
            SET character_health = 5
            WHERE combat_session_id = $1
          `,
          [
            fixture.combatSessionId,
          ]
        );

        const monster =
          await testPool.query<{
            monster_id: string;
            cooldown_seconds: number;
          }>(
            `
              SELECT
                monster.monster_id,
                monster.cooldown_seconds
              FROM combat_sessions AS session
              INNER JOIN monsters AS monster
                ON monster.monster_id =
                  session.monster_id
              WHERE session.combat_session_id = $1
            `,
            [
              fixture.combatSessionId,
            ]
          );

        const monsterRow =
          monster.rows[0];

        if (!monsterRow) {
          throw new Error(
            "Cooldown test monster was not found."
          );
        }

        try {
          await testPool.query(
            `
              UPDATE monsters
              SET cooldown_seconds = 30
              WHERE monster_id = $1
            `,
            [
              monsterRow.monster_id,
            ]
          );

          const service =
            createService(
              new DefeatRandomSource()
            );

          const result =
            await service.execute(
              actionInput(fixture)
            );

          expect(result).toMatchObject({
            status: "Defeat",
            settlement: {
              outcome: "Defeat",
              cooldown: {
                applied: true,
                availableAt: new Date(
                  observedAt.getTime() +
                  30_000
                ),
              },
            },
          });

          const storedCooldown =
            await testPool.query<{
              available_at: Date;
            }>(
              `
                SELECT available_at
                FROM character_cooldowns
                WHERE character_id = $1
                  AND target_id = $2
              `,
              [
                fixture.characterId,
                monsterRow.monster_id,
              ]
            );

          expect(
            storedCooldown.rows
          ).toHaveLength(1);

          expect(
            storedCooldown.rows[0]
              ?.available_at
          ).toEqual(
            new Date(
              observedAt.getTime() +
              30_000
            )
          );
        } finally {
          await testPool.query(
            `
              UPDATE monsters
              SET cooldown_seconds = $2
              WHERE monster_id = $1
            `,
            [
              monsterRow.monster_id,
              monsterRow.cooldown_seconds,
            ]
          );
        }
      }
    );
    it(
      "rolls back Defeat when cooldown persistence is followed by failure",
      async () => {
        const fixture =
          await createFixture();

        await testPool.query(
          `
            UPDATE characters
            SET current_health = 5
            WHERE character_id = $1
          `,
          [
            fixture.characterId,
          ]
        );

        await testPool.query(
          `
            UPDATE combat_sessions
            SET character_health = 5
            WHERE combat_session_id = $1
          `,
          [
            fixture.combatSessionId,
          ]
        );

        const monster =
          await testPool.query<{
            monster_id: string;
            cooldown_seconds: number;
          }>(
            `
              SELECT
                monster.monster_id,
                monster.cooldown_seconds
              FROM combat_sessions AS session
              INNER JOIN monsters AS monster
                ON monster.monster_id =
                  session.monster_id
              WHERE session.combat_session_id = $1
            `,
            [
              fixture.combatSessionId,
            ]
          );

        const monsterRow =
          monster.rows[0];

        if (!monsterRow) {
          throw new Error(
            "Cooldown rollback monster was not found."
          );
        }

        try {
          await testPool.query(
            `
              UPDATE monsters
              SET cooldown_seconds = 30
              WHERE monster_id = $1
            `,
            [
              monsterRow.monster_id,
            ]
          );

          const before =
            await readRollbackState(
              fixture
            );

          expect(
            before.cooldown_count
          ).toBe("0");

          const failure =
            new Error(
              "Injected failure at defeat.cooldown."
            );

          const repository =
            new PostgresCombatSessionRepository(
              testPool,
              {
                settlementFailureInjector:
                  async (point) => {
                    if (
                      point ===
                      "defeat.cooldown"
                    ) {
                      throw failure;
                    }
                  },
              }
            );

          const service =
            new ResolveCombatActionService(
              repository,
              new DefeatRandomSource(),
              clock
            );

          await expect(
            service.execute(
              actionInput(fixture)
            )
          ).rejects.toBe(failure);

          const after =
            await readRollbackState(
              fixture
            );

          expect(after).toEqual(before);
          expect(
            after.cooldown_count
          ).toBe("0");
          expect(after.status).toBe(
            "Active"
          );
          expect(after.log_count).toBe(
            "0"
          );
          expect(after.event_count).toBe(
            "0"
          );
        } finally {
          await testPool.query(
            `
              UPDATE monsters
              SET cooldown_seconds = $2
              WHERE monster_id = $1
            `,
            [
              monsterRow.monster_id,
              monsterRow.cooldown_seconds,
            ]
          );
        }
      }
    );
    it(
      "allows only one of two concurrent requests to resolve the turn",
      async () => {
        const fixture =
          await createFixture();

        const service = createService(
          new MissRandomSource()
        );

        const execute = () =>
          service.execute(
            actionInput(fixture)
          );

        const results =
          await Promise.allSettled([
            execute(),
            execute(),
          ]);

        expect(
          results.filter(
            (result) =>
              result.status ===
              "fulfilled"
          )
        ).toHaveLength(1);

        const rejected =
          results.filter(
            (result) =>
              result.status ===
              "rejected"
          );

        expect(rejected).toHaveLength(1);

        if (
          rejected[0]?.status ===
          "rejected"
        ) {
          expect(
            rejected[0].reason
          ).toBeInstanceOf(
            CombatTurnMismatchError
          );
        }

        const stored =
          await testPool.query<{
            current_turn: number;
            event_count: string;
          }>(
            `
              SELECT
                cs.current_turn,
                COUNT(cse.*)::text
                  AS event_count
              FROM combat_sessions AS cs
              LEFT JOIN combat_session_events
                AS cse
                ON cse.combat_session_id =
                  cs.combat_session_id
              WHERE cs.combat_session_id = $1
              GROUP BY
                cs.combat_session_id,
                cs.current_turn
            `,
            [
              fixture.combatSessionId,
            ]
          );

        expect(
          stored.rows[0]
        ).toEqual({
          current_turn: 2,
          event_count: "3",
        });
      }
    );
  }
);
