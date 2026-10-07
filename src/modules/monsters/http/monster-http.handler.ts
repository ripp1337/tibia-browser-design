import type {
  IncomingMessage,
  ServerResponse,
} from "node:http";

import type {
  GetMonsterDetailsService,
} from "../application/get-monster-details.service.js";
import type {
  GetMonsterListService,
} from "../application/get-monster-list.service.js";
import {
  requireAuthentication,
  type AuthenticationProvider,
} from "../../../http/http-auth.js";
import {
  mapErrorToHttpResponse,
} from "../../../http/http-error.js";
import {
  sendJson,
} from "../../../http/http-json.js";
import {
  InvalidMonsterHttpRequestError,
  parseMonsterCharacterId,
  parseMonsterCode,
} from "./monster-http.request.js";

export type MonsterHttpHandlerDependencies = {
  authenticationProvider:
    AuthenticationProvider;

  getMonsterListService:
    GetMonsterListService;

  getMonsterDetailsService:
    GetMonsterDetailsService;
};

type MonsterRoute = {
  characterId: string;
  monsterCode: string | null;
};

function getPathname(
  request: IncomingMessage
): string {
  const requestUrl = new URL(
    request.url ?? "/",
    "http://localhost"
  );

  return requestUrl.pathname;
}

function decodePathSegment(
  value: string,
  fieldName: string
): string {
  try {
    return decodeURIComponent(value);
  } catch {
    throw new InvalidMonsterHttpRequestError(
      `${fieldName} contains invalid encoding.`
    );
  }
}

function parseMonsterRoute(
  pathname: string
): MonsterRoute | null {
  const detailsMatch =
    /^\/characters\/([^/]+)\/monsters\/([^/]+)$/u.exec(
      pathname
    );

  if (detailsMatch) {
    const characterId =
      parseMonsterCharacterId(
        decodePathSegment(
          detailsMatch[1] ?? "",
          "characterId"
        )
      );

    const monsterCode =
      parseMonsterCode(
        decodePathSegment(
          detailsMatch[2] ?? "",
          "monsterCode"
        )
      );

    return {
      characterId,
      monsterCode,
    };
  }

  const listMatch =
    /^\/characters\/([^/]+)\/monsters$/u.exec(
      pathname
    );

  if (listMatch) {
    return {
      characterId:
        parseMonsterCharacterId(
          decodePathSegment(
            listMatch[1] ?? "",
            "characterId"
          )
        ),

      monsterCode: null,
    };
  }

  return null;
}

export function createMonsterHttpHandler(
  dependencies:
    MonsterHttpHandlerDependencies
): (
  request: IncomingMessage,
  response: ServerResponse
) => Promise<void> {
  return async (
    request: IncomingMessage,
    response: ServerResponse
  ): Promise<void> => {
    try {
      const pathname =
        getPathname(request);

      const method =
        request.method ?? "GET";

      const route =
        parseMonsterRoute(pathname);

      if (
        method === "GET" &&
        route !== null
      ) {
        const authentication =
          await requireAuthentication(
            request,
            dependencies
              .authenticationProvider
          );

        if (route.monsterCode === null) {
          const monsters =
            await dependencies
              .getMonsterListService
              .execute({
                accountId:
                  authentication.accountId,

                characterId:
                  route.characterId,
              });

          sendJson(response, 200, {
            data: monsters,
          });

          return;
        }

        const monster =
          await dependencies
            .getMonsterDetailsService
            .execute({
              accountId:
                authentication.accountId,

              characterId:
                route.characterId,

              monsterCode:
                route.monsterCode,
            });

        sendJson(response, 200, {
          data: monster,
        });

        return;
      }

      sendJson(response, 404, {
        error: {
          code: "ROUTE_NOT_FOUND",
          message:
            "Route was not found.",
        },
      });
    } catch (error: unknown) {
      const mappedError =
        mapErrorToHttpResponse(error);

      sendJson(
        response,
        mappedError.statusCode,
        mappedError.body
      );
    }
  };
}
