import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  CryptoRandomSource,
} from "../../../src/modules/combat/infrastructure/crypto-random-source.js";

describe("CryptoRandomSource", () => {
  it("returns zero for the lowest random float bytes", () => {
    const randomSource =
      new CryptoRandomSource(
        () => Buffer.alloc(8),
        vi.fn()
      );

    expect(
      randomSource.nextFloat()
    ).toBe(0);
  });

  it("returns a float lower than one for the highest bytes", () => {
    const randomSource =
      new CryptoRandomSource(
        () => Buffer.alloc(8, 255),
        vi.fn()
      );

    const value =
      randomSource.nextFloat();

    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThan(1);
  });

  it("uses inclusive integer bounds", () => {
    const provider = vi.fn(
      (
        minimum: number,
        maximumExclusive: number
      ) => {
        expect(minimum).toBe(10);
        expect(maximumExclusive).toBe(21);

        return 20;
      }
    );

    const randomSource =
      new CryptoRandomSource(
        () => Buffer.alloc(8),
        provider
      );

    expect(
      randomSource.nextInt(10, 20)
    ).toBe(20);
  });

  it("returns equal integer bounds without using crypto", () => {
    const provider = vi.fn();

    const randomSource =
      new CryptoRandomSource(
        () => Buffer.alloc(8),
        provider
      );

    expect(
      randomSource.nextInt(5, 5)
    ).toBe(5);
    expect(provider).not.toHaveBeenCalled();
  });

  it("rejects unsafe and reversed integer bounds", () => {
    const randomSource =
      new CryptoRandomSource();

    expect(() =>
      randomSource.nextInt(
        Number.MAX_SAFE_INTEGER + 1,
        Number.MAX_SAFE_INTEGER + 2
      )
    ).toThrow(RangeError);

    expect(() =>
      randomSource.nextInt(20, 10)
    ).toThrow(RangeError);
  });

  it("rejects unsupported integer ranges", () => {
    const randomSource =
      new CryptoRandomSource();

    expect(() =>
      randomSource.nextInt(
        0,
        Number.MAX_SAFE_INTEGER
      )
    ).toThrow(RangeError);
  });

  it("rejects an invalid random byte provider", () => {
    const randomSource =
      new CryptoRandomSource(
        () => Buffer.alloc(6),
        vi.fn()
      );

    expect(() =>
      randomSource.nextFloat()
    ).toThrow(
      "Crypto random byte provider must return exactly eight bytes."
    );
  });

  it("generates an inclusive bigint", () => {
    const randomBytesProvider =
      vi.fn((size: number) =>
        Buffer.alloc(size, 0)
      );

    const randomSource =
      new CryptoRandomSource(
        randomBytesProvider
      );

    expect(
      randomSource.nextBigInt(
        10n,
        20n
      )
    ).toBe(10n);

    expect(
      randomBytesProvider
    ).toHaveBeenCalledOnce();
  });

  it("returns an equal bigint bound without randomness", () => {
    const randomBytesProvider =
      vi.fn((size: number) =>
        Buffer.alloc(size, 0)
      );

    const randomSource =
      new CryptoRandomSource(
        randomBytesProvider
      );

    expect(
      randomSource.nextBigInt(
        25n,
        25n
      )
    ).toBe(25n);

    expect(
      randomBytesProvider
    ).not.toHaveBeenCalled();
  });

  it("rejects reversed bigint bounds", () => {
    const randomSource =
      new CryptoRandomSource();

    expect(() =>
      randomSource.nextBigInt(
        20n,
        10n
      )
    ).toThrow(
      "Random bigint minimum cannot exceed maximum."
    );
  });

});

