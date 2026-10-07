import {
  describe,
  expect,
  it,
} from "vitest";

import {
  COMBAT_SESSION_ERROR_CODE,
  CharacterHealthDepletedError,
  CombatAlreadyActiveError,
  CombatSessionNotFoundError,
  CombatTurnMismatchError,
  InsufficientEnergyError,
  MonsterNotEligibleError,
  PersistentCombatAlreadyEndedError,
} from "../../../src/modules/combat/application/combat-session.errors.js";

describe("Persistent combat errors", () => {
  it.each([
    [
      new CombatAlreadyActiveError(),
      COMBAT_SESSION_ERROR_CODE.combatAlreadyActive,
      409,
    ],
    [
      new CombatSessionNotFoundError(),
      COMBAT_SESSION_ERROR_CODE.combatSessionNotFound,
      404,
    ],
    [
      new PersistentCombatAlreadyEndedError(),
      COMBAT_SESSION_ERROR_CODE.combatAlreadyEnded,
      409,
    ],
    [
      new InsufficientEnergyError(),
      COMBAT_SESSION_ERROR_CODE.insufficientEnergy,
      409,
    ],
    [
      new CharacterHealthDepletedError(),
      COMBAT_SESSION_ERROR_CODE.characterHealthDepleted,
      409,
    ],
    [
      new MonsterNotEligibleError(),
      COMBAT_SESSION_ERROR_CODE.monsterNotEligible,
      409,
    ],
  ])(
    "creates error %s with stable HTTP semantics",
    (error, code, statusCode) => {
      expect(error.code).toBe(code);
      expect(error.statusCode).toBe(
        statusCode
      );
    }
  );

  it("includes expected and current turns in mismatch details", () => {
    const error =
      new CombatTurnMismatchError(2, 3);

    expect(error.code).toBe(
      COMBAT_SESSION_ERROR_CODE.combatTurnMismatch
    );
    expect(error.statusCode).toBe(409);
    expect(error.details).toEqual({
      expectedTurn: 2,
      currentTurn: 3,
    });
  });
});
