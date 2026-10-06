import { describe, expect, it } from "vitest";

import { CharacterNameInvalidError } from "../../../src/modules/characters/domain/character.errors.js";
import {
  normalizeCharacterNameForComparison,
  normalizeCharacterNameForDisplay,
  parseCharacterName,
} from "../../../src/modules/characters/domain/character-name.js";

describe("character name", () => {
  it("trims and collapses whitespace", () => {
    expect(
      normalizeCharacterNameForDisplay(
        "   Sir    Jakub   "
      )
    ).toBe("Sir Jakub");
  });

  it("creates a case-insensitive comparison value", () => {
    expect(
      normalizeCharacterNameForComparison("  Sir Jakub ")
    ).toBe("sir jakub");
  });

  it("accepts Unicode letters, spaces, apostrophes and hyphens", () => {
    expect(parseCharacterName("  Żelazny   Rycerz  ")).toEqual({
      display: "Żelazny Rycerz",
      normalized: "żelazny rycerz",
    });

    expect(parseCharacterName("O'Connor")).toEqual({
      display: "O'Connor",
      normalized: "o'connor",
    });

    expect(parseCharacterName("Anna-Maria")).toEqual({
      display: "Anna-Maria",
      normalized: "anna-maria",
    });
  });

  it.each([
    "",
    "A",
    "AB",
    "Name123",
    "Name_One",
    "-Name",
    "Name-",
    "Name 123",
  ])("rejects invalid name: %s", (name) => {
    expect(() => parseCharacterName(name)).toThrow(
      CharacterNameInvalidError
    );
  });

  it("rejects names longer than 24 characters", () => {
    expect(() =>
      parseCharacterName("A".repeat(25))
    ).toThrow(CharacterNameInvalidError);
  });

  it("rejects non-string values", () => {
    expect(() => parseCharacterName(null)).toThrow(
      CharacterNameInvalidError
    );

    expect(() => parseCharacterName(123)).toThrow(
      CharacterNameInvalidError
    );
  });
});