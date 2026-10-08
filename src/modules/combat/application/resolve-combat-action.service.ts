import type {
  Clock,
} from "../../../application/ports/clock.js";
import type {
  RandomSource,
} from "../ports/random-source.js";
import {
  COMBAT_STATUS,
} from "../domain/combat.constants.js";
import {
  resolveCombatAction,
} from "../domain/combat-engine.js";
import {
  CombatTurnMismatchError,
} from "./combat-session.errors.js";
import {
  PERSISTENT_COMBAT_DEFEAT_REASON,
  PERSISTENT_COMBAT_STATUS,
  type CombatSessionView,
  type ResolveCombatActionInput,
} from "./combat-session.models.js";
import type {
  CombatSessionRepository,
} from "./combat-session.repository.js";

export class ResolveCombatActionService {
  public constructor(
    private readonly repository:
      CombatSessionRepository,
    private readonly randomSource:
      RandomSource,
    private readonly clock: Clock
  ) {}

  public async execute(
    input: ResolveCombatActionInput
  ): Promise<CombatSessionView> {
    const observedAt = this.clock.now();

    return this.repository.withActionTransaction(
      {
        accountId: input.accountId,
        characterId: input.characterId,
        observedAt,
      },
      async (transaction) => {
        const currentTurn =
          transaction.locked.combatState.turn;

        if (
          input.expectedTurn !==
          currentTurn
        ) {
          throw new CombatTurnMismatchError(
            input.expectedTurn,
            currentTurn
          );
        }

        const resolution =
          resolveCombatAction(
            transaction.locked.combatState,
            input.action,
            this.randomSource
          );

        await transaction.persistAction({
          state: resolution.state,
          resolvedTurn: currentTurn,
          events: resolution.events,
          observedAt,
        });

        const persistentStatus =
          resolution.state.status ===
          COMBAT_STATUS.inProgress
            ? PERSISTENT_COMBAT_STATUS.active
            : resolution.state.status ===
                COMBAT_STATUS.playerVictory
              ? PERSISTENT_COMBAT_STATUS.victory
              : PERSISTENT_COMBAT_STATUS.defeat;

        const defeatReason =
          resolution.state.defeatReason === null
            ? null
            : resolution.state.defeatReason ===
                PERSISTENT_COMBAT_DEFEAT_REASON
                  .playerHealthDepleted
              ? PERSISTENT_COMBAT_DEFEAT_REASON
                  .playerHealthDepleted
              : PERSISTENT_COMBAT_DEFEAT_REASON
                  .turnLimitExceeded;

        return {
          ...transaction.locked.session,
          status: persistentStatus,
          defeatReason,
          currentTurn:
            resolution.state.turn,
          player: {
            ...transaction.locked.session.player,
            currentHealth:
              resolution.state.player
                .currentHealth,
          },
          monster: {
            ...transaction.locked.session.monster,
            currentHealth:
              resolution.state.monster
                .currentHealth,
          },
          endedAt:
            resolution.state.status ===
            COMBAT_STATUS.inProgress
              ? null
              : observedAt,
          events: resolution.events,
        };
      }
    );
  }
}
