import { describe, expect, it, vi } from "vitest";

import { CreateCharacterService } from "../../../src/modules/characters/application/create-character.service.js";
import type { CharacterRepository } from "../../../src/modules/characters/application/character.repository.js";
import { CharacterNameInvalidError } from "../../../src/modules/characters/domain/character.errors.js";
import type { CharacterSnapshot } from "../../../src/modules/characters/domain/character.types.js";

function createRepositoryMock(): CharacterRepository {
  return {
    createCharacterGraph: vi.fn(),
    listByAccount: vi.fn(),
    findSnapshotById: vi.fn(),
    archive: vi.fn(),
    updateResources: vi.fn(),
  };
}

function createSnapshot(): CharacterSnapshot {
  const now = new Date("2026-10-06T12:00:00.000Z");

  return {
    characterId: "character-1",
    accountId: "account-1",
    seasonId: null,
    name: "Sir Jakub",
    status: "IsActive",

    progression: {
      level: 1,
      experience: 0n,
      gold: 0n,
      craftingLevel: 1,
      craftingExperience: 0n,
      gatheringLevel: 1,
      gatheringExperience: 0n,
    },

    resources: {
      currentHealth: 180,
      maximumHealth: 180,
      currentMana: 35,
      maximumMana: 35,
      currentEnergy: 100,
      maximumEnergy: 100,
      resourcesUpdatedAt: now,
    },

    baseStatistics: {
      attack: 7,
      defense: 7,
      spellPower: 100,
    },

    unlocks: {
      promoted: false,
      spellSlots: 1,
      craftingSlots: 1,
      inventorySlots: 50,
    },

    createdAt: now,
    updatedAt: now,
  };
}

describe("CreateCharacterService", () => {
  it("normalizes the name and creates the character graph", async () => {
    const repository = createRepositoryMock();
    const snapshot = createSnapshot();

    vi.mocked(
      repository.createCharacterGraph
    ).mockResolvedValue(snapshot);

    const service = new CreateCharacterService(repository);

    const result = await service.execute({
      accountId: "account-1",
      seasonId: null,
      name: "   Sir    Jakub   ",
    });

    expect(result).toBe(snapshot);

    expect(
      repository.createCharacterGraph
    ).toHaveBeenCalledOnce();

    expect(
      repository.createCharacterGraph
    ).toHaveBeenCalledWith({
      accountId: "account-1",
      seasonId: null,
      name: "Sir Jakub",
      spellLoadoutName: "Default Spells",
      equipmentLoadoutName: "Default Equipment",
    });
  });

  it("preserves the season identifier", async () => {
    const repository = createRepositoryMock();

    vi.mocked(
      repository.createCharacterGraph
    ).mockResolvedValue(
      createSnapshot()
    );

    const service = new CreateCharacterService(repository);

    await service.execute({
      accountId: "account-1",
      seasonId: "season-1",
      name: "Season Hero",
    });

    expect(
      repository.createCharacterGraph
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        seasonId: "season-1",
      })
    );
  });

  it("rejects an invalid name without calling the repository", async () => {
    const repository = createRepositoryMock();
    const service = new CreateCharacterService(repository);

    await expect(
      service.execute({
        accountId: "account-1",
        seasonId: null,
        name: "A",
      })
    ).rejects.toBeInstanceOf(CharacterNameInvalidError);

    expect(
      repository.createCharacterGraph
    ).not.toHaveBeenCalled();
  });

  it("propagates repository errors", async () => {
    const repository = createRepositoryMock();
    const repositoryError = new Error("Repository failed");

    vi.mocked(
      repository.createCharacterGraph
    ).mockRejectedValue(repositoryError);

    const service = new CreateCharacterService(repository);

    await expect(
      service.execute({
        accountId: "account-1",
        seasonId: null,
        name: "Valid Hero",
      })
    ).rejects.toBe(repositoryError);
  });
});