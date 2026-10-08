import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  calculateVictoryRewards,
  rollBaseGold,
} from "../../../src/modules/progression/domain/victory-rewards.js";
import type {
  RandomSource,
} from "../../../src/modules/combat/ports/random-source.js";

function createRandomSource(
  rolledGold: number
): RandomSource {
  return {
    nextFloat: vi.fn(() => 0),
    nextInt: vi.fn(
      () => rolledGold
    ),
  };
}

describe("M6 Victory rewards", () => {
  it("rolls the inclusive minimum", () => {
    const randomSource =
      createRandomSource(10);

    expect(
      rollBaseGold(
        10n,
        20n,
        randomSource
      )
    ).toBe(10n);

    expect(
      randomSource.nextInt
    ).toHaveBeenCalledWith(10, 20);
  });

  it("rolls the inclusive maximum", () => {
    expect(
      rollBaseGold(
        10n,
        20n,
        createRandomSource(20)
      )
    ).toBe(20n);
  });

  it("supports an equal Gold range", () => {
    expect(
      rollBaseGold(
        15n,
        15n,
        createRandomSource(15)
      )
    ).toBe(15n);
  });

  it("calculates final Experience and Gold", () => {
    const result =
      calculateVictoryRewards(
        {
          baseExperience: 101n,
          minimumGold: 10n,
          maximumGold: 20n,
          experienceBonusPercent: 12.5,
          goldBonusPercent: 2.5,
        },
        createRandomSource(15)
      );

    expect(result).toEqual({
      baseExperience: 101n,
      finalExperience: 113n,
      baseGold: 15n,
      finalGold: 15n,
      experienceBonusBasisPoints:
        1_250n,
      goldBonusBasisPoints: 250n,
    });
  });

  it("supports zero rewards", () => {
    expect(
      calculateVictoryRewards(
        {
          baseExperience: 0n,
          minimumGold: 0n,
          maximumGold: 0n,
          experienceBonusPercent: 0,
          goldBonusPercent: 0,
        },
        createRandomSource(0)
      )
    ).toMatchObject({
      finalExperience: 0n,
      baseGold: 0n,
      finalGold: 0n,
    });
  });

  it("rejects an invalid Gold range", () => {
    expect(() =>
      rollBaseGold(
        20n,
        10n,
        createRandomSource(15)
      )
    ).toThrow(
      "Minimum Gold cannot exceed maximum Gold."
    );
  });

  it("rejects unsafe random bounds", () => {
    expect(() =>
      rollBaseGold(
        0n,
        BigInt(Number.MAX_SAFE_INTEGER) +
          1n,
        createRandomSource(0)
      )
    ).toThrow(
      "Maximum Gold must fit within a safe integer for random selection."
    );
  });

  it("rejects an invalid RNG result", () => {
    expect(() =>
      rollBaseGold(
        10n,
        20n,
        createRandomSource(21)
      )
    ).toThrow();
  });

  it("rolls Gold exactly once", () => {
    const randomSource =
      createRandomSource(12);

    calculateVictoryRewards(
      {
        baseExperience: 50n,
        minimumGold: 10n,
        maximumGold: 20n,
        experienceBonusPercent: 0,
        goldBonusPercent: 0,
      },
      randomSource
    );

    expect(
      randomSource.nextInt
    ).toHaveBeenCalledOnce();
  });
});
