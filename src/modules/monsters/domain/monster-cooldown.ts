export type MonsterCooldown = {
  isActive: boolean;
  availableAt: Date | null;
};

function assertValidDate(
  value: Date,
  fieldName: string
): void {
  if (
    !(value instanceof Date) ||
    Number.isNaN(value.getTime())
  ) {
    throw new Error(
      `${fieldName} must contain a valid date.`
    );
  }
}

export function calculateMonsterCooldown(
  availableAt: Date | null,
  now: Date
): MonsterCooldown {
  assertValidDate(now, "now");

  if (availableAt === null) {
    return {
      isActive: false,
      availableAt: null,
    };
  }

  assertValidDate(
    availableAt,
    "availableAt"
  );

  return {
    isActive:
      availableAt.getTime() > now.getTime(),
    availableAt,
  };
}
