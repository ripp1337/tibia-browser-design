import { randomUUID } from "node:crypto";

import { Pool } from "pg";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import { env } from "../../../src/config/env.js";
import {
  createTestAccount,
  deleteTestAccount,
} from "../../helpers/test-account.js";

const testPool = new Pool({
  host: env.database.host,
  port: env.database.port,
  database: env.database.name,
  user: env.database.user,
  password: env.database.password,
  max: 2,
  idleTimeoutMillis: 5_000,
  connectionTimeoutMillis: 5_000,
});

type SessionOverrides = {
  status?: "Active" | "Victory" | "Defeat" | "Abandoned";
  currentTurn?: number;
  characterHealth?: number;
  characterMaximumHealth?: number;
  characterAttack?: number;
  characterDefense?: number;
  monsterHealth?: number;
  monsterMaximumHealth?: number;
  monsterAttack?: number;
  monsterDefense?: number;
  defeatReason?:
    | "PlayerHealthDepleted"
    | "TurnLimitExceeded"
    | string
    | null;
  endedAt?: Date | null;
};

let accountId: string;
let characterId: string;
let monsterId: string;

async function insertCombatSession(
  overrides: SessionOverrides = {}
): Promise<string> {
  const status = overrides.status ?? "Active";
  const endedAt =
    overrides.endedAt !== undefined
      ? overrides.endedAt
      : status === "Active"
        ? null
        : new Date();

  const result = await testPool.query<{
    combat_session_id: string;
  }>(
    `
      INSERT INTO combat_sessions (
        character_id,
        monster_id,
        status,
        current_turn,
        character_health,
        character_mana,
        monster_health,
        started_at,
        ended_at,
        character_maximum_health,
        character_attack,
        character_defense,
        monster_maximum_health,
        monster_attack,
        monster_defense,
        defeat_reason
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        NOW() - INTERVAL '1 minute',
        $8,
        $9, $10, $11, $12, $13, $14, $15
      )
      RETURNING combat_session_id
    `,
    [
      characterId,
      monsterId,
      status,
      overrides.currentTurn ?? 1,
      overrides.characterHealth ?? 100,
      35,
      overrides.monsterHealth ?? 80,
      endedAt,
      overrides.characterMaximumHealth ?? 100,
      overrides.characterAttack ?? 20,
      overrides.characterDefense ?? 10,
      overrides.monsterMaximumHealth ?? 80,
      overrides.monsterAttack ?? 15,
      overrides.monsterDefense ?? 8,
      overrides.defeatReason ?? null,
    ]
  );

  const row = result.rows[0];

  if (!row) {
    throw new Error(
      "Combat session insert did not return an ID."
    );
  }

  return row.combat_session_id;
}

async function expectCheckViolation(
  operation: () => Promise<unknown>
): Promise<void> {
  await expect(operation()).rejects.toMatchObject({
    code: "23514",
  });
}

describe("M5 persistent combat schema", () => {
  beforeAll(async () => {
    const account = await createTestAccount(testPool);
    accountId = account.accountId;

    const character = await testPool.query<{
      character_id: string;
    }>(
      `
        INSERT INTO characters (
          account_id,
          name
        )
        VALUES ($1, $2)
        RETURNING character_id
      `,
      [
        accountId,
        `Combat-${randomUUID().slice(0, 8)}`,
      ]
    );

    const characterRow = character.rows[0];

    if (!characterRow) {
      throw new Error(
        "Character insert did not return an ID."
      );
    }

    characterId = characterRow.character_id;

    const monster = await testPool.query<{
      monster_id: string;
    }>(
      `
        SELECT monster_id
        FROM monsters
        ORDER BY monster_id
        LIMIT 1
      `
    );

    const monsterRow = monster.rows[0];

    if (!monsterRow) {
      throw new Error(
        "Persistent combat schema tests require one seeded monster."
      );
    }

    monsterId = monsterRow.monster_id;
  });

  beforeEach(async () => {
    await testPool.query(
      `
        DELETE FROM combat_sessions
        WHERE character_id = $1
      `,
      [characterId]
    );
  });

  afterAll(async () => {
    try {
      if (accountId) {
        await deleteTestAccount(
          testPool,
          accountId
        );
      }
    } finally {
      await testPool.end();
    }
  });

  it("contains the M5 snapshot columns and event table", async () => {
    const columns = await testPool.query<{
      table_name: string;
      column_name: string;
    }>(
      `
        SELECT
          table_name,
          column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name IN (
            'combat_sessions',
            'combat_session_events'
          )
      `
    );

    const names = new Set(
      columns.rows.map(
        (row) =>
          `${row.table_name}.${row.column_name}`
      )
    );

    expect(names).toEqual(
      expect.objectContaining({})
    );

    expect(names.has(
      "combat_sessions.character_maximum_health"
    )).toBe(true);
    expect(names.has(
      "combat_sessions.character_attack"
    )).toBe(true);
    expect(names.has(
      "combat_sessions.character_defense"
    )).toBe(true);
    expect(names.has(
      "combat_sessions.monster_maximum_health"
    )).toBe(true);
    expect(names.has(
      "combat_sessions.monster_attack"
    )).toBe(true);
    expect(names.has(
      "combat_sessions.monster_defense"
    )).toBe(true);
    expect(names.has(
      "combat_sessions.defeat_reason"
    )).toBe(true);
    expect(names.has(
      "combat_session_events.event_data_json"
    )).toBe(true);
  });

  it("rejects non-positive maximum Health", async () => {
    await expectCheckViolation(() =>
      insertCombatSession({
        characterMaximumHealth: 0,
      })
    );

    await expectCheckViolation(() =>
      insertCombatSession({
        monsterMaximumHealth: 0,
      })
    );
  });

  it("rejects negative Attack and Defense", async () => {
    await expectCheckViolation(() =>
      insertCombatSession({
        characterAttack: -1,
      })
    );

    await expectCheckViolation(() =>
      insertCombatSession({
        monsterDefense: -1,
      })
    );
  });

  it("rejects current Health above maximum Health", async () => {
    await expectCheckViolation(() =>
      insertCombatSession({
        characterHealth: 101,
        characterMaximumHealth: 100,
      })
    );

    await expectCheckViolation(() =>
      insertCombatSession({
        monsterHealth: 81,
        monsterMaximumHealth: 80,
      })
    );
  });

  it("rejects turns outside the range from 1 to 100", async () => {
    await expectCheckViolation(() =>
      insertCombatSession({
        currentTurn: 0,
      })
    );

    await expectCheckViolation(() =>
      insertCombatSession({
        currentTurn: 101,
      })
    );
  });

  it("accepts valid terminal state combinations", async () => {
    await insertCombatSession({
      status: "Victory",
      monsterHealth: 0,
      defeatReason: null,
    });

    await insertCombatSession({
      status: "Defeat",
      characterHealth: 0,
      defeatReason: "PlayerHealthDepleted",
    });

    await insertCombatSession({
      status: "Abandoned",
      defeatReason: null,
    });
  });

  it("rejects inconsistent status and defeat reason combinations", async () => {
    await expectCheckViolation(() =>
      insertCombatSession({
        status: "Active",
        defeatReason: "TurnLimitExceeded",
      })
    );

    await expectCheckViolation(() =>
      insertCombatSession({
        status: "Victory",
        defeatReason: "PlayerHealthDepleted",
      })
    );

    await expectCheckViolation(() =>
      insertCombatSession({
        status: "Defeat",
        defeatReason: null,
      })
    );

    await expectCheckViolation(() =>
      insertCombatSession({
        status: "Abandoned",
        defeatReason: "TurnLimitExceeded",
      })
    );
  });

  it("rejects an unsupported defeat reason", async () => {
    await expectCheckViolation(() =>
      insertCombatSession({
        status: "Defeat",
        defeatReason: "UnsupportedReason",
      })
    );
  });

  it("rejects duplicate event positions in one turn", async () => {
    const sessionId =
      await insertCombatSession();

    const insertEvent = () =>
      testPool.query(
        `
          INSERT INTO combat_session_events (
            combat_session_id,
            turn_number,
            event_order,
            event_type,
            event_data_json
          )
          VALUES ($1, 1, 0, $2, $3::jsonb)
        `,
        [
          sessionId,
          "AttackResolved",
          JSON.stringify({
            type: "AttackResolved",
          }),
        ]
      );

    await insertEvent();

    await expect(
      insertEvent()
    ).rejects.toMatchObject({
      code: "23505",
    });
  });

  it("allows the same event order in different turns", async () => {
    const sessionId =
      await insertCombatSession();

    await testPool.query(
      `
        INSERT INTO combat_session_events (
          combat_session_id,
          turn_number,
          event_order,
          event_type,
          event_data_json
        )
        VALUES
          ($1, 1, 0, 'AttackResolved', '{}'::jsonb),
          ($1, 2, 0, 'AttackResolved', '{}'::jsonb)
      `,
      [sessionId]
    );

    const result = await testPool.query<{
      count: string;
    }>(
      `
        SELECT COUNT(*)::text AS count
        FROM combat_session_events
        WHERE combat_session_id = $1
      `,
      [sessionId]
    );

    expect(result.rows[0]?.count).toBe("2");
  });

  it("deletes events when their session is deleted", async () => {
    const sessionId =
      await insertCombatSession();

    await testPool.query(
      `
        INSERT INTO combat_session_events (
          combat_session_id,
          turn_number,
          event_order,
          event_type,
          event_data_json
        )
        VALUES (
          $1,
          1,
          0,
          'AttackResolved',
          '{}'::jsonb
        )
      `,
      [sessionId]
    );

    await testPool.query(
      `
        DELETE FROM combat_sessions
        WHERE combat_session_id = $1
      `,
      [sessionId]
    );

    const result = await testPool.query<{
      count: string;
    }>(
      `
        SELECT COUNT(*)::text AS count
        FROM combat_session_events
        WHERE combat_session_id = $1
      `,
      [sessionId]
    );

    expect(result.rows[0]?.count).toBe("0");
  });

  it("allows only one active session per character", async () => {
    await insertCombatSession();

    await expect(
      insertCombatSession()
    ).rejects.toMatchObject({
      code: "23505",
    });
  });
});
