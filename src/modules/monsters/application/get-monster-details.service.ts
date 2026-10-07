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
          taskStatus: record.taskStatus,
        }),

      cooldown,
      bestiaryVisible:
        record.bestiaryVisible,

      description: record.description,
    };
  }
}
