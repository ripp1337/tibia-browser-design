import { CharacterResourceStateInvalidError } from "./character.errors.js";
import type {
  CharacterResources,
  ResourceRegenerationRates,
  ResourceRegenerationResult,
} from "./character.types.js";

const MILLISECONDS_PER_MINUTE = 60_000;

function assertNonNegativeSafeInteger(
  value: number,
  fieldName: string
): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new CharacterResourceStateInvalidError(
      `${fieldName} must be a non-negative safe integer.`
    );
  }
}

function assertResourcePair(
  current: number,
  maximum: number,
  resourceName: string
): void {
  assertNonNegativeSafeInteger(
    current,
    `current${resourceName}`
  );

  assertNonNegativeSafeInteger(
    maximum,
    `maximum${resourceName}`
  );

  if (current > maximum) {
    throw new CharacterResourceStateInvalidError(
      `Current ${resourceName.toLowerCase()} cannot exceed maximum ${resourceName.toLowerCase()}.`
    );
  }
}

function calculateRestoredAmount(
  current: number,
  maximum: number,
  ratePerMinute: number,
  elapsedWholeMinutes: number
): number {
  return Math.min(
    maximum - current,
    ratePerMinute * elapsedWholeMinutes
  );
}

function unchangedResult(
  resources: CharacterResources
): ResourceRegenerationResult {
  return {
    resources,
    elapsedWholeMinutes: 0,
    restoredHealth: 0,
    restoredMana: 0,
    restoredEnergy: 0,
    needsPersistence: false,
  };
}

export function regenerateCharacterResources(
  resources: CharacterResources,
  rates: ResourceRegenerationRates,
  now: Date
): ResourceRegenerationResult {
  assertResourcePair(
    resources.currentHealth,
    resources.maximumHealth,
    "Health"
  );

  assertResourcePair(
    resources.currentMana,
    resources.maximumMana,
    "Mana"
  );

  assertResourcePair(
    resources.currentEnergy,
    resources.maximumEnergy,
    "Energy"
  );

  assertNonNegativeSafeInteger(
    rates.healthPerMinute,
    "healthPerMinute"
  );

  assertNonNegativeSafeInteger(
    rates.manaPerMinute,
    "manaPerMinute"
  );

  assertNonNegativeSafeInteger(
    rates.energyPerMinute,
    "energyPerMinute"
  );

  const checkpointTime = resources.resourcesUpdatedAt.getTime();
  const currentTime = now.getTime();

  if (
    Number.isNaN(checkpointTime) ||
    Number.isNaN(currentTime)
  ) {
    throw new CharacterResourceStateInvalidError(
      "Resource timestamps must be valid dates."
    );
  }

  if (currentTime <= checkpointTime) {
    return unchangedResult(resources);
  }

  const elapsedWholeMinutes = Math.floor(
    (currentTime - checkpointTime) / MILLISECONDS_PER_MINUTE
  );

  if (elapsedWholeMinutes === 0) {
    return unchangedResult(resources);
  }

  const restoredHealth = calculateRestoredAmount(
    resources.currentHealth,
    resources.maximumHealth,
    rates.healthPerMinute,
    elapsedWholeMinutes
  );

  const restoredMana = calculateRestoredAmount(
    resources.currentMana,
    resources.maximumMana,
    rates.manaPerMinute,
    elapsedWholeMinutes
  );

  const restoredEnergy = calculateRestoredAmount(
    resources.currentEnergy,
    resources.maximumEnergy,
    rates.energyPerMinute,
    elapsedWholeMinutes
  );

  const processedThrough = new Date(
    checkpointTime +
      elapsedWholeMinutes * MILLISECONDS_PER_MINUTE
  );

  return {
    resources: {
      currentHealth:
        resources.currentHealth + restoredHealth,
      maximumHealth:
        resources.maximumHealth,

      currentMana:
        resources.currentMana + restoredMana,
      maximumMana:
        resources.maximumMana,

      currentEnergy:
        resources.currentEnergy + restoredEnergy,
      maximumEnergy:
        resources.maximumEnergy,

      resourcesUpdatedAt: processedThrough,
    },

    elapsedWholeMinutes,

    restoredHealth,
    restoredMana,
    restoredEnergy,

    needsPersistence: true,
  };
}