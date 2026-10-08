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
  CombatSessionNotFoundError,
  InvalidPersistentCombatStateError,
} from "../application/combat-session.errors.js";
import {
  PERSISTENT_COMBAT_STATUS,
  type CombatSessionSnapshot,
  type PersistedCombatEvent,
} from "../application/combat-session.models.js";
import type {
  CombatActionTransaction,
  CombatActionTransactionInput,
  CombatSessionRepository,
  CombatStartMonster,
  CombatStartTransaction,
  CombatStartTransactionInput,
  CreateCombatSessionInput,
  LockedCombatCharacter,
  LockedCombatSession,
  PersistCombatActionInput,
} from "../application/combat-session.repository.js";
import {
  mapPostgreSqlCombatSessionRow,
  type PostgreSqlCombatSessionRow,
} from "./postgres-combat.mapper.js";
import {
  COMBAT_DEFEAT_REASON,
  COMBAT_STATUS,
} from "../domain/combat.constants.js";
import type {
  CombatEvent,
  CombatState,
} from "../domain/combat.types.js";



type PostgreSqlCombatEventRow = {
  combat_session_event_id: string;
  combat_session_id: string;
  turn_number: number;
  event_order: number;
  event_type: string;
  event_data_json: unknown;
  created_at: Date;
};

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



function mapPersistedEvent(
  row: PostgreSqlCombatEventRow
): PersistedCombatEvent {
  if (
    !Number.isSafeInteger(row.turn_number) ||
    row.turn_number < 1 ||
    row.turn_number > 100
  ) {
    throw new InvalidPersistentCombatStateError(
      "Persisted event turn number is invalid."
    );
  }

  if (
    !Number.isSafeInteger(row.event_order) ||
    row.event_order < 0
  ) {
    throw new InvalidPersistentCombatStateError(
      "Persisted event order is invalid."
    );
  }

  if (
    typeof row.event_type !== "string" ||
    row.event_type.trim().length === 0
  ) {
    throw new InvalidPersistentCombatStateError(
      "Persisted event type is invalid."
    );
  }

  if (
    typeof row.event_data_json !== "object" ||
    row.event_data_json === null ||
    Array.isArray(row.event_data_json)
  ) {
    throw new InvalidPersistentCombatStateError(
      "Persisted event data is invalid."
    );
  }

  return {
    combatSessionEventId:
      row.combat_session_event_id,
    combatSessionId:
      row.combat_session_id,
    turnNumber: row.turn_number,
    eventOrder: row.event_order,
    eventType: row.event_type,
    event:
      row.event_data_json as CombatEvent,
    createdAt: mapValidDate(
      row.created_at,
      "event.created_at"
    ),
  };
}

function mapDomainStatusToPersistent(
  state: CombatState
): {
  status: string;
  defeatReason: string | null;
  endedAtRequired: boolean;
} {
  switch (state.status) {
    case COMBAT_STATUS.inProgress:
      return {
        status:
          PERSISTENT_COMBAT_STATUS.active,
        defeatReason: null,
        endedAtRequired: false,
      };

    case COMBAT_STATUS.playerVictory:
      return {
        status:
          PERSISTENT_COMBAT_STATUS.victory,
        defeatReason: null,
        endedAtRequired: true,
      };

    case COMBAT_STATUS.playerDefeat:
      if (
        state.defeatReason !==
          COMBAT_DEFEAT_REASON.playerHealthDepleted &&
        state.defeatReason !==
          COMBAT_DEFEAT_REASON.turnLimitExceeded
      ) {
        throw new InvalidPersistentCombatStateError(
          "Player defeat requires a valid defeat reason."
        );
      }

      return {
        status:
          PERSISTENT_COMBAT_STATUS.defeat,
        defeatReason:
          state.defeatReason,
        endedAtRequired: true,
      };
  }
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



class PostgresCombatActionTransaction
  implements CombatActionTransaction {
  public constructor(
    private readonly client: PoolClient,
    public readonly locked:
      LockedCombatSession
  ) {}

  public async persistAction(
    input: PersistCombatActionInput
  ): Promise<readonly PersistedCombatEvent[]> {
    const persistent =
      mapDomainStatusToPersistent(
        input.state
      );

    const endedAt =
      persistent.endedAtRequired
        ? input.observedAt
        : null;

    const update =
      await this.client.query(
        `
          UPDATE combat_sessions
          SET
            status = $2,
            current_turn = $3,
            character_health = $4,
            monster_health = $5,
            defeat_reason = $6,
            ended_at = $7,
            updated_at = $8
          WHERE combat_session_id = $1
            AND status = 'Active'
        `,
        [
          this.locked.session
            .combatSessionId,
          persistent.status,
          input.state.turn,
          input.state.player
            .currentHealth,
          input.state.monster
            .currentHealth,
          persistent.defeatReason,
          endedAt,
          input.observedAt,
        ]
      );

    if (update.rowCount !== 1) {
      throw new CombatSessionNotFoundError();
    }

    const persistedEvents:
      PersistedCombatEvent[] = [];

    for (
      let eventOrder = 0;
      eventOrder < input.events.length;
      eventOrder += 1
    ) {
      const event =
        input.events[eventOrder];

      if (event === undefined) {
        throw new InvalidPersistentCombatStateError(
          "Combat event array contains an empty position."
        );
      }

      const result =
        await this.client.query<
          PostgreSqlCombatEventRow
        >(
          `
            INSERT INTO combat_session_events (
              combat_session_id,
              turn_number,
              event_order,
              event_type,
              event_data_json,
              created_at
            )
            VALUES (
              $1,
              $2,
              $3,
              $4,
              $5::jsonb,
              $6
            )
            RETURNING
              combat_session_event_id,
              combat_session_id,
              turn_number,
              event_order,
              event_type,
              event_data_json,
              created_at
          `,
          [
            this.locked.session
              .combatSessionId,
            input.resolvedTurn,
            eventOrder,
            event.type,
            JSON.stringify(event),
            input.observedAt,
          ]
        );

      const row = result.rows[0];

      if (!row) {
        throw new Error(
          "Combat event insert did not return a row."
        );
      }

      persistedEvents.push(
        mapPersistedEvent(row)
      );
    }

    if (
      input.state.status !==
      COMBAT_STATUS.inProgress
    ) {
      const health =
        input.state.status ===
        COMBAT_STATUS.playerDefeat
          ? 0
          : input.state.player
              .currentHealth;

      const healthUpdate =
        await this.client.query(
          `
            UPDATE characters
            SET
              current_health = $2,
              updated_at = $3
            WHERE character_id = $1
              AND status = 'IsActive'
          `,
          [
            this.locked.session
              .characterId,
            health,
            input.observedAt,
          ]
        );

      if (
        healthUpdate.rowCount !== 1
      ) {
        throw new CharacterNotFoundError();
      }
    }

    return persistedEvents;
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

  public async withActionTransaction<TResult>(
    input: CombatActionTransactionInput,
    operation: (
      transaction: CombatActionTransaction
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
        const result =
          await client.query<
            PostgreSqlCombatSessionRow
          >(
            `
              SELECT
                cs.combat_session_id,
                cs.character_id,
                cs.monster_id,
                m.code AS monster_code,
                cs.status,
                cs.current_turn,
                cs.character_health,
                cs.character_maximum_health,
                cs.character_attack,
                cs.character_defense,
                cs.monster_health,
                cs.monster_maximum_health,
                cs.monster_attack,
                cs.monster_defense,
                cs.defeat_reason,
                cs.started_at,
                cs.ended_at
              FROM combat_sessions AS cs
              INNER JOIN characters AS c
                ON c.character_id =
                  cs.character_id
              INNER JOIN monsters AS m
                ON m.monster_id =
                  cs.monster_id
              WHERE c.account_id = $1
                AND c.character_id = $2
                AND c.status = 'IsActive'
                AND cs.status = 'Active'
              FOR UPDATE OF cs
            `,
            [
              input.accountId,
              input.characterId,
            ]
          );

        const row = result.rows[0];

        if (!row) {
          throw new CombatSessionNotFoundError();
        }

        const mapped =
          mapPostgreSqlCombatSessionRow(
            row
          );

        const transaction =
          new PostgresCombatActionTransaction(
            client,
            {
              session: mapped.session,
              combatState:
                mapped.combatState,
            }
          );

        return operation(transaction);
      }
    );
  }

}
