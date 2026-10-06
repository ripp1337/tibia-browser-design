import { describe, expect, it, vi } from "vitest";

import type {
  CharacterRepository,
} from "../../../src/modules/characters/application/character.repository.js";

function createRepositoryMock(): CharacterRepository {
  return {
    createCharacterGraph: vi.fn(),
    listByAccount: vi.fn(),
    findSnapshotById: vi.fn(),
    archive: vi.fn(),
    updateResources: vi.fn(),
  };
}

describe("CharacterRepository contract", () => {
  it("contains every required persistence operation", () => {
    const repository = createRepositoryMock();

    expect(repository.createCharacterGraph).toBeTypeOf("function");
    expect(repository.listByAccount).toBeTypeOf("function");
    expect(repository.findSnapshotById).toBeTypeOf("function");
    expect(repository.archive).toBeTypeOf("function");
    expect(repository.updateResources).toBeTypeOf("function");
  });

  it("supports independent operation mocks", async () => {
    const repository = createRepositoryMock();

    vi.mocked(repository.listByAccount).mockResolvedValue([]);

    await expect(
      repository.listByAccount("account-id")
    ).resolves.toEqual([]);

    expect(repository.listByAccount).toHaveBeenCalledOnce();
    expect(repository.listByAccount).toHaveBeenCalledWith(
      "account-id"
    );
  });
});