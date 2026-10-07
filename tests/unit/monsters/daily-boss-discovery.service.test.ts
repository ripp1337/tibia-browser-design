import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  Clock,
} from "../../../src/application/ports/clock.js";
import { GetMonsterDetailsService } from "../../../src/modules/monsters/application/get-monster-details.service.js";
import { GetMonsterListService } from "../../../src/modules/monsters/application/get-monster-list.service.js";
import type {
  FindMonsterInput,
  ListMonstersInput,
  MonsterDiscoveryDetailsRecord,
  MonsterDiscoveryRecord,
  MonsterDiscoveryRepository,
} from "../../../src/modules/monsters/application/monster-discovery.repository.js";

class FakeMonsterDiscoveryRepository
  implements MonsterDiscoveryRepository
{
  public constructor(
    private readonly record:
      MonsterDiscoveryDetailsRecord
  ) {}

  public async listMonsters(
    input: ListMonstersInput
  ): Promise<
    readonly MonsterDiscoveryRecord[]
  > {
    void input;

    return [this.record];
  }

  public async findMonster(
    input: FindMonsterInput
  ): Promise<
    MonsterDiscoveryDetailsRecord | null
  > {
    void input;

    return this.record;
  }
}

function createClock(): Clock {
  return {
    now: () =>
      new Date(
        "2026-10-07T10:00:00.000Z"
      ),
  };
}

function createDailyBossRecord(
  overrides: Partial<
    MonsterDiscoveryDetailsRecord
  > = {}
): MonsterDiscoveryDetailsRecord {
  return {
    code: "daily_dragon",
    name: "Daily Dragon",

    description:
      "A rotating Daily Boss.",

    level: 20,
    monsterType: "DailyBoss",
    energyCost: 20,

    characterLevel: 20,
    bestiaryVisible: false,
    cooldownAvailableAt: null,

    taskStatus: null,

    dailyBossAvailable: true,
    dailyAttemptsUsed: 0,
    dailyAttemptsPerDay: 1,

    ...overrides,
  };
}

const listInput: ListMonstersInput = {
  accountId: "account-1",
  characterId: "character-1",
};

const detailsInput: FindMonsterInput = {
  ...listInput,
  monsterCode: "daily_dragon",
};

describe(
  "Daily Boss discovery services",
  () => {
    it("allows an active Daily Boss with a remaining attempt", async () => {
      const repository =
        new FakeMonsterDiscoveryRepository(
          createDailyBossRecord()
        );

      const service =
        new GetMonsterListService(
          repository,
          createClock()
        );

      const result =
        await service.execute(listInput);

      expect(result[0]).toMatchObject({
        code: "daily_dragon",

        eligibility: {
          isEligible: true,
          reasons: [],
        },
      });
    });

    it("reports an unavailable Daily Boss", async () => {
      const repository =
        new FakeMonsterDiscoveryRepository(
          createDailyBossRecord({
            dailyBossAvailable: false,
          })
        );

      const service =
        new GetMonsterDetailsService(
          repository,
          createClock()
        );

      const result =
        await service.execute(
          detailsInput
        );

      expect(result).toMatchObject({
        eligibility: {
          isEligible: false,

          reasons: [
            "DAILY_BOSS_UNAVAILABLE",
          ],
        },
      });
    });

    it("reports exhausted Daily Boss attempts", async () => {
      const repository =
        new FakeMonsterDiscoveryRepository(
          createDailyBossRecord({
            dailyAttemptsUsed: 1,
            dailyAttemptsPerDay: 1,
          })
        );

      const service =
        new GetMonsterDetailsService(
          repository,
          createClock()
        );

      const result =
        await service.execute(
          detailsInput
        );

      expect(result).toMatchObject({
        eligibility: {
          isEligible: false,

          reasons: [
            "DAILY_ATTEMPTS_EXHAUSTED",
          ],
        },
      });
    });

    it("ignores ordinary cooldown when evaluating a Daily Boss", async () => {
      const repository =
        new FakeMonsterDiscoveryRepository(
          createDailyBossRecord({
            cooldownAvailableAt: new Date(
              "2026-10-07T11:00:00.000Z"
            ),
          })
        );

      const service =
        new GetMonsterDetailsService(
          repository,
          createClock()
        );

      const result =
        await service.execute(
          detailsInput
        );

      expect(result).toMatchObject({
        eligibility: {
          isEligible: true,
          reasons: [],
        },

        cooldown: {
          isActive: true,
        },
      });
    });
  }
);
