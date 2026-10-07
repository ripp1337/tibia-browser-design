import type {
  Clock,
} from "../../../application/ports/clock.js";
import {
  calculateMonsterCooldown,
} from "../domain/monster-cooldown.js";
import {
  calculateMonsterEligibility,
} from "../domain/monster-eligibility.js";
import type {
  ListMonstersInput,
  MonsterDiscoveryRecord,
  MonsterDiscoveryRepository,
} from "./monster-discovery.repository.js";
import type {
  MonsterListItem,
} from "./monster-discovery.models.js";

function mapMonsterListItem(
  record: MonsterDiscoveryRecord,
  now: Date
): MonsterListItem {
  const cooldown =
    calculateMonsterCooldown(
      record.cooldownAvailableAt,
      now
    );

  return {
    code: record.code,
    name: record.name,
    level: record.level,

    monsterType: record.monsterType,
    energyCost: record.energyCost,

    eligibility:
      calculateMonsterEligibility({
        characterLevel:
          record.characterLevel,
        monsterLevel: record.level,
        monsterType: record.monsterType,
        cooldownActive: cooldown.isActive,
        taskStatus: record.taskStatus,
      }),

    cooldown,
    bestiaryVisible:
      record.bestiaryVisible,
  };
}

export class GetMonsterListService {
  public constructor(
    private readonly repository:
      MonsterDiscoveryRepository,
    private readonly clock: Clock
  ) {}

  public async execute(
    input: ListMonstersInput
  ): Promise<readonly MonsterListItem[]> {
    const records =
      await this.repository.listMonsters(input);

    const now = this.clock.now();

    return records.map((record) =>
      mapMonsterListItem(record, now)
    );
  }
}
