import {
  INITIAL_CHARACTER,
} from "../domain/character.constants.js";
import {
  CharacterResourceStateInvalidError,
} from "../domain/character.errors.js";
import type {
  CharacterSnapshot,
  CharacterStatus,
  CharacterSummary,
} from "../domain/character.types.js";

export type PostgreSqlCharacterSummaryRow = {
  character_id: string;
  account_id: string;
  season_id: string | null;
  name: string;
  status: CharacterStatus;
  level: number;
  experience: string;
  created_at: Date;
  updated_at: Date;
};

export type PostgreSqlCharacterSnapshotRow = {
  character_id: string;
  account_id: string;
  season_id: string | null;
  name: string;
  status: CharacterStatus;

  level: number;
  experience: string;
  gold: string;

  current_health: string;
  max_health: string;

  current_mana: string;
  max_mana: string;

  current_energy: string;
  max_energy: string;

  crafting_level: number;
  crafting_xp: string;

  gathering_level: number;
  gathering_xp: string;

  resources_updated_at: Date;

  is_promoted: boolean;
  spell_slots_unlocked: number;
  crafting_slots_unlocked: number;
  inventory_slots: number;

  current_spell_power_percent: string;

  created_at: Date;
  updated_at: Date;
};

function parseBigIntValue(
  value: string,
  fieldName: string
): bigint {
  try {
    return BigInt(value);
  } catch (error: unknown) {
    throw new CharacterResourceStateInvalidError(
      `${fieldName} must contain a valid bigint value.`
    );
  }
}

function parseSafeInteger(
  value: string,
  fieldName: string
): number {
  const parsedValue = Number(value);

  if (
    !Number.isSafeInteger(parsedValue) ||
    parsedValue < 0
  ) {
    throw new CharacterResourceStateInvalidError(
      `${fieldName} must contain a non-negative safe integer.`
    );
  }

  return parsedValue;
}

function parseSpellPowerPercent(value: string): number {
  const parsedValue = Number(value);

  if (
    !Number.isFinite(parsedValue) ||
    parsedValue < 100
  ) {
    throw new CharacterResourceStateInvalidError(
      "current_spell_power_percent must be at least 100."
    );
  }

  return parsedValue;
}

function assertValidDate(
  value: Date,
  fieldName: string
): Date {
  if (
    !(value instanceof Date) ||
    Number.isNaN(value.getTime())
  ) {
    throw new CharacterResourceStateInvalidError(
      `${fieldName} must contain a valid date.`
    );
  }

  return value;
}

export function mapCharacterSummaryRow(
  row: PostgreSqlCharacterSummaryRow
): CharacterSummary {
  return {
    characterId: row.character_id,
    accountId: row.account_id,
    seasonId: row.season_id,

    name: row.name,
    status: row.status,

    level: row.level,
    experience: parseBigIntValue(
      row.experience,
      "experience"
    ),

    createdAt: assertValidDate(
      row.created_at,
      "created_at"
    ),

    updatedAt: assertValidDate(
      row.updated_at,
      "updated_at"
    ),
  };
}

export function mapCharacterSnapshotRow(
  row: PostgreSqlCharacterSnapshotRow
): CharacterSnapshot {
  return {
    characterId: row.character_id,
    accountId: row.account_id,
    seasonId: row.season_id,

    name: row.name,
    status: row.status,

    progression: {
      level: row.level,

      experience: parseBigIntValue(
        row.experience,
        "experience"
      ),

      gold: parseBigIntValue(
        row.gold,
        "gold"
      ),

      craftingLevel: row.crafting_level,

      craftingExperience: parseBigIntValue(
        row.crafting_xp,
        "crafting_xp"
      ),

      gatheringLevel: row.gathering_level,

      gatheringExperience: parseBigIntValue(
        row.gathering_xp,
        "gathering_xp"
      ),
    },

    resources: {
      currentHealth: parseSafeInteger(
        row.current_health,
        "current_health"
      ),

      maximumHealth: parseSafeInteger(
        row.max_health,
        "max_health"
      ),

      currentMana: parseSafeInteger(
        row.current_mana,
        "current_mana"
      ),

      maximumMana: parseSafeInteger(
        row.max_mana,
        "max_mana"
      ),

      currentEnergy: parseSafeInteger(
        row.current_energy,
        "current_energy"
      ),

      maximumEnergy: parseSafeInteger(
        row.max_energy,
        "max_energy"
      ),

      resourcesUpdatedAt: assertValidDate(
        row.resources_updated_at,
        "resources_updated_at"
      ),
    },

    baseStatistics: {
      attack: INITIAL_CHARACTER.baseAttack,
      defense: INITIAL_CHARACTER.baseDefense,

      spellPowerPercent: parseSpellPowerPercent(
        row.current_spell_power_percent
      ),
    },

    unlocks: {
      promoted: row.is_promoted,
      spellSlots: row.spell_slots_unlocked,
      craftingSlots: row.crafting_slots_unlocked,
      inventorySlots: row.inventory_slots,
    },

    createdAt: assertValidDate(
      row.created_at,
      "created_at"
    ),

    updatedAt: assertValidDate(
      row.updated_at,
      "updated_at"
    ),
  };
}