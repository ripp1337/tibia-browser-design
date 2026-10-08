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

export interface CombatActionTransaction {
  readonly locked:
    LockedCombatSession;

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
