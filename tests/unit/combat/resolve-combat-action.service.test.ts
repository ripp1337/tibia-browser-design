import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  Clock,
} from "../../../src/application/ports/clock.js";
import {
  CombatTurnMismatchError,
} from "../../../src/modules/combat/application/combat-session.errors.js";
import {
  PERSISTENT_COMBAT_STATUS,
} from "../../../src/modules/combat/application/combat-session.models.js";
import type {
  CombatActionTransaction,
  CombatSessionRepository,
} from "../../../src/modules/combat/application/combat-session.repository.js";
import {
  ResolveCombatActionService,
} from "../../../src/modules/combat/application/resolve-combat-action.service.js";
import {
  COMBAT_DEFEAT_REASON,
  COMBAT_EVENT_TYPE,
  COMBAT_STATUS,
  PLAYER_ACTION_TYPE,
} from "../../../src/modules/combat/domain/combat.constants.js";
import type {
  CombatState,
} from "../../../src/modules/combat/domain/combat.types.js";
import type {
  RandomSource,
} from "../../../src/modules/combat/ports/random-source.js";

const observedAt = new Date(
  "2026-10-07T20:00:00.000Z"
);

function createState(
  overrides: Partial<CombatState> = {}
): CombatState {
  return {
    player: {
      currentHealth: 100,
      maximumHealth: 100,
      attack: 20,
      defense: 10,
    },
    monster: {
      currentHealth: 100,
      maximumHealth: 100,
      attack: 15,
      defense: 5,
    },
    turn: 1,
    status: COMBAT_STATUS.inProgress,
    defeatReason: null,
    effects: [],
    ...overrides,
  };
}

function createFixture(
  state = createState(),
  randomSource: RandomSource = {
    nextFloat: vi.fn(() => 0),
    nextInt: vi.fn((
      minimum: number
    ) => minimum),
  }
) {
  const persistAction = vi.fn<
    CombatActionTransaction["persistAction"]
  >(async () => []);

  const transaction:
  CombatActionTransaction = {
    locked: {
      session: {
        combatSessionId: "session-1",
        characterId: "character-1",
        monsterId: "monster-1",
        monsterCode: "dev_rat",
        status:
          PERSISTENT_COMBAT_STATUS.active,
        defeatReason: null,
        currentTurn: state.turn,
        player: {
          ...state.player,
        },
        monster: {
          ...state.monster,
        },
        startedAt:
          new Date(
            "2026-10-07T19:59:00.000Z"
          ),
        endedAt: null,
      },
      combatState: state,
    },
    persistAction,
  };

  const withActionTransaction =
    vi.fn(async (
      _input,
      operation
    ) => operation(transaction));

  const repository:
  CombatSessionRepository = {
    withStartTransaction:
      vi.fn(async () => {
        throw new Error(
          "Start transaction is not used by action tests."
        );
      }),
    withActionTransaction,
  };

  const clock: Clock = {
    now: vi.fn(() => observedAt),
  };

  const service =
    new ResolveCombatActionService(
      repository,
      randomSource,
      clock
    );

  return {
    service,
    clock,
    randomSource,
    persistAction,
    withActionTransaction,
  };
}

const actionInput = {
  accountId: "account-1",
  characterId: "character-1",
  expectedTurn: 1,
  action: {
    type: PLAYER_ACTION_TYPE.basicAttack,
  },
} as const;

describe(
  "ResolveCombatActionService",
  () => {
    it("resolves and persists one continuing round", async () => {
      const fixture = createFixture();

      const result =
        await fixture.service.execute(
          actionInput
        );

      expect(
        fixture.clock.now
      ).toHaveBeenCalledOnce();

      expect(
        fixture.withActionTransaction
      ).toHaveBeenCalledWith(
        {
          accountId: "account-1",
          characterId: "character-1",
          observedAt,
        },
        expect.any(Function)
      );

      expect(
        fixture.persistAction
      ).toHaveBeenCalledOnce();

      expect(
        fixture.persistAction
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          resolvedTurn: 1,
          observedAt,
        })
      );

      expect(result).toMatchObject({
        status: "Active",
        currentTurn: 2,
        endedAt: null,
      });

      expect(
        result.events.map(
          (event) => event.type
        )
      ).toEqual([
        COMBAT_EVENT_TYPE.attackResolved,
        COMBAT_EVENT_TYPE.attackResolved,
        COMBAT_EVENT_TYPE.turnAdvanced,
      ]);
    });

    it("rejects a stale expected turn before resolving combat", async () => {
      const fixture = createFixture();

      await expect(
        fixture.service.execute({
          ...actionInput,
          expectedTurn: 2,
        })
      ).rejects.toBeInstanceOf(
        CombatTurnMismatchError
      );

      expect(
        fixture.randomSource.nextFloat
      ).not.toHaveBeenCalled();

      expect(
        fixture.persistAction
      ).not.toHaveBeenCalled();
    });

    it("returns player victory and current-operation events", async () => {
      const state = createState({
        monster: {
          currentHealth: 5,
          maximumHealth: 100,
          attack: 15,
          defense: 5,
        },
      });

      const fixture = createFixture(
        state,
        {
          nextFloat: vi.fn(() => 0),
          nextInt: vi.fn(() => 20),
        }
      );

      const result =
        await fixture.service.execute(
          actionInput
        );

      expect(result).toMatchObject({
        status: "Victory",
        defeatReason: null,
        currentTurn: 1,
        endedAt: observedAt,
        monster: {
          currentHealth: 0,
        },
      });

      expect(
        result.events.at(-1)
      ).toEqual({
        type:
          COMBAT_EVENT_TYPE.combatEnded,
        status:
          COMBAT_STATUS.playerVictory,
        defeatReason: null,
      });
    });

    it("returns defeat through depleted player Health", async () => {
      const state = createState({
        player: {
          currentHealth: 5,
          maximumHealth: 100,
          attack: 20,
          defense: 10,
        },
      });

      const fixture = createFixture(
        state,
        {
          nextFloat: vi
            .fn()
            .mockReturnValueOnce(0.99)
            .mockReturnValueOnce(0),
          nextInt: vi.fn(() => 10),
        }
      );

      const result =
        await fixture.service.execute(
          actionInput
        );

      expect(result).toMatchObject({
        status: "Defeat",
        defeatReason:
          COMBAT_DEFEAT_REASON
            .playerHealthDepleted,
        currentTurn: 1,
        endedAt: observedAt,
        player: {
          currentHealth: 0,
        },
      });
    });

    it("returns defeat through the turn limit", async () => {
      const state = createState({
        turn: 100,
      });

      const fixture = createFixture(
        state,
        {
          nextFloat: vi.fn(() => 0.99),
          nextInt: vi.fn(),
        }
      );

      const result =
        await fixture.service.execute({
          ...actionInput,
          expectedTurn: 100,
        });

      expect(result).toMatchObject({
        status: "Defeat",
        defeatReason:
          COMBAT_DEFEAT_REASON
            .turnLimitExceeded,
        currentTurn: 100,
        endedAt: observedAt,
      });
    });

    it("preserves event order passed to persistence", async () => {
      const fixture = createFixture();

      await fixture.service.execute(
        actionInput
      );

      const persistedInput =
        fixture.persistAction
          .mock.calls[0]?.[0];

      expect(
        persistedInput?.events.map(
          (event) => event.type
        )
      ).toEqual([
        COMBAT_EVENT_TYPE.attackResolved,
        COMBAT_EVENT_TYPE.attackResolved,
        COMBAT_EVENT_TYPE.turnAdvanced,
      ]);
    });

    it("propagates persistence failure for transaction rollback", async () => {
      const fixture = createFixture();
      const failure =
        new Error(
          "Event persistence failed."
        );

      fixture.persistAction
        .mockRejectedValueOnce(failure);

      await expect(
        fixture.service.execute(
          actionInput
        )
      ).rejects.toBe(failure);
    });
  }
);
