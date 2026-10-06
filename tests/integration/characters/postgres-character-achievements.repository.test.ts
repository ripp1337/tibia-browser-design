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
const achievementIds: string[] = [];

describe("achievement bonuses integration", () => {
  beforeAll(async () => {
    await testPool.query("SELECT 1");
  });

  afterEach(async () => {
    while (accountIds.length > 0) {
      const id = accountIds.pop();
      if (id !== undefined) await deleteTestAccount(testPool, id);
    }

    while (achievementIds.length > 0) {
      const id = achievementIds.pop();
      if (id !== undefined) {
        await testPool.query(
          "DELETE FROM achievements WHERE achievement_id = $1",
          [id]
        );
      }
    }
  });

  afterAll(async () => {
    await testPool.end();
  });

  it("includes completed achievements and ignores incomplete ones", async () => {
    const account = await createTestAccount(testPool);
    accountIds.push(account.accountId);

    const character = await characterRepository.createCharacterGraph({
      accountId: account.accountId,
      seasonId: null,
      name: `Achievement ${randomUUID().slice(0, 8)}`,
      spellLoadoutName: "Default Spells",
      equipmentLoadoutName: "Default Equipment",
    });

    const suffix = randomUUID().replaceAll("-", "");
    const achievementResult = await testPool.query<{
      achievement_id: string;
    }>(
      `
        INSERT INTO achievements (
          code, name, description, category, objective_type,
          required_value, reward_attack, reward_defense,
          reward_gold_percent, reward_experience_percent
        )
        VALUES
          ($1, $2, 'Completed test achievement', 'Combat',
            'IntegrationTest', 1, 7, 3, 2.5, 4.5),
          ($3, $4, 'Incomplete test achievement', 'Combat',
            'IntegrationTest', 1, 1000, 1000, 1000, 1000)
        RETURNING achievement_id
      `,
      [
        `completed_${suffix}`,
        `Completed ${suffix}`,
        `incomplete_${suffix}`,
        `Incomplete ${suffix}`,
      ]
    );

    const completedId = achievementResult.rows[0]?.achievement_id;
    const incompleteId = achievementResult.rows[1]?.achievement_id;

    if (completedId === undefined || incompleteId === undefined) {
      throw new Error("Achievements were not created.");
    }

    achievementIds.push(completedId, incompleteId);

    await testPool.query(
      `
        INSERT INTO achievement_progress (
          account_id, achievement_id, current_value,
          is_completed, completed_at
        )
        VALUES
          ($1, $2, 1, TRUE, NOW()),
          ($1, $3, 0, FALSE, NULL)
      `,
      [account.accountId, completedId, incompleteId]
    );

    const result = await statisticsRepository.findCalculationSources(
      character.characterId
    );

    expect(result?.achievements).toEqual({
      attack: 7,
      defense: 3,
      goldBonusPercent: 2.5,
      experienceBonusPercent: 4.5,
    });
  });
});
