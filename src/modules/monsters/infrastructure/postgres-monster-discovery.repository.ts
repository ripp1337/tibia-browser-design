import type {
  QueryResult,
  QueryResultRow,
} from "pg";

import type {
  FindMonsterRecordInput,
  ListMonsterRecordsInput,
  MonsterDiscoveryDetailsRecord,
  MonsterDiscoveryRecord,
  MonsterDiscoveryRepository,
} from "../application/monster-discovery.repository.js";
import {
  CharacterNotFoundError,
} from "../../characters/domain/character.errors.js";
import {
  mapMonsterDetailsRow,
  mapMonsterListRow,
  type PostgreSqlMonsterDetailsRow,
  type PostgreSqlMonsterListRow,
} from "./postgres-monster.mapper.js";

type CharacterLevelRow = {
  level: number;
};

type ActiveRotationRow = {
  daily_boss_rotation_id: string;
};

const MONSTER_COLUMNS = `
  m.monster_id,
  m.monster_family_id,
  m.code,
  m.name,
  m.description,
  m.artwork,
  m.monster_type,
  m.level,
  m.energy_cost,
  m.cooldown_seconds,

  $2::integer AS character_level,

  (
    be.bestiary_entry_id IS NOT NULL
  ) AS bestiary_visible,

  cc.available_at AS cooldown_available_at,

  task_statistics.task_status,

  (
    active_rotation.daily_boss_rotation_id
      IS NOT NULL
    AND daily_definition.daily_boss_definition_id
      IN (
        active_rotation.tier_1_boss_id,
        active_rotation.tier_2_boss_id,
        active_rotation.tier_3_boss_id
      )
  ) AS daily_boss_available,

  COALESCE(
    daily_progress.attempts_used_in_rotation,
    0
  ) AS daily_attempts_used,

  daily_definition.attempts_per_day
    AS daily_attempts_per_day
`;

const MONSTER_JOINS = `
  LEFT JOIN bestiary_entries AS be
    ON be.character_id = $1
    AND be.monster_id = m.monster_id

  LEFT JOIN character_cooldowns AS cc
    ON cc.character_id = $1
    AND cc.target_id = m.monster_id
    AND cc.cooldown_type = 'Monster'

  LEFT JOIN bosses AS task_boss
    ON task_boss.monster_id = m.monster_id

  LEFT JOIN monster_tasks AS task_definition
    ON task_definition.boss_id =
      task_boss.boss_id

  LEFT JOIN bestiary_statistics
    AS task_statistics
    ON task_statistics.character_id = $1
    AND task_statistics.monster_id =
      task_definition.monster_id

  LEFT JOIN bosses AS daily_boss
    ON daily_boss.monster_id = m.monster_id

  LEFT JOIN daily_boss_definitions
    AS daily_definition
    ON daily_definition.boss_id =
      daily_boss.boss_id

  LEFT JOIN daily_boss_rotation
    AS active_rotation
    ON active_rotation.daily_boss_rotation_id =
      $3::uuid

  LEFT JOIN character_daily_boss_progress
    AS daily_progress
    ON daily_progress.character_id = $1
    AND daily_progress.daily_boss_definition_id =
      daily_definition.daily_boss_definition_id
    AND daily_progress.daily_boss_rotation_id =
      active_rotation.daily_boss_rotation_id
`;

type Queryable = {
  query<Row extends QueryResultRow>(
    queryText: string,
    values?: unknown[]
  ): Promise<QueryResult<Row>>;
};

export class PostgresMonsterDiscoveryRepository
  implements MonsterDiscoveryRepository
{
  public constructor(
    private readonly pool: Queryable
  ) {}

  public async listMonsters(
    input: ListMonsterRecordsInput
  ): Promise<readonly MonsterDiscoveryRecord[]> {
    const characterLevel =
      await this.getOwnedCharacterLevel(
        input.accountId,
        input.characterId
      );

    const activeRotationId =
      await this.findActiveRotationId(
        input.observedAt
      );

    const result =
      await this.pool.query<PostgreSqlMonsterListRow>(
        `
          SELECT
            ${MONSTER_COLUMNS}
          FROM monsters AS m
          ${MONSTER_JOINS}
          ORDER BY
            m.level ASC,
            m.name ASC,
            m.monster_id ASC
        `,
        [
          input.characterId,
          characterLevel,
          activeRotationId,
        ]
      );

    return result.rows.map(
      mapMonsterListRow
    );
  }

  public async findMonster(
    input: FindMonsterRecordInput
  ): Promise<MonsterDiscoveryDetailsRecord | null> {
    const characterLevel =
      await this.getOwnedCharacterLevel(
        input.accountId,
        input.characterId
      );

    const activeRotationId =
      await this.findActiveRotationId(
        input.observedAt
      );

    const result =
      await this.pool.query<PostgreSqlMonsterDetailsRow>(
        `
          SELECT
            ${MONSTER_COLUMNS}
          FROM monsters AS m
          ${MONSTER_JOINS}
          WHERE m.code = $4
        `,
        [
          input.characterId,
          characterLevel,
          activeRotationId,
          input.monsterCode,
        ]
      );

    const row = result.rows[0];

    return row
      ? mapMonsterDetailsRow(row)
      : null;
  }

  private async getOwnedCharacterLevel(
    accountId: string,
    characterId: string
  ): Promise<number> {
    const result =
      await this.pool.query<CharacterLevelRow>(
        `
          SELECT level
          FROM characters
          WHERE account_id = $1
            AND character_id = $2
        `,
        [
          accountId,
          characterId,
        ]
      );

    const row = result.rows[0];

    if (!row) {
      throw new CharacterNotFoundError();
    }

    if (
      !Number.isSafeInteger(row.level) ||
      row.level < 1
    ) {
      throw new Error(
        "Character level must be a positive safe integer."
      );
    }

    return row.level;
  }

  private async findActiveRotationId(
    observedAt: Date
  ): Promise<string | null> {
    if (
      !(observedAt instanceof Date) ||
      Number.isNaN(observedAt.getTime())
    ) {
      throw new Error(
        "observedAt must contain a valid date."
      );
    }

    const result =
      await this.pool.query<ActiveRotationRow>(
        `
          SELECT daily_boss_rotation_id
          FROM daily_boss_rotation
          WHERE created_at <= $1
            AND reset_timestamp > $1
          ORDER BY created_at DESC
          LIMIT 2
        `,
        [observedAt]
      );

    if (result.rows.length > 1) {
      throw new Error(
        "Multiple active Daily Boss rotations were found."
      );
    }

    return (
      result.rows[0]
        ?.daily_boss_rotation_id ??
      null
    );
  }
}
