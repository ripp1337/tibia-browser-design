import {
  CombatSessionNotFoundError,
} from "./combat-session.errors.js";
import type {
  CombatSessionRepository,
} from "./combat-session.repository.js";
import type {
  CombatSessionView,
  GetCombatSessionInput,
} from "./combat-session.models.js";

export class GetCombatSessionService {
  public constructor(
    private readonly repository:
      CombatSessionRepository
  ) {}

  public async execute(
    input: GetCombatSessionInput
  ): Promise<CombatSessionView> {
    const session =
      await this.repository.findSession(input);

    if (session === null) {
      throw new CombatSessionNotFoundError();
    }

    return {
      ...session,
      events: [],
      settlement: null,
    };
  }
}
