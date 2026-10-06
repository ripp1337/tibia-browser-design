import {
  describe,
  expect,
  it,
} from "vitest";

import {
  ApplicationError,
} from "../../../src/application/errors/application-error.js";
import {
  mapErrorToHttpResponse,
} from "../../../src/http/http-error.js";
import {
  InvalidJsonBodyError,
  RequestBodyTooLargeError,
} from "../../../src/http/http-json.js";

describe("mapErrorToHttpResponse", () => {
  it("maps an application error", () => {
    const error = new ApplicationError({
      code: "TEST_ERROR",
      message: "Test failed.",
      statusCode: 409,
      details: {
        reason: "conflict",
      },
    });

    expect(
      mapErrorToHttpResponse(error)
    ).toEqual({
      statusCode: 409,
      body: {
        error: {
          code: "TEST_ERROR",
          message: "Test failed.",
          details: {
            reason: "conflict",
          },
        },
      },
    });
  });

  it("omits details when they are not defined", () => {
    const error = new ApplicationError({
      code: "NOT_FOUND",
      message: "Resource was not found.",
      statusCode: 404,
    });

    expect(
      mapErrorToHttpResponse(error)
    ).toEqual({
      statusCode: 404,
      body: {
        error: {
          code: "NOT_FOUND",
          message: "Resource was not found.",
        },
      },
    });
  });

  it("maps malformed JSON to status 400", () => {
    expect(
      mapErrorToHttpResponse(
        new InvalidJsonBodyError()
      )
    ).toEqual({
      statusCode: 400,
      body: {
        error: {
          code: "INVALID_JSON_BODY",
          message:
            "Request body must contain valid JSON.",
        },
      },
    });
  });

  it("maps an oversized body to status 413", () => {
    expect(
      mapErrorToHttpResponse(
        new RequestBodyTooLargeError(1024)
      )
    ).toEqual({
      statusCode: 413,
      body: {
        error: {
          code: "REQUEST_BODY_TOO_LARGE",
          message:
            "Request body cannot exceed 1024 bytes.",
          details: {
            maximumBodyBytes: 1024,
          },
        },
      },
    });
  });

  it("does not expose unexpected error details", () => {
    expect(
      mapErrorToHttpResponse(
        new Error("Database password leaked")
      )
    ).toEqual({
      statusCode: 500,
      body: {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred.",
        },
      },
    });
  });
});