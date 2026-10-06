export type CharacterStatModifiers = {
  attack: number;
  defense: number;
  spellPower: number;
  maximumHealth: number;
  maximumMana: number;
  maximumEnergy: number;
  goldBonusPercent: number;
  experienceBonusPercent: number;
};

export type CalculateEffectiveCharacterStatisticsInput = {
  level: number;
  spellMasteryPower: number;
  equipment?: Partial<CharacterStatModifiers>;
  achievements?: Partial<CharacterStatModifiers>;
  progressionBoosts?: Partial<CharacterStatModifiers>;
  combat?: Partial<CharacterStatModifiers>;
};

export type EffectiveCharacterStatistics = {
  attack: number;
  defense: number;
  spellPower: number;
  maximumHealth: number;
  maximumMana: number;
  maximumEnergy: number;
  goldBonusPercent: number;
  experienceBonusPercent: number;
};

const BASE_STATISTICS = {
  attack: 7,
  defense: 7,
  spellPower: 100,
  maximumHealth: 180,
  maximumMana: 35,
  maximumEnergy: 100,
} as const;

function modifierValue(
  source: Partial<CharacterStatModifiers> | undefined,
  statistic: keyof CharacterStatModifiers
): number {
  return source?.[statistic] ?? 0;
}

function calculateLevelMaximumHealth(level: number): number {
  return (
    BASE_STATISTICS.maximumHealth +
    (level - 1) * 30
  );
}

function calculateLevelMaximumMana(level: number): number {
  return (
    BASE_STATISTICS.maximumMana +
    (level - 1) * 15
  );
}

export function calculateLevelMaximumEnergy(
  level: number
): number {
  if (level < 20) {
    return BASE_STATISTICS.maximumEnergy;
  }

  return Math.min(
    200,
    110 + Math.floor((level - 20) / 10) * 5
  );
}

export function calculateEffectiveCharacterStatistics(
  input: CalculateEffectiveCharacterStatisticsInput
): EffectiveCharacterStatistics {
  if (!Number.isSafeInteger(input.level) || input.level < 1) {
    throw new Error("Character level must be a positive safe integer.");
  }

  if (
    !Number.isFinite(input.spellMasteryPower) ||
    input.spellMasteryPower < 0
  ) {
    throw new Error("Spell Mastery Power must be non-negative.");
  }

  const attack =
    BASE_STATISTICS.attack +
    modifierValue(input.equipment, "attack") +
    modifierValue(input.achievements, "attack") +
    modifierValue(input.combat, "attack");

  const defense =
    BASE_STATISTICS.defense +
    modifierValue(input.equipment, "defense") +
    modifierValue(input.achievements, "defense") +
    modifierValue(input.combat, "defense");

  const spellPower =
    input.spellMasteryPower +
    modifierValue(input.equipment, "spellPower") +
    modifierValue(input.combat, "spellPower");

  const maximumHealth =
    calculateLevelMaximumHealth(input.level) +
    modifierValue(input.equipment, "maximumHealth");

  const maximumMana =
    calculateLevelMaximumMana(input.level) +
    modifierValue(input.equipment, "maximumMana");

  const maximumEnergy =
    calculateLevelMaximumEnergy(input.level) +
    modifierValue(input.equipment, "maximumEnergy");

  const goldBonusPercent =
    modifierValue(input.equipment, "goldBonusPercent") +
    modifierValue(input.achievements, "goldBonusPercent") +
    modifierValue(
      input.progressionBoosts,
      "goldBonusPercent"
    );

  const experienceBonusPercent =
    modifierValue(
      input.equipment,
      "experienceBonusPercent"
    ) +
    modifierValue(
      input.achievements,
      "experienceBonusPercent"
    ) +
    modifierValue(
      input.progressionBoosts,
      "experienceBonusPercent"
    );

  return {
    attack: Math.max(0, Math.floor(attack)),
    defense: Math.max(0, Math.floor(defense)),
    spellPower: Math.max(0, Math.floor(spellPower)),
    maximumHealth: Math.max(
      1,
      Math.floor(maximumHealth)
    ),
    maximumMana: Math.max(
      0,
      Math.floor(maximumMana)
    ),
    maximumEnergy: Math.max(
      1,
      Math.floor(maximumEnergy)
    ),
    goldBonusPercent: Math.max(
      0,
      goldBonusPercent
    ),
    experienceBonusPercent: Math.max(
      0,
      experienceBonusPercent
    ),
  };
}