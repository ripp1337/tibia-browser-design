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
  ): Promise<readonly MonsterDiscoveryRecord[]> {
    void input;

    return [this.record];
  }

  public async findMonster(
    input: FindMonsterInput
  ): Promise<MonsterDiscoveryDetailsRecord | null> {
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

function createTaskBossRecord(
  taskStatus:
    | "ACTIVE"
    | "UNLOCKED"
    | "WAITING_FOR_REUNLOCK"
): MonsterDiscoveryDetailsRecord {
  return {
    code: "rat_king",
    name: "Rat King",
    description:
      "Boss unlocked by defeating rats.",
    level: 10,
    monsterType: "TaskBoss",
    energyCost: 15,

    characterLevel: 10,
    bestiaryVisible: false,
    cooldownAvailableAt: null,

    taskStatus,
  };
}

const listInput: ListMonstersInput = {
  accountId: "account-1",
  characterId: "character-1",
};

const detailsInput: FindMonsterInput = {
  ...listInput,
  monsterCode: "rat_king",
};

describe(
  "Task Boss discovery services",
  () => {
    it("reports incomplete progress for ACTIVE status", async () => {
      const repository =
        new FakeMonsterDiscoveryRepository(
          createTaskBossRecord("ACTIVE")
        );

      const service =
        new GetMonsterListService(
          repository,
          createClock()
        );

      const result =
        await service.execute(listInput);

      expect(result[0]).toMatchObject({
        code: "rat_king",
        eligibility: {
          isEligible: false,
          reasons: [
            "TASK_PROGRESS_INCOMPLETE",
          ],
        },
      });
    });

    it("allows an UNLOCKED Task Boss", async () => {
      const repository =
        new FakeMonsterDiscoveryRepository(
          createTaskBossRecord("UNLOCKED")
        );

      const listService =
        new GetMonsterListService(
          repository,
          createClock()
        );

      const detailsService =
        new GetMonsterDetailsService(
          repository,
          createClock()
        );

      const listResult =
        await listService.execute(listInput);

      const detailsResult =
        await detailsService.execute(
          detailsInput
        );

      expect(listResult[0]).toMatchObject({
        eligibility: {
          isEligible: true,
          reasons: [],
        },
      });

      expect(detailsResult).toMatchObject({
        code: "rat_king",
        eligibility: {
          isEligible: true,
          reasons: [],
        },
      });
    });

    it("requires re-unlock after defeating the Task Boss", async () => {
      const repository =
        new FakeMonsterDiscoveryRepository(
          createTaskBossRecord(
            "WAITING_FOR_REUNLOCK"
          )
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
            "TASK_REUNLOCK_REQUIRED",
          ],
        },
      });
    });

    it("combines Task Boss, level and cooldown restrictions", async () => {
      const record = {
        ...createTaskBossRecord("ACTIVE"),
        level: 12,
        characterLevel: 10,
        cooldownAvailableAt: new Date(
          "2026-10-07T11:00:00.000Z"
        ),
      };

      const repository =
        new FakeMonsterDiscoveryRepository(
          record
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
            "LEVEL_TOO_LOW",
            "COOLDOWN_ACTIVE",
            "TASK_PROGRESS_INCOMPLETE",
          ],
        },
        cooldown: {
          isActive: true,
          availableAt:
            record.cooldownAvailableAt,
        },
      });
    });
  }
);
