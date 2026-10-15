import type {
  ITEM_RARITY,
  ITEM_SCORE_COMPONENT,
  ITEM_STAT_TYPE,
} from "./item-generation.constants.js";

export type ItemRarity =
  (typeof ITEM_RARITY)[keyof typeof ITEM_RARITY];

export type ItemStatType =
  (typeof ITEM_STAT_TYPE)[keyof typeof ITEM_STAT_TYPE];

export type ItemScoreComponent =
  (typeof ITEM_SCORE_COMPONENT)[keyof typeof ITEM_SCORE_COMPONENT];

export type ItemStatValues = Record<ItemStatType, bigint>;

export type WeightedEntry<T> = {
  value: T;
  selectionWeight: bigint;
};

export type GeneratedAffix = {
  affixTemplateId: string;
  affixPosition: number;
  statType: ItemStatType;
  rollValue: bigint;
};

export type GeneratedFixedStat = {
  statPosition: number;
  statType: ItemStatType;
  rollValue: bigint;
};

export type ItemScoreCoefficients =
  Record<ItemScoreComponent, bigint>;

export type CalculateItemScoreInput = {
  baseItemScore: bigint;
  itemLevel: number;
  baseStats: ItemStatValues;
  affixes: readonly Pick<GeneratedAffix, "statType" | "rollValue">[];
  fixedStats: readonly Pick<GeneratedFixedStat, "statType" | "rollValue">[];
  coefficients: ItemScoreCoefficients;
};

export type AffixGenerationTemplate = {
  affixTemplateId: string;
  statType: ItemStatType;
  minimumValue: bigint;
  maximumValue: bigint;
};

export type FixedStatGenerationRange = {
  statPosition: number;
  statType: ItemStatType;
  minimumValue: bigint;
  maximumValue: bigint;
};

export type ItemGenerationBase = {
  itemBaseId: string;
  itemLevel: number;
  baseItemScore: bigint;
  baseStats: ItemStatValues;
};

export type GenerateRegularItemInput = {
  base: ItemGenerationBase;
  rarityProfile: readonly WeightedEntry<ItemRarity>[];
  affixPool: readonly WeightedEntry<AffixGenerationTemplate>[];
  coefficients: ItemScoreCoefficients;
};

export type GenerateSpecialItemInput = {
  base: ItemGenerationBase;
  fixedStatRanges: readonly FixedStatGenerationRange[];
  coefficients: ItemScoreCoefficients;
};

export type GeneratedRegularItem = {
  kind: "Regular";
  itemBaseId: string;
  itemLevel: number;
  requiredLevel: number;
  rarity: ItemRarity;
  affixes: readonly GeneratedAffix[];
  fixedStats: readonly [];
  itemScore: bigint;
};

export type GeneratedSpecialItem = {
  kind: "Special";
  itemBaseId: string;
  itemLevel: number;
  requiredLevel: number;
  rarity: null;
  affixes: readonly [];
  fixedStats: readonly GeneratedFixedStat[];
  itemScore: bigint;
};