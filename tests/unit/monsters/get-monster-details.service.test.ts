import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  Clock,
} from "../../../src/application/ports/clock.js";
import { GetMonsterDetailsService } from "../../../src/modules/monsters/application/get-monster-details.service.js";
import type {
  FindMonsterInput,
  MonsterDiscoveryDetailsRecord,
  MonsterDiscoveryRepository,
} from "../../../src/modules/monsters/application/monster-discovery.repository.js";
import { MonsterNotFoundError } from "../../../src/modules/monsters/domain/monster.errors.js";

class FakeMonsterDiscoveryRepository
  implements MonsterDiscoveryRepository
{
  public constructor(
    private readonly record:
      MonsterDiscoveryDetailsRecord | null
  ) {}

  public async listMonsters(): Promise<readonly []> {
    return [];
  }

  public async findMonster(
    input: FindMonsterInput
  ): Promise<MonsterDiscoveryDetailsRecord | null> {
    void input;

    return this.record;
  }
}

function createClock(now: Date): Clock {
  return {
    now: () => now,
  };
}

describe("GetMonsterDetailsService", () => {
  const input: FindMonsterInput = {
    accountId: "account-1",
    characterId: "character-1",
    monsterCode: "dev_monster_01",
  };

  it("returns public monster details", async () => {
    const repository =
      new FakeMonsterDiscoveryRepository({
        code: "dev_monster_01",
        name: "Dev Monster 1",
        description: "Synthetic development monster.",
        level: 1,
        monsterType: "Normal",
        energyCost: 5,
        characterLevel: 1,
        bestiaryVisible: true,
        cooldownAvailableAt: null,
          taskStatus: null,
      });

    const service = new GetMonsterDetailsService(
      repository,
      createClock(
        new Date("2026-10-07T10:00:00.000Z")
      )
    );

    await expect(
      service.execute(input)
    ).resolves.toEqual({
      code: "dev_monster_01",
      name: "Dev Monster 1",
      description:
        "Synthetic development monster.",
      level: 1,
      monsterType: "Normal",
      energyCost: 5,
      eligibility: {
        isEligible: true,
        reasons: [],
      },
      cooldown: {
        isActive: false,
        availableAt: null,
      },
      bestiaryVisible: true,
    });
  });

  it("uses the injected Clock for cooldown state", async () => {
    const availableAt = new Date(
      "2026-10-07T11:00:00.000Z"
    );

    const repository =
      new FakeMonsterDiscoveryRepository({
        code: "dev_monster_08",
        name: "Dev Monster 8",
        description: "Synthetic mini boss.",
        level: 8,
        monsterType: "MiniBoss",
        energyCost: 10,
        characterLevel: 8,
        bestiaryVisible: false,
        cooldownAvailableAt: availableAt,
          taskStatus: null,
      });

    const service = new GetMonsterDetailsService(
      repository,
      createClock(
        new Date("2026-10-07T10:00:00.000Z")
      )
    );

    const result = await service.execute({
      ...input,
      monsterCode: "dev_monster_08",
    });

    expect(result).toMatchObject({
      eligibility: {
        isEligible: false,
        reasons: ["COOLDOWN_ACTIVE"],
      },
      cooldown: {
        isActive: true,
        availableAt,
      },
    });
  });

  it("throws when monster does not exist", async () => {
    const repository =
      new FakeMonsterDiscoveryRepository(null);

    const service = new GetMonsterDetailsService(
      repository,
      createClock(
        new Date("2026-10-07T10:00:00.000Z")
      )
    );

    await expect(
      service.execute(input)
    ).rejects.toBeInstanceOf(
      MonsterNotFoundError
    );
  });
});

