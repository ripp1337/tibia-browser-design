import { describe, expect, it } from "vitest";

import {
  calculateEffectiveCharacterStatistics,
  calculateLevelMaximumEnergy,
} from "../../../src/modules/characters/domain/effective-character-statistics.js";

describe("calculateEffectiveCharacterStatistics", () => {
  it("returns base statistics for a level 1 character", () => {
    const result = calculateEffectiveCharacterStatistics({
      level: 1,
      spellMasteryPower: 100,
    });

    expect(result).toEqual({
      attack: 7,
      defense: 7,
      spellPower: 100,
      maximumHealth: 180,
      maximumMana: 35,
      maximumEnergy: 100,
      goldBonusPercent: 0,
      experienceBonusPercent: 0,
    });
  });

  it("applies Health and Mana progression from level 2", () => {
    const result = calculateEffectiveCharacterStatistics({
      level: 2,
      spellMasteryPower: 100,
    });

    expect(result.maximumHealth).toBe(210);
    expect(result.maximumMana).toBe(50);
  });

  it.each([
    [1, 100],
    [19, 100],
    [20, 110],
    [30, 115],
    [40, 120],
    [100, 150],
    [150, 175],
    [200, 200],
    [201, 200],
  ])(
    "returns Maximum Energy %i for level %i",
    (level, expectedEnergy) => {
      expect(calculateLevelMaximumEnergy(level)).toBe(
        expectedEnergy
      );
    }
  );

  it("adds equipment, achievement and combat modifiers", () => {
    const result = calculateEffectiveCharacterStatistics({
      level: 1,
      spellMasteryPower: 110,
      equipment: {
        attack: 20,
        defense: 10,
        spellPower: 15,
        maximumHealth: 100,
        maximumMana: 20,
        maximumEnergy: 5,
      },
      achievements: {
        attack: 2,
        defense: 3,
      },
      combat: {
        attack: -5,
        defense: 10,
        spellPower: -20,
      },
    });

    expect(result.attack).toBe(24);
    expect(result.defense).toBe(30);
    expect(result.spellPower).toBe(105);
    expect(result.maximumHealth).toBe(280);
    expect(result.maximumMana).toBe(55);
    expect(result.maximumEnergy).toBe(105);
  });

  it("does not allow combat statistics below 0", () => {
    const result = calculateEffectiveCharacterStatistics({
      level: 1,
      spellMasteryPower: 100,
      combat: {
        attack: -100,
        defense: -100,
        spellPower: -100,
      },
    });

    expect(result.attack).toBe(0);
    expect(result.defense).toBe(0);
    expect(result.spellPower).toBe(0);
  });

  it("adds Gold and Experience percentage points", () => {
    const result = calculateEffectiveCharacterStatistics({
      level: 1,
      spellMasteryPower: 100,
      equipment: {
        goldBonusPercent: 20,
        experienceBonusPercent: 10,
      },
      achievements: {
        goldBonusPercent: 5,
        experienceBonusPercent: 3,
      },
      progressionBoosts: {
        goldBonusPercent: 15,
        experienceBonusPercent: 25,
      },
    });

    expect(result.goldBonusPercent).toBe(40);
    expect(result.experienceBonusPercent).toBe(38);
  });

  it("rejects an invalid character level", () => {
    expect(() =>
      calculateEffectiveCharacterStatistics({
        level: 0,
        spellMasteryPower: 100,
      })
    ).toThrow(
      "Character level must be a positive safe integer."
    );
  });

  it("rejects negative Spell Mastery Power", () => {
    expect(() =>
      calculateEffectiveCharacterStatistics({
        level: 1,
        spellMasteryPower: -1,
      })
    ).toThrow("Spell Mastery Power must be non-negative.");
  });

  it("returns identical results for repeated calculations", () => {
    const input = {
      level: 50,
      spellMasteryPower: 125,
      equipment: {
        attack: 12.75,
        defense: 8.25,
        spellPower: 15.5,
        maximumHealth: 100,
        maximumMana: 40,
        maximumEnergy: 20,
        goldBonusPercent: 5.5,
        experienceBonusPercent: 7.25,
      },
      achievements: {
        attack: 3,
        defense: 2,
        goldBonusPercent: 1.5,
        experienceBonusPercent: 2.5,
      },
      progressionBoosts: {
        goldBonusPercent: 10,
        experienceBonusPercent: 20,
      },
      combat: {
        attack: -4,
        defense: 6,
        spellPower: -10,
      },
    };

    const first =
      calculateEffectiveCharacterStatistics(input);

    const second =
      calculateEffectiveCharacterStatistics(input);

    expect(second).toEqual(first);
    expect(input).toEqual({
      level: 50,
      spellMasteryPower: 125,
      equipment: {
        attack: 12.75,
        defense: 8.25,
        spellPower: 15.5,
        maximumHealth: 100,
        maximumMana: 40,
        maximumEnergy: 20,
        goldBonusPercent: 5.5,
        experienceBonusPercent: 7.25,
      },
      achievements: {
        attack: 3,
        defense: 2,
        goldBonusPercent: 1.5,
        experienceBonusPercent: 2.5,
      },
      progressionBoosts: {
        goldBonusPercent: 10,
        experienceBonusPercent: 20,
      },
      combat: {
        attack: -4,
        defense: 6,
        spellPower: -10,
      },
    });
  });});

