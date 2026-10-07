import type { RandomSource } from "../ports/random-source.js";
import {
  validateRandomFloat,
  validateRandomInteger,
} from "./combat-validation.js";
import type {
  Combatant,
} from "./combat.types.js";

export type DamageRange = {
  minimum: number;
  maximum: number;
};

export type AttackResult = {
  hit: boolean;
  damage: number;
};

export function calculateHitChancePercent(
  attack: number,
  defense: number
): number {
  return Math.min(
    90,
    Math.max(5, (attack - defense) * 4)
  );
}

export function calculateDamageRange(
  attack: number,
  defense: number
): DamageRange {
  const difference = attack - defense;

  return {
    minimum: Math.max(0, difference),
    maximum: Math.max(0, difference * 2),
  };
}

export function resolveBasicAttack(
  attacker: Combatant,
  defender: Combatant,
  randomSource: RandomSource
): AttackResult {
  const hitChancePercent =
    calculateHitChancePercent(
      attacker.attack,
      defender.defense
    );

  const hitRoll = randomSource.nextFloat();

  validateRandomFloat(hitRoll);

  const hit =
    hitRoll * 100 < hitChancePercent;

  if (!hit) {
    return {
      hit: false,
      damage: 0,
    };
  }

  const damageRange =
    calculateDamageRange(
      attacker.attack,
      defender.defense
    );

  const damage = randomSource.nextInt(
    damageRange.minimum,
    damageRange.maximum
  );

  validateRandomInteger(
    damage,
    damageRange.minimum,
    damageRange.maximum
  );

  return {
    hit: true,
    damage,
  };
}
