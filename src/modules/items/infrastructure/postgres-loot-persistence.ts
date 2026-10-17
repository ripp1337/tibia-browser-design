import type { PoolClient } from "pg";
import type {
  ApplyOtherLootInput,
  PersistRegularItemInput,
  PersistSpecialItemInput,
  PersistedEquipmentItem,
  UpdateUniquePityInput,
} from "../application/loot.repository.js";

export type LootPersistenceQueryable = Pick<PoolClient, "query">;

type ItemIdRow = { item_id: string };

function requireId(value: string, name: string): void {
  if (value.length === 0) throw new Error(`${name} cannot be empty.`);
}
function requirePosition(value: number): void {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error("Inventory position must be a positive safe integer.");
  }
}

async function insertInventoryAssignment(
  client: LootPersistenceQueryable,
  characterId: string,
  itemId: string,
  inventoryPosition: number
): Promise<void> {
  await client.query(`
    INSERT INTO inventory_items (character_id, item_id, position)
    VALUES ($1, $2, $3)
  `, [characterId, itemId, inventoryPosition]);
}

export async function persistRegularLootItem(
  client: LootPersistenceQueryable,
  input: PersistRegularItemInput
): Promise<PersistedEquipmentItem> {
  requireId(input.characterId, "Character ID");
  requireId(input.item.itemBaseId, "Item Base ID");
  requirePosition(input.inventoryPosition);

  const itemResult = await client.query<ItemIdRow>(`
    INSERT INTO items (
      item_base_id, item_level, required_level, rarity, item_score
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING item_id
  `, [
    input.item.itemBaseId,
    input.item.itemLevel,
    input.item.requiredLevel,
    input.item.rarity,
    input.item.itemScore.toString(),
  ]);
  const itemId = itemResult.rows[0]?.item_id;
  if (!itemId) throw new Error("Regular Item insert did not return item_id.");

  for (const affix of input.item.affixes) {
    await client.query(`
      INSERT INTO item_affixes (
        item_id, affix_template_id, affix_position, roll_value
      ) VALUES ($1, $2, $3, $4)
    `, [itemId, affix.affixTemplateId, affix.affixPosition, affix.rollValue.toString()]);
  }
  await insertInventoryAssignment(client, input.characterId, itemId, input.inventoryPosition);
  return { itemId, inventoryPosition: input.inventoryPosition };
}

export async function persistSpecialLootItem(
  client: LootPersistenceQueryable,
  input: PersistSpecialItemInput
): Promise<PersistedEquipmentItem> {
  requireId(input.characterId, "Character ID");
  requireId(input.item.itemBaseId, "Item Base ID");
  requirePosition(input.inventoryPosition);
  if (input.item.affixes.length !== 0 || input.item.rarity !== null) {
    throw new Error("Special Items cannot contain regular rarity or Affixes.");
  }

  const itemResult = await client.query<ItemIdRow>(`
    INSERT INTO items (
      item_base_id, item_level, required_level, rarity, item_score
    ) VALUES ($1, $2, $3, NULL, $4)
    RETURNING item_id
  `, [
    input.item.itemBaseId,
    input.item.itemLevel,
    input.item.requiredLevel,
    input.item.itemScore.toString(),
  ]);
  const itemId = itemResult.rows[0]?.item_id;
  if (!itemId) throw new Error("Special Item insert did not return item_id.");

  for (const stat of input.item.fixedStats) {
    await client.query(`
      INSERT INTO item_fixed_stats (
        item_id, stat_position, stat_type, roll_value
      ) VALUES ($1, $2, $3, $4)
    `, [itemId, stat.statPosition, stat.statType, stat.rollValue.toString()]);
  }
  await insertInventoryAssignment(client, input.characterId, itemId, input.inventoryPosition);
  return { itemId, inventoryPosition: input.inventoryPosition };
}

export async function applyOtherLootReward(
  client: LootPersistenceQueryable,
  input: ApplyOtherLootInput
): Promise<void> {
  requireId(input.characterId, "Character ID");
  if (input.reward.quantity < 1n) throw new Error("Other Loot quantity must be positive.");

  if (input.reward.kind === "Material") {
    await client.query(`
      INSERT INTO material_storage (character_id, material_id, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (character_id, material_id)
      DO UPDATE SET quantity = material_storage.quantity + EXCLUDED.quantity,
        updated_at = NOW()
    `, [input.characterId, input.reward.materialId, input.reward.quantity.toString()]);
    return;
  }
  await client.query(`
    INSERT INTO consumable_storage (
      character_id, consumable_definition_id, quantity
    ) VALUES ($1, $2, $3)
    ON CONFLICT (character_id, consumable_definition_id)
    DO UPDATE SET quantity = consumable_storage.quantity + EXCLUDED.quantity,
      updated_at = NOW()
  `, [input.characterId, input.reward.consumableDefinitionId, input.reward.quantity.toString()]);
}

export async function updateUniquePityState(
  client: LootPersistenceQueryable,
  input: UpdateUniquePityInput
): Promise<void> {
  requireId(input.characterId, "Character ID");
  if (!Number.isSafeInteger(input.pity.eligibleKillCount) ||
      input.pity.eligibleKillCount < 0 || input.pity.eligibleKillCount > 99) {
    throw new Error("Pity eligible kill count must be between 0 and 99.");
  }
  const expectedChance = Math.min(100, 1 + input.pity.eligibleKillCount);
  if (input.pity.chancePerMille !== expectedChance) {
    throw new Error("Pity chance does not match eligible kill count.");
  }
  await client.query(`
    UPDATE unique_pity_tracking
    SET eligible_kill_count = $2,
      current_chance_percent = $3,
      updated_at = NOW()
    WHERE character_id = $1
  `, [input.characterId, input.pity.eligibleKillCount, input.pity.chancePerMille / 10]);
}