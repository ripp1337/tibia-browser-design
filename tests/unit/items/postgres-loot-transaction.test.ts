import { describe, expect, it, vi } from "vitest";
import { createPostgresLootSettlementTransaction } from "../../../src/modules/items/infrastructure/postgres-loot-transaction.js";

type QueryResult = { rows: readonly unknown[] };

function createClient() {
  const calls: string[] = [];
  const query = vi.fn(async (
    queryText: string,
    _parameters?: readonly unknown[]
  ): Promise<QueryResult> => {
    const normalized = queryText.trim();
    calls.push(normalized);

    if (normalized.includes("SELECT c.character_id, u.inventory_slots")) {
      return { rows: [{ character_id: "character-1", inventory_slots: 20 }] };
    }
    if (normalized.includes("SELECT position") && normalized.includes("inventory_items")) {
      return { rows: [{ position: 1 }] };
    }
    if (normalized.includes("INSERT INTO unique_pity_tracking")) return { rows: [] };
    if (normalized.includes("SELECT eligible_kill_count")) {
      return { rows: [{ eligible_kill_count: "0", current_chance_percent: "0.1" }] };
    }
    if (normalized.includes("UPDATE unique_pity_tracking")) return { rows: [] };
    throw new Error(`Unexpected query: ${normalized}`);
  });
  return { query, calls };
}

describe("shared PostgreSQL loot transaction", () => {
  it("uses the provided client without opening or committing a transaction", async () => {
    const client = createClient();
    const transaction = await createPostgresLootSettlementTransaction(
      client as never,
      {
        characterId: "character-1",
        monsterId: "monster-1",
        monsterFamilyId: null,
      }
    );

    await transaction.updateUniquePity({
      characterId: "character-1",
      pity: { eligibleKillCount: 1, chancePerMille: 2 },
    });

    expect(transaction.character.characterId).toBe("character-1");
    expect(client.calls).not.toContain("BEGIN");
    expect(client.calls).not.toContain("COMMIT");
    expect(client.calls).not.toContain("ROLLBACK");
  });

  it("rejects persistence for a different Character", async () => {
    const client = createClient();
    const transaction = await createPostgresLootSettlementTransaction(
      client as never,
      {
        characterId: "character-1",
        monsterId: "monster-1",
        monsterFamilyId: null,
      }
    );

    await expect(transaction.updateUniquePity({
      characterId: "other-character",
      pity: { eligibleKillCount: 1, chancePerMille: 2 },
    })).rejects.toThrow(
      "Loot persistence Character ID must match the locked Character."
    );
  });
});