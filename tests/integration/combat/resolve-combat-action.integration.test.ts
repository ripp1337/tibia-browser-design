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

  const monsterResult =
    await testPool.query<{
      monster_id: string;
    }>(
      `
        SELECT monster_id
        FROM monsters
        ORDER BY monster_id
        LIMIT 1
      `
    );

  const monster =
    monsterResult.rows[0];

  if (!monster) {
    throw new Error(
      "Combat action integration tests require one seeded monster."
    );
  }

  await testPool.query(
    `
      UPDATE characters
      SET
        current_health = 100,
        max_health = 100
      WHERE character_id = $1
    `,
    [character.characterId]
  );

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
        VALUES (
          $1,
          $2,
          'Active',
          1,
          100,
          35,
          $3,
          100,
          20,
          10,
          $3,
          15,
          5,
          $4
        )
        RETURNING combat_session_id
      `,
      [
        character.characterId,
        monster.monster_id,
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
