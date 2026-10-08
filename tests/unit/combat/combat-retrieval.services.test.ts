import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  CombatSessionNotFoundError,
} from "../../../src/modules/combat/application/combat-session.errors.js";
import type {
  CombatSessionRepository,
} from "../../../src/modules/combat/application/combat-session.repository.js";
import {
  GetActiveCombatService,
} from "../../../src/modules/combat/application/get-active-combat.service.js";
import {
  GetCombatLogService,
} from "../../../src/modules/combat/application/get-combat-log.service.js";
import {
  GetCombatSessionService,
} from "../../../src/modules/combat/application/get-combat-session.service.js";

function createSession() {
  return {
    combatSessionId: "session-1",
    characterId: "character-1",
    monsterId: "monster-1",
    monsterCode: "test_monster",
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
  };
}

function createRepository() {
  return {
    withStartTransaction: vi.fn(),
    withActionTransaction: vi.fn(),
    findActiveSession: vi.fn(),
    findSession: vi.fn(),
    findEventLog: vi.fn(),
  } as unknown as CombatSessionRepository;
}

const activeInput = {
  accountId: "account-1",
  characterId: "character-1",
};

const sessionInput = {
  ...activeInput,
  combatSessionId: "session-1",
};

describe("Combat retrieval services", () => {
  it("returns the active session with no operation events", async () => {
    const repository = createRepository();

    vi.mocked(
      repository.findActiveSession
    ).mockResolvedValue(createSession());

    const service =
      new GetActiveCombatService(repository);

    await expect(
      service.execute(activeInput)
    ).resolves.toEqual({
      ...createSession(),
      events: [],
    });

    expect(
      repository.findActiveSession
    ).toHaveBeenCalledWith(activeInput);
  });

  it("rejects when no active session exists", async () => {
    const repository = createRepository();

    vi.mocked(
      repository.findActiveSession
    ).mockResolvedValue(null);

    const service =
      new GetActiveCombatService(repository);

    await expect(
      service.execute(activeInput)
    ).rejects.toBeInstanceOf(
      CombatSessionNotFoundError
    );
  });

  it("returns a specific owned session", async () => {
    const repository = createRepository();

    vi.mocked(
      repository.findSession
    ).mockResolvedValue(createSession());

    const service =
      new GetCombatSessionService(repository);

    await expect(
      service.execute(sessionInput)
    ).resolves.toEqual({
      ...createSession(),
      events: [],
    });

    expect(
      repository.findSession
    ).toHaveBeenCalledWith(sessionInput);
  });

  it("does not expose an unavailable session", async () => {
    const repository = createRepository();

    vi.mocked(
      repository.findSession
    ).mockResolvedValue(null);

    const service =
      new GetCombatSessionService(repository);

    await expect(
      service.execute(sessionInput)
    ).rejects.toBeInstanceOf(
      CombatSessionNotFoundError
    );
  });

  it("returns the ordered persistent event log", async () => {
    const repository = createRepository();

    const log = {
      combatSessionId: "session-1",
      events: [],
    };

    vi.mocked(
      repository.findEventLog
    ).mockResolvedValue(log);

    const service =
      new GetCombatLogService(repository);

    await expect(
      service.execute(sessionInput)
    ).resolves.toBe(log);

    expect(
      repository.findEventLog
    ).toHaveBeenCalledWith(sessionInput);
  });

  it("rejects a log for an unavailable session", async () => {
    const repository = createRepository();

    vi.mocked(
      repository.findEventLog
    ).mockResolvedValue(null);

    const service =
      new GetCombatLogService(repository);

    await expect(
      service.execute(sessionInput)
    ).rejects.toBeInstanceOf(
      CombatSessionNotFoundError
    );
  });
});
