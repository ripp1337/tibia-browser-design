import type {
  MonsterDetails,
  MonsterListItem,
} from "../application/monster-discovery.repository.js";
import {
  MONSTER_TYPE,
  type MonsterType,
} from "../domain/monster.types.js";

export type PostgreSqlMonsterRow = {
  monster_id: string;
  monster_family_id: string;

  code: string;
  name: string;
  description: string;
  artwork: string | null;

  monster_type: string;
  level: number;

  energy_cost: number;
  cooldown_seconds: number;

  bestiary_visible: boolean;
  cooldown_available_at: Date | null;
};

export type PostgreSqlMonsterListRow =
  PostgreSqlMonsterRow;

export type PostgreSqlMonsterDetailsRow =
  PostgreSqlMonsterRow;

export function mapMonsterType(
  value: string
): MonsterType {
  switch (value) {
    case MONSTER_TYPE.normal:
      return MONSTER_TYPE.normal;

    case MONSTER_TYPE.miniBoss:
      return MONSTER_TYPE.miniBoss;

    case MONSTER_TYPE.taskBoss:
      return MONSTER_TYPE.taskBoss;

    case MONSTER_TYPE.dailyBoss:
      return MONSTER_TYPE.dailyBoss;

    default:
      throw new Error(
        `Unsupported monster type: ${value}`
      );
  }
}

function mapNullableDate(
  value: Date | null,
  fieldName: string
): Date | null {
  if (value === null) {
    return null;
  }

  if (
    !(value instanceof Date) ||
    Number.isNaN(value.getTime())
  ) {
    throw new Error(
      `${fieldName} must contain a valid date or null.`
    );
  }

  return value;
}

export function mapMonsterListRow(
  row: PostgreSqlMonsterListRow
): MonsterListItem {
  return {
    code: row.code,
    name: row.name,
    level: row.level,

    monsterType: mapMonsterType(
      row.monster_type
    ),

    energyCost: row.energy_cost,

    bestiaryVisible: row.bestiary_visible,

    cooldownAvailableAt: mapNullableDate(
      row.cooldown_available_at,
      "cooldown_available_at"
    ),
  };
}

export function mapMonsterDetailsRow(
  row: PostgreSqlMonsterDetailsRow
): MonsterDetails {
  return {
    ...mapMonsterListRow(row),

    description: row.description,
  };
}