import { Pool } from "pg";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import { env } from "../../../src/config/env.js";
import { PostgresCharacterRepository } from "../../../src/modules/characters/infrastructure/postgres-character.repository.js";
import {
  createTestAccount,
  deleteTestAccount,
  type TestAccount,
} from "../../helpers/test-account.js";

const testPool = new Pool({
  host: env.database.host,
  port: env.database.port,
  database: env.database.name,
  user: env.database.user,
  password: env.database.password,
  max: 2,
  idleTimeoutMillis: 5_000,
  connectionTimeoutMillis: 5_000,
});

const repository = new PostgresCharacterRepository(testPool);

const createdAccountIds: string[] = [];

async function createTrackedTestAccount(): Promise<TestAccount> {
  const account = await createTestAccount(testPool);

  createdAccountIds.push(account.accountId);

  return account;
}

describe("PostgresCharacterRepository", () => {
  beforeAll(async () => {
    await testPool.query("SELECT 1");
  });

  afterEach(async () => {
    while (createdAccountIds.length > 0) {
      const accountId = createdAccountIds.pop();

      if (accountId) {
        await deleteTestAccount(testPool, accountId);
      }
    }
  });

  afterAll(async () => {
    await testPool.end();
  });
  it("creates a complete character graph", async () => {
    const account = await createTrackedTestAccount();

    const snapshot = await repository.createCharacterGraph({
      accountId: account.accountId,
      seasonId: null,
      name: "Integration Hero",
      spellLoadoutName: "Default Spells",
      equipmentLoadoutName: "Default Equipment",
    });

    expect(snapshot.accountId).toBe(account.accountId);
    expect(snapshot.name).toBe("Integration Hero");
    expect(snapshot.status).toBe("IsActive");

    expect(snapshot.progression).toEqual({
      level: 1,
      experience: 0n,
      gold: 0n,
      craftingLevel: 1,
      craftingExperience: 0n,
      gatheringLevel: 1,
      gatheringExperience: 0n,
    });

    expect(snapshot.resources).toMatchObject({
      currentHealth: 180,
      maximumHealth: 180,
      currentMana: 35,
      maximumMana: 35,
      currentEnergy: 100,
      maximumEnergy: 100,
    });

    expect(snapshot.unlocks).toEqual({
      promoted: false,
      spellSlots: 1,
      craftingSlots: 1,
      inventorySlots: 50,
    });

    expect(snapshot.baseStatistics).toEqual({
      attack: 7,
      defense: 7,
      spellPower: 100,
    });

    const graphCounts = await testPool.query<{
      statistics_count: string;
      unlocks_count: string;
      mastery_count: string;
      spell_loadouts_count: string;
      equipment_loadouts_count: string;
    }>(
      `
        SELECT
          (
            SELECT COUNT(*)::text
            FROM character_statistics
            WHERE character_id = $1
          ) AS statistics_count,
          (
            SELECT COUNT(*)::text
            FROM character_unlocks
            WHERE character_id = $1
          ) AS unlocks_count,
          (
            SELECT COUNT(*)::text
            FROM character_spell_mastery
            WHERE character_id = $1
          ) AS mastery_count,
          (
            SELECT COUNT(*)::text
            FROM character_loadouts
            WHERE character_id = $1
              AND is_default = TRUE
          ) AS spell_loadouts_count,
          (
            SELECT COUNT(*)::text
            FROM equipment_loadouts
            WHERE character_id = $1
              AND is_default = TRUE
          ) AS equipment_loadouts_count
      `,
      [snapshot.characterId]
    );

    expect(graphCounts.rows[0]).toEqual({
      statistics_count: "1",
      unlocks_count: "1",
      mastery_count: "1",
      spell_loadouts_count: "1",
      equipment_loadouts_count: "1",
    });
  });
  it("lists, loads, updates and archives a character", async () => {
    const account = await createTrackedTestAccount();

    const created = await repository.createCharacterGraph({
      accountId: account.accountId,
      seasonId: null,
      name: "Repository Hero",
      spellLoadoutName: "Default Spells",
      equipmentLoadoutName: "Default Equipment",
    });

    const listed = await repository.listByAccount(
      account.accountId
    );

    expect(listed).toHaveLength(1);
    expect(listed[0]?.characterId).toBe(
      created.characterId
    );

    const loaded = await repository.findSnapshotById({
      accountId: account.accountId,
      characterId: created.characterId,
    });

    expect(loaded?.characterId).toBe(
      created.characterId
    );

    const resourcesUpdatedAt = new Date(
      "2026-10-06T12:00:00.000Z"
    );

    const updated = await repository.updateResources({
      accountId: account.accountId,
      characterId: created.characterId,
      resources: {
        currentHealth: 120,
        maximumHealth: 180,
        currentMana: 25,
        maximumMana: 35,
        currentEnergy: 80,
        maximumEnergy: 100,
        resourcesUpdatedAt,
      },
    });

    expect(updated).toBe(true);

    const afterUpdate = await repository.findSnapshotById({
      accountId: account.accountId,
      characterId: created.characterId,
    });

    expect(afterUpdate?.resources).toEqual({
      currentHealth: 120,
      maximumHealth: 180,
      currentMana: 25,
      maximumMana: 35,
      currentEnergy: 80,
      maximumEnergy: 100,
      resourcesUpdatedAt,
    });

    const archived = await repository.archive({
      accountId: account.accountId,
      characterId: created.characterId,
    });

    expect(archived?.status).toBe("Archived");

    const afterArchive = await repository.findSnapshotById({
      accountId: account.accountId,
      characterId: created.characterId,
    });

    expect(afterArchive?.status).toBe("Archived");
  });

  it("rejects a fourth active character", async () => {
    const account = await createTrackedTestAccount();

    for (const name of [
      "Limit Hero One",
      "Limit Hero Two",
      "Limit Hero Three",
    ]) {
      await repository.createCharacterGraph({
        accountId: account.accountId,
        seasonId: null,
        name,
        spellLoadoutName: "Default Spells",
        equipmentLoadoutName: "Default Equipment",
      });
    }

    await expect(
      repository.createCharacterGraph({
        accountId: account.accountId,
        seasonId: null,
        name: "Limit Hero Four",
        spellLoadoutName: "Default Spells",
        equipmentLoadoutName: "Default Equipment",
      })
    ).rejects.toMatchObject({
      code: "CHARACTER_LIMIT_REACHED",
    });

    const characters = await repository.listByAccount(
      account.accountId
    );

    expect(characters).toHaveLength(3);
  });

  it("rejects a duplicate normalized character name", async () => {
    const firstAccount = await createTrackedTestAccount();
    const secondAccount = await createTrackedTestAccount();

    await repository.createCharacterGraph({
      accountId: firstAccount.accountId,
      seasonId: null,
      name: "Normalized Hero",
      spellLoadoutName: "Default Spells",
      equipmentLoadoutName: "Default Equipment",
    });

    await expect(
      repository.createCharacterGraph({
        accountId: secondAccount.accountId,
        seasonId: null,
        name: "  normalized hero  ",
        spellLoadoutName: "Default Spells",
        equipmentLoadoutName: "Default Equipment",
      })
    ).rejects.toMatchObject({
      code: "CHARACTER_NAME_TAKEN",
    });

    const secondAccountCharacters =
      await repository.listByAccount(
        secondAccount.accountId
      );

    expect(secondAccountCharacters).toHaveLength(0);
  });

  it("prevents access through another account", async () => {
    const owner = await createTrackedTestAccount();
    const stranger = await createTrackedTestAccount();

    const character = await repository.createCharacterGraph({
      accountId: owner.accountId,
      seasonId: null,
      name: "Private Hero",
      spellLoadoutName: "Default Spells",
      equipmentLoadoutName: "Default Equipment",
    });

    const foreignSnapshot =
      await repository.findSnapshotById({
        accountId: stranger.accountId,
        characterId: character.characterId,
      });

    expect(foreignSnapshot).toBeNull();

    const foreignArchive = await repository.archive({
      accountId: stranger.accountId,
      characterId: character.characterId,
    });

    expect(foreignArchive).toBeNull();

    const foreignUpdate =
      await repository.updateResources({
        accountId: stranger.accountId,
        characterId: character.characterId,
        resources: {
          currentHealth: 1,
          maximumHealth: 180,
          currentMana: 1,
          maximumMana: 35,
          currentEnergy: 1,
          maximumEnergy: 100,
          resourcesUpdatedAt: new Date(
            "2026-10-06T12:00:00.000Z"
          ),
        },
      });

    expect(foreignUpdate).toBe(false);

    const ownerSnapshot =
      await repository.findSnapshotById({
        accountId: owner.accountId,
        characterId: character.characterId,
      });

    expect(ownerSnapshot?.status).toBe("IsActive");
    expect(ownerSnapshot?.resources.currentHealth).toBe(180);
    expect(ownerSnapshot?.resources.currentMana).toBe(35);
    expect(ownerSnapshot?.resources.currentEnergy).toBe(100);
  });

  it("rolls back the entire graph when a dependent insert fails", async () => {
    const account = await createTrackedTestAccount();

    const maximumLengthResult = await testPool.query<{
      character_maximum_length: number | null;
    }>(
      `
        SELECT character_maximum_length
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'character_loadouts'
          AND column_name = 'name'
      `
    );

    const maximumLength =
      maximumLengthResult.rows[0]?.character_maximum_length;

    if (
      maximumLength === null ||
      maximumLength === undefined
    ) {
      throw new Error(
        "character_loadouts.name must have a maximum length for this rollback test."
      );
    }

    const invalidLoadoutName = "X".repeat(
      maximumLength + 1
    );

    await expect(
      repository.createCharacterGraph({
        accountId: account.accountId,
        seasonId: null,
        name: "Rollback Hero",
        spellLoadoutName: invalidLoadoutName,
        equipmentLoadoutName: "Default Equipment",
      })
    ).rejects.toBeDefined();

    const graphCounts = await testPool.query<{
      characters_count: string;
      statistics_count: string;
      unlocks_count: string;
      mastery_count: string;
      spell_loadouts_count: string;
      equipment_loadouts_count: string;
    }>(
      `
        SELECT
          (
            SELECT COUNT(*)::text
            FROM characters
            WHERE account_id = $1
          ) AS characters_count,
          (
            SELECT COUNT(*)::text
            FROM character_statistics AS s
            INNER JOIN characters AS c
              ON c.character_id = s.character_id
            WHERE c.account_id = $1
          ) AS statistics_count,
          (
            SELECT COUNT(*)::text
            FROM character_unlocks AS u
            INNER JOIN characters AS c
              ON c.character_id = u.character_id
            WHERE c.account_id = $1
          ) AS unlocks_count,
          (
            SELECT COUNT(*)::text
            FROM character_spell_mastery AS m
            INNER JOIN characters AS c
              ON c.character_id = m.character_id
            WHERE c.account_id = $1
          ) AS mastery_count,
          (
            SELECT COUNT(*)::text
            FROM character_loadouts AS l
            INNER JOIN characters AS c
              ON c.character_id = l.character_id
            WHERE c.account_id = $1
          ) AS spell_loadouts_count,
          (
            SELECT COUNT(*)::text
            FROM equipment_loadouts AS e
            INNER JOIN characters AS c
              ON c.character_id = e.character_id
            WHERE c.account_id = $1
          ) AS equipment_loadouts_count
      `,
      [account.accountId]
    );

    expect(graphCounts.rows[0]).toEqual({
      characters_count: "0",
      statistics_count: "0",
      unlocks_count: "0",
      mastery_count: "0",
      spell_loadouts_count: "0",
      equipment_loadouts_count: "0",
    });
  });

  it("frees an active-character slot after archiving", async () => {
    const account = await createTrackedTestAccount();

    const first = await repository.createCharacterGraph({
      accountId: account.accountId,
      seasonId: null,
      name: "Archive Slot One",
      spellLoadoutName: "Default Spells",
      equipmentLoadoutName: "Default Equipment",
    });

    await repository.createCharacterGraph({
      accountId: account.accountId,
      seasonId: null,
      name: "Archive Slot Two",
      spellLoadoutName: "Default Spells",
      equipmentLoadoutName: "Default Equipment",
    });

    await repository.createCharacterGraph({
      accountId: account.accountId,
      seasonId: null,
      name: "Archive Slot Three",
      spellLoadoutName: "Default Spells",
      equipmentLoadoutName: "Default Equipment",
    });

    const archived = await repository.archive({
      accountId: account.accountId,
      characterId: first.characterId,
    });

    expect(archived?.status).toBe("Archived");

    const replacement =
      await repository.createCharacterGraph({
        accountId: account.accountId,
        seasonId: null,
        name: "Archive Slot Four",
        spellLoadoutName: "Default Spells",
        equipmentLoadoutName: "Default Equipment",
      });

    expect(replacement.status).toBe("IsActive");

    const characters = await repository.listByAccount(
      account.accountId
    );

    const activeCharacters = characters.filter(
      (character) => character.status === "IsActive"
    );

    const archivedCharacters = characters.filter(
      (character) => character.status === "Archived"
    );

    expect(activeCharacters).toHaveLength(3);
    expect(archivedCharacters).toHaveLength(1);
  });
});