import type {
  AccountId,
  CharacterId,
} from "../../characters/domain/character.types.js";
import type {
  MonsterCode,
  MonsterType,
  TaskStatus,
} from "../domain/monster.types.js";

export type MonsterDiscoveryRecord = {
  code: MonsterCode;
  name: string;
  level: number;

  monsterType: MonsterType;
  energyCost: number;

  characterLevel: number;
  bestiaryVisible: boolean;
  cooldownAvailableAt: Date | null;

  taskStatus: TaskStatus | null;

  dailyBossAvailable?: boolean;
  dailyAttemptsUsed?: number;
  dailyAttemptsPerDay?: number;
};

export type MonsterDiscoveryDetailsRecord =
  MonsterDiscoveryRecord & {
    description: string;
  };

export type ListMonstersInput = {
  accountId: AccountId;
  characterId: CharacterId;
};

export type FindMonsterInput = {
  accountId: AccountId;
  characterId: CharacterId;
  monsterCode: MonsterCode;
};

export type ListMonsterRecordsInput =
  ListMonstersInput & {
    observedAt: Date;
  };

export type FindMonsterRecordInput =
  FindMonsterInput & {
    observedAt: Date;
  };

export interface MonsterDiscoveryRepository {
  listMonsters(
    input: ListMonsterRecordsInput
  ): Promise<readonly MonsterDiscoveryRecord[]>;

  findMonster(
    input: FindMonsterRecordInput
  ): Promise<MonsterDiscoveryDetailsRecord | null>;
}
