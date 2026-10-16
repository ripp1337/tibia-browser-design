import { describe, expect, it, vi } from "vitest";
import type { QueryResult } from "pg";
import { loadLootCatalog } from "../../../src/modules/items/infrastructure/postgres-loot-catalog.js";

type Row = Record<string, unknown>;
function result(rows: Row[]): QueryResult<any> {
  return { command: "SELECT", rowCount: rows.length, oid: 0, fields: [], rows };
}

const coefficientRows = [
  "ItemLevel", "Attack", "Defense", "SpellPower", "Health",
  "Mana", "Energy", "GoldPercent", "ExperiencePercent",
].map((score_component) => ({ score_component, coefficient: "1" }));

const regular = {
  item_base_id: "00000000-0000-0000-0000-000000000001",
  item_level: 5,
  slot: "Weapon",
  selection_weight: "10",
  base_item_score: "100",
  attack: "5", defense: "0", spell_power: "0", health: "0",
  mana: "0", energy: "0", gold_percent: 0, experience_percent: 0,
};

function clientWith(rows: Row[][]) {
  return { query: vi.fn(async () => result(rows.shift() ?? [])) };
}

describe("PostgreSQL Loot Catalog", () => {
  it("maps regular bases, Affixes, Other Loot, special Items and coefficients", async () => {
    const client = clientWith([
      [regular],
      [{
        item_base_id: regular.item_base_id,
        affix_template_id: "00000000-0000-0000-0000-000000000002",
        affix_type: "Attack", required_item_level: 5,
        min_value: "1", max_value: "3", selection_weight: "7",
      }],
      [{
        other_loot_table_id: "00000000-0000-0000-0000-000000000003",
        material_id: "00000000-0000-0000-0000-000000000004",
        consumable_definition_id: null, min_quantity: 1, max_quantity: 2,
        selection_weight: "4", is_enabled: true,
      }],
      [{
        ...regular,
        special_item_source_id: "00000000-0000-0000-0000-000000000005",
        monster_id: "monster-1", monster_family_id: null,
        is_unique: true, is_set: false, is_boss_exclusive: false,
        is_enabled: true,
      }],
      [{
        item_base_id: regular.item_base_id, stat_position: 1,
        stat_type: "Attack", min_value: "5", max_value: "10",
      }],
      coefficientRows,
    ]);

    const catalog = await loadLootCatalog(client as any, {
      characterId: "character-1",
      monsterId: "monster-1",
      monsterFamilyId: "family-1",
    });

    expect(catalog.regularItemBases[0]).toMatchObject({
      itemBaseId: regular.item_base_id,
      slot: "Weapon",
      selectionWeight: 10n,
      baseStats: { Attack: 5n },
    });
    expect(catalog.regularItemBases[0]?.affixPool[0]).toMatchObject({
      selectionWeight: 7n,
      value: { statType: "Attack", requiredItemLevel: 5 },
    });
    expect(catalog.otherLootCandidates[0]).toMatchObject({
      minimumQuantity: 1n, maximumQuantity: 2n, selectionWeight: 4n,
    });
    expect(catalog.specialItemCandidates[0]).toMatchObject({
      category: "Unique",
      progressionEligible: true,
      fixedStatRanges: [{ statPosition: 1, statType: "Attack" }],
    });
    expect(catalog.itemScoreCoefficients.Attack).toBe(1n);
    expect(client.query).toHaveBeenCalledTimes(6);
  });

  it("skips dependent pool queries when base lists are empty", async () => {
    const client = clientWith([[], [], [], coefficientRows]);
    const catalog = await loadLootCatalog(client as any, {
      characterId: "character-1",
      monsterId: "monster-1",
      monsterFamilyId: null,
    });
    expect(catalog.regularItemBases).toEqual([]);
    expect(catalog.specialItemCandidates).toEqual([]);
    expect(client.query).toHaveBeenCalledTimes(4);
  });

  it("rejects incomplete Item Score configuration", async () => {
    const client = clientWith([[], [], [], coefficientRows.slice(0, -1)]);
    await expect(loadLootCatalog(client as any, {
      characterId: "character-1", monsterId: "monster-1", monsterFamilyId: null,
    })).rejects.toThrow("Missing Item Score component");
  });

  it("rejects invalid database values", async () => {
    const client = clientWith([[{ ...regular, slot: "Invalid" }], [], [], [], coefficientRows]);
    await expect(loadLootCatalog(client as any, {
      characterId: "character-1", monsterId: "monster-1", monsterFamilyId: null,
    })).rejects.toThrow("Unsupported Equipment Slot");
  });
});