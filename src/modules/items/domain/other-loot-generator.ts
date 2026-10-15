import type { RandomSource } from "../../combat/ports/random-source.js";
import { PROBABILITY_SCALE } from "./item-generation.constants.js";
import {
  ItemGenerationConfigurationError,
  ItemGenerationRandomSourceError,
} from "./item-generation.errors.js";
import { rollInclusiveBigInt, selectWeighted } from "./item-random.js";
import type {
  GenerateOtherLootInput,
  GeneratedOtherLoot,
  OtherLootCandidate,
} from "./item-generation.types.js";

const REGULAR_MONSTER_OTHER_LOOT_THRESHOLD = 700;
const BOSS_OTHER_LOOT_THRESHOLD = 900;

function rollOtherLootSuccess(
  isBoss: boolean,
  randomSource: RandomSource
): boolean {
  const roll = randomSource.nextInt(1, PROBABILITY_SCALE);
  if (!Number.isSafeInteger(roll) || roll < 1 || roll > PROBABILITY_SCALE) {
    throw new ItemGenerationRandomSourceError(
      "Other Loot probability roll is outside the configured scale."
    );
  }
  return roll <= (isBoss
    ? BOSS_OTHER_LOOT_THRESHOLD
    : REGULAR_MONSTER_OTHER_LOOT_THRESHOLD);
}

function validateCandidate(candidate: OtherLootCandidate): void {
  if (candidate.otherLootTableId.length === 0) {
    throw new ItemGenerationConfigurationError(
      "Other Loot Table ID cannot be empty."
    );
  }
  const targetCount =
    Number(candidate.materialId !== null) +
    Number(candidate.consumableDefinitionId !== null);
  if (targetCount !== 1) {
    throw new ItemGenerationConfigurationError(
      "Other Loot candidate must target exactly one Material or Consumable."
    );
  }
  if (candidate.selectionWeight <= 0n) {
    throw new ItemGenerationConfigurationError(
      "Other Loot selection weight must be positive."
    );
  }
  if (
    candidate.minimumQuantity < 1n ||
    candidate.maximumQuantity < candidate.minimumQuantity
  ) {
    throw new ItemGenerationConfigurationError(
      "Other Loot requires a positive inclusive quantity range."
    );
  }
}

export function generateOtherLoot(
  input: GenerateOtherLootInput,
  randomSource: RandomSource
): GeneratedOtherLoot | null {
  if (!rollOtherLootSuccess(input.isBoss, randomSource)) {
    return null;
  }

  const eligible = input.candidates.filter((candidate) => candidate.isEnabled);
  if (eligible.length === 0) {
    throw new ItemGenerationConfigurationError(
      "Other Loot roll succeeded but no eligible entry exists."
    );
  }
  eligible.forEach(validateCandidate);

  const selected = selectWeighted(
    eligible.map((candidate) => ({
      value: candidate,
      selectionWeight: candidate.selectionWeight,
    })),
    randomSource
  );
  const quantity = rollInclusiveBigInt(
    selected.minimumQuantity,
    selected.maximumQuantity,
    randomSource
  );

  if (selected.materialId !== null) {
    return {
      kind: "Material",
      otherLootTableId: selected.otherLootTableId,
      materialId: selected.materialId,
      quantity,
    };
  }
  if (selected.consumableDefinitionId === null) {
    throw new ItemGenerationConfigurationError(
      "Other Loot candidate has no valid target."
    );
  }
  return {
    kind: "Consumable",
    otherLootTableId: selected.otherLootTableId,
    consumableDefinitionId: selected.consumableDefinitionId,
    quantity,
  };
}