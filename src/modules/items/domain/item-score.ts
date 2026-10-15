import { POSTGRES_BIGINT_MAXIMUM } from "./item-generation.constants.js";
import {
  ItemGenerationConfigurationError,
  ItemScoreOverflowError,
} from "./item-generation.errors.js";
import type {
  CalculateItemScoreInput,
  ItemScoreComponent,
} from "./item-generation.types.js";

function addComponent(
  current: bigint,
  value: bigint,
  component: ItemScoreComponent,
  coefficients: CalculateItemScoreInput["coefficients"]
): bigint {
  const coefficient = coefficients[component];
  if (coefficient === undefined || coefficient < 0n || value < 0n) {
    throw new ItemGenerationConfigurationError(
      `Invalid Item Score input for component ${component}.`
    );
  }

  const result = current + value * coefficient;
  if (result > POSTGRES_BIGINT_MAXIMUM) {
    throw new ItemScoreOverflowError();
  }
  return result;
}

export function calculateItemScore(
  input: CalculateItemScoreInput
): bigint {
  if (input.baseItemScore < 0n || !Number.isSafeInteger(input.itemLevel) || input.itemLevel < 1) {
    throw new ItemGenerationConfigurationError(
      "Item Score requires a non-negative base score and a positive safe Item Level."
    );
  }

  let score = input.baseItemScore;
  if (score > POSTGRES_BIGINT_MAXIMUM) throw new ItemScoreOverflowError();

  score = addComponent(
    score,
    BigInt(input.itemLevel),
    "ItemLevel",
    input.coefficients
  );

  for (const [statType, value] of Object.entries(input.baseStats)) {
    score = addComponent(
      score,
      value,
      statType as ItemScoreComponent,
      input.coefficients
    );
  }

  for (const affix of input.affixes) {
    score = addComponent(
      score,
      affix.rollValue,
      affix.statType,
      input.coefficients
    );
  }

  for (const fixedStat of input.fixedStats) {
    score = addComponent(
      score,
      fixedStat.rollValue,
      fixedStat.statType,
      input.coefficients
    );
  }

  return score;
}
