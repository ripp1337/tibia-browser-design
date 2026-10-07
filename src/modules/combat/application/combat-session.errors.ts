import {
  ApplicationError,
} from "../../../application/errors/application-error.js";

export const COMBAT_SESSION_ERROR_CODE = {
  combatAlreadyActive:
    "COMBAT_ALREADY_ACTIVE",
  combatSessionNotFound:
    "COMBAT_SESSION_NOT_FOUND",
  combatTurnMismatch:
    "COMBAT_TURN_MISMATCH",
  combatAlreadyEnded:
    "COMBAT_ALREADY_ENDED",
  insufficientEnergy:
    "INSUFFICIENT_ENERGY",
  characterHealthDepleted:
    "CHARACTER_HEALTH_DEPLETED",
  monsterNotEligible:
    "MONSTER_NOT_ELIGIBLE",
  invalidPersistentCombatState:
    "COMBAT_INVALID_PERSISTENT_STATE",
} as const;

export type CombatSessionErrorCode =
  (typeof COMBAT_SESSION_ERROR_CODE)[keyof typeof COMBAT_SESSION_ERROR_CODE];

export class CombatAlreadyActiveError
  extends ApplicationError {
  public constructor() {
    super({
      code:
        COMBAT_SESSION_ERROR_CODE.combatAlreadyActive,
      message:
        "The character already has an active combat session.",
      statusCode: 409,
    });

    this.name = "CombatAlreadyActiveError";
  }
}

export class CombatSessionNotFoundError
  extends ApplicationError {
  public constructor() {
    super({
      code:
        COMBAT_SESSION_ERROR_CODE.combatSessionNotFound,
      message:
        "Combat session was not found.",
      statusCode: 404,
    });

    this.name = "CombatSessionNotFoundError";
  }
}

export class CombatTurnMismatchError
  extends ApplicationError {
  public constructor(
    expectedTurn: number,
    currentTurn: number
  ) {
    super({
      code:
        COMBAT_SESSION_ERROR_CODE.combatTurnMismatch,
      message:
        "The submitted combat turn does not match the current session turn.",
      statusCode: 409,
      details: {
        expectedTurn,
        currentTurn,
      },
    });

    this.name = "CombatTurnMismatchError";
  }
}

export class PersistentCombatAlreadyEndedError
  extends ApplicationError {
  public constructor() {
    super({
      code:
        COMBAT_SESSION_ERROR_CODE.combatAlreadyEnded,
      message:
        "Combat has already ended.",
      statusCode: 409,
    });

    this.name =
      "PersistentCombatAlreadyEndedError";
  }
}

export class InsufficientEnergyError
  extends ApplicationError {
  public constructor() {
    super({
      code:
        COMBAT_SESSION_ERROR_CODE.insufficientEnergy,
      message:
        "The character does not have enough Energy.",
      statusCode: 409,
    });

    this.name = "InsufficientEnergyError";
  }
}

export class CharacterHealthDepletedError
  extends ApplicationError {
  public constructor() {
    super({
      code:
        COMBAT_SESSION_ERROR_CODE.characterHealthDepleted,
      message:
        "A character with depleted Health cannot start combat.",
      statusCode: 409,
    });

    this.name =
      "CharacterHealthDepletedError";
  }
}

export class MonsterNotEligibleError
  extends ApplicationError {
  public constructor() {
    super({
      code:
        COMBAT_SESSION_ERROR_CODE.monsterNotEligible,
      message:
        "The character is not eligible to fight this monster.",
      statusCode: 409,
    });

    this.name = "MonsterNotEligibleError";
  }
}

export class InvalidPersistentCombatStateError
  extends ApplicationError {
  public constructor(message: string) {
    super({
      code:
        COMBAT_SESSION_ERROR_CODE.invalidPersistentCombatState,
      message,
      statusCode: 500,
    });

    this.name =
      "InvalidPersistentCombatStateError";
  }
}
