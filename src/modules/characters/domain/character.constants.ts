export const CHARACTER_STATUS = {
  active: "IsActive",
  archived: "Archived",
} as const;

export const CHARACTER_NAME_POLICY = {
  minimumLength: 3,
  maximumLength: 24,
} as const;

export const CHARACTER_LIMITS = {
  maximumActiveCharactersPerAccount: 3,
} as const;

export const INITIAL_CHARACTER = {
  level: 1,
  experience: 0n,
  gold: 0n,

  currentHealth: 180,
  maximumHealth: 180,

  currentMana: 35,
  maximumMana: 35,

  currentEnergy: 100,
  maximumEnergy: 100,

  baseAttack: 7,
  baseDefense: 7,
  baseSpellPowerPercent: 100,

  craftingLevel: 1,
  craftingExperience: 0n,

  gatheringLevel: 1,
  gatheringExperience: 0n,

  spellSlots: 1,
  craftingSlots: 1,
  inventorySlots: 50,
} as const;

export const DEFAULT_RESOURCE_REGENERATION = {
  healthPerMinute: 0,
  manaPerMinute: 0,
  energyPerMinute: 1,
} as const;