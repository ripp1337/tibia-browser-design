import type { RandomSource } from "../../combat/ports/random-source.js";
import { selectRegularItemBase } from "./item-base-selection.js";
import { generateRegularItem } from "./item-generator.js";
import {
  rollItemLevel,
  rollRegularEquipmentSuccess,
} from "./item-loot-level.js";
import {
  BOSS_RARITY_PROFILE,
  REGULAR_MONSTER_RARITY_PROFILE,
} from "./item-rarity-affix.js";
import type {
  GenerateCompleteRegularItemInput,
  GeneratedRegularItem,
} from "./item-generation.types.js";

export function generateCompleteRegularItem(
  input: GenerateCompleteRegularItemInput,
  randomSource: RandomSource
): GeneratedRegularItem | null {
  if (!rollRegularEquipmentSuccess(input.context.isBoss, randomSource)) {
    return null;
  }

  const rolledItemLevel = rollItemLevel(input.context, randomSource);
  const selected = selectRegularItemBase(
    input.itemBaseCandidates,
    rolledItemLevel,
    randomSource
  );
  const selectedBase = input.itemBaseCandidates.find(
    (candidate) => candidate.itemBaseId === selected.itemBase.itemBaseId
  );

  if (selectedBase === undefined) {
    throw new Error("Selected Item Base is missing from the generation input.");
  }

  return generateRegularItem(
    {
      base: {
        itemBaseId: selectedBase.itemBaseId,
        itemLevel: rolledItemLevel,
        baseItemScore: selectedBase.baseItemScore,
        baseStats: selectedBase.baseStats,
      },
      rarityProfile: input.context.isBoss
        ? BOSS_RARITY_PROFILE
        : REGULAR_MONSTER_RARITY_PROFILE,
      affixPool: selectedBase.affixPool,
      coefficients: input.coefficients,
    },
    randomSource
  );
}