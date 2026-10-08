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
  CombatAlreadyActiveError,
  InsufficientEnergyError,
} from "../../../src/modules/combat/application/combat-session.errors.js";
import {
  StartCombatService,
} from "../../../src/modules/combat/application/start-combat.service.js";
import {
  PostgresCombatSessionRepository,
} from "../../../src/modules/combat/infrastructure/postgres-combat-session.repository.js";
import {
  createTestAccount,
  deleteTestAccount,
} from "../../helpers/test-account.js";
import { PostgresCharacterRepository } from "../../../src/modules/characters/infrastructure/postgres-character.repository.js";

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

const service =
  new StartCombatService(
    combatRepository,
    clock
  );

const createdAccountIds: string[] = [];
const createdMonsterIds: string[] = [];

type Fixture = {
  accountId: string;
  characterId: string;
  monsterId: string;
  monsterCode: string;
  energyCost: number;
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
          `Combat ${randomUUID().slice(0, 8)}`,
        spellLoadoutName:
          "Default Spells",
        equipmentLoadoutName:
          "Default Equipment",
      });

  const monsterSuffix =
    randomUUID().replaceAll("-", "");

  const monsterResult =
    await testPool.query<{
      monster_id: string;
      code: string;
      energy_cost: number;
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
          energy_cost
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
          5
        FROM monster_families
        ORDER BY monster_family_id
        LIMIT 1
        RETURNING
          monster_id,
          code,
          energy_cost
      `,
      [
        `combat_test_${monsterSuffix}`,
        `Combat Test ${monsterSuffix}`,
        "Integration-test combat monster.",
      ]
    );

  const monster =
    monsterResult.rows[0];

  if (!monster) {
    throw new Error(
      "Combat start integration fixture could not create a test monster."
    );
  }

  createdMonsterIds.push(
    monster.monster_id
  );

  await testPool.query(
    `
      UPDATE characters
      SET
        current_health = 100,
        current_energy = 50,
        resources_updated_at = $2
      WHERE character_id = $1
    `,
    [
      character.characterId,
      observedAt,
    ]
  );

  return {
    accountId: account.accountId,
    characterId:
      character.characterId,
    monsterId: monster.monster_id,
    monsterCode: monster.code,
    energyCost:
      monster.energy_cost,
  };
}

async function readEnergy(
  characterId: string
): Promise<number> {
  const result =
    await testPool.query<{
      current_energy: string;
    }>(
      `
        SELECT current_energy
        FROM characters
        WHERE character_id = $1
      `,
      [characterId]
    );

  const row = result.rows[0];

  if (!row) {
    throw new Error(
      "Character was not found."
    );
  }

  return Number(row.current_energy);
}

describe(
  "Transactional combat start integration",
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
      "deducts Energy once and persists combat snapshots",
      async () => {
        const fixture =
          await createFixture();

        const result =
          await service.execute({
            accountId:
              fixture.accountId,
            characterId:
              fixture.characterId,
            monsterCode:
              fixture.monsterCode,
          });

        expect(
          await readEnergy(
            fixture.characterId
          )
        ).toBe(
          50 - fixture.energyCost
        );

        expect(result).toMatchObject({
          characterId:
            fixture.characterId,
          monsterId:
            fixture.monsterId,
          monsterCode:
            fixture.monsterCode,
          status: "Active",
          currentTurn: 1,
          defeatReason: null,
          events: [],
        });

        expect(
          result.player.currentHealth
        ).toBe(100);

        expect(
          result.player.maximumHealth
        ).toBeGreaterThan(0);

        expect(
          result.monster.maximumHealth
        ).toBeGreaterThan(0);

        const stored =
          await testPool.query<{
            count: string;
          }>(
            `
              SELECT COUNT(*)::text
                AS count
              FROM combat_sessions
              WHERE character_id = $1
                AND status = 'Active'
            `,
            [fixture.characterId]
          );

        expect(
          stored.rows[0]?.count
        ).toBe("1");
      }
    );

    it(
      "rolls back Energy when session creation fails",
      async () => {
        const fixture =
          await createFixture();

        await testPool.query(
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
              m.health,
              180,
              7,
              7,
              m.health,
              FLOOR(m.attack)::bigint,
              FLOOR(m.defense)::bigint,
              $2
            FROM monsters AS m
            WHERE m.monster_id = $3
          `,
          [
            fixture.characterId,
            observedAt,
            fixture.monsterId,
          ]
        );

        await expect(
          service.execute({
            accountId:
              fixture.accountId,
            characterId:
              fixture.characterId,
            monsterCode:
              fixture.monsterCode,
          })
        ).rejects.toBeInstanceOf(
          CombatAlreadyActiveError
        );

        expect(
          await readEnergy(
            fixture.characterId
          )
        ).toBe(50);
      }
    );

    it(
      "does not persist regeneration or a session when Energy remains insufficient",
      async () => {
        const fixture =
          await createFixture();

        const earlier = new Date(
          observedAt.getTime() - 60_000
        );

        await testPool.query(
          `
            UPDATE characters
            SET
              current_energy = 0,
              resources_updated_at = $2
            WHERE character_id = $1
          `,
          [
            fixture.characterId,
            earlier,
          ]
        );

        await expect(
          service.execute({
            accountId:
              fixture.accountId,
            characterId:
              fixture.characterId,
            monsterCode:
              fixture.monsterCode,
          })
        ).rejects.toBeInstanceOf(
          InsufficientEnergyError
        );

        expect(
          await readEnergy(
            fixture.characterId
          )
        ).toBe(0);

        const sessions =
          await testPool.query<{
            count: string;
          }>(
            `
              SELECT COUNT(*)::text
                AS count
              FROM combat_sessions
              WHERE character_id = $1
            `,
            [fixture.characterId]
          );

        expect(
          sessions.rows[0]?.count
        ).toBe("0");
      }
    );

    it(
      "allows only one of two concurrent starts to succeed",
      async () => {
        const fixture =
          await createFixture();

        const start = () =>
          service.execute({
            accountId:
              fixture.accountId,
            characterId:
              fixture.characterId,
            monsterCode:
              fixture.monsterCode,
          });

        const results =
          await Promise.allSettled([
            start(),
            start(),
          ]);

        const fulfilled =
          results.filter(
            (result) =>
              result.status ===
              "fulfilled"
          );

        const rejected =
          results.filter(
            (result) =>
              result.status ===
              "rejected"
          );

        expect(fulfilled).toHaveLength(1);
        expect(rejected).toHaveLength(1);

        if (
          rejected[0]?.status ===
          "rejected"
        ) {
          expect(
            rejected[0].reason
          ).toBeInstanceOf(
            CombatAlreadyActiveError
          );
        }

        expect(
          await readEnergy(
            fixture.characterId
          )
        ).toBe(
          50 - fixture.energyCost
        );

        const sessions =
          await testPool.query<{
            count: string;
          }>(
            `
              SELECT COUNT(*)::text
                AS count
              FROM combat_sessions
              WHERE character_id = $1
                AND status = 'Active'
            `,
            [fixture.characterId]
          );

        expect(
          sessions.rows[0]?.count
        ).toBe("1");
      }
    );
  }
);
