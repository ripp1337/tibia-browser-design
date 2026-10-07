import type { Pool } from "pg";

import type {
  FindMonsterInput,
  ListMonstersInput,
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
  (be.bestiary_entry_id IS NOT NULL) AS bestiary_visible,
  cc.available_at AS cooldown_available_at
`;

export class PostgresMonsterDiscoveryRepository
  implements MonsterDiscoveryRepository
{
  public constructor(
    private readonly pool: Pool
  ) {}

  public async listMonsters(
    input: ListMonstersInput
  ): Promise<readonly MonsterDiscoveryRecord[]> {
    const characterLevel =
      await this.getOwnedCharacterLevel(
        input.accountId,
        input.characterId
      );

    const result =
      await this.pool.query<PostgreSqlMonsterListRow>(
        `
          SELECT
            ${MONSTER_COLUMNS}
          FROM monsters AS m
          LEFT JOIN bestiary_entries AS be
            ON be.character_id = $1
            AND be.monster_id = m.monster_id
          LEFT JOIN character_cooldowns AS cc
            ON cc.character_id = $1
            AND cc.target_id = m.monster_id
            AND cc.cooldown_type = 'Monster'
          ORDER BY
            m.level ASC,
            m.name ASC,
            m.monster_id ASC
        `,
        [
          input.characterId,
          characterLevel,
        ]
      );

    return result.rows.map(mapMonsterListRow);
  }

  public async findMonster(
    input: FindMonsterInput
  ): Promise<MonsterDiscoveryDetailsRecord | null> {
    const characterLevel =
      await this.getOwnedCharacterLevel(
        input.accountId,
        input.characterId
      );

    const result =
      await this.pool.query<PostgreSqlMonsterDetailsRow>(
        `
          SELECT
            ${MONSTER_COLUMNS}
          FROM monsters AS m
          LEFT JOIN bestiary_entries AS be
            ON be.character_id = $1
            AND be.monster_id = m.monster_id
          LEFT JOIN character_cooldowns AS cc
            ON cc.character_id = $1
            AND cc.target_id = m.monster_id
            AND cc.cooldown_type = 'Monster'
          WHERE m.code = $3
        `,
        [
          input.characterId,
          characterLevel,
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
}
