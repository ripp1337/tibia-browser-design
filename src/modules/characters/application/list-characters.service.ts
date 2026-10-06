import type {
  CharacterRepository,
} from "./character.repository.js";
import type {
  AccountId,
  CharacterSummary,
} from "../domain/character.types.js";

export type ListCharactersInput = {
  accountId: AccountId;
};

export class ListCharactersService {
  public constructor(
    private readonly repository: CharacterRepository
  ) {}

  public async execute(
    input: ListCharactersInput
  ): Promise<readonly CharacterSummary[]> {
    return this.repository.listByAccount(input.accountId);
  }
}