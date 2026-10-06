import { CHARACTER_STATUS } from "./character.constants.js";

export type CharacterStatus =
  (typeof CHARACTER_STATUS)[keyof typeof CHARACTER_STATUS];

export type CharacterId = string;
export type AccountId = string;
export type SeasonId = string;

export type CharacterName = {
  display: string;
  normalized: string;
};

export type CharacterResources = {
  currentHealth: number;
  maximumHealth: number;

  currentMana: number;
  maximumMana: number;

  currentEnergy: number;
  maximumEnergy: number;

  resourcesUpdatedAt: Date;
};

export type ResourceRegenerationRates = {
  healthPerMinute: number;
  manaPerMinute: number;
  energyPerMinute: number;
};

export type CharacterBaseStatistics = {
  attack: number;
  defense: number;
  spellPower: number;
};

export type CharacterProgression = {
  level: number;
  experience: bigint;
  gold: bigint;

  craftingLevel: number;
  craftingExperience: bigint;

  gatheringLevel: number;
  gatheringExperience: bigint;
};

export type CharacterUnlocks = {
  spellSlots: number;
  craftingSlots: number;
  inventorySlots: number;
  promoted: boolean;
};

export type CharacterSummary = {
  characterId: CharacterId;
  accountId: AccountId;
  seasonId: SeasonId | null;

  name: string;
  status: CharacterStatus;

  level: number;
  experience: bigint;

  createdAt: Date;
  updatedAt: Date;
};

export type CharacterSnapshot = {
  characterId: CharacterId;
  accountId: AccountId;
  seasonId: SeasonId | null;

  name: string;
  status: CharacterStatus;

  progression: CharacterProgression;
  resources: CharacterResources;
  baseStatistics: CharacterBaseStatistics;
  unlocks: CharacterUnlocks;

  createdAt: Date;
  updatedAt: Date;
};

export type ResourceRegenerationResult = {
  resources: CharacterResources;

  elapsedWholeMinutes: number;

  restoredHealth: number;
  restoredMana: number;
  restoredEnergy: number;

  needsPersistence: boolean;
};