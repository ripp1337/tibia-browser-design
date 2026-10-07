import {
  describe,
  expect,
  it,
} from "vitest";

import {
  PERSISTENT_COMBAT_STATUS,
} from "../../../src/modules/combat/application/combat-session.models.js";
import {
  InvalidPersistentCombatStateError,
} from "../../../src/modules/combat/application/combat-session.errors.js";
import {
  COMBAT_DEFEAT_REASON,
  COMBAT_STATUS,
} from "../../../src/modules/combat/domain/combat.constants.js";
import {
  mapPostgreSqlCombatSessionRow,
} from "../../../src/modules/combat/infrastructure/postgres-combat.mapper.js";
import type {
  PostgreSqlCombatSessionRow,
} from "../../../src/modules/combat/infrastructure/postgres-combat.mapper.js";

function createRow():
PostgreSqlCombatSessionRow {
  return {
    combat_session_id:
      "11111111-1111-4111-8111-111111111111",
    character_id:
      "22222222-2222-4222-8222-222222222222",
    monster_id:
      "33333333-3333-4333-8333-333333333333",
    monster_code: "dev_rat",
    status: "Active",
    current_turn: 1,
    character_health: "100",
    character_maximum_health: "100",
    character_attack: "20",
    character_defense: "10",
    monster_health: "80",
    monster_maximum_health: "80",
    monster_attack: "15",
    monster_defense: "8",
    defeat_reason: null,
    started_at:
      new Date("2026-01-01T00:00:00.000Z"),
    ended_at: null,
  };
}

describe("PostgreSQL combat mapper", () => {
  it("maps an active PostgreSQL row to a session and M4 state", () => {
    const result =
      mapPostgreSqlCombatSessionRow(
        createRow()
      );

    expect(result.session).toMatchObject({
      monsterCode: "dev_rat",
      status:
        PERSISTENT_COMBAT_STATUS.active,
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
    });

    expect(result.combatState).toEqual({
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
    });
  });

  it("maps a valid player victory", () => {
    const row = createRow();

    row.status = "Victory";
    row.monster_health = "0";
    row.ended_at =
      new Date("2026-01-01T00:01:00.000Z");

    const result =
      mapPostgreSqlCombatSessionRow(row);

    expect(result.combatState.status).toBe(
      COMBAT_STATUS.playerVictory
    );
    expect(
      result.combatState.defeatReason
    ).toBeNull();
  });

  it("maps a valid player defeat", () => {
    const row = createRow();

    row.status = "Defeat";
    row.character_health = "0";
    row.defeat_reason =
      "PlayerHealthDepleted";
    row.ended_at =
      new Date("2026-01-01T00:01:00.000Z");

    const result =
      mapPostgreSqlCombatSessionRow(row);

    expect(result.combatState.status).toBe(
      COMBAT_STATUS.playerDefeat
    );
    expect(
      result.combatState.defeatReason
    ).toBe(
      COMBAT_DEFEAT_REASON.playerHealthDepleted
    );
  });

  it("rejects an abandoned session because M4 has no abandoned state", () => {
    const row = createRow();

    row.status = "Abandoned";
    row.ended_at =
      new Date("2026-01-01T00:01:00.000Z");

    expect(() =>
      mapPostgreSqlCombatSessionRow(row)
    ).toThrow(
      InvalidPersistentCombatStateError
    );
  });

  it("rejects unsupported statuses and defeat reasons", () => {
    const statusRow = createRow();
    statusRow.status = "Unknown";

    expect(() =>
      mapPostgreSqlCombatSessionRow(
        statusRow
      )
    ).toThrow(
      InvalidPersistentCombatStateError
    );

    const reasonRow = createRow();
    reasonRow.defeat_reason = "Unknown";

    expect(() =>
      mapPostgreSqlCombatSessionRow(
        reasonRow
      )
    ).toThrow(
      InvalidPersistentCombatStateError
    );
  });

  it("rejects invalid identifiers, dates, and integers", () => {
    const identifierRow = createRow();
    identifierRow.character_id =
      "not-a-uuid";

    expect(() =>
      mapPostgreSqlCombatSessionRow(
        identifierRow
      )
    ).toThrow(
      InvalidPersistentCombatStateError
    );

    const dateRow = createRow();
    dateRow.started_at =
      new Date("invalid");

    expect(() =>
      mapPostgreSqlCombatSessionRow(
        dateRow
      )
    ).toThrow(
      InvalidPersistentCombatStateError
    );

    const integerRow = createRow();
    integerRow.current_turn = 101;

    expect(() =>
      mapPostgreSqlCombatSessionRow(
        integerRow
      )
    ).toThrow(
      InvalidPersistentCombatStateError
    );
  });

  it("rejects state that violates M4 validation", () => {
    const row = createRow();

    row.character_health = "101";
    row.character_maximum_health = "100";

    expect(() =>
      mapPostgreSqlCombatSessionRow(row)
    ).toThrow(
      InvalidPersistentCombatStateError
    );
  });
});
