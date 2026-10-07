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
import { PostgresCharacterRepository } from "../../../src/modules/characters/infrastructure/postgres-character.repository.js";
import { PostgresMonsterDiscoveryRepository } from "../../../src/modules/monsters/infrastructure/postgres-monster-discovery.repository.js";
import {
  createTestAccount,
  deleteTestAccount,
  type TestAccount,
} from "../../helpers/test-account.js";

type DailyBossFixture = {
  monsterId: string;
  monsterCode: string;
  bossId: string;
  definitionId: string;
};

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
  new PostgresCharacterRepository(testPool);

const monsterRepository =
  new PostgresMonsterDiscoveryRepository(testPool);

const observedAt = new Date(
  "2099-06-15T12:00:00.000Z"
);

const createdAccountIds: string[] = [];
const createdRotationIds: string[] = [];
const createdDefinitionIds: string[] = [];
const createdBossIds: string[] = [];
const createdMonsterIds: string[] = [];

async function createTrackedAccount():
Promise<TestAccount> {
  const account = await createTestAccount(
    testPool
  );

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

async function createDailyBossFixture(
  tier: number
): Promise<DailyBossFixture> {
  const suffix = randomUUID().replaceAll(
    "-",
    ""
  );

  const monsterCode =
    `test_daily_boss_${tier}_${suffix}`;

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
          energy_cost
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
          energy_cost
        FROM monsters
        WHERE code = 'dev_monster_10'
        RETURNING monster_id
      `,
      [
        `Test Daily Boss ${tier} ${suffix}`,
        monsterCode,
      ]
    );

  const monsterId =
    monsterResult.rows[0]?.monster_id;

  if (!monsterId) {
    throw new Error(
      "Daily Boss fixture monster was not created."
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
      "Daily Boss fixture boss was not created."
    );
  }

  createdBossIds.push(bossId);

  const definitionResult =
    await testPool.query<{
      daily_boss_definition_id: string;
    }>(
      `
        INSERT INTO daily_boss_definitions (
          boss_id,
          tier,
          recommended_level,
          attempts_per_day
        )
        VALUES ($1, $2, 1, 1)
        RETURNING daily_boss_definition_id
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
      "Daily Boss fixture definition was not created."
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

async function createRotation(
  definitions:
    readonly [
      DailyBossFixture,
      DailyBossFixture,
      DailyBossFixture,
    ],
  createdAt: Date = new Date(
    "2099-06-15T11:00:00.000Z"
  ),
  resetAt: Date = new Date(
    "2099-06-15T13:00:00.000Z"
  )
): Promise<string> {
  const result =
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
        VALUES ($1, $2, $3, $4, $5)
        RETURNING daily_boss_rotation_id
      `,
      [
        definitions[0].definitionId,
        definitions[1].definitionId,
        definitions[2].definitionId,
        resetAt,
        createdAt,
      ]
    );

  const rotationId =
    result.rows[0]
      ?.daily_boss_rotation_id;

  if (!rotationId) {
    throw new Error(
      "Daily Boss rotation was not created."
    );
  }

  createdRotationIds.push(rotationId);

  return rotationId;
}

async function createDailyBossSet(): Promise<
  readonly [
    DailyBossFixture,
    DailyBossFixture,
    DailyBossFixture,
  ]
> {
  return [
    await createDailyBossFixture(1),
    await createDailyBossFixture(2),
    await createDailyBossFixture(3),
  ];
}

async function cleanupFixtures(): Promise<void> {
  if (createdRotationIds.length > 0) {
    await testPool.query(
      `
        DELETE FROM character_daily_boss_progress
        WHERE daily_boss_rotation_id =
          ANY($1::uuid[])
      `,
      [createdRotationIds]
    );

    await testPool.query(
      `
        DELETE FROM daily_boss_rotation
        WHERE daily_boss_rotation_id =
          ANY($1::uuid[])
      `,
      [createdRotationIds]
    );
  }

  while (createdAccountIds.length > 0) {
    const accountId =
      createdAccountIds.pop();

    if (accountId) {
      await deleteTestAccount(
        testPool,
        accountId
      );
    }
  }

  if (createdDefinitionIds.length > 0) {
    await testPool.query(
      `
        DELETE FROM daily_boss_definitions
        WHERE daily_boss_definition_id =
          ANY($1::uuid[])
      `,
      [createdDefinitionIds]
    );
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
  }

  createdRotationIds.length = 0;
  createdDefinitionIds.length = 0;
  createdBossIds.length = 0;
  createdMonsterIds.length = 0;
}

describe(
  "Daily Boss discovery integration",
  () => {
    beforeAll(async () => {
      await testPool.query("SELECT 1");
    });

    afterEach(async () => {
      await cleanupFixtures();
    });

    afterAll(async () => {
      await cleanupFixtures();
      await testPool.end();
    });

    it("marks a Daily Boss outside the active rotation as unavailable", async () => {
      const account =
        await createTrackedAccount();

      const character =
        await createCharacter(
          account.accountId,
          `NoRot-${randomUUID().slice(0, 8)}`
        );

      const details =
        await monsterRepository.findMonster({
          accountId: account.accountId,
          characterId:
            character.characterId,
          monsterCode: "dev_monster_10",
          observedAt,
        });

      expect(details).toMatchObject({
        code: "dev_monster_10",
        dailyBossAvailable: false,
        dailyAttemptsUsed: 0,
      });
    });

    it("loads an active Daily Boss with remaining attempts", async () => {
      const account =
        await createTrackedAccount();

      const character =
        await createCharacter(
          account.accountId,
          `Active-${randomUUID().slice(0, 8)}`
        );

      const definitions =
        await createDailyBossSet();

      await createRotation(definitions);

      const details =
        await monsterRepository.findMonster({
          accountId: account.accountId,
          characterId:
            character.characterId,
          monsterCode:
            definitions[0].monsterCode,
          observedAt,
        });

      expect(details).toMatchObject({
        code: definitions[0].monsterCode,
        dailyBossAvailable: true,
        dailyAttemptsUsed: 0,
        dailyAttemptsPerDay: 1,
      });
    });

    it("loads exhausted attempts for the active rotation", async () => {
      const account =
        await createTrackedAccount();

      const character =
        await createCharacter(
          account.accountId,
          `Exhaust-${randomUUID().slice(0, 8)}`
        );

      const definitions =
        await createDailyBossSet();

      const rotationId =
        await createRotation(definitions);

      await testPool.query(
        `
          INSERT INTO character_daily_boss_progress (
            character_id,
            daily_boss_definition_id,
            daily_boss_rotation_id,
            attempts_used_in_rotation
          )
          VALUES ($1, $2, $3, 1)
        `,
        [
          character.characterId,
          definitions[0].definitionId,
          rotationId,
        ]
      );

      const details =
        await monsterRepository.findMonster({
          accountId: account.accountId,
          characterId:
            character.characterId,
          monsterCode:
            definitions[0].monsterCode,
          observedAt,
        });

      expect(details).toMatchObject({
        dailyBossAvailable: true,
        dailyAttemptsUsed: 1,
        dailyAttemptsPerDay: 1,
      });
    });

    it("rejects overlapping active rotations", async () => {
      const account =
        await createTrackedAccount();

      const character =
        await createCharacter(
          account.accountId,
          `Overlap-${randomUUID().slice(0, 8)}`
        );

      const definitions =
        await createDailyBossSet();

      await createRotation(definitions);

      await createRotation(
        definitions,
        new Date(
          "2099-06-15T11:30:00.000Z"
        ),
        new Date(
          "2099-06-15T13:30:00.000Z"
        )
      );

      await expect(
        monsterRepository.listMonsters({
          accountId: account.accountId,
          characterId:
            character.characterId,
          observedAt,
        })
      ).rejects.toThrow(
        "Multiple active Daily Boss rotations were found."
      );
    });
  }
);

