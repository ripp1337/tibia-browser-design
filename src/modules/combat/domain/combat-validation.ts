import { COMBAT_STATUS } from "./combat.constants.js";
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

export function validateCombatState(
  state: CombatState
): void {
  validateCombatant(state.player, "player");
  validateCombatant(state.monster, "monster");

  if (
    !Number.isSafeInteger(state.turn) ||
    state.turn < 1
  ) {
    throw new CombatInvalidStateError(
      "turn must be a positive safe integer."
    );
  }

  if (!Array.isArray(state.effects)) {
    throw new CombatInvalidStateError(
      "effects must be an array."
    );
  }
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
