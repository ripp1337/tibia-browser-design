import type {
  MonsterCode,
  MonsterEligibility,
  MonsterType,
} from "../domain/monster.types.js";
import type {
  MonsterCooldown,
} from "../domain/monster-cooldown.js";

export type MonsterListItem = {
  code: MonsterCode;
  name: string;
  level: number;

  monsterType: MonsterType;
  energyCost: number;

  eligibility: MonsterEligibility;
  cooldown: MonsterCooldown;

  bestiaryVisible: boolean;
};

export type MonsterDetails = MonsterListItem & {
  description: string;
};
