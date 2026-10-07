import type {
  MonsterEligibility,
} from "./monster.types.js";

export function calculateLevelEligibility(
  characterLevel: number,
  monsterLevel: number
): MonsterEligibility {
  if (characterLevel >= monsterLevel) {
    return {
      isEligible: true,
      reasons: [],
    };
  }

  return {
    isEligible: false,
    reasons: ["LEVEL_TOO_LOW"],
  };
}
