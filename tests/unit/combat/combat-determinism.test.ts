import {
  describe,
  expect,
  it,
} from "vitest";

import {
  COMBAT_EVENT_TYPE,
  COMBAT_STATUS,
  PLAYER_ACTION_TYPE,
} from "../../../src/modules/combat/domain/combat.constants.js";
import {
  resolveCombatAction,
} from "../../../src/modules/combat/domain/combat-engine.js";
import type {
  CombatState,
} from "../../../src/modules/combat/domain/combat.types.js";
import type {
  RandomSource,
} from "../../../src/modules/combat/ports/random-source.js";

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

describe("Combat determinism and immutability", () => {
  it("returns identical results for identical state and RNG sequences", () => {
    const firstResult = resolveCombatAction(
      createCombatState(),
      basicAttack,
      new SequenceRandomSource(
        [0, 0],
        [20, 10]
      )
    );

    const secondResult = resolveCombatAction(
      createCombatState(),
      basicAttack,
      new SequenceRandomSource(
        [0, 0],
        [20, 10]
      )
    );

    expect(firstResult).toEqual(secondResult);
  });

  it("returns deterministic ordered events for a complete round", () => {
    const result = resolveCombatAction(
      createCombatState(),
      basicAttack,
      new SequenceRandomSource(
        [0, 0],
        [20, 10]
      )
    );

    expect(
      result.events.map((event) => event.type)
    ).toEqual([
      COMBAT_EVENT_TYPE.attackResolved,
      COMBAT_EVENT_TYPE.attackResolved,
      COMBAT_EVENT_TYPE.turnAdvanced,
    ]);
  });

  it("does not mutate nested combat state", () => {
    const state = createCombatState();
    const original =
      structuredClone(state);

    Object.freeze(state.effects);
    Object.freeze(state.player);
    Object.freeze(state.monster);
    Object.freeze(state);

    expect(() =>
      resolveCombatAction(
        state,
        basicAttack,
        new SequenceRandomSource(
          [0, 0],
          [20, 10]
        )
      )
    ).not.toThrow();

    expect(state).toEqual(original);
  });

  it("preserves active effects as an explicit no-op phase", () => {
    const state = createCombatState();

    const result = resolveCombatAction(
      state,
      basicAttack,
      new SequenceRandomSource(
        [0, 0],
        [20, 10]
      )
    );

    expect(result.state.effects).toBe(
      state.effects
    );
    expect(result.state.effects).toEqual([]);
  });

  it("produces different deterministic outcomes for different valid sequences", () => {
    const hitResult = resolveCombatAction(
      createCombatState(),
      basicAttack,
      new SequenceRandomSource(
        [0, 0],
        [20, 10]
      )
    );

    const missResult = resolveCombatAction(
      createCombatState(),
      basicAttack,
      new SequenceRandomSource(
        [0.99, 0.99],
        []
      )
    );

    expect(hitResult).not.toEqual(missResult);

    expect(hitResult.state).toMatchObject({
      player: {
        currentHealth: 90,
      },
      monster: {
        currentHealth: 80,
      },
    });

    expect(missResult.state).toMatchObject({
      player: {
        currentHealth: 100,
      },
      monster: {
        currentHealth: 100,
      },
    });
  });
});

