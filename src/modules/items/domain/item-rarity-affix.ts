import type { RandomSource } from "../../combat/ports/random-source.js";
import { ItemGenerationConfigurationError } from "./item-generation.errors.js";
import { selectWeighted } from "./item-random.js";
import type {
  AffixGenerationTemplate,
  ItemRarity,
  WeightedEntry,
} from "./item-generation.types.js";

export const REGULAR_MONSTER_RARITY_PROFILE: readonly WeightedEntry<ItemRarity>[] = [
  { value: "Common", selectionWeight: 700n },
  { value: "Magic", selectionWeight: 200n },
  { value: "Rare", selectionWeight: 80n },
  { value: "Epic", selectionWeight: 18n },
  { value: "Legendary", selectionWeight: 2n },
];

export const BOSS_RARITY_PROFILE: readonly WeightedEntry<ItemRarity>[] = [
  { value: "Magic", selectionWeight: 700n },
  { value: "Rare", selectionWeight: 200n },
  { value: "Epic", selectionWeight: 90n },
  { value: "Legendary", selectionWeight: 10n },
];

export function rollCanonicalRarity(
  isBoss: boolean,
  randomSource: RandomSource
): ItemRarity {
  return selectWeighted(
    isBoss ? BOSS_RARITY_PROFILE : REGULAR_MONSTER_RARITY_PROFILE,
    randomSource
  );
}

export function filterEligibleAffixes(
  affixPool: readonly WeightedEntry<AffixGenerationTemplate>[],
  rolledItemLevel: number
): readonly WeightedEntry<AffixGenerationTemplate>[] {
  if (!Number.isSafeInteger(rolledItemLevel) || rolledItemLevel < 1) {
    throw new ItemGenerationConfigurationError(
      "Rolled Item Level must be a positive safe integer."
    );
  }

  return affixPool.filter((entry) => {
    const template = entry.value;
    const requiredItemLevel = template.requiredItemLevel ?? 1;
    const isEnabled = template.isEnabled ?? true;

    if (entry.selectionWeight <= 0n) {
      throw new ItemGenerationConfigurationError(
        "Affix selection weight must be positive."
      );
    }
    if (
      !Number.isSafeInteger(requiredItemLevel) ||
      requiredItemLevel < 1
    ) {
      throw new ItemGenerationConfigurationError(
        "Affix required Item Level must be a positive safe integer."
      );
    }

    return isEnabled && requiredItemLevel <= rolledItemLevel;
  });
}