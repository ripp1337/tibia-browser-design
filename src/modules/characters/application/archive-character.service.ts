import type {
  ArchiveCharacterInput,
  CharacterRepository,
} from "./character.repository.js";
import {
  CharacterNotFoundError,
} from "../domain/character.errors.js";
import type {
  CharacterSummary,
} from "../domain/character.types.js";

export class ArchiveCharacterService {
  public constructor(
    private readonly repository: CharacterRepository
  ) {}

  public async execute(
    input: ArchiveCharacterInput
  ): Promise<CharacterSummary> {
    const archived = await this.repository.archive(input);

    if (!archived) {
      throw new CharacterNotFoundError();
    }

    return archived;
  }
}