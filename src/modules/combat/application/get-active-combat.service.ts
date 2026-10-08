import {
  CombatSessionNotFoundError,
} from "./combat-session.errors.js";
import type {
  CombatSessionRepository,
} from "./combat-session.repository.js";
import type {
  CombatSessionView,
  GetActiveCombatInput,
} from "./combat-session.models.js";

export class GetActiveCombatService {
  public constructor(
    private readonly repository:
      CombatSessionRepository
  ) {}

  public async execute(
    input: GetActiveCombatInput
  ): Promise<CombatSessionView> {
    const session =
      await this.repository.findActiveSession(
        input
      );

    if (session === null) {
      throw new CombatSessionNotFoundError();
    }

    return {
      ...session,
      events: [],
    };
  }
}
