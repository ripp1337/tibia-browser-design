import {
  describe,
  expect,
  it,
} from "vitest";

import {
  validateMonsterExperienceReward,
} from "../../scripts/import-game-data.js";

describe("monster Experience reward import validation", () => {
  it.each([
    [null, "experience_reward is required."],
    ["", "experience_reward is required."],
    ["abc", "experience_reward must be a non-negative integer."],
    ["1.5", "experience_reward must be a non-negative integer."],
    ["-1", "experience_reward must be a non-negative integer."],
    [0, "experience_reward must be between 1 and PostgreSQL BIGINT maximum."],
    [
      "9223372036854775808",
      "experience_reward must be between 1 and PostgreSQL BIGINT maximum.",
    ],
  ])(
    "rejects invalid value %s",
    (value, expected) => {
      expect(
        validateMonsterExperienceReward(value)
      ).toBe(expected);
    }
  );

  it.each([
    1,
    50,
    "500",
    "9223372036854775807",
  ])(
    "accepts valid value %s",
    (value) => {
      expect(
        validateMonsterExperienceReward(value)
      ).toBeNull();
    }
  );
});
