import type {
  Pool,
  PoolClient,
  QueryResult,
  QueryResultRow,
} from "pg";

import type {
  ArchiveCharacterInput,
  CharacterRepository,
  CreateCharacterGraphInput,
  FindCharacterSnapshotInput,
  UpdateCharacterResourcesInput,
} from "../application/character.repository.js";
import {
  CHARACTER_LIMITS,
  CHARACTER_STATUS,
} from "../domain/character.constants.js";
import {
  CharacterAccessDeniedError,
  CharacterLimitReachedError,
  CharacterNameTakenError,
} from "../domain/character.errors.js";
import type {
  AccountId,
  CharacterSnapshot,
  CharacterSummary,
} from "../domain/character.types.js";
import { withTransaction } from "../../../infrastructure/database/transaction.js";
import {
  mapCharacterSnapshotRow,
  mapCharacterSummaryRow,
  type PostgreSqlCharacterSnapshotRow,
  type PostgreSqlCharacterSummaryRow,
} from "./postgres-character.mapper.js";

type PostgreSqlError = {
  code?: string;
  constraint?: string;
};

type Queryable = {
  query<Row extends QueryResultRow>(
    queryText: string,
    values?: unknown[]
  ): Promise<QueryResult<Row>>;
};

type CharacterIdRow = {
  character_id: string;
};

type CountRow = {
  active_character_count: string;
};

const SUMMARY_COLUMNS = `
  character_id,
  account_id,
  season_id,
  name,
  status,
  level,
  experience,
  created_at,
  updated_at
`;

const SNAPSHOT_QUERY = `
  SELECT
    c.character_id,
    c.account_id,
    c.season_id,
    c.name,
    c.status,

    c.level,
    c.experience,
    c.gold,

    c.current_health,
    c.max_health,

    c.current_mana,
    c.max_mana,

    c.current_energy,
    c.max_energy,

    c.crafting_level,
    c.crafting_xp,

    c.gathering_level,
    c.gathering_xp,

    c.resources_updated_at,

    u.is_promoted,
    u.spell_slots_unlocked,
    u.crafting_slots_unlocked,
    u.inventory_slots,

    m.current_spell_power_percent,

    c.created_at,
    c.updated_at
  FROM characters AS c
  INNER JOIN character_unlocks AS u
    ON u.character_id = c.character_id
  INNER JOIN character_spell_mastery AS m
    ON m.character_id = c.character_id
  WHERE c.account_id = $1
    AND c.character_id = $2
`;

function isPostgreSqlError(error: unknown): error is PostgreSqlError {
  return typeof error === "object" && error !== null;
}

function isCharacterNameUniquenessError(error: unknown): boolean {
  if (!isPostgreSqlError(error) || error.code !== "23505") {
    return false;
  }

  return (
    error.constraint === "ux_characters_name" ||
    error.constraint === "ux_characters_normalized_name"
  );
}

async function findSnapshot(
  queryable: Queryable,
  accountId: string,
  characterId: string
): Promise<CharacterSnapshot | null> {
  const result =
    await queryable.query<PostgreSqlCharacterSnapshotRow>(
      SNAPSHOT_QUERY,
      [accountId, characterId]
    );

  const row = result.rows[0];

  return row ? mapCharacterSnapshotRow(row) : null;
}

export class PostgresCharacterRepository
  implements CharacterRepository
{
  public constructor(private readonly pool: Pool) {}

  public async createCharacterGraph(
    input: CreateCharacterGraphInput
  ): Promise<CharacterSnapshot> {
    try {
      return await withTransaction(
        this.pool,
        async (client: PoolClient) => {
          await this.lockAccount(client, input.accountId);

          const activeCharacterCount =
            await this.countActiveCharacters(
              client,
              input.accountId
            );

          if (
            activeCharacterCount >=
            CHARACTER_LIMITS.maximumActiveCharactersPerAccount
          ) {
            throw new CharacterLimitReachedError(
              CHARACTER_LIMITS.maximumActiveCharactersPerAccount
            );
          }

          const characterResult =
            await client.query<CharacterIdRow>(
              `
                INSERT INTO characters (
                  account_id,
                  season_id,
                  name
                )
                VALUES ($1, $2, $3)
                RETURNING character_id
              `,
              [
                input.accountId,
                input.seasonId,
                input.name,
              ]
            );

          const characterRow = characterResult.rows[0];

          if (!characterRow) {
            throw new Error(
              "Character insert did not return character_id."
            );
          }

          const characterId = characterRow.character_id;

          await client.query(
            `
              INSERT INTO character_statistics (
                character_id
              )
              VALUES ($1)
            `,
            [characterId]
          );

          await client.query(
            `
              INSERT INTO character_unlocks (
                character_id
              )
              VALUES ($1)
            `,
            [characterId]
          );

          await client.query(
            `
              INSERT INTO character_spell_mastery (
                character_id
              )
              VALUES ($1)
            `,
            [characterId]
          );

          await client.query(
            `
              INSERT INTO character_loadouts (
                character_id,
                name,
                is_default
              )
              VALUES ($1, $2, TRUE)
            `,
            [
              characterId,
              input.spellLoadoutName,
            ]
          );

          await client.query(
            `
              INSERT INTO equipment_loadouts (
                character_id,
                name,
                is_default
              )
              VALUES ($1, $2, TRUE)
            `,
            [
              characterId,
              input.equipmentLoadoutName,
            ]
          );

          const snapshot = await findSnapshot(
            client,
            input.accountId,
            characterId
          );

          if (!snapshot) {
            throw new Error(
              "Created character snapshot could not be loaded."
            );
          }

          return snapshot;
        }
      );
    } catch (error: unknown) {
      if (isCharacterNameUniquenessError(error)) {
        throw new CharacterNameTakenError();
      }

      throw error;
    }
  }

  public async listByAccount(
    accountId: AccountId
  ): Promise<readonly CharacterSummary[]> {
    const result =
      await this.pool.query<PostgreSqlCharacterSummaryRow>(
        `
          SELECT
            ${SUMMARY_COLUMNS}
          FROM characters
          WHERE account_id = $1
          ORDER BY
            CASE
              WHEN status = $2 THEN 0
              ELSE 1
            END,
            created_at ASC,
            character_id ASC
        `,
        [
          accountId,
          CHARACTER_STATUS.active,
        ]
      );

    return result.rows.map(mapCharacterSummaryRow);
  }

  public async findSnapshotById(
    input: FindCharacterSnapshotInput
  ): Promise<CharacterSnapshot | null> {
    return findSnapshot(
      this.pool,
      input.accountId,
      input.characterId
    );
  }

  public async archive(
    input: ArchiveCharacterInput
  ): Promise<CharacterSummary | null> {
    const result =
      await this.pool.query<PostgreSqlCharacterSummaryRow>(
        `
          UPDATE characters
          SET
            status = $3,
            updated_at = now()
          WHERE account_id = $1
            AND character_id = $2
            AND status = $4
          RETURNING
            ${SUMMARY_COLUMNS}
        `,
        [
          input.accountId,
          input.characterId,
          CHARACTER_STATUS.archived,
          CHARACTER_STATUS.active,
        ]
      );

    const row = result.rows[0];

    return row ? mapCharacterSummaryRow(row) : null;
  }

  public async updateResources(
    input: UpdateCharacterResourcesInput
  ): Promise<boolean> {
    const result = await this.pool.query(
      `
        UPDATE characters
        SET
          current_health = $3,
          max_health = $4,
          current_mana = $5,
          max_mana = $6,
          current_energy = $7,
          max_energy = $8,
          resources_updated_at = $9,
          updated_at = now()
        WHERE account_id = $1
          AND character_id = $2
      `,
      [
        input.accountId,
        input.characterId,
        input.resources.currentHealth,
        input.resources.maximumHealth,
        input.resources.currentMana,
        input.resources.maximumMana,
        input.resources.currentEnergy,
        input.resources.maximumEnergy,
        input.resources.resourcesUpdatedAt,
      ]
    );

    return result.rowCount === 1;
  }

  private async lockAccount(
    client: PoolClient,
    accountId: AccountId
  ): Promise<void> {
    const result = await client.query(
      `
        SELECT account_id
        FROM accounts
        WHERE account_id = $1
          AND status = 'Active'
        FOR UPDATE
      `,
      [accountId]
    );

    if (result.rowCount !== 1) {
      throw new CharacterAccessDeniedError();
    }
  }

  private async countActiveCharacters(
    client: PoolClient,
    accountId: AccountId
  ): Promise<number> {
    const result = await client.query<CountRow>(
      `
        SELECT COUNT(*)::text AS active_character_count
        FROM characters
        WHERE account_id = $1
          AND status = $2
      `,
      [
        accountId,
        CHARACTER_STATUS.active,
      ]
    );

    const row = result.rows[0];

    if (!row) {
      throw new Error(
        "Active character count query returned no row."
      );
    }

    const count = Number(row.active_character_count);

    if (!Number.isSafeInteger(count) || count < 0) {
      throw new Error(
        "Active character count is invalid."
      );
    }

    return count;
  }
}