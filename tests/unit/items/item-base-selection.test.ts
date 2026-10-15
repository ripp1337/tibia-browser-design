import { describe, expect, it } from "vitest";
import type { RandomSource } from "../../../src/modules/combat/ports/random-source.js";
import { ItemGenerationConfigurationError } from "../../../src/modules/items/domain/item-generation.errors.js";
import type { RegularItemBaseCandidate } from "../../../src/modules/items/domain/item-generation.types.js";
import { selectRegularItemBase } from "../../../src/modules/items/domain/item-base-selection.js";

function source(values: bigint[]): RandomSource {
  return {
    nextFloat: () => 0,
    nextInt: () => 1,
    nextBigInt: () => {
      const value = values.shift();
      if (value === undefined) throw new Error("No random value available.");
      return value;
    },
  };
}

function candidate(
  itemBaseId: string,
  slot: RegularItemBaseCandidate["slot"],
  itemLevel: number,
  selectionWeight = 1n
): RegularItemBaseCandidate {
  return {
    itemBaseId,
    slot,
    itemLevel,
    selectionWeight,
    isEnabled: true,
    isUnique: false,
    isSet: false,
  };
}

describe("regular Item Base selection", () => {
  it("keeps the initially selected slot when it is available", () => {
    const result = selectRegularItemBase(
      [candidate("weapon", "Weapon", 5)],
      5,
      source([1n, 1n])
    );
    expect(result).toEqual({
      slot: "Weapon",
      itemBase: candidate("weapon", "Weapon", 5),
      requiredLevel: 5,
    });
  });

  it("falls back only to eligible slots", () => {
    const result = selectRegularItemBase(
      [candidate("boots", "Boots", 1)],
      10,
      source([1n, 1n])
    );
    expect(result.slot).toBe("Boots");
    expect(result.itemBase.itemBaseId).toBe("boots");
  });

  it("preserves relative canonical weights in fallback", () => {
    const result = selectRegularItemBase(
      [candidate("boots", "Boots", 1), candidate("ring", "Ring", 1)],
      10,
      source([1n, 2n, 1n])
    );
    expect(result.slot).toBe("Ring");
  });

  it("uses weighted Item Base selection inside the selected slot", () => {
    const result = selectRegularItemBase(
      [
        candidate("light-weapon", "Weapon", 1, 2n),
        candidate("heavy-weapon", "Weapon", 1, 3n),
      ],
      10,
      source([1n, 5n])
    );
    expect(result.itemBase.itemBaseId).toBe("heavy-weapon");
  });

  it("accepts the exact Item Base level boundary", () => {
    const result = selectRegularItemBase(
      [candidate("exact", "Weapon", 10)],
      10,
      source([1n, 1n])
    );
    expect(result.itemBase.itemBaseId).toBe("exact");
    expect(result.requiredLevel).toBe(10);
  });

  it("excludes bases above level, disabled, Unique and Set", () => {
    const entries: RegularItemBaseCandidate[] = [
      candidate("too-high", "Weapon", 11),
      { ...candidate("disabled", "Weapon", 1), isEnabled: false },
      { ...candidate("unique", "Weapon", 1), isUnique: true },
      { ...candidate("set", "Weapon", 1), isSet: true },
    ];
    expect(() => selectRegularItemBase(entries, 10, source([])))
      .toThrow(ItemGenerationConfigurationError);
  });

  it("raises a configuration error for a completely empty eligible pool", () => {
    expect(() => selectRegularItemBase([], 10, source([])))
      .toThrow("Regular Equipment roll succeeded but no eligible Item Base exists.");
  });
});