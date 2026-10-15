import { describe, expect, it } from "vitest";
import type { RandomSource } from "../../../src/modules/combat/ports/random-source.js";
import { ItemGenerationConfigurationError } from "../../../src/modules/items/domain/item-generation.errors.js";
import type {
  AffixGenerationTemplate,
  WeightedEntry,
} from "../../../src/modules/items/domain/item-generation.types.js";
import {
  filterEligibleAffixes,
  rollCanonicalRarity,
} from "../../../src/modules/items/domain/item-rarity-affix.js";

function source(value: bigint): RandomSource {
  return {
    nextFloat: () => 0,
    nextInt: () => Number(value),
    nextBigInt: () => value,
  };
}

function affix(
  id: string,
  requiredItemLevel: number,
  selectionWeight = 1n,
  isEnabled = true
): WeightedEntry<AffixGenerationTemplate> {
  return {
    value: {
      affixTemplateId: id,
      statType: "Attack",
      minimumValue: 1n,
      maximumValue: 10n,
      requiredItemLevel,
      isEnabled,
    },
    selectionWeight,
  };
}

describe("canonical rarity profiles", () => {
  it("covers every regular Monster rarity boundary", () => {
    expect(rollCanonicalRarity(false, source(1n))).toBe("Common");
    expect(rollCanonicalRarity(false, source(700n))).toBe("Common");
    expect(rollCanonicalRarity(false, source(701n))).toBe("Magic");
    expect(rollCanonicalRarity(false, source(900n))).toBe("Magic");
    expect(rollCanonicalRarity(false, source(901n))).toBe("Rare");
    expect(rollCanonicalRarity(false, source(980n))).toBe("Rare");
    expect(rollCanonicalRarity(false, source(981n))).toBe("Epic");
    expect(rollCanonicalRarity(false, source(998n))).toBe("Epic");
    expect(rollCanonicalRarity(false, source(999n))).toBe("Legendary");
    expect(rollCanonicalRarity(false, source(1000n))).toBe("Legendary");
  });

  it("covers every Boss rarity boundary and never returns Common", () => {
    expect(rollCanonicalRarity(true, source(1n))).toBe("Magic");
    expect(rollCanonicalRarity(true, source(700n))).toBe("Magic");
    expect(rollCanonicalRarity(true, source(701n))).toBe("Rare");
    expect(rollCanonicalRarity(true, source(900n))).toBe("Rare");
    expect(rollCanonicalRarity(true, source(901n))).toBe("Epic");
    expect(rollCanonicalRarity(true, source(990n))).toBe("Epic");
    expect(rollCanonicalRarity(true, source(991n))).toBe("Legendary");
    expect(rollCanonicalRarity(true, source(1000n))).toBe("Legendary");
  });
});

describe("Affix eligibility", () => {
  it("accepts the exact required Item Level boundary", () => {
    expect(filterEligibleAffixes([affix("exact", 10)], 10))
      .toEqual([affix("exact", 10)]);
  });

  it("excludes an Affix one level above the rolled Item Level", () => {
    expect(filterEligibleAffixes([affix("high", 11)], 10)).toEqual([]);
  });

  it("excludes disabled Affixes", () => {
    expect(filterEligibleAffixes([affix("disabled", 1, 1n, false)], 10))
      .toEqual([]);
  });

  it("preserves Item Base-specific weights", () => {
    expect(filterEligibleAffixes([
      affix("first", 1, 2n),
      affix("second", 1, 7n),
    ], 10).map((entry) => entry.selectionWeight)).toEqual([2n, 7n]);
  });

  it("rejects non-positive weights", () => {
    expect(() => filterEligibleAffixes([affix("bad", 1, 0n)], 10))
      .toThrow(ItemGenerationConfigurationError);
  });

  it("rejects invalid required Item Level", () => {
    expect(() => filterEligibleAffixes([affix("bad", 0)], 10))
      .toThrow(ItemGenerationConfigurationError);
  });

  it("keeps legacy domain fixtures eligible by default", () => {
    const legacy = {
      value: {
        affixTemplateId: "legacy",
        statType: "Attack" as const,
        minimumValue: 1n,
        maximumValue: 2n,
      },
      selectionWeight: 1n,
    };
    expect(filterEligibleAffixes([legacy], 1)).toEqual([legacy]);
  });
});