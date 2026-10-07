import type {
  CombatEvent,
  CombatState,
  PlayerAction,
} from "../domain/combat.types.js";

export const PERSISTENT_COMBAT_STATUS = {
  active: "Active",
  victory: "Victory",
  defeat: "Defeat",
  abandoned: "Abandoned",
} as const;

export const PERSISTENT_COMBAT_DEFEAT_REASON = {
  playerHealthDepleted: "PlayerHealthDepleted",
  turnLimitExceeded: "TurnLimitExceeded",
} as const;

export type CombatSessionId = string;

export type PersistentCombatStatus =
  (typeof PERSISTENT_COMBAT_STATUS)[keyof typeof PERSISTENT_COMBAT_STATUS];

export type PersistentCombatDefeatReason =
  (typeof PERSISTENT_COMBAT_DEFEAT_REASON)[keyof typeof PERSISTENT_COMBAT_DEFEAT_REASON];

export type CombatSessionCombatantSnapshot = {
  currentHealth: number;
  maximumHealth: number;
  attack: number;
  defense: number;
};

export type CombatSessionSnapshot = {
  combatSessionId: CombatSessionId;
  characterId: string;
  monsterId: string;
  monsterCode: string;
  status: PersistentCombatStatus;
  defeatReason: PersistentCombatDefeatReason | null;
  currentTurn: number;
  player: CombatSessionCombatantSnapshot;
  monster: CombatSessionCombatantSnapshot;
  startedAt: Date;
  endedAt: Date | null;
};

export type PersistedCombatEvent = {
  combatSessionEventId: string;
  combatSessionId: CombatSessionId;
  turnNumber: number;
  eventOrder: number;
  eventType: string;
  event: CombatEvent;
  createdAt: Date;
};

export type CombatSessionView = CombatSessionSnapshot & {
  events: readonly CombatEvent[];
};

export type StartCombatInput = {
  accountId: string;
  characterId: string;
  monsterCode: string;
};

export type ResolveCombatActionInput = {
  accountId: string;
  characterId: string;
  expectedTurn: number;
  action: PlayerAction;
};

export type GetActiveCombatInput = {
  accountId: string;
  characterId: string;
};

export type GetCombatSessionInput = {
  accountId: string;
  characterId: string;
  combatSessionId: CombatSessionId;
};

export type CombatEventLog = {
  combatSessionId: CombatSessionId;
  events: readonly PersistedCombatEvent[];
};

export type PersistentCombatState = {
  session: CombatSessionSnapshot;
  combatState: CombatState;
};
