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
  rewards: {
    monsterExperienceReward: bigint;
    monsterGoldMinimum: bigint;
    monsterGoldMaximum: bigint;
  };
  startedAt: Date;
  endedAt: Date | null;
  settledAt: Date | null;
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

export type CombatSettlementOutcome =
  | "Victory"
  | "Defeat";

export type CombatSettlementExperience = {
  before: bigint;
  awarded: bigint;
  lost: bigint;
  after: bigint;
};

export type CombatSettlementGold = {
  before: bigint;
  baseRolled: bigint;
  awarded: bigint;
  after: bigint;
};

export type CombatSettlementLevel = {
  before: number;
  after: number;
  levelsChanged: number;
};

export type CombatSettlementBestiary = {
  discovered: boolean;
  killCount: bigint | null;
};

export type CombatSettlementTaskBoss = {
  progressed: boolean;
  status: string | null;
};

export type CombatSettlementCooldown = {
  applied: boolean;
  availableAt: Date | null;
};

export type CombatSettlementDailyBoss = {
  updated: boolean;
  victoryRecorded: boolean;
};

export type CombatSettlementStatistics = {
  damageDealt: bigint;
  damageTaken: bigint;
  highestPhysicalHit: bigint;
};

export type CombatFinalSummary = {
  combatSessionId: CombatSessionId;
  outcome: CombatSettlementOutcome;
  turnCount: number;
  startedAt: Date;
  endedAt: Date;
};

export type CombatSettlement = {
  outcome: CombatSettlementOutcome;
  experience: CombatSettlementExperience;
  gold: CombatSettlementGold;
  level: CombatSettlementLevel;
  blessingConsumed: boolean;
  bestiary: CombatSettlementBestiary;
  taskBoss: CombatSettlementTaskBoss;
  cooldown: CombatSettlementCooldown;
  dailyBoss: CombatSettlementDailyBoss;
  statistics: CombatSettlementStatistics;
  finalSummary: CombatFinalSummary;
};

export type CombatSessionView = CombatSessionSnapshot & {
  events: readonly CombatEvent[];
  settlement: CombatSettlement | null;
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
