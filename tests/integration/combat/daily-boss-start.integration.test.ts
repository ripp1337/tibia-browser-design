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
  StartCombatService,
} from "../../../src/modules/combat/application/start-combat.service.js";
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
  new PostgresCharacterRepository(
    testPool
  );

const combatRepository =
  new PostgresCombatSessionRepository(
    testPool
  );

const service =
  new StartCombatService(
    combatRepository,
    clock
  );

const createdAccountIds: string[] = [];
const createdMonsterIds: string[] = [];
const createdBossIds: string[] = [];
const createdDefinitionIds: string[] = [];
const createdRotationIds: string[] = [];

type DailyBossDefinitionFixture = {
  monsterId: string;
  monsterCode: string;
  bossId: string;
  definitionId: string;
};

type DailyBossStartFixture = {
  accountId: string;
  characterId: string;
  target:
    DailyBossDefinitionFixture;
  rotationId: string;
};

async function createDailyBossDefinition(
  tier: number
): Promise<
  DailyBossDefinitionFixture
> {
  const suffix =
    randomUUID().replaceAll("-", "");

  const monsterCode =
    `start_daily_${tier}_${suffix}`;

  const monsterResult =
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
        WHERE code = 'dev_monster_10'
        RETURNING monster_id
      `,
      [
        `Start Daily Boss ${tier} ${suffix}`,
        monsterCode,
      ]
    );

  const monsterId =
    monsterResult.rows[0]
      ?.monster_id;

  if (!monsterId) {
    throw new Error(
      "Daily Boss monster was not created."
    );
  }

  createdMonsterIds.push(monsterId);

  const bossResult =
    await testPool.query<{
      boss_id: string;
    }>(
      `
        INSERT INTO bosses (
          monster_id,
          boss_type
        )
        VALUES ($1, 'DailyBoss')
        RETURNING boss_id
      `,
      [monsterId]
    );

  const bossId =
    bossResult.rows[0]?.boss_id;

  if (!bossId) {
    throw new Error(
      "Daily Boss record was not created."
    );
  }

  createdBossIds.push(bossId);

  const definitionResult =
    await testPool.query<{
      daily_boss_definition_id:
        string;
    }>(
      `
        INSERT INTO daily_boss_definitions (
          boss_id,
          tier,
          recommended_level,
          attempts_per_day
        )
        VALUES ($1, $2, 1, 3)
        RETURNING
          daily_boss_definition_id
      `,
      [
        bossId,
        tier,
      ]
    );

  const definitionId =
    definitionResult.rows[0]
      ?.daily_boss_definition_id;

  if (!definitionId) {
    throw new Error(
      "Daily Boss definition was not created."
    );
  }

  createdDefinitionIds.push(
    definitionId
  );

  return {
    monsterId,
    monsterCode,
    bossId,
    definitionId,
  };
}

async function createFixture():
Promise<DailyBossStartFixture> {
  const account =
    await createTestAccount(testPool);

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
          `Daily ${randomUUID().slice(0, 8)}`,
        spellLoadoutName:
          "Default Spells",
        equipmentLoadoutName:
          "Default Equipment",
      });

  await testPool.query(
    `
      UPDATE characters
      SET
        level = 100,
        current_health = 100,
        current_energy = 100,
        resources_updated_at = $2
      WHERE character_id = $1
    `,
    [
      character.characterId,
      observedAt,
    ]
  );

  const definitions:
    readonly [
      DailyBossDefinitionFixture,
      DailyBossDefinitionFixture,
      DailyBossDefinitionFixture,
    ] = [
      await createDailyBossDefinition(1),
      await createDailyBossDefinition(2),
      await createDailyBossDefinition(3),
    ];

  const rotationResult =
    await testPool.query<{
      daily_boss_rotation_id:
        string;
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
        definitions[0].definitionId,
        definitions[1].definitionId,
        definitions[2].definitionId,
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
    rotationResult.rows[0]
      ?.daily_boss_rotation_id;

  if (!rotationId) {
    throw new Error(
      "Daily Boss rotation was not created."
    );
  }

  createdRotationIds.push(
    rotationId
  );

  return {
    accountId:
      account.accountId,
    characterId:
      character.characterId,
    target: definitions[0],
    rotationId,
  };
}

async function readProgress(
  fixture: DailyBossStartFixture
) {
  const result =
    await testPool.query<{
      attempts_used_in_rotation:
        number;
      total_attempts: string;
      last_attempt_at: Date | null;
    }>(
      `
        SELECT
          attempts_used_in_rotation,
          total_attempts,
          last_attempt_at
        FROM character_daily_boss_progress
        WHERE character_id = $1
          AND daily_boss_definition_id = $2
          AND daily_boss_rotation_id = $3
      `,
      [
        fixture.characterId,
        fixture.target.definitionId,
        fixture.rotationId,
      ]
    );

  return result.rows[0] ?? null;
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

  return Number(
    row.current_energy
  );
}

async function cleanupFixtures():
Promise<void> {
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

  if (createdRotationIds.length > 0) {
    await testPool.query(
      `
        DELETE FROM daily_boss_rotation
        WHERE daily_boss_rotation_id =
          ANY($1::uuid[])
      `,
      [createdRotationIds]
    );

    createdRotationIds.length = 0;
  }

  if (
    createdDefinitionIds.length > 0
  ) {
    await testPool.query(
      `
        DELETE FROM daily_boss_definitions
        WHERE daily_boss_definition_id =
          ANY($1::uuid[])
      `,
      [createdDefinitionIds]
    );

    createdDefinitionIds.length = 0;
  }

  if (createdBossIds.length > 0) {
    await testPool.query(
      `
        DELETE FROM bosses
        WHERE boss_id =
          ANY($1::uuid[])
      `,
      [createdBossIds]
    );

    createdBossIds.length = 0;
  }

  if (createdMonsterIds.length > 0) {
    await testPool.query(
      `
        DELETE FROM monsters
        WHERE monster_id =
          ANY($1::uuid[])
      `,
      [createdMonsterIds]
    );

    createdMonsterIds.length = 0;
  }
}

describe(
  "Daily Boss combat start integration",
  () => {
    beforeAll(async () => {
      await testPool.query("SELECT 1");
    });

    afterEach(async () => {
      await cleanupFixtures();
    });

    afterAll(async () => {
      await testPool.end();
    });

    it(
      "creates the first progress record when combat starts",
      async () => {
        const fixture =
          await createFixture();

        await service.execute({
          accountId:
            fixture.accountId,
          characterId:
            fixture.characterId,
          monsterCode:
            fixture.target.monsterCode,
        });

        expect(
          await readProgress(fixture)
        ).toEqual({
          attempts_used_in_rotation: 1,
          total_attempts: "1",
          last_attempt_at: observedAt,
        });
      }
    );

    it(
      "increments existing progress when combat starts",
      async () => {
        const fixture =
          await createFixture();

        await testPool.query(
          `
            INSERT INTO character_daily_boss_progress (
              character_id,
              daily_boss_definition_id,
              daily_boss_rotation_id,
              attempts_used_in_rotation,
              total_attempts,
              last_attempt_at
            )
            VALUES (
              $1,
              $2,
              $3,
              1,
              7,
              $4
            )
          `,
          [
            fixture.characterId,
            fixture.target.definitionId,
            fixture.rotationId,
            new Date(
              observedAt.getTime() -
              60_000
            ),
          ]
        );

        await service.execute({
          accountId:
            fixture.accountId,
          characterId:
            fixture.characterId,
          monsterCode:
            fixture.target.monsterCode,
        });

        expect(
          await readProgress(fixture)
        ).toEqual({
          attempts_used_in_rotation: 2,
          total_attempts: "8",
          last_attempt_at: observedAt,
        });
      }
    );


    it(
      "rejects an exhausted Daily Boss attempt limit without mutation",
      async () => {
        const fixture =
          await createFixture();

        const previousAttemptAt =
          new Date(
            observedAt.getTime() -
            60_000
          );

        await testPool.query(
          `
            INSERT INTO character_daily_boss_progress (
              character_id,
              daily_boss_definition_id,
              daily_boss_rotation_id,
              attempts_used_in_rotation,
              total_attempts,
              last_attempt_at
            )
            VALUES (
              $1,
              $2,
              $3,
              3,
              9,
              $4
            )
          `,
          [
            fixture.characterId,
            fixture.target.definitionId,
            fixture.rotationId,
            previousAttemptAt,
          ]
        );

        await expect(
          service.execute({
            accountId:
              fixture.accountId,
            characterId:
              fixture.characterId,
            monsterCode:
              fixture.target.monsterCode,
          })
        ).rejects.toThrow();

        expect(
          await readProgress(fixture)
        ).toEqual({
          attempts_used_in_rotation: 3,
          total_attempts: "9",
          last_attempt_at:
            previousAttemptAt,
        });

        expect(
          await readEnergy(
            fixture.characterId
          )
        ).toBe(100);

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
            [
              fixture.characterId,
            ]
          );

        expect(
          sessions.rows[0]?.count
        ).toBe("0");
      }
    );

    it(
      "rolls back a consumed attempt when the start transaction fails",
      async () => {
        const fixture =
          await createFixture();

        await expect(
          combatRepository
            .withStartTransaction(
              {
                accountId:
                  fixture.accountId,
                characterId:
                  fixture.characterId,
                observedAt,
              },
              async (transaction) => {
                const monster =
                  await transaction
                    .findMonster(
                      fixture.target
                        .monsterCode
                    );

                if (monster === null) {
                  throw new Error(
                    "Daily Boss was not found."
                  );
                }

                await transaction
                  .consumeDailyBossAttempt(
                    monster
                  );

                throw new Error(
                  "Injected rollback after attempt."
                );
              }
            )
        ).rejects.toThrow(
          "Injected rollback after attempt."
        );

        expect(
          await readProgress(fixture)
        ).toBeNull();

        expect(
          await readEnergy(
            fixture.characterId
          )
        ).toBe(100);
      }
    );

    it(
      "allows only one concurrent request to consume the final attempt",
      async () => {
        const fixture =
          await createFixture();

        await testPool.query(
          `
            INSERT INTO character_daily_boss_progress (
              character_id,
              daily_boss_definition_id,
              daily_boss_rotation_id,
              attempts_used_in_rotation,
              total_attempts,
              last_attempt_at
            )
            VALUES (
              $1,
              $2,
              $3,
              2,
              9,
              $4
            )
          `,
          [
            fixture.characterId,
            fixture.target.definitionId,
            fixture.rotationId,
            new Date(
              observedAt.getTime() -
              60_000
            ),
          ]
        );

        const monster =
          await testPool.query<{
            energy_cost: number;
          }>(
            `
              SELECT energy_cost
              FROM monsters
              WHERE monster_id = $1
            `,
            [
              fixture.target.monsterId,
            ]
          );

        const energyCost =
          Number(
            monster.rows[0]
              ?.energy_cost
          );

        const start = () =>
          service.execute({
            accountId:
              fixture.accountId,
            characterId:
              fixture.characterId,
            monsterCode:
              fixture.target.monsterCode,
          });

        const results =
          await Promise.allSettled([
            start(),
            start(),
          ]);

        expect(
          results.filter(
            (result) =>
              result.status ===
              "fulfilled"
          )
        ).toHaveLength(1);

        expect(
          results.filter(
            (result) =>
              result.status ===
              "rejected"
          )
        ).toHaveLength(1);

        expect(
          await readProgress(fixture)
        ).toEqual({
          attempts_used_in_rotation: 3,
          total_attempts: "10",
          last_attempt_at: observedAt,
        });

        expect(
          await readEnergy(
            fixture.characterId
          )
        ).toBe(
          100 - energyCost
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
            [
              fixture.characterId,
            ]
          );

        expect(
          sessions.rows[0]?.count
        ).toBe("1");
      }
    );

  }
);
