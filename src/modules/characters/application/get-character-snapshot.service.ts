import type {
  Clock,
} from "../../../application/ports/clock.js";
import type {
  CharacterRepository,
} from "./character.repository.js";
import type {
  CalculateCharacterStatsService,
} from "./calculate-character-stats.service.js";
import {
  CHARACTER_STATUS,
  DEFAULT_RESOURCE_REGENERATION,
} from "../domain/character.constants.js";
import {
  CharacterNotFoundError,
} from "../domain/character.errors.js";
import type {
  EffectiveCharacterStatistics,
} from "../domain/effective-character-statistics.js";
import {
  regenerateCharacterResources,
} from "../domain/resource-regeneration.js";
import type {
  AccountId,
  CharacterId,
  CharacterResources,
  CharacterSnapshot,
  ResourceRegenerationRates,
} from "../domain/character.types.js";

export type GetCharacterSnapshotInput = {
  accountId: AccountId;
  characterId: CharacterId;
};

export type EffectiveCharacterSnapshot =
  CharacterSnapshot & {
    effectiveStatistics:
      EffectiveCharacterStatistics;
  };

function applyEffectiveMaximums(
  resources: CharacterResources,
  statistics: EffectiveCharacterStatistics
): CharacterResources {
  return {
    ...resources,

    currentHealth: Math.min(
      resources.currentHealth,
      statistics.maximumHealth
    ),
    maximumHealth: statistics.maximumHealth,

    currentMana: Math.min(
      resources.currentMana,
      statistics.maximumMana
    ),
    maximumMana: statistics.maximumMana,

    currentEnergy: Math.min(
      resources.currentEnergy,
      statistics.maximumEnergy
    ),
    maximumEnergy: statistics.maximumEnergy,
  };
}

function resourcesAreEqual(
  first: CharacterResources,
  second: CharacterResources
): boolean {
  return (
    first.currentHealth === second.currentHealth &&
    first.maximumHealth === second.maximumHealth &&
    first.currentMana === second.currentMana &&
    first.maximumMana === second.maximumMana &&
    first.currentEnergy === second.currentEnergy &&
    first.maximumEnergy === second.maximumEnergy &&
    first.resourcesUpdatedAt.getTime() ===
      second.resourcesUpdatedAt.getTime()
  );
}

export class GetCharacterSnapshotService {
  public constructor(
    private readonly repository: CharacterRepository,
    private readonly statisticsService:
      CalculateCharacterStatsService,
    private readonly clock: Clock,
    private readonly regenerationRates:
      ResourceRegenerationRates =
        DEFAULT_RESOURCE_REGENERATION
  ) {}

  public async execute(
    input: GetCharacterSnapshotInput
  ): Promise<EffectiveCharacterSnapshot> {
    const snapshot =
      await this.repository.findSnapshotById({
        accountId: input.accountId,
        characterId: input.characterId,
      });

    if (!snapshot) {
      throw new CharacterNotFoundError();
    }

    const effectiveStatistics =
      await this.statisticsService.execute({
        characterId: input.characterId,
      });

    const clampedResources =
      applyEffectiveMaximums(
        snapshot.resources,
        effectiveStatistics
      );

    if (
      snapshot.status ===
      CHARACTER_STATUS.archived
    ) {
      return {
        ...snapshot,
        resources: clampedResources,
        effectiveStatistics,
      };
    }

    const regeneration =
      regenerateCharacterResources(
        clampedResources,
        this.regenerationRates,
        this.clock.now()
      );

    const needsPersistence =
      regeneration.needsPersistence ||
      !resourcesAreEqual(
        snapshot.resources,
        regeneration.resources
      );

    if (needsPersistence) {
      const updated =
        await this.repository.updateResources({
          accountId: input.accountId,
          characterId: input.characterId,
          resources: regeneration.resources,
        });

      if (!updated) {
        throw new CharacterNotFoundError();
      }
    }

    return {
      ...snapshot,
      resources: regeneration.resources,
      effectiveStatistics,
    };
  }
}
