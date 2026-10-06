import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type { AuthenticationProvider } from "../../../src/http/http-auth.js";
import type { ArchiveCharacterService } from "../../../src/modules/characters/application/archive-character.service.js";
import type { CreateCharacterService } from "../../../src/modules/characters/application/create-character.service.js";
import type { GetCharacterSnapshotService } from "../../../src/modules/characters/application/get-character-snapshot.service.js";
import type { ListCharactersService } from "../../../src/modules/characters/application/list-characters.service.js";
import {
  createCharacterHttpHandler,
  type CharacterHttpHandlerDependencies,
} from "../../../src/modules/characters/http/character-http.handler.js";
import type {
  CharacterSnapshot,
  CharacterSummary,
} from "../../../src/modules/characters/domain/character.types.js";

const openedServers: ReturnType<typeof createServer>[] = [];

function createSummary(): CharacterSummary {
  const now = new Date("2026-10-06T12:00:00.000Z");

  return {
    characterId: "character-1",
    accountId: "account-1",
    seasonId: null,
    name: "HTTP Hero",
    status: "IsActive",
    level: 1,
    experience: 0n,
    createdAt: now,
    updatedAt: now,
  };
}

function createSnapshot(): CharacterSnapshot {
  const now = new Date("2026-10-06T12:00:00.000Z");

  return {
    characterId: "character-1",
    accountId: "account-1",
    seasonId: null,
    name: "HTTP Hero",
    status: "IsActive",

    progression: {
      level: 1,
      experience: 0n,
      gold: 0n,
      craftingLevel: 1,
      craftingExperience: 0n,
      gatheringLevel: 1,
      gatheringExperience: 0n,
    },

    resources: {
      currentHealth: 180,
      maximumHealth: 180,
      currentMana: 35,
      maximumMana: 35,
      currentEnergy: 100,
      maximumEnergy: 100,
      resourcesUpdatedAt: now,
    },

    baseStatistics: {
      attack: 7,
      defense: 7,
      spellPowerPercent: 100,
    },

    unlocks: {
      promoted: false,
      spellSlots: 1,
      craftingSlots: 1,
      inventorySlots: 50,
    },

    createdAt: now,
    updatedAt: now,
  };
}

function createDependencies(): {
  dependencies: CharacterHttpHandlerDependencies;
  authenticationProvider: AuthenticationProvider;
  createCharacterExecute: ReturnType<typeof vi.fn>;
  listCharactersExecute: ReturnType<typeof vi.fn>;
  getSnapshotExecute: ReturnType<typeof vi.fn>;
  archiveCharacterExecute: ReturnType<typeof vi.fn>;
} {
  const authenticationProvider: AuthenticationProvider = {
    authenticate: vi.fn().mockResolvedValue({
      accountId: "account-1",
    }),
  };

  const createCharacterExecute = vi.fn().mockResolvedValue(
    createSnapshot()
  );

  const listCharactersExecute = vi.fn().mockResolvedValue([
    createSummary(),
  ]);

  const getSnapshotExecute = vi.fn().mockResolvedValue(
    createSnapshot()
  );

  const archiveCharacterExecute = vi.fn().mockResolvedValue({
    ...createSummary(),
    status: "Archived",
  });

  return {
    authenticationProvider,
    createCharacterExecute,
    listCharactersExecute,
    getSnapshotExecute,
    archiveCharacterExecute,

    dependencies: {
      authenticationProvider,

      createCharacterService: {
        execute: createCharacterExecute,
      } as unknown as CreateCharacterService,

      listCharactersService: {
        execute: listCharactersExecute,
      } as unknown as ListCharactersService,

      getCharacterSnapshotService: {
        execute: getSnapshotExecute,
      } as unknown as GetCharacterSnapshotService,

      archiveCharacterService: {
        execute: archiveCharacterExecute,
      } as unknown as ArchiveCharacterService,
    },
  };
}

async function requestHandler(
  dependencies: CharacterHttpHandlerDependencies,
  path: string,
  init?: RequestInit
): Promise<Response> {
  const handler = createCharacterHttpHandler(dependencies);

  const server = createServer((request, response) => {
    void handler(request, response);
  });

  openedServers.push(server);

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);

    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });

  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("Test HTTP server has no TCP address.");
  }

  const port = (address as AddressInfo).port;

  return fetch(
    `http://127.0.0.1:${port}${path}`,
    init
  );
}

afterEach(async () => {
  vi.restoreAllMocks();

  while (openedServers.length > 0) {
    const server = openedServers.pop();

    if (server?.listening) {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    }
  }
});

describe("character HTTP handler", () => {
  it("creates a character", async () => {
    const setup = createDependencies();

    const response = await requestHandler(
      setup.dependencies,
      "/characters",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: "HTTP Hero",
          seasonId: null,
        }),
      }
    );

    expect(response.status).toBe(201);

    expect(await response.json()).toMatchObject({
      data: {
        characterId: "character-1",
        name: "HTTP Hero",
        progression: {
          experience: "0",
        },
      },
    });

    expect(
      setup.createCharacterExecute
    ).toHaveBeenCalledWith({
      accountId: "account-1",
      name: "HTTP Hero",
      seasonId: null,
    });
  });

  it("lists characters", async () => {
    const setup = createDependencies();

    const response = await requestHandler(
      setup.dependencies,
      "/characters"
    );

    expect(response.status).toBe(200);

    expect(await response.json()).toEqual({
      data: [
        expect.objectContaining({
          characterId: "character-1",
          experience: "0",
        }),
      ],
    });

    expect(
      setup.listCharactersExecute
    ).toHaveBeenCalledWith({
      accountId: "account-1",
    });
  });

  it("returns a character snapshot", async () => {
    const setup = createDependencies();

    const response = await requestHandler(
      setup.dependencies,
      "/characters/character-1"
    );

    expect(response.status).toBe(200);

    expect(await response.json()).toMatchObject({
      data: {
        characterId: "character-1",
        name: "HTTP Hero",
      },
    });

    expect(
      setup.getSnapshotExecute
    ).toHaveBeenCalledWith({
      accountId: "account-1",
      characterId: "character-1",
    });
  });

  it("archives a character", async () => {
    const setup = createDependencies();

    const response = await requestHandler(
      setup.dependencies,
      "/characters/character-1/archive",
      {
        method: "POST",
      }
    );

    expect(response.status).toBe(200);

    expect(await response.json()).toMatchObject({
      data: {
        characterId: "character-1",
        status: "Archived",
      },
    });

    expect(
      setup.archiveCharacterExecute
    ).toHaveBeenCalledWith({
      accountId: "account-1",
      characterId: "character-1",
    });
  });

  it("returns status 401 when authentication is missing", async () => {
    const setup = createDependencies();

    vi.mocked(
      setup.authenticationProvider.authenticate
    ).mockResolvedValue(null);

    const response = await requestHandler(
      setup.dependencies,
      "/characters"
    );

    expect(response.status).toBe(401);

    expect(await response.json()).toEqual({
      error: {
        code: "AUTHENTICATION_REQUIRED",
        message: "Authentication is required.",
      },
    });
  });

  it("returns status 400 for malformed JSON", async () => {
    const setup = createDependencies();

    const response = await requestHandler(
      setup.dependencies,
      "/characters",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: '{"name":',
      }
    );

    expect(response.status).toBe(400);

    expect(await response.json()).toMatchObject({
      error: {
        code: "INVALID_JSON_BODY",
      },
    });

    expect(
      setup.createCharacterExecute
    ).not.toHaveBeenCalled();
  });

  it("returns status 404 for an unknown route", async () => {
    const setup = createDependencies();

    const response = await requestHandler(
      setup.dependencies,
      "/unknown"
    );

    expect(response.status).toBe(404);

    expect(await response.json()).toEqual({
      error: {
        code: "ROUTE_NOT_FOUND",
        message: "Route was not found.",
      },
    });
  });
});