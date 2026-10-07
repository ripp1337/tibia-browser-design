import {
  ApplicationError,
} from "../../../application/errors/application-error.js";

export class InvalidMonsterHttpRequestError
  extends ApplicationError
{
  public constructor(message: string) {
    super({
      code: "INVALID_HTTP_REQUEST",
      message,
      statusCode: 400,
    });

    this.name =
      "InvalidMonsterHttpRequestError";
  }
}

function parseRequiredPathValue(
  value: string | undefined,
  fieldName: string
): string {
  if (!value?.trim()) {
    throw new InvalidMonsterHttpRequestError(
      `${fieldName} is required.`
    );
  }

  return value;
}

export function parseMonsterCharacterId(
  value: string | undefined
): string {
  return parseRequiredPathValue(
    value,
    "characterId"
  );
}

export function parseMonsterCode(
  value: string | undefined
): string {
  return parseRequiredPathValue(
    value,
    "monsterCode"
  );
}
