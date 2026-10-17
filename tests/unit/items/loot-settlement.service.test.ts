import { describe, expect, it, vi } from "vitest";
import type { RandomSource } from "../../../src/modules/combat/ports/random-source.js";
import type {
  LootCatalogSnapshot,
  LootRepository,
  LootSettlementTransaction,
} from "../../../src/modules/items/application/loot.repository.js";
import {
  LootSettlementService,
  type LootSettlementDependencies,
} from "../../../src/modules/items/application/loot-settlement.service.js";
import type {
  GeneratedRegularItem,
  GeneratedSpecialItem,
  ItemScoreCoefficients,
  SpecialItemRewardResult,
} from "../../../src/modules/items/domain/item-generation.types.js";

const coefficients: ItemScoreCoefficients = {
  ItemLevel: 1n, Attack: 1n, Defense: 1n, SpellPower: 1n,
  Health: 1n, Mana: 1n, Energy: 1n, GoldPercent: 1n,
  ExperiencePercent: 1n,
};
const catalog: LootCatalogSnapshot = {
  regularItemBases: [], otherLootCandidates: [], specialItemCandidates: [],
  itemScoreCoefficients: coefficients,
};
const regular: GeneratedRegularItem = {
  kind: "Regular", itemBaseId: "regular", itemLevel: 10, requiredLevel: 10,
  rarity: "Common", affixes: [], fixedStats: [], itemScore: 10n,
};
const special: GeneratedSpecialItem = {
  kind: "Special", itemBaseId: "special", itemLevel: 10, requiredLevel: 10,
  rarity: null, affixes: [], fixedStats: [
    { statPosition: 1, statType: "Attack", rollValue: 5n },
  ], itemScore: 20n,
};
const randomSource: RandomSource = {
  nextFloat: () => 0,
  nextInt: () => 1,
  nextBigInt: () => 1n,
};
const input = {
  characterId: "character-1", monsterId: "monster-1",
  monsterFamilyId: "family-1", monsterLevel: 10,
  bossBonusLootLevel: 0, isBoss: false,
};

function setup(options: {
  capacity?: number;
  occupied?: number[];
  specialResult?: SpecialItemRewardResult;
  regularResult?: GeneratedRegularItem | null;
} = {}) {
  const calls: string[] = [];
  const transaction: LootSettlementTransaction = {
    character: {
      characterId: "character-1",
      inventoryCapacity: options.capacity ?? 5,
      occupiedInventoryPositions: options.occupied ?? [1],
      pity: { eligibleKillCount: 4, chancePerMille: 5 },
    },
    loadCatalog: vi.fn(async () => { calls.push("catalog"); return catalog; }),
    persistSpecialItem: vi.fn(async (value) => {
      calls.push(`persist-special:${value.inventoryPosition}`);
      return { itemId: "special-id", inventoryPosition: value.inventoryPosition };
    }),
    persistRegularItem: vi.fn(async (value) => {
      calls.push(`persist-regular:${value.inventoryPosition}`);
      return { itemId: "regular-id", inventoryPosition: value.inventoryPosition };
    }),
    applyOtherLoot: vi.fn(async () => { calls.push("persist-other"); }),
    updateUniquePity: vi.fn(async (value) => {
      calls.push(`pity:${value.pity.eligibleKillCount}`);
    }),
  };
  const repository: LootRepository = {
    withSettlementTransaction: async (_context, operation) => operation(transaction),
  };
  const generatedSpecial = options.specialResult ?? {
    outcome: "Generated" as const, item: special, selectedCategory: "Unique" as const,
    nextPity: { eligibleKillCount: 4, chancePerMille: 5 },
  };
  const dependencies: LootSettlementDependencies = {
    generateRegular: vi.fn(() => options.regularResult === undefined ? regular : options.regularResult),
    generateOther: vi.fn(() => ({
      kind: "Material" as const, otherLootTableId: "other",
      materialId: "material", quantity: 2n,
    })),
    rollSpecialItemLevel: vi.fn(() => 10),
    generateSpecial: vi.fn(() => generatedSpecial),
  };
  return {
    service: new LootSettlementService(repository, randomSource, dependencies),
    transaction, dependencies, calls,
  };
}

describe("Loot settlement service", () => {
  it("generates all independent rewards before persistence", async () => {
    const { service, dependencies, calls } = setup();
    const result = await service.settle(input);

    expect(dependencies.generateRegular).toHaveBeenCalledOnce();
    expect(dependencies.generateOther).toHaveBeenCalledOnce();
    expect(dependencies.generateSpecial).toHaveBeenCalledOnce();
    expect(calls).toEqual([
      "catalog", "persist-special:2", "persist-regular:3",
      "persist-other", "pity:0",
    ]);
    expect(result.pity).toEqual({ eligibleKillCount: 0, chancePerMille: 1 });
  });

  it("gives the lowest free position to Special before Regular", async () => {
    const { service } = setup({ occupied: [1, 3] });
    const result = await service.settle(input);
    expect(result.specialEquipment.persisted?.inventoryPosition).toBe(2);
    expect(result.regularEquipment.persisted?.inventoryPosition).toBe(4);
  });

  it("reports both generated Items as lost when Inventory is full", async () => {
    const { service, transaction } = setup({ capacity: 2, occupied: [1, 2] });
    const result = await service.settle(input);
    expect(result.specialEquipment.lossReason).toBe("InventoryFull");
    expect(result.regularEquipment.lossReason).toBe("InventoryFull");
    expect(result.otherLoot?.kind).toBe("Material");
    expect(result.pity).toEqual({ eligibleKillCount: 4, chancePerMille: 5 });
    expect(transaction.persistSpecialItem).not.toHaveBeenCalled();
    expect(transaction.persistRegularItem).not.toHaveBeenCalled();
    expect(transaction.applyOtherLoot).toHaveBeenCalledOnce();
    expect(transaction.updateUniquePity).not.toHaveBeenCalled();
  });

  it("preserves pity when Special is lost but still persists Regular if one slot exists", async () => {
    const { service } = setup({ capacity: 2, occupied: [1] });
    const result = await service.settle(input);
    expect(result.specialEquipment.persisted?.inventoryPosition).toBe(2);
    expect(result.regularEquipment.lossReason).toBe("InventoryFull");
    expect(result.pity).toEqual({ eligibleKillCount: 0, chancePerMille: 1 });
  });

  it("increments pity after a failed eligible Special roll", async () => {
    const { service, transaction } = setup({
      regularResult: null,
      specialResult: {
        outcome: "Failed", item: null, selectedCategory: null,
        nextPity: { eligibleKillCount: 5, chancePerMille: 6 },
      },
    });
    const result = await service.settle(input);
    expect(result.specialRollOutcome).toBe("Failed");
    expect(result.pity).toEqual({ eligibleKillCount: 5, chancePerMille: 6 });
    expect(transaction.updateUniquePity).toHaveBeenCalledWith({
      characterId: "character-1",
      pity: { eligibleKillCount: 5, chancePerMille: 6 },
    });
  });

  it("does not update pity for an ineligible Special pool", async () => {
    const { service, transaction } = setup({
      regularResult: null,
      specialResult: {
        outcome: "Ineligible", item: null, selectedCategory: null,
        nextPity: { eligibleKillCount: 4, chancePerMille: 5 },
      },
    });
    await service.settle(input);
    expect(transaction.updateUniquePity).not.toHaveBeenCalled();
  });
});