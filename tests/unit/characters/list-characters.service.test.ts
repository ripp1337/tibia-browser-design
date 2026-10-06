import { describe, expect, it, vi } from "vitest";

import type { CharacterRepository } from "../../../src/modules/characters/application/character.repository.js";
import { ListCharactersService } from "../../../src/modules/characters/application/list-characters.service.js";
import type { CharacterSummary } from "../../../src/modules/characters/domain/character.types.js";

function createRepositoryMock(): CharacterRepository {
  return {
    createCharacterGraph: vi.fn(),
    listByAccount: vi.fn(),
    findSnapshotById: vi.fn(),
    archive: vi.fn(),
    updateResources: vi.fn(),
  };
}

const createdAt = new Date("2026-10-06T12:00:00.000Z");
const updatedAt = new Date("2026-10-06T12:05:00.000Z");

function createCharacterSummary(
  overrides: Partial<CharacterSummary> = {}
): CharacterSummary {
  return {
    characterId: "character-1",
    accountId: "account-1",
    seasonId: null,
    name: "Sir Jakub",
    status: "IsActive",
    level: 1,
    experience: 0n,
    createdAt,
    updatedAt,
    ...overrides,
  };
}

describe("ListCharactersService", () => {
  it("returns characters belonging to the account", async () => {
    const repository = createRepositoryMock();

    const characters = [
      createCharacterSummary(),
      createCharacterSummary({
        characterId: "character-2",
        name: "Archived Hero",
        status: "Archived",
      }),
    ];

    vi.mocked(
      repository.listByAccount
    ).mockResolvedValue(characters);

    const service = new ListCharactersService(repository);

    const result = await service.execute({
      accountId: "account-1",
    });

    expect(result).toBe(characters);

    expect(
      repository.listByAccount
    ).toHaveBeenCalledOnce();

    expect(
      repository.listByAccount
    ).toHaveBeenCalledWith("account-1");
  });

  it("returns an empty list when the account has no characters", async () => {
    const repository = createRepositoryMock();

    vi.mocked(
      repository.listByAccount
    ).mockResolvedValue([]);

    const service = new ListCharactersService(repository);

    await expect(
      service.execute({
        accountId: "account-1",
      })
    ).resolves.toEqual([]);
  });

  it("propagates repository errors", async () => {
    const repository = createRepositoryMock();
    const repositoryError = new Error("Repository failed");

    vi.mocked(
      repository.listByAccount
    ).mockRejectedValue(repositoryError);

    const service = new ListCharactersService(repository);

    await expect(
      service.execute({
        accountId: "account-1",
      })
    ).rejects.toBe(repositoryError);
  });
});