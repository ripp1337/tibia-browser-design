import type {
  Clock,
} from "../../../application/ports/clock.js";
import type {
  CharacterRepository,
} from "./character.repository.js";
import {
  CHARACTER_STATUS,
  DEFAULT_RESOURCE_REGENERATION,
} from "../domain/character.constants.js";
import {
  CharacterNotFoundError,
} from "../domain/character.errors.js";
import {
  regenerateCharacterResources,
} from "../domain/resource-regeneration.js";
import type {
  AccountId,
  CharacterId,
  CharacterSnapshot,
  ResourceRegenerationRates,
} from "../domain/character.types.js";

export type GetCharacterSnapshotInput = {
  accountId: AccountId;
  characterId: CharacterId;
};

export class GetCharacterSnapshotService {
  public constructor(
    private readonly repository: CharacterRepository,
    private readonly clock: Clock,
    private readonly regenerationRates:
      ResourceRegenerationRates =
        DEFAULT_RESOURCE_REGENERATION
  ) {}

  public async execute(
    input: GetCharacterSnapshotInput
  ): Promise<CharacterSnapshot> {
    const snapshot =
      await this.repository.findSnapshotById({
        accountId: input.accountId,
        characterId: input.characterId,
      });

    if (!snapshot) {
      throw new CharacterNotFoundError();
    }

    if (snapshot.status === CHARACTER_STATUS.archived) {
      return snapshot;
    }

    const regeneration = regenerateCharacterResources(
      snapshot.resources,
      this.regenerationRates,
      this.clock.now()
    );

    if (!regeneration.needsPersistence) {
      return snapshot;
    }

    const updated =
      await this.repository.updateResources({
        accountId: input.accountId,
        characterId: input.characterId,
        resources: regeneration.resources,
      });

    if (!updated) {
      throw new CharacterNotFoundError();
    }

    return {
      ...snapshot,
      resources: regeneration.resources,
    };
  }
}