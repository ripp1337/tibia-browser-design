import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { env } from "../../../src/config/env.js";
import { CalculateCharacterStatsService } from "../../../src/modules/characters/application/calculate-character-stats.service.js";
import { PostgresCharacterRepository } from "../../../src/modules/characters/infrastructure/postgres-character.repository.js";
import { PostgresCharacterStatisticsRepository } from "../../../src/modules/characters/infrastructure/postgres-character-statistics.repository.js";
import { createTestAccount, deleteTestAccount } from "../../helpers/test-account.js";

const testPool = new Pool({
  host: env.database.host,
  port: env.database.port,
  database: env.database.name,
  user: env.database.user,
  password: env.database.password,
  max: 2,
  idleTimeoutMillis: 5_000,
  connectionTimeoutMillis: 5_000,
});

const characterRepository = new PostgresCharacterRepository(testPool);
const statisticsRepository = new PostgresCharacterStatisticsRepository(testPool);
const statisticsService = new CalculateCharacterStatsService(statisticsRepository);
const accountIds: string[] = [];

describe("permanent character bonuses integration", () => {
  beforeAll(async () => {
    await testPool.query("SELECT 1");
  });

  afterEach(async () => {
    while (accountIds.length > 0) {
      const accountId = accountIds.pop();

      if (accountId !== undefined) {
        await deleteTestAccount(testPool, accountId);
      }
    }
  });

  afterAll(async () => {
    await testPool.end();
  });

  it("applies all permanent bonuses to effective statistics", async () => {
    const account = await createTestAccount(testPool);
    accountIds.push(account.accountId);

    const character = await characterRepository.createCharacterGraph({
      accountId: account.accountId,
      seasonId: null,
      name: `Permanent ${randomUUID().slice(0, 8)}`,
      spellLoadoutName: "Default Spells",
      equipmentLoadoutName: "Default Equipment",
    });

    await testPool.query(
      `
        UPDATE character_permanent_bonuses
        SET
          attack = 1,
          defense = 2,
          spell_power = 3,
          health = 4,
          mana = 5,
          energy = 6,
          gold_percent = 7.5,
          experience_percent = 8.25,
          updated_at = NOW()
        WHERE character_id = $1
      `,
      [character.characterId]
    );

    const result = await statisticsService.execute({
      characterId: character.characterId,
    });

    expect(result).toEqual({
      attack: 8,
      defense: 9,
      spellPower: 103,
      maximumHealth: 184,
      maximumMana: 40,
      maximumEnergy: 106,
      goldBonusPercent: 7.5,
      experienceBonusPercent: 8.25,
    });
  });
});
