import type {
  CharacterRepository,
} from "./character.repository.js";
import {
  parseCharacterName,
} from "../domain/character-name.js";
import type {
  AccountId,
  CharacterSnapshot,
  SeasonId,
} from "../domain/character.types.js";

export type CreateCharacterInput = {
  accountId: AccountId;
  seasonId: SeasonId | null;
  name: unknown;
};

const DEFAULT_SPELL_LOADOUT_NAME = "Default Spells";
const DEFAULT_EQUIPMENT_LOADOUT_NAME = "Default Equipment";

export class CreateCharacterService {
  public constructor(
    private readonly repository: CharacterRepository
  ) {}

  public async execute(
    input: CreateCharacterInput
  ): Promise<CharacterSnapshot> {
    const characterName = parseCharacterName(input.name);

    return this.repository.createCharacterGraph({
      accountId: input.accountId,
      seasonId: input.seasonId,
      name: characterName.display,
      spellLoadoutName: DEFAULT_SPELL_LOADOUT_NAME,
      equipmentLoadoutName:
        DEFAULT_EQUIPMENT_LOADOUT_NAME,
    });
  }
}