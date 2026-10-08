import type {
  Clock,
} from "../../../application/ports/clock.js";
import {
  DEFAULT_RESOURCE_REGENERATION,
} from "../../characters/domain/character.constants.js";
import {
  regenerateCharacterResources,
} from "../../characters/domain/resource-regeneration.js";
import {
  CharacterHealthDepletedError,
  InsufficientEnergyError,
  MonsterNotEligibleError,
} from "./combat-session.errors.js";
import type {
  CombatSessionRepository,
} from "./combat-session.repository.js";
import type {
  CombatSessionView,
  StartCombatInput,
} from "./combat-session.models.js";

export class StartCombatService {
  public constructor(
    private readonly repository:
      CombatSessionRepository,
    private readonly clock: Clock
  ) {}

  public async execute(
    input: StartCombatInput
  ): Promise<CombatSessionView> {
    const observedAt = this.clock.now();

    return this.repository.withStartTransaction(
      {
        accountId: input.accountId,
        characterId: input.characterId,
        observedAt,
      },
      async (transaction) => {
        const regeneration =
          regenerateCharacterResources(
            transaction.character.resources,
            DEFAULT_RESOURCE_REGENERATION,
            observedAt
          );

        const resources =
          regeneration.resources;

        const monster =
          await transaction.findMonster(
            input.monsterCode
          );

        if (
          monster === null ||
          !monster.eligibility.isEligible
        ) {
          throw new MonsterNotEligibleError();
        }

        if (resources.currentHealth === 0) {
          throw new CharacterHealthDepletedError();
        }

        if (
          resources.currentEnergy <
          monster.energyCost
        ) {
          throw new InsufficientEnergyError();
        }

        const statistics =
          await transaction
            .calculateCharacterStatistics();

        const updatedResources = {
          ...resources,
          currentEnergy:
            resources.currentEnergy -
            monster.energyCost,
        };

        await transaction.updateCharacterResources(
          updatedResources
        );

        const session =
          await transaction.createCombatSession({
            characterId:
              transaction.character.characterId,
            monsterId: monster.monsterId,
            characterHealth:
              updatedResources.currentHealth,
            characterMana:
              updatedResources.currentMana,
            characterMaximumHealth:
              statistics.maximumHealth,
            characterAttack:
              statistics.attack,
            characterDefense:
              statistics.defense,
            monsterMaximumHealth:
              monster.maximumHealth,
            monsterAttack:
              monster.attack,
            monsterDefense:
              monster.defense,
            startedAt: observedAt,
          });

        return {
          ...session,
          events: [],
        };
      }
    );
  }
}
