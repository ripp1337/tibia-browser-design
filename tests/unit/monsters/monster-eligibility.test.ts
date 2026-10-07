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

  it("reports incomplete Task Boss progress for ACTIVE status", () => {
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

  it("reports incomplete Task Boss progress when state does not exist", () => {
    expect(
      calculateMonsterEligibility({
        characterLevel: 10,
        monsterLevel: 10,
        monsterType: "TaskBoss",
        cooldownActive: false,
        taskStatus: null,
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

  it("combines level, cooldown and Task Boss reasons", () => {
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
        "COOLDOWN_ACTIVE",
        "TASK_PROGRESS_INCOMPLETE",
      ],
    });
  });

  it("does not apply Task Boss rules to a normal monster", () => {
    expect(
      calculateMonsterEligibility({
        characterLevel: 10,
        monsterLevel: 10,
        monsterType: "Normal",
        cooldownActive: false,
        taskStatus: null,
      })
    ).toEqual({
      isEligible: true,
      reasons: [],
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
