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
  PostgresCharacterRepository,
} from "../../../src/modules/characters/infrastructure/postgres-character.repository.js";
import {
  PostgresEquipmentRepository,
} from "../../../src/modules/characters/infrastructure/postgres-equipment.repository.js";
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
  max: 2,
  idleTimeoutMillis: 5_000,
  connectionTimeoutMillis: 5_000,
});

const characterRepository =
  new PostgresCharacterRepository(testPool);

const equipmentRepository =
  new PostgresEquipmentRepository(testPool);

const accountIds: string[] = [];
const itemBaseIds: string[] = [];
const itemIds: string[] = [];

type TestItemInput = {
  characterId: string;
  position: number;
  slot:
    | "Weapon"
    | "Shield"
    | "Helmet"
    | "Armor"
    | "Legs"
    | "Boots"
    | "Ring"
    | "Amulet";
  requiredLevel?: number;
  handedness?: "OneHanded" | "TwoHanded" | null;
  health?: number;
  isEquipped?: boolean;
};

async function createInventoryItem(
  input: TestItemInput
): Promise<string> {
  const itemBaseResult = await testPool.query<{
    item_base_id: string;
  }>(
    `
      INSERT INTO item_bases (
        code,
        name,
        description,
        item_level,
        required_level,
        slot,
        weapon_type,
        handedness,
        health
      )
      VALUES (
        $1,
        $2,
        'Equipment integration test item',
        1,
        $3,
        $4,
        $5,
        $6,
        $7
      )
      RETURNING item_base_id
    `,
    [
      `equipment_test_${randomUUID().replaceAll("-", "")}`,
      `Equipment Test ${randomUUID()}`,
      input.requiredLevel ?? 1,
      input.slot,
      input.slot === "Weapon" ? "Sword" : null,
      input.slot === "Weapon"
        ? input.handedness ?? "OneHanded"
        : null,
      input.health ?? 0,
    ]
  );

  const itemBaseId =
    itemBaseResult.rows[0]?.item_base_id;

  if (itemBaseId === undefined) {
    throw new Error("Item base was not created.");
  }

  itemBaseIds.push(itemBaseId);

  const itemResult = await testPool.query<{
    item_id: string;
  }>(
    `
      INSERT INTO items (
        item_base_id,
        item_level,
        rarity,
        item_score
      )
      VALUES ($1, 1, 'Common', 0)
      RETURNING item_id
    `,
    [itemBaseId]
  );

  const itemId = itemResult.rows[0]?.item_id;

  if (itemId === undefined) {
    throw new Error("Item was not created.");
  }

  itemIds.push(itemId);

  const inventoryResult = await testPool.query<{
    inventory_item_id: string;
  }>(
    `
      INSERT INTO inventory_items (
        character_id,
        item_id,
        position,
        is_equipped
      )
      VALUES ($1, $2, $3, $4)
      RETURNING inventory_item_id
    `,
    [
      input.characterId,
      itemId,
      input.position,
      input.isEquipped ?? false,
    ]
  );

  const inventoryItemId =
    inventoryResult.rows[0]?.inventory_item_id;

  if (inventoryItemId === undefined) {
    throw new Error("Inventory item was not created.");
  }

  return inventoryItemId;
}

async function isEquipped(
  inventoryItemId: string
): Promise<boolean> {
  const result = await testPool.query<{
    is_equipped: boolean;
  }>(
    `
      SELECT is_equipped
      FROM inventory_items
      WHERE inventory_item_id = $1
    `,
    [inventoryItemId]
  );

  return result.rows[0]?.is_equipped ?? false;
}

describe("PostgresEquipmentRepository integration", () => {
  beforeAll(async () => {
    await testPool.query("SELECT 1");
  });

  afterEach(async () => {
    while (accountIds.length > 0) {
      const accountId = accountIds.pop();

      if (accountId !== undefined) {
        await deleteTestAccount(
          testPool,
          accountId
        );
      }
    }

    while (itemIds.length > 0) {
      const itemId = itemIds.pop();

      if (itemId !== undefined) {
        await testPool.query(
          "DELETE FROM items WHERE item_id = $1",
          [itemId]
        );
      }
    }

    while (itemBaseIds.length > 0) {
      const itemBaseId = itemBaseIds.pop();

      if (itemBaseId !== undefined) {
        await testPool.query(
          `
            DELETE FROM item_bases
            WHERE item_base_id = $1
          `,
          [itemBaseId]
        );
      }
    }
  });

  afterAll(async () => {
    await testPool.end();
  });

  it("replaces an equipped item in the same slot", async () => {
    const account = await createTestAccount(testPool);
    accountIds.push(account.accountId);

    const character =
      await characterRepository.createCharacterGraph({
        accountId: account.accountId,
        seasonId: null,
        name: `Equip ${randomUUID().slice(0, 8)}`,
        spellLoadoutName: "Default Spells",
        equipmentLoadoutName: "Default Equipment",
      });

    const oldArmor = await createInventoryItem({
      characterId: character.characterId,
      position: 1,
      slot: "Armor",
      health: 50,
      isEquipped: true,
    });

    const newArmor = await createInventoryItem({
      characterId: character.characterId,
      position: 2,
      slot: "Armor",
      health: 100,
    });

    const result = await equipmentRepository.equip({
      accountId: account.accountId,
      characterId: character.characterId,
      inventoryItemId: newArmor,
    });

    expect(await isEquipped(oldArmor)).toBe(false);
    expect(await isEquipped(newArmor)).toBe(true);

    expect(
      result.effectiveStatistics.maximumHealth
    ).toBe(280);

    expect(result.resources.maximumHealth).toBe(280);
  });

  it("unequips an item and hard-clamps Health", async () => {
    const account = await createTestAccount(testPool);
    accountIds.push(account.accountId);

    const character =
      await characterRepository.createCharacterGraph({
        accountId: account.accountId,
        seasonId: null,
        name: `Clamp ${randomUUID().slice(0, 8)}`,
        spellLoadoutName: "Default Spells",
        equipmentLoadoutName: "Default Equipment",
      });

    const armor = await createInventoryItem({
      characterId: character.characterId,
      position: 1,
      slot: "Armor",
      health: 100,
      isEquipped: true,
    });

    await testPool.query(
      `
        UPDATE characters
        SET
          current_health = 280,
          max_health = 280
        WHERE character_id = $1
      `,
      [character.characterId]
    );

    const result = await equipmentRepository.unequip({
      accountId: account.accountId,
      characterId: character.characterId,
      inventoryItemId: armor,
    });

    expect(await isEquipped(armor)).toBe(false);
    expect(result.resources.maximumHealth).toBe(180);
    expect(result.resources.currentHealth).toBe(180);
  });

  it("unequips Shield when equipping a TwoHanded weapon", async () => {
    const account = await createTestAccount(testPool);
    accountIds.push(account.accountId);

    const character =
      await characterRepository.createCharacterGraph({
        accountId: account.accountId,
        seasonId: null,
        name: `TwoHanded ${randomUUID().slice(0, 8)}`,
        spellLoadoutName: "Default Spells",
        equipmentLoadoutName: "Default Equipment",
      });

    const shield = await createInventoryItem({
      characterId: character.characterId,
      position: 1,
      slot: "Shield",
      isEquipped: true,
    });

    const weapon = await createInventoryItem({
      characterId: character.characterId,
      position: 2,
      slot: "Weapon",
      handedness: "TwoHanded",
    });

    await equipmentRepository.equip({
      accountId: account.accountId,
      characterId: character.characterId,
      inventoryItemId: weapon,
    });

    expect(await isEquipped(shield)).toBe(false);
    expect(await isEquipped(weapon)).toBe(true);
  });

  it("unequips a TwoHanded weapon when equipping Shield", async () => {
    const account = await createTestAccount(testPool);
    accountIds.push(account.accountId);

    const character =
      await characterRepository.createCharacterGraph({
        accountId: account.accountId,
        seasonId: null,
        name: `Shield ${randomUUID().slice(0, 8)}`,
        spellLoadoutName: "Default Spells",
        equipmentLoadoutName: "Default Equipment",
      });

    const weapon = await createInventoryItem({
      characterId: character.characterId,
      position: 1,
      slot: "Weapon",
      handedness: "TwoHanded",
      isEquipped: true,
    });

    const shield = await createInventoryItem({
      characterId: character.characterId,
      position: 2,
      slot: "Shield",
    });

    await equipmentRepository.equip({
      accountId: account.accountId,
      characterId: character.characterId,
      inventoryItemId: shield,
    });

    expect(await isEquipped(weapon)).toBe(false);
    expect(await isEquipped(shield)).toBe(true);
  });

  it("rejects an item requiring a higher level without changing equipment", async () => {
    const account = await createTestAccount(testPool);
    accountIds.push(account.accountId);

    const character =
      await characterRepository.createCharacterGraph({
        accountId: account.accountId,
        seasonId: null,
        name: `Level ${randomUUID().slice(0, 8)}`,
        spellLoadoutName: "Default Spells",
        equipmentLoadoutName: "Default Equipment",
      });

    const oldArmor = await createInventoryItem({
      characterId: character.characterId,
      position: 1,
      slot: "Armor",
      isEquipped: true,
    });

    const highLevelArmor = await createInventoryItem({
      characterId: character.characterId,
      position: 2,
      slot: "Armor",
      requiredLevel: 100,
    });

    await expect(
      equipmentRepository.equip({
        accountId: account.accountId,
        characterId: character.characterId,
        inventoryItemId: highLevelArmor,
      })
    ).rejects.toMatchObject({
      code: "EQUIPMENT_LEVEL_REQUIRED",
    });

    expect(await isEquipped(oldArmor)).toBe(true);
    expect(await isEquipped(highLevelArmor)).toBe(false);
  });});

