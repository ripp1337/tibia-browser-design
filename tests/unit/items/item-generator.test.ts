import { describe, expect, it } from "vitest";
import type { RandomSource } from "../../../src/modules/combat/ports/random-source.js";
import { ItemGenerationConfigurationError } from "../../../src/modules/items/domain/item-generation.errors.js";
import type {
  ItemScoreCoefficients,
  ItemStatValues,
} from "../../../src/modules/items/domain/item-generation.types.js";
import {
  generateRegularItem,
  generateSpecialItem,
} from "../../../src/modules/items/domain/item-generator.js";

class SequenceRandomSource implements RandomSource {
  public constructor(private readonly values: bigint[]) {}
  public nextFloat(): number {
    return 0;
  }
  public nextInt(minimum: number, maximum: number): number {
    void minimum;
    void maximum;
    const value = this.values.shift();
    if (value === undefined) throw new Error("No random value available.");
    return Number(value);
  }
  public nextBigInt(minimum: bigint, maximum: bigint): bigint {
    void minimum;
    void maximum;
    const value = this.values.shift();
    if (value === undefined) throw new Error("No random value available.");
    return value;
  }
}

const baseStats: ItemStatValues = {
  Attack: 3n,
  Defense: 2n,
  SpellPower: 0n,
  Health: 0n,
  Mana: 0n,
  Energy: 0n,
  GoldPercent: 0n,
  ExperiencePercent: 0n,
};

const coefficients: ItemScoreCoefficients = {
  ItemLevel: 10n,
  Attack: 2n,
  Defense: 3n,
  SpellPower: 4n,
  Health: 1n,
  Mana: 1n,
  Energy: 5n,
  GoldPercent: 6n,
  ExperiencePercent: 7n,
};

const base = {
  itemBaseId: "base-1",
  itemLevel: 12,
  baseItemScore: 100n,
  baseStats,
};

const rarityProfile = [
  { value: "Common" as const, selectionWeight: 1n },
  { value: "Magic" as const, selectionWeight: 1n },
  { value: "Rare" as const, selectionWeight: 1n },
  { value: "Epic" as const, selectionWeight: 1n },
  { value: "Legendary" as const, selectionWeight: 1n },
];

const repeatedAttackAffixPool = [
  {
    value: {
      affixTemplateId: "attack-affix",
      statType: "Attack" as const,
      minimumValue: 10n,
      maximumValue: 20n,
    },
    selectionWeight: 1n,
  },
];

describe("item generator", () => {
  it("maps Common rarity to zero affixes", () => {
    const result = generateRegularItem(
      { base, rarityProfile, affixPool: [], coefficients },
      new SequenceRandomSource([1n])
    );
    expect(result).toMatchObject({
      kind: "Regular",
      rarity: "Common",
      itemLevel: 12,
      requiredLevel: 12,
      affixes: [],
      fixedStats: [],
      itemScore: 232n,
    });
  });

  it("maps every rarity to the authoritative affix count", () => {
    const cases = [
      { rarityRoll: 1n, expected: 0 },
      { rarityRoll: 2n, expected: 1 },
      { rarityRoll: 3n, expected: 2 },
      { rarityRoll: 4n, expected: 3 },
      { rarityRoll: 5n, expected: 4 },
    ];
    for (const testCase of cases) {
      const values = [testCase.rarityRoll];
      for (let index = 0; index < testCase.expected; index += 1) {
        values.push(10n + BigInt(index));
      }
      const result = generateRegularItem(
        { base, rarityProfile, affixPool: repeatedAttackAffixPool, coefficients },
        new SequenceRandomSource(values)
      );
      expect(result.affixes).toHaveLength(testCase.expected);
    }
  });

  it("selects repeated affixes independently and assigns stable positions", () => {
    const result = generateRegularItem(
      { base, rarityProfile, affixPool: repeatedAttackAffixPool, coefficients },
      new SequenceRandomSource([
        5n,
        10n,
        13n,
        17n,
        20n,
      ])
    );
    expect(result.rarity).toBe("Legendary");
    expect(result.affixes).toEqual([
      { affixTemplateId: "attack-affix", affixPosition: 1, statType: "Attack", rollValue: 10n },
      { affixTemplateId: "attack-affix", affixPosition: 2, statType: "Attack", rollValue: 13n },
      { affixTemplateId: "attack-affix", affixPosition: 3, statType: "Attack", rollValue: 17n },
      { affixTemplateId: "attack-affix", affixPosition: 4, statType: "Attack", rollValue: 20n },
    ]);
    expect(result.itemScore).toBe(352n);
  });

  it("uses the full weighted affix pool for every slot", () => {
    const affixPool = [
      {
        value: {
          affixTemplateId: "attack-affix",
          statType: "Attack" as const,
          minimumValue: 5n,
          maximumValue: 5n,
        },
        selectionWeight: 1n,
      },
      {
        value: {
          affixTemplateId: "defense-affix",
          statType: "Defense" as const,
          minimumValue: 7n,
          maximumValue: 7n,
        },
        selectionWeight: 1n,
      },
    ];
    const result = generateRegularItem(
      { base, rarityProfile, affixPool, coefficients },
      new SequenceRandomSource([3n, 1n, 2n])
    );
    expect(result.affixes.map((affix) => affix.affixTemplateId))
      .toEqual(["attack-affix", "defense-affix"]);
  });

  it("generates Special Items only from fixed stats and preserves positions", () => {
    const result = generateSpecialItem(
      {
        base,
        fixedStatRanges: [
          { statPosition: 3, statType: "GoldPercent", minimumValue: 2n, maximumValue: 4n },
          { statPosition: 1, statType: "Attack", minimumValue: 8n, maximumValue: 12n },
        ],
        coefficients,
      },
      new SequenceRandomSource([4n, 9n])
    );
    expect(result).toMatchObject({
      kind: "Special",
      rarity: null,
      itemLevel: 12,
      requiredLevel: 12,
      affixes: [],
      fixedStats: [
        { statPosition: 3, statType: "GoldPercent", rollValue: 4n },
        { statPosition: 1, statType: "Attack", rollValue: 9n },
      ],
      itemScore: 274n,
    });
  });

  it("returns identical results for identical deterministic sequences", () => {
    const input = { base, rarityProfile, affixPool: repeatedAttackAffixPool, coefficients };
    const sequence = [3n, 11n, 19n];
    expect(generateRegularItem(input, new SequenceRandomSource([...sequence])))
      .toEqual(generateRegularItem(input, new SequenceRandomSource([...sequence])));
  });

  it("rejects a rarity that needs affixes when the pool is empty", () => {
    expect(() => generateRegularItem(
      { base, rarityProfile, affixPool: [], coefficients },
      new SequenceRandomSource([2n])
    )).toThrow(ItemGenerationConfigurationError);
  });

  it("rejects a rarity when every Affix is above the rolled Item Level", () => {
    const ineligiblePool = [{
      value: {
        affixTemplateId: "future-affix",
        statType: "Attack" as const,
        minimumValue: 10n,
        maximumValue: 20n,
        requiredItemLevel: 13,
      },
      selectionWeight: 1n,
    }];
    expect(() => generateRegularItem(
      { base, rarityProfile, affixPool: ineligiblePool, coefficients },
      new SequenceRandomSource([2n])
    )).toThrow("Regular Item rarity requires a non-empty eligible affix pool.");
  });

  it("rejects Special Items without fixed stats", () => {
    expect(() => generateSpecialItem(
      { base, fixedStatRanges: [], coefficients },
      new SequenceRandomSource([])
    )).toThrow(ItemGenerationConfigurationError);
  });

  it("rejects duplicate fixed-stat positions and types", () => {
    expect(() => generateSpecialItem(
      {
        base,
        fixedStatRanges: [
          { statPosition: 1, statType: "Attack", minimumValue: 1n, maximumValue: 1n },
          { statPosition: 1, statType: "Defense", minimumValue: 1n, maximumValue: 1n },
        ],
        coefficients,
      },
      new SequenceRandomSource([])
    )).toThrow("Fixed stat positions must be unique.");
    expect(() => generateSpecialItem(
      {
        base,
        fixedStatRanges: [
          { statPosition: 1, statType: "Attack", minimumValue: 1n, maximumValue: 1n },
          { statPosition: 2, statType: "Attack", minimumValue: 1n, maximumValue: 1n },
        ],
        coefficients,
      },
      new SequenceRandomSource([])
    )).toThrow("Fixed stat types must be unique.");
  });
});