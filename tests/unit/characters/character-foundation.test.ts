import { describe, expect, it } from "vitest";

import {
  CHARACTER_LIMITS,
  CHARACTER_STATUS,
  DEFAULT_RESOURCE_REGENERATION,
  INITIAL_CHARACTER,
} from "../../../src/modules/characters/domain/character.constants.js";
import {
  CharacterLimitReachedError,
  CharacterNameInvalidError,
} from "../../../src/modules/characters/domain/character.errors.js";

describe("character foundation", () => {
  it("defines the initial character state", () => {
    expect(INITIAL_CHARACTER).toEqual({
      level: 1,
      experience: 0n,
      gold: 0n,

      currentHealth: 180,
      maximumHealth: 180,

      currentMana: 35,
      maximumMana: 35,

      currentEnergy: 100,
      maximumEnergy: 100,

      baseAttack: 7,
      baseDefense: 7,
      baseSpellPowerPercent: 100,

      craftingLevel: 1,
      craftingExperience: 0n,

      gatheringLevel: 1,
      gatheringExperience: 0n,

      spellSlots: 1,
      craftingSlots: 1,
      inventorySlots: 50,
    });
  });

  it("defines character limits and statuses", () => {
    expect(
      CHARACTER_LIMITS.maximumActiveCharactersPerAccount
    ).toBe(3);

    expect(CHARACTER_STATUS.active).toBe("IsActive");
    expect(CHARACTER_STATUS.archived).toBe("Archived");
  });

  it("uses only the confirmed energy regeneration rate by default", () => {
    expect(DEFAULT_RESOURCE_REGENERATION).toEqual({
      healthPerMinute: 0,
      manaPerMinute: 0,
      energyPerMinute: 1,
    });
  });

  it("creates stable character errors", () => {
    const invalidName = new CharacterNameInvalidError(
      "Name is invalid."
    );

    const limitReached = new CharacterLimitReachedError(3);

    expect(invalidName.code).toBe("CHARACTER_NAME_INVALID");
    expect(invalidName.statusCode).toBe(400);

    expect(limitReached.code).toBe(
      "CHARACTER_LIMIT_REACHED"
    );
    expect(limitReached.statusCode).toBe(409);
    expect(limitReached.details).toEqual({
      maximumActiveCharacters: 3,
    });
  });
});