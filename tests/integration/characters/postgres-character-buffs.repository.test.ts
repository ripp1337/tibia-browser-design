import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { env } from "../../../src/config/env.js";
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
const accountIds: string[] = [];

describe("active character buffs integration", () => {
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

  it("includes only active positive supported buffs", async () => {
    const account = await createTestAccount(testPool);
    accountIds.push(account.accountId);

    const character = await characterRepository.createCharacterGraph({
      accountId: account.accountId,
      seasonId: null,
      name: `Buff ${randomUUID().slice(0, 8)}`,
      spellLoadoutName: "Default Spells",
      equipmentLoadoutName: "Default Equipment",
    });

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
        VALUES
          ($1, 'AttackBuff', 'System', 7, 'Permanent', NULL,
            TRUE, NOW(), NULL),

          ($1, 'ExperienceBoost', 'System', 4.5, 'Fights', 2,
            TRUE, NOW(), NULL),

          ($1, 'DefenseBuff', 'System', 1000, 'Turns', 0,
            TRUE, NOW(), NULL),

          ($1, 'SpellPowerBuff', 'System', 1000, 'Turns', 2,
            TRUE, NOW() - INTERVAL '2 hours',
            NOW() - INTERVAL '1 hour'),

          ($1, 'GoldBoost', 'System', 1000, 'Permanent', NULL,
            FALSE, NOW(), NULL)
      `,
      [character.characterId]
    );

    const result = await statisticsRepository.findCalculationSources(
      character.characterId
    );

    expect(result?.progressionBoosts).toEqual({
      attack: 7,
      defense: 0,
      spellPower: 0,
      goldBonusPercent: 0,
      experienceBonusPercent: 4.5,
    });
  });
});
