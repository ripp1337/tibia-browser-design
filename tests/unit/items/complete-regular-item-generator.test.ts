import { describe, expect, it } from "vitest";
import type { RandomSource } from "../../../src/modules/combat/ports/random-source.js";
import { generateCompleteRegularItem } from "../../../src/modules/items/domain/complete-regular-item-generator.js";
import { ItemGenerationConfigurationError } from "../../../src/modules/items/domain/item-generation.errors.js";
import type {
  CompleteRegularItemBaseCandidate,
  ItemScoreCoefficients,
  ItemStatValues,
} from "../../../src/modules/items/domain/item-generation.types.js";

class TrackingRandomSource implements RandomSource {
  public readonly calls: string[] = [];

  public constructor(
    private readonly integers: number[],
    private readonly bigints: bigint[]
  ) {}

  public nextFloat(): number {
    this.calls.push("nextFloat");
    return 0;
  }

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

const baseStats: ItemStatValues = {
  Attack: 3n,
  Defense: 2n,
  SpellPower: 0n,
  Health: 0n,
  Mana: 0n,
  Energy: 0n,
  GoldPercent: 0n,
  ExperiencePercent: 0n,
};

const coefficients: ItemScoreCoefficients = {
  ItemLevel: 10n,
  Attack: 2n,
  Defense: 3n,
  SpellPower: 4n,
  Health: 1n,
  Mana: 1n,
  Energy: 5n,
  GoldPercent: 6n,
  ExperiencePercent: 7n,
};

const weaponCandidate: CompleteRegularItemBaseCandidate = {
  itemBaseId: "weapon-base",
  itemLevel: 5,
  slot: "Weapon",
  selectionWeight: 1n,
  isEnabled: true,
  isUnique: false,
  isSet: false,
  baseItemScore: 100n,
  baseStats,
  affixPool: [{
    value: {
      affixTemplateId: "attack-affix",
      statType: "Attack",
      minimumValue: 10n,
      maximumValue: 20n,
      requiredItemLevel: 5,
      isEnabled: true,
    },
    selectionWeight: 1n,
  }],
};

describe("complete regular Item generator", () => {
  it("stops after a failed Equipment roll and consumes no later draws", () => {
    const random = new TrackingRandomSource([301], []);
    const result = generateCompleteRegularItem({
      context: { monsterLevel: 20, bossBonusLootLevel: 0, isBoss: false },
      itemBaseCandidates: [weaponCandidate],
      coefficients,
    }, random);

    expect(result).toBeNull();
    expect(random.calls).toEqual(["nextInt:1-1000"]);
  });

  it("composes the canonical regular Monster flow into a Common Item", () => {
    const random = new TrackingRandomSource(
      [300, 10],
      [1n, 1n]
    );
    const result = generateCompleteRegularItem({
      context: { monsterLevel: 20, bossBonusLootLevel: 0, isBoss: false },
      itemBaseCandidates: [weaponCandidate],
      coefficients,
    }, random);

    expect(result).toEqual({
      kind: "Regular",
      itemBaseId: "weapon-base",
      itemLevel: 10,
      requiredLevel: 10,
      rarity: "Common",
      affixes: [],
      fixedStats: [],
      itemScore: 212n,
    });
    expect(random.calls).toEqual([
      "nextInt:1-1000",
      "nextInt:10-25",
      "nextBigInt:1-8",
      "nextBigInt:1-1000",
    ]);
  });

  it("composes the canonical Boss flow through Affix generation and Item Score", () => {
    const random = new TrackingRandomSource(
      [800, 30],
      [1n, 1n, 10n]
    );
    const result = generateCompleteRegularItem({
      context: { monsterLevel: 20, bossBonusLootLevel: 5, isBoss: true },
      itemBaseCandidates: [weaponCandidate],
      coefficients,
    }, random);

    expect(result).toEqual({
      kind: "Regular",
      itemBaseId: "weapon-base",
      itemLevel: 30,
      requiredLevel: 30,
      rarity: "Magic",
      affixes: [{
        affixTemplateId: "attack-affix",
        affixPosition: 1,
        statType: "Attack",
        rollValue: 10n,
      }],
      fixedStats: [],
      itemScore: 432n,
    });
  });

  it("raises an explicit configuration error for an empty eligible Item Base pool", () => {
    const random = new TrackingRandomSource([1, 10], []);
    expect(() => generateCompleteRegularItem({
      context: { monsterLevel: 20, bossBonusLootLevel: 0, isBoss: false },
      itemBaseCandidates: [],
      coefficients,
    }, random)).toThrow(ItemGenerationConfigurationError);
  });

  it("is deterministic for identical inputs and random sequences", () => {
    const input = {
      context: { monsterLevel: 20, bossBonusLootLevel: 0, isBoss: false },
      itemBaseCandidates: [weaponCandidate],
      coefficients,
    } as const;
    const first = generateCompleteRegularItem(
      input,
      new TrackingRandomSource([300, 10], [1n, 1n, 701n, 1n, 15n])
    );
    const second = generateCompleteRegularItem(
      input,
      new TrackingRandomSource([300, 10], [1n, 1n, 701n, 1n, 15n])
    );
    expect(first).toEqual(second);
  });
});