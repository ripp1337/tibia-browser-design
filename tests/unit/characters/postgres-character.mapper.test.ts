import { describe, expect, it } from "vitest";

import { CharacterResourceStateInvalidError } from "../../../src/modules/characters/domain/character.errors.js";
import {
  mapCharacterSnapshotRow,
  mapCharacterSummaryRow,
  type PostgreSqlCharacterSnapshotRow,
  type PostgreSqlCharacterSummaryRow,
} from "../../../src/modules/characters/infrastructure/postgres-character.mapper.js";

const createdAt = new Date("2026-10-06T10:00:00.000Z");
const updatedAt = new Date("2026-10-06T10:05:00.000Z");
const resourcesUpdatedAt = new Date(
  "2026-10-06T10:04:00.000Z"
);
function createSummaryRow(
  overrides: Partial<PostgreSqlCharacterSummaryRow> = {}
): PostgreSqlCharacterSummaryRow {
  return {
    character_id: "character-1",
    account_id: "account-1",
    season_id: null,
    name: "Sir Jakub",
    status: "IsActive",
    level: 4,
    experience: "123456789012345",
    created_at: createdAt,
    updated_at: updatedAt,
    ...overrides,
  };
}

function createSnapshotRow(
  overrides: Partial<PostgreSqlCharacterSnapshotRow> = {}
): PostgreSqlCharacterSnapshotRow {
  return {
    character_id: "character-1",
    account_id: "account-1",
    season_id: null,
    name: "Sir Jakub",
    status: "IsActive",

    level: 4,
    experience: "123456789012345",
    gold: "9876543210",

    current_health: "150",
    max_health: "180",

    current_mana: "30",
    max_mana: "35",

    current_energy: "90",
    max_energy: "100",

    crafting_level: 2,
    crafting_xp: "250",

    gathering_level: 3,
    gathering_xp: "750",

    resources_updated_at: resourcesUpdatedAt,

    is_promoted: false,
    spell_slots_unlocked: 1,
    crafting_slots_unlocked: 1,
    inventory_slots: 50,

    current_spell_power: "125.5000",

    created_at: createdAt,
    updated_at: updatedAt,

    ...overrides,
  };
}
describe("mapCharacterSummaryRow", () => {
  it("maps a PostgreSQL summary row", () => {
    const result = mapCharacterSummaryRow(
      createSummaryRow()
    );

    expect(result).toEqual({
      characterId: "character-1",
      accountId: "account-1",
      seasonId: null,
      name: "Sir Jakub",
      status: "IsActive",
      level: 4,
      experience: 123456789012345n,
      createdAt,
      updatedAt,
    });
  });

  it("rejects an invalid experience value", () => {
    expect(() =>
      mapCharacterSummaryRow(
        createSummaryRow({
          experience: "invalid",
        })
      )
    ).toThrow(CharacterResourceStateInvalidError);
  });

  it("rejects an invalid date", () => {
    expect(() =>
      mapCharacterSummaryRow(
        createSummaryRow({
          created_at: new Date("invalid"),
        })
      )
    ).toThrow(CharacterResourceStateInvalidError);
  });
});
describe("mapCharacterSnapshotRow", () => {
  it("maps a complete PostgreSQL snapshot row", () => {
    const result = mapCharacterSnapshotRow(
      createSnapshotRow()
    );

    expect(result).toEqual({
      characterId: "character-1",
      accountId: "account-1",
      seasonId: null,
      name: "Sir Jakub",
      status: "IsActive",

      progression: {
        level: 4,
        experience: 123456789012345n,
        gold: 9876543210n,
        craftingLevel: 2,
        craftingExperience: 250n,
        gatheringLevel: 3,
        gatheringExperience: 750n,
      },

      resources: {
        currentHealth: 150,
        maximumHealth: 180,
        currentMana: 30,
        maximumMana: 35,
        currentEnergy: 90,
        maximumEnergy: 100,
        resourcesUpdatedAt,
      },

      baseStatistics: {
        attack: 7,
        defense: 7,
        spellPower: 125.5,
      },

      unlocks: {
        promoted: false,
        spellSlots: 1,
        craftingSlots: 1,
        inventorySlots: 50,
      },

      createdAt,
      updatedAt,
    });
  });

  it("preserves season and archived status", () => {
    const result = mapCharacterSnapshotRow(
      createSnapshotRow({
        season_id: "season-1",
        status: "Archived",
      })
    );

    expect(result.seasonId).toBe("season-1");
    expect(result.status).toBe("Archived");
  });
});
  it("rejects resources above the safe integer limit", () => {
    expect(() =>
      mapCharacterSnapshotRow(
        createSnapshotRow({
          current_health: "9007199254740992",
        })
      )
    ).toThrow(CharacterResourceStateInvalidError);
  });

  it("rejects negative resources", () => {
    expect(() =>
      mapCharacterSnapshotRow(
        createSnapshotRow({
          current_energy: "-1",
        })
      )
    ).toThrow(CharacterResourceStateInvalidError);
  });

it("accepts Spell Power equal to 0", () => {
  expect(() =>
    mapCharacterSnapshotRow(
      createSnapshotRow({
        current_spell_power: "0",
      })
    )
  ).not.toThrow();
});

it("rejects negative Spell Power", () => {
  expect(() =>
    mapCharacterSnapshotRow(
      createSnapshotRow({
        current_spell_power: "-1",
      })
    )
  ).toThrow(CharacterResourceStateInvalidError);
});

  it("rejects an invalid resource checkpoint", () => {
    expect(() =>
      mapCharacterSnapshotRow(
        createSnapshotRow({
          resources_updated_at: new Date("invalid"),
        })
      )
    ).toThrow(CharacterResourceStateInvalidError);
  });
describe("PostgreSQL bigint mapping", () => {
  it("maps large progression values as bigint", () => {
    const result = mapCharacterSnapshotRow(
      createSnapshotRow({
        experience: "9223372036854775807",
        gold: "9007199254740992",
        crafting_xp: "9007199254740993",
        gathering_xp: "9007199254740994",
      })
    );

    expect(result.progression.experience).toBe(
      9223372036854775807n
    );

    expect(result.progression.gold).toBe(
      9007199254740992n
    );

    expect(result.progression.craftingExperience).toBe(
      9007199254740993n
    );

    expect(result.progression.gatheringExperience).toBe(
      9007199254740994n
    );
  });
});
describe("PostgreSQL bigint mapping", () => {
  it("maps large progression values as bigint", () => {
    const result = mapCharacterSnapshotRow(
      createSnapshotRow({
        experience: "9223372036854775807",
        gold: "9007199254740992",
        crafting_xp: "9007199254740993",
        gathering_xp: "9007199254740994",
      })
    );

    expect(result.progression.experience).toBe(
      9223372036854775807n
    );

    expect(result.progression.gold).toBe(
      9007199254740992n
    );

    expect(result.progression.craftingExperience).toBe(
      9007199254740993n
    );

    expect(result.progression.gatheringExperience).toBe(
      9007199254740994n
    );
  });
});