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
};

export type MonsterDiscoveryDetailsRecord =
  MonsterDiscoveryRecord & {
    description: string;
  };

export type FindMonsterInput = {
  accountId: AccountId;
  characterId: CharacterId;
  monsterCode: MonsterCode;
};

export type ListMonstersInput = {
  accountId: AccountId;
  characterId: CharacterId;
};

export interface MonsterDiscoveryRepository {
  listMonsters(
    input: ListMonstersInput
  ): Promise<readonly MonsterDiscoveryRecord[]>;

  findMonster(
    input: FindMonsterInput
  ): Promise<MonsterDiscoveryDetailsRecord | null>;
}
