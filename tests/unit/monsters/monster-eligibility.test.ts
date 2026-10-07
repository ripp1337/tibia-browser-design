import {
  describe,
  expect,
  it,
} from "vitest";

import {
  calculateLevelEligibility,
  calculateMonsterEligibility,
} from "../../../src/modules/monsters/domain/monster-eligibility.js";

describe("monster eligibility", () => {
  it("allows equal character and monster level", () => {
    expect(
      calculateLevelEligibility(10, 10)
    ).toEqual({
      isEligible: true,
      reasons: [],
    });
  });

  it("allows higher character level", () => {
    expect(
      calculateLevelEligibility(15, 10)
    ).toEqual({
      isEligible: true,
      reasons: [],
    });
  });

  it("rejects lower character level", () => {
    expect(
      calculateLevelEligibility(9, 10)
    ).toEqual({
      isEligible: false,
      reasons: ["LEVEL_TOO_LOW"],
    });
  });

  it("applies an individual cooldown to a normal monster", () => {
    expect(
      calculateMonsterEligibility({
        characterLevel: 10,
        monsterLevel: 10,
        monsterType: "Normal",
        cooldownActive: true,
        taskStatus: null,
      })
    ).toEqual({
      isEligible: false,
      reasons: ["COOLDOWN_ACTIVE"],
    });
  });

  it("applies an individual cooldown to a Mini Boss", () => {
    expect(
      calculateMonsterEligibility({
        characterLevel: 10,
        monsterLevel: 10,
        monsterType: "MiniBoss",
        cooldownActive: true,
        taskStatus: null,
      })
    ).toEqual({
      isEligible: false,
      reasons: ["COOLDOWN_ACTIVE"],
    });
  });

  it("reports incomplete Task Boss progress", () => {
    expect(
      calculateMonsterEligibility({
        characterLevel: 10,
        monsterLevel: 10,
        monsterType: "TaskBoss",
        cooldownActive: false,
        taskStatus: "ACTIVE",
      })
    ).toEqual({
      isEligible: false,
      reasons: [
        "TASK_PROGRESS_INCOMPLETE",
      ],
    });
  });

  it("allows an UNLOCKED Task Boss", () => {
    expect(
      calculateMonsterEligibility({
        characterLevel: 10,
        monsterLevel: 10,
        monsterType: "TaskBoss",
        cooldownActive: false,
        taskStatus: "UNLOCKED",
      })
    ).toEqual({
      isEligible: true,
      reasons: [],
    });
  });

  it("requires re-unlock after defeating a Task Boss", () => {
    expect(
      calculateMonsterEligibility({
        characterLevel: 10,
        monsterLevel: 10,
        monsterType: "TaskBoss",
        cooldownActive: false,
        taskStatus:
          "WAITING_FOR_REUNLOCK",
      })
    ).toEqual({
      isEligible: false,
      reasons: [
        "TASK_REUNLOCK_REQUIRED",
      ],
    });
  });

  it("ignores ordinary cooldown state for a Task Boss", () => {
    expect(
      calculateMonsterEligibility({
        characterLevel: 10,
        monsterLevel: 10,
        monsterType: "TaskBoss",
        cooldownActive: true,
        taskStatus: "UNLOCKED",
      })
    ).toEqual({
      isEligible: true,
      reasons: [],
    });
  });

  it("combines level and Task Boss restrictions", () => {
    expect(
      calculateMonsterEligibility({
        characterLevel: 8,
        monsterLevel: 10,
        monsterType: "TaskBoss",
        cooldownActive: true,
        taskStatus: "ACTIVE",
      })
    ).toEqual({
      isEligible: false,
      reasons: [
        "LEVEL_TOO_LOW",
        "TASK_PROGRESS_INCOMPLETE",
      ],
    });
  });

  it("rejects invalid levels", () => {
    expect(() =>
      calculateLevelEligibility(0, 1)
    ).toThrow(
      "characterLevel must be a positive safe integer."
    );

    expect(() =>
      calculateLevelEligibility(1, 0)
    ).toThrow(
      "monsterLevel must be a positive safe integer."
    );
  });
});
