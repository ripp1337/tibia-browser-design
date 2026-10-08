import {
  ApplicationError,
} from "../../../application/errors/application-error.js";
import {
  PLAYER_ACTION_TYPE,
} from "../domain/combat.constants.js";
import type {
  PlayerAction,
} from "../domain/combat.types.js";

export class InvalidCombatHttpRequestError
  extends ApplicationError
{
  public constructor(message: string) {
    super({
      code: "INVALID_HTTP_REQUEST",
      message,
      statusCode: 400,
    });

    this.name =
      "InvalidCombatHttpRequestError";
  }
}

export type StartCombatHttpRequest = {
  monsterCode: string;
};

export type CombatActionHttpRequest = {
  expectedTurn: number;
  action: PlayerAction;
};

function isObject(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function parseRequiredPathValue(
  value: string | undefined,
  fieldName: string
): string {
  if (!value?.trim()) {
    throw new InvalidCombatHttpRequestError(
      `${fieldName} is required.`
    );
  }

  return value;
}

export function parseCombatCharacterId(
  value: string | undefined
): string {
  return parseRequiredPathValue(
    value,
    "characterId"
  );
}

export function parseCombatSessionId(
  value: string | undefined
): string {
  return parseRequiredPathValue(
    value,
    "combatSessionId"
  );
}

export function parseStartCombatHttpRequest(
  body: unknown
): StartCombatHttpRequest {
  if (!isObject(body)) {
    throw new InvalidCombatHttpRequestError(
      "Request body must be a JSON object."
    );
  }

  if (
    typeof body.monsterCode !== "string" ||
    !body.monsterCode.trim()
  ) {
    throw new InvalidCombatHttpRequestError(
      "monsterCode must be a non-empty string."
    );
  }

  return {
    monsterCode: body.monsterCode,
  };
}

export function parseCombatActionHttpRequest(
  body: unknown
): CombatActionHttpRequest {
  if (!isObject(body)) {
    throw new InvalidCombatHttpRequestError(
      "Request body must be a JSON object."
    );
  }

  if (
    !Number.isSafeInteger(body.expectedTurn) ||
    Number(body.expectedTurn) < 1
  ) {
    throw new InvalidCombatHttpRequestError(
      "expectedTurn must be a positive safe integer."
    );
  }

  if (!isObject(body.action)) {
    throw new InvalidCombatHttpRequestError(
      "action must be a JSON object."
    );
  }

  const actionKeys =
    Object.keys(body.action);

  if (
    actionKeys.length !== 1 ||
    actionKeys[0] !== "type"
  ) {
    throw new InvalidCombatHttpRequestError(
      "action may contain only type."
    );
  }

  if (
    body.action.type !==
    PLAYER_ACTION_TYPE.basicAttack
  ) {
    throw new InvalidCombatHttpRequestError(
      "Only basic_attack is supported."
    );
  }

  return {
    expectedTurn:
      body.expectedTurn as number,
    action: {
      type:
        PLAYER_ACTION_TYPE.basicAttack,
    },
  };
}
