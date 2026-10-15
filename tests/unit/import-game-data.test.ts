import {
  describe,
  expect,
  it,
} from "vitest";

import {
  validateInclusiveIntegerRange,
  validateMonsterExperienceReward,
  validateNonNegativeInteger,
  validatePositiveInteger,
  validateSpecialItemSourceOwner,
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


describe("M7 game-data validation helpers", () => {
  it.each([1, "10", "9223372036854775807"])(
    "accepts positive integer %s",
    (value) => expect(validatePositiveInteger(value, "selection_weight")).toBeNull()
  );

  it.each([null, "", 0, -1, "1.5"])(
    "rejects invalid positive integer %s",
    (value) => expect(validatePositiveInteger(value, "selection_weight")).not.toBeNull()
  );

  it.each([0, 1, "100"])(
    "accepts non-negative integer %s",
    (value) => expect(validateNonNegativeInteger(value, "coefficient")).toBeNull()
  );

  it("validates inclusive whole-number ranges", () => {
    expect(validateInclusiveIntegerRange(1, 10)).toBeNull();
    expect(validateInclusiveIntegerRange(10, 1)).toBe(
      "min_value must not exceed max_value."
    );
    expect(validateInclusiveIntegerRange("1.5", 2)).toBe(
      "min_value and max_value must be non-negative integers."
    );
  });

  it("requires exactly one special-item source owner", () => {
    expect(validateSpecialItemSourceOwner("monster", null)).toBeNull();
    expect(validateSpecialItemSourceOwner(null, "family")).toBeNull();
    expect(validateSpecialItemSourceOwner(null, null)).not.toBeNull();
    expect(validateSpecialItemSourceOwner("monster", "family")).not.toBeNull();
  });
});
