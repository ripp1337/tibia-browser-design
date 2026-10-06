import type {
  CharacterStatisticsRepository,
} from "./character-statistics.repository.js";
import {
  calculateEffectiveCharacterStatistics,
  type EffectiveCharacterStatistics,
} from "../domain/effective-character-statistics.js";
import {
  CharacterNotFoundError,
} from "../domain/character.errors.js";
import type {
  CharacterId,
} from "../domain/character.types.js";

export type CalculateCharacterStatsInput = {
  characterId: CharacterId;
};

export class CalculateCharacterStatsService {
  public constructor(
    private readonly repository:
      CharacterStatisticsRepository
  ) {}

  public async execute(
    input: CalculateCharacterStatsInput
  ): Promise<EffectiveCharacterStatistics> {
    const sources =
      await this.repository.findCalculationSources(
        input.characterId
      );

    if (sources === null) {
      throw new CharacterNotFoundError();
    }

    return calculateEffectiveCharacterStatistics({
      level: sources.level,
      spellMasteryPower:
        sources.spellMasteryPower,
      equipment: sources.equipment,
    });
  }
}
