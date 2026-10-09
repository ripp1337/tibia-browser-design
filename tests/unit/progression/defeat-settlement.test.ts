import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  CombatSettlementContext,
} from "../../../src/modules/combat/application/combat-session.repository.js";
import {
  COMBAT_ACTOR,
  COMBAT_EVENT_TYPE,
} from "../../../src/modules/combat/domain/combat.constants.js";
import type {
  CombatEvent,
} from "../../../src/modules/combat/domain/combat.types.js";
import {
  planDefeatSettlement,
} from "../../../src/modules/progression/domain/defeat-settlement.js";

function createContext():
CombatSettlementContext {
  return {
    character: {
      characterId: "character-1",
      level: 3,
      experience: 220n,
      gold: 100n,
      resources: {
        currentHealth: 40,
        maximumHealth: 240,
        currentMana: 60,
        maximumMana: 65,
        currentEnergy: 90,
        maximumEnergy: 100,
        resourcesUpdatedAt:
          new Date(
            "2026-10-08T20:00:00.000Z"
          ),
      },
    },

    promoted: false,
    blessed: false,

    statistics: {
      totalGoldEarned: 50n,
      highestGoldOwned: 100n,
      totalMonstersKilled: 5n,
      totalBossesKilled: 1n,
      totalDailyBossesKilled: 0n,
      totalDeaths: 2n,
      totalDamageDealt: 500n,
      totalDamageTaken: 200n,
      highestPhysicalHit: 30n,

      strongestMonsterKilledId: null,
      strongestMonsterPowerScore: null,
      strongestBossKilledId: null,
      strongestBossPowerScore: null,

      currentNoDeathStreak: 4n,
      longestNoDeathStreak: 8n,
    },

    rewardBonuses: {
      goldBonusPercent: 0,
      experienceBonusPercent: 0,
    },

    monster: {
      monsterId: "monster-1",
      monsterType: "Normal",
      powerScore: 10n,
      cooldownSeconds: 30,
      bossId: null,
      bossType: null,
      additionalCooldownSeconds: 0,
    },

    task: null,
    dailyBoss: null,
    fightBuffs: [],
    events: [],
  };
}

const events: CombatEvent[] = [
  {
    type:
      COMBAT_EVENT_TYPE.attackResolved,
    actor: COMBAT_ACTOR.player,
    target: COMBAT_ACTOR.monster,
    hit: true,
    damage: 45,
  },
  {
    type:
      COMBAT_EVENT_TYPE.attackResolved,
    actor: COMBAT_ACTOR.monster,
    target: COMBAT_ACTOR.player,
    hit: true,
    damage: 60,
  },
];

describe(
  "M6 Defeat settlement plan",
  () => {
    it(
      "applies unpromoted death loss and resets the streak",
      () => {
        const result =
          planDefeatSettlement(
            createContext(),
            0,
            "PlayerHealthDepleted",
            events
          );

        expect(result).toMatchObject({
          lossPercent: 10,
          experienceBefore: 220n,
          experienceLost: 22n,
          experienceAfter: 198n,
          goldBefore: 100n,
          goldAfter: 100n,
          levelBefore: 3,
          levelAfter: 2,
          blessingConsumed: false,

          damageDealt: 45n,
          damageTaken: 60n,
          highestPhysicalHit: 45n,

          resourcesAfter: {
            currentHealth: 0,
            maximumHealth: 210,
            currentMana: 50,
            maximumMana: 50,
            currentEnergy: 90,
            maximumEnergy: 100,
          },

          statisticsAfter: {
            totalDeaths: 3n,
            totalDamageDealt: 545n,
            totalDamageTaken: 260n,
            highestPhysicalHit: 45n,
            currentNoDeathStreak: 0n,
            longestNoDeathStreak: 8n,
          },
        });
      }
    );

    it(
      "preserves terminal Health after a turn-limit defeat",
      () => {
        const result =
          planDefeatSettlement(
            createContext(),
            35,
            "TurnLimitExceeded",
            []
          );

        expect(
          result.resourcesAfter
            .currentHealth
        ).toBe(35);

        expect(
          result.resourcesAfter
            .maximumHealth
        ).toBe(210);
      }
    );

    it.each([
      [false, false, 10],
      [true, false, 8],
      [false, true, 6],
      [true, true, 4],
    ] as const)(
      "uses modifier promoted=%s blessed=%s",
      (
        promoted,
        blessed,
        expectedPercent
      ) => {
        const context = createContext();

        context.promoted = promoted;
        context.blessed = blessed;

        const result =
          planDefeatSettlement(
            context,
            0,
            "PlayerHealthDepleted",
            []
          );

        expect(result.lossPercent)
          .toBe(expectedPercent);

        expect(
          result.blessingConsumed
        ).toBe(blessed);
      }
    );

    it(
      "does not reduce Gold or lifetime kill statistics",
      () => {
        const result =
          planDefeatSettlement(
            createContext(),
            0,
            "PlayerHealthDepleted",
            []
          );

        expect(result.goldAfter)
          .toBe(100n);

        expect(
          result.statisticsAfter
        ).not.toHaveProperty(
          "totalMonstersKilled"
        );
      }
    );

    it(
      "rejects nonzero Health for Health-depletion defeat",
      () => {
        expect(() =>
          planDefeatSettlement(
            createContext(),
            1,
            "PlayerHealthDepleted",
            []
          )
        ).toThrow(
          "Health-depletion defeat requires zero terminal Health."
        );
      }
    );

    it(
      "rejects invalid terminal Health",
      () => {
        expect(() =>
          planDefeatSettlement(
            createContext(),
            241,
            "TurnLimitExceeded",
            []
          )
        ).toThrow(
          "Terminal player Health is invalid."
        );
      }
    );

    it(
      "rejects death statistics overflow",
      () => {
        const context =
          createContext();

        context.statistics.totalDeaths =
          9_223_372_036_854_775_807n;

        expect(() =>
          planDefeatSettlement(
            context,
            0,
            "PlayerHealthDepleted",
            []
          )
        ).toThrow(
          "Total deaths after Defeat exceeds PostgreSQL BIGINT."
        );
      }
    );
  }
);
