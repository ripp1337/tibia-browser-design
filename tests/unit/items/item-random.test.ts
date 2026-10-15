import { describe, expect, it, vi } from "vitest";
import type { RandomSource } from "../../../src/modules/combat/ports/random-source.js";
import {
  ItemGenerationConfigurationError,
  ItemGenerationRandomSourceError,
} from "../../../src/modules/items/domain/item-generation.errors.js";
import {
  rollInclusiveBigInt,
  selectWeighted,
} from "../../../src/modules/items/domain/item-random.js";

function randomSource(value: bigint): RandomSource {
  return {
    nextFloat: vi.fn(() => 0),
    nextInt: vi.fn(() => Number(value)),
    nextBigInt: vi.fn(() => value),
  };
}

describe("item random helpers", () => {
  it("rolls inclusive bigint boundaries", () => {
    expect(rollInclusiveBigInt(10n, 20n, randomSource(10n))).toBe(10n);
    expect(rollInclusiveBigInt(10n, 20n, randomSource(20n))).toBe(20n);
  });

  it("returns a fixed range without consuming randomness", () => {
    const source = randomSource(999n);
    expect(rollInclusiveBigInt(5n, 5n, source)).toBe(5n);
    expect(source.nextBigInt).not.toHaveBeenCalled();
  });

  it("falls back to nextInt for safe ranges", () => {
    const source: RandomSource = {
      nextFloat: vi.fn(() => 0),
      nextInt: vi.fn(() => 7),
    };
    expect(rollInclusiveBigInt(5n, 9n, source)).toBe(7n);
  });

  it("rejects invalid ranges and random results", () => {
    expect(() => rollInclusiveBigInt(2n, 1n, randomSource(1n)))
      .toThrow(ItemGenerationConfigurationError);
    expect(() => rollInclusiveBigInt(1n, 2n, randomSource(3n)))
      .toThrow(ItemGenerationRandomSourceError);
  });

  it("selects entries by inclusive cumulative weights", () => {
    const entries = [
      { value: "first", selectionWeight: 2n },
      { value: "second", selectionWeight: 3n },
    ];
    expect(selectWeighted(entries, randomSource(1n))).toBe("first");
    expect(selectWeighted(entries, randomSource(2n))).toBe("first");
    expect(selectWeighted(entries, randomSource(3n))).toBe("second");
    expect(selectWeighted(entries, randomSource(5n))).toBe("second");
  });

  it("rejects empty pools and non-positive weights", () => {
    expect(() => selectWeighted([], randomSource(1n)))
      .toThrow(ItemGenerationConfigurationError);
    expect(() => selectWeighted(
      [{ value: "bad", selectionWeight: 0n }],
      randomSource(1n)
    )).toThrow(ItemGenerationConfigurationError);
  });
});
