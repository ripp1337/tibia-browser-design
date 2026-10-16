import type {
  EQUIPMENT_SLOT,
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

export type EquipmentSlot =
  (typeof EQUIPMENT_SLOT)[keyof typeof EQUIPMENT_SLOT];

export type ItemStatValues = Record<ItemStatType, bigint>;

export type WeightedEntry<T> = {
  value: T;
  selectionWeight: bigint;
};

export type ItemLootContext = {
  monsterLevel: number;
  bossBonusLootLevel: number;
  isBoss: boolean;
};

export type ItemLevelRange = {
  effectiveLootLevel: number;
  minimumItemLevel: number;
  maximumItemLevel: number;
};

export type RegularItemBaseCandidate = {
  itemBaseId: string;
  itemLevel: number;
  slot: EquipmentSlot;
  selectionWeight: bigint;
  isEnabled: boolean;
  isUnique: boolean;
  isSet: boolean;
};

export type SelectedRegularItemBase = {
  slot: EquipmentSlot;
  itemBase: RegularItemBaseCandidate;
  requiredLevel: number;
};

export type CompleteRegularItemBaseCandidate =
  RegularItemBaseCandidate & {
    baseItemScore: bigint;
    baseStats: ItemStatValues;
    affixPool: readonly WeightedEntry<AffixGenerationTemplate>[];
  };

export type GenerateCompleteRegularItemInput = {
  context: ItemLootContext;
  itemBaseCandidates: readonly CompleteRegularItemBaseCandidate[];
  coefficients: ItemScoreCoefficients;
};

export type OtherLootCandidate = {
  otherLootTableId: string;
  materialId: string | null;
  consumableDefinitionId: string | null;
  minimumQuantity: bigint;
  maximumQuantity: bigint;
  selectionWeight: bigint;
  isEnabled: boolean;
};

export type GeneratedOtherLoot =
  | {
      kind: "Material";
      otherLootTableId: string;
      materialId: string;
      quantity: bigint;
    }
  | {
      kind: "Consumable";
      otherLootTableId: string;
      consumableDefinitionId: string;
      quantity: bigint;
    };

export type GenerateOtherLootInput = {
  isBoss: boolean;
  candidates: readonly OtherLootCandidate[];
};

export type SpecialItemCategory = "Unique" | "Set";

export type SpecialItemCandidate = {
  specialItemSourceId: string;
  monsterId: string | null;
  monsterFamilyId: string | null;
  selectionWeight: bigint;
  isEnabled: boolean;
  category: SpecialItemCategory;
  isBossExclusive: boolean;
  progressionEligible: boolean;
  base: ItemGenerationBase;
  fixedStatRanges: readonly FixedStatGenerationRange[];
};

export type UniquePityState = {
  eligibleKillCount: number;
  chancePerMille: number;
};

export type GenerateSpecialItemRewardInput = {
  defeatedMonsterId: string;
  defeatedMonsterFamilyId: string | null;
  defeatedSourceIsBoss: boolean;
  rolledItemLevel: number;
  pity: UniquePityState;
  candidates: readonly SpecialItemCandidate[];
  coefficients: ItemScoreCoefficients;
};

export type SpecialItemRewardResult =
  | {
      outcome: "Ineligible";
      item: null;
      selectedCategory: null;
      nextPity: UniquePityState;
    }
  | {
      outcome: "Failed";
      item: null;
      selectedCategory: null;
      nextPity: UniquePityState;
    }
  | {
      outcome: "Generated";
      item: GeneratedSpecialItem;
      selectedCategory: SpecialItemCategory;
      nextPity: UniquePityState;
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
  requiredItemLevel?: number;
  isEnabled?: boolean;
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