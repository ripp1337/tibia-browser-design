import {
  MONSTER_TYPE,
  TASK_STATUS,
  type EligibilityReason,
  type MonsterEligibility,
  type MonsterType,
  type TaskStatus,
} from "./monster.types.js";

export type CalculateMonsterEligibilityInput = {
  characterLevel: number;
  monsterLevel: number;
  monsterType: MonsterType;

  cooldownActive: boolean;
  taskStatus: TaskStatus | null;

  dailyBossAvailable?: boolean;
  dailyAttemptsUsed?: number;
  dailyAttemptsPerDay?: number;
};

function assertPositiveInteger(
  value: number,
  fieldName: string
): void {
  if (
    !Number.isSafeInteger(value) ||
    value < 1
  ) {
    throw new Error(
      `${fieldName} must be a positive safe integer.`
    );
  }
}

function assertNonNegativeInteger(
  value: number,
  fieldName: string
): void {
  if (
    !Number.isSafeInteger(value) ||
    value < 0
  ) {
    throw new Error(
      `${fieldName} must be a non-negative safe integer.`
    );
  }
}

export function calculateLevelEligibility(
  characterLevel: number,
  monsterLevel: number
): MonsterEligibility {
  assertPositiveInteger(
    characterLevel,
    "characterLevel"
  );

  assertPositiveInteger(
    monsterLevel,
    "monsterLevel"
  );

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

export function calculateMonsterEligibility(
  input: CalculateMonsterEligibilityInput
): MonsterEligibility {
  const levelEligibility =
    calculateLevelEligibility(
      input.characterLevel,
      input.monsterLevel
    );

  const reasons: EligibilityReason[] = [
    ...levelEligibility.reasons,
  ];

  const usesStandardCooldown =
    input.monsterType ===
      MONSTER_TYPE.normal ||
    input.monsterType ===
      MONSTER_TYPE.miniBoss;

  if (
    usesStandardCooldown &&
    input.cooldownActive
  ) {
    reasons.push("COOLDOWN_ACTIVE");
  }

  if (
    input.monsterType ===
    MONSTER_TYPE.taskBoss
  ) {
    if (
      input.taskStatus === null ||
      input.taskStatus === TASK_STATUS.active
    ) {
      reasons.push(
        "TASK_PROGRESS_INCOMPLETE"
      );
    } else if (
      input.taskStatus ===
      TASK_STATUS.waitingForReunlock
    ) {
      reasons.push(
        "TASK_REUNLOCK_REQUIRED"
      );
    }
  }

  if (
    input.monsterType ===
    MONSTER_TYPE.dailyBoss
  ) {
    if (input.dailyBossAvailable !== true) {
      reasons.push(
        "DAILY_BOSS_UNAVAILABLE"
      );
    } else {
      const attemptsUsed =
        input.dailyAttemptsUsed ?? 0;

      const attemptsPerDay =
        input.dailyAttemptsPerDay;

      assertNonNegativeInteger(
        attemptsUsed,
        "dailyAttemptsUsed"
      );

      if (attemptsPerDay === undefined) {
        throw new Error(
          "dailyAttemptsPerDay is required for an available Daily Boss."
        );
      }

      assertPositiveInteger(
        attemptsPerDay,
        "dailyAttemptsPerDay"
      );

      if (
        attemptsUsed >= attemptsPerDay
      ) {
        reasons.push(
          "DAILY_ATTEMPTS_EXHAUSTED"
        );
      }
    }
  }

  return {
    isEligible: reasons.length === 0,
    reasons,
  };
}
