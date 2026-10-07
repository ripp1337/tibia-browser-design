import type {
  MonsterDiscoveryDetailsRecord,
  MonsterDiscoveryRecord,
} from "../application/monster-discovery.repository.js";
import {
  MONSTER_TYPE,
  TASK_STATUS,
  type MonsterType,
  type TaskStatus,
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

  character_level: number;
  bestiary_visible: boolean;
  cooldown_available_at: Date | null;

  task_status: string | null;
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

function mapTaskStatus(
  value: string | null
): TaskStatus | null {
  switch (value) {
    case null:
      return null;

    case TASK_STATUS.active:
      return TASK_STATUS.active;

    case TASK_STATUS.unlocked:
      return TASK_STATUS.unlocked;

    case TASK_STATUS.waitingForReunlock:
      return TASK_STATUS.waitingForReunlock;

    default:
      throw new Error(
        `Unsupported task status: ${value}`
      );
  }
}

function assertNonNegativeInteger(
  value: number,
  fieldName: string
): number {
  if (
    !Number.isSafeInteger(value) ||
    value < 0
  ) {
    throw new Error(
      `${fieldName} must contain a non-negative safe integer.`
    );
  }

  return value;
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
): MonsterDiscoveryRecord {
  return {
    code: row.code,
    name: row.name,

    level: assertNonNegativeInteger(
      row.level,
      "level"
    ),

    monsterType: mapMonsterType(
      row.monster_type
    ),

    energyCost: assertNonNegativeInteger(
      row.energy_cost,
      "energy_cost"
    ),

    characterLevel: assertNonNegativeInteger(
      row.character_level,
      "character_level"
    ),

    bestiaryVisible: row.bestiary_visible,

    cooldownAvailableAt: mapNullableDate(
      row.cooldown_available_at,
      "cooldown_available_at"
    ),

    taskStatus: mapTaskStatus(
      row.task_status
    ),
  };
}

export function mapMonsterDetailsRow(
  row: PostgreSqlMonsterDetailsRow
): MonsterDiscoveryDetailsRecord {
  return {
    ...mapMonsterListRow(row),
    description: row.description,
  };
}
