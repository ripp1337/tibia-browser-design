import type {
  QueryResult,
  QueryResultRow,
} from "pg";
import { describe, expect, it, vi } from "vitest";

import {
  PostgresCharacterStatisticsRepository,
} from "../../../src/modules/characters/infrastructure/postgres-character-statistics.repository.js";

describe("PostgresCharacterStatisticsRepository", () => {
  it("maps character and equipped item statistics", async () => {
    const query = vi.fn().mockResolvedValue({
      rows: [
        {
          level: 10,
          current_spell_power: "120",
          equipment_attack: "25",
          equipment_defense: "15",
          equipment_spell_power: "10",
          equipment_health: "100",
          equipment_mana: "30",
          equipment_energy: "5",
          equipment_gold_percent: "8.5",
          equipment_experience_percent: "4.25",
          achievement_attack: "3",
          achievement_defense: "2",
          achievement_gold_percent: "6.5",
          achievement_experience_percent: "1.25",
          boost_attack: "11",
          boost_defense: "12",
          boost_spell_power: "13",
          boost_gold_percent: "14.5",
          boost_experience_percent: "15.25",
        },
      ],
      rowCount: 1,
    });

    const database = {
      query: query as unknown as <
        Row extends QueryResultRow
      >(
        queryText: string,
        values?: unknown[]
      ) => Promise<QueryResult<Row>>,
    };

    const repository =
      new PostgresCharacterStatisticsRepository(database);

    const result =
      await repository.findCalculationSources(
        "character-1"
      );

    expect(result).toEqual({
      level: 10,
      spellMasteryPower: 120,
      achievements: {
        attack: 3,
        defense: 2,
        goldBonusPercent: 6.5,
        experienceBonusPercent: 1.25,
      },
      progressionBoosts: {
        goldBonusPercent: 14.5,
        experienceBonusPercent: 15.25,
      },
      equipment: {
        attack: 25,
        defense: 15,
        spellPower: 10,
        maximumHealth: 100,
        maximumMana: 30,
        maximumEnergy: 5,
        goldBonusPercent: 8.5,
        experienceBonusPercent: 4.25,
      },
    });

    expect(query).toHaveBeenCalledOnce();

    const [queryText, values] = query.mock.calls[0];

    expect(queryText).toContain(
      "ii.is_equipped = TRUE"
    );
    expect(values).toEqual(["character-1", null]);
  });

  it("returns null when the character does not exist", async () => {
    const query = vi.fn().mockResolvedValue({
      rows: [],
      rowCount: 0,
    });

    const database = {
      query: query as unknown as <
        Row extends QueryResultRow
      >(
        queryText: string,
        values?: unknown[]
      ) => Promise<QueryResult<Row>>,
    };

    const repository =
      new PostgresCharacterStatisticsRepository(database);

    await expect(
      repository.findCalculationSources(
        "missing-character"
      )
    ).resolves.toBeNull();
  });

  it("rejects invalid numeric values", async () => {
    const query = vi.fn().mockResolvedValue({
      rows: [
        {
          level: 1,
          current_spell_power: "100",
          equipment_attack: "-1",
          equipment_defense: "0",
          equipment_spell_power: "0",
          equipment_health: "0",
          equipment_mana: "0",
          equipment_energy: "0",
          equipment_gold_percent: "0",
          equipment_experience_percent: "0",
          achievement_attack: "0",
          achievement_defense: "0",
          achievement_gold_percent: "0",
          achievement_experience_percent: "0",
          boost_attack: "0",
          boost_defense: "0",
          boost_spell_power: "0",
          boost_gold_percent: "0",
          boost_experience_percent: "0",
        },
      ],
      rowCount: 1,
    });

    const database = {
      query: query as unknown as <
        Row extends QueryResultRow
      >(
        queryText: string,
        values?: unknown[]
      ) => Promise<QueryResult<Row>>,
    };

    const repository =
      new PostgresCharacterStatisticsRepository(database);

    await expect(
      repository.findCalculationSources("character-1")
    ).rejects.toThrow(
      "equipment_attack must be a non-negative finite number."
    );
  });
});
