import { describe, expect, it, vi } from "vitest";

import type { Clock } from "../../../src/application/ports/clock.js";
import { GetCharacterSnapshotService } from "../../../src/modules/characters/application/get-character-snapshot.service.js";
import type { CharacterRepository } from "../../../src/modules/characters/application/character.repository.js";
import { CharacterNotFoundError } from "../../../src/modules/characters/domain/character.errors.js";
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

function createClock(now: Date): Clock {
  return {
    now: vi.fn(() => now),
  };
}

function createSnapshot(
  overrides: Partial<CharacterSnapshot> = {}
): CharacterSnapshot {
  const createdAt = new Date("2026-10-06T10:00:00.000Z");

  return {
    characterId: "character-1",
    accountId: "account-1",
    seasonId: null,
    name: "Snapshot Hero",
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
      currentHealth: 100,
      maximumHealth: 180,
      currentMana: 20,
      maximumMana: 35,
      currentEnergy: 90,
      maximumEnergy: 100,
      resourcesUpdatedAt: createdAt,
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

    createdAt,
    updatedAt: createdAt,

    ...overrides,
  };
}

describe("GetCharacterSnapshotService", () => {
  it("regenerates and persists active-character resources", async () => {
    const repository = createRepositoryMock();
    const snapshot = createSnapshot();
    const now = new Date("2026-10-06T10:05:30.000Z");

    vi.mocked(
      repository.findSnapshotById
    ).mockResolvedValue(snapshot);

    vi.mocked(
      repository.updateResources
    ).mockResolvedValue(true);

    const service = new GetCharacterSnapshotService(
      repository,
      createClock(now),
      {
        healthPerMinute: 2,
        manaPerMinute: 1,
        energyPerMinute: 1,
      }
    );

    const result = await service.execute({
      accountId: "account-1",
      characterId: "character-1",
    });

    expect(result.resources).toEqual({
      currentHealth: 110,
      maximumHealth: 180,
      currentMana: 25,
      maximumMana: 35,
      currentEnergy: 95,
      maximumEnergy: 100,
      resourcesUpdatedAt: new Date(
        "2026-10-06T10:05:00.000Z"
      ),
    });

    expect(repository.updateResources).toHaveBeenCalledWith({
      accountId: "account-1",
      characterId: "character-1",
      resources: result.resources,
    });
  });

  it("does not persist when no complete minute elapsed", async () => {
    const repository = createRepositoryMock();
    const snapshot = createSnapshot();

    vi.mocked(
      repository.findSnapshotById
    ).mockResolvedValue(snapshot);

    const service = new GetCharacterSnapshotService(
      repository,
      createClock(
        new Date("2026-10-06T10:00:30.000Z")
      ),
      {
        healthPerMinute: 2,
        manaPerMinute: 1,
        energyPerMinute: 1,
      }
    );

    const result = await service.execute({
      accountId: "account-1",
      characterId: "character-1",
    });

    expect(result).toBe(snapshot);
    expect(repository.updateResources).not.toHaveBeenCalled();
  });

  it("does not regenerate an archived character", async () => {
    const repository = createRepositoryMock();

    const snapshot = createSnapshot({
      status: "Archived",
    });

    vi.mocked(
      repository.findSnapshotById
    ).mockResolvedValue(snapshot);

    const clock = createClock(
      new Date("2026-10-06T12:00:00.000Z")
    );

    const service = new GetCharacterSnapshotService(
      repository,
      clock,
      {
        healthPerMinute: 2,
        manaPerMinute: 1,
        energyPerMinute: 1,
      }
    );

    const result = await service.execute({
      accountId: "account-1",
      characterId: "character-1",
    });

    expect(result).toBe(snapshot);
    expect(clock.now).not.toHaveBeenCalled();
    expect(repository.updateResources).not.toHaveBeenCalled();
  });

  it("throws when the character cannot be found", async () => {
    const repository = createRepositoryMock();

    vi.mocked(
      repository.findSnapshotById
    ).mockResolvedValue(null);

    const service = new GetCharacterSnapshotService(
      repository,
      createClock(
        new Date("2026-10-06T12:00:00.000Z")
      )
    );

    await expect(
      service.execute({
        accountId: "account-1",
        characterId: "missing-character",
      })
    ).rejects.toBeInstanceOf(CharacterNotFoundError);

    expect(repository.updateResources).not.toHaveBeenCalled();
  });

  it("throws when regenerated resources cannot be persisted", async () => {
    const repository = createRepositoryMock();

    vi.mocked(
      repository.findSnapshotById
    ).mockResolvedValue(createSnapshot());

    vi.mocked(
      repository.updateResources
    ).mockResolvedValue(false);

    const service = new GetCharacterSnapshotService(
      repository,
      createClock(
        new Date("2026-10-06T10:05:00.000Z")
      ),
      {
        healthPerMinute: 2,
        manaPerMinute: 1,
        energyPerMinute: 1,
      }
    );

    await expect(
      service.execute({
        accountId: "account-1",
        characterId: "character-1",
      })
    ).rejects.toBeInstanceOf(CharacterNotFoundError);
  });
});