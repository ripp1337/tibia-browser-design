import { describe, expect, it, vi } from "vitest";
import {
  applyOtherLootReward,
  persistRegularLootItem,
  persistSpecialLootItem,
  updateUniquePityState,
} from "../../../src/modules/items/infrastructure/postgres-loot-persistence.js";

function client(results: unknown[][] = []) {
  const queue = [...results];

  return {
    query: vi.fn(async (
      _queryText: string,
      _parameters?: readonly unknown[]
    ) => ({
      rows: queue.shift() ?? [],
    })),
  };
}

describe("PostgreSQL loot persistence", () => {
  it("persists a regular Item, duplicate Affixes by position, and Inventory", async () => {
    const db = client([[{ item_id: "item-1" }], [], [], []]);
    const result = await persistRegularLootItem(db as never, {
      characterId: "character-1", inventoryPosition: 3,
      item: { kind: "Regular", itemBaseId: "base-1", itemLevel: 10,
        requiredLevel: 10, rarity: "Rare", itemScore: 50n, fixedStats: [],
        affixes: [
          { affixTemplateId: "affix-1", affixPosition: 1, statType: "Attack", rollValue: 5n },
          { affixTemplateId: "affix-1", affixPosition: 2, statType: "Attack", rollValue: 6n },
        ] },
    });
    expect(result).toEqual({ itemId: "item-1", inventoryPosition: 3 });
    expect(db.query).toHaveBeenCalledTimes(4);
  });

  it("persists a Special Item with NULL rarity and all fixed stats", async () => {
    const db = client([[{ item_id: "special-1" }], [], [], []]);
    await persistSpecialLootItem(db as never, {
      characterId: "character-1", inventoryPosition: 1,
      item: { kind: "Special", itemBaseId: "unique-1", itemLevel: 20,
        requiredLevel: 20, rarity: null, itemScore: 200n, affixes: [],
        fixedStats: [
          { statPosition: 1, statType: "Attack", rollValue: 10n },
          { statPosition: 2, statType: "Defense", rollValue: 8n },
        ] },
    });
    expect(db.query).toHaveBeenCalledTimes(4);
    expect(String(db.query.mock.calls[0]?.[0])).toContain("NULL");
  });

  it("upserts Material and Consumable quantities", async () => {
    const db = client([[], []]);
    await applyOtherLootReward(db as never, { characterId: "c", reward: {
      kind: "Material", otherLootTableId: "o1", materialId: "m1", quantity: 2n } });
    await applyOtherLootReward(db as never, { characterId: "c", reward: {
      kind: "Consumable", otherLootTableId: "o2", consumableDefinitionId: "x1", quantity: 3n } });
    expect(String(db.query.mock.calls[0]?.[0])).toContain("material_storage");
    expect(String(db.query.mock.calls[1]?.[0])).toContain("consumable_storage");
  });

  it("updates only canonical pity state", async () => {
    const db = client([[]]);
    await updateUniquePityState(db as never, {
      characterId: "c", pity: { eligibleKillCount: 1, chancePerMille: 2 },
    });
    expect(db.query.mock.calls[0]?.[1]).toEqual(["c", 1, 0.2]);
    await expect(updateUniquePityState(db as never, {
      characterId: "c", pity: { eligibleKillCount: 1, chancePerMille: 1 },
    })).rejects.toThrow("Pity chance does not match eligible kill count.");
  });
});