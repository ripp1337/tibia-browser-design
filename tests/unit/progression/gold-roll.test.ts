import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  RandomSource,
} from "../../../src/modules/combat/ports/random-source.js";
import {
  rollBigIntInclusive,
} from "../../../src/modules/progression/domain/gold-roll.js";
import {
  POSTGRES_BIGINT_MAX,
} from "../../../src/modules/progression/domain/progression.js";

describe("M6 inclusive Gold roll", () => {
  it("uses nextInt for a safe inclusive range", () => {
    const randomSource: RandomSource = {
      nextFloat: vi.fn(() => 0),
      nextInt: vi.fn(() => 15),
    };

    expect(
      rollBigIntInclusive(
        10n,
        20n,
        randomSource
      )
    ).toBe(15n);

    expect(
      randomSource.nextInt
    ).toHaveBeenCalledWith(10, 20);
  });

  it("returns an equal bound without RNG", () => {
    const randomSource: RandomSource = {
      nextFloat: vi.fn(() => 0),
      nextInt: vi.fn(),
    };

    expect(
      rollBigIntInclusive(
        25n,
        25n,
        randomSource
      )
    ).toBe(25n);

    expect(
      randomSource.nextInt
    ).not.toHaveBeenCalled();
  });

  it("uses nextBigInt for an unsafe number range", () => {
    const nextBigInt =
      vi.fn(() => POSTGRES_BIGINT_MAX);

    const randomSource: RandomSource = {
      nextFloat: vi.fn(() => 0),
      nextInt: vi.fn(),
      nextBigInt,
    };

    const minimum =
      BigInt(Number.MAX_SAFE_INTEGER) +
      1n;

    expect(
      rollBigIntInclusive(
        minimum,
        POSTGRES_BIGINT_MAX,
        randomSource
      )
    ).toBe(POSTGRES_BIGINT_MAX);

    expect(
      nextBigInt
    ).toHaveBeenCalledWith(
      minimum,
      POSTGRES_BIGINT_MAX
    );
  });

  it("rejects a large range without nextBigInt", () => {
    const randomSource: RandomSource = {
      nextFloat: vi.fn(() => 0),
      nextInt: vi.fn(),
    };

    expect(() =>
      rollBigIntInclusive(
        BigInt(Number.MAX_SAFE_INTEGER) +
          1n,
        POSTGRES_BIGINT_MAX,
        randomSource
      )
    ).toThrow(
      "RandomSource without nextBigInt cannot roll this Gold range."
    );
  });

  it("rejects invalid bounds", () => {
    const randomSource: RandomSource = {
      nextFloat: vi.fn(() => 0),
      nextInt: vi.fn(),
    };

    expect(() =>
      rollBigIntInclusive(
        20n,
        10n,
        randomSource
      )
    ).toThrow(
      "Gold minimum cannot exceed maximum."
    );

    expect(() =>
      rollBigIntInclusive(
        -1n,
        10n,
        randomSource
      )
    ).toThrow();
  });

  it("rejects RNG output outside the range", () => {
    const randomSource: RandomSource = {
      nextFloat: vi.fn(() => 0),
      nextInt: vi.fn(() => 21),
    };

    expect(() =>
      rollBigIntInclusive(
        10n,
        20n,
        randomSource
      )
    ).toThrow(
      "Random integer result is outside the requested range."
    );
  });
});
