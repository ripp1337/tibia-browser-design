import type {
  MonsterDetails,
  MonsterDiscoveryRepository,
  FindMonsterInput,
} from "./monster-discovery.repository.js";
import {
  MonsterNotFoundError,
} from "../domain/monster.errors.js";

export class GetMonsterDetailsService {
  public constructor(
    private readonly repository:
      MonsterDiscoveryRepository
  ) {}

  public async execute(
    input: FindMonsterInput
  ): Promise<MonsterDetails> {
    const monster =
      await this.repository.findMonster(input);

    if (!monster) {
      throw new MonsterNotFoundError();
    }

    return monster;
  }
}
