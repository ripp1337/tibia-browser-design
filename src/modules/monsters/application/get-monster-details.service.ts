import type {
  Clock,
} from "../../../application/ports/clock.js";
import {
  MonsterNotFoundError,
} from "../domain/monster.errors.js";
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
  FindMonsterInput,
  MonsterDiscoveryRepository,
} from "./monster-discovery.repository.js";
import type {
  MonsterDetails,
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

export class GetMonsterDetailsService {
  public constructor(
    private readonly repository:
      MonsterDiscoveryRepository,
    private readonly clock: Clock
  ) {}

  public async execute(
    input: FindMonsterInput
  ): Promise<MonsterDetails> {
    const record =
      await this.repository.findMonster(input);

    if (!record) {
      throw new MonsterNotFoundError();
    }

    const cooldown =
      calculateMonsterCooldown(
        record.cooldownAvailableAt,
        this.clock.now()
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

      description: record.description,
    };
  }
}
