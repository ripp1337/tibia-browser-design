import {
  describe,
  expect,
  it,
} from "vitest";

import {
  calculateMonsterCooldown,
} from "../../../src/modules/monsters/domain/monster-cooldown.js";

describe("monster cooldown", () => {
  const now = new Date(
    "2026-10-07T10:00:00.000Z"
  );

  it("returns inactive when cooldown does not exist", () => {
    expect(
      calculateMonsterCooldown(null, now)
    ).toEqual({
      isActive: false,
      availableAt: null,
    });
  });

  it("returns active for a future timestamp", () => {
    const availableAt = new Date(
      "2026-10-07T11:00:00.000Z"
    );

    expect(
      calculateMonsterCooldown(
        availableAt,
        now
      )
    ).toEqual({
      isActive: true,
      availableAt,
    });
  });

  it("returns inactive for an expired timestamp", () => {
    const availableAt = new Date(
      "2026-10-07T09:00:00.000Z"
    );

    expect(
      calculateMonsterCooldown(
        availableAt,
        now
      )
    ).toEqual({
      isActive: false,
      availableAt,
    });
  });

  it("returns inactive when timestamp equals current time", () => {
    expect(
      calculateMonsterCooldown(now, now)
    ).toEqual({
      isActive: false,
      availableAt: now,
    });
  });

  it("rejects an invalid current time", () => {
    expect(() =>
      calculateMonsterCooldown(
        null,
        new Date("invalid")
      )
    ).toThrow(
      "now must contain a valid date."
    );
  });

  it("rejects an invalid cooldown timestamp", () => {
    expect(() =>
      calculateMonsterCooldown(
        new Date("invalid"),
        now
      )
    ).toThrow(
      "availableAt must contain a valid date."
    );
  });
});
