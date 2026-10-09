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
