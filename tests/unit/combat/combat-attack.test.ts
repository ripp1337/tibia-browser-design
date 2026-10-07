import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  InvalidRandomSourceError,
} from "../../../src/modules/combat/domain/combat.errors.js";
import {
  calculateDamageRange,
  calculateHitChancePercent,
  resolveBasicAttack,
} from "../../../src/modules/combat/domain/combat-attack.js";
import type {
  Combatant,
} from "../../../src/modules/combat/domain/combat.types.js";
import type {
  RandomSource,
} from "../../../src/modules/combat/ports/random-source.js";

function createCombatant(
  attack: number,
  defense: number
): Combatant {
  return {
    currentHealth: 100,
    maximumHealth: 100,
    attack,
    defense,
  };
}

function createRandomSource(
  nextFloat: number,
  nextInt: number
): RandomSource {
  return {
    nextFloat: vi.fn(() => nextFloat),
    nextInt: vi.fn(() => nextInt),
  };
}

describe("Combat attack", () => {
  it("calculates hit chance from attack and defense", () => {
    expect(
      calculateHitChancePercent(20, 10)
    ).toBe(40);
  });

  it("clamps hit chance to five percent", () => {
    expect(
      calculateHitChancePercent(5, 20)
    ).toBe(5);
  });

  it("clamps hit chance to ninety percent", () => {
    expect(
      calculateHitChancePercent(100, 10)
    ).toBe(90);
  });

  it("calculates the damage range", () => {
    expect(
      calculateDamageRange(20, 10)
    ).toEqual({
      minimum: 10,
      maximum: 20,
    });
  });

  it("uses zero damage when defense equals or exceeds attack", () => {
    expect(
      calculateDamageRange(10, 20)
    ).toEqual({
      minimum: 0,
      maximum: 0,
    });
  });

  it("resolves a missed attack without rolling damage", () => {
    const randomSource =
      createRandomSource(0.4, 15);

    const result = resolveBasicAttack(
      createCombatant(20, 10),
      createCombatant(10, 10),
      randomSource
    );

    expect(result).toEqual({
      hit: false,
      damage: 0,
    });

    expect(
      randomSource.nextInt
    ).not.toHaveBeenCalled();
  });

  it("resolves a successful attack", () => {
    const randomSource =
      createRandomSource(0.39999, 15);

    const result = resolveBasicAttack(
      createCombatant(20, 10),
      createCombatant(10, 10),
      randomSource
    );

    expect(result).toEqual({
      hit: true,
      damage: 15,
    });
  });

  it("supports a successful zero-damage hit", () => {
    const randomSource =
      createRandomSource(0.04, 0);

    const result = resolveBasicAttack(
      createCombatant(10, 10),
      createCombatant(10, 10),
      randomSource
    );

    expect(result).toEqual({
      hit: true,
      damage: 0,
    });
  });

  it("rejects an invalid random float", () => {
    const randomSource =
      createRandomSource(1, 0);

    expect(() =>
      resolveBasicAttack(
        createCombatant(20, 10),
        createCombatant(10, 10),
        randomSource
      )
    ).toThrow(InvalidRandomSourceError);
  });

  it("rejects damage outside the calculated range", () => {
    const randomSource =
      createRandomSource(0, 21);

    expect(() =>
      resolveBasicAttack(
        createCombatant(20, 10),
        createCombatant(10, 10),
        randomSource
      )
    ).toThrow(InvalidRandomSourceError);
  });
});
