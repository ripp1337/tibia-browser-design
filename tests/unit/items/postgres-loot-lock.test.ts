import { describe, expect, it, vi } from "vitest";
import type { QueryResult, QueryResultRow } from "pg";
import { lockLootCharacterState, type LootLockQueryable } from "../../../src/modules/items/infrastructure/postgres-loot-lock.js";

function result<Row extends QueryResultRow>(rows: Row[]): QueryResult<Row> {
  return { command: "SELECT", rowCount: rows.length, oid: 0, fields: [], rows };
}

describe("PostgreSQL loot locking", () => {
  it("locks character, inventory and canonical pity in deterministic order", async () => {
    const query = vi.fn()
      .mockResolvedValueOnce(result([{ character_id: "character-1", inventory_slots: 20 }]))
      .mockResolvedValueOnce(result([{ position: 1 }, { position: 3 }]))
      .mockResolvedValueOnce(result([]))
      .mockResolvedValueOnce(result([{ eligible_kill_count: "4", current_chance_percent: "0.5" }]));
    const locked = await lockLootCharacterState({ query } as unknown as LootLockQueryable, "character-1");
    expect(locked).toEqual({
      characterId: "character-1",
      inventoryCapacity: 20,
      occupiedInventoryPositions: [1, 3],
      pity: { eligibleKillCount: 4, chancePerMille: 5 },
    });
    expect(query).toHaveBeenCalledTimes(4);
    expect(query.mock.calls[0]?.[0]).toContain("FOR UPDATE OF c, u");
    expect(query.mock.calls[1]?.[0]).toContain("ORDER BY position");
    expect(query.mock.calls[2]?.[0]).toContain("ON CONFLICT (character_id) DO NOTHING");
    expect(query.mock.calls[3]?.[0]).toContain("FOR UPDATE");
  });

  it("rejects a missing active character before touching Inventory", async () => {
    const query = vi.fn().mockResolvedValueOnce(result([]));
    await expect(lockLootCharacterState({ query } as unknown as LootLockQueryable, "missing"))
      .rejects.toThrow("Active loot character was not found.");
    expect(query).toHaveBeenCalledTimes(1);
  });

  it("rejects pity chance inconsistent with eligible kill count", async () => {
    const query = vi.fn()
      .mockResolvedValueOnce(result([{ character_id: "character-1", inventory_slots: 20 }]))
      .mockResolvedValueOnce(result([]))
      .mockResolvedValueOnce(result([]))
      .mockResolvedValueOnce(result([{
        eligible_kill_count: "4",
        current_chance_percent: "0.4",
      }]));

    await expect(
      lockLootCharacterState(
        { query } as unknown as LootLockQueryable,
        "character-1"
      )
    ).rejects.toThrow(
      "Unique/Set pity chance does not match eligible kill count."
    );
  });

  it("rejects an invalid Inventory position", async () => {
    const query = vi.fn()
      .mockResolvedValueOnce(result([{
        character_id: "character-1",
        inventory_slots: 20,
      }]))
      .mockResolvedValueOnce(result([{ position: 0 }]))
      .mockResolvedValueOnce(result([]))
      .mockResolvedValueOnce(result([{
        eligible_kill_count: "0",
        current_chance_percent: "0.1",
      }]));

    await expect(
      lockLootCharacterState(
        { query } as unknown as LootLockQueryable,
        "character-1"
      )
    ).rejects.toThrow(
      "inventory position must be an integer between 1"
    );
  });
});