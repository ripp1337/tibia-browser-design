import type {
  CharacterId,
} from "../domain/character.types.js";
import type {
  CharacterStatModifiers,
} from "../domain/effective-character-statistics.js";

export type CharacterStatisticsSources = {
  level: number;
  spellMasteryPower: number;
  equipment: CharacterStatModifiers;
  achievements: Partial<CharacterStatModifiers>;
  progressionBoosts: Partial<CharacterStatModifiers>;
};

export interface CharacterStatisticsRepository {
  findCalculationSources(
    characterId: CharacterId
  ): Promise<CharacterStatisticsSources | null>;
}


