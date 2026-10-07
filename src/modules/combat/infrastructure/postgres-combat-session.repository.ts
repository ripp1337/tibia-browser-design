import type {
  Pool,
  PoolClient,
  QueryResult,
  QueryResultRow,
} from "pg";

import {
  withTransaction,
} from "../../../infrastructure/database/transaction.js";
import {
  CalculateCharacterStatsService,
} from "../../characters/application/calculate-character-stats.service.js";
import {
  CharacterNotFoundError,
} from "../../characters/domain/character.errors.js";
import type {
  CharacterResources,
} from "../../characters/domain/character.types.js";
import {
  PostgresCharacterStatisticsRepository,
} from "../../characters/infrastructure/postgres-character-statistics.repository.js";
import {
  calculateMonsterCooldown,
} from "../../monsters/domain/monster-cooldown.js";
import {
  calculateMonsterEligibility,
} from "../../monsters/domain/monster-eligibility.js";
import type {
  MonsterType,
  TaskStatus,
} from "../../monsters/domain/monster.types.js";
import {
  mapMonsterType,
} from "../../monsters/infrastructure/postgres-monster.mapper.js";
import {
  CombatAlreadyActiveError,
  InvalidPersistentCombatStateError,
} from "../application/combat-session.errors.js";
import type {
  CombatSessionSnapshot,
} from "../application/combat-session.models.js";
import type {
  CombatSessionRepository,
  CombatStartMonster,
  CombatStartTransaction,
  CombatStartTransactionInput,
  CreateCombatSessionInput,
  LockedCombatCharacter,
} from "../application/combat-session.repository.js";
import {
  mapPostgreSqlCombatSessionRow,
  type PostgreSqlCombatSessionRow,
} from "./postgres-combat.mapper.js";

type LockedCharacterRow = {
  character_id: string;
  account_id: string;
  level: number;
  current_health: string;
  max_health: string;
  current_mana: string;
  max_mana: string;
  current_energy: string;
  max_energy: string;
  resources_updated_at: Date;
};

type ActiveCombatRow = {
  combat_session_id: string;
};

type MonsterStartRow = {
  monster_id: string;
  code: string;
  monster_type: string;
  level: number;
  energy_cost: number;
  health: string;
  attack: string;
  defense: string;
  cooldown_available_at: Date | null;
  task_status: TaskStatus | null;
  daily_boss_available: boolean;
  daily_attempts_used: number;
  daily_attempts_per_day: number | null;
};

function mapSafeInteger(
  value: string | number,
  fieldName: string,
  minimum = 0
): number {
  const mapped = Number(value);

  if (
    !Number.isSafeInteger(mapped) ||
    mapped < minimum
  ) {
    throw new InvalidPersistentCombatStateError(
      `${fieldName} must contain a safe integer greater than or equal to ${minimum}.`
    );
  }

  return mapped;
}

function mapValidDate(
  value: Date,
  fieldName: string
): Date {
  if (
    !(value instanceof Date) ||
    Number.isNaN(value.getTime())
  ) {
    throw new InvalidPersistentCombatStateError(
      `${fieldName} must contain a valid date.`
    );
  }

  return new Date(value.getTime());
}

function mapLockedCharacter(
  row: LockedCharacterRow
): LockedCombatCharacter {
  return {
    characterId: row.character_id,
    accountId: row.account_id,
    level: mapSafeInteger(
      row.level,
      "level",
      1
    ),
    resources: {
      currentHealth: mapSafeInteger(
        row.current_health,
        "current_health"
      ),
      maximumHealth: mapSafeInteger(
        row.max_health,
        "max_health",
        1
      ),
      currentMana: mapSafeInteger(
        row.current_mana,
        "current_mana"
      ),
      maximumMana: mapSafeInteger(
        row.max_mana,
        "max_mana"
      ),
      currentEnergy: mapSafeInteger(
        row.current_energy,
        "current_energy"
      ),
      maximumEnergy: mapSafeInteger(
        row.max_energy,
        "max_energy",
        1
      ),
      resourcesUpdatedAt: mapValidDate(
        row.resources_updated_at,
        "resources_updated_at"
      ),
    },
  };
}

async function lockOwnedActiveCharacter(
  client: PoolClient,
  input: CombatStartTransactionInput
): Promise<LockedCombatCharacter> {
  const result =
    await client.query<LockedCharacterRow>(
      `
        SELECT
          character_id,
          account_id,
          level,
          current_health,
          max_health,
          current_mana,
          max_mana,
          current_energy,
          max_energy,
          resources_updated_at
        FROM characters
        WHERE account_id = $1
          AND character_id = $2
          AND status = 'IsActive'
        FOR UPDATE
      `,
      [
        input.accountId,
        input.characterId,
      ]
    );

  const row = result.rows[0];

  if (!row) {
    throw new CharacterNotFoundError();
  }

  return mapLockedCharacter(row);
}

class PostgresCombatStartTransaction
  implements CombatStartTransaction {
  public constructor(
    private readonly client: PoolClient,
    public readonly character:
      LockedCombatCharacter,
    private readonly observedAt: Date
  ) {}

  public async hasActiveCombat():
  Promise<boolean> {
    const result =
      await this.client.query<ActiveCombatRow>(
        `
          SELECT combat_session_id
          FROM combat_sessions
          WHERE character_id = $1
            AND status = 'Active'
          LIMIT 1
        `,
        [this.character.characterId]
      );

    return result.rows.length > 0;
  }

  public async findMonster(
    monsterCode: string
  ): Promise<CombatStartMonster | null> {
    const result =
      await this.client.query<MonsterStartRow>(
        `
          SELECT
            m.monster_id,
            m.code,
            m.monster_type,
            m.level,
            m.energy_cost,
            m.health,
            m.attack,
            m.defense,

            cc.available_at
              AS cooldown_available_at,

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

          FROM monsters AS m

          LEFT JOIN character_cooldowns AS cc
            ON cc.character_id = $1
            AND cc.target_id = m.monster_id
            AND cc.cooldown_type = 'Monster'

          LEFT JOIN bosses AS task_boss
            ON task_boss.monster_id =
              m.monster_id

          LEFT JOIN monster_tasks
            AS task_definition
            ON task_definition.boss_id =
              task_boss.boss_id

          LEFT JOIN bestiary_statistics
            AS task_statistics
            ON task_statistics.character_id = $1
            AND task_statistics.monster_id =
              task_definition.monster_id

          LEFT JOIN bosses AS daily_boss
            ON daily_boss.monster_id =
              m.monster_id

          LEFT JOIN daily_boss_definitions
            AS daily_definition
            ON daily_definition.boss_id =
              daily_boss.boss_id

          LEFT JOIN daily_boss_rotation
            AS active_rotation
            ON active_rotation.created_at <= $2
            AND active_rotation.reset_timestamp > $2

          LEFT JOIN character_daily_boss_progress
            AS daily_progress
            ON daily_progress.character_id = $1
            AND daily_progress.daily_boss_definition_id =
              daily_definition.daily_boss_definition_id
            AND daily_progress.daily_boss_rotation_id =
              active_rotation.daily_boss_rotation_id

          WHERE m.code = $3
        `,
        [
          this.character.characterId,
          this.observedAt,
          monsterCode,
        ]
      );

    if (result.rows.length > 1) {
      throw new Error(
        "Monster start query returned multiple rows."
      );
    }

    const row = result.rows[0];

    if (!row) {
      return null;
    }

    const monsterType: MonsterType =
      mapMonsterType(row.monster_type);

    const cooldown =
      calculateMonsterCooldown(
        row.cooldown_available_at,
        this.observedAt
      );

    const dailyAttemptsPerDay =
      row.daily_attempts_per_day === null
        ? undefined
        : mapSafeInteger(
            row.daily_attempts_per_day,
            "daily_attempts_per_day",
            1
          );

    const eligibility =
      calculateMonsterEligibility({
        characterLevel:
          this.character.level,
        monsterLevel: mapSafeInteger(
          row.level,
          "monster.level",
          1
        ),
        monsterType,
        cooldownActive:
          cooldown.isActive,
        taskStatus: row.task_status,
        dailyBossAvailable:
          row.daily_boss_available,
        dailyAttemptsUsed:
          mapSafeInteger(
            row.daily_attempts_used,
            "daily_attempts_used"
          ),
        dailyAttemptsPerDay,
      });

    return {
      monsterId: row.monster_id,
      monsterCode: row.code,
      monsterType,
      level: mapSafeInteger(
        row.level,
        "monster.level",
        1
      ),
      energyCost: mapSafeInteger(
        row.energy_cost,
        "monster.energy_cost"
      ),
      maximumHealth: mapSafeInteger(
        row.health,
        "monster.health",
        1
      ),
      attack: mapSafeInteger(
        row.attack,
        "monster.attack"
      ),
      defense: mapSafeInteger(
        row.defense,
        "monster.defense"
      ),
      eligibility,
    };
  }

  public async calculateCharacterStatistics() {
    const repository =
      new PostgresCharacterStatisticsRepository(
        this.client
      );

    const service =
      new CalculateCharacterStatsService(
        repository
      );

    return service.execute({
      characterId:
        this.character.characterId,
      observedAt: this.observedAt,
    });
  }

  public async updateCharacterResources(
    resources: CharacterResources
  ): Promise<void> {
    const result = await this.client.query(
      `
        UPDATE characters
        SET
          current_health = $2,
          max_health = $3,
          current_mana = $4,
          max_mana = $5,
          current_energy = $6,
          max_energy = $7,
          resources_updated_at = $8,
          updated_at = $9
        WHERE character_id = $1
          AND status = 'IsActive'
      `,
      [
        this.character.characterId,
        resources.currentHealth,
        resources.maximumHealth,
        resources.currentMana,
        resources.maximumMana,
        resources.currentEnergy,
        resources.maximumEnergy,
        resources.resourcesUpdatedAt,
        this.observedAt,
      ]
    );

    if (result.rowCount !== 1) {
      throw new CharacterNotFoundError();
    }
  }

  public async createCombatSession(
    input: CreateCombatSessionInput
  ): Promise<CombatSessionSnapshot> {
    try {
      const result =
        await this.client.query<
          PostgreSqlCombatSessionRow
        >(
          `
            INSERT INTO combat_sessions (
              character_id,
              monster_id,
              status,
              current_turn,
              character_health,
              character_mana,
              monster_health,
              started_at,
              character_maximum_health,
              character_attack,
              character_defense,
              monster_maximum_health,
              monster_attack,
              monster_defense,
              defeat_reason
            )
            VALUES (
              $1,
              $2,
              'Active',
              1,
              $3,
              $4,
              $5,
              $6,
              $7,
              $8,
              $9,
              $10,
              $11,
              $12,
              NULL
            )
            RETURNING
              combat_session_id,
              character_id,
              monster_id,
              (
                SELECT code
                FROM monsters
                WHERE monster_id = $2
              ) AS monster_code,
              status,
              current_turn,
              character_health,
              character_maximum_health,
              character_attack,
              character_defense,
              monster_health,
              monster_maximum_health,
              monster_attack,
              monster_defense,
              defeat_reason,
              started_at,
              ended_at
          `,
          [
            this.character.characterId,
            input.monsterId,
            input.characterHealth,
            input.characterMana,
            input.monsterMaximumHealth,
            input.startedAt,
            input.characterMaximumHealth,
            input.characterAttack,
            input.characterDefense,
            input.monsterMaximumHealth,
            input.monsterAttack,
            input.monsterDefense,
          ]
        );

      const row = result.rows[0];

      if (!row) {
        throw new Error(
          "Combat session insert did not return a row."
        );
      }

      return mapPostgreSqlCombatSessionRow(
        row
      ).session;
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "23505"
      ) {
        throw new CombatAlreadyActiveError();
      }

      throw error;
    }
  }
}

export class PostgresCombatSessionRepository
  implements CombatSessionRepository {
  public constructor(
    private readonly pool: Pool
  ) {}

  public async withStartTransaction<TResult>(
    input: CombatStartTransactionInput,
    operation: (
      transaction: CombatStartTransaction
    ) => Promise<TResult>
  ): Promise<TResult> {
    if (
      !(input.observedAt instanceof Date) ||
      Number.isNaN(
        input.observedAt.getTime()
      )
    ) {
      throw new Error(
        "observedAt must contain a valid date."
      );
    }

    return withTransaction(
      this.pool,
      async (client) => {
        const character =
          await lockOwnedActiveCharacter(
            client,
            input
          );

        const transaction =
          new PostgresCombatStartTransaction(
            client,
            character,
            input.observedAt
          );

        if (
          await transaction.hasActiveCombat()
        ) {
          throw new CombatAlreadyActiveError();
        }

        return operation(transaction);
      }
    );
  }
}
