import type {
  CombatSessionSnapshot,
  PersistentCombatDefeatReason,
  PersistentCombatState,
  PersistentCombatStatus,
} from "../application/combat-session.models.js";
import {
  PERSISTENT_COMBAT_DEFEAT_REASON,
  PERSISTENT_COMBAT_STATUS,
} from "../application/combat-session.models.js";
import {
  InvalidPersistentCombatStateError,
} from "../application/combat-session.errors.js";
import {
  COMBAT_DEFEAT_REASON,
  COMBAT_STATUS,
} from "../domain/combat.constants.js";
import type {
  CombatDefeatReason,
  CombatState,
  CombatStatus,
} from "../domain/combat.types.js";
import {
  validateCombatState,
} from "../domain/combat-validation.js";

export type PostgreSqlCombatSessionRow = {
  combat_session_id: unknown;
  character_id: unknown;
  monster_id: unknown;
  monster_code: unknown;
  status: unknown;
  current_turn: unknown;
  character_health: unknown;
  character_maximum_health: unknown;
  character_attack: unknown;
  character_defense: unknown;
  monster_health: unknown;
  monster_maximum_health: unknown;
  monster_attack: unknown;
  monster_defense: unknown;
  defeat_reason: unknown;
  started_at: unknown;
  ended_at: unknown;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

function invalid(
  message: string
): never {
  throw new InvalidPersistentCombatStateError(
    message
  );
}

function mapIdentifier(
  value: unknown,
  fieldName: string
): string {
  if (
    typeof value !== "string" ||
    !UUID_PATTERN.test(value)
  ) {
    return invalid(
      `${fieldName} must contain a valid UUID.`
    );
  }

  return value;
}

function mapMonsterCode(
  value: unknown
): string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    return invalid(
      "monster_code must contain a non-empty string."
    );
  }

  return value;
}

function mapSafeInteger(
  value: unknown,
  fieldName: string,
  minimum: number,
  maximum = Number.MAX_SAFE_INTEGER
): number {
  let mapped: number;

  if (
    typeof value === "string" &&
    /^-?\d+$/u.test(value)
  ) {
    mapped = Number(value);
  } else if (typeof value === "number") {
    mapped = value;
  } else {
    return invalid(
      `${fieldName} must contain an integer.`
    );
  }

  if (
    !Number.isSafeInteger(mapped) ||
    mapped < minimum ||
    mapped > maximum
  ) {
    return invalid(
      `${fieldName} must contain a safe integer between ${minimum} and ${maximum}.`
    );
  }

  return mapped;
}

function mapDate(
  value: unknown,
  fieldName: string
): Date {
  if (
    !(value instanceof Date) ||
    Number.isNaN(value.getTime())
  ) {
    return invalid(
      `${fieldName} must contain a valid date.`
    );
  }

  return new Date(value.getTime());
}

function mapNullableDate(
  value: unknown,
  fieldName: string
): Date | null {
  if (value === null) {
    return null;
  }

  return mapDate(value, fieldName);
}

export function mapPersistentCombatStatus(
  value: unknown
): PersistentCombatStatus {
  switch (value) {
    case PERSISTENT_COMBAT_STATUS.active:
      return PERSISTENT_COMBAT_STATUS.active;

    case PERSISTENT_COMBAT_STATUS.victory:
      return PERSISTENT_COMBAT_STATUS.victory;

    case PERSISTENT_COMBAT_STATUS.defeat:
      return PERSISTENT_COMBAT_STATUS.defeat;

    case PERSISTENT_COMBAT_STATUS.abandoned:
      return PERSISTENT_COMBAT_STATUS.abandoned;

    default:
      return invalid(
        `Unsupported persistent combat status: ${String(value)}`
      );
  }
}

export function mapPersistentDefeatReason(
  value: unknown
): PersistentCombatDefeatReason | null {
  switch (value) {
    case null:
      return null;

    case PERSISTENT_COMBAT_DEFEAT_REASON.playerHealthDepleted:
      return PERSISTENT_COMBAT_DEFEAT_REASON.playerHealthDepleted;

    case PERSISTENT_COMBAT_DEFEAT_REASON.turnLimitExceeded:
      return PERSISTENT_COMBAT_DEFEAT_REASON.turnLimitExceeded;

    default:
      return invalid(
        `Unsupported persistent defeat reason: ${String(value)}`
      );
  }
}

export function mapPersistentStatusToDomain(
  status: PersistentCombatStatus
): CombatStatus {
  switch (status) {
    case PERSISTENT_COMBAT_STATUS.active:
      return COMBAT_STATUS.inProgress;

    case PERSISTENT_COMBAT_STATUS.victory:
      return COMBAT_STATUS.playerVictory;

    case PERSISTENT_COMBAT_STATUS.defeat:
      return COMBAT_STATUS.playerDefeat;

    case PERSISTENT_COMBAT_STATUS.abandoned:
      return invalid(
        "Abandoned combat sessions cannot be reconstructed as M4 combat state."
      );
  }
}

export function mapPersistentDefeatReasonToDomain(
  reason: PersistentCombatDefeatReason | null
): CombatDefeatReason | null {
  switch (reason) {
    case null:
      return null;

    case PERSISTENT_COMBAT_DEFEAT_REASON.playerHealthDepleted:
      return COMBAT_DEFEAT_REASON.playerHealthDepleted;

    case PERSISTENT_COMBAT_DEFEAT_REASON.turnLimitExceeded:
      return COMBAT_DEFEAT_REASON.turnLimitExceeded;
  }
}

function createCombatState(
  snapshot: CombatSessionSnapshot
): CombatState {
  const state: CombatState = {
    player: {
      currentHealth:
        snapshot.player.currentHealth,
      maximumHealth:
        snapshot.player.maximumHealth,
      attack:
        snapshot.player.attack,
      defense:
        snapshot.player.defense,
    },
    monster: {
      currentHealth:
        snapshot.monster.currentHealth,
      maximumHealth:
        snapshot.monster.maximumHealth,
      attack:
        snapshot.monster.attack,
      defense:
        snapshot.monster.defense,
    },
    turn: snapshot.currentTurn,
    status:
      mapPersistentStatusToDomain(
        snapshot.status
      ),
    defeatReason:
      mapPersistentDefeatReasonToDomain(
        snapshot.defeatReason
      ),
    effects: [],
  };

  try {
    validateCombatState(state);
  } catch (error: unknown) {
    throw new InvalidPersistentCombatStateError(
      error instanceof Error
        ? `Persistent combat state is invalid: ${error.message}`
        : "Persistent combat state is invalid."
    );
  }

  return state;
}

export function mapPostgreSqlCombatSessionSnapshotRow(
  row: PostgreSqlCombatSessionRow
): CombatSessionSnapshot {
  const snapshot: CombatSessionSnapshot = {
    combatSessionId: mapIdentifier(
      row.combat_session_id,
      "combat_session_id"
    ),
    characterId: mapIdentifier(
      row.character_id,
      "character_id"
    ),
    monsterId: mapIdentifier(
      row.monster_id,
      "monster_id"
    ),
    monsterCode: mapMonsterCode(
      row.monster_code
    ),
    status: mapPersistentCombatStatus(
      row.status
    ),
    defeatReason:
      mapPersistentDefeatReason(
        row.defeat_reason
      ),
    currentTurn: mapSafeInteger(
      row.current_turn,
      "current_turn",
      1,
      100
    ),
    player: {
      currentHealth: mapSafeInteger(
        row.character_health,
        "character_health",
        0
      ),
      maximumHealth: mapSafeInteger(
        row.character_maximum_health,
        "character_maximum_health",
        1
      ),
      attack: mapSafeInteger(
        row.character_attack,
        "character_attack",
        0
      ),
      defense: mapSafeInteger(
        row.character_defense,
        "character_defense",
        0
      ),
    },
    monster: {
      currentHealth: mapSafeInteger(
        row.monster_health,
        "monster_health",
        0
      ),
      maximumHealth: mapSafeInteger(
        row.monster_maximum_health,
        "monster_maximum_health",
        1
      ),
      attack: mapSafeInteger(
        row.monster_attack,
        "monster_attack",
        0
      ),
      defense: mapSafeInteger(
        row.monster_defense,
        "monster_defense",
        0
      ),
    },
    startedAt: mapDate(
      row.started_at,
      "started_at"
    ),
    endedAt: mapNullableDate(
      row.ended_at,
      "ended_at"
    ),
  };

  return snapshot;
}

export function mapPostgreSqlCombatSessionRow(
  row: PostgreSqlCombatSessionRow
): PersistentCombatState {
  const snapshot =
    mapPostgreSqlCombatSessionSnapshotRow(
      row
    );

  return {
    session: snapshot,
    combatState:
      createCombatState(snapshot),
  };
}
