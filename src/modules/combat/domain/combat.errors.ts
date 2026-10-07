import { ApplicationError } from "../../../application/errors/application-error.js";

export const COMBAT_ERROR_CODE = {
  invalidCombatState:
    "COMBAT_INVALID_STATE",
  combatAlreadyEnded:
    "COMBAT_ALREADY_ENDED",
  invalidRandomSource:
    "INVALID_RANDOM_SOURCE",
} as const;

export type CombatErrorCode =
  (typeof COMBAT_ERROR_CODE)[keyof typeof COMBAT_ERROR_CODE];

export class CombatInvalidStateError extends ApplicationError {
  public constructor(message: string) {
    super({
      code: COMBAT_ERROR_CODE.invalidCombatState,
      message,
      statusCode: 500,
    });

    this.name = "CombatInvalidStateError";
  }
}

export class CombatAlreadyEndedError extends ApplicationError {
  public constructor() {
    super({
      code: COMBAT_ERROR_CODE.combatAlreadyEnded,
      message: "Combat has already ended.",
      statusCode: 500,
    });

    this.name = "CombatAlreadyEndedError";
  }
}

export class InvalidRandomSourceError extends ApplicationError {
  public constructor(message: string) {
    super({
      code: COMBAT_ERROR_CODE.invalidRandomSource,
      message,
      statusCode: 500,
    });

    this.name = "InvalidRandomSourceError";
  }
}
