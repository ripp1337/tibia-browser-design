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
import {
  CombatSessionNotFoundError,
} from "../../../src/modules/combat/application/combat-session.errors.js";
import type {
  GetActiveCombatService,
} from "../../../src/modules/combat/application/get-active-combat.service.js";
import type {
  GetCombatLogService,
} from "../../../src/modules/combat/application/get-combat-log.service.js";
import type {
  GetCombatSessionService,
} from "../../../src/modules/combat/application/get-combat-session.service.js";
import type {
  ResolveCombatActionService,
} from "../../../src/modules/combat/application/resolve-combat-action.service.js";
import type {
  StartCombatService,
} from "../../../src/modules/combat/application/start-combat.service.js";
import {
  createCombatHttpHandler,
  type CombatHttpHandlerDependencies,
} from "../../../src/modules/combat/http/combat-http.handler.js";

const openedServers:
  ReturnType<typeof createServer>[] = [];

function createCombatView() {
  return {
    combatSessionId: "session-1",
    characterId: "character-1",
    monsterId: "monster-1",
    monsterCode: "dev_monster_01",
    status: "Active" as const,
    defeatReason: null,
    currentTurn: 1,
    player: {
      currentHealth: 100,
      maximumHealth: 100,
      attack: 20,
      defense: 10,
    },
    monster: {
      currentHealth: 80,
      maximumHealth: 80,
      attack: 15,
      defense: 8,
    },
    startedAt:
      new Date("2026-10-07T20:00:00.000Z"),
    endedAt: null,
    settledAt: null,
    events: [],
  };
}

function createDependencies() {
  const authenticationProvider:
    AuthenticationProvider = {
      authenticate:
        vi.fn().mockResolvedValue({
          accountId: "account-1",
        }),
    };

  const startExecute =
    vi.fn().mockResolvedValue(
      createCombatView()
    );

  const actionExecute =
    vi.fn().mockResolvedValue(
      createCombatView()
    );

  const activeExecute =
    vi.fn().mockResolvedValue(
      createCombatView()
    );

  const sessionExecute =
    vi.fn().mockResolvedValue(
      createCombatView()
    );

  const logExecute =
    vi.fn().mockResolvedValue({
      combatSessionId: "session-1",
      events: [],
    });

  const dependencies:
    CombatHttpHandlerDependencies = {
      authenticationProvider,

      startCombatService: {
        execute: startExecute,
      } as unknown as StartCombatService,

      resolveCombatActionService: {
        execute: actionExecute,
      } as unknown as ResolveCombatActionService,

      getActiveCombatService: {
        execute: activeExecute,
      } as unknown as GetActiveCombatService,

      getCombatSessionService: {
        execute: sessionExecute,
      } as unknown as GetCombatSessionService,

      getCombatLogService: {
        execute: logExecute,
      } as unknown as GetCombatLogService,
    };

  return {
    dependencies,
    authenticationProvider,
    startExecute,
    actionExecute,
    activeExecute,
    sessionExecute,
    logExecute,
  };
}

async function requestHandler(
  dependencies:
    CombatHttpHandlerDependencies,
  path: string,
  init?: RequestInit
): Promise<Response> {
  const handler =
    createCombatHttpHandler(
      dependencies
    );

  const server = createServer(
    (request, response) => {
      void handler(request, response);
    }
  );

  openedServers.push(server);

  await new Promise<void>(
    (resolve, reject) => {
      server.once("error", reject);

      server.listen(
        0,
        "127.0.0.1",
        resolve
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

function jsonRequest(
  method: string,
  body: unknown
): RequestInit {
  return {
    method,
    headers: {
      "content-type":
        "application/json",
    },
    body: JSON.stringify(body),
  };
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

describe("combat HTTP handler", () => {
  it("starts combat", async () => {
    const fixture =
      createDependencies();

    const response =
      await requestHandler(
        fixture.dependencies,
        "/characters/character-1/combat",
        jsonRequest("POST", {
          monsterCode:
            "dev_monster_01",
        })
      );

    expect(response.status).toBe(201);

    expect(
      fixture.startExecute
    ).toHaveBeenCalledWith({
      accountId: "account-1",
      characterId: "character-1",
      monsterCode: "dev_monster_01",
    });
  });

  it("retrieves active combat", async () => {
    const fixture =
      createDependencies();

    const response =
      await requestHandler(
        fixture.dependencies,
        "/characters/character-1/combat"
      );

    expect(response.status).toBe(200);

    expect(
      fixture.activeExecute
    ).toHaveBeenCalledWith({
      accountId: "account-1",
      characterId: "character-1",
    });
  });

  it("resolves a combat action", async () => {
    const fixture =
      createDependencies();

    const response =
      await requestHandler(
        fixture.dependencies,
        "/characters/character-1/combat/actions",
        jsonRequest("POST", {
          expectedTurn: 1,
          action: {
            type: "basic_attack",
          },
        })
      );

    expect(response.status).toBe(200);

    expect(
      fixture.actionExecute
    ).toHaveBeenCalledWith({
      accountId: "account-1",
      characterId: "character-1",
      expectedTurn: 1,
      action: {
        type: "basic_attack",
      },
    });

    expect(
      fixture.sessionExecute
    ).not.toHaveBeenCalled();
  });

  it("retrieves a specific session", async () => {
    const fixture =
      createDependencies();

    const response =
      await requestHandler(
        fixture.dependencies,
        "/characters/character-1/combat/session-1"
      );

    expect(response.status).toBe(200);

    expect(
      fixture.sessionExecute
    ).toHaveBeenCalledWith({
      accountId: "account-1",
      characterId: "character-1",
      combatSessionId: "session-1",
    });
  });

  it("retrieves a combat log", async () => {
    const fixture =
      createDependencies();

    const response =
      await requestHandler(
        fixture.dependencies,
        "/characters/character-1/combat/session-1/log"
      );

    expect(response.status).toBe(200);

    expect(
      fixture.logExecute
    ).toHaveBeenCalledWith({
      accountId: "account-1",
      characterId: "character-1",
      combatSessionId: "session-1",
    });
  });

  it("requires authentication", async () => {
    const fixture =
      createDependencies();

    vi.mocked(
      fixture.authenticationProvider
        .authenticate
    ).mockResolvedValue(null);

    const response =
      await requestHandler(
        fixture.dependencies,
        "/characters/character-1/combat"
      );

    expect(response.status).toBe(401);
  });

  it("maps unavailable sessions to 404", async () => {
    const fixture =
      createDependencies();

    fixture.sessionExecute
      .mockRejectedValue(
        new CombatSessionNotFoundError()
      );

    const response =
      await requestHandler(
        fixture.dependencies,
        "/characters/character-1/combat/missing"
      );

    expect(response.status).toBe(404);

    await expect(
      response.json()
    ).resolves.toMatchObject({
      error: {
        code:
          "COMBAT_SESSION_NOT_FOUND",
      },
    });
  });

  it("rejects malformed action requests", async () => {
    const fixture =
      createDependencies();

    const response =
      await requestHandler(
        fixture.dependencies,
        "/characters/character-1/combat/actions",
        jsonRequest("POST", {
          expectedTurn: 0,
          action: {
            type: "basic_attack",
          },
        })
      );

    expect(response.status).toBe(400);

    expect(
      fixture.actionExecute
    ).not.toHaveBeenCalled();
  });

  it("rejects malformed URL encoding", async () => {
    const fixture =
      createDependencies();

    const response =
      await requestHandler(
        fixture.dependencies,
        "/characters/%E0%A4%A/combat"
      );

    expect(response.status).toBe(400);
  });

  it("returns 404 for unsupported routes", async () => {
    const fixture =
      createDependencies();

    const response =
      await requestHandler(
        fixture.dependencies,
        "/characters/character-1/combat/session-1/extra"
      );

    expect(response.status).toBe(404);
  });
});
