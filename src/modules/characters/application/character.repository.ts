import type {
  AccountId,
  CharacterId,
  CharacterResources,
  CharacterSnapshot,
  CharacterSummary,
  SeasonId,
} from "../domain/character.types.js";

export type CreateCharacterGraphInput = {
  accountId: AccountId;
  seasonId: SeasonId | null;
  name: string;
  spellLoadoutName: string;
  equipmentLoadoutName: string;
};

export type FindCharacterSnapshotInput = {
  accountId: AccountId;
  characterId: CharacterId;
};

export type ArchiveCharacterInput = {
  accountId: AccountId;
  characterId: CharacterId;
};

export type UpdateCharacterResourcesInput = {
  accountId: AccountId;
  characterId: CharacterId;
  resources: CharacterResources;
};

export interface CharacterRepository {
  createCharacterGraph(
    input: CreateCharacterGraphInput
  ): Promise<CharacterSnapshot>;

  listByAccount(
    accountId: AccountId
  ): Promise<readonly CharacterSummary[]>;

  findSnapshotById(
    input: FindCharacterSnapshotInput
  ): Promise<CharacterSnapshot | null>;

  archive(
    input: ArchiveCharacterInput
  ): Promise<CharacterSummary | null>;

  updateResources(
    input: UpdateCharacterResourcesInput
  ): Promise<boolean>;
}