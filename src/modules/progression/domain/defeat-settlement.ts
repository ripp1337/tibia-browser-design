import type {
  CombatSettlementContext,
} from "../../combat/application/combat-session.repository.js";
import type {
  CombatEvent,
} from "../../combat/domain/combat.types.js";
import {
  adjustResourcesAfterLevelLoss,
  aggregateCombatStatistics,
  calculateDeathLoss,
  POSTGRES_BIGINT_MAX,
  type ProgressionDefeatReason,
  type ProgressionResources,
} from "./progression.js";

export type DefeatStatisticsAfter = {
  totalDeaths: bigint;
  totalDamageDealt: bigint;
  totalDamageTaken: bigint;
  highestPhysicalHit: bigint;
  currentNoDeathStreak: bigint;
  longestNoDeathStreak: bigint;
};

export type DefeatSettlementPlan = {
  lossPercent: 10 | 8 | 6 | 4;

  experienceBefore: bigint;
  experienceLost: bigint;
  experienceAfter: bigint;

  goldBefore: bigint;
  goldAfter: bigint;

  levelBefore: number;
  levelAfter: number;

  resourcesAfter:
    ProgressionResources;

  blessingConsumed: boolean;

  damageDealt: bigint;
  damageTaken: bigint;
  highestPhysicalHit: bigint;

  statisticsAfter:
    DefeatStatisticsAfter;
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

export function planDefeatSettlement(
  context: CombatSettlementContext,
  terminalPlayerHealth: number,
  defeatReason: ProgressionDefeatReason,
  events: readonly CombatEvent[]
): DefeatSettlementPlan {
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

  if (
    defeatReason ===
      "PlayerHealthDepleted" &&
    terminalPlayerHealth !== 0
  ) {
    throw new Error(
      "Health-depletion defeat requires zero terminal Health."
    );
  }

  const deathLoss =
    calculateDeathLoss(
      context.character.experience,
      context.promoted,
      context.blessed
    );

  if (
    deathLoss.resultingLevel >
    context.character.level
  ) {
    throw new Error(
      "Defeat cannot increase character level."
    );
  }

  const resourcesAfter =
    adjustResourcesAfterLevelLoss(
      {
        ...context.character.resources,
        currentHealth:
          terminalPlayerHealth,
      },
      deathLoss.resultingLevel,
      defeatReason
    );

  const statistics =
    aggregateCombatStatistics(
      events
    );

  const totalDeaths =
    checkedAdd(
      context.statistics.totalDeaths,
      1n,
      "Total deaths after Defeat"
    );

  const totalDamageDealt =
    checkedAdd(
      context.statistics
        .totalDamageDealt,
      statistics.damageDealt,
      "Total damage dealt after Defeat"
    );

  const totalDamageTaken =
    checkedAdd(
      context.statistics
        .totalDamageTaken,
      statistics.damageTaken,
      "Total damage taken after Defeat"
    );

  return {
    lossPercent:
      deathLoss.lossPercent,

    experienceBefore:
      context.character.experience,
    experienceLost:
      deathLoss.experienceLost,
    experienceAfter:
      deathLoss.remainingExperience,

    goldBefore:
      context.character.gold,
    goldAfter:
      context.character.gold,

    levelBefore:
      context.character.level,
    levelAfter:
      deathLoss.resultingLevel,

    resourcesAfter,

    blessingConsumed:
      context.blessed,

    damageDealt:
      statistics.damageDealt,
    damageTaken:
      statistics.damageTaken,
    highestPhysicalHit:
      statistics.highestPhysicalHit,

    statisticsAfter: {
      totalDeaths,
      totalDamageDealt,
      totalDamageTaken,

      highestPhysicalHit:
        statistics.highestPhysicalHit >
        context.statistics
          .highestPhysicalHit
          ? statistics.highestPhysicalHit
          : context.statistics
              .highestPhysicalHit,

      currentNoDeathStreak: 0n,

      longestNoDeathStreak:
        context.statistics
          .longestNoDeathStreak,
    },
  };
}
