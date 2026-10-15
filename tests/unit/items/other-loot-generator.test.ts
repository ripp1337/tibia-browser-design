import { describe, expect, it } from "vitest";
import type { RandomSource } from "../../../src/modules/combat/ports/random-source.js";
import { ItemGenerationConfigurationError } from "../../../src/modules/items/domain/item-generation.errors.js";
import type { OtherLootCandidate } from "../../../src/modules/items/domain/item-generation.types.js";
import { generateOtherLoot } from "../../../src/modules/items/domain/other-loot-generator.js";

class SequenceRandomSource implements RandomSource {
  public readonly calls: string[] = [];
  public constructor(
    private readonly integers: number[],
    private readonly bigints: bigint[]
  ) {}
  public nextFloat(): number { return 0; }
  public nextInt(minimum: number, maximum: number): number {
    this.calls.push(`nextInt:${minimum}-${maximum}`);
    const value = this.integers.shift();
    if (value === undefined) throw new Error("No integer random value available.");
    return value;
  }
  public nextBigInt(minimum: bigint, maximum: bigint): bigint {
    this.calls.push(`nextBigInt:${minimum}-${maximum}`);
    const value = this.bigints.shift();
    if (value === undefined) throw new Error("No bigint random value available.");
    return value;
  }
}

function material(overrides: Partial<OtherLootCandidate> = {}): OtherLootCandidate {
  return {
    otherLootTableId: "material-entry",
    materialId: "material-1",
    consumableDefinitionId: null,
    minimumQuantity: 2n,
    maximumQuantity: 5n,
    selectionWeight: 1n,
    isEnabled: true,
    ...overrides,
  };
}

function consumable(overrides: Partial<OtherLootCandidate> = {}): OtherLootCandidate {
  return {
    otherLootTableId: "consumable-entry",
    materialId: null,
    consumableDefinitionId: "consumable-1",
    minimumQuantity: 1n,
    maximumQuantity: 3n,
    selectionWeight: 1n,
    isEnabled: true,
    ...overrides,
  };
}

describe("Other Loot generator", () => {
  it("uses the exact regular Monster 70 percent boundary", () => {
    expect(generateOtherLoot(
      { isBoss: false, candidates: [material()] },
      new SequenceRandomSource([701], [])
    )).toBeNull();
    expect(generateOtherLoot(
      { isBoss: false, candidates: [material({ minimumQuantity: 2n, maximumQuantity: 2n })] },
      new SequenceRandomSource([700], [])
    )).toEqual({
      kind: "Material",
      otherLootTableId: "material-entry",
      materialId: "material-1",
      quantity: 2n,
    });
  });

  it("uses the exact Boss 90 percent boundary", () => {
    expect(generateOtherLoot(
      { isBoss: true, candidates: [material()] },
      new SequenceRandomSource([901], [])
    )).toBeNull();
    expect(generateOtherLoot(
      { isBoss: true, candidates: [material({ minimumQuantity: 1n, maximumQuantity: 1n })] },
      new SequenceRandomSource([900], [])
    )?.kind).toBe("Material");
  });

  it("selects weighted first and last candidates", () => {
    const candidates = [material({ selectionWeight: 2n }), consumable({ selectionWeight: 3n })];
    expect(generateOtherLoot(
      { isBoss: false, candidates },
      new SequenceRandomSource([1], [1n, 2n])
    )?.kind).toBe("Material");
    expect(generateOtherLoot(
      { isBoss: false, candidates },
      new SequenceRandomSource([1], [5n, 3n])
    )?.kind).toBe("Consumable");
  });

  it("returns typed Material and Consumable results", () => {
    expect(generateOtherLoot(
      { isBoss: false, candidates: [material()] },
      new SequenceRandomSource([1], [5n])
    )).toEqual({
      kind: "Material",
      otherLootTableId: "material-entry",
      materialId: "material-1",
      quantity: 5n,
    });
    expect(generateOtherLoot(
      { isBoss: false, candidates: [consumable()] },
      new SequenceRandomSource([1], [3n])
    )).toEqual({
      kind: "Consumable",
      otherLootTableId: "consumable-entry",
      consumableDefinitionId: "consumable-1",
      quantity: 3n,
    });
  });

  it("rolls inclusive quantity endpoints", () => {
    expect(generateOtherLoot(
      { isBoss: false, candidates: [material()] },
      new SequenceRandomSource([1], [2n])
    )?.quantity).toBe(2n);
    expect(generateOtherLoot(
      { isBoss: false, candidates: [material()] },
      new SequenceRandomSource([1], [5n])
    )?.quantity).toBe(5n);
  });

  it("does not consume quantity randomness for an equal range", () => {
    const random = new SequenceRandomSource([1], []);
    expect(generateOtherLoot(
      { isBoss: false, candidates: [material({ minimumQuantity: 4n, maximumQuantity: 4n })] },
      random
    )?.quantity).toBe(4n);
    expect(random.calls).toEqual(["nextInt:1-1000"]);
  });

  it("stops after a failed success roll", () => {
    const random = new SequenceRandomSource([701], [999n]);
    expect(generateOtherLoot(
      { isBoss: false, candidates: [] },
      random
    )).toBeNull();
    expect(random.calls).toEqual(["nextInt:1-1000"]);
  });

  it("raises a configuration error after success with no eligible pool", () => {
    expect(() => generateOtherLoot(
      { isBoss: false, candidates: [material({ isEnabled: false })] },
      new SequenceRandomSource([1], [])
    )).toThrow("Other Loot roll succeeded but no eligible entry exists.");
  });

  it("rejects invalid target combinations, weights and ranges", () => {
    expect(() => generateOtherLoot(
      { isBoss: false, candidates: [material({ consumableDefinitionId: "also-consumable" })] },
      new SequenceRandomSource([1], [])
    )).toThrow(ItemGenerationConfigurationError);
    expect(() => generateOtherLoot(
      { isBoss: false, candidates: [material({ selectionWeight: 0n })] },
      new SequenceRandomSource([1], [])
    )).toThrow(ItemGenerationConfigurationError);
    expect(() => generateOtherLoot(
      { isBoss: false, candidates: [material({ minimumQuantity: 0n })] },
      new SequenceRandomSource([1], [])
    )).toThrow(ItemGenerationConfigurationError);
  });

  it("is deterministic for identical inputs and sequences", () => {
    const input = { isBoss: false, candidates: [material(), consumable()] } as const;
    const first = generateOtherLoot(input, new SequenceRandomSource([1], [2n, 3n]));
    const second = generateOtherLoot(input, new SequenceRandomSource([1], [2n, 3n]));
    expect(first).toEqual(second);
  });
});