import {
  describe,
  expect,
  it,
} from "vitest";

import {
  COMBAT_DEFEAT_REASON,
  COMBAT_STATUS,
} from "../../../src/modules/combat/domain/combat.constants.js";
import {
  CombatAlreadyEndedError,
  CombatInvalidStateError,
  InvalidRandomSourceError,
} from "../../../src/modules/combat/domain/combat.errors.js";
import type {
  CombatState,
} from "../../../src/modules/combat/domain/combat.types.js";
import {
  assertCombatInProgress,
  validateCombatState,
  validateRandomFloat,
  validateRandomInteger,
} from "../../../src/modules/combat/domain/combat-validation.js";

function createCombatState(): CombatState {
  return {
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
    turn: 1,
    status: COMBAT_STATUS.inProgress,
    defeatReason: null,
    effects: [],
  };
}

describe("Combat validation", () => {
  it("accepts a valid combat state", () => {
    expect(() =>
      validateCombatState(createCombatState())
    ).not.toThrow();
  });

  it("rejects a negative combat statistic", () => {
    const state = createCombatState();

    state.player.attack = -1;

    expect(() =>
      validateCombatState(state)
    ).toThrow(CombatInvalidStateError);
  });

  it("rejects a non-integer combat statistic", () => {
    const state = createCombatState();

    state.monster.defense = 2.5;

    expect(() =>
      validateCombatState(state)
    ).toThrow(CombatInvalidStateError);
  });

  it("rejects zero maximum health", () => {
    const state = createCombatState();

    state.player.maximumHealth = 0;

    expect(() =>
      validateCombatState(state)
    ).toThrow(CombatInvalidStateError);
  });

  it("rejects current health above maximum health", () => {
    const state = createCombatState();

    state.monster.currentHealth = 81;

    expect(() =>
      validateCombatState(state)
    ).toThrow(CombatInvalidStateError);
  });

  it("rejects a turn below one", () => {
    const state = createCombatState();

    state.turn = 0;

    expect(() =>
      validateCombatState(state)
    ).toThrow(CombatInvalidStateError);
  });

  it("rejects a turn above one hundred", () => {
    const state = createCombatState();

    state.turn = 101;

    expect(() =>
      validateCombatState(state)
    ).toThrow(CombatInvalidStateError);
  });

  it("rejects active effects during M4", () => {
    const state = createCombatState();

    const invalidState = {
      ...state,
      effects: [{}],
    } as unknown as CombatState;

    expect(() =>
      validateCombatState(invalidState)
    ).toThrow(CombatInvalidStateError);
  });

  it("rejects an in-progress state with a defeat reason", () => {
    const state = createCombatState();

    state.defeatReason =
      COMBAT_DEFEAT_REASON.turnLimitExceeded;

    expect(() =>
      validateCombatState(state)
    ).toThrow(CombatInvalidStateError);
  });

  it("rejects an in-progress state with depleted player health", () => {
    const state = createCombatState();

    state.player.currentHealth = 0;

    expect(() =>
      validateCombatState(state)
    ).toThrow(CombatInvalidStateError);
  });

  it("rejects an in-progress state with depleted monster health", () => {
    const state = createCombatState();

    state.monster.currentHealth = 0;

    expect(() =>
      validateCombatState(state)
    ).toThrow(CombatInvalidStateError);
  });

  it("accepts a valid player victory state", () => {
    const state = createCombatState();

    state.monster.currentHealth = 0;
    state.status = COMBAT_STATUS.playerVictory;

    expect(() =>
      validateCombatState(state)
    ).not.toThrow();
  });

  it("rejects a player victory while the monster is alive", () => {
    const state = createCombatState();

    state.status = COMBAT_STATUS.playerVictory;

    expect(() =>
      validateCombatState(state)
    ).toThrow(CombatInvalidStateError);
  });

  it("accepts a defeat caused by depleted player health", () => {
    const state = createCombatState();

    state.player.currentHealth = 0;
    state.status = COMBAT_STATUS.playerDefeat;
    state.defeatReason =
      COMBAT_DEFEAT_REASON.playerHealthDepleted;

    expect(() =>
      validateCombatState(state)
    ).not.toThrow();
  });

  it("accepts a turn-limit defeat on turn one hundred", () => {
    const state = createCombatState();

    state.turn = 100;
    state.status = COMBAT_STATUS.playerDefeat;
    state.defeatReason =
      COMBAT_DEFEAT_REASON.turnLimitExceeded;

    expect(() =>
      validateCombatState(state)
    ).not.toThrow();
  });

  it("rejects a turn-limit defeat before turn one hundred", () => {
    const state = createCombatState();

    state.turn = 99;
    state.status = COMBAT_STATUS.playerDefeat;
    state.defeatReason =
      COMBAT_DEFEAT_REASON.turnLimitExceeded;

    expect(() =>
      validateCombatState(state)
    ).toThrow(CombatInvalidStateError);
  });

  it("rejects an action after combat has ended", () => {
    const state = createCombatState();

    state.monster.currentHealth = 0;
    state.status = COMBAT_STATUS.playerVictory;

    expect(() =>
      assertCombatInProgress(state)
    ).toThrow(CombatAlreadyEndedError);
  });

  it("accepts random float boundaries", () => {
    expect(() =>
      validateRandomFloat(0)
    ).not.toThrow();

    expect(() =>
      validateRandomFloat(0.999999)
    ).not.toThrow();
  });

  it("rejects random floats outside the contract", () => {
    expect(() =>
      validateRandomFloat(-0.01)
    ).toThrow(InvalidRandomSourceError);

    expect(() =>
      validateRandomFloat(1)
    ).toThrow(InvalidRandomSourceError);
  });

  it("accepts inclusive random integer boundaries", () => {
    expect(() =>
      validateRandomInteger(10, 10, 20)
    ).not.toThrow();

    expect(() =>
      validateRandomInteger(20, 10, 20)
    ).not.toThrow();
  });

  it("rejects a random integer outside the range", () => {
    expect(() =>
      validateRandomInteger(21, 10, 20)
    ).toThrow(InvalidRandomSourceError);
  });
});