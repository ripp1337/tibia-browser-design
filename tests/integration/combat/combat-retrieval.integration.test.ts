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

import { env } from "../../../src/config/env.js";
import {
  CombatSessionNotFoundError,
} from "../../../src/modules/combat/application/combat-session.errors.js";
import {
  GetActiveCombatService,
} from "../../../src/modules/combat/application/get-active-combat.service.js";
import {
  GetCombatLogService,
} from "../../../src/modules/combat/application/get-combat-log.service.js";
import {
  GetCombatSessionService,
} from "../../../src/modules/combat/application/get-combat-session.service.js";
import {
  PostgresCombatSessionRepository,
} from "../../../src/modules/combat/infrastructure/postgres-combat-session.repository.js";
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
  max: 3,
  idleTimeoutMillis: 5_000,
  connectionTimeoutMillis: 5_000,
});

const repository =
  new PostgresCombatSessionRepository(
    testPool
  );

const activeService =
  new GetActiveCombatService(repository);

const sessionService =
  new GetCombatSessionService(repository);

const logService =
  new GetCombatLogService(repository);

const characterRepository =
  new PostgresCharacterRepository(
    testPool
  );

const createdAccountIds: string[] = [];

type Fixture = {
  accountId: string;
  characterId: string;
  combatSessionId: string;
};

async function createFixture():
Promise<Fixture> {
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
          `Retrieval ${randomUUID().slice(0, 8)}`,
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
        WHERE monster_type = 'Normal'
        ORDER BY monster_id
        LIMIT 1
      `
    );

  const monster =
    monsterResult.rows[0];

  if (!monster) {
    throw new Error(
      "Combat retrieval tests require one seeded monster."
    );
  }

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
          2,
          90,
          30,
          70,
          100,
          20,
          10,
          80,
          15,
          8,
          $3
        )
        RETURNING combat_session_id
      `,
      [
        character.characterId,
        monster.monster_id,
        new Date(
          "2026-10-07T20:00:00.000Z"
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
      VALUES
        (
          $1,
          1,
          1,
          'AttackResolved',
          '{"type":"AttackResolved","sequence":2}'::jsonb,
          $2
        ),
        (
          $1,
          1,
          0,
          'AttackResolved',
          '{"type":"AttackResolved","sequence":1}'::jsonb,
          $2
        ),
        (
          $1,
          1,
          2,
          'TurnAdvanced',
          '{"type":"TurnAdvanced","sequence":3}'::jsonb,
          $2
        )
    `,
    [
      session.combat_session_id,
      new Date(
        "2026-10-07T20:01:00.000Z"
      ),
    ]
  );

  return {
    accountId: account.accountId,
    characterId:
      character.characterId,
    combatSessionId:
      session.combat_session_id,
  };
}

describe(
  "Combat retrieval integration",
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
      "returns the active owned session",
      async () => {
        const fixture =
          await createFixture();

        const result =
          await activeService.execute({
            accountId:
              fixture.accountId,
            characterId:
              fixture.characterId,
          });

        expect(result).toMatchObject({
          combatSessionId:
            fixture.combatSessionId,
          characterId:
            fixture.characterId,
          status: "Active",
          currentTurn: 2,
          player: {
            currentHealth: 90,
            maximumHealth: 100,
          },
          monster: {
            currentHealth: 70,
            maximumHealth: 80,
          },
          events: [],
        });
      }
    );

    it(
      "returns a specific owned session",
      async () => {
        const fixture =
          await createFixture();

        const result =
          await sessionService.execute({
            accountId:
              fixture.accountId,
            characterId:
              fixture.characterId,
            combatSessionId:
              fixture.combatSessionId,
          });

        expect(result).toMatchObject({
          combatSessionId:
            fixture.combatSessionId,
          monsterCode:
            expect.any(String),
          status: "Active",
          events: [],
        });
      }
    );

    it(
      "returns events ordered by turn and event order",
      async () => {
        const fixture =
          await createFixture();

        const result =
          await logService.execute({
            accountId:
              fixture.accountId,
            characterId:
              fixture.characterId,
            combatSessionId:
              fixture.combatSessionId,
          });

        expect(
          result.combatSessionId
        ).toBe(
          fixture.combatSessionId
        );

        expect(
          result.events.map(
            (event) => ({
              turnNumber:
                event.turnNumber,
              eventOrder:
                event.eventOrder,
              sequence:
                (
                  event.event as {
                    sequence?: number;
                  }
                ).sequence,
            })
          )
        ).toEqual([
          {
            turnNumber: 1,
            eventOrder: 0,
            sequence: 1,
          },
          {
            turnNumber: 1,
            eventOrder: 1,
            sequence: 2,
          },
          {
            turnNumber: 1,
            eventOrder: 2,
            sequence: 3,
          },
        ]);
      }
    );

    it(
      "does not expose a session through another account",
      async () => {
        const fixture =
          await createFixture();

        const stranger =
          await createTestAccount(
            testPool
          );

        createdAccountIds.push(
          stranger.accountId
        );

        await expect(
          sessionService.execute({
            accountId:
              stranger.accountId,
            characterId:
              fixture.characterId,
            combatSessionId:
              fixture.combatSessionId,
          })
        ).rejects.toBeInstanceOf(
          CombatSessionNotFoundError
        );

        await expect(
          logService.execute({
            accountId:
              stranger.accountId,
            characterId:
              fixture.characterId,
            combatSessionId:
              fixture.combatSessionId,
          })
        ).rejects.toBeInstanceOf(
          CombatSessionNotFoundError
        );
      }
    );

    it(
      "returns not found after the session is no longer active",
      async () => {
        const fixture =
          await createFixture();

        await testPool.query(
          `
            UPDATE combat_sessions
            SET
              status = 'Abandoned',
              ended_at = $2
            WHERE combat_session_id = $1
          `,
          [
            fixture.combatSessionId,
            new Date(
              "2026-10-07T20:02:00.000Z"
            ),
          ]
        );

        await expect(
          activeService.execute({
            accountId:
              fixture.accountId,
            characterId:
              fixture.characterId,
          })
        ).rejects.toBeInstanceOf(
          CombatSessionNotFoundError
        );

        await expect(
          sessionService.execute({
            accountId:
              fixture.accountId,
            characterId:
              fixture.characterId,
            combatSessionId:
              fixture.combatSessionId,
          })
        ).resolves.toMatchObject({
          status: "Abandoned",
        });
      }
    );
  }
);
