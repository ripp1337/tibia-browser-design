import type { RandomSource } from "../../combat/ports/random-source.js";
import { CANONICAL_SLOT_WEIGHTS } from "./item-generation.constants.js";
import { ItemGenerationConfigurationError } from "./item-generation.errors.js";
import { selectWeighted } from "./item-random.js";
import type {
  EquipmentSlot,
  RegularItemBaseCandidate,
  SelectedRegularItemBase,
  WeightedEntry,
} from "./item-generation.types.js";

function canonicalSlotPool(): readonly WeightedEntry<EquipmentSlot>[] {
  return Object.entries(CANONICAL_SLOT_WEIGHTS).map(
    ([slot, selectionWeight]) => ({
      value: slot as EquipmentSlot,
      selectionWeight,
    })
  );
}

function eligibleRegularBases(
  candidates: readonly RegularItemBaseCandidate[],
  rolledItemLevel: number
): readonly RegularItemBaseCandidate[] {
  if (!Number.isSafeInteger(rolledItemLevel) || rolledItemLevel < 1) {
    throw new ItemGenerationConfigurationError(
      "Rolled Item Level must be a positive safe integer."
    );
  }
  return candidates.filter((candidate) => {
    if (candidate.itemBaseId.length === 0) {
      throw new ItemGenerationConfigurationError(
        "Item Base ID cannot be empty."
      );
    }
    if (!Number.isSafeInteger(candidate.itemLevel) || candidate.itemLevel < 1) {
      throw new ItemGenerationConfigurationError(
        "Item Base minimum Item Level must be a positive safe integer."
      );
    }
    if (candidate.selectionWeight <= 0n) {
      throw new ItemGenerationConfigurationError(
        "Item Base selection weight must be positive."
      );
    }
    return candidate.isEnabled &&
      !candidate.isUnique &&
      !candidate.isSet &&
      candidate.itemLevel <= rolledItemLevel;
  });
}

function fallbackSlotPool(
  eligible: readonly RegularItemBaseCandidate[]
): readonly WeightedEntry<EquipmentSlot>[] {
  const available = new Set(eligible.map((candidate) => candidate.slot));
  return canonicalSlotPool().filter((entry) => available.has(entry.value));
}

export function selectRegularItemBase(
  candidates: readonly RegularItemBaseCandidate[],
  rolledItemLevel: number,
  randomSource: RandomSource
): SelectedRegularItemBase {
  const eligible = eligibleRegularBases(candidates, rolledItemLevel);
  if (eligible.length === 0) {
    throw new ItemGenerationConfigurationError(
      "Regular Equipment roll succeeded but no eligible Item Base exists."
    );
  }

  let selectedSlot = selectWeighted(canonicalSlotPool(), randomSource);
  if (!eligible.some((candidate) => candidate.slot === selectedSlot)) {
    selectedSlot = selectWeighted(fallbackSlotPool(eligible), randomSource);
  }

  const slotCandidates = eligible
    .filter((candidate) => candidate.slot === selectedSlot)
    .map((candidate) => ({
      value: candidate,
      selectionWeight: candidate.selectionWeight,
    }));

  return {
    slot: selectedSlot,
    itemBase: selectWeighted(slotCandidates, randomSource),
    requiredLevel: rolledItemLevel,
  };
}