import type {
  CombatSettlementContext,
} from "../../combat/application/combat-session.repository.js";
import type {
  CombatSessionSnapshot,
} from "../../combat/application/combat-session.models.js";
import type {
  CombatEvent,
} from "../../combat/domain/combat.types.js";
import type {
  RandomSource,
} from "../../combat/ports/random-source.js";
import {
  adjustResourcesAfterLevelGain,
  aggregateCombatStatistics,
  calculateReward,
  levelFromExperience,
  percentagePointsToBasisPoints,
  POSTGRES_BIGINT_MAX,
  type ProgressionResources,
} from "./progression.js";
import {
  rollBigIntInclusive,
} from "./gold-roll.js";

export type VictoryStatisticsAfter = {
  totalGoldEarned: bigint;
  highestGoldOwned: bigint;
  totalMonstersKilled: bigint;
  totalBossesKilled: bigint;
  totalDailyBossesKilled: bigint;
  totalDamageDealt: bigint;
  totalDamageTaken: bigint;
  highestPhysicalHit: bigint;
  currentNoDeathStreak: bigint;
  longestNoDeathStreak: bigint;
};

export type VictorySettlementPlan = {
  baseExperience: bigint;
  baseGold: bigint;
  experienceBonusBasisPoints: bigint;
  goldBonusBasisPoints: bigint;
  experienceAwarded: bigint;
  goldAwarded: bigint;
  experienceBefore: bigint;
  experienceAfter: bigint;
  goldBefore: bigint;
  goldAfter: bigint;
  levelBefore: number;
  levelAfter: number;
  resourcesAfter: ProgressionResources;
  damageDealt: bigint;
  damageTaken: bigint;
  highestPhysicalHit: bigint;

  strongestMonsterKilledIdAfter:
    string;
  strongestBossKilledIdAfter:
    string | null;

  statisticsAfter:
    VictoryStatisticsAfter;
};

function checkedAdd(
  left: bigint,
  right: bigint,
  fieldName: string
): bigint {
  const result = left + right;

  if (
    result < 0n ||
    result > POSTGRES_BIGINT_MAX
  ) {
    throw new RangeError(
      `${fieldName} exceeds PostgreSQL BIGINT.`
    );
  }

  return result;
}

export function planVictorySettlement(
  session: CombatSessionSnapshot,
  context: CombatSettlementContext,
  terminalPlayerHealth: number,
  events: readonly CombatEvent[],
  randomSource: RandomSource
): VictorySettlementPlan {
  if (
    session.characterId !==
    context.character.characterId
  ) {
    throw new Error(
      "Settlement character does not match combat session."
    );
  }

  if (
    session.monsterId !==
    context.monster.monsterId
  ) {
    throw new Error(
      "Settlement monster does not match combat session."
    );
  }

  const baseExperience =
    session.rewards
      .monsterExperienceReward;

  const baseGold =
    rollBigIntInclusive(
      session.rewards
        .monsterGoldMinimum,
      session.rewards
        .monsterGoldMaximum,
      randomSource
    );

  const experienceBonusBasisPoints =
    percentagePointsToBasisPoints(
      context.rewardBonuses
        .experienceBonusPercent
    );

  const goldBonusBasisPoints =
    percentagePointsToBasisPoints(
      context.rewardBonuses
        .goldBonusPercent
    );

  const experienceAwarded =
    calculateReward(
      baseExperience,
      experienceBonusBasisPoints
    );

  const goldAwarded =
    calculateReward(
      baseGold,
      goldBonusBasisPoints
    );

  const experienceAfter =
    checkedAdd(
      context.character.experience,
      experienceAwarded,
      "Experience after Victory"
    );

  const goldAfter =
    checkedAdd(
      context.character.gold,
      goldAwarded,
      "Gold after Victory"
    );

  const levelAfter =
    levelFromExperience(
      experienceAfter
    );

  if (
    levelAfter <
    context.character.level
  ) {
    throw new Error(
      "Victory cannot reduce character level."
    );
  }

  if (
    !Number.isSafeInteger(
      terminalPlayerHealth
    ) ||
    terminalPlayerHealth < 0 ||
    terminalPlayerHealth >
      context.character.resources
        .maximumHealth
  ) {
    throw new Error(
      "Terminal player Health is invalid."
    );
  }

  const resourcesAfter =
    adjustResourcesAfterLevelGain(
      {
        ...context.character.resources,
        currentHealth:
          terminalPlayerHealth,
      },
      context.character.level,
      levelAfter
    );

  const statistics =
    aggregateCombatStatistics(
      events
    );

  const totalGoldEarned =
    checkedAdd(
      context.statistics
        .totalGoldEarned,
      goldAwarded,
      "Total Gold earned after Victory"
    );

  const totalMonstersKilled =
    checkedAdd(
      context.statistics
        .totalMonstersKilled,
      1n,
      "Total monsters killed after Victory"
    );

  const totalBossesKilled =
    checkedAdd(
      context.statistics
        .totalBossesKilled,
      context.monster.bossId === null
        ? 0n
        : 1n,
      "Total bosses killed after Victory"
    );

  const totalDailyBossesKilled =
    checkedAdd(
      context.statistics
        .totalDailyBossesKilled,
      context.monster.bossType ===
      "DailyBoss"
        ? 1n
        : 0n,
      "Total Daily Bosses killed after Victory"
    );

  const totalDamageDealt =
    checkedAdd(
      context.statistics
        .totalDamageDealt,
      statistics.damageDealt,
      "Total damage dealt after Victory"
    );

  const totalDamageTaken =
    checkedAdd(
      context.statistics
        .totalDamageTaken,
      statistics.damageTaken,
      "Total damage taken after Victory"
    );

  const currentNoDeathStreak =
    checkedAdd(
      context.statistics
        .currentNoDeathStreak,
      1n,
      "Current no-death streak after Victory"
    );

  const strongestMonsterKilledIdAfter =
    context.statistics
      .strongestMonsterPowerScore ===
      null ||
    context.monster.powerScore >
      context.statistics
        .strongestMonsterPowerScore
      ? context.monster.monsterId
      : context.statistics
          .strongestMonsterKilledId ??
        context.monster.monsterId;

  const strongestBossKilledIdAfter =
    context.monster.bossId === null
      ? context.statistics
          .strongestBossKilledId
      : context.statistics
            .strongestBossPowerScore ===
          null ||
        context.monster.powerScore >
          context.statistics
            .strongestBossPowerScore
        ? context.monster.bossId
        : context.statistics
            .strongestBossKilledId ??
          context.monster.bossId;

  const statisticsAfter:
    VictoryStatisticsAfter = {
      totalGoldEarned,

      highestGoldOwned:
        goldAfter >
        context.statistics
          .highestGoldOwned
          ? goldAfter
          : context.statistics
              .highestGoldOwned,

      totalMonstersKilled,
      totalBossesKilled,
      totalDailyBossesKilled,
      totalDamageDealt,
      totalDamageTaken,

      highestPhysicalHit:
        statistics.highestPhysicalHit >
        context.statistics
          .highestPhysicalHit
          ? statistics.highestPhysicalHit
          : context.statistics
              .highestPhysicalHit,

      currentNoDeathStreak,

      longestNoDeathStreak:
        currentNoDeathStreak >
        context.statistics
          .longestNoDeathStreak
          ? currentNoDeathStreak
          : context.statistics
              .longestNoDeathStreak,
    };

  return {
    baseExperience,
    baseGold,
    experienceBonusBasisPoints,
    goldBonusBasisPoints,
    experienceAwarded,
    goldAwarded,
    experienceBefore:
      context.character.experience,
    experienceAfter,
    goldBefore:
      context.character.gold,
    goldAfter,
    levelBefore:
      context.character.level,
    levelAfter,
    resourcesAfter,
    damageDealt:
      statistics.damageDealt,
    damageTaken:
      statistics.damageTaken,
    highestPhysicalHit:
      statistics.highestPhysicalHit,

    strongestMonsterKilledIdAfter,
    strongestBossKilledIdAfter,

    statisticsAfter,
  };
}
