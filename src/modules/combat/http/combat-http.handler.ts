import type {
  IncomingMessage,
  ServerResponse,
} from "node:http";

import {
  requireAuthentication,
  type AuthenticationProvider,
} from "../../../http/http-auth.js";
import {
  mapErrorToHttpResponse,
} from "../../../http/http-error.js";
import {
  readJsonBody,
  sendJson,
} from "../../../http/http-json.js";
import type {
  GetActiveCombatService,
} from "../application/get-active-combat.service.js";
import type {
  GetCombatLogService,
} from "../application/get-combat-log.service.js";
import type {
  GetCombatSessionService,
} from "../application/get-combat-session.service.js";
import type {
  ResolveCombatActionService,
} from "../application/resolve-combat-action.service.js";
import type {
  StartCombatService,
} from "../application/start-combat.service.js";
import {
  InvalidCombatHttpRequestError,
  parseCombatActionHttpRequest,
  parseCombatCharacterId,
  parseCombatSessionId,
  parseStartCombatHttpRequest,
} from "./combat-http.request.js";

export type CombatHttpHandlerDependencies = {
  authenticationProvider:
    AuthenticationProvider;
  startCombatService:
    StartCombatService;
  resolveCombatActionService:
    ResolveCombatActionService;
  getActiveCombatService:
    GetActiveCombatService;
  getCombatSessionService:
    GetCombatSessionService;
  getCombatLogService:
    GetCombatLogService;
};

type CombatRoute =
  | {
      type: "active";
      characterId: string;
    }
  | {
      type: "actions";
      characterId: string;
    }
  | {
      type: "session";
      characterId: string;
      combatSessionId: string;
    }
  | {
      type: "log";
      characterId: string;
      combatSessionId: string;
    };

function getPathname(
  request: IncomingMessage
): string {
  return new URL(
    request.url ?? "/",
    "http://localhost"
  ).pathname;
}

function decodePathSegment(
  value: string,
  fieldName: string
): string {
  try {
    return decodeURIComponent(value);
  } catch {
    throw new InvalidCombatHttpRequestError(
      `${fieldName} contains invalid encoding.`
    );
  }
}

function parseCombatRoute(
  pathname: string
): CombatRoute | null {
  const logMatch =
    /^\/characters\/([^/]+)\/combat\/([^/]+)\/log$/u.exec(
      pathname
    );

  if (logMatch) {
    return {
      type: "log",
      characterId:
        parseCombatCharacterId(
          decodePathSegment(
            logMatch[1] ?? "",
            "characterId"
          )
        ),
      combatSessionId:
        parseCombatSessionId(
          decodePathSegment(
            logMatch[2] ?? "",
            "combatSessionId"
          )
        ),
    };
  }

  const actionsMatch =
    /^\/characters\/([^/]+)\/combat\/actions$/u.exec(
      pathname
    );

  if (actionsMatch) {
    return {
      type: "actions",
      characterId:
        parseCombatCharacterId(
          decodePathSegment(
            actionsMatch[1] ?? "",
            "characterId"
          )
        ),
    };
  }

  const sessionMatch =
    /^\/characters\/([^/]+)\/combat\/([^/]+)$/u.exec(
      pathname
    );

  if (sessionMatch) {
    return {
      type: "session",
      characterId:
        parseCombatCharacterId(
          decodePathSegment(
            sessionMatch[1] ?? "",
            "characterId"
          )
        ),
      combatSessionId:
        parseCombatSessionId(
          decodePathSegment(
            sessionMatch[2] ?? "",
            "combatSessionId"
          )
        ),
    };
  }

  const activeMatch =
    /^\/characters\/([^/]+)\/combat$/u.exec(
      pathname
    );

  if (activeMatch) {
    return {
      type: "active",
      characterId:
        parseCombatCharacterId(
          decodePathSegment(
            activeMatch[1] ?? "",
            "characterId"
          )
        ),
    };
  }

  return null;
}

export function createCombatHttpHandler(
  dependencies:
    CombatHttpHandlerDependencies
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
        parseCombatRoute(pathname);

      if (route === null) {
        sendJson(response, 404, {
          error: {
            code: "ROUTE_NOT_FOUND",
            message:
              "Route was not found.",
          },
        });

        return;
      }

      const authentication =
        await requireAuthentication(
          request,
          dependencies.authenticationProvider
        );

      if (
        method === "POST" &&
        route.type === "active"
      ) {
        const body =
          await readJsonBody(request);
        const parsed =
          parseStartCombatHttpRequest(body);

        const combat =
          await dependencies
            .startCombatService
            .execute({
              accountId:
                authentication.accountId,
              characterId:
                route.characterId,
              monsterCode:
                parsed.monsterCode,
            });

        sendJson(response, 201, {
          data: combat,
        });

        return;
      }

      if (
        method === "GET" &&
        route.type === "active"
      ) {
        const combat =
          await dependencies
            .getActiveCombatService
            .execute({
              accountId:
                authentication.accountId,
              characterId:
                route.characterId,
            });

        sendJson(response, 200, {
          data: combat,
        });

        return;
      }

      if (
        method === "POST" &&
        route.type === "actions"
      ) {
        const body =
          await readJsonBody(request);
        const parsed =
          parseCombatActionHttpRequest(
            body
          );

        const combat =
          await dependencies
            .resolveCombatActionService
            .execute({
              accountId:
                authentication.accountId,
              characterId:
                route.characterId,
              expectedTurn:
                parsed.expectedTurn,
              action:
                parsed.action,
            });

        sendJson(response, 200, {
          data: combat,
        });

        return;
      }

      if (
        method === "GET" &&
        route.type === "session"
      ) {
        const combat =
          await dependencies
            .getCombatSessionService
            .execute({
              accountId:
                authentication.accountId,
              characterId:
                route.characterId,
              combatSessionId:
                route.combatSessionId,
            });

        sendJson(response, 200, {
          data: combat,
        });

        return;
      }

      if (
        method === "GET" &&
        route.type === "log"
      ) {
        const log =
          await dependencies
            .getCombatLogService
            .execute({
              accountId:
                authentication.accountId,
              characterId:
                route.characterId,
              combatSessionId:
                route.combatSessionId,
            });

        sendJson(response, 200, {
          data: log,
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
