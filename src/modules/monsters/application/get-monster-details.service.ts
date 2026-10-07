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
  calculateMonsterEligibility,
} from "../domain/monster-eligibility.js";
import type {
  FindMonsterInput,
  MonsterDiscoveryRepository,
} from "./monster-discovery.repository.js";
import type {
  MonsterDetails,
} from "./monster-discovery.models.js";

export class GetMonsterDetailsService {
  public constructor(
    private readonly repository:
      MonsterDiscoveryRepository,

    private readonly clock: Clock
  ) {}

  public async execute(
    input: FindMonsterInput
  ): Promise<MonsterDetails> {
    const observedAt = this.clock.now();

    const record =
      await this.repository.findMonster({
        ...input,
        observedAt,
      });

    if (!record) {
      throw new MonsterNotFoundError();
    }

    const cooldown =
      calculateMonsterCooldown(
        record.cooldownAvailableAt,
        observedAt
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
          monsterType:
            record.monsterType,

          cooldownActive:
            cooldown.isActive,

          taskStatus:
            record.taskStatus,

          dailyBossAvailable:
            record.dailyBossAvailable,

          dailyAttemptsUsed:
            record.dailyAttemptsUsed,

          dailyAttemptsPerDay:
            record.dailyAttemptsPerDay,
        }),

      cooldown,

      bestiaryVisible:
        record.bestiaryVisible,

      description: record.description,
    };
  }
}
