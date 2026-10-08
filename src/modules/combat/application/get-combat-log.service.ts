import {
  CombatSessionNotFoundError,
} from "./combat-session.errors.js";
import type {
  CombatSessionRepository,
} from "./combat-session.repository.js";
import type {
  CombatEventLog,
  GetCombatSessionInput,
} from "./combat-session.models.js";

export class GetCombatLogService {
  public constructor(
    private readonly repository:
      CombatSessionRepository
  ) {}

  public async execute(
    input: GetCombatSessionInput
  ): Promise<CombatEventLog> {
    const log =
      await this.repository.findEventLog(input);

    if (log === null) {
      throw new CombatSessionNotFoundError();
    }

    return log;
  }
}
