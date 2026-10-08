import type {
  RandomSource,
} from "../../combat/ports/random-source.js";
import {
  validateRandomInteger,
} from "../../combat/domain/combat-validation.js";
import {
  calculateReward,
  percentagePointsToBasisPoints,
} from "./progression.js";

export type CalculateVictoryRewardsInput = {
  baseExperience: bigint;
  minimumGold: bigint;
  maximumGold: bigint;
  experienceBonusPercent: number;
  goldBonusPercent: number;
};

export type VictoryRewards = {
  baseExperience: bigint;
  finalExperience: bigint;
  baseGold: bigint;
  finalGold: bigint;
  experienceBonusBasisPoints: bigint;
  goldBonusBasisPoints: bigint;
};

function toSafeRandomBound(
  value: bigint,
  fieldName: string
): number {
  if (
    value < 0n ||
    value > BigInt(Number.MAX_SAFE_INTEGER)
  ) {
    throw new RangeError(
      `${fieldName} must fit within a safe integer for random selection.`
    );
  }

  return Number(value);
}

export function rollBaseGold(
  minimumGold: bigint,
  maximumGold: bigint,
  randomSource: RandomSource
): bigint {
  if (minimumGold > maximumGold) {
    throw new RangeError(
      "Minimum Gold cannot exceed maximum Gold."
    );
  }

  const minimum =
    toSafeRandomBound(
      minimumGold,
      "Minimum Gold"
    );

  const maximum =
    toSafeRandomBound(
      maximumGold,
      "Maximum Gold"
    );

  const rolled =
    randomSource.nextInt(
      minimum,
      maximum
    );

  validateRandomInteger(
    rolled,
    minimum,
    maximum
  );

  return BigInt(rolled);
}

export function calculateVictoryRewards(
  input: CalculateVictoryRewardsInput,
  randomSource: RandomSource
): VictoryRewards {
  const experienceBonusBasisPoints =
    percentagePointsToBasisPoints(
      input.experienceBonusPercent
    );

  const goldBonusBasisPoints =
    percentagePointsToBasisPoints(
      input.goldBonusPercent
    );

  const baseGold =
    rollBaseGold(
      input.minimumGold,
      input.maximumGold,
      randomSource
    );

  return {
    baseExperience:
      input.baseExperience,

    finalExperience:
      calculateReward(
        input.baseExperience,
        experienceBonusBasisPoints
      ),

    baseGold,

    finalGold:
      calculateReward(
        baseGold,
        goldBonusBasisPoints
      ),

    experienceBonusBasisPoints,
    goldBonusBasisPoints,
  };
}
