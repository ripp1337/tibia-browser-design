import type { RandomSource } from "../../combat/ports/random-source.js";
import { generateSpecialItem } from "./item-generator.js";
import {
  ItemGenerationConfigurationError,
  ItemGenerationRandomSourceError,
} from "./item-generation.errors.js";
import { selectWeighted } from "./item-random.js";
import type {
  GenerateSpecialItemRewardInput,
  SpecialItemCandidate,
  SpecialItemRewardResult,
  UniquePityState,
} from "./item-generation.types.js";

const PITY_START_PER_MILLE = 1;
const PITY_MAX_PER_MILLE = 100;
const PITY_SCALE = 1000;

function canonicalPity(eligibleKillCount: number): UniquePityState {
  if (!Number.isSafeInteger(eligibleKillCount) || eligibleKillCount < 0 || eligibleKillCount > 99) {
    throw new ItemGenerationConfigurationError(
      "Unique/Set pity eligible kill count must be between 0 and 99."
    );
  }
  return {
    eligibleKillCount,
    chancePerMille: Math.min(
      PITY_MAX_PER_MILLE,
      PITY_START_PER_MILLE + eligibleKillCount
    ),
  };
}

function validatePity(pity: UniquePityState): UniquePityState {
  const expected = canonicalPity(pity.eligibleKillCount);
  if (pity.chancePerMille !== expected.chancePerMille) {
    throw new ItemGenerationConfigurationError(
      "Unique/Set pity chance does not match eligible kill count."
    );
  }
  return expected;
}

function sourceMatches(
  candidate: SpecialItemCandidate,
  input: GenerateSpecialItemRewardInput
): boolean {
  const ownerCount =
    Number(candidate.monsterId !== null) +
    Number(candidate.monsterFamilyId !== null);
  if (ownerCount !== 1) {
    throw new ItemGenerationConfigurationError(
      "Special Item source must target exactly one Monster or Monster Family."
    );
  }
  return candidate.monsterId === input.defeatedMonsterId ||
    (candidate.monsterFamilyId !== null &&
      candidate.monsterFamilyId === input.defeatedMonsterFamilyId);
}

function filterEligibleCandidates(
  input: GenerateSpecialItemRewardInput
): readonly SpecialItemCandidate[] {
  if (input.defeatedMonsterId.length === 0) {
    throw new ItemGenerationConfigurationError(
      "Defeated Monster ID cannot be empty."
    );
  }
  if (!Number.isSafeInteger(input.rolledItemLevel) || input.rolledItemLevel < 1) {
    throw new ItemGenerationConfigurationError(
      "Special Item rolled Item Level must be a positive safe integer."
    );
  }

  return input.candidates.filter((candidate) => {
    if (candidate.specialItemSourceId.length === 0) {
      throw new ItemGenerationConfigurationError(
        "Special Item Source ID cannot be empty."
      );
    }
    if (candidate.selectionWeight <= 0n) {
      throw new ItemGenerationConfigurationError(
        "Special Item selection weight must be positive."
      );
    }
    if (candidate.category !== "Unique" && candidate.category !== "Set") {
      throw new ItemGenerationConfigurationError(
        "Special Item category must be Unique or Set."
      );
    }
    const matchesSource = sourceMatches(candidate, input);
    return candidate.isEnabled &&
      matchesSource &&
      candidate.progressionEligible &&
      candidate.base.itemLevel <= input.rolledItemLevel &&
      (!candidate.isBossExclusive || input.defeatedSourceIsBoss);
  });
}

function rollSuccess(chancePerMille: number, randomSource: RandomSource): boolean {
  const roll = randomSource.nextInt(1, PITY_SCALE);
  if (!Number.isSafeInteger(roll) || roll < 1 || roll > PITY_SCALE) {
    throw new ItemGenerationRandomSourceError(
      "Unique/Set probability roll is outside the configured scale."
    );
  }
  return roll <= chancePerMille;
}

export function generateSpecialItemReward(
  input: GenerateSpecialItemRewardInput,
  randomSource: RandomSource
): SpecialItemRewardResult {
  const currentPity = validatePity(input.pity);
  const eligible = filterEligibleCandidates(input);

  if (eligible.length === 0) {
    return {
      outcome: "Ineligible",
      item: null,
      selectedCategory: null,
      nextPity: currentPity,
    };
  }

  if (!rollSuccess(currentPity.chancePerMille, randomSource)) {
    return {
      outcome: "Failed",
      item: null,
      selectedCategory: null,
      nextPity: canonicalPity(Math.min(99, currentPity.eligibleKillCount + 1)),
    };
  }

  const selected = selectWeighted(
    eligible.map((candidate) => ({
      value: candidate,
      selectionWeight: candidate.selectionWeight,
    })),
    randomSource
  );
  const item = generateSpecialItem(
    {
      base: {
        ...selected.base,
        itemLevel: input.rolledItemLevel,
      },
      fixedStatRanges: selected.fixedStatRanges,
      coefficients: input.coefficients,
    },
    randomSource
  );

  return {
    outcome: "Generated",
    item,
    selectedCategory: selected.category,
    nextPity: currentPity,
  };
}