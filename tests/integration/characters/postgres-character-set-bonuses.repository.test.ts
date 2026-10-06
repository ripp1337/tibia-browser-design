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
const itemIds: string[] = [];
const itemBaseIds: string[] = [];
const setTemplateIds: string[] = [];

describe("set bonuses integration", () => {
  beforeAll(async () => {
    await testPool.query("SELECT 1");
  });

  afterEach(async () => {
    while (accountIds.length > 0) {
      const id = accountIds.pop();
      if (id !== undefined) await deleteTestAccount(testPool, id);
    }

    while (itemIds.length > 0) {
      const id = itemIds.pop();
      if (id !== undefined) {
        await testPool.query("DELETE FROM items WHERE item_id = $1", [id]);
      }
    }

    while (itemBaseIds.length > 0) {
      const id = itemBaseIds.pop();
      if (id !== undefined) {
        await testPool.query("DELETE FROM item_bases WHERE item_base_id = $1", [id]);
      }
    }

    while (setTemplateIds.length > 0) {
      const id = setTemplateIds.pop();
      if (id !== undefined) {
        await testPool.query("DELETE FROM set_templates WHERE set_template_id = $1", [id]);
      }
    }
  });

  afterAll(async () => {
    await testPool.end();
  });

  it("uses only the highest reached threshold for the same bonus type", async () => {
    const account = await createTestAccount(testPool);
    accountIds.push(account.accountId);

    const character = await characterRepository.createCharacterGraph({
      accountId: account.accountId,
      seasonId: null,
      name: `Set ${randomUUID().slice(0, 8)}`,
      spellLoadoutName: "Default Spells",
      equipmentLoadoutName: "Default Equipment",
    });

    const suffix = randomUUID().replaceAll("-", "");
    const setResult = await testPool.query<{ set_template_id: string }>(
      `
        INSERT INTO set_templates (
          code, name, description, required_pieces
        )
        VALUES ($1, $2, 'Integration test set', 4)
        RETURNING set_template_id
      `,
      [`test_set_${suffix}`, `Test Set ${suffix}`]
    );

    const setTemplateId = setResult.rows[0]?.set_template_id;
    if (setTemplateId === undefined) throw new Error("Set was not created.");
    setTemplateIds.push(setTemplateId);

    await testPool.query(
      `
        INSERT INTO set_bonuses (
          set_template_id, required_pieces, bonus_type, bonus_value
        )
        VALUES
          ($1, 2, 'Attack', 10),
          ($1, 4, 'Attack', 20)
      `,
      [setTemplateId]
    );

    const slots = ["Helmet", "Armor", "Legs", "Boots"] as const;

    for (let index = 0; index < slots.length; index += 1) {
      const slot = slots[index];
      const baseResult = await testPool.query<{ item_base_id: string }>(
        `
          INSERT INTO item_bases (
            code, name, description, item_level, required_level,
            slot, set_template_id, is_set
          )
          VALUES ($1, $2, 'Integration set item', 1, 1, $3, $4, TRUE)
          RETURNING item_base_id
        `,
        [`set_item_${index}_${suffix}`, `Set Item ${index} ${suffix}`, slot, setTemplateId]
      );

      const itemBaseId = baseResult.rows[0]?.item_base_id;
      if (itemBaseId === undefined) throw new Error("Item base was not created.");
      itemBaseIds.push(itemBaseId);

      const itemResult = await testPool.query<{ item_id: string }>(
        `
          INSERT INTO items (item_base_id, item_level, rarity, item_score)
          VALUES ($1, 1, 'Common', 0)
          RETURNING item_id
        `,
        [itemBaseId]
      );

      const itemId = itemResult.rows[0]?.item_id;
      if (itemId === undefined) throw new Error("Item was not created.");
      itemIds.push(itemId);

      await testPool.query(
        `
          INSERT INTO inventory_items (
            character_id, item_id, position, is_equipped
          )
          VALUES ($1, $2, $3, TRUE)
        `,
        [character.characterId, itemId, index + 1]
      );
    }

    const result = await statisticsRepository.findCalculationSources(
      character.characterId
    );

    expect(result?.equipment.attack).toBe(20);
  });
});
