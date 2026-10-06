import { describe, expect, it } from "vitest";

import {
  ApplicationError,
  isApplicationError,
} from "../../../src/application/errors/application-error.js";

describe("ApplicationError", () => {
  it("stores a stable code, message, status and details", () => {
    const error = new ApplicationError({
      code: "CHARACTER_NOT_FOUND",
      message: "Character was not found.",
      statusCode: 404,
      details: {
        characterId: "character-1",
      },
    });

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("ApplicationError");
    expect(error.code).toBe("CHARACTER_NOT_FOUND");
    expect(error.message).toBe("Character was not found.");
    expect(error.statusCode).toBe(404);
    expect(error.details).toEqual({
      characterId: "character-1",
    });
  });

  it("uses status 500 when no status is provided", () => {
    const error = new ApplicationError({
      code: "INTERNAL_ERROR",
      message: "Internal error.",
    });

    expect(error.statusCode).toBe(500);
  });

  it("preserves the original cause", () => {
    const cause = new Error("PostgreSQL failure");

    const error = new ApplicationError({
      code: "DATABASE_ERROR",
      message: "Database operation failed.",
      cause,
    });

    expect(error.cause).toBe(cause);
  });

  it("identifies application errors", () => {
    const applicationError = new ApplicationError({
      code: "TEST_ERROR",
      message: "Test error.",
    });

    expect(isApplicationError(applicationError)).toBe(true);
    expect(isApplicationError(new Error("Normal error"))).toBe(false);
    expect(isApplicationError(null)).toBe(false);
  });
});