import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  RandomSource,
} from "../../../src/modules/combat/ports/random-source.js";
import {
  COMBAT_DEFEAT_REASON,
  COMBAT_EVENT_TYPE,
  COMBAT_STATUS,
  PLAYER_ACTION_TYPE,
} from "../../../src/modules/combat/domain/combat.constants.js";
import type {
  CombatState,
} from "../../../src/modules/combat/domain/combat.types.js";
import {
  resolveCombatAction,
} from "../../../src/modules/combat/domain/combat-engine.js";

class SequenceRandomSource implements RandomSource {
  public constructor(
    private readonly floats: number[],
    private readonly integers: number[]
  ) {}

  public nextFloat(): number {
    const value = this.floats.shift();

    if (value === undefined) {
      throw new Error(
        "No random float available."
      );
    }

    return value;
  }

  public nextInt(
    minimum: number,
    maximum: number
  ): number {
    void minimum;
    void maximum;

    const value = this.integers.shift();

    if (value === undefined) {
      throw new Error(
        "No random integer available."
      );
    }

    return value;
  }
}

function createCombatState(): CombatState {
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
  };
}

const basicAttack = {
  type: PLAYER_ACTION_TYPE.basicAttack,
} as const;

describe("Combat engine", () => {
  it("resolves a complete round and advances the turn", () => {
    const state = createCombatState();
    const randomSource =
      new SequenceRandomSource(
        [0, 0],
        [20, 10]
      );

    const result = resolveCombatAction(
      state,
      basicAttack,
      randomSource
    );

    expect(result.state).toMatchObject({
      player: {
        currentHealth: 90,
      },
      monster: {
        currentHealth: 80,
      },
      turn: 2,
      status: COMBAT_STATUS.inProgress,
    });

    expect(result.events).toHaveLength(3);
    expect(result.events[2]).toEqual({
      type: COMBAT_EVENT_TYPE.turnAdvanced,
      turn: 2,
    });
  });

  it("ends combat immediately after the player kills the monster", () => {
    const state = createCombatState();

    state.monster.currentHealth = 10;

    const randomSource =
      new SequenceRandomSource(
        [0],
        [20]
      );

    const result = resolveCombatAction(
      state,
      basicAttack,
      randomSource
    );

    expect(result.state).toMatchObject({
      monster: {
        currentHealth: 0,
      },
      turn: 1,
      status: COMBAT_STATUS.playerVictory,
      defeatReason: null,
    });

    expect(result.events).toHaveLength(2);
    expect(result.events[1]).toEqual({
      type: COMBAT_EVENT_TYPE.combatEnded,
      status: COMBAT_STATUS.playerVictory,
      defeatReason: null,
    });
  });

  it("ends combat when the monster kills the player", () => {
    const state = createCombatState();

    state.player.currentHealth = 5;

    const randomSource =
      new SequenceRandomSource(
        [0.99, 0],
        [10]
      );

    const result = resolveCombatAction(
      state,
      basicAttack,
      randomSource
    );

    expect(result.state).toMatchObject({
      player: {
        currentHealth: 0,
      },
      turn: 1,
      status: COMBAT_STATUS.playerDefeat,
      defeatReason:
        COMBAT_DEFEAT_REASON.playerHealthDepleted,
    });

    expect(result.events).toHaveLength(3);
  });

  it("defeats the player after both survive turn one hundred", () => {
    const state = createCombatState();

    state.turn = 100;

    const randomSource =
      new SequenceRandomSource(
        [0.99, 0.99],
        []
      );

    const result = resolveCombatAction(
      state,
      basicAttack,
      randomSource
    );

    expect(result.state).toMatchObject({
      turn: 100,
      status: COMBAT_STATUS.playerDefeat,
      defeatReason:
        COMBAT_DEFEAT_REASON.turnLimitExceeded,
    });

    expect(result.events).toHaveLength(3);
    expect(result.events[2]).toEqual({
      type: COMBAT_EVENT_TYPE.combatEnded,
      status: COMBAT_STATUS.playerDefeat,
      defeatReason:
        COMBAT_DEFEAT_REASON.turnLimitExceeded,
    });
  });

  it("does not mutate the input state", () => {
    const state = createCombatState();
    const original =
      structuredClone(state);

    const randomSource =
      new SequenceRandomSource(
        [0, 0],
        [20, 10]
      );

    resolveCombatAction(
      state,
      basicAttack,
      randomSource
    );

    expect(state).toEqual(original);
  });
});
