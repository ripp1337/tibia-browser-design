import type {
  Clock,
} from "../../../application/ports/clock.js";
import {
  calculateMonsterCooldown,
} from "../domain/monster-cooldown.js";
import {
  calculateLevelEligibility,
} from "../domain/monster-eligibility.js";
import type {
  MonsterEligibility,
} from "../domain/monster.types.js";
import type {
  ListMonstersInput,
  MonsterDiscoveryRecord,
  MonsterDiscoveryRepository,
} from "./monster-discovery.repository.js";
import type {
  MonsterListItem,
} from "./monster-discovery.models.js";

function combineEligibility(
  levelEligibility: MonsterEligibility,
  cooldownActive: boolean
): MonsterEligibility {
  const reasons = [
    ...levelEligibility.reasons,
  ];

  if (cooldownActive) {
    reasons.push("COOLDOWN_ACTIVE");
  }

  return {
    isEligible: reasons.length === 0,
    reasons,
  };
}

function mapMonsterListItem(
  record: MonsterDiscoveryRecord,
  now: Date
): MonsterListItem {
  const cooldown =
    calculateMonsterCooldown(
      record.cooldownAvailableAt,
      now
    );

  const levelEligibility =
    calculateLevelEligibility(
      record.characterLevel,
      record.level
    );

  return {
    code: record.code,
    name: record.name,
    level: record.level,

    monsterType: record.monsterType,
    energyCost: record.energyCost,

    eligibility: combineEligibility(
      levelEligibility,
      cooldown.isActive
    ),

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
