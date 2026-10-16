import { describe, expect, it, vi } from "vitest";
import type {
  LootCatalogSnapshot,
  LootGenerationContext,
  LootRepository,
  LootSettlementTransaction,
  LockedLootCharacter,
} from "../../../src/modules/items/application/loot.repository.js";

const context: LootGenerationContext = {
  characterId: "character-1",
  monsterId: "monster-1",
  monsterFamilyId: "family-1",
};

const character: LockedLootCharacter = {
  characterId: "character-1",
  inventoryCapacity: 20,
  occupiedInventoryPositions: [1, 2],
  pity: { eligibleKillCount: 0, chancePerMille: 1 },
};

const catalog: LootCatalogSnapshot = {
  regularItemBases: [],
  otherLootCandidates: [],
  specialItemCandidates: [],
  itemScoreCoefficients: {
    ItemLevel: 1n,
    Attack: 1n,
    Defense: 1n,
    SpellPower: 1n,
    Health: 1n,
    Mana: 1n,
    Energy: 1n,
    GoldPercent: 1n,
    ExperiencePercent: 1n,
  },
};

describe("LootRepository contract", () => {
  it("executes settlement work through one locked transaction boundary", async () => {
    const transaction: LootSettlementTransaction = {
      character,
      loadCatalog: vi.fn(async () => catalog),
      persistRegularItem: vi.fn(),
      persistSpecialItem: vi.fn(),
      applyOtherLoot: vi.fn(),
      updateUniquePity: vi.fn(),
    };
    const repository: LootRepository = {
      withSettlementTransaction: async (received, operation) => {
        expect(received).toEqual(context);
        return operation(transaction);
      },
    };

    const result = await repository.withSettlementTransaction(
      context,
      async (locked) => {
        expect(locked.character).toBe(character);
        return locked.loadCatalog(context);
      }
    );

    expect(result).toBe(catalog);
    expect(transaction.loadCatalog).toHaveBeenCalledWith(context);
  });

  it("exposes independent persistence operations in required priority order", async () => {
    const calls: string[] = [];
    const transaction: LootSettlementTransaction = {
      character,
      loadCatalog: vi.fn(async () => catalog),
      persistSpecialItem: vi.fn(async () => {
        calls.push("special");
        return { itemId: "special-item", inventoryPosition: 3 };
      }),
      persistRegularItem: vi.fn(async () => {
        calls.push("regular");
        return { itemId: "regular-item", inventoryPosition: 4 };
      }),
      applyOtherLoot: vi.fn(async () => {
        calls.push("other");
      }),
      updateUniquePity: vi.fn(async () => {
        calls.push("pity");
      }),
    };

    await transaction.persistSpecialItem({
      characterId: character.characterId,
      inventoryPosition: 3,
      item: {
        kind: "Special",
        itemBaseId: "special-base",
        itemLevel: 10,
        requiredLevel: 10,
        rarity: null,
        affixes: [],
        fixedStats: [{
          statPosition: 1,
          statType: "Attack",
          rollValue: 5n,
        }],
        itemScore: 100n,
      },
    });
    await transaction.persistRegularItem({
      characterId: character.characterId,
      inventoryPosition: 4,
      item: {
        kind: "Regular",
        itemBaseId: "regular-base",
        itemLevel: 10,
        requiredLevel: 10,
        rarity: "Common",
        affixes: [],
        fixedStats: [],
        itemScore: 50n,
      },
    });
    await transaction.applyOtherLoot({
      characterId: character.characterId,
      reward: {
        kind: "Material",
        otherLootTableId: "other-1",
        materialId: "material-1",
        quantity: 2n,
      },
    });
    await transaction.updateUniquePity({
      characterId: character.characterId,
      pity: { eligibleKillCount: 1, chancePerMille: 2 },
    });

    expect(calls).toEqual(["special", "regular", "other", "pity"]);
  });
});