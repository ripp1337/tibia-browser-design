import { describe, expect, it, vi } from "vitest";
import { PostgresLootRepository } from "../../../src/modules/items/infrastructure/postgres-loot.repository.js";

const context = {
  characterId: "character-1",
  monsterId: "monster-1",
  monsterFamilyId: "family-1",
} as const;

type QueryResult = { rows: readonly unknown[] };

function createDatabase(options: { failCatalog?: boolean } = {}) {
  const calls: string[] = [];
  const query = vi.fn(async (
    queryText: string,
    _parameters?: readonly unknown[]
  ): Promise<QueryResult> => {
    const normalized = queryText.trim();
    calls.push(normalized);

    if (normalized === "BEGIN" || normalized === "COMMIT" || normalized === "ROLLBACK") {
      return { rows: [] };
    }
    if (normalized.includes("SELECT c.character_id, u.inventory_slots")) {
      return {
        rows: [{ character_id: "character-1", inventory_slots: 20 }],
      };
    }
    if (normalized.includes("SELECT position") && normalized.includes("inventory_items")) {
      return { rows: [{ position: 1 }, { position: 2 }] };
    }
    if (normalized.includes("INSERT INTO unique_pity_tracking")) {
      return { rows: [] };
    }
    if (normalized.includes("SELECT eligible_kill_count")) {
      return {
        rows: [{ eligible_kill_count: "0", current_chance_percent: "0.1" }],
      };
    }
    if (options.failCatalog && normalized.includes("FROM loot_tables")) {
      throw new Error("catalog failure");
    }
    if (normalized.includes("FROM loot_tables")) return { rows: [] };
    if (normalized.includes("FROM other_loot_tables")) return { rows: [] };
    if (normalized.includes("FROM special_item_sources")) return { rows: [] };
    if (normalized.includes("FROM item_score_coefficients")) {
      return {
        rows: [
          { score_component: "ItemLevel", coefficient: "1" },
          { score_component: "Attack", coefficient: "1" },
          { score_component: "Defense", coefficient: "1" },
          { score_component: "SpellPower", coefficient: "1" },
          { score_component: "Health", coefficient: "1" },
          { score_component: "Mana", coefficient: "1" },
          { score_component: "Energy", coefficient: "1" },
          { score_component: "GoldPercent", coefficient: "1" },
          { score_component: "ExperiencePercent", coefficient: "1" },
        ],
      };
    }
    if (normalized.includes("UPDATE unique_pity_tracking")) return { rows: [] };

    throw new Error(`Unexpected query: ${normalized}`);
  });
  const release = vi.fn();
  const client = { query, release };
  const pool = { connect: vi.fn(async () => client) };
  return { pool, query, release, calls };
}

describe("PostgresLootRepository", () => {
  it("uses one transaction for lock, catalog and pity persistence", async () => {
    const db = createDatabase();
    const repository = new PostgresLootRepository(db.pool as never);

    const result = await repository.withSettlementTransaction(
      context,
      async (transaction) => {
        expect(transaction.character).toEqual({
          characterId: "character-1",
          inventoryCapacity: 20,
          occupiedInventoryPositions: [1, 2],
          pity: { eligibleKillCount: 0, chancePerMille: 1 },
        });
        const catalog = await transaction.loadCatalog(context);
        await transaction.updateUniquePity({
          characterId: "character-1",
          pity: { eligibleKillCount: 1, chancePerMille: 2 },
        });
        return catalog.regularItemBases.length;
      }
    );

    expect(result).toBe(0);
    expect(db.calls[0]).toBe("BEGIN");
    expect(db.calls.at(-1)).toBe("COMMIT");
    expect(db.calls).not.toContain("ROLLBACK");
    expect(db.release).toHaveBeenCalledOnce();
  });

  it("rolls back and releases the client when settlement work fails", async () => {
    const db = createDatabase({ failCatalog: true });
    const repository = new PostgresLootRepository(db.pool as never);

    await expect(repository.withSettlementTransaction(
      context,
      async (transaction) => transaction.loadCatalog(context)
    )).rejects.toThrow("catalog failure");

    expect(db.calls).toContain("ROLLBACK");
    expect(db.calls).not.toContain("COMMIT");
    expect(db.release).toHaveBeenCalledOnce();
  });

  it("rejects a different catalog context inside the transaction", async () => {
    const db = createDatabase();
    const repository = new PostgresLootRepository(db.pool as never);

    await expect(repository.withSettlementTransaction(
      context,
      async (transaction) => transaction.loadCatalog({
        ...context,
        monsterId: "other-monster",
      })
    )).rejects.toThrow(
      "Loot catalog context must match the settlement transaction."
    );
    expect(db.calls).toContain("ROLLBACK");
  });

  it("rejects persistence for a Character other than the locked one", async () => {
    const db = createDatabase();
    const repository = new PostgresLootRepository(db.pool as never);

    await expect(repository.withSettlementTransaction(
      context,
      async (transaction) => transaction.updateUniquePity({
        characterId: "other-character",
        pity: { eligibleKillCount: 1, chancePerMille: 2 },
      })
    )).rejects.toThrow(
      "Loot persistence Character ID must match the locked Character."
    );
    expect(db.calls).toContain("ROLLBACK");
  });

  it("rejects invalid context before opening a database transaction", async () => {
    const db = createDatabase();
    const repository = new PostgresLootRepository(db.pool as never);

    await expect(repository.withSettlementTransaction(
      { ...context, characterId: "" },
      async () => undefined
    )).rejects.toThrow("Character ID cannot be empty.");

    expect(db.pool.connect).not.toHaveBeenCalled();
  });
});