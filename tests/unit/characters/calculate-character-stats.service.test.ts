import { describe, expect, it, vi } from "vitest";

import type {
  CharacterStatisticsRepository,
} from "../../../src/modules/characters/application/character-statistics.repository.js";
import {
  CalculateCharacterStatsService,
} from "../../../src/modules/characters/application/calculate-character-stats.service.js";
import {
  CharacterNotFoundError,
} from "../../../src/modules/characters/domain/character.errors.js";

function createRepositoryMock(): CharacterStatisticsRepository {
  return {
    findCalculationSources: vi.fn(),
  };
}

describe("CalculateCharacterStatsService", () => {
  it("calculates statistics from repository sources", async () => {
    const repository = createRepositoryMock();

    vi.mocked(
      repository.findCalculationSources
    ).mockResolvedValue({
      level: 2,
      spellMasteryPower: 110,
      achievements: {},
      progressionBoosts: {},
      permanentBonuses: {},
      equipment: {
        attack: 20,
        defense: 10,
        spellPower: 15,
        maximumHealth: 100,
        maximumMana: 20,
        maximumEnergy: 5,
        goldBonusPercent: 8,
        experienceBonusPercent: 4,
      },
    });

    const service =
      new CalculateCharacterStatsService(repository);

    const result = await service.execute({
      characterId: "character-1",
    });

    expect(result).toEqual({
      attack: 27,
      defense: 17,
      spellPower: 125,
      maximumHealth: 310,
      maximumMana: 70,
      maximumEnergy: 105,
      goldBonusPercent: 8,
      experienceBonusPercent: 4,
    });

    expect(
      repository.findCalculationSources
    ).toHaveBeenCalledWith("character-1");
  });

  it("throws when the character does not exist", async () => {
    const repository = createRepositoryMock();

    vi.mocked(
      repository.findCalculationSources
    ).mockResolvedValue(null);

    const service =
      new CalculateCharacterStatsService(repository);

    await expect(
      service.execute({
        characterId: "missing-character",
      })
    ).rejects.toBeInstanceOf(CharacterNotFoundError);
  });
});



