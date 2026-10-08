import {
  describe,
  expect,
  it,
} from "vitest";

import {
  POSTGRES_BIGINT_MAX,
  adjustResourcesAfterLevelGain,
  adjustResourcesAfterLevelLoss,
  calculateDeathLoss,
  calculateReward,
  experienceThreshold,
  levelFromExperience,
  percentagePointsToBasisPoints,
} from "../../../src/modules/progression/domain/progression.js";

describe("M6 progression domain", () => {
  it.each([
    [1, 0n],
    [2, 100n],
    [3, 200n],
    [8, 4_200n],
    [20, 98_800n],
    [40, 917_800n],
    [50, 1_847_300n],
    [100, 15_694_800n],
  ])(
    "calculates XP threshold for level %i",
    (level, expected) => {
      expect(
        experienceThreshold(level)
      ).toBe(expected);
    }
  );

  it("finds levels at exact boundaries", () => {
    expect(levelFromExperience(0n)).toBe(1);
    expect(levelFromExperience(99n)).toBe(1);
    expect(levelFromExperience(100n)).toBe(2);
    expect(levelFromExperience(199n)).toBe(2);
    expect(levelFromExperience(200n)).toBe(3);
    expect(levelFromExperience(4_200n)).toBe(8);
    expect(levelFromExperience(15_694_800n)).toBe(100);
  });

  it("supports large valid Experience efficiently", () => {
    const level =
      levelFromExperience(
        POSTGRES_BIGINT_MAX
      );

    expect(level).toBeGreaterThan(100);
  });

  it("rejects invalid progression values", () => {
    expect(() =>
      experienceThreshold(0)
    ).toThrow();

    expect(() =>
      experienceThreshold(1.5)
    ).toThrow();

    expect(() =>
      levelFromExperience(-1n)
    ).toThrow();

    expect(() =>
      levelFromExperience(
        POSTGRES_BIGINT_MAX + 1n
      )
    ).toThrow();
  });

  it.each([
    [0, 0n],
    [2.5, 250n],
    [10, 1_000n],
    [12.34, 1_234n],
  ])(
    "converts %s percentage points",
    (percentage, expected) => {
      expect(
        percentagePointsToBasisPoints(
          percentage
        )
      ).toBe(expected);
    }
  );

  it("calculates rewards and rounds down once", () => {
    expect(calculateReward(100n, 0n))
      .toBe(100n);

    expect(calculateReward(100n, 250n))
      .toBe(102n);

    expect(calculateReward(99n, 250n))
      .toBe(101n);

    expect(calculateReward(0n, 5_000n))
      .toBe(0n);
  });

  it("rejects invalid reward values and overflow", () => {
    expect(() =>
      calculateReward(-1n, 0n)
    ).toThrow();

    expect(() =>
      calculateReward(100n, -1n)
    ).toThrow();

    expect(() =>
      calculateReward(
        POSTGRES_BIGINT_MAX,
        1n
      )
    ).toThrow();

    expect(() =>
      percentagePointsToBasisPoints(
        1.001
      )
    ).toThrow();
  });

  it.each([
    [false, false, 10],
    [true, false, 8],
    [false, true, 6],
    [true, true, 4],
  ] as const)(
    "uses death modifier promoted=%s blessed=%s",
    (promoted, blessed, expectedPercent) => {
      const result =
        calculateDeathLoss(
          1_001n,
          promoted,
          blessed
        );

      expect(result.lossPercent)
        .toBe(expectedPercent);

      expect(result.experienceLost)
        .toBe(
          1_001n *
          BigInt(expectedPercent) /
          100n
        );

      expect(result.remainingExperience)
        .toBe(
          1_001n -
          result.experienceLost
        );
    }
  );

  it("supports multiple level gains without full healing", () => {
    const result =
      adjustResourcesAfterLevelGain(
        {
          currentHealth: 40,
          maximumHealth: 180,
          currentMana: 10,
          maximumMana: 35,
          currentEnergy: 60,
          maximumEnergy: 100,
        },
        1,
        3
      );

    expect(result).toEqual({
      currentHealth: 100,
      maximumHealth: 240,
      currentMana: 40,
      maximumMana: 65,
      currentEnergy: 60,
      maximumEnergy: 100,
    });
  });

  it("clamps resources after level loss", () => {
    const result =
      adjustResourcesAfterLevelLoss(
        {
          currentHealth: 500,
          maximumHealth: 750,
          currentMana: 300,
          maximumMana: 320,
          currentEnergy: 180,
          maximumEnergy: 180,
        },
        2,
        "TurnLimitExceeded"
      );

    expect(result).toEqual({
      currentHealth: 210,
      maximumHealth: 210,
      currentMana: 50,
      maximumMana: 50,
      currentEnergy: 100,
      maximumEnergy: 100,
    });
  });

  it("sets Health to zero after Health depletion", () => {
    const result =
      adjustResourcesAfterLevelLoss(
        {
          currentHealth: 25,
          maximumHealth: 240,
          currentMana: 20,
          maximumMana: 65,
          currentEnergy: 30,
          maximumEnergy: 100,
        },
        1,
        "PlayerHealthDepleted"
      );

    expect(result.currentHealth).toBe(0);
    expect(result.currentMana).toBe(20);
    expect(result.currentEnergy).toBe(30);
  });
});
