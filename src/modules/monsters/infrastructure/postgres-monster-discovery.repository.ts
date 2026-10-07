import type {
  Pool,
} from "pg";

import type {
  MonsterDiscoveryRepository,
  MonsterDetails,
  MonsterListItem,
  FindMonsterInput,
  ListMonstersInput,
} from "../application/monster-discovery.repository.js";

import {
  mapMonsterDetailsRow,
  mapMonsterListRow,
  type PostgreSqlMonsterDetailsRow,
  type PostgreSqlMonsterListRow,
} from "./postgres-monster.mapper.js";

export class PostgresMonsterDiscoveryRepository
  implements MonsterDiscoveryRepository
{
  public constructor(
    private readonly pool: Pool
  ) {}

  public async listMonsters(
    input: ListMonstersInput
  ): Promise<readonly MonsterListItem[]> {
    void input;

    const result =
      await this.pool.query<PostgreSqlMonsterListRow>(
        `
          SELECT
            monster_id,
            monster_family_id,
            code,
            name,
            description,
            artwork,
            monster_type,
            level,
            energy_cost,
            cooldown_seconds
          FROM monsters
          ORDER BY
            level ASC,
            name ASC
        `
      );

    return result.rows.map(
      mapMonsterListRow
    );
  }

  public async findMonster(
    input: FindMonsterInput
  ): Promise<MonsterDetails | null> {
    const result =
      await this.pool.query<PostgreSqlMonsterDetailsRow>(
        `
          SELECT
            monster_id,
            monster_family_id,
            code,
            name,
            description,
            artwork,
            monster_type,
            level,
            energy_cost,
            cooldown_seconds
          FROM monsters
          WHERE code = $1
        `,
        [input.monsterCode]
      );

    const row = result.rows[0];

    return row
      ? mapMonsterDetailsRow(row)
      : null;
  }
}