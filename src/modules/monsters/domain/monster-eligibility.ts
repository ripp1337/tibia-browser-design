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
};

function assertPositiveLevel(
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

export function calculateLevelEligibility(
  characterLevel: number,
  monsterLevel: number
): MonsterEligibility {
  assertPositiveLevel(
    characterLevel,
    "characterLevel"
  );

  assertPositiveLevel(
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

  if (input.cooldownActive) {
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
    }

    if (
      input.taskStatus ===
      TASK_STATUS.waitingForReunlock
    ) {
      reasons.push(
        "TASK_REUNLOCK_REQUIRED"
      );
    }
  }

  return {
    isEligible: reasons.length === 0,
    reasons,
  };
}
