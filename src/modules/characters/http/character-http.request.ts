import {
  ApplicationError,
} from "../../../application/errors/application-error.js";
import type {
  SeasonId,
} from "../domain/character.types.js";

export type CreateCharacterHttpRequest = {
  name: unknown;
  seasonId: SeasonId | null;
};

export class InvalidHttpRequestError
  extends ApplicationError
{
  public constructor(message: string) {
    super({
      code: "INVALID_HTTP_REQUEST",
      message,
      statusCode: 400,
    });

    this.name = "InvalidHttpRequestError";
  }
}

function isObject(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

export function parseCreateCharacterHttpRequest(
  body: unknown
): CreateCharacterHttpRequest {
  if (!isObject(body)) {
    throw new InvalidHttpRequestError(
      "Request body must be a JSON object."
    );
  }

  if (!Object.hasOwn(body, "name")) {
    throw new InvalidHttpRequestError(
      "Request body must contain name."
    );
  }

  const seasonId = body.seasonId ?? null;

  if (
    seasonId !== null &&
    typeof seasonId !== "string"
  ) {
    throw new InvalidHttpRequestError(
      "seasonId must be a string or null."
    );
  }

  if (
    typeof seasonId === "string" &&
    !seasonId.trim()
  ) {
    throw new InvalidHttpRequestError(
      "seasonId cannot be empty."
    );
  }

  return {
    name: body.name,
    seasonId,
  };
}

export function parseCharacterId(
  value: string | undefined
): string {
  if (!value?.trim()) {
    throw new InvalidHttpRequestError(
      "characterId is required."
    );
  }

  return value;
}