import {
  createServer,
} from "node:http";
import type {
  AddressInfo,
} from "node:net";

import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  AuthenticationProvider,
} from "../../../src/http/http-auth.js";
import { CharacterNotFoundError } from "../../../src/modules/characters/domain/character.errors.js";
import type {
  GetMonsterDetailsService,
} from "../../../src/modules/monsters/application/get-monster-details.service.js";
import type {
  GetMonsterListService,
} from "../../../src/modules/monsters/application/get-monster-list.service.js";
import { MonsterNotFoundError } from "../../../src/modules/monsters/domain/monster.errors.js";
import {
  createMonsterHttpHandler,
  type MonsterHttpHandlerDependencies,
} from "../../../src/modules/monsters/http/monster-http.handler.js";

const openedServers:
  ReturnType<typeof createServer>[] = [];

function createMonster() {
  return {
    code: "dev_monster_01",
    name: "Dev Monster 1",
    level: 1,
    monsterType: "Normal" as const,
    energyCost: 0,

    eligibility: {
      isEligible: true,
      reasons: [],
    },

    cooldown: {
      isActive: false,
      availableAt: null,
    },

    bestiaryVisible: false,
  };
}

function createDependencies(): {
  dependencies:
    MonsterHttpHandlerDependencies;

  authenticationProvider:
    AuthenticationProvider;

  listExecute:
    ReturnType<typeof vi.fn>;

  detailsExecute:
    ReturnType<typeof vi.fn>;
} {
  const authenticationProvider:
    AuthenticationProvider = {
      authenticate:
        vi.fn().mockResolvedValue({
          accountId: "account-1",
        }),
    };

  const listExecute =
    vi.fn().mockResolvedValue([
      createMonster(),
    ]);

  const detailsExecute =
    vi.fn().mockResolvedValue({
      ...createMonster(),
      description:
        "Synthetic development monster.",
    });

  return {
    authenticationProvider,
    listExecute,
    detailsExecute,

    dependencies: {
      authenticationProvider,

      getMonsterListService: {
        execute: listExecute,
      } as unknown as
        GetMonsterListService,

      getMonsterDetailsService: {
        execute: detailsExecute,
      } as unknown as
        GetMonsterDetailsService,
    },
  };
}

async function requestHandler(
  dependencies:
    MonsterHttpHandlerDependencies,

  path: string,
  init?: RequestInit
): Promise<Response> {
  const handler =
    createMonsterHttpHandler(
      dependencies
    );

  const server = createServer(
    (request, response) => {
      void handler(
        request,
        response
      );
    }
  );

  openedServers.push(server);

  await new Promise<void>(
    (resolve, reject) => {
      server.once("error", reject);

      server.listen(
        0,
        "127.0.0.1",
        () => resolve()
      );
    }
  );

  const address =
    server.address() as AddressInfo;

  return fetch(
    `http://127.0.0.1:${address.port}${path}`,
    init
  );
}

afterEach(async () => {
  while (openedServers.length > 0) {
    const server =
      openedServers.pop();

    if (server) {
      await new Promise<void>(
        (resolve, reject) => {
          server.close((error) => {
            if (error) {
              reject(error);
              return;
            }

            resolve();
          });
        }
      );
    }
  }
});

describe("monster HTTP handler", () => {
  it("returns the monster list", async () => {
    const {
      dependencies,
      listExecute,
    } = createDependencies();

    const response =
      await requestHandler(
        dependencies,
        "/characters/character-1/monsters"
      );

    expect(response.status).toBe(200);

    await expect(
      response.json()
    ).resolves.toEqual({
      data: [createMonster()],
    });

    expect(
      listExecute
    ).toHaveBeenCalledWith({
      accountId: "account-1",
      characterId: "character-1",
    });
  });

  it("returns monster details by stable code", async () => {
    const {
      dependencies,
      detailsExecute,
    } = createDependencies();

    const response =
      await requestHandler(
        dependencies,
        "/characters/character-1/monsters/dev_monster_01"
      );

    expect(response.status).toBe(200);

    expect(
      detailsExecute
    ).toHaveBeenCalledWith({
      accountId: "account-1",
      characterId: "character-1",
      monsterCode:
        "dev_monster_01",
    });
  });

  it("requires authentication", async () => {
    const {
      dependencies,
      authenticationProvider,
    } = createDependencies();

    vi.mocked(
      authenticationProvider.authenticate
    ).mockResolvedValue(null);

    const response =
      await requestHandler(
        dependencies,
        "/characters/character-1/monsters"
      );

    expect(response.status).toBe(401);

    await expect(
      response.json()
    ).resolves.toEqual({
      error: {
        code:
          "AUTHENTICATION_REQUIRED",

        message:
          "Authentication is required.",
      },
    });
  });

  it("maps unknown monster errors", async () => {
    const {
      dependencies,
      detailsExecute,
    } = createDependencies();

    detailsExecute.mockRejectedValue(
      new MonsterNotFoundError()
    );

    const response =
      await requestHandler(
        dependencies,
        "/characters/character-1/monsters/unknown"
      );

    expect(response.status).toBe(404);

    await expect(
      response.json()
    ).resolves.toMatchObject({
      error: {
        code: "MONSTER_NOT_FOUND",
      },
    });
  });

  it("does not expose foreign characters", async () => {
    const {
      dependencies,
      listExecute,
    } = createDependencies();

    listExecute.mockRejectedValue(
      new CharacterNotFoundError()
    );

    const response =
      await requestHandler(
        dependencies,
        "/characters/foreign/monsters"
      );

    expect(response.status).toBe(404);

    await expect(
      response.json()
    ).resolves.toMatchObject({
      error: {
        code: "CHARACTER_NOT_FOUND",
      },
    });
  });

  it("rejects malformed URL encoding", async () => {
    const {
      dependencies,
    } = createDependencies();

    const response =
      await requestHandler(
        dependencies,
        "/characters/%E0%A4%A/monsters"
      );

    expect(response.status).toBe(400);

    await expect(
      response.json()
    ).resolves.toMatchObject({
      error: {
        code: "INVALID_HTTP_REQUEST",
      },
    });
  });

  it("returns 404 for unsupported routes", async () => {
    const {
      dependencies,
    } = createDependencies();

    const response =
      await requestHandler(
        dependencies,
        "/characters/character-1/monsters/dev_monster_01/extra"
      );

    expect(response.status).toBe(404);

    await expect(
      response.json()
    ).resolves.toEqual({
      error: {
        code: "ROUTE_NOT_FOUND",
        message:
          "Route was not found.",
      },
    });
  });
});
