import type { RandomSource } from "../../combat/ports/random-source.js";
import {
  BOSS_EQUIPMENT_THRESHOLD,
  PROBABILITY_SCALE,
  REGULAR_MONSTER_EQUIPMENT_THRESHOLD,
} from "./item-generation.constants.js";
import {
  ItemGenerationConfigurationError,
  ItemGenerationRandomSourceError,
} from "./item-generation.errors.js";
import type {
  ItemLevelRange,
  ItemLootContext,
} from "./item-generation.types.js";

function requirePositiveSafeInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new ItemGenerationConfigurationError(
      `${name} must be a positive safe integer.`
    );
  }
}

export function calculateItemLevelRange(
  context: ItemLootContext
): ItemLevelRange {
  requirePositiveSafeInteger(context.monsterLevel, "Monster Level");
  if (
    !Number.isSafeInteger(context.bossBonusLootLevel) ||
    context.bossBonusLootLevel < 0
  ) {
    throw new ItemGenerationConfigurationError(
      "Boss bonus loot level must be a non-negative safe integer."
    );
  }
  if (!context.isBoss && context.bossBonusLootLevel !== 0) {
    throw new ItemGenerationConfigurationError(
      "Regular Monsters must use boss bonus loot level 0."
    );
  }
  const effectiveLootLevel =
    context.monsterLevel + context.bossBonusLootLevel;
  requirePositiveSafeInteger(effectiveLootLevel, "Effective Loot Level");
  const maximumItemLevel = effectiveLootLevel + 5;
  if (!Number.isSafeInteger(maximumItemLevel)) {
    throw new ItemGenerationConfigurationError(
      "Maximum Item Level exceeds the safe integer range."
    );
  }
  return {
    effectiveLootLevel,
    minimumItemLevel: Math.max(1, effectiveLootLevel - 10),
    maximumItemLevel,
  };
}

export function rollItemLevel(
  context: ItemLootContext,
  randomSource: RandomSource
): number {
  const range = calculateItemLevelRange(context);
  const result = randomSource.nextInt(
    range.minimumItemLevel,
    range.maximumItemLevel
  );
  if (
    !Number.isSafeInteger(result) ||
    result < range.minimumItemLevel ||
    result > range.maximumItemLevel
  ) {
    throw new ItemGenerationRandomSourceError(
      "Random Item Level is outside the canonical inclusive range."
    );
  }
  return result;
}

export function rollRegularEquipmentSuccess(
  isBoss: boolean,
  randomSource: RandomSource
): boolean {
  const roll = randomSource.nextInt(1, PROBABILITY_SCALE);
  if (!Number.isSafeInteger(roll) || roll < 1 || roll > PROBABILITY_SCALE) {
    throw new ItemGenerationRandomSourceError(
      "Equipment probability roll is outside the configured scale."
    );
  }
  const threshold = isBoss
    ? BOSS_EQUIPMENT_THRESHOLD
    : REGULAR_MONSTER_EQUIPMENT_THRESHOLD;
  return roll <= threshold;
}