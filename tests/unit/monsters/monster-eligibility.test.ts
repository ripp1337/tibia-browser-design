import { describe, expect, it } from "vitest";

import {
  calculateLevelEligibility,
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
});
