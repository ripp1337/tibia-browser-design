import { describe, expect, it } from "vitest";
import type { RandomSource } from "../../../src/modules/combat/ports/random-source.js";
import { ItemGenerationConfigurationError } from "../../../src/modules/items/domain/item-generation.errors.js";
import type {
  GenerateSpecialItemRewardInput,
  ItemScoreCoefficients,
  ItemStatValues,
  SpecialItemCandidate,
} from "../../../src/modules/items/domain/item-generation.types.js";
import { generateSpecialItemReward } from "../../../src/modules/items/domain/special-item-generator.js";

class SequenceRandomSource implements RandomSource {
  public readonly calls: string[] = [];
  public constructor(private readonly integers: number[], private readonly bigints: bigint[]) {}
  public nextFloat(): number { return 0; }
  public nextInt(minimum: number, maximum: number): number {
    this.calls.push(`nextInt:${minimum}-${maximum}`);
    const value = this.integers.shift();
    if (value === undefined) throw new Error("No integer random value available.");
    return value;
  }
  public nextBigInt(minimum: bigint, maximum: bigint): bigint {
    this.calls.push(`nextBigInt:${minimum}-${maximum}`);
    const value = this.bigints.shift();
    if (value === undefined) throw new Error("No bigint random value available.");
    return value;
  }
}

const stats: ItemStatValues = {
  Attack: 0n, Defense: 0n, SpellPower: 0n, Health: 0n,
  Mana: 0n, Energy: 0n, GoldPercent: 0n, ExperiencePercent: 0n,
};
const coefficients: ItemScoreCoefficients = {
  ItemLevel: 1n, Attack: 1n, Defense: 1n, SpellPower: 1n,
  Health: 1n, Mana: 1n, Energy: 1n, GoldPercent: 1n,
  ExperiencePercent: 1n,
};

function candidate(overrides: Partial<SpecialItemCandidate> = {}): SpecialItemCandidate {
  return {
    specialItemSourceId: "source-1",
    monsterId: "monster-1",
    monsterFamilyId: null,
    selectionWeight: 1n,
    isEnabled: true,
    category: "Unique",
    isBossExclusive: false,
    progressionEligible: true,
    base: { itemBaseId: "unique-1", itemLevel: 10, baseItemScore: 100n, baseStats: stats },
    fixedStatRanges: [{ statPosition: 1, statType: "Attack", minimumValue: 5n, maximumValue: 10n }],
    ...overrides,
  };
}

function input(overrides: Partial<GenerateSpecialItemRewardInput> = {}): GenerateSpecialItemRewardInput {
  return {
    defeatedMonsterId: "monster-1",
    defeatedMonsterFamilyId: "family-1",
    defeatedSourceIsBoss: false,
    rolledItemLevel: 10,
    pity: { eligibleKillCount: 0, chancePerMille: 1 },
    candidates: [candidate()],
    coefficients,
    ...overrides,
  };
}

describe("Unique/Set generator", () => {
  it("does not roll or mutate pity when no candidate is eligible", () => {
    const random = new SequenceRandomSource([], []);
    expect(generateSpecialItemReward(input({ candidates: [candidate({ monsterId: "other" })] }), random))
      .toEqual({ outcome: "Ineligible", item: null, selectedCategory: null, nextPity: { eligibleKillCount: 0, chancePerMille: 1 } });
    expect(random.calls).toEqual([]);
  });

  it("increments pity after an eligible failed roll", () => {
    expect(generateSpecialItemReward(input(), new SequenceRandomSource([2], [])))
      .toEqual({ outcome: "Failed", item: null, selectedCategory: null, nextPity: { eligibleKillCount: 1, chancePerMille: 2 } });
  });

  it("caps pity at 10 percent", () => {
    expect(generateSpecialItemReward(input({ pity: { eligibleKillCount: 99, chancePerMille: 100 } }), new SequenceRandomSource([101], [])))
      .toEqual({ outcome: "Failed", item: null, selectedCategory: null, nextPity: { eligibleKillCount: 99, chancePerMille: 100 } });
  });

  it("supports direct Monster Unique generation with all fixed stats", () => {
    const result = generateSpecialItemReward(input(), new SequenceRandomSource([1], [7n]));
    expect(result.outcome).toBe("Generated");
    expect(result.selectedCategory).toBe("Unique");
    expect(result.item?.affixes).toEqual([]);
    expect(result.item?.fixedStats).toEqual([{ statPosition: 1, statType: "Attack", rollValue: 7n }]);
    expect(result.nextPity).toEqual({ eligibleKillCount: 0, chancePerMille: 1 });
  });

  it("supports Monster Family Set generation", () => {
    const set = candidate({
      specialItemSourceId: "family-source",
      monsterId: null,
      monsterFamilyId: "family-1",
      category: "Set",
      base: { itemBaseId: "set-1", itemLevel: 10, baseItemScore: 100n, baseStats: stats },
    });
    const result = generateSpecialItemReward(input({ candidates: [set] }), new SequenceRandomSource([1], [5n]));
    expect(result.outcome).toBe("Generated");
    expect(result.selectedCategory).toBe("Set");
    expect(result.item?.itemBaseId).toBe("set-1");
  });

  it("enforces boss-exclusive, Item Level and progression restrictions", () => {
    const candidates = [
      candidate({ isBossExclusive: true }),
      candidate({ specialItemSourceId: "high", base: { itemBaseId: "high", itemLevel: 11, baseItemScore: 1n, baseStats: stats } }),
      candidate({ specialItemSourceId: "progression", progressionEligible: false }),
    ];
    expect(generateSpecialItemReward(input({ candidates }), new SequenceRandomSource([], []))?.outcome)
      .toBe("Ineligible");
  });

  it("accepts exact Item Level and boss-exclusive boundaries", () => {
    const result = generateSpecialItemReward(
      input({ defeatedSourceIsBoss: true, candidates: [candidate({ isBossExclusive: true })] }),
      new SequenceRandomSource([1], [5n])
    );
    expect(result.outcome).toBe("Generated");
  });

  it("selects weighted first and last candidates", () => {
    const first = candidate({ specialItemSourceId: "first", selectionWeight: 2n });
    const last = candidate({ specialItemSourceId: "last", selectionWeight: 3n, category: "Set", base: { itemBaseId: "last", itemLevel: 10, baseItemScore: 1n, baseStats: stats } });
    expect(generateSpecialItemReward(input({ candidates: [first, last] }), new SequenceRandomSource([1], [1n, 5n])).selectedCategory).toBe("Unique");
    expect(generateSpecialItemReward(input({ candidates: [first, last] }), new SequenceRandomSource([1], [5n, 5n])).selectedCategory).toBe("Set");
  });

  it("rejects invalid pity and source configuration", () => {
    expect(() => generateSpecialItemReward(input({ pity: { eligibleKillCount: 1, chancePerMille: 1 } }), new SequenceRandomSource([], [])))
      .toThrow(ItemGenerationConfigurationError);
    expect(() => generateSpecialItemReward(input({ candidates: [candidate({ monsterFamilyId: "family-1" })] }), new SequenceRandomSource([], [])))
      .toThrow(ItemGenerationConfigurationError);
  });

  it("is deterministic for identical input and random sequence", () => {
    const first = generateSpecialItemReward(input(), new SequenceRandomSource([1], [8n]));
    const second = generateSpecialItemReward(input(), new SequenceRandomSource([1], [8n]));
    expect(first).toEqual(second);
  });
});