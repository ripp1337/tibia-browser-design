import type { RandomSource } from "../ports/random-source.js";
import { resolveBasicAttack } from "./combat-attack.js";
import {
  COMBAT_ACTOR,
  COMBAT_DEFEAT_REASON,
  COMBAT_EVENT_TYPE,
  COMBAT_STATUS,
  PLAYER_ACTION_TYPE,
} from "./combat.constants.js";
import { resolveActiveEffects } from "./combat-effects.js";
import { CombatInvalidStateError } from "./combat.errors.js";
import type {
  AttackResolvedEvent,
  CombatEndedEvent,
  CombatEvent,
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

  const events: CombatEvent[] = [];

  const playerAttack = resolveBasicAttack(
    state.player,
    state.monster,
    randomSource
  );

  events.push(
    createAttackEvent(
      COMBAT_ACTOR.player,
      COMBAT_ACTOR.monster,
      playerAttack.hit,
      playerAttack.damage
    )
  );

  const stateAfterPlayerAttack: CombatState = {
    ...state,
    monster: {
      ...state.monster,
      currentHealth: Math.max(
        0,
        state.monster.currentHealth -
          playerAttack.damage
      ),
    },
  };

  const stateAfterPlayerEffects =
    resolveActiveEffects(
      stateAfterPlayerAttack
    );

  if (
    stateAfterPlayerEffects.monster.currentHealth === 0
  ) {
    const finalState: CombatState = {
      ...stateAfterPlayerEffects,
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

  const monsterAttack = resolveBasicAttack(
    stateAfterPlayerEffects.monster,
    stateAfterPlayerEffects.player,
    randomSource
  );

  events.push(
    createAttackEvent(
      COMBAT_ACTOR.monster,
      COMBAT_ACTOR.player,
      monsterAttack.hit,
      monsterAttack.damage
    )
  );

  const stateAfterMonsterAttack: CombatState = {
    ...stateAfterPlayerEffects,
    player: {
      ...stateAfterPlayerEffects.player,
      currentHealth: Math.max(
        0,
        stateAfterPlayerEffects.player.currentHealth -
          monsterAttack.damage
      ),
    },
  };

  const stateAfterMonsterEffects =
    resolveActiveEffects(
      stateAfterMonsterAttack
    );

  if (
    stateAfterMonsterEffects.player.currentHealth === 0
  ) {
    const finalState: CombatState = {
      ...stateAfterMonsterEffects,
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

  if (state.turn >= MAXIMUM_TURN) {
    const finalState: CombatState = {
      ...stateAfterMonsterEffects,
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
    ...stateAfterMonsterEffects,
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