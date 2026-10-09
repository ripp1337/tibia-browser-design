import type {
  Clock,
} from "../../../application/ports/clock.js";
import type {
  RandomSource,
} from "../ports/random-source.js";
import {
  planDefeatSettlement,
} from "../../progression/domain/defeat-settlement.js";
import {
  planVictorySettlement,
} from "../../progression/domain/victory-settlement.js";
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

        let settlement = null;

        if (
          resolution.state.status ===
          COMBAT_STATUS.playerVictory
        ) {
          const victoryContext =
            await transaction
              .loadSettlementContext();

          const completeEvents = [
            ...victoryContext.events.map(
              (event) => event.event
            ),
            ...resolution.events,
          ];

          const victoryPlan =
            planVictorySettlement(
              transaction.locked.session,
              victoryContext,
              resolution.state.player
                .currentHealth,
              completeEvents,
              this.randomSource
            );

          settlement =
            await transaction
              .applyVictorySettlement({
                context:
                  victoryContext,
                state:
                  resolution.state,
                resolvedTurn:
                  currentTurn,
                events:
                  resolution.events,
                observedAt,

                baseExperience:
                  victoryPlan.baseExperience,
                baseGold:
                  victoryPlan.baseGold,

                experienceBonusBasisPoints:
                  victoryPlan
                    .experienceBonusBasisPoints,
                goldBonusBasisPoints:
                  victoryPlan
                    .goldBonusBasisPoints,

                experienceAwarded:
                  victoryPlan
                    .experienceAwarded,
                goldAwarded:
                  victoryPlan
                    .goldAwarded,

                experienceAfter:
                  victoryPlan
                    .experienceAfter,
                goldAfter:
                  victoryPlan.goldAfter,

                levelAfter:
                  victoryPlan.levelAfter,

                resourcesAfter: {
                  ...victoryPlan
                    .resourcesAfter,
                  resourcesUpdatedAt:
                    observedAt,
                },

                damageDealt:
                  victoryPlan.damageDealt,
                damageTaken:
                  victoryPlan.damageTaken,
                highestPhysicalHit:
                  victoryPlan
                    .highestPhysicalHit,

                strongestMonsterKilledIdAfter:
                  victoryPlan
                    .strongestMonsterKilledIdAfter,

                strongestBossKilledIdAfter:
                  victoryPlan
                    .strongestBossKilledIdAfter,

                statisticsAfter:
                  victoryPlan
                    .statisticsAfter,
              });
        } else if (
          resolution.state.status ===
          COMBAT_STATUS.playerDefeat
        ) {
          if (
            resolution.state.defeatReason ===
            null
          ) {
            throw new Error(
              "Terminal Defeat state requires a defeat reason."
            );
          }

          const defeatContext =
            await transaction
              .loadSettlementContext();

          const completeEvents = [
            ...defeatContext.events.map(
              (event) => event.event
            ),
            ...resolution.events,
          ];

          const defeatPlan =
            planDefeatSettlement(
              defeatContext,
              resolution.state.player
                .currentHealth,
              resolution.state.defeatReason,
              completeEvents
            );

          settlement =
            await transaction
              .applyDefeatSettlement({
                context:
                  defeatContext,

                state:
                  resolution.state,

                resolvedTurn:
                  currentTurn,

                events:
                  resolution.events,

                observedAt,

                lossPercent:
                  defeatPlan.lossPercent,

                experienceLost:
                  defeatPlan
                    .experienceLost,

                experienceAfter:
                  defeatPlan
                    .experienceAfter,

                goldAfter:
                  defeatPlan.goldAfter,

                levelAfter:
                  defeatPlan.levelAfter,

                resourcesAfter: {
                  ...defeatPlan
                    .resourcesAfter,

                  resourcesUpdatedAt:
                    observedAt,
                },

                blessingConsumed:
                  defeatPlan
                    .blessingConsumed,

                damageDealt:
                  defeatPlan.damageDealt,

                damageTaken:
                  defeatPlan.damageTaken,

                highestPhysicalHit:
                  defeatPlan
                    .highestPhysicalHit,

                statisticsAfter:
                  defeatPlan
                    .statisticsAfter,
              });
        } else {
          await transaction.persistAction({
            state: resolution.state,
            resolvedTurn: currentTurn,
            events: resolution.events,
            observedAt,
          });
        }

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
          settledAt:
            resolution.state.status ===
            COMBAT_STATUS.inProgress
              ? null
              : observedAt,
          events: resolution.events,
          settlement,
        };
      }
    );
  }
}
