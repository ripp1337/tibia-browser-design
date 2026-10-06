import { CHARACTER_NAME_POLICY } from "./character.constants.js";
import { CharacterNameInvalidError } from "./character.errors.js";
import type { CharacterName } from "./character.types.js";

const ALLOWED_CHARACTER_NAME_PATTERN =
  /^[\p{L}]+(?:[ '-][\p{L}]+)*$/u;

function characterCount(value: string): number {
  return Array.from(value).length;
}

export function normalizeCharacterNameForDisplay(
  input: string
): string {
  return input.trim().replace(/\s+/gu, " ");
}

export function normalizeCharacterNameForComparison(
  input: string
): string {
  return normalizeCharacterNameForDisplay(input).toLowerCase();
}

export function parseCharacterName(input: unknown): CharacterName {
  if (typeof input !== "string") {
    throw new CharacterNameInvalidError(
      "Character name must be a string."
    );
  }

  const display = normalizeCharacterNameForDisplay(input);
  const length = characterCount(display);

  if (length < CHARACTER_NAME_POLICY.minimumLength) {
    throw new CharacterNameInvalidError(
      `Character name must contain at least ${CHARACTER_NAME_POLICY.minimumLength} characters.`
    );
  }

  if (length > CHARACTER_NAME_POLICY.maximumLength) {
    throw new CharacterNameInvalidError(
      `Character name must contain no more than ${CHARACTER_NAME_POLICY.maximumLength} characters.`
    );
  }

  if (!ALLOWED_CHARACTER_NAME_PATTERN.test(display)) {
    throw new CharacterNameInvalidError(
      "Character name may contain letters, single spaces, apostrophes and hyphens."
    );
  }

  return {
    display,
    normalized: normalizeCharacterNameForComparison(display),
  };
}