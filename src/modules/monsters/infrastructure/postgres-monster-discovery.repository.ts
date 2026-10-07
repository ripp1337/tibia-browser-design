import type { Pool } from "pg";

import type {
  FindMonsterInput,
  ListMonstersInput,
  MonsterDetails,
  MonsterDiscoveryRepository,
  MonsterListItem,
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
  ): Promise<readonly MonsterListItem[]> {
    await this.assertOwnedCharacter(
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
        [input.characterId]
      );

    return result.rows.map(mapMonsterListRow);
  }

  public async findMonster(
    input: FindMonsterInput
  ): Promise<MonsterDetails | null> {
    await this.assertOwnedCharacter(
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
          WHERE m.code = $2
        `,
        [
          input.characterId,
          input.monsterCode,
        ]
      );

    const row = result.rows[0];

    return row
      ? mapMonsterDetailsRow(row)
      : null;
  }

  private async assertOwnedCharacter(
    accountId: string,
    characterId: string
  ): Promise<void> {
    const result = await this.pool.query(
      `
        SELECT character_id
        FROM characters
        WHERE account_id = $1
          AND character_id = $2
      `,
      [
        accountId,
        characterId,
      ]
    );

    if (result.rowCount !== 1) {
      throw new CharacterNotFoundError();
    }
  }
}