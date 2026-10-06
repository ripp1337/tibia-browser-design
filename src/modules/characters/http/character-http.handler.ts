import type {
  IncomingMessage,
  ServerResponse,
} from "node:http";

import type {
  ArchiveCharacterService,
} from "../application/archive-character.service.js";
import type {
  CreateCharacterService,
} from "../application/create-character.service.js";
import type {
  GetCharacterSnapshotService,
} from "../application/get-character-snapshot.service.js";
import type {
  ListCharactersService,
} from "../application/list-characters.service.js";
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
import {
  InvalidHttpRequestError,
  parseCharacterId,
  parseCreateCharacterHttpRequest,
} from "./character-http.request.js";

export type CharacterHttpHandlerDependencies = {
  authenticationProvider: AuthenticationProvider;
  createCharacterService: CreateCharacterService;
  listCharactersService: ListCharactersService;
  getCharacterSnapshotService:
    GetCharacterSnapshotService;
  archiveCharacterService: ArchiveCharacterService;
};

function getPathname(request: IncomingMessage): string {
  const requestUrl = new URL(
    request.url ?? "/",
    "http://localhost"
  );

  return requestUrl.pathname;
}

function getCharacterRouteId(
  pathname: string,
  suffix = ""
): string | null {
  const escapedSuffix = suffix.replace(
    /[.*+?^${}()|[\]\\]/gu,
    "\\$&"
  );

  const pattern = new RegExp(
    `^/characters/([^/]+)${escapedSuffix}$`,
    "u"
  );

  const match = pattern.exec(pathname);

  if (!match) {
    return null;
  }

  try {
    return parseCharacterId(
      decodeURIComponent(match[1] ?? "")
    );
  } catch (error: unknown) {
    if (error instanceof InvalidHttpRequestError) {
      throw error;
    }

    throw new InvalidHttpRequestError(
      "characterId contains invalid encoding."
    );
  }
}

export function createCharacterHttpHandler(
  dependencies: CharacterHttpHandlerDependencies
): (
  request: IncomingMessage,
  response: ServerResponse
) => Promise<void> {
  return async (
    request: IncomingMessage,
    response: ServerResponse
  ): Promise<void> => {
    try {
      const pathname = getPathname(request);
      const method = request.method ?? "GET";

      if (
        method === "POST" &&
        pathname === "/characters"
      ) {
        const authentication =
          await requireAuthentication(
            request,
            dependencies.authenticationProvider
          );

        const body = await readJsonBody(request);

        const parsedRequest =
          parseCreateCharacterHttpRequest(body);

        const character =
          await dependencies.createCharacterService.execute({
            accountId: authentication.accountId,
            seasonId: parsedRequest.seasonId,
            name: parsedRequest.name,
          });

        sendJson(response, 201, {
          data: character,
        });

        return;
      }

      if (
        method === "GET" &&
        pathname === "/characters"
      ) {
        const authentication =
          await requireAuthentication(
            request,
            dependencies.authenticationProvider
          );

        const characters =
          await dependencies.listCharactersService.execute({
            accountId: authentication.accountId,
          });

        sendJson(response, 200, {
          data: characters,
        });

        return;
      }

      const snapshotCharacterId =
        getCharacterRouteId(pathname);

      if (
        method === "GET" &&
        snapshotCharacterId !== null
      ) {
        const authentication =
          await requireAuthentication(
            request,
            dependencies.authenticationProvider
          );

        const character =
          await dependencies.getCharacterSnapshotService.execute({
            accountId: authentication.accountId,
            characterId: snapshotCharacterId,
          });

        sendJson(response, 200, {
          data: character,
        });

        return;
      }

      const archiveCharacterId =
        getCharacterRouteId(pathname, "/archive");

      if (
        method === "POST" &&
        archiveCharacterId !== null
      ) {
        const authentication =
          await requireAuthentication(
            request,
            dependencies.authenticationProvider
          );

        const character =
          await dependencies.archiveCharacterService.execute({
            accountId: authentication.accountId,
            characterId: archiveCharacterId,
          });

        sendJson(response, 200, {
          data: character,
        });

        return;
      }

      sendJson(response, 404, {
        error: {
          code: "ROUTE_NOT_FOUND",
          message: "Route was not found.",
        },
      });
    } catch (error: unknown) {
      const mappedError = mapErrorToHttpResponse(error);

      sendJson(
        response,
        mappedError.statusCode,
        mappedError.body
      );
    }
  };
}