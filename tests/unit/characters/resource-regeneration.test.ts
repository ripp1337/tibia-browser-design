import { describe, expect, it } from "vitest";

import { CharacterResourceStateInvalidError } from "../../../src/modules/characters/domain/character.errors.js";
import { regenerateCharacterResources } from "../../../src/modules/characters/domain/resource-regeneration.js";
import type {
  CharacterResources,
  ResourceRegenerationRates,
} from "../../../src/modules/characters/domain/character.types.js";

const checkpoint = new Date("2026-10-06T10:00:00.000Z");

const rates: ResourceRegenerationRates = {
  healthPerMinute: 2,
  manaPerMinute: 1,
  energyPerMinute: 1,
};

function createResources(
  overrides: Partial<CharacterResources> = {}
): CharacterResources {
  return {
    currentHealth: 100,
    maximumHealth: 180,

    currentMana: 20,
    maximumMana: 35,

    currentEnergy: 90,
    maximumEnergy: 100,

    resourcesUpdatedAt: checkpoint,

    ...overrides,
  };
}

describe("regenerateCharacterResources", () => {
  it("regenerates complete elapsed minutes", () => {
    const result = regenerateCharacterResources(
      createResources(),
      rates,
      new Date("2026-10-06T10:05:45.000Z")
    );

    expect(result.elapsedWholeMinutes).toBe(5);

    expect(result.restoredHealth).toBe(10);
    expect(result.restoredMana).toBe(5);
    expect(result.restoredEnergy).toBe(5);

    expect(result.resources.currentHealth).toBe(110);
    expect(result.resources.currentMana).toBe(25);
    expect(result.resources.currentEnergy).toBe(95);

    expect(
      result.resources.resourcesUpdatedAt
    ).toEqual(
      new Date("2026-10-06T10:05:00.000Z")
    );

    expect(result.needsPersistence).toBe(true);
  });

  it("preserves partial-minute progress", () => {
    const first = regenerateCharacterResources(
      createResources(),
      rates,
      new Date("2026-10-06T10:05:45.000Z")
    );

    const second = regenerateCharacterResources(
      first.resources,
      rates,
      new Date("2026-10-06T10:06:10.000Z")
    );

    expect(first.elapsedWholeMinutes).toBe(5);
    expect(second.elapsedWholeMinutes).toBe(1);

    expect(
      second.resources.resourcesUpdatedAt
    ).toEqual(
      new Date("2026-10-06T10:06:00.000Z")
    );
  });

  it("ignores an interval shorter than one complete minute", () => {
    const resources = createResources();

    const result = regenerateCharacterResources(
      resources,
      rates,
      new Date("2026-10-06T10:00:59.999Z")
    );

    expect(result.elapsedWholeMinutes).toBe(0);
    expect(result.resources).toBe(resources);
    expect(result.needsPersistence).toBe(false);
  });

  it("does not exceed maximum resources", () => {
    const result = regenerateCharacterResources(
      createResources({
        currentHealth: 179,
        currentMana: 34,
        currentEnergy: 99,
      }),
      rates,
      new Date("2026-10-06T10:30:00.000Z")
    );

    expect(result.resources.currentHealth).toBe(180);
    expect(result.resources.currentMana).toBe(35);
    expect(result.resources.currentEnergy).toBe(100);

    expect(result.restoredHealth).toBe(1);
    expect(result.restoredMana).toBe(1);
    expect(result.restoredEnergy).toBe(1);

    expect(result.needsPersistence).toBe(true);
  });

  it("prevents applying the same elapsed interval twice", () => {
    const now = new Date("2026-10-06T10:05:00.000Z");

    const first = regenerateCharacterResources(
      createResources(),
      rates,
      now
    );

    const repeated = regenerateCharacterResources(
      first.resources,
      rates,
      now
    );

    expect(repeated.elapsedWholeMinutes).toBe(0);
    expect(repeated.needsPersistence).toBe(false);
  });

  it("does not regenerate for a past timestamp", () => {
    const resources = createResources();

    const result = regenerateCharacterResources(
      resources,
      rates,
      new Date("2026-10-06T09:59:00.000Z")
    );

    expect(result.resources).toBe(resources);
    expect(result.needsPersistence).toBe(false);
  });

  it("advances the checkpoint when every pool is full", () => {
    const result = regenerateCharacterResources(
      createResources({
        currentHealth: 180,
        currentMana: 35,
        currentEnergy: 100,
      }),
      rates,
      new Date("2026-10-06T10:10:30.000Z")
    );

    expect(result.elapsedWholeMinutes).toBe(10);

    expect(result.restoredHealth).toBe(0);
    expect(result.restoredMana).toBe(0);
    expect(result.restoredEnergy).toBe(0);

    expect(
      result.resources.resourcesUpdatedAt
    ).toEqual(
      new Date("2026-10-06T10:10:00.000Z")
    );

    expect(result.needsPersistence).toBe(true);
  });

  it("rejects current values above maximum values", () => {
    expect(() =>
      regenerateCharacterResources(
        createResources({
          currentEnergy: 101,
          maximumEnergy: 100,
        }),
        rates,
        new Date("2026-10-06T10:05:00.000Z")
      )
    ).toThrow(CharacterResourceStateInvalidError);
  });

  it("rejects negative regeneration rates", () => {
    expect(() =>
      regenerateCharacterResources(
        createResources(),
        {
          ...rates,
          energyPerMinute: -1,
        },
        new Date("2026-10-06T10:05:00.000Z")
      )
    ).toThrow(CharacterResourceStateInvalidError);
  });

  it("rejects fractional regeneration rates", () => {
    expect(() =>
      regenerateCharacterResources(
        createResources(),
        {
          ...rates,
          healthPerMinute: 0.5,
        },
        new Date("2026-10-06T10:05:00.000Z")
      )
    ).toThrow(CharacterResourceStateInvalidError);
  });

  it("rejects invalid timestamps", () => {
    expect(() =>
      regenerateCharacterResources(
        createResources({
          resourcesUpdatedAt: new Date("invalid"),
        }),
        rates,
        new Date("2026-10-06T10:05:00.000Z")
      )
    ).toThrow(CharacterResourceStateInvalidError);
  });
});