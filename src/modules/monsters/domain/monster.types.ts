export const MONSTER_TYPE = {
  normal: "Normal",
  miniBoss: "MiniBoss",
  taskBoss: "TaskBoss",
  dailyBoss: "DailyBoss",
} as const;

export type MonsterType =
  (typeof MONSTER_TYPE)[keyof typeof MONSTER_TYPE];

export const TASK_STATUS = {
  active: "ACTIVE",
  unlocked: "UNLOCKED",
  waitingForReunlock:
    "WAITING_FOR_REUNLOCK",
} as const;

export type TaskStatus =
  (typeof TASK_STATUS)[keyof typeof TASK_STATUS];

export type MonsterCode = string;

export type EligibilityReason =
  | "LEVEL_TOO_LOW"
  | "COOLDOWN_ACTIVE"
  | "TASK_PROGRESS_INCOMPLETE"
  | "TASK_REUNLOCK_REQUIRED"
  | "DAILY_BOSS_UNAVAILABLE"
  | "DAILY_ATTEMPTS_EXHAUSTED";

export type MonsterEligibility = {
  isEligible: boolean;
  reasons: readonly EligibilityReason[];
};
