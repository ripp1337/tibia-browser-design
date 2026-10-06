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
const createdAccountIds: string[] = [];
const createdItemIds: string[] = [];
const createdItemBaseIds: string[] = [];
const createdAffixTemplateIds: string[] = [];

describe("PostgresCharacterStatisticsRepository integration", () => {
  beforeAll(async () => {
    await testPool.query("SELECT 1");
  });

  afterEach(async () => {
    while (createdAccountIds.length > 0) {
      const accountId = createdAccountIds.pop();
      if (accountId !== undefined) {
        await deleteTestAccount(testPool, accountId);
      }
    }

    while (createdItemIds.length > 0) {
      const itemId = createdItemIds.pop();
      if (itemId !== undefined) {
        await testPool.query("DELETE FROM items WHERE item_id = $1", [itemId]);
      }
    }

    while (createdAffixTemplateIds.length > 0) {
      const affixTemplateId =
        createdAffixTemplateIds.pop();

      if (affixTemplateId !== undefined) {
        await testPool.query(
          `
            DELETE FROM affix_templates
            WHERE affix_template_id = $1
          `,
          [affixTemplateId]
        );
      }
    }

    while (createdItemBaseIds.length > 0) {
      const itemBaseId = createdItemBaseIds.pop();
      if (itemBaseId !== undefined) {
        await testPool.query("DELETE FROM item_bases WHERE item_base_id = $1", [itemBaseId]);
      }
    }
  });

  afterAll(async () => {
    await testPool.end();
  });

  it("includes equipped items and ignores unequipped items", async () => {
    const account = await createTestAccount(testPool);
    createdAccountIds.push(account.accountId);

    const character = await characterRepository.createCharacterGraph({
      accountId: account.accountId,
      seasonId: null,
      name: `Stats ${randomUUID().slice(0, 8)}`,
      spellLoadoutName: "Default Spells",
      equipmentLoadoutName: "Default Equipment",
    });

    async function createItemBase(input: {
      namePrefix: string;
      slot: "Ring" | "Amulet";
      value: number;
    }): Promise<string> {
      const result = await testPool.query<{ item_base_id: string }>(
        `
          INSERT INTO item_bases (
            code, name, description, item_level, required_level, slot,
            attack, defense, spell_power, health, mana, energy,
            gold_percent, experience_percent
          )
          VALUES ($1, $2, 'Integration test item', 1, 1, $3,
            $4, $4, $4, $4, $4, $4, $4, $4)
          RETURNING item_base_id
        `,
        [`${input.namePrefix.toLowerCase()}_${randomUUID().replaceAll("-", "")}`, `${input.namePrefix} ${randomUUID()}`, input.slot, input.value]
      );

      const itemBaseId = result.rows[0]?.item_base_id;
      if (itemBaseId === undefined) {
        throw new Error("Item base was not created.");
      }

      createdItemBaseIds.push(itemBaseId);
      return itemBaseId;
    }

    async function createItem(itemBaseId: string): Promise<string> {
      const result = await testPool.query<{ item_id: string }>(
        `
          INSERT INTO items (item_base_id, item_level, rarity, item_score)
          VALUES ($1, 1, 'Common', 0)
          RETURNING item_id
        `,
        [itemBaseId]
      );

      const itemId = result.rows[0]?.item_id;
      if (itemId === undefined) {
        throw new Error("Item was not created.");
      }

      createdItemIds.push(itemId);
      return itemId;
    }

    const equippedBaseId = await createItemBase({
      namePrefix: "Equipped",
      slot: "Ring",
      value: 5,
    });
    const unequippedBaseId = await createItemBase({
      namePrefix: "Unequipped",
      slot: "Amulet",
      value: 1000,
    });

    const equippedItemId = await createItem(equippedBaseId);
    const unequippedItemId = await createItem(unequippedBaseId);

    const affixTemplateResult =
      await testPool.query<{
        affix_template_id: string;
      }>(
        `
          INSERT INTO affix_templates (
            affix_type,
            tier,
            required_item_level,
            min_value,
            max_value
          )
          VALUES (
            'Attack',
            999999,
            1,
            0,
            1000
          )
          RETURNING affix_template_id
        `
      );

    const affixTemplateId =
      affixTemplateResult.rows[0]?.affix_template_id;

    if (affixTemplateId === undefined) {
      throw new Error(
        "Affix template was not created."
      );
    }

    createdAffixTemplateIds.push(
      affixTemplateId
    );

    await testPool.query(
      `
        INSERT INTO item_affixes (
          item_id,
          affix_template_id,
          roll_value
        )
        VALUES
          ($1, $3, 7),
          ($2, $3, 500)
      `,
      [
        equippedItemId,
        unequippedItemId,
        affixTemplateId,
      ]
    );

    await testPool.query(
      `
        INSERT INTO inventory_items (
          character_id, item_id, position, is_equipped
        )
        VALUES ($1, $2, 1, TRUE), ($1, $3, 2, FALSE)
      `,
      [character.characterId, equippedItemId, unequippedItemId]
    );

    const result = await statisticsRepository.findCalculationSources(
      character.characterId
    );

    expect(result).not.toBeNull();
    expect(result?.equipment).toEqual({
      attack: 12,
      defense: 5,
      spellPower: 5,
      maximumHealth: 5,
      maximumMana: 5,
      maximumEnergy: 5,
      goldBonusPercent: 5,
      experienceBonusPercent: 5,
    });
  });
});




