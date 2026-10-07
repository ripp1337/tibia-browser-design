import {
  COMBAT_DEFEAT_REASON,
  COMBAT_STATUS,
} from "./combat.constants.js";
import {
  CombatAlreadyEndedError,
  CombatInvalidStateError,
  InvalidRandomSourceError,
} from "./combat.errors.js";
import type {
  Combatant,
  CombatState,
} from "./combat.types.js";

function assertNonNegativeSafeInteger(
  value: number,
  field: string
): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new CombatInvalidStateError(
      `${field} must be a non-negative safe integer.`
    );
  }
}

function validateCombatant(
  combatant: Combatant,
  field: string
): void {
  assertNonNegativeSafeInteger(
    combatant.currentHealth,
    `${field}.currentHealth`
  );

  if (
    !Number.isSafeInteger(combatant.maximumHealth) ||
    combatant.maximumHealth < 1
  ) {
    throw new CombatInvalidStateError(
      `${field}.maximumHealth must be a positive safe integer.`
    );
  }

  if (
    combatant.currentHealth >
    combatant.maximumHealth
  ) {
    throw new CombatInvalidStateError(
      `${field}.currentHealth cannot exceed maximumHealth.`
    );
  }

  assertNonNegativeSafeInteger(
    combatant.attack,
    `${field}.attack`
  );

  assertNonNegativeSafeInteger(
    combatant.defense,
    `${field}.defense`
  );
}

function validateInProgressState(
  state: CombatState
): void {
  if (state.defeatReason !== null) {
    throw new CombatInvalidStateError(
      "An in-progress combat cannot have a defeat reason."
    );
  }

  if (state.player.currentHealth === 0) {
    throw new CombatInvalidStateError(
      "An in-progress combat requires the player to be alive."
    );
  }

  if (state.monster.currentHealth === 0) {
    throw new CombatInvalidStateError(
      "An in-progress combat requires the monster to be alive."
    );
  }
}

function validatePlayerVictoryState(
  state: CombatState
): void {
  if (state.defeatReason !== null) {
    throw new CombatInvalidStateError(
      "A player victory cannot have a defeat reason."
    );
  }

  if (state.player.currentHealth === 0) {
    throw new CombatInvalidStateError(
      "A player victory requires the player to be alive."
    );
  }

  if (state.monster.currentHealth !== 0) {
    throw new CombatInvalidStateError(
      "A player victory requires depleted monster health."
    );
  }
}

function validatePlayerDefeatState(
  state: CombatState
): void {
  if (
    state.defeatReason ===
    COMBAT_DEFEAT_REASON.playerHealthDepleted
  ) {
    if (state.player.currentHealth !== 0) {
      throw new CombatInvalidStateError(
        "A health-depletion defeat requires depleted player health."
      );
    }

    if (state.monster.currentHealth === 0) {
      throw new CombatInvalidStateError(
        "A health-depletion defeat requires the monster to be alive."
      );
    }

    return;
  }

  if (
    state.defeatReason ===
    COMBAT_DEFEAT_REASON.turnLimitExceeded
  ) {
    if (state.turn !== 100) {
      throw new CombatInvalidStateError(
        "A turn-limit defeat must occur on turn 100."
      );
    }

    if (
      state.player.currentHealth === 0 ||
      state.monster.currentHealth === 0
    ) {
      throw new CombatInvalidStateError(
        "A turn-limit defeat requires both combatants to be alive."
      );
    }

    return;
  }

  throw new CombatInvalidStateError(
    "A player defeat requires a valid defeat reason."
  );
}

function validateStatusState(
  state: CombatState
): void {
  if (state.status === COMBAT_STATUS.inProgress) {
    validateInProgressState(state);
    return;
  }

  if (state.status === COMBAT_STATUS.playerVictory) {
    validatePlayerVictoryState(state);
    return;
  }

  if (state.status === COMBAT_STATUS.playerDefeat) {
    validatePlayerDefeatState(state);
    return;
  }

  throw new CombatInvalidStateError(
    "Combat status is invalid."
  );
}

export function validateCombatState(
  state: CombatState
): void {
  validateCombatant(state.player, "player");
  validateCombatant(state.monster, "monster");

  if (
    !Number.isSafeInteger(state.turn) ||
    state.turn < 1 ||
    state.turn > 100
  ) {
    throw new CombatInvalidStateError(
      "turn must be a safe integer between 1 and 100."
    );
  }

  if (!Array.isArray(state.effects)) {
    throw new CombatInvalidStateError(
      "effects must be an array."
    );
  }

  if (state.effects.length !== 0) {
    throw new CombatInvalidStateError(
      "Active combat effects are not supported in M4."
    );
  }

  validateStatusState(state);
}

export function assertCombatInProgress(
  state: CombatState
): void {
  validateCombatState(state);

  if (state.status !== COMBAT_STATUS.inProgress) {
    throw new CombatAlreadyEndedError();
  }
}

export function validateRandomFloat(
  value: number
): void {
  if (
    !Number.isFinite(value) ||
    value < 0 ||
    value >= 1
  ) {
    throw new InvalidRandomSourceError(
      "Random float must be greater than or equal to 0 and less than 1."
    );
  }
}

export function validateRandomInteger(
  value: number,
  minimum: number,
  maximum: number
): void {
  if (
    !Number.isSafeInteger(value) ||
    value < minimum ||
    value > maximum
  ) {
    throw new InvalidRandomSourceError(
      `Random integer must be between ${minimum} and ${maximum}, inclusive.`
    );
  }
}
