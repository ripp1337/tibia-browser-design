import { describe, expect, it } from "vitest";

import { SystemClock } from "../../../src/infrastructure/clock/system-clock.js";

describe("SystemClock", () => {
  it("returns a valid current date", () => {
    const clock = new SystemClock();

    const before = Date.now();
    const result = clock.now();
    const after = Date.now();

    expect(result).toBeInstanceOf(Date);
    expect(result.getTime()).toBeGreaterThanOrEqual(before);
    expect(result.getTime()).toBeLessThanOrEqual(after);
  });

  it("returns a new Date instance for each call", () => {
    const clock = new SystemClock();

    const first = clock.now();
    const second = clock.now();

    expect(first).not.toBe(second);
  });
});