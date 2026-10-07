import { ApplicationError } from "../../../application/errors/application-error.js";

export const MONSTER_ERROR_CODE = {
  notFound: "MONSTER_NOT_FOUND",
} as const;

export type MonsterErrorCode =
  (typeof MONSTER_ERROR_CODE)[keyof typeof MONSTER_ERROR_CODE];

export class MonsterNotFoundError extends ApplicationError {
  public constructor() {
    super({
      code: MONSTER_ERROR_CODE.notFound,
      message: "Monster was not found.",
      statusCode: 404,
    });

    this.name = "MonsterNotFoundError";
  }
}
