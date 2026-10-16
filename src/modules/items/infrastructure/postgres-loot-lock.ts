import type { PoolClient } from "pg";
import type { LockedLootCharacter } from "../application/loot.repository.js";

export type LootLockQueryable = Pick<PoolClient, "query">;

type CharacterLockRow = {
  character_id: string;
  inventory_slots: number;
};

type InventoryPositionRow = {
  position: number;
};

type PityRow = {
  eligible_kill_count: string;
  current_chance_percent: string;
};

function parseIntegerInRange(
  value: string | number,
  minimum: number,
  maximum: number,
  fieldName: string
): number {
  const parsed = Number(value);
  if (
    !Number.isSafeInteger(parsed) ||
    parsed < minimum ||
    parsed > maximum
  ) {
    throw new Error(
      `${fieldName} must be an integer between ${minimum} and ${maximum}.`
    );
  }
  return parsed;
}

export async function lockLootCharacterState(
  client: LootLockQueryable,
  characterId: string
): Promise<LockedLootCharacter> {
  if (characterId.length === 0) {
    throw new Error("Character ID cannot be empty.");
  }

  const characterResult = await client.query<CharacterLockRow>(`
    SELECT c.character_id, u.inventory_slots
    FROM characters AS c
    INNER JOIN character_unlocks AS u
      ON u.character_id = c.character_id
    WHERE c.character_id = $1
      AND c.status = 'IsActive'
    FOR UPDATE OF c, u
  `, [characterId]);
  const character = characterResult.rows[0];
  if (!character) {
    throw new Error("Active loot character was not found.");
  }

  const inventoryResult = await client.query<InventoryPositionRow>(`
    SELECT position
    FROM inventory_items
    WHERE character_id = $1
    ORDER BY position
    FOR UPDATE
  `, [characterId]);

  await client.query(`
    INSERT INTO unique_pity_tracking (character_id)
    VALUES ($1)
    ON CONFLICT (character_id) DO NOTHING
  `, [characterId]);

  const pityResult = await client.query<PityRow>(`
    SELECT eligible_kill_count, current_chance_percent
    FROM unique_pity_tracking
    WHERE character_id = $1
    FOR UPDATE
  `, [characterId]);
  const pity = pityResult.rows[0];
  if (!pity) {
    throw new Error("Unique/Set pity state was not found after initialization.");
  }

  const eligibleKillCount = parseIntegerInRange(
    pity.eligible_kill_count,
    0,
    99,
    "eligible_kill_count"
  );
  const chancePercent = Number(pity.current_chance_percent);
  const chancePerMille = chancePercent * 10;
  const expectedChancePerMille = Math.min(100, 1 + eligibleKillCount);

  if (
    !Number.isSafeInteger(chancePerMille) ||
    chancePerMille !== expectedChancePerMille
  ) {
    throw new Error(
      "Unique/Set pity chance does not match eligible kill count."
    );
  }

  return {
    characterId: character.character_id,
    inventoryCapacity: parseIntegerInRange(
      character.inventory_slots,
      1,
      Number.MAX_SAFE_INTEGER,
      "inventory_slots"
    ),
    occupiedInventoryPositions: inventoryResult.rows.map((row) =>
      parseIntegerInRange(
        row.position,
        1,
        Number.MAX_SAFE_INTEGER,
        "inventory position"
      )
    ),
    pity: {
      eligibleKillCount,
      chancePerMille,
    },
  };
}