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

export function mapMonsterListRow(
  row: PostgreSqlMonsterListRow
): MonsterListItem {
  return {
    code: row.code,
    name: row.name,

    monsterType: mapMonsterType(
      row.monster_type
    ),

    level: row.level,
    energyCost: row.energy_cost,

    bestiaryVisible: false,
    cooldownAvailableAt: null,
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