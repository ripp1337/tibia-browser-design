import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  Clock,
} from "../../../src/application/ports/clock.js";
import {
  CharacterHealthDepletedError,
  InsufficientEnergyError,
  MonsterNotEligibleError,
} from "../../../src/modules/combat/application/combat-session.errors.js";
import {
  PERSISTENT_COMBAT_STATUS,
  type CombatSessionSnapshot,
} from "../../../src/modules/combat/application/combat-session.models.js";
import type {
  CombatSessionRepository,
  CombatStartMonster,
  CombatStartTransaction,
  LockedCombatCharacter,
} from "../../../src/modules/combat/application/combat-session.repository.js";
import {
  StartCombatService,
} from "../../../src/modules/combat/application/start-combat.service.js";
import {
  MONSTER_TYPE,
} from "../../../src/modules/monsters/domain/monster.types.js";

const observedAt = new Date(
  "2026-10-07T20:00:00.000Z"
);

const resourcesUpdatedAt = new Date(
  "2026-10-07T19:55:00.000Z"
);

function createCharacter(
  overrides: Partial<
    LockedCombatCharacter["resources"]
  > = {}
): LockedCombatCharacter {
  return {
    accountId: "account-1",
    characterId: "character-1",
    level: 10,
    resources: {
      currentHealth: 100,
      maximumHealth: 180,
      currentMana: 20,
      maximumMana: 35,
      currentEnergy: 10,
      maximumEnergy: 100,
      resourcesUpdatedAt,
      ...overrides,
    },
  };
}

function createSession():
CombatSessionSnapshot {
  return {
    combatSessionId: "session-1",
    characterId: "character-1",
    monsterId: "monster-1",
    monsterCode: "dev_rat",
    status:
      PERSISTENT_COMBAT_STATUS.active,
    defeatReason: null,
    currentTurn: 1,
    player: {
      currentHealth: 100,
      maximumHealth: 180,
      attack: 20,
      defense: 10,
    },
    monster: {
      currentHealth: 80,
      maximumHealth: 80,
      attack: 15,
      defense: 8,
    },
    rewards: {
      monsterExperienceReward: 50n,
      monsterGoldMinimum: 10n,
      monsterGoldMaximum: 20n,
    },
    startedAt: observedAt,
    endedAt: null,
    settledAt: null,
  };
}

function createFixture(
  character = createCharacter()
) {
  const findMonster = vi.fn<
    (
      monsterCode: string
    ) => Promise<CombatStartMonster | null>
  >(
    async () => ({
      monsterId: "monster-1",
      monsterCode: "dev_rat",
      monsterType: MONSTER_TYPE.normal,
      level: 1,
      energyCost: 3,
      experienceReward: 50n,
      goldMinimum: 10n,
      goldMaximum: 20n,
      maximumHealth: 80,
      attack: 15,
      defense: 8,
      eligibility: {
        isEligible: true,
        reasons: [],
      },
    })
  );

  const calculateCharacterStatistics =
    vi.fn(async () => ({
      attack: 20,
      defense: 10,
      spellPower: 100,
      maximumHealth: 180,
      maximumMana: 35,
      maximumEnergy: 100,
      goldBonusPercent: 0,
      experienceBonusPercent: 0,
    }));

  const consumeDailyBossAttempt =
    vi.fn(async () => undefined);

  const updateCharacterResources =
    vi.fn(async () => undefined);

  const createCombatSession =
    vi.fn(async () => createSession());

  const transaction:
  CombatStartTransaction = {
    character,
    hasActiveCombat:
      vi.fn(async () => false),
    findMonster,
    calculateCharacterStatistics,
    consumeDailyBossAttempt,
    updateCharacterResources,
    createCombatSession,
  };

  const withStartTransaction =
    vi.fn(async (
      _input,
      operation
    ) => operation(transaction));

  const repository:
  CombatSessionRepository = {
    withStartTransaction,
    withActionTransaction:
      vi.fn(async () => {
        throw new Error(
          "Action transaction is not used by StartCombatService tests."
        );
      }),
    findActiveSession:
      vi.fn(async () => null),
    findSession:
      vi.fn(async () => null),
    findEventLog:
      vi.fn(async () => null),
  };

  const clock: Clock = {
    now: vi.fn(() => observedAt),
  };

  const service =
    new StartCombatService(
      repository,
      clock
    );

  return {
    service,
    clock,
    transaction,
    withStartTransaction,
    findMonster,
    calculateCharacterStatistics,
    updateCharacterResources,
    createCombatSession,
  };
}

const input = {
  accountId: "account-1",
  characterId: "character-1",
  monsterCode: "dev_rat",
};

describe("StartCombatService", () => {
  it("starts combat and deducts Energy exactly once", async () => {
    const fixture = createFixture();

    const result =
      await fixture.service.execute(input);

    expect(fixture.clock.now).toHaveBeenCalledOnce();

    expect(
      fixture.withStartTransaction
    ).toHaveBeenCalledWith(
      {
        accountId: "account-1",
        characterId: "character-1",
        observedAt,
      },
      expect.any(Function)
    );

    expect(
      fixture.updateCharacterResources
    ).toHaveBeenCalledOnce();

    expect(
      fixture.updateCharacterResources
    ).toHaveBeenCalledWith({
      currentHealth: 100,
      maximumHealth: 180,
      currentMana: 20,
      maximumMana: 35,
      currentEnergy: 12,
      maximumEnergy: 100,
      resourcesUpdatedAt: observedAt,
    });

    expect(
      fixture.createCombatSession
    ).toHaveBeenCalledOnce();

    expect(
      fixture.createCombatSession
    ).toHaveBeenCalledWith({
      characterId: "character-1",
      monsterId: "monster-1",
      characterHealth: 100,
      characterMana: 20,
      characterMaximumHealth: 180,
      characterAttack: 20,
      characterDefense: 10,
      monsterMaximumHealth: 80,
      monsterAttack: 15,
      monsterDefense: 8,
      monsterExperienceReward: 50n,
      monsterGoldMinimum: 10n,
      monsterGoldMaximum: 20n,
      startedAt: observedAt,
    });

    expect(result.events).toEqual([]);
  });

  it("starts combat with partial positive Health", async () => {
    const fixture = createFixture(
      createCharacter({
        currentHealth: 50,
      })
    );

    await fixture.service.execute(input);

    expect(
      fixture.createCombatSession
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        characterHealth: 50,
      })
    );
  });

  it("uses regenerated Energy before validation", async () => {
    const fixture = createFixture(
      createCharacter({
        currentEnergy: 0,
        resourcesUpdatedAt:
          new Date(
            "2026-10-07T19:55:00.000Z"
          ),
      })
    );

    await fixture.service.execute(input);

    expect(
      fixture.updateCharacterResources
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        currentEnergy: 2,
        resourcesUpdatedAt: observedAt,
      })
    );
  });

  it("supports a zero Energy cost", async () => {
    const fixture = createFixture();

    fixture.findMonster.mockResolvedValueOnce({
      monsterId: "monster-1",
      monsterCode: "dev_rat",
      monsterType: MONSTER_TYPE.normal,
      level: 1,
      energyCost: 0,
      experienceReward: 50n,
      goldMinimum: 10n,
      goldMaximum: 20n,
      maximumHealth: 80,
      attack: 15,
      defense: 8,
      eligibility: {
        isEligible: true,
        reasons: [],
      },
    });

    await fixture.service.execute(input);

    expect(
      fixture.updateCharacterResources
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        currentEnergy: 15,
      })
    );
  });

  it("rejects insufficient Energy before calculating statistics", async () => {
    const fixture = createFixture(
      createCharacter({
        currentEnergy: 0,
        resourcesUpdatedAt: observedAt,
      })
    );

    await expect(
      fixture.service.execute(input)
    ).rejects.toBeInstanceOf(
      InsufficientEnergyError
    );

    expect(
      fixture.calculateCharacterStatistics
    ).not.toHaveBeenCalled();

    expect(
      fixture.updateCharacterResources
    ).not.toHaveBeenCalled();

    expect(
      fixture.createCombatSession
    ).not.toHaveBeenCalled();
  });

  it("rejects depleted Health", async () => {
    const fixture = createFixture(
      createCharacter({
        currentHealth: 0,
        resourcesUpdatedAt: observedAt,
      })
    );

    await expect(
      fixture.service.execute(input)
    ).rejects.toBeInstanceOf(
      CharacterHealthDepletedError
    );

    expect(
      fixture.updateCharacterResources
    ).not.toHaveBeenCalled();

    expect(
      fixture.createCombatSession
    ).not.toHaveBeenCalled();
  });

  it("rejects an unknown monster", async () => {
    const fixture = createFixture();

    fixture.findMonster.mockResolvedValueOnce(
      null
    );

    await expect(
      fixture.service.execute(input)
    ).rejects.toBeInstanceOf(
      MonsterNotEligibleError
    );

    expect(
      fixture.calculateCharacterStatistics
    ).not.toHaveBeenCalled();

    expect(
      fixture.updateCharacterResources
    ).not.toHaveBeenCalled();
  });

  it("rejects an ineligible monster", async () => {
    const fixture = createFixture();

    fixture.findMonster.mockResolvedValueOnce({
      monsterId: "monster-1",
      monsterCode: "dev_rat",
      monsterType: MONSTER_TYPE.normal,
      level: 20,
      energyCost: 3,
      experienceReward: 50n,
      goldMinimum: 10n,
      goldMaximum: 20n,
      maximumHealth: 80,
      attack: 15,
      defense: 8,
      eligibility: {
        isEligible: false,
        reasons: ["LEVEL_TOO_LOW"],
      },
    });

    await expect(
      fixture.service.execute(input)
    ).rejects.toBeInstanceOf(
      MonsterNotEligibleError
    );

    expect(
      fixture.updateCharacterResources
    ).not.toHaveBeenCalled();

    expect(
      fixture.createCombatSession
    ).not.toHaveBeenCalled();
  });

  it("uses authoritative calculated character statistics", async () => {
    const fixture = createFixture();

    fixture.calculateCharacterStatistics
      .mockResolvedValueOnce({
        attack: 44,
        defense: 33,
        spellPower: 100,
        maximumHealth: 250,
        maximumMana: 35,
        maximumEnergy: 100,
        goldBonusPercent: 0,
        experienceBonusPercent: 0,
      });

    await fixture.service.execute(input);

    expect(
      fixture.createCombatSession
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        characterMaximumHealth: 250,
        characterAttack: 44,
        characterDefense: 33,
      })
    );
  });

  it("does not create a session when resource persistence fails", async () => {
    const fixture = createFixture();
    const failure =
      new Error("Resource write failed.");

    fixture.updateCharacterResources
      .mockRejectedValueOnce(failure);

    await expect(
      fixture.service.execute(input)
    ).rejects.toBe(failure);

    expect(
      fixture.createCombatSession
    ).not.toHaveBeenCalled();
  });

  it("propagates session creation failure for transaction rollback", async () => {
    const fixture = createFixture();
    const failure =
      new Error("Session insert failed.");

    fixture.createCombatSession
      .mockRejectedValueOnce(failure);

    await expect(
      fixture.service.execute(input)
    ).rejects.toBe(failure);

    expect(
      fixture.updateCharacterResources
    ).toHaveBeenCalledOnce();
  });
});
