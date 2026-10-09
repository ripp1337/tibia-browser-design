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
  type CombatEventLog,
  type CombatSettlement,
  type CombatSessionSnapshot,
  type GetActiveCombatInput,
  type GetCombatSessionInput,
  type PersistedCombatEvent,
} from "../application/combat-session.models.js";
import type {
  ApplyDefeatSettlementInput,
  ApplyVictorySettlementInput,
  CombatActionTransaction,
  CombatActionTransactionInput,
  CombatSessionRepository,
  CombatSettlementContext,
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
  mapPostgreSqlCombatSessionSnapshotRow,
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

type SettlementCharacterRow = {
  character_id: string;
  level: number;
  experience: string;
  gold: string;
  current_health: string;
  max_health: string;
  current_mana: string;
  max_mana: string;
  current_energy: string;
  max_energy: string;
  resources_updated_at: Date;
};

type SettlementUnlockRow = {
  is_promoted: boolean;
};

type SettlementBlessingRow = {
  character_blessing_id: string;
};

type SettlementStatisticsRow = {
  total_gold_earned: string;
  highest_gold_owned: string;
  total_monsters_killed: string;
  total_bosses_killed: string;
  total_daily_bosses_killed: string;
  total_deaths: string;
  total_damage_dealt: string;
  total_damage_taken: string;
  highest_physical_hit: string;

  strongest_monster_killed_id:
    string | null;
  strongest_monster_power_score:
    string | null;

  strongest_boss_killed_id:
    string | null;
  strongest_boss_power_score:
    string | null;

  current_no_death_streak: string;
  longest_no_death_streak: string;
};

type SettlementMonsterRow = {
  monster_id: string;
  monster_type: string;
  power_score: string;
  cooldown_seconds: number;
  boss_id: string | null;
  boss_type: string | null;
  additional_cooldown_seconds: number | null;
};

type SettlementTaskDefinitionRow = {
  monster_task_id: string;
  progress_monster_id: string;
  task_boss_id: string;
  required_kills: string;
};

type SettlementTaskProgressRow = {
  task_progress: string;
  task_status: TaskStatus;
};

type SettlementDailyDefinitionRow = {
  daily_boss_definition_id: string;
  daily_boss_rotation_id: string;
  tier: number;
};

type SettlementDailyProgressRow = {
  attempts_used_in_rotation: number;
  total_attempts: string;
  total_victories: string;
  highest_tier_defeated: number | null;
};

type SettlementFightBuffRow = {
  character_buff_id: string;
  buff_type: string;
  value: string;
  duration_remaining: number;
};

type MonsterStartRow = {
  monster_id: string;
  code: string;
  monster_type: string;
  level: number;
  energy_cost: number;
  experience_reward: string;
  gold_min: string;
  gold_max: string;
  health: string;
  attack: string;
  defense: string;
  cooldown_available_at: Date | null;
  task_status: TaskStatus | null;
  daily_boss_available: boolean;
  daily_attempts_used: number;
  daily_attempts_per_day: number | null;
  daily_boss_definition_id:
    string | null;
  daily_boss_rotation_id:
    string | null;
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

function parseNumericValue(
  value: string | number,
  fieldName: string
): number {
  const mapped = Number(value);

  if (
    !Number.isFinite(mapped) ||
    mapped < 0
  ) {
    throw new InvalidPersistentCombatStateError(
      `${fieldName} must contain a non-negative finite number.`
    );
  }

  return mapped;
}

function mapNonNegativeBigInt(
  value: string,
  fieldName: string
): bigint {
  if (!/^[0-9]+$/u.test(value)) {
    throw new InvalidPersistentCombatStateError(
      `${fieldName} must contain a non-negative bigint.`
    );
  }

  return BigInt(value);
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
            m.experience_reward,
            m.gold_min,
            m.gold_max,
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
              AS daily_attempts_per_day,

            daily_definition.daily_boss_definition_id
              AS daily_boss_definition_id,

            active_rotation.daily_boss_rotation_id
              AS daily_boss_rotation_id

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
      experienceReward:
        mapNonNegativeBigInt(
          row.experience_reward,
          "monster.experience_reward"
        ),
      goldMinimum:
        mapNonNegativeBigInt(
          row.gold_min,
          "monster.gold_min"
        ),
      goldMaximum:
        mapNonNegativeBigInt(
          row.gold_max,
          "monster.gold_max"
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

      dailyBossAttempt:
        monsterType === "DailyBoss" &&
        row.daily_boss_definition_id !== null &&
        row.daily_boss_rotation_id !== null &&
        dailyAttemptsPerDay !== undefined
          ? {
              dailyBossDefinitionId:
                row.daily_boss_definition_id,
              dailyBossRotationId:
                row.daily_boss_rotation_id,
              attemptsLimit:
                dailyAttemptsPerDay,
            }
          : undefined,
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

  public async consumeDailyBossAttempt(
    monster: CombatStartMonster
  ): Promise<void> {
    if (
      monster.monsterType !==
      "DailyBoss"
    ) {
      return;
    }

    const attempt =
      monster.dailyBossAttempt;

    if (attempt === undefined) {
      throw new InvalidPersistentCombatStateError(
        "Daily Boss start metadata is incomplete."
      );
    }

    const result =
      await this.client.query(
        `
          INSERT INTO character_daily_boss_progress (
            character_id,
            daily_boss_definition_id,
            daily_boss_rotation_id,
            attempts_used_in_rotation,
            total_attempts,
            last_attempt_at,
            created_at,
            updated_at
          )
          VALUES (
            $1,
            $2,
            $3,
            1,
            1,
            $4,
            $4,
            $4
          )
          ON CONFLICT (
            character_id,
            daily_boss_definition_id,
            daily_boss_rotation_id
          )
          DO UPDATE
          SET
            attempts_used_in_rotation =
              character_daily_boss_progress
                .attempts_used_in_rotation + 1,
            total_attempts =
              character_daily_boss_progress
                .total_attempts + 1,
            last_attempt_at = $4,
            updated_at = $4
          WHERE
            character_daily_boss_progress
              .attempts_used_in_rotation < $5
          RETURNING
            character_daily_boss_progress_id
        `,
        [
          this.character.characterId,
          attempt.dailyBossDefinitionId,
          attempt.dailyBossRotationId,
          this.observedAt,
          attempt.attemptsLimit,
        ]
      );

    if (result.rowCount !== 1) {
      throw new InvalidPersistentCombatStateError(
        "Daily Boss attempt could not be consumed."
      );
    }
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
              defeat_reason,
              monster_experience_reward,
              monster_gold_min,
              monster_gold_max
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
              NULL,
              $13,
              $14,
              $15
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
              monster_experience_reward,
              monster_gold_min,
              monster_gold_max,
              started_at,
              ended_at,
              settled_at
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
            input.monsterExperienceReward.toString(),
            input.monsterGoldMinimum.toString(),
            input.monsterGoldMaximum.toString(),
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
      LockedCombatSession,
    private readonly observedAt: Date
  ) {}

  public async loadSettlementContext():
  Promise<CombatSettlementContext> {
    const characterResult =
      await this.client.query<
        SettlementCharacterRow
      >(
        `
          SELECT
            character_id,
            level,
            experience,
            gold,
            current_health,
            max_health,
            current_mana,
            max_mana,
            current_energy,
            max_energy,
            resources_updated_at
          FROM characters
          WHERE character_id = $1
            AND status = 'IsActive'
          FOR UPDATE
        `,
        [
          this.locked.session
            .characterId,
        ]
      );

    const character =
      characterResult.rows[0];

    if (!character) {
      throw new CharacterNotFoundError();
    }

    const unlockResult =
      await this.client.query<
        SettlementUnlockRow
      >(
        `
          SELECT is_promoted
          FROM character_unlocks
          WHERE character_id = $1
          FOR UPDATE
        `,
        [character.character_id]
      );

    const unlock = unlockResult.rows[0];

    if (!unlock) {
      throw new InvalidPersistentCombatStateError(
        "Character unlock state was not found."
      );
    }

    const blessingResult =
      await this.client.query<
        SettlementBlessingRow
      >(
        `
          SELECT character_blessing_id
          FROM character_blessings
          WHERE character_id = $1
          FOR UPDATE
        `,
        [character.character_id]
      );

    const statisticsResult =
      await this.client.query<
        SettlementStatisticsRow
      >(
        `
          SELECT
            total_gold_earned,
            highest_gold_owned,
            total_monsters_killed,
            total_bosses_killed,
            total_daily_bosses_killed,
            total_deaths,
            total_damage_dealt,
            total_damage_taken,
            statistics.highest_physical_hit,

            statistics.strongest_monster_killed_id,
            strongest_monster.power_score::text
              AS strongest_monster_power_score,

            statistics.strongest_boss_killed_id,
            strongest_boss_monster.power_score::text
              AS strongest_boss_power_score,

            statistics.current_no_death_streak,
            statistics.longest_no_death_streak
          FROM character_statistics
            AS statistics
          LEFT JOIN monsters
            AS strongest_monster
            ON strongest_monster.monster_id =
              statistics.strongest_monster_killed_id
          LEFT JOIN bosses
            AS strongest_boss
            ON strongest_boss.boss_id =
              statistics.strongest_boss_killed_id
          LEFT JOIN monsters
            AS strongest_boss_monster
            ON strongest_boss_monster.monster_id =
              strongest_boss.monster_id
          WHERE statistics.character_id = $1
          FOR UPDATE OF statistics
        `,
        [character.character_id]
      );

    const statistics =
      statisticsResult.rows[0];

    if (!statistics) {
      throw new InvalidPersistentCombatStateError(
        "Character statistics were not found."
      );
    }

    const monsterResult =
      await this.client.query<
        SettlementMonsterRow
      >(
        `
          SELECT
            m.monster_id,
            m.monster_type,
            m.power_score,
            m.cooldown_seconds,
            b.boss_id,
            b.boss_type,
            b.additional_cooldown_seconds
          FROM monsters AS m
          LEFT JOIN bosses AS b
            ON b.monster_id =
              m.monster_id
          WHERE m.monster_id = $1
        `,
        [
          this.locked.session
            .monsterId,
        ]
      );

    const monster =
      monsterResult.rows[0];

    if (!monster) {
      throw new InvalidPersistentCombatStateError(
        "Settlement monster was not found."
      );
    }

    const taskDefinitionResult =
      await this.client.query<
        SettlementTaskDefinitionRow
      >(
        `
          SELECT
            mt.monster_task_id,
            mt.monster_id
              AS progress_monster_id,
            mt.boss_id
              AS task_boss_id,
            mt.required_kills
          FROM monster_tasks AS mt
          LEFT JOIN bosses AS encountered_boss
            ON encountered_boss.boss_id =
              mt.boss_id
          WHERE mt.monster_id = $1
            OR encountered_boss.monster_id = $1
          ORDER BY mt.monster_task_id
        `,
        [
          this.locked.session
            .monsterId,
        ]
      );

    if (
      taskDefinitionResult.rows.length > 1
    ) {
      throw new InvalidPersistentCombatStateError(
        "Settlement monster matched multiple Task definitions."
      );
    }

    const taskDefinition =
      taskDefinitionResult.rows[0] ?? null;

    let taskProgress:
      SettlementTaskProgressRow | null =
        null;

    if (taskDefinition !== null) {
      const taskProgressResult =
        await this.client.query<
          SettlementTaskProgressRow
        >(
          `
            SELECT
              task_progress,
              task_status
            FROM bestiary_statistics
            WHERE character_id = $1
              AND monster_id = $2
            FOR UPDATE
          `,
          [
            character.character_id,
            taskDefinition
              .progress_monster_id,
          ]
        );

      taskProgress =
        taskProgressResult.rows[0] ?? null;
    }

    const dailyDefinitionResult =
      await this.client.query<
        SettlementDailyDefinitionRow
      >(
        `
          SELECT
            definition.daily_boss_definition_id,
            rotation.daily_boss_rotation_id,
            definition.tier
          FROM bosses AS boss
          INNER JOIN daily_boss_definitions
            AS definition
            ON definition.boss_id =
              boss.boss_id
          INNER JOIN daily_boss_rotation
            AS rotation
            ON definition.daily_boss_definition_id
              IN (
                rotation.tier_1_boss_id,
                rotation.tier_2_boss_id,
                rotation.tier_3_boss_id
              )
            AND rotation.created_at <= $2
            AND rotation.reset_timestamp > $2
          WHERE boss.monster_id = $1
          ORDER BY
            rotation.created_at DESC,
            rotation.daily_boss_rotation_id DESC
          LIMIT 1
        `,
        [
          this.locked.session
            .monsterId,
          this.observedAt,
        ]
      );

    const dailyDefinition =
      dailyDefinitionResult.rows[0] ?? null;

    let dailyProgress:
      SettlementDailyProgressRow | null =
        null;

    if (dailyDefinition !== null) {
      const dailyProgressResult =
        await this.client.query<
          SettlementDailyProgressRow
        >(
          `
            SELECT
              attempts_used_in_rotation,
              total_attempts,
              total_victories,
              highest_tier_defeated
            FROM character_daily_boss_progress
            WHERE character_id = $1
              AND daily_boss_definition_id = $2
              AND daily_boss_rotation_id = $3
            FOR UPDATE
          `,
          [
            character.character_id,
            dailyDefinition
              .daily_boss_definition_id,
            dailyDefinition
              .daily_boss_rotation_id,
          ]
        );

      dailyProgress =
        dailyProgressResult.rows[0] ?? null;
    }

    const fightBuffResult =
      await this.client.query<
        SettlementFightBuffRow
      >(
        `
          SELECT
            character_buff_id,
            buff_type,
            value,
            duration_remaining
          FROM character_buffs
          WHERE character_id = $1
            AND duration_type = 'Fights'
            AND duration_remaining > 0
            AND (
              expires_at IS NULL
              OR expires_at > $2
            )
          ORDER BY character_buff_id
          FOR UPDATE
        `,
        [
          character.character_id,
          this.observedAt,
        ]
      );

    const eventResult =
      await this.client.query<
        PostgreSqlCombatEventRow
      >(
        `
          SELECT
            combat_session_event_id,
            combat_session_id,
            turn_number,
            event_order,
            event_type,
            event_data_json,
            created_at
          FROM combat_session_events
          WHERE combat_session_id = $1
          ORDER BY
            turn_number ASC,
            event_order ASC
        `,
        [
          this.locked.session
            .combatSessionId,
        ]
      );

    const statisticsRepository =
      new PostgresCharacterStatisticsRepository(
        this.client
      );

    const statisticsService =
      new CalculateCharacterStatsService(
        statisticsRepository
      );

    const effectiveStatistics =
      await statisticsService.execute({
        characterId:
          character.character_id,
        observedAt: this.observedAt,
      });

    const bossType =
      monster.boss_type === null
        ? null
        : monster.boss_type === "MiniBoss" ||
            monster.boss_type === "TaskBoss" ||
            monster.boss_type === "DailyBoss"
          ? monster.boss_type
          : (() => {
              throw new InvalidPersistentCombatStateError(
                "Settlement boss type is invalid."
              );
            })();

    return {
      character: {
        characterId:
          character.character_id,
        level: mapSafeInteger(
          character.level,
          "settlement.character.level",
          1
        ),
        experience:
          mapNonNegativeBigInt(
            character.experience,
            "settlement.character.experience"
          ),
        gold:
          mapNonNegativeBigInt(
            character.gold,
            "settlement.character.gold"
          ),
        resources: {
          currentHealth: mapSafeInteger(
            character.current_health,
            "settlement.character.current_health"
          ),
          maximumHealth: mapSafeInteger(
            character.max_health,
            "settlement.character.max_health",
            1
          ),
          currentMana: mapSafeInteger(
            character.current_mana,
            "settlement.character.current_mana"
          ),
          maximumMana: mapSafeInteger(
            character.max_mana,
            "settlement.character.max_mana"
          ),
          currentEnergy: mapSafeInteger(
            character.current_energy,
            "settlement.character.current_energy"
          ),
          maximumEnergy: mapSafeInteger(
            character.max_energy,
            "settlement.character.max_energy",
            1
          ),
          resourcesUpdatedAt:
            mapValidDate(
              character.resources_updated_at,
              "settlement.character.resources_updated_at"
            ),
        },
      },

      promoted: unlock.is_promoted,

      blessed:
        blessingResult.rows.length === 1,

      statistics: {
        totalGoldEarned:
          mapNonNegativeBigInt(
            statistics.total_gold_earned,
            "settlement.statistics.total_gold_earned"
          ),
        highestGoldOwned:
          mapNonNegativeBigInt(
            statistics.highest_gold_owned,
            "settlement.statistics.highest_gold_owned"
          ),
        totalMonstersKilled:
          mapNonNegativeBigInt(
            statistics.total_monsters_killed,
            "settlement.statistics.total_monsters_killed"
          ),
        totalBossesKilled:
          mapNonNegativeBigInt(
            statistics.total_bosses_killed,
            "settlement.statistics.total_bosses_killed"
          ),
        totalDailyBossesKilled:
          mapNonNegativeBigInt(
            statistics.total_daily_bosses_killed,
            "settlement.statistics.total_daily_bosses_killed"
          ),
        totalDeaths:
          mapNonNegativeBigInt(
            statistics.total_deaths,
            "settlement.statistics.total_deaths"
          ),
        totalDamageDealt:
          mapNonNegativeBigInt(
            statistics.total_damage_dealt,
            "settlement.statistics.total_damage_dealt"
          ),
        totalDamageTaken:
          mapNonNegativeBigInt(
            statistics.total_damage_taken,
            "settlement.statistics.total_damage_taken"
          ),
        highestPhysicalHit:
          mapNonNegativeBigInt(
            statistics.highest_physical_hit,
            "settlement.statistics.highest_physical_hit"
          ),

        strongestMonsterKilledId:
          statistics
            .strongest_monster_killed_id,

        strongestMonsterPowerScore:
          statistics
            .strongest_monster_power_score ===
          null
            ? null
            : mapNonNegativeBigInt(
                statistics
                  .strongest_monster_power_score,
                "settlement.statistics.strongest_monster_power_score"
              ),

        strongestBossKilledId:
          statistics
            .strongest_boss_killed_id,

        strongestBossPowerScore:
          statistics
            .strongest_boss_power_score ===
          null
            ? null
            : mapNonNegativeBigInt(
                statistics
                  .strongest_boss_power_score,
                "settlement.statistics.strongest_boss_power_score"
              ),

        currentNoDeathStreak:
          mapNonNegativeBigInt(
            statistics.current_no_death_streak,
            "settlement.statistics.current_no_death_streak"
          ),
        longestNoDeathStreak:
          mapNonNegativeBigInt(
            statistics.longest_no_death_streak,
            "settlement.statistics.longest_no_death_streak"
          ),
      },

      rewardBonuses: {
        goldBonusPercent:
          effectiveStatistics
            .goldBonusPercent,
        experienceBonusPercent:
          effectiveStatistics
            .experienceBonusPercent,
      },

      monster: {
        monsterId:
          monster.monster_id,
        monsterType:
          mapMonsterType(
            monster.monster_type
          ),
        powerScore:
          mapNonNegativeBigInt(
            monster.power_score,
            "settlement.monster.power_score"
          ),
        cooldownSeconds:
          mapSafeInteger(
            monster.cooldown_seconds,
            "settlement.monster.cooldown_seconds"
          ),
        bossId: monster.boss_id,
        bossType,
        additionalCooldownSeconds:
          monster.additional_cooldown_seconds ===
          null
            ? 0
            : mapSafeInteger(
                monster.additional_cooldown_seconds,
                "settlement.monster.additional_cooldown_seconds"
              ),
      },

      task:
        taskDefinition === null
          ? null
          : {
              monsterTaskId:
                taskDefinition
                  .monster_task_id,
              progressMonsterId:
                taskDefinition
                  .progress_monster_id,
              taskBossId:
                taskDefinition
                  .task_boss_id,
              requiredKills:
                mapNonNegativeBigInt(
                  taskDefinition
                    .required_kills,
                  "settlement.task.required_kills"
                ),
              currentProgress:
                taskProgress === null
                  ? 0n
                  : mapNonNegativeBigInt(
                      taskProgress
                        .task_progress,
                      "settlement.task.current_progress"
                    ),
              currentStatus:
                taskProgress === null
                  ? "ACTIVE"
                  : taskProgress.task_status,
            },

      dailyBoss:
        dailyDefinition === null
          ? null
          : {
              dailyBossDefinitionId:
                dailyDefinition
                  .daily_boss_definition_id,
              dailyBossRotationId:
                dailyDefinition
                  .daily_boss_rotation_id,
              tier: mapSafeInteger(
                dailyDefinition.tier,
                "settlement.daily_boss.tier",
                1
              ),
              attemptsUsedInRotation:
                dailyProgress === null
                  ? 0
                  : mapSafeInteger(
                      dailyProgress
                        .attempts_used_in_rotation,
                      "settlement.daily_boss.attempts_used_in_rotation"
                    ),
              totalAttempts:
                dailyProgress === null
                  ? 0n
                  : mapNonNegativeBigInt(
                      dailyProgress
                        .total_attempts,
                      "settlement.daily_boss.total_attempts"
                    ),
              totalVictories:
                dailyProgress === null
                  ? 0n
                  : mapNonNegativeBigInt(
                      dailyProgress
                        .total_victories,
                      "settlement.daily_boss.total_victories"
                    ),
              highestTierDefeated:
                dailyProgress
                  ?.highest_tier_defeated ??
                null,
            },

      fightBuffs:
        fightBuffResult.rows.map(
          (row) => ({
            characterBuffId:
              row.character_buff_id,
            buffType: row.buff_type,
            value: parseNumericValue(
              row.value,
              "settlement.fight_buff.value"
            ),
            durationRemaining:
              mapSafeInteger(
                row.duration_remaining,
                "settlement.fight_buff.duration_remaining",
                1
              ),
          })
        ),

      events:
        eventResult.rows.map(
          mapPersistedEvent
        ),
    };
  }

  private async persistVictoryCharacter(
    input: ApplyVictorySettlementInput
  ): Promise<void> {
    const update =
      await this.client.query(
        `
          UPDATE characters
          SET
            level = $2,
            experience = $3,
            gold = $4,
            current_health = $5,
            max_health = $6,
            current_mana = $7,
            max_mana = $8,
            current_energy = $9,
            max_energy = $10,
            resources_updated_at = $11,
            updated_at = $11
          WHERE character_id = $1
            AND status = 'IsActive'
            AND level = $12
            AND experience = $13
            AND gold = $14
        `,
        [
          this.locked.session
            .characterId,
          input.levelAfter,
          input.experienceAfter
            .toString(),
          input.goldAfter.toString(),
          input.resourcesAfter
            .currentHealth,
          input.resourcesAfter
            .maximumHealth,
          input.resourcesAfter
            .currentMana,
          input.resourcesAfter
            .maximumMana,
          input.resourcesAfter
            .currentEnergy,
          input.resourcesAfter
            .maximumEnergy,
          input.observedAt,
          input.context.character.level,
          input.context.character
            .experience.toString(),
          input.context.character
            .gold.toString(),
        ]
      );

    if (update.rowCount !== 1) {
      throw new InvalidPersistentCombatStateError(
        "Victory character state changed after settlement loading."
      );
    }
  }

  private async persistVictoryStatistics(
    input: ApplyVictorySettlementInput
  ): Promise<void> {
    const update =
      await this.client.query(
        `
          UPDATE character_statistics
          SET
            total_gold_earned = $2,
            highest_gold_owned = $3,
            total_monsters_killed = $4,
            total_bosses_killed = $5,
            total_daily_bosses_killed = $6,
            total_damage_dealt = $7,
            total_damage_taken = $8,
            highest_physical_hit = $9,
            strongest_monster_killed_id = $10,
            strongest_boss_killed_id = $11,
            current_no_death_streak = $12,
            longest_no_death_streak = $13,
            updated_at = $14
          WHERE character_id = $1
            AND total_gold_earned = $15
            AND highest_gold_owned = $16
            AND total_monsters_killed = $17
            AND total_bosses_killed = $18
            AND total_daily_bosses_killed = $19
            AND total_damage_dealt = $20
            AND total_damage_taken = $21
            AND highest_physical_hit = $22
            AND current_no_death_streak = $23
            AND longest_no_death_streak = $24
        `,
        [
          this.locked.session
            .characterId,

          input.statisticsAfter
            .totalGoldEarned.toString(),
          input.statisticsAfter
            .highestGoldOwned.toString(),
          input.statisticsAfter
            .totalMonstersKilled.toString(),
          input.statisticsAfter
            .totalBossesKilled.toString(),
          input.statisticsAfter
            .totalDailyBossesKilled
            .toString(),
          input.statisticsAfter
            .totalDamageDealt.toString(),
          input.statisticsAfter
            .totalDamageTaken.toString(),
          input.statisticsAfter
            .highestPhysicalHit.toString(),

          input
            .strongestMonsterKilledIdAfter,
          input
            .strongestBossKilledIdAfter,

          input.statisticsAfter
            .currentNoDeathStreak
            .toString(),
          input.statisticsAfter
            .longestNoDeathStreak
            .toString(),

          input.observedAt,

          input.context.statistics
            .totalGoldEarned.toString(),
          input.context.statistics
            .highestGoldOwned.toString(),
          input.context.statistics
            .totalMonstersKilled.toString(),
          input.context.statistics
            .totalBossesKilled.toString(),
          input.context.statistics
            .totalDailyBossesKilled
            .toString(),
          input.context.statistics
            .totalDamageDealt.toString(),
          input.context.statistics
            .totalDamageTaken.toString(),
          input.context.statistics
            .highestPhysicalHit.toString(),
          input.context.statistics
            .currentNoDeathStreak
            .toString(),
          input.context.statistics
            .longestNoDeathStreak
            .toString(),
        ]
      );

    if (update.rowCount !== 1) {
      throw new InvalidPersistentCombatStateError(
        "Victory statistics changed after settlement loading."
      );
    }
  }

  private async persistVictoryCore(
    input: ApplyVictorySettlementInput
  ): Promise<void> {
    if (
      input.state.status !==
      COMBAT_STATUS.playerVictory
    ) {
      throw new InvalidPersistentCombatStateError(
        "Victory persistence requires a player Victory state."
      );
    }

    if (
      input.context.character.characterId !==
      this.locked.session.characterId
    ) {
      throw new InvalidPersistentCombatStateError(
        "Victory settlement character does not match the locked session."
      );
    }

    if (
      input.context.monster.monsterId !==
      this.locked.session.monsterId
    ) {
      throw new InvalidPersistentCombatStateError(
        "Victory settlement monster does not match the locked session."
      );
    }

    await this.persistCombatEvents({
      resolvedTurn:
        input.resolvedTurn,
      events: input.events,
      observedAt: input.observedAt,
    });

    const characterUpdate =
      await this.client.query(
        `
          UPDATE characters
          SET
            level = $2,
            experience = $3,
            gold = $4,
            current_health = $5,
            max_health = $6,
            current_mana = $7,
            max_mana = $8,
            current_energy = $9,
            max_energy = $10,
            resources_updated_at = $11,
            updated_at = $11
          WHERE character_id = $1
            AND status = 'IsActive'
        `,
        [
          this.locked.session
            .characterId,
          input.levelAfter,
          input.experienceAfter
            .toString(),
          input.goldAfter
            .toString(),
          input.resourcesAfter
            .currentHealth,
          input.resourcesAfter
            .maximumHealth,
          input.resourcesAfter
            .currentMana,
          input.resourcesAfter
            .maximumMana,
          input.resourcesAfter
            .currentEnergy,
          input.resourcesAfter
            .maximumEnergy,
          input.observedAt,
        ]
      );

    if (
      characterUpdate.rowCount !== 1
    ) {
      throw new CharacterNotFoundError();
    }

    const statisticsUpdate =
      await this.client.query(
        `
          UPDATE character_statistics
          SET
            total_gold_earned = $2,
            highest_gold_owned = $3,
            total_monsters_killed = $4,
            total_bosses_killed = $5,
            total_daily_bosses_killed = $6,
            total_damage_dealt = $7,
            total_damage_taken = $8,
            highest_physical_hit = $9,
            strongest_monster_killed_id = $10,
            strongest_boss_killed_id = $11,
            current_no_death_streak = $12,
            longest_no_death_streak = $13,
            updated_at = $14
          WHERE character_id = $1
        `,
        [
          this.locked.session
            .characterId,
          input.statisticsAfter
            .totalGoldEarned
            .toString(),
          input.statisticsAfter
            .highestGoldOwned
            .toString(),
          input.statisticsAfter
            .totalMonstersKilled
            .toString(),
          input.statisticsAfter
            .totalBossesKilled
            .toString(),
          input.statisticsAfter
            .totalDailyBossesKilled
            .toString(),
          input.statisticsAfter
            .totalDamageDealt
            .toString(),
          input.statisticsAfter
            .totalDamageTaken
            .toString(),
          input.statisticsAfter
            .highestPhysicalHit
            .toString(),
          input.strongestMonsterKilledIdAfter,
          input.strongestBossKilledIdAfter,
          input.statisticsAfter
            .currentNoDeathStreak
            .toString(),
          input.statisticsAfter
            .longestNoDeathStreak
            .toString(),
          input.observedAt,
        ]
      );

    if (
      statisticsUpdate.rowCount !== 1
    ) {
      throw new InvalidPersistentCombatStateError(
        "Victory settlement could not update character statistics."
      );
    }
  }

  private async persistVictoryConsequences(
    input: ApplyVictorySettlementInput
  ): Promise<{
    bestiary: {
      discovered: boolean;
      killCount: bigint;
    };
    taskBoss: {
      progressed: boolean;
      status: string | null;
    };
    cooldown: {
      applied: boolean;
      availableAt: Date | null;
    };
    dailyBoss: {
      updated: boolean;
      victoryRecorded: boolean;
    };
  }> {
    const bestiaryEntryInsert =
      await this.client.query(
        `
          INSERT INTO bestiary_entries (
            character_id,
            monster_id,
            unlocked_at,
            created_at
          )
          VALUES (
            $1,
            $2,
            $3,
            $3
          )
          ON CONFLICT (
            character_id,
            monster_id
          )
          DO NOTHING
          RETURNING bestiary_entry_id
        `,
        [
          this.locked.session
            .characterId,
          this.locked.session
            .monsterId,
          input.observedAt,
        ]
      );

    const bestiaryStatistics =
      await this.client.query<{
        kill_count: string;
        task_progress: string;
        task_status: string;
      }>(
        `
          INSERT INTO bestiary_statistics (
            character_id,
            monster_id,
            kill_count,
            first_kill_at,
            last_kill_at,
            task_progress,
            task_status,
            created_at,
            updated_at
          )
          VALUES (
            $1,
            $2,
            1,
            $3,
            $3,
            0,
            'ACTIVE',
            $3,
            $3
          )
          ON CONFLICT (
            character_id,
            monster_id
          )
          DO UPDATE
          SET
            kill_count =
              bestiary_statistics.kill_count + 1,
            last_kill_at = EXCLUDED.last_kill_at,
            updated_at = EXCLUDED.updated_at
          RETURNING
            kill_count,
            task_progress,
            task_status
        `,
        [
          this.locked.session
            .characterId,
          this.locked.session
            .monsterId,
          input.observedAt,
        ]
      );

    const bestiaryRow =
      bestiaryStatistics.rows[0];

    if (!bestiaryRow) {
      throw new InvalidPersistentCombatStateError(
        "Victory settlement could not update Bestiary statistics."
      );
    }

    let taskProgressed = false;
    let taskStatus: string | null =
      input.context.task
        ?.currentStatus ??
      null;

    const task =
      input.context.task;

    if (
      task !== null &&
      this.locked.session.monsterId ===
        task.progressMonsterId
    ) {
      const progressUpdate =
        await this.client.query<{
          task_progress: string;
          task_status: string;
        }>(
          `
            UPDATE bestiary_statistics
            SET
              task_progress = LEAST(
                $3::bigint,
                task_progress + 1
              ),
              task_status =
                CASE
                  WHEN LEAST(
                    $3::bigint,
                    task_progress + 1
                  ) >= $3::bigint
                    THEN 'UNLOCKED'
                  ELSE task_status
                END,
              updated_at = $4
            WHERE character_id = $1
              AND monster_id = $2
              AND task_status = 'ACTIVE'
            RETURNING
              task_progress,
              task_status
          `,
          [
            this.locked.session
              .characterId,
            task.progressMonsterId,
            task.requiredKills
              .toString(),
            input.observedAt,
          ]
        );

      const progressRow =
        progressUpdate.rows[0];

      if (progressRow) {
        taskProgressed = true;
        taskStatus =
          progressRow.task_status;
      }
    }

    if (
      task !== null &&
      input.context.monster.bossId ===
        task.taskBossId
    ) {
      const bossUpdate =
        await this.client.query<{
          task_status: string;
        }>(
          `
            UPDATE bestiary_statistics
            SET
              task_status =
                'WAITING_FOR_REUNLOCK',
              updated_at = $3
            WHERE character_id = $1
              AND monster_id = $2
              AND task_status = 'UNLOCKED'
            RETURNING task_status
          `,
          [
            this.locked.session
              .characterId,
            task.progressMonsterId,
            input.observedAt,
          ]
        );

      const bossRow =
        bossUpdate.rows[0];

      if (bossRow) {
        taskProgressed = true;
        taskStatus =
          bossRow.task_status;
      }
    }

    let dailyBossUpdated = false;
    let dailyBossVictoryRecorded = false;

    const dailyBoss =
      input.context.dailyBoss;

    if (dailyBoss !== null) {
      const dailyUpdate =
        await this.client.query(
          `
            UPDATE character_daily_boss_progress
            SET
              total_victories =
                total_victories + 1,
              last_victory_at = $4,
              highest_tier_defeated =
                GREATEST(
                  COALESCE(
                    highest_tier_defeated,
                    0
                  ),
                  $5
                ),
              updated_at = $4
            WHERE character_id = $1
              AND daily_boss_definition_id = $2
              AND daily_boss_rotation_id = $3
          `,
          [
            this.locked.session
              .characterId,
            dailyBoss
              .dailyBossDefinitionId,
            dailyBoss
              .dailyBossRotationId,
            input.observedAt,
            dailyBoss.tier,
          ]
        );

      if (dailyUpdate.rowCount !== 1) {
        throw new InvalidPersistentCombatStateError(
          "Daily Boss Victory progress was not found."
        );
      }

      dailyBossUpdated = true;
      dailyBossVictoryRecorded = true;
    }

    let cooldownApplied = false;
    let cooldownAvailableAt:
      Date | null = null;

    const monsterType =
      input.context.monster
        .monsterType;

    if (
      monsterType === "Normal" ||
      monsterType === "MiniBoss"
    ) {
      const baseSeconds =
        input.context.monster
          .cooldownSeconds;

      const additionalSeconds =
        monsterType === "MiniBoss"
          ? input.context.monster
              .additionalCooldownSeconds
          : 0;

      const totalSeconds =
        baseSeconds +
        additionalSeconds;

      if (
        !Number.isSafeInteger(
          totalSeconds
        ) ||
        totalSeconds < 0
      ) {
        throw new InvalidPersistentCombatStateError(
          "Victory cooldown duration is invalid."
        );
      }

      if (totalSeconds > 0) {
        cooldownAvailableAt =
          new Date(
            input.observedAt.getTime() +
            totalSeconds * 1000
          );

        if (
          Number.isNaN(
            cooldownAvailableAt.getTime()
          )
        ) {
          throw new InvalidPersistentCombatStateError(
            "Victory cooldown timestamp is invalid."
          );
        }

        const cooldownWrite =
          await this.client.query(
            `
              INSERT INTO character_cooldowns (
                character_id,
                cooldown_type,
                target_id,
                available_at,
                created_at,
                updated_at
              )
              VALUES (
                $1,
                'Monster',
                $2,
                $3,
                $4,
                $4
              )
              ON CONFLICT (
                character_id,
                target_id
              )
              WHERE cooldown_type = 'Monster'
              DO UPDATE
              SET
                available_at =
                  EXCLUDED.available_at,
                updated_at =
                  EXCLUDED.updated_at
            `,
            [
              this.locked.session
                .characterId,
              this.locked.session
                .monsterId,
              cooldownAvailableAt,
              input.observedAt,
            ]
          );

        if (cooldownWrite.rowCount !== 1) {
          throw new InvalidPersistentCombatStateError(
            "Victory cooldown could not be persisted."
          );
        }

        cooldownApplied = true;
      }
    }

    for (
      const buff of
      input.context.fightBuffs
    ) {
      if (
        buff.durationRemaining === 1
      ) {
        const deletion =
          await this.client.query(
            `
              DELETE FROM character_buffs
              WHERE character_buff_id = $1
                AND character_id = $2
                AND duration_type = 'Fights'
                AND duration_remaining = 1
            `,
            [
              buff.characterBuffId,
              this.locked.session
                .characterId,
            ]
          );

        if (deletion.rowCount !== 1) {
          throw new InvalidPersistentCombatStateError(
            "Fight-based buff could not be consumed."
          );
        }

        continue;
      }

      const decrement =
        await this.client.query(
          `
            UPDATE character_buffs
            SET
              duration_remaining =
                duration_remaining - 1,
              updated_at = $3
            WHERE character_buff_id = $1
              AND character_id = $2
              AND duration_type = 'Fights'
              AND duration_remaining > 1
          `,
          [
            buff.characterBuffId,
            this.locked.session
              .characterId,
            input.observedAt,
          ]
        );

      if (decrement.rowCount !== 1) {
        throw new InvalidPersistentCombatStateError(
          "Fight-based buff duration could not be decremented."
        );
      }
    }

    return {
      bestiary: {
        discovered:
          bestiaryEntryInsert.rowCount ===
          1,
        killCount:
          mapNonNegativeBigInt(
            bestiaryRow.kill_count,
            "victory.bestiary.kill_count"
          ),
      },
      taskBoss: {
        progressed: taskProgressed,
        status: taskStatus,
      },
      cooldown: {
        applied: cooldownApplied,
        availableAt:
          cooldownAvailableAt,
      },
      dailyBoss: {
        updated:
          dailyBossUpdated,
        victoryRecorded:
          dailyBossVictoryRecorded,
      },
    };
  }

  public async applyVictorySettlement(
    input: ApplyVictorySettlementInput
  ): Promise<CombatSettlement> {
    if (
      input.state.status !==
      COMBAT_STATUS.playerVictory
    ) {
      throw new InvalidPersistentCombatStateError(
        "Victory settlement requires a player Victory state."
      );
    }

    if (
      input.state.defeatReason !== null
    ) {
      throw new InvalidPersistentCombatStateError(
        "Victory settlement cannot contain a defeat reason."
      );
    }

    if (
      !(input.observedAt instanceof Date) ||
      Number.isNaN(
        input.observedAt.getTime()
      )
    ) {
      throw new InvalidPersistentCombatStateError(
        "Victory settlement time is invalid."
      );
    }

    if (
      input.observedAt.getTime() <
      this.locked.session
        .startedAt.getTime()
    ) {
      throw new InvalidPersistentCombatStateError(
        "Victory settlement cannot predate combat start."
      );
    }

    await this.persistVictoryCore(
      input
    );

    const consequences =
      await this.persistVictoryConsequences(
        input
      );

    const summary = {
      version: 1,
      outcome: "Victory",
      defeatReason: null,

      endingResources: {
        health:
          input.resourcesAfter
            .currentHealth,
        maximumHealth:
          input.resourcesAfter
            .maximumHealth,
        mana:
          input.resourcesAfter
            .currentMana,
        maximumMana:
          input.resourcesAfter
            .maximumMana,
        energy:
          input.resourcesAfter
            .currentEnergy,
        maximumEnergy:
          input.resourcesAfter
            .maximumEnergy,
      },

      turnCount: input.state.turn,

      damage: {
        dealt:
          input.damageDealt
            .toString(),
        taken:
          input.damageTaken
            .toString(),
        highestPhysicalHit:
          input.highestPhysicalHit
            .toString(),
      },

      rewards: {
        baseExperience:
          input.baseExperience
            .toString(),
        finalExperience:
          input.experienceAwarded
            .toString(),
        baseGold:
          input.baseGold
            .toString(),
        finalGold:
          input.goldAwarded
            .toString(),
        experienceBonusBasisPoints:
          input.experienceBonusBasisPoints
            .toString(),
        goldBonusBasisPoints:
          input.goldBonusBasisPoints
            .toString(),
      },

      progression: {
        experienceBefore:
          input.context.character
            .experience
            .toString(),
        experienceAfter:
          input.experienceAfter
            .toString(),
        goldBefore:
          input.context.character
            .gold
            .toString(),
        goldAfter:
          input.goldAfter
            .toString(),
        levelBefore:
          input.context.character
            .level,
        levelAfter:
          input.levelAfter,
        experienceLost: "0",
      },

      blessingConsumed: false,
      bestiary:
        consequences.bestiary,
      taskBoss:
        consequences.taskBoss,

      cooldown: {
        applied:
          consequences.cooldown
            .applied,
        availableAt:
          consequences.cooldown
            .availableAt
            ?.toISOString() ??
          null,
      },

      dailyBoss:
        consequences.dailyBoss,

      fightBuffsConsumed:
        input.context.fightBuffs
          .length,
    };

    const logInsert =
      await this.client.query(
        `
          INSERT INTO combat_logs (
            combat_session_id,
            character_id,
            monster_id,
            combat_result,
            turn_count,
            started_at,
            ended_at,
            combat_data_json,
            created_at
          )
          VALUES (
            $1,
            $2,
            $3,
            'Victory',
            $4,
            $5,
            $6,
            $7::jsonb,
            $6
          )
        `,
        [
          this.locked.session
            .combatSessionId,
          this.locked.session
            .characterId,
          this.locked.session
            .monsterId,
          input.state.turn,
          this.locked.session
            .startedAt,
          input.observedAt,
          JSON.stringify(
            summary,
            (_key, value: unknown) =>
              typeof value === "bigint"
                ? value.toString()
                : value
          ),
        ]
      );

    if (logInsert.rowCount !== 1) {
      throw new InvalidPersistentCombatStateError(
        "Victory final combat log could not be created."
      );
    }

    await this.client.query(
      `
        DELETE FROM combat_logs
        WHERE combat_log_id IN (
          SELECT combat_log_id
          FROM combat_logs
          WHERE character_id = $1
          ORDER BY
            created_at DESC,
            combat_log_id DESC
          OFFSET 10
        )
      `,
      [
        this.locked.session
          .characterId,
      ]
    );

    const finalSessionUpdate =
      await this.client.query(
        `
          UPDATE combat_sessions
          SET
            status = 'Victory',
            current_turn = $2,
            character_health = $3,
            monster_health = $4,
            defeat_reason = NULL,
            ended_at = $5,
            settled_at = $5,
            updated_at = $5
          WHERE combat_session_id = $1
            AND status = 'Active'
            AND ended_at IS NULL
            AND settled_at IS NULL
        `,
        [
          this.locked.session
            .combatSessionId,
          input.state.turn,
          input.state.player
            .currentHealth,
          input.state.monster
            .currentHealth,
          input.observedAt,
        ]
      );

    if (
      finalSessionUpdate.rowCount !== 1
    ) {
      throw new CombatSessionNotFoundError();
    }

    return {
      outcome: "Victory",

      experience: {
        before:
          input.context.character
            .experience,
        awarded:
          input.experienceAwarded,
        lost: 0n,
        after:
          input.experienceAfter,
      },

      gold: {
        before:
          input.context.character
            .gold,
        baseRolled:
          input.baseGold,
        awarded:
          input.goldAwarded,
        after:
          input.goldAfter,
      },

      level: {
        before:
          input.context.character
            .level,
        after:
          input.levelAfter,
        levelsChanged:
          input.levelAfter -
          input.context.character
            .level,
      },

      blessingConsumed: false,

      bestiary:
        consequences.bestiary,

      taskBoss:
        consequences.taskBoss,

      cooldown:
        consequences.cooldown,

      dailyBoss:
        consequences.dailyBoss,

      statistics: {
        damageDealt:
          input.damageDealt,
        damageTaken:
          input.damageTaken,
        highestPhysicalHit:
          input.highestPhysicalHit,
      },

      finalSummary: {
        combatSessionId:
          this.locked.session
            .combatSessionId,
        outcome: "Victory",
        turnCount:
          input.state.turn,
        startedAt:
          this.locked.session
            .startedAt,
        endedAt:
          input.observedAt,
      },
    };
  }

  private async persistDefeatCore(
    input: ApplyDefeatSettlementInput
  ): Promise<void> {
    if (
      input.state.status !==
      COMBAT_STATUS.playerDefeat
    ) {
      throw new InvalidPersistentCombatStateError(
        "Defeat persistence requires a player Defeat state."
      );
    }

    if (
      input.state.defeatReason === null
    ) {
      throw new InvalidPersistentCombatStateError(
        "Defeat persistence requires a defeat reason."
      );
    }

    if (
      input.context.character.characterId !==
      this.locked.session.characterId
    ) {
      throw new InvalidPersistentCombatStateError(
        "Defeat settlement character does not match the locked session."
      );
    }

    if (
      input.context.monster.monsterId !==
      this.locked.session.monsterId
    ) {
      throw new InvalidPersistentCombatStateError(
        "Defeat settlement monster does not match the locked session."
      );
    }

    if (
      input.blessingConsumed !==
      input.context.blessed
    ) {
      throw new InvalidPersistentCombatStateError(
        "Defeat Blessing result does not match the locked settlement context."
      );
    }

    await this.persistCombatEvents({
      resolvedTurn:
        input.resolvedTurn,
      events: input.events,
      observedAt: input.observedAt,
    });

    const characterUpdate =
      await this.client.query(
        `
          UPDATE characters
          SET
            level = $2,
            experience = $3,
            gold = $4,
            current_health = $5,
            max_health = $6,
            current_mana = $7,
            max_mana = $8,
            current_energy = $9,
            max_energy = $10,
            resources_updated_at = $11,
            updated_at = $11
          WHERE character_id = $1
            AND status = 'IsActive'
        `,
        [
          this.locked.session
            .characterId,
          input.levelAfter,
          input.experienceAfter
            .toString(),
          input.goldAfter
            .toString(),
          input.resourcesAfter
            .currentHealth,
          input.resourcesAfter
            .maximumHealth,
          input.resourcesAfter
            .currentMana,
          input.resourcesAfter
            .maximumMana,
          input.resourcesAfter
            .currentEnergy,
          input.resourcesAfter
            .maximumEnergy,
          input.observedAt,
        ]
      );

    if (
      characterUpdate.rowCount !== 1
    ) {
      throw new CharacterNotFoundError();
    }

    const statisticsUpdate =
      await this.client.query(
        `
          UPDATE character_statistics
          SET
            total_deaths = $2,
            total_damage_dealt = $3,
            total_damage_taken = $4,
            highest_physical_hit = $5,
            current_no_death_streak = $6,
            longest_no_death_streak = $7,
            updated_at = $8
          WHERE character_id = $1
        `,
        [
          this.locked.session
            .characterId,
          input.statisticsAfter
            .totalDeaths
            .toString(),
          input.statisticsAfter
            .totalDamageDealt
            .toString(),
          input.statisticsAfter
            .totalDamageTaken
            .toString(),
          input.statisticsAfter
            .highestPhysicalHit
            .toString(),
          input.statisticsAfter
            .currentNoDeathStreak
            .toString(),
          input.statisticsAfter
            .longestNoDeathStreak
            .toString(),
          input.observedAt,
        ]
      );

    if (
      statisticsUpdate.rowCount !== 1
    ) {
      throw new InvalidPersistentCombatStateError(
        "Defeat settlement could not update character statistics."
      );
    }

    if (input.blessingConsumed) {
      const blessingDeletion =
        await this.client.query(
          `
            DELETE FROM character_blessings
            WHERE character_id = $1
          `,
          [
            this.locked.session
              .characterId,
          ]
        );

      if (
        blessingDeletion.rowCount !== 1
      ) {
        throw new InvalidPersistentCombatStateError(
          "Defeat Blessing could not be consumed."
        );
      }
    }

    for (
      const buff of
      input.context.fightBuffs
    ) {
      if (
        buff.durationRemaining === 1
      ) {
        const deletion =
          await this.client.query(
            `
              DELETE FROM character_buffs
              WHERE character_buff_id = $1
                AND character_id = $2
                AND duration_type = 'Fights'
                AND duration_remaining = 1
            `,
            [
              buff.characterBuffId,
              this.locked.session
                .characterId,
            ]
          );

        if (deletion.rowCount !== 1) {
          throw new InvalidPersistentCombatStateError(
            "Fight-based buff could not be consumed after Defeat."
          );
        }

        continue;
      }

      const decrement =
        await this.client.query(
          `
            UPDATE character_buffs
            SET
              duration_remaining =
                duration_remaining - 1,
              updated_at = $3
            WHERE character_buff_id = $1
              AND character_id = $2
              AND duration_type = 'Fights'
              AND duration_remaining > 1
          `,
          [
            buff.characterBuffId,
            this.locked.session
              .characterId,
            input.observedAt,
          ]
        );

      if (decrement.rowCount !== 1) {
        throw new InvalidPersistentCombatStateError(
          "Fight-based buff duration could not be decremented after Defeat."
        );
      }
    }
  }

  public async applyDefeatSettlement(
    input: ApplyDefeatSettlementInput
  ): Promise<CombatSettlement> {
    if (
      input.state.status !==
      COMBAT_STATUS.playerDefeat
    ) {
      throw new InvalidPersistentCombatStateError(
        "Defeat settlement requires a player Defeat state."
      );
    }

    if (
      input.state.defeatReason === null
    ) {
      throw new InvalidPersistentCombatStateError(
        "Defeat settlement requires a defeat reason."
      );
    }

    if (
      !(input.observedAt instanceof Date) ||
      Number.isNaN(
        input.observedAt.getTime()
      )
    ) {
      throw new InvalidPersistentCombatStateError(
        "Defeat settlement time is invalid."
      );
    }

    if (
      input.observedAt.getTime() <
      this.locked.session
        .startedAt.getTime()
    ) {
      throw new InvalidPersistentCombatStateError(
        "Defeat settlement cannot predate combat start."
      );
    }

    const persistent =
      mapDomainStatusToPersistent(
        input.state
      );

    if (
      persistent.status !==
        PERSISTENT_COMBAT_STATUS.defeat ||
      persistent.defeatReason === null
    ) {
      throw new InvalidPersistentCombatStateError(
        "Defeat settlement could not map the terminal state."
      );
    }

    await this.persistDefeatCore(
      input
    );

    const summary = {
      version: 1,
      outcome: "Defeat",
      defeatReason:
        persistent.defeatReason,

      endingResources: {
        health:
          input.resourcesAfter
            .currentHealth,
        maximumHealth:
          input.resourcesAfter
            .maximumHealth,
        mana:
          input.resourcesAfter
            .currentMana,
        maximumMana:
          input.resourcesAfter
            .maximumMana,
        energy:
          input.resourcesAfter
            .currentEnergy,
        maximumEnergy:
          input.resourcesAfter
            .maximumEnergy,
      },

      turnCount:
        input.state.turn,

      damage: {
        dealt:
          input.damageDealt
            .toString(),
        taken:
          input.damageTaken
            .toString(),
        highestPhysicalHit:
          input.highestPhysicalHit
            .toString(),
      },

      rewards: {
        baseExperience: "0",
        finalExperience: "0",
        baseGold: "0",
        finalGold: "0",
        experienceBonusBasisPoints: "0",
        goldBonusBasisPoints: "0",
      },

      progression: {
        experienceBefore:
          input.context.character
            .experience
            .toString(),
        experienceAfter:
          input.experienceAfter
            .toString(),
        experienceLost:
          input.experienceLost
            .toString(),
        experienceLossPercent:
          input.lossPercent,

        goldBefore:
          input.context.character
            .gold
            .toString(),
        goldAfter:
          input.goldAfter
            .toString(),

        levelBefore:
          input.context.character
            .level,
        levelAfter:
          input.levelAfter,
      },

      blessingConsumed:
        input.blessingConsumed,

      bestiary: {
        discovered: false,
        killCount: null,
      },

      taskBoss: {
        progressed: false,
        status:
          input.context.task
            ?.currentStatus ??
          null,
      },

      cooldown: {
        applied: false,
        availableAt: null,
      },

      dailyBoss: {
        updated: false,
        victoryRecorded: false,
      },

      fightBuffsConsumed:
        input.context.fightBuffs
          .length,
    };

    const logInsert =
      await this.client.query(
        `
          INSERT INTO combat_logs (
            combat_session_id,
            character_id,
            monster_id,
            combat_result,
            turn_count,
            started_at,
            ended_at,
            combat_data_json,
            created_at
          )
          VALUES (
            $1,
            $2,
            $3,
            'Defeat',
            $4,
            $5,
            $6,
            $7::jsonb,
            $6
          )
        `,
        [
          this.locked.session
            .combatSessionId,
          this.locked.session
            .characterId,
          this.locked.session
            .monsterId,
          input.state.turn,
          this.locked.session
            .startedAt,
          input.observedAt,
          JSON.stringify(
            summary,
            (_key, value) =>
              typeof value === "bigint"
                ? value.toString()
                : value
          ),
        ]
      );

    if (logInsert.rowCount !== 1) {
      throw new InvalidPersistentCombatStateError(
        "Defeat final combat log could not be created."
      );
    }

    await this.client.query(
      `
        DELETE FROM combat_logs
        WHERE combat_log_id IN (
          SELECT combat_log_id
          FROM combat_logs
          WHERE character_id = $1
          ORDER BY
            created_at DESC,
            combat_log_id DESC
          OFFSET 10
        )
      `,
      [
        this.locked.session
          .characterId,
      ]
    );

    const finalSessionUpdate =
      await this.client.query(
        `
          UPDATE combat_sessions
          SET
            status = 'Defeat',
            current_turn = $2,
            character_health = $3,
            monster_health = $4,
            defeat_reason = $5,
            ended_at = $6,
            settled_at = $6,
            updated_at = $6
          WHERE combat_session_id = $1
            AND status = 'Active'
            AND ended_at IS NULL
            AND settled_at IS NULL
        `,
        [
          this.locked.session
            .combatSessionId,
          input.state.turn,
          input.state.player
            .currentHealth,
          input.state.monster
            .currentHealth,
          persistent.defeatReason,
          input.observedAt,
        ]
      );

    if (
      finalSessionUpdate.rowCount !== 1
    ) {
      throw new CombatSessionNotFoundError();
    }

    return {
      outcome: "Defeat",

      experience: {
        before:
          input.context.character
            .experience,
        awarded: 0n,
        lost:
          input.experienceLost,
        after:
          input.experienceAfter,
      },

      gold: {
        before:
          input.context.character
            .gold,
        baseRolled: 0n,
        awarded: 0n,
        after:
          input.goldAfter,
      },

      level: {
        before:
          input.context.character
            .level,
        after:
          input.levelAfter,
        levelsChanged:
          input.levelAfter -
          input.context.character
            .level,
      },

      blessingConsumed:
        input.blessingConsumed,

      bestiary: {
        discovered: false,
        killCount: null,
      },

      taskBoss: {
        progressed: false,
        status:
          input.context.task
            ?.currentStatus ??
          null,
      },

      cooldown: {
        applied: false,
        availableAt: null,
      },

      dailyBoss: {
        updated: false,
        victoryRecorded: false,
      },

      statistics: {
        damageDealt:
          input.damageDealt,
        damageTaken:
          input.damageTaken,
        highestPhysicalHit:
          input.highestPhysicalHit,
      },

      finalSummary: {
        combatSessionId:
          this.locked.session
            .combatSessionId,
        outcome: "Defeat",
        turnCount:
          input.state.turn,
        startedAt:
          this.locked.session
            .startedAt,
        endedAt:
          input.observedAt,
      },
    };
  }

  private async persistCombatEvents(
    input: {
      resolvedTurn: number;
      events: readonly CombatEvent[];
      observedAt: Date;
    }
  ): Promise<readonly PersistedCombatEvent[]> {
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

    return persistedEvents;
  }

  private async persistCombatState(
    input: PersistCombatActionInput
  ): Promise<void> {
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
  }

  public async persistAction(
    input: PersistCombatActionInput
  ): Promise<readonly PersistedCombatEvent[]> {
    if (
      input.state.status !==
      COMBAT_STATUS.inProgress
    ) {
      throw new InvalidPersistentCombatStateError(
        "Terminal combat must use settlement persistence."
      );
    }

    const persistedEvents =
      await this.persistCombatEvents({
        resolvedTurn:
          input.resolvedTurn,
        events: input.events,
        observedAt: input.observedAt,
      });

    await this.persistCombatState(input);

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
                cs.monster_experience_reward,
                cs.monster_gold_min,
                cs.monster_gold_max,
                cs.started_at,
                cs.ended_at,
                cs.settled_at
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
            },
            input.observedAt
          );

        return operation(transaction);
      }
    );
  }


  public async findActiveSession(
    input: GetActiveCombatInput
  ): Promise<CombatSessionSnapshot | null> {
    const result =
      await this.pool.query<
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
            cs.ended_at,
            cs.settled_at
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
          LIMIT 1
        `,
        [
          input.accountId,
          input.characterId,
        ]
      );

    const row = result.rows[0];

    return row
      ? mapPostgreSqlCombatSessionSnapshotRow(
          row
        )
      : null;
  }

  public async findSession(
    input: GetCombatSessionInput
  ): Promise<CombatSessionSnapshot | null> {
    const result =
      await this.pool.query<
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
            cs.ended_at,
            cs.settled_at
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
            AND cs.combat_session_id = $3
          LIMIT 1
        `,
        [
          input.accountId,
          input.characterId,
          input.combatSessionId,
        ]
      );

    const row = result.rows[0];

    return row
      ? mapPostgreSqlCombatSessionSnapshotRow(
          row
        )
      : null;
  }

  public async findEventLog(
    input: GetCombatSessionInput
  ): Promise<CombatEventLog | null> {
    const session =
      await this.findSession(input);

    if (session === null) {
      return null;
    }

    const result =
      await this.pool.query<
        PostgreSqlCombatEventRow
      >(
        `
          SELECT
            cse.combat_session_event_id,
            cse.combat_session_id,
            cse.turn_number,
            cse.event_order,
            cse.event_type,
            cse.event_data_json,
            cse.created_at
          FROM combat_session_events
            AS cse
          WHERE cse.combat_session_id = $1
          ORDER BY
            cse.turn_number ASC,
            cse.event_order ASC
        `,
        [
          input.combatSessionId,
        ]
      );

    return {
      combatSessionId:
        session.combatSessionId,
      events: result.rows.map(
        mapPersistedEvent
      ),
    };
  }

}
