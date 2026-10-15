import type { RandomSource } from "../../combat/ports/random-source.js";
import { AFFIX_COUNT_BY_RARITY } from "./item-generation.constants.js";
import { ItemGenerationConfigurationError } from "./item-generation.errors.js";
import { rollInclusiveBigInt, selectWeighted } from "./item-random.js";
import { filterEligibleAffixes } from "./item-rarity-affix.js";
import { calculateItemScore } from "./item-score.js";
import type {
  AffixGenerationTemplate,
  FixedStatGenerationRange,
  GenerateRegularItemInput,
  GenerateSpecialItemInput,
  GeneratedAffix,
  GeneratedFixedStat,
  GeneratedRegularItem,
  GeneratedSpecialItem,
  ItemGenerationBase,
} from "./item-generation.types.js";

function validateBase(base: ItemGenerationBase): void {
  if (base.itemBaseId.length === 0) {
    throw new ItemGenerationConfigurationError(
      "Item Base ID cannot be empty."
    );
  }
  if (!Number.isSafeInteger(base.itemLevel) || base.itemLevel < 1) {
    throw new ItemGenerationConfigurationError(
      "Item Level must be a positive safe integer."
    );
  }
  if (base.baseItemScore < 0n) {
    throw new ItemGenerationConfigurationError(
      "Base Item Score cannot be negative."
    );
  }
}

function validateRange(
  minimumValue: bigint,
  maximumValue: bigint,
  fieldName: string
): void {
  if (minimumValue < 0n || maximumValue < minimumValue) {
    throw new ItemGenerationConfigurationError(
      `${fieldName} requires a non-negative inclusive range.`
    );
  }
}

function rollAffix(
  template: AffixGenerationTemplate,
  affixPosition: number,
  randomSource: RandomSource
): GeneratedAffix {
  if (template.affixTemplateId.length === 0) {
    throw new ItemGenerationConfigurationError(
      "Affix Template ID cannot be empty."
    );
  }
  validateRange(
    template.minimumValue,
    template.maximumValue,
    "Affix"
  );
  return {
    affixTemplateId: template.affixTemplateId,
    affixPosition,
    statType: template.statType,
    rollValue: rollInclusiveBigInt(
      template.minimumValue,
      template.maximumValue,
      randomSource
    ),
  };
}

function generateFixedStats(
  ranges: readonly FixedStatGenerationRange[],
  randomSource: RandomSource
): readonly GeneratedFixedStat[] {
  if (ranges.length === 0) {
    throw new ItemGenerationConfigurationError(
      "Unique and Set Items require at least one fixed stat range."
    );
  }
  const positions = new Set<number>();
  const statTypes = new Set<string>();
  return ranges.map((range) => {
    if (!Number.isSafeInteger(range.statPosition) || range.statPosition < 1) {
      throw new ItemGenerationConfigurationError(
        "Fixed stat position must be a positive safe integer."
      );
    }
    if (positions.has(range.statPosition)) {
      throw new ItemGenerationConfigurationError(
        "Fixed stat positions must be unique."
      );
    }
    if (statTypes.has(range.statType)) {
      throw new ItemGenerationConfigurationError(
        "Fixed stat types must be unique."
      );
    }
    validateRange(
      range.minimumValue,
      range.maximumValue,
      "Fixed stat"
    );
    positions.add(range.statPosition);
    statTypes.add(range.statType);
    return {
      statPosition: range.statPosition,
      statType: range.statType,
      rollValue: rollInclusiveBigInt(
        range.minimumValue,
        range.maximumValue,
        randomSource
      ),
    };
  });
}

export function generateRegularItem(
  input: GenerateRegularItemInput,
  randomSource: RandomSource
): GeneratedRegularItem {
  validateBase(input.base);
  const rarity = selectWeighted(
    input.rarityProfile,
    randomSource
  );
  const affixCount = AFFIX_COUNT_BY_RARITY[rarity];
  const affixes: GeneratedAffix[] = [];
  const eligibleAffixPool = filterEligibleAffixes(
    input.affixPool,
    input.base.itemLevel
  );
  if (affixCount > 0 && eligibleAffixPool.length === 0) {
    throw new ItemGenerationConfigurationError(
      "Regular Item rarity requires a non-empty eligible affix pool."
    );
  }
  for (let index = 0; index < affixCount; index += 1) {
    const template = selectWeighted(
      eligibleAffixPool,
      randomSource
    );
    affixes.push(
      rollAffix(template, index + 1, randomSource)
    );
  }
  return {
    kind: "Regular",
    itemBaseId: input.base.itemBaseId,
    itemLevel: input.base.itemLevel,
    requiredLevel: input.base.itemLevel,
    rarity,
    affixes,
    fixedStats: [],
    itemScore: calculateItemScore({
      baseItemScore: input.base.baseItemScore,
      itemLevel: input.base.itemLevel,
      baseStats: input.base.baseStats,
      affixes,
      fixedStats: [],
      coefficients: input.coefficients,
    }),
  };
}

export function generateSpecialItem(
  input: GenerateSpecialItemInput,
  randomSource: RandomSource
): GeneratedSpecialItem {
  validateBase(input.base);
  const fixedStats = generateFixedStats(
    input.fixedStatRanges,
    randomSource
  );
  return {
    kind: "Special",
    itemBaseId: input.base.itemBaseId,
    itemLevel: input.base.itemLevel,
    requiredLevel: input.base.itemLevel,
    rarity: null,
    affixes: [],
    fixedStats,
    itemScore: calculateItemScore({
      baseItemScore: input.base.baseItemScore,
      itemLevel: input.base.itemLevel,
      baseStats: input.base.baseStats,
      affixes: [],
      fixedStats,
      coefficients: input.coefficients,
    }),
  };
}