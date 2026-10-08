import {
  describe,
  expect,
  it,
} from "vitest";

import {
  aggregateCombatStatistics,
} from "../../../src/modules/progression/domain/progression.js";
import {
  COMBAT_ACTOR,
  COMBAT_EVENT_TYPE,
  COMBAT_STATUS,
} from "../../../src/modules/combat/domain/combat.constants.js";
import type {
  CombatEvent,
} from "../../../src/modules/combat/domain/combat.types.js";

describe("M6 combat statistics aggregation", () => {
  it("aggregates damage dealt and taken", () => {
    const events: CombatEvent[] = [
      {
        type: COMBAT_EVENT_TYPE.attackResolved,
        actor: COMBAT_ACTOR.player,
        target: COMBAT_ACTOR.monster,
        hit: true,
        damage: 17,
      },
      {
        type: COMBAT_EVENT_TYPE.attackResolved,
        actor: COMBAT_ACTOR.monster,
        target: COMBAT_ACTOR.player,
        hit: true,
        damage: 8,
      },
      {
        type: COMBAT_EVENT_TYPE.attackResolved,
        actor: COMBAT_ACTOR.player,
        target: COMBAT_ACTOR.monster,
        hit: true,
        damage: 25,
      },
      {
        type: COMBAT_EVENT_TYPE.combatEnded,
        status: COMBAT_STATUS.playerVictory,
        defeatReason: null,
      },
    ];

    expect(
      aggregateCombatStatistics(events)
    ).toEqual({
      damageDealt: 42n,
      damageTaken: 8n,
      highestPhysicalHit: 25n,
    });
  });

  it("ignores misses and zero-damage hits", () => {
    const events: CombatEvent[] = [
      {
        type: COMBAT_EVENT_TYPE.attackResolved,
        actor: COMBAT_ACTOR.player,
        target: COMBAT_ACTOR.monster,
        hit: false,
        damage: 0,
      },
      {
        type: COMBAT_EVENT_TYPE.attackResolved,
        actor: COMBAT_ACTOR.player,
        target: COMBAT_ACTOR.monster,
        hit: true,
        damage: 0,
      },
      {
        type: COMBAT_EVENT_TYPE.attackResolved,
        actor: COMBAT_ACTOR.monster,
        target: COMBAT_ACTOR.player,
        hit: false,
        damage: 0,
      },
    ];

    expect(
      aggregateCombatStatistics(events)
    ).toEqual({
      damageDealt: 0n,
      damageTaken: 0n,
      highestPhysicalHit: 0n,
    });
  });

  it("ignores non-attack events", () => {
    const events: CombatEvent[] = [
      {
        type: COMBAT_EVENT_TYPE.turnAdvanced,
        turn: 2,
      },
      {
        type: COMBAT_EVENT_TYPE.combatEnded,
        status: COMBAT_STATUS.playerDefeat,
        defeatReason: "TurnLimitExceeded",
      },
    ];

    expect(
      aggregateCombatStatistics(events)
    ).toEqual({
      damageDealt: 0n,
      damageTaken: 0n,
      highestPhysicalHit: 0n,
    });
  });

  it("rejects damage on a missed attack", () => {
    expect(() =>
      aggregateCombatStatistics([
        {
          type: COMBAT_EVENT_TYPE.attackResolved,
          actor: COMBAT_ACTOR.player,
          target: COMBAT_ACTOR.monster,
          hit: false,
          damage: 1,
        },
      ])
    ).toThrow(
      "A missed attack cannot deal damage."
    );
  });

  it("rejects invalid damage", () => {
    expect(() =>
      aggregateCombatStatistics([
        {
          type: COMBAT_EVENT_TYPE.attackResolved,
          actor: COMBAT_ACTOR.player,
          target: COMBAT_ACTOR.monster,
          hit: true,
          damage: -1,
        },
      ])
    ).toThrow(
      "Combat event damage must be a non-negative safe integer."
    );
  });
});
