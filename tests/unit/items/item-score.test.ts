import { describe, expect, it } from "vitest";
import { POSTGRES_BIGINT_MAXIMUM } from "../../../src/modules/items/domain/item-generation.constants.js";
import {
  ItemGenerationConfigurationError,
  ItemScoreOverflowError,
} from "../../../src/modules/items/domain/item-generation.errors.js";
import type {
  ItemScoreCoefficients,
  ItemStatValues,
} from "../../../src/modules/items/domain/item-generation.types.js";
import { calculateItemScore } from "../../../src/modules/items/domain/item-score.js";

const zeroStats: ItemStatValues = {
  Attack: 0n,
  Defense: 0n,
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

describe("calculateItemScore", () => {
  it("scores base item, Item Level and actual base stats", () => {
    expect(calculateItemScore({
      baseItemScore: 100n,
      itemLevel: 5,
      baseStats: { ...zeroStats, Attack: 4n, Defense: 2n },
      affixes: [],
      fixedStats: [],
      coefficients,
    })).toBe(164n);
  });

  it("adds every repeated affix independently", () => {
    expect(calculateItemScore({
      baseItemScore: 0n,
      itemLevel: 1,
      baseStats: zeroStats,
      affixes: [
        { statType: "Attack", rollValue: 3n },
        { statType: "Attack", rollValue: 5n },
      ],
      fixedStats: [],
      coefficients,
    })).toBe(26n);
  });

  it("scores fixed stats without a rarity bonus", () => {
    expect(calculateItemScore({
      baseItemScore: 20n,
      itemLevel: 2,
      baseStats: zeroStats,
      affixes: [],
      fixedStats: [
        { statType: "Health", rollValue: 10n },
        { statType: "GoldPercent", rollValue: 2n },
      ],
      coefficients,
    })).toBe(62n);
  });

  it("rejects invalid input", () => {
    expect(() => calculateItemScore({
      baseItemScore: -1n,
      itemLevel: 1,
      baseStats: zeroStats,
      affixes: [],
      fixedStats: [],
      coefficients,
    })).toThrow(ItemGenerationConfigurationError);
  });

  it("rejects PostgreSQL BIGINT overflow", () => {
    expect(() => calculateItemScore({
      baseItemScore: POSTGRES_BIGINT_MAXIMUM,
      itemLevel: 1,
      baseStats: zeroStats,
      affixes: [],
      fixedStats: [],
      coefficients,
    })).toThrow(ItemScoreOverflowError);
  });
});
