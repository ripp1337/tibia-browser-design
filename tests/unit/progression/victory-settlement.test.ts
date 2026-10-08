import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  PERSISTENT_COMBAT_STATUS,
  type CombatSessionSnapshot,
} from "../../../src/modules/combat/application/combat-session.models.js";
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
import type {
  RandomSource,
} from "../../../src/modules/combat/ports/random-source.js";
import {
  planVictorySettlement,
} from "../../../src/modules/progression/domain/victory-settlement.js";

function createSession():
CombatSessionSnapshot {
  return {
    combatSessionId: "session-1",
    characterId: "character-1",
    monsterId: "monster-1",
    monsterCode: "dev_rat",
    status:
      PERSISTENT_COMBAT_STATUS.active,
    defeatReason: null,
    currentTurn: 1,
    player: {
      currentHealth: 40,
      maximumHealth: 180,
      attack: 20,
      defense: 10,
    },
    monster: {
      currentHealth: 10,
      maximumHealth: 80,
      attack: 15,
      defense: 8,
    },
    rewards: {
      monsterExperienceReward: 200n,
      monsterGoldMinimum: 10n,
      monsterGoldMaximum: 20n,
    },
    startedAt:
      new Date("2026-10-08T20:00:00.000Z"),
    endedAt: null,
    settledAt: null,
  };
}

function createContext():
CombatSettlementContext {
  return {
    character: {
      characterId: "character-1",
      level: 1,
      experience: 0n,
      gold: 100n,
      resources: {
        currentHealth: 40,
        maximumHealth: 180,
        currentMana: 10,
        maximumMana: 35,
        currentEnergy: 60,
        maximumEnergy: 100,
        resourcesUpdatedAt:
          new Date("2026-10-08T20:00:00.000Z"),
      },
    },
    promoted: false,
    blessed: false,
    statistics: {
      totalGoldEarned: 0n,
      highestGoldOwned: 100n,
      totalMonstersKilled: 0n,
      totalBossesKilled: 0n,
      totalDailyBossesKilled: 0n,
      totalDeaths: 0n,
      totalDamageDealt: 0n,
      totalDamageTaken: 0n,
      highestPhysicalHit: 0n,
      strongestMonsterKilledId: null,
      strongestMonsterPowerScore: null,
      strongestBossKilledId: null,
      strongestBossPowerScore: null,
      currentNoDeathStreak: 0n,
      longestNoDeathStreak: 0n,
    },
    rewardBonuses: {
      goldBonusPercent: 25,
      experienceBonusPercent: 10,
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
    damage: 25,
  },
  {
    type:
      COMBAT_EVENT_TYPE.attackResolved,
    actor: COMBAT_ACTOR.monster,
    target: COMBAT_ACTOR.player,
    hit: true,
    damage: 8,
  },
];

describe("M6 Victory settlement plan", () => {
  it("calculates rewards, levels, resources and statistics", () => {
    const randomSource: RandomSource = {
      nextFloat: vi.fn(() => 0),
      nextInt: vi.fn(() => 20),
    };

    const result =
      planVictorySettlement(
        createSession(),
        createContext(),
        40,
        events,
        randomSource
      );

    expect(result).toMatchObject({
      baseExperience: 200n,
      baseGold: 20n,
      experienceAwarded: 220n,
      goldAwarded: 25n,
      experienceBefore: 0n,
      experienceAfter: 220n,
      goldBefore: 100n,
      goldAfter: 125n,
      levelBefore: 1,
      levelAfter: 3,
      damageDealt: 25n,
      damageTaken: 8n,
      highestPhysicalHit: 25n,
      resourcesAfter: {
        currentHealth: 100,
        maximumHealth: 240,
        currentMana: 40,
        maximumMana: 65,
        currentEnergy: 60,
        maximumEnergy: 100,
      },
      statisticsAfter: {
        totalGoldEarned: 25n,
        highestGoldOwned: 125n,
        totalMonstersKilled: 1n,
        totalBossesKilled: 0n,
        totalDailyBossesKilled: 0n,
        totalDamageDealt: 25n,
        totalDamageTaken: 8n,
        highestPhysicalHit: 25n,
        currentNoDeathStreak: 1n,
        longestNoDeathStreak: 1n,
      },
    });

    expect(
      randomSource.nextInt
    ).toHaveBeenCalledWith(10, 20);
  });

  it("supports zero rewards without rolling equal Gold bounds", () => {
    const session = createSession();

    session.rewards = {
      monsterExperienceReward: 0n,
      monsterGoldMinimum: 0n,
      monsterGoldMaximum: 0n,
    };

    const randomSource: RandomSource = {
      nextFloat: vi.fn(() => 0),
      nextInt: vi.fn(),
    };

    const result =
      planVictorySettlement(
        session,
        createContext(),
        40,
        [],
        randomSource
      );

    expect(result.experienceAwarded)
      .toBe(0n);

    expect(result.goldAwarded)
      .toBe(0n);

    expect(result.levelAfter)
      .toBe(1);

    expect(
      randomSource.nextInt
    ).not.toHaveBeenCalled();
  });

  it("rejects mismatched authoritative entities", () => {
    const context = createContext();

    context.monster.monsterId =
      "different-monster";

    expect(() =>
      planVictorySettlement(
        createSession(),
        context,
        40,
        [],
        {
          nextFloat: vi.fn(() => 0),
          nextInt: vi.fn(() => 10),
        }
      )
    ).toThrow(
      "Settlement monster does not match combat session."
    );
  });

  it("rejects progression overflow", () => {
    const context = createContext();

    context.character.gold =
      9_223_372_036_854_775_807n;

    expect(() =>
      planVictorySettlement(
        createSession(),
        context,
        40,
        [],
        {
          nextFloat: vi.fn(() => 0),
          nextInt: vi.fn(() => 20),
        }
      )
    ).toThrow(
      "Gold after Victory exceeds PostgreSQL BIGINT."
    );
  });

  it("increments boss and Daily Boss statistics", () => {
    const context = createContext();

    context.monster.bossId =
      "boss-1";

    context.monster.bossType =
      "DailyBoss";

    context.statistics
      .totalMonstersKilled = 10n;

    context.statistics
      .totalBossesKilled = 4n;

    context.statistics
      .totalDailyBossesKilled = 2n;

    context.statistics
      .currentNoDeathStreak = 5n;

    context.statistics
      .longestNoDeathStreak = 8n;

    const result =
      planVictorySettlement(
        createSession(),
        context,
        40,
        events,
        {
          nextFloat: vi.fn(() => 0),
          nextInt: vi.fn(() => 10),
        }
      );

    expect(
      result.statisticsAfter
    ).toMatchObject({
      totalMonstersKilled: 11n,
      totalBossesKilled: 5n,
      totalDailyBossesKilled: 3n,
      currentNoDeathStreak: 6n,
      longestNoDeathStreak: 8n,
    });
  });

  it("rejects statistics overflow", () => {
    const context = createContext();

    context.statistics
      .totalMonstersKilled =
      9_223_372_036_854_775_807n;

    expect(() =>
      planVictorySettlement(
        createSession(),
        context,
        40,
        [],
        {
          nextFloat: vi.fn(() => 0),
          nextInt: vi.fn(() => 10),
        }
      )
    ).toThrow(
      "Total monsters killed after Victory exceeds PostgreSQL BIGINT."
    );
  });


  it("updates strongest defeated opponents by power score", () => {
    const context = createContext();

    context.monster.bossId =
      "boss-strong";
    context.monster.bossType =
      "MiniBoss";
    context.monster.powerScore =
      500n;

    context.statistics
      .strongestMonsterKilledId =
      "monster-old";
    context.statistics
      .strongestMonsterPowerScore =
      400n;

    context.statistics
      .strongestBossKilledId =
      "boss-old";
    context.statistics
      .strongestBossPowerScore =
      450n;

    const result =
      planVictorySettlement(
        createSession(),
        context,
        40,
        [],
        {
          nextFloat: vi.fn(() => 0),
          nextInt: vi.fn(() => 10),
        }
      );

    expect(
      result.strongestMonsterKilledIdAfter
    ).toBe("monster-1");

    expect(
      result.strongestBossKilledIdAfter
    ).toBe("boss-strong");
  });

  it("preserves stronger historical opponents", () => {
    const context = createContext();

    context.monster.bossId =
      "boss-weaker";
    context.monster.bossType =
      "MiniBoss";
    context.monster.powerScore =
      100n;

    context.statistics
      .strongestMonsterKilledId =
      "monster-strong";
    context.statistics
      .strongestMonsterPowerScore =
      900n;

    context.statistics
      .strongestBossKilledId =
      "boss-strong";
    context.statistics
      .strongestBossPowerScore =
      800n;

    const result =
      planVictorySettlement(
        createSession(),
        context,
        40,
        [],
        {
          nextFloat: vi.fn(() => 0),
          nextInt: vi.fn(() => 10),
        }
      );

    expect(
      result.strongestMonsterKilledIdAfter
    ).toBe("monster-strong");

    expect(
      result.strongestBossKilledIdAfter
    ).toBe("boss-strong");
  });


  it("uses terminal Health from the ending action", () => {
    const context = createContext();

    context.character.resources
      .currentHealth = 100;

    const result =
      planVictorySettlement(
        createSession(),
        context,
        25,
        [],
        {
          nextFloat: vi.fn(() => 0),
          nextInt: vi.fn(() => 10),
        }
      );

    expect(
      result.resourcesAfter.currentHealth
    ).toBe(85);

    expect(
      result.resourcesAfter.maximumHealth
    ).toBe(240);
  });

  it("rejects invalid terminal Health", () => {
    expect(() =>
      planVictorySettlement(
        createSession(),
        createContext(),
        181,
        [],
        {
          nextFloat: vi.fn(() => 0),
          nextInt: vi.fn(() => 10),
        }
      )
    ).toThrow(
      "Terminal player Health is invalid."
    );
  });

});
