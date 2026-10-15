import type { RandomSource } from "../../combat/ports/random-source.js";
import {
  ItemGenerationConfigurationError,
  ItemGenerationRandomSourceError,
} from "./item-generation.errors.js";
import type { WeightedEntry } from "./item-generation.types.js";

function validateRange(minimum: bigint, maximum: bigint): void {
  if (minimum < 0n || maximum < minimum) {
    throw new ItemGenerationConfigurationError(
      "Random bigint range must be non-negative and minimum cannot exceed maximum."
    );
  }
}

export function rollInclusiveBigInt(
  minimum: bigint,
  maximum: bigint,
  randomSource: RandomSource
): bigint {
  validateRange(minimum, maximum);

  if (minimum === maximum) return minimum;

  if (randomSource.nextBigInt) {
    const value = randomSource.nextBigInt(minimum, maximum);
    if (value < minimum || value > maximum) {
      throw new ItemGenerationRandomSourceError(
        `Random bigint must be between ${minimum} and ${maximum}, inclusive.`
      );
    }
    return value;
  }

  const minimumNumber = Number(minimum);
  const maximumNumber = Number(maximum);
  if (
    !Number.isSafeInteger(minimumNumber) ||
    !Number.isSafeInteger(maximumNumber)
  ) {
    throw new ItemGenerationRandomSourceError(
      "RandomSource without nextBigInt cannot roll this bigint range."
    );
  }

  const value = randomSource.nextInt(minimumNumber, maximumNumber);
  if (!Number.isSafeInteger(value) || value < minimumNumber || value > maximumNumber) {
    throw new ItemGenerationRandomSourceError(
      `Random integer must be between ${minimum} and ${maximum}, inclusive.`
    );
  }
  return BigInt(value);
}

export function selectWeighted<T>(
  entries: readonly WeightedEntry<T>[],
  randomSource: RandomSource
): T {
  if (entries.length === 0) {
    throw new ItemGenerationConfigurationError(
      "Weighted selection pool cannot be empty."
    );
  }

  let totalWeight = 0n;
  for (const entry of entries) {
    if (entry.selectionWeight <= 0n) {
      throw new ItemGenerationConfigurationError(
        "Weighted selection entries must have positive weights."
      );
    }
    totalWeight += entry.selectionWeight;
  }

  const roll = rollInclusiveBigInt(1n, totalWeight, randomSource);
  let cumulativeWeight = 0n;
  for (const entry of entries) {
    cumulativeWeight += entry.selectionWeight;
    if (roll <= cumulativeWeight) return entry.value;
  }

  throw new ItemGenerationRandomSourceError(
    "Weighted selection roll did not match an entry."
  );
}
