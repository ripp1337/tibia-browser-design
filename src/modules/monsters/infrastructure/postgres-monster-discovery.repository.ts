import type { Pool } from "pg";

import type {
  MonsterDiscoveryRepository,
  MonsterDetails,
  MonsterListItem,
  FindMonsterInput,
  ListMonstersInput,
} from "../application/monster-discovery.repository.js";

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

    return [];
  }

  public async findMonster(
    input: FindMonsterInput
  ): Promise<MonsterDetails | null> {
    void input;

    return null;
  }
}