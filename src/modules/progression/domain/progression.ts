import type {
  CombatEvent,
} from "../../combat/domain/combat.types.js";
import {
  COMBAT_ACTOR,
  COMBAT_EVENT_TYPE,
} from "../../combat/domain/combat.constants.js";

﻿import {
  calculateLevelMaximumEnergy,
  calculateLevelMaximumHealth,
  calculateLevelMaximumMana,
} from "../../characters/domain/effective-character-statistics.js";

export const POSTGRES_BIGINT_MAX =
  9_223_372_036_854_775_807n;

export const PERCENTAGE_SCALE = 10_000n;

export type ProgressionResources = {
  currentHealth: number;
  maximumHealth: number;
  currentMana: number;
  maximumMana: number;
  currentEnergy: number;
  maximumEnergy: number;
};

export type ProgressionDefeatReason =
  | "PlayerHealthDepleted"
  | "TurnLimitExceeded";

function assertPostgresBigInt(
  value: bigint,
  fieldName: string
): void {
  if (
    value < 0n ||
    value > POSTGRES_BIGINT_MAX
  ) {
    throw new Error(
      `${fieldName} must be between 0 and PostgreSQL BIGINT maximum.`
    );
  }
}

function rawExperienceThreshold(
  level: bigint
): bigint {
  return (
    (
      50n * level * level * level -
      300n * level * level +
      850n * level -
      600n
    ) / 3n
  );
}

export function experienceThreshold(
  level: number
): bigint {
  if (
    !Number.isSafeInteger(level) ||
    level < 1
  ) {
    throw new Error(
      "Level must be a positive safe integer."
    );
  }

  const threshold =
    rawExperienceThreshold(BigInt(level));

  assertPostgresBigInt(
    threshold,
    "Experience threshold"
  );

  return threshold;
}

export function levelFromExperience(
  experience: bigint
): number {
  assertPostgresBigInt(
    experience,
    "Experience"
  );

  let lower = 1n;
  let upper = 2n;

  while (
    rawExperienceThreshold(upper) <=
    experience
  ) {
    lower = upper;
    upper *= 2n;
  }

  while (lower + 1n < upper) {
    const middle =
      (lower + upper) / 2n;

    if (
      rawExperienceThreshold(middle) <=
      experience
    ) {
      lower = middle;
    } else {
      upper = middle;
    }
  }

  const level = Number(lower);

  if (!Number.isSafeInteger(level)) {
    throw new Error(
      "Calculated level exceeds safe integer range."
    );
  }

  return level;
}

export function percentagePointsToBasisPoints(
  percentagePoints: number
): bigint {
  if (
    !Number.isFinite(percentagePoints) ||
    percentagePoints < 0
  ) {
    throw new Error(
      "Percentage points must be non-negative."
    );
  }

  const scaled =
    percentagePoints * 100;

  if (!Number.isSafeInteger(scaled)) {
    throw new Error(
      "Percentage points support at most two decimal places."
    );
  }

  return BigInt(scaled);
}

export function calculateReward(
  base: bigint,
  bonusBasisPoints: bigint
): bigint {
  assertPostgresBigInt(base, "Base reward");

  if (bonusBasisPoints < 0n) {
    throw new Error(
      "Reward bonus cannot be negative."
    );
  }

  const reward =
    base *
    (PERCENTAGE_SCALE + bonusBasisPoints) /
    PERCENTAGE_SCALE;

  assertPostgresBigInt(
    reward,
    "Final reward"
  );

  return reward;
}

export function calculateDeathLoss(
  experience: bigint,
  promoted: boolean,
  blessed: boolean
): {
  lossPercent: 10 | 8 | 6 | 4;
  experienceLost: bigint;
  remainingExperience: bigint;
  resultingLevel: number;
} {
  assertPostgresBigInt(
    experience,
    "Experience"
  );

  const lossPercent =
    promoted
      ? blessed
        ? 4
        : 8
      : blessed
        ? 6
        : 10;

  const experienceLost =
    experience *
    BigInt(lossPercent) /
    100n;

  const remainingExperience =
    experience - experienceLost;

  return {
    lossPercent,
    experienceLost,
    remainingExperience,
    resultingLevel:
      levelFromExperience(
        remainingExperience
      ),
  };
}

function maximaForLevel(level: number): {
  health: number;
  mana: number;
  energy: number;
} {
  return {
    health:
      calculateLevelMaximumHealth(level),
    mana:
      calculateLevelMaximumMana(level),
    energy:
      calculateLevelMaximumEnergy(level),
  };
}

export function adjustResourcesAfterLevelGain(
  resources: ProgressionResources,
  oldLevel: number,
  newLevel: number
): ProgressionResources {
  if (newLevel < oldLevel) {
    throw new Error(
      "Level gain cannot reduce level."
    );
  }

  const oldMaximums =
    maximaForLevel(oldLevel);
  const newMaximums =
    maximaForLevel(newLevel);

  return {
    currentHealth: Math.min(
      newMaximums.health,
      resources.currentHealth +
        (
          newMaximums.health -
          oldMaximums.health
        )
    ),
    maximumHealth: newMaximums.health,

    currentMana: Math.min(
      newMaximums.mana,
      resources.currentMana +
        (
          newMaximums.mana -
          oldMaximums.mana
        )
    ),
    maximumMana: newMaximums.mana,

    currentEnergy: Math.min(
      resources.currentEnergy,
      newMaximums.energy
    ),
    maximumEnergy: newMaximums.energy,
  };
}

export function adjustResourcesAfterLevelLoss(
  resources: ProgressionResources,
  newLevel: number,
  defeatReason: ProgressionDefeatReason
): ProgressionResources {
  const newMaximums =
    maximaForLevel(newLevel);

  return {
    currentHealth:
      defeatReason ===
      "PlayerHealthDepleted"
        ? 0
        : Math.min(
            resources.currentHealth,
            newMaximums.health
          ),
    maximumHealth: newMaximums.health,

    currentMana: Math.min(
      resources.currentMana,
      newMaximums.mana
    ),
    maximumMana: newMaximums.mana,

    currentEnergy: Math.min(
      resources.currentEnergy,
      newMaximums.energy
    ),
    maximumEnergy: newMaximums.energy,
  };
}


export type CombatStatisticsAggregate = {
  damageDealt: bigint;
  damageTaken: bigint;
  highestPhysicalHit: bigint;
};

export function aggregateCombatStatistics(
  events: readonly CombatEvent[]
): CombatStatisticsAggregate {
  let damageDealt = 0n;
  let damageTaken = 0n;
  let highestPhysicalHit = 0n;

  for (const event of events) {
    if (
      event.type !==
      COMBAT_EVENT_TYPE.attackResolved
    ) {
      continue;
    }

    if (
      !Number.isSafeInteger(event.damage) ||
      event.damage < 0
    ) {
      throw new Error(
        "Combat event damage must be a non-negative safe integer."
      );
    }

    if (!event.hit && event.damage !== 0) {
      throw new Error(
        "A missed attack cannot deal damage."
      );
    }

    const damage = BigInt(event.damage);

    if (
      event.actor === COMBAT_ACTOR.player &&
      event.target === COMBAT_ACTOR.monster
    ) {
      damageDealt += damage;

      if (
        event.hit &&
        damage > highestPhysicalHit
      ) {
        highestPhysicalHit = damage;
      }

      continue;
    }

    if (
      event.actor === COMBAT_ACTOR.monster &&
      event.target === COMBAT_ACTOR.player
    ) {
      damageTaken += damage;
      continue;
    }

    throw new Error(
      "Combat attack event has an invalid actor-target pair."
    );
  }

  return {
    damageDealt,
    damageTaken,
    highestPhysicalHit,
  };
}
