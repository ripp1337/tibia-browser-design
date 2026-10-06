import {
  ApplicationError,
} from "../application/errors/application-error.js";
import {
  InvalidJsonBodyError,
  RequestBodyTooLargeError,
} from "./http-json.js";

export type HttpErrorResponse = {
  statusCode: number;
  body: {
    error: {
      code: string;
      message: string;
      details?: unknown;
    };
  };
};

export function mapErrorToHttpResponse(
  error: unknown
): HttpErrorResponse {
  if (error instanceof ApplicationError) {
    return {
      statusCode: error.statusCode,
      body: {
        error: {
          code: error.code,
          message: error.message,
          ...(error.details !== undefined
            ? {
                details: error.details,
              }
            : {}),
        },
      },
    };
  }

  if (error instanceof InvalidJsonBodyError) {
    return {
      statusCode: 400,
      body: {
        error: {
          code: "INVALID_JSON_BODY",
          message: error.message,
        },
      },
    };
  }

  if (error instanceof RequestBodyTooLargeError) {
    return {
      statusCode: 413,
      body: {
        error: {
          code: "REQUEST_BODY_TOO_LARGE",
          message: error.message,
          details: {
            maximumBodyBytes: error.maximumBodyBytes,
          },
        },
      },
    };
  }

  return {
    statusCode: 500,
    body: {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred.",
      },
    },
  };
}