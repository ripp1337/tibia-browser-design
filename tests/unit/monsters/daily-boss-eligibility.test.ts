import {
  describe,
  expect,
  it,
} from "vitest";

import {
  calculateMonsterEligibility,
} from "../../../src/modules/monsters/domain/monster-eligibility.js";

describe("Daily Boss eligibility", () => {
  it("allows an active Daily Boss with remaining attempts", () => {
    expect(
      calculateMonsterEligibility({
        characterLevel: 20,
        monsterLevel: 20,
        monsterType: "DailyBoss",
        cooldownActive: false,
        taskStatus: null,

        dailyBossAvailable: true,
        dailyAttemptsUsed: 0,
        dailyAttemptsPerDay: 1,
      })
    ).toEqual({
      isEligible: true,
      reasons: [],
    });
  });

  it("rejects a Daily Boss outside the active rotation", () => {
    expect(
      calculateMonsterEligibility({
        characterLevel: 20,
        monsterLevel: 20,
        monsterType: "DailyBoss",
        cooldownActive: false,
        taskStatus: null,

        dailyBossAvailable: false,
      })
    ).toEqual({
      isEligible: false,
      reasons: [
        "DAILY_BOSS_UNAVAILABLE",
      ],
    });
  });

  it("rejects a Daily Boss after exhausting attempts", () => {
    expect(
      calculateMonsterEligibility({
        characterLevel: 20,
        monsterLevel: 20,
        monsterType: "DailyBoss",
        cooldownActive: false,
        taskStatus: null,

        dailyBossAvailable: true,
        dailyAttemptsUsed: 1,
        dailyAttemptsPerDay: 1,
      })
    ).toEqual({
      isEligible: false,
      reasons: [
        "DAILY_ATTEMPTS_EXHAUSTED",
      ],
    });
  });

  it("combines level and rotation restrictions", () => {
    expect(
      calculateMonsterEligibility({
        characterLevel: 19,
        monsterLevel: 20,
        monsterType: "DailyBoss",
        cooldownActive: false,
        taskStatus: null,

        dailyBossAvailable: false,
      })
    ).toEqual({
      isEligible: false,
      reasons: [
        "LEVEL_TOO_LOW",
        "DAILY_BOSS_UNAVAILABLE",
      ],
    });
  });

  it("ignores ordinary cooldown state for a Daily Boss", () => {
    expect(
      calculateMonsterEligibility({
        characterLevel: 20,
        monsterLevel: 20,
        monsterType: "DailyBoss",
        cooldownActive: true,
        taskStatus: null,

        dailyBossAvailable: true,
        dailyAttemptsUsed: 0,
        dailyAttemptsPerDay: 1,
      })
    ).toEqual({
      isEligible: true,
      reasons: [],
    });
  });
});
