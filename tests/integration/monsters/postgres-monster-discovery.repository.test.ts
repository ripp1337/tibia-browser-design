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
import { CharacterNotFoundError } from "../../../src/modules/characters/domain/character.errors.js";
import { PostgresCharacterRepository } from "../../../src/modules/characters/infrastructure/postgres-character.repository.js";
import { PostgresMonsterDiscoveryRepository } from "../../../src/modules/monsters/infrastructure/postgres-monster-discovery.repository.js";
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

const characterRepository =
  new PostgresCharacterRepository(testPool);

const monsterRepository =
  new PostgresMonsterDiscoveryRepository(testPool);

const createdAccountIds: string[] = [];

const observedAt = new Date(
  "2026-10-07T10:00:00.000Z"
);

async function createTrackedAccount(): Promise<TestAccount> {
  const account = await createTestAccount(testPool);

  createdAccountIds.push(account.accountId);

  return account;
}

async function createCharacter(
  accountId: string,
  name: string
) {
  return characterRepository.createCharacterGraph({
    accountId,
    seasonId: null,
    name,
    spellLoadoutName: "Default Spells",
    equipmentLoadoutName: "Default Equipment",
  });
}

describe(
  "PostgresMonsterDiscoveryRepository",
  () => {
    beforeAll(async () => {
      await testPool.query("SELECT 1");
    });

    afterEach(async () => {
      while (createdAccountIds.length > 0) {
        const accountId = createdAccountIds.pop();

        if (accountId) {
          await deleteTestAccount(
            testPool,
            accountId
          );
        }
      }
    });

    afterAll(async () => {
      await testPool.end();
    });

    it("lists monsters for an owned character", async () => {
      const account = await createTrackedAccount();

      const character = await createCharacter(
        account.accountId,
        "Monster Discovery Hero"
      );

      const monsters =
        await monsterRepository.listMonsters({
          accountId: account.accountId,
          characterId: character.characterId,
          observedAt,
        });

      expect(monsters.length).toBeGreaterThan(0);

      expect(monsters[0]).toMatchObject({
        code: expect.any(String),
        name: expect.any(String),
        level: expect.any(Number),
        monsterType: expect.any(String),
        energyCost: expect.any(Number),
        bestiaryVisible: false,
        cooldownAvailableAt: null,
      });
    });

    it(
      "returns character-specific Bestiary and cooldown state",
      async () => {
        const account =
          await createTrackedAccount();

        const character = await createCharacter(
          account.accountId,
          "Cooldown Discovery Hero"
        );

        const monsterResult =
          await testPool.query<{
            monster_id: string;
            code: string;
          }>(
            `
              SELECT
                monster_id,
                code
              FROM monsters
              ORDER BY level ASC, monster_id ASC
              LIMIT 1
            `
          );

        const monster = monsterResult.rows[0];

        if (!monster) {
          throw new Error(
            "Integration test requires at least one monster."
          );
        }

        const availableAt = new Date(
          "2030-01-01T12:00:00.000Z"
        );

        await testPool.query(
          `
            INSERT INTO bestiary_entries (
              character_id,
              monster_id
            )
            VALUES ($1, $2)
          `,
          [
            character.characterId,
            monster.monster_id,
          ]
        );

        await testPool.query(
          `
            INSERT INTO character_cooldowns (
              character_id,
              cooldown_type,
              target_id,
              available_at
            )
            VALUES ($1, 'Monster', $2, $3)
          `,
          [
            character.characterId,
            monster.monster_id,
            availableAt,
          ]
        );

        const details =
          await monsterRepository.findMonster({
            accountId: account.accountId,
            characterId: character.characterId,
          observedAt,
            monsterCode: monster.code,
          });

        expect(details).not.toBeNull();

        expect(details).toMatchObject({
          code: monster.code,
          bestiaryVisible: true,
        });

        expect(
          details?.cooldownAvailableAt
        ).toEqual(availableAt);
      }
    );

    it("loads monster details by stable code", async () => {
      const account = await createTrackedAccount();

      const character = await createCharacter(
        account.accountId,
        "Monster Details Hero"
      );

      const monsterResult =
        await testPool.query<{
          code: string;
          name: string;
        }>(
          `
            SELECT
              code,
              name
            FROM monsters
            ORDER BY level ASC, monster_id ASC
            LIMIT 1
          `
        );

      const monster = monsterResult.rows[0];

      if (!monster) {
        throw new Error(
          "Integration test requires at least one monster."
        );
      }

      const details =
        await monsterRepository.findMonster({
          accountId: account.accountId,
          characterId: character.characterId,
          observedAt,
          monsterCode: monster.code,
        });

      expect(details).toMatchObject({
        code: monster.code,
        name: monster.name,
        description: expect.any(String),
      });
    });

    it("returns null for an unknown monster code", async () => {
      const account = await createTrackedAccount();

      const character = await createCharacter(
        account.accountId,
        "Unknown Monster Hero"
      );

      const details =
        await monsterRepository.findMonster({
          accountId: account.accountId,
          characterId: character.characterId,
          observedAt,
          monsterCode: "unknown_monster_code",
        });

      expect(details).toBeNull();
    });

    it("rejects access through another account", async () => {
      const owner = await createTrackedAccount();
      const stranger = await createTrackedAccount();

      const character = await createCharacter(
        owner.accountId,
        "Private Monster Hero"
      );

      await expect(
        monsterRepository.listMonsters({
          accountId: stranger.accountId,
          characterId: character.characterId,
          observedAt,
        })
      ).rejects.toBeInstanceOf(
        CharacterNotFoundError
      );
    });
  }
);

