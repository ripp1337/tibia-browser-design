import { describe, expect, it } from "vitest";
import type { RandomSource } from "../../../src/modules/combat/ports/random-source.js";
import { ItemGenerationConfigurationError } from "../../../src/modules/items/domain/item-generation.errors.js";
import {
  calculateItemLevelRange,
  rollItemLevel,
  rollRegularEquipmentSuccess,
} from "../../../src/modules/items/domain/item-loot-level.js";

function source(values: number[]): RandomSource {
  return {
    nextFloat: () => 0,
    nextInt: () => {
      const value = values.shift();
      if (value === undefined) throw new Error("No random value available.");
      return value;
    },
  };
}

describe("item loot level and Equipment chance", () => {
  it("clamps the minimum Item Level to 1", () => {
    expect(calculateItemLevelRange({
      monsterLevel: 1,
      bossBonusLootLevel: 0,
      isBoss: false,
    })).toEqual({
      effectiveLootLevel: 1,
      minimumItemLevel: 1,
      maximumItemLevel: 6,
    });
  });

  it("applies the authoritative Boss loot level bonus", () => {
    expect(calculateItemLevelRange({
      monsterLevel: 20,
      bossBonusLootLevel: 5,
      isBoss: true,
    })).toEqual({
      effectiveLootLevel: 25,
      minimumItemLevel: 15,
      maximumItemLevel: 30,
    });
  });

  it("rolls inclusive minimum, intermediate and maximum Item Levels", () => {
    const context = { monsterLevel: 20, bossBonusLootLevel: 0, isBoss: false };
    expect(rollItemLevel(context, source([10]))).toBe(10);
    expect(rollItemLevel(context, source([17]))).toBe(17);
    expect(rollItemLevel(context, source([25]))).toBe(25);
  });

  it("uses exact 30 percent regular Monster boundary", () => {
    expect(rollRegularEquipmentSuccess(false, source([300]))).toBe(true);
    expect(rollRegularEquipmentSuccess(false, source([301]))).toBe(false);
  });

  it("uses exact 80 percent Boss boundary", () => {
    expect(rollRegularEquipmentSuccess(true, source([800]))).toBe(true);
    expect(rollRegularEquipmentSuccess(true, source([801]))).toBe(false);
  });

  it("rejects invalid authoritative context", () => {
    expect(() => calculateItemLevelRange({
      monsterLevel: 0,
      bossBonusLootLevel: 0,
      isBoss: false,
    })).toThrow(ItemGenerationConfigurationError);
    expect(() => calculateItemLevelRange({
      monsterLevel: 10,
      bossBonusLootLevel: -1,
      isBoss: true,
    })).toThrow(ItemGenerationConfigurationError);
    expect(() => calculateItemLevelRange({
      monsterLevel: 10,
      bossBonusLootLevel: 1,
      isBoss: false,
    })).toThrow(ItemGenerationConfigurationError);
  });
});