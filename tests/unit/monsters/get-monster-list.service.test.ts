import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  Clock,
} from "../../../src/application/ports/clock.js";
import { GetMonsterListService } from "../../../src/modules/monsters/application/get-monster-list.service.js";
import type {
  ListMonstersInput,
  MonsterDiscoveryRecord,
  MonsterDiscoveryRepository,
} from "../../../src/modules/monsters/application/monster-discovery.repository.js";

class FakeMonsterDiscoveryRepository
  implements MonsterDiscoveryRepository
{
  public constructor(
    private readonly records:
      readonly MonsterDiscoveryRecord[]
  ) {}

  public async listMonsters(
    input: ListMonstersInput
  ): Promise<readonly MonsterDiscoveryRecord[]> {
    void input;

    return this.records;
  }

  public async findMonster(): Promise<null> {
    return null;
  }
}

function createClock(now: Date): Clock {
  return {
    now: () => now,
  };
}

describe("GetMonsterListService", () => {
  const input: ListMonstersInput = {
    accountId: "account-1",
    characterId: "character-1",
  };

  it("maps eligible monster without cooldown", async () => {
    const repository =
      new FakeMonsterDiscoveryRepository([
        {
          code: "dev_monster_01",
          name: "Dev Monster 1",
          level: 10,
          monsterType: "Normal",
          energyCost: 5,
          characterLevel: 10,
          bestiaryVisible: false,
          cooldownAvailableAt: null,
        },
      ]);

    const service = new GetMonsterListService(
      repository,
      createClock(
        new Date("2026-10-07T10:00:00.000Z")
      )
    );

    await expect(
      service.execute(input)
    ).resolves.toEqual([
      {
        code: "dev_monster_01",
        name: "Dev Monster 1",
        level: 10,
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
        bestiaryVisible: false,
      },
    ]);
  });

  it("reports level and cooldown reasons together", async () => {
    const availableAt = new Date(
      "2026-10-07T11:00:00.000Z"
    );

    const repository =
      new FakeMonsterDiscoveryRepository([
        {
          code: "dev_monster_08",
          name: "Dev Monster 8",
          level: 8,
          monsterType: "MiniBoss",
          energyCost: 10,
          characterLevel: 7,
          bestiaryVisible: true,
          cooldownAvailableAt: availableAt,
        },
      ]);

    const service = new GetMonsterListService(
      repository,
      createClock(
        new Date("2026-10-07T10:00:00.000Z")
      )
    );

    const result = await service.execute(input);

    expect(result[0]).toMatchObject({
      eligibility: {
        isEligible: false,
        reasons: [
          "LEVEL_TOO_LOW",
          "COOLDOWN_ACTIVE",
        ],
      },
      cooldown: {
        isActive: true,
        availableAt,
      },
      bestiaryVisible: true,
    });
  });

  it("treats an expired cooldown as inactive", async () => {
    const availableAt = new Date(
      "2026-10-07T09:00:00.000Z"
    );

    const repository =
      new FakeMonsterDiscoveryRepository([
        {
          code: "dev_monster_08",
          name: "Dev Monster 8",
          level: 8,
          monsterType: "MiniBoss",
          energyCost: 10,
          characterLevel: 8,
          bestiaryVisible: false,
          cooldownAvailableAt: availableAt,
        },
      ]);

    const service = new GetMonsterListService(
      repository,
      createClock(
        new Date("2026-10-07T10:00:00.000Z")
      )
    );

    const result = await service.execute(input);

    expect(result[0]).toMatchObject({
      eligibility: {
        isEligible: true,
        reasons: [],
      },
      cooldown: {
        isActive: false,
        availableAt,
      },
    });
  });
});
