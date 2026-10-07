import type {
  AccountId,
  CharacterId,
} from "../../characters/domain/character.types.js";
import type {
  MonsterCode,
  MonsterType,
} from "../domain/monster.types.js";

export type MonsterListItem = {
  code: MonsterCode;
  name: string;
  level: number;

  monsterType: MonsterType;
  energyCost: number;

  bestiaryVisible: boolean;

  cooldownAvailableAt: Date | null;
};

export type MonsterDetails = MonsterListItem & {
  description: string | null;
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
  ): Promise<readonly MonsterListItem[]>;

  findMonster(
    input: FindMonsterInput
  ): Promise<MonsterDetails | null>;
}
