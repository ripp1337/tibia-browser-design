import type { RandomSource } from "../ports/random-source.js";
import { resolveBasicAttack } from "./combat-attack.js";
import {
  COMBAT_ACTOR,
  COMBAT_DEFEAT_REASON,
  COMBAT_EVENT_TYPE,
  COMBAT_STATUS,
  PLAYER_ACTION_TYPE,
} from "./combat.constants.js";
import { CombatInvalidStateError } from "./combat.errors.js";
import type {
  AttackResolvedEvent,
  CombatEndedEvent,
  CombatResolution,
  CombatState,
  PlayerAction,
} from "./combat.types.js";
import { assertCombatInProgress } from "./combat-validation.js";

const MAXIMUM_TURN = 100;

function createAttackEvent(
  actor: AttackResolvedEvent["actor"],
  target: AttackResolvedEvent["target"],
  hit: boolean,
  damage: number
): AttackResolvedEvent {
  return {
    type: COMBAT_EVENT_TYPE.attackResolved,
    actor,
    target,
    hit,
    damage,
  };
}

function createCombatEndedEvent(
  state: CombatState
): CombatEndedEvent {
  return {
    type: COMBAT_EVENT_TYPE.combatEnded,
    status: state.status,
    defeatReason: state.defeatReason,
  };
}

export function resolveCombatAction(
  state: CombatState,
  action: PlayerAction,
  randomSource: RandomSource
): CombatResolution {
  assertCombatInProgress(state);

  if (action.type !== PLAYER_ACTION_TYPE.basicAttack) {
    throw new CombatInvalidStateError(
      "Unsupported player action."
    );
  }

  const events: CombatResolution["events"][number][] = [];

  const playerAttack = resolveBasicAttack(
    state.player,
    state.monster,
    randomSource
  );

  const monsterHealth = Math.max(
    0,
    state.monster.currentHealth -
      playerAttack.damage
  );

  events.push(
    createAttackEvent(
      COMBAT_ACTOR.player,
      COMBAT_ACTOR.monster,
      playerAttack.hit,
      playerAttack.damage
    )
  );

  if (monsterHealth === 0) {
    const finalState: CombatState = {
      ...state,
      monster: {
        ...state.monster,
        currentHealth: 0,
      },
      status: COMBAT_STATUS.playerVictory,
      defeatReason: null,
    };

    events.push(
      createCombatEndedEvent(finalState)
    );

    return {
      state: finalState,
      events,
    };
  }

  const stateAfterPlayerAttack: CombatState = {
    ...state,
    monster: {
      ...state.monster,
      currentHealth: monsterHealth,
    },
  };

  const monsterAttack = resolveBasicAttack(
    stateAfterPlayerAttack.monster,
    stateAfterPlayerAttack.player,
    randomSource
  );

  const playerHealth = Math.max(
    0,
    stateAfterPlayerAttack.player.currentHealth -
      monsterAttack.damage
  );

  events.push(
    createAttackEvent(
      COMBAT_ACTOR.monster,
      COMBAT_ACTOR.player,
      monsterAttack.hit,
      monsterAttack.damage
    )
  );

  if (playerHealth === 0) {
    const finalState: CombatState = {
      ...stateAfterPlayerAttack,
      player: {
        ...stateAfterPlayerAttack.player,
        currentHealth: 0,
      },
      status: COMBAT_STATUS.playerDefeat,
      defeatReason:
        COMBAT_DEFEAT_REASON.playerHealthDepleted,
    };

    events.push(
      createCombatEndedEvent(finalState)
    );

    return {
      state: finalState,
      events,
    };
  }

  if (state.turn === MAXIMUM_TURN) {
    const finalState: CombatState = {
      ...stateAfterPlayerAttack,
      player: {
        ...stateAfterPlayerAttack.player,
        currentHealth: playerHealth,
      },
      status: COMBAT_STATUS.playerDefeat,
      defeatReason:
        COMBAT_DEFEAT_REASON.turnLimitExceeded,
    };

    events.push(
      createCombatEndedEvent(finalState)
    );

    return {
      state: finalState,
      events,
    };
  }

  const nextState: CombatState = {
    ...stateAfterPlayerAttack,
    player: {
      ...stateAfterPlayerAttack.player,
      currentHealth: playerHealth,
    },
    turn: state.turn + 1,
  };

  events.push({
    type: COMBAT_EVENT_TYPE.turnAdvanced,
    turn: nextState.turn,
  });

  return {
    state: nextState,
    events,
  };
}
