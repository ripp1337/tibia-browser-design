import type {
  EffectiveCharacterStatistics,
} from "../../characters/domain/effective-character-statistics.js";
import type {
  CharacterResources,
} from "../../characters/domain/character.types.js";
import type {
  MonsterEligibility,
  MonsterType,
} from "../../monsters/domain/monster.types.js";
import type {
  CombatEventLog,
  CombatSessionSnapshot,
  CombatSettlement,
  GetActiveCombatInput,
  GetCombatSessionInput,
  PersistedCombatEvent,
} from "./combat-session.models.js";
import type {
  CombatEvent,
  CombatState,
} from "../domain/combat.types.js";

export type CombatStartTransactionInput = {
  accountId: string;
  characterId: string;
  observedAt: Date;
};

export type LockedCombatCharacter = {
  characterId: string;
  accountId: string;
  level: number;
  resources: CharacterResources;
};

export type CombatStartMonster = {
  monsterId: string;
  monsterCode: string;
  monsterType: MonsterType;
  level: number;
  energyCost: number;
  experienceReward: bigint;
  goldMinimum: bigint;
  goldMaximum: bigint;
  maximumHealth: number;
  attack: number;
  defense: number;
  eligibility: MonsterEligibility;
};

export type CreateCombatSessionInput = {
  characterId: string;
  monsterId: string;
  characterHealth: number;
  characterMana: number;
  characterMaximumHealth: number;
  characterAttack: number;
  characterDefense: number;
  monsterMaximumHealth: number;
  monsterAttack: number;
  monsterDefense: number;
  monsterExperienceReward: bigint;
  monsterGoldMinimum: bigint;
  monsterGoldMaximum: bigint;
  startedAt: Date;
};

export interface CombatStartTransaction {
  readonly character:
    LockedCombatCharacter;

  hasActiveCombat(): Promise<boolean>;

  findMonster(
    monsterCode: string
  ): Promise<CombatStartMonster | null>;

  calculateCharacterStatistics():
    Promise<EffectiveCharacterStatistics>;

  updateCharacterResources(
    resources: CharacterResources
  ): Promise<void>;

  createCombatSession(
    input: CreateCombatSessionInput
  ): Promise<CombatSessionSnapshot>;
}

export type CombatActionTransactionInput = {
  accountId: string;
  characterId: string;
  observedAt: Date;
};

export type LockedCombatSession = {
  session: CombatSessionSnapshot;
  combatState: CombatState;
};

export type PersistCombatActionInput = {
  state: CombatState;
  resolvedTurn: number;
  events: readonly CombatEvent[];
  observedAt: Date;
};

export type CombatSettlementCharacter = {
  characterId: string;
  level: number;
  experience: bigint;
  gold: bigint;
  resources: CharacterResources;
};

export type CombatSettlementStatistics = {
  totalGoldEarned: bigint;
  highestGoldOwned: bigint;
  totalMonstersKilled: bigint;
  totalBossesKilled: bigint;
  totalDailyBossesKilled: bigint;
  totalDeaths: bigint;
  totalDamageDealt: bigint;
  totalDamageTaken: bigint;
  highestPhysicalHit: bigint;

  strongestMonsterKilledId:
    string | null;
  strongestMonsterPowerScore:
    bigint | null;

  strongestBossKilledId:
    string | null;
  strongestBossPowerScore:
    bigint | null;

  currentNoDeathStreak: bigint;
  longestNoDeathStreak: bigint;
};

export type CombatSettlementMonster = {
  monsterId: string;
  monsterType: MonsterType;
  powerScore: bigint;
  cooldownSeconds: number;
  bossId: string | null;
  bossType:
    | "MiniBoss"
    | "TaskBoss"
    | "DailyBoss"
    | null;
  additionalCooldownSeconds: number;
};

export type CombatSettlementTask = {
  monsterTaskId: string;
  progressMonsterId: string;
  taskBossId: string;
  requiredKills: bigint;
  currentProgress: bigint;
  currentStatus:
    | "ACTIVE"
    | "UNLOCKED"
    | "WAITING_FOR_REUNLOCK";
};

export type CombatSettlementDailyBoss = {
  dailyBossDefinitionId: string;
  dailyBossRotationId: string;
  tier: number;
  attemptsUsedInRotation: number;
  totalAttempts: bigint;
  totalVictories: bigint;
  highestTierDefeated: number | null;
};

export type CombatSettlementFightBuff = {
  characterBuffId: string;
  buffType: string;
  value: number;
  durationRemaining: number;
};

export type CombatSettlementContext = {
  character: CombatSettlementCharacter;
  promoted: boolean;
  blessed: boolean;
  statistics: CombatSettlementStatistics;
  rewardBonuses: {
    goldBonusPercent: number;
    experienceBonusPercent: number;
  };
  monster: CombatSettlementMonster;

  task: CombatSettlementTask | null;

  dailyBoss:
    CombatSettlementDailyBoss | null;

  fightBuffs:
    readonly CombatSettlementFightBuff[];

  events:
    readonly PersistedCombatEvent[];
};

export type ApplyVictorySettlementInput = {
  context: CombatSettlementContext;

  state: CombatState;
  resolvedTurn: number;
  events: readonly CombatEvent[];
  observedAt: Date;

  baseExperience: bigint;
  baseGold: bigint;

  experienceBonusBasisPoints: bigint;
  goldBonusBasisPoints: bigint;

  experienceAwarded: bigint;
  goldAwarded: bigint;

  experienceAfter: bigint;
  goldAfter: bigint;

  levelAfter: number;

  resourcesAfter: CharacterResources;

  damageDealt: bigint;
  damageTaken: bigint;
  highestPhysicalHit: bigint;

  strongestMonsterKilledIdAfter:
    string;
  strongestBossKilledIdAfter:
    string | null;

  statisticsAfter: {
    totalGoldEarned: bigint;
    highestGoldOwned: bigint;
    totalMonstersKilled: bigint;
    totalBossesKilled: bigint;
    totalDailyBossesKilled: bigint;
    totalDamageDealt: bigint;
    totalDamageTaken: bigint;
    highestPhysicalHit: bigint;
    currentNoDeathStreak: bigint;
    longestNoDeathStreak: bigint;
  };
};

export interface CombatActionTransaction {
  readonly locked:
    LockedCombatSession;

  loadSettlementContext():
    Promise<CombatSettlementContext>;

  applyVictorySettlement(
    input: ApplyVictorySettlementInput
  ): Promise<CombatSettlement>;

  persistAction(
    input: PersistCombatActionInput
  ): Promise<readonly PersistedCombatEvent[]>;
}

export interface CombatSessionRepository {
  withStartTransaction<TResult>(
    input: CombatStartTransactionInput,
    operation: (
      transaction: CombatStartTransaction
    ) => Promise<TResult>
  ): Promise<TResult>;

  withActionTransaction<TResult>(
    input: CombatActionTransactionInput,
    operation: (
      transaction: CombatActionTransaction
    ) => Promise<TResult>
  ): Promise<TResult>;

  findActiveSession(
    input: GetActiveCombatInput
  ): Promise<CombatSessionSnapshot | null>;

  findSession(
    input: GetCombatSessionInput
  ): Promise<CombatSessionSnapshot | null>;

  findEventLog(
    input: GetCombatSessionInput
  ): Promise<CombatEventLog | null>;
}
