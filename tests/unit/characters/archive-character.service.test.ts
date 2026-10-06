import { describe, expect, it, vi } from "vitest";

import { ArchiveCharacterService } from "../../../src/modules/characters/application/archive-character.service.js";
import type { CharacterRepository } from "../../../src/modules/characters/application/character.repository.js";
import { CharacterNotFoundError } from "../../../src/modules/characters/domain/character.errors.js";
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

function createArchivedSummary(): CharacterSummary {
  const createdAt = new Date("2026-10-06T10:00:00.000Z");
  const updatedAt = new Date("2026-10-06T12:00:00.000Z");

  return {
    characterId: "character-1",
    accountId: "account-1",
    seasonId: null,
    name: "Archived Hero",
    status: "Archived",
    level: 1,
    experience: 0n,
    createdAt,
    updatedAt,
  };
}

describe("ArchiveCharacterService", () => {
  it("archives a character belonging to the account", async () => {
    const repository = createRepositoryMock();
    const archived = createArchivedSummary();

    vi.mocked(repository.archive).mockResolvedValue(
      archived
    );

    const service = new ArchiveCharacterService(repository);

    const result = await service.execute({
      accountId: "account-1",
      characterId: "character-1",
    });

    expect(result).toBe(archived);

    expect(repository.archive).toHaveBeenCalledOnce();

    expect(repository.archive).toHaveBeenCalledWith({
      accountId: "account-1",
      characterId: "character-1",
    });
  });

  it("throws when the character cannot be archived", async () => {
    const repository = createRepositoryMock();

    vi.mocked(repository.archive).mockResolvedValue(null);

    const service = new ArchiveCharacterService(repository);

    await expect(
      service.execute({
        accountId: "account-1",
        characterId: "missing-character",
      })
    ).rejects.toBeInstanceOf(CharacterNotFoundError);
  });

  it("propagates repository errors", async () => {
    const repository = createRepositoryMock();
    const repositoryError = new Error("Repository failed");

    vi.mocked(repository.archive).mockRejectedValue(
      repositoryError
    );

    const service = new ArchiveCharacterService(repository);

    await expect(
      service.execute({
        accountId: "account-1",
        characterId: "character-1",
      })
    ).rejects.toBe(repositoryError);
  });
});