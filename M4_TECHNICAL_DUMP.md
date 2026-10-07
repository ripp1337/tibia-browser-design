# M4 Technical Dump

Generated: 2026-10-07 13:31:57 +02:00
Repository root: C:\Projects\ostatnia-szansa-game

## Purpose

Fresh source dump for planning M4: Pure Combat Engine.

## Source priority

1. Current compiling code
2. Current PostgreSQL schema
3. Passing automated tests
4. CURRENT_MILESTONE.md
5. MASTER_PROJECT_PLAN.md
6. Historical milestone dumps

## Repository state

```text
Branch: m4/pure-combat-engine

Working tree:
?? scripts/generate-m4-context.ps1

Recent commits:
e66e8d0 complete M3 documentation
35804ba test monster discovery HTTP endpoints
849b58f update database table count after migration tracking
f8b6b63 connect monster discovery routes
2629101 add monster discovery HTTP handler
5e1cada test Daily Boss rotation discovery
dbebb42 connect Daily Boss rotation to monster discovery
539b557 add Daily Boss application eligibility
e1f1c6c define eligibility rules by monster type
500039f track Daily Boss attempts by rotation
```

# ============================================================
# SOURCE: package.json
# ============================================================

```text
{
    "name": "ostatnia-szansa-game",
    "version": "1.0.0",
    "description": "",
    "main": "index.js",
    "scripts": {
        "test": "vitest run",
        "typecheck": "tsc --noEmit",
        "build": "tsc -p tsconfig.build.json",
        "db:test": "tsx scripts/test-database.ts",
        "db:seed": "tsx scripts/seed-database.ts",
        "db:materials:check": "tsx scripts/import-materials.ts --dry-run",
        "db:materials:import": "tsx scripts/import-materials.ts",
        "game-data:validate": "tsx scripts/import-game-data.ts --validate-only",
        "game-data:check": "tsx scripts/import-game-data.ts --dry-run",
        "game-data:import": "tsx scripts/import-game-data.ts",
        "test:watch": "vitest",
        "test:unit": "vitest run tests/unit",
        "test:integration": "vitest run tests/integration",
        "dev": "tsx src/server.ts",
        "start": "node dist/server.js",
        "db:migrate": "tsx scripts/run-migrations.ts",
        "db:migrate:status": "tsx scripts/run-migrations.ts --status"
    },
    "repository": {
        "type": "git",
        "url": "git+https://github.com/ripp1337/tibia-browser-design.git"
    },
    "keywords": [],
    "author": "",
    "license": "ISC",
    "type": "module",
    "bugs": {
        "url": "https://github.com/ripp1337/tibia-browser-design/issues"
    },
    "homepage": "https://github.com/ripp1337/tibia-browser-design#readme",
    "dependencies": {
        "csv-parse": "^7.0.3",
        "dotenv": "^18.0.5",
        "exceljs": "^4.4.0",
        "jszip": "^3.10.2",
        "pg": "^8.23.1"
    },
    "devDependencies": {
        "@types/node": "^26.6.4",
        "@types/pg": "^8.23.1",
        "tsx": "^4.23.15",
        "typescript": "^7.0.2",
        "vitest": "^5.0.3"
    }
}

```

# ============================================================
# SOURCE: tsconfig.json
# ============================================================

```text
{
    "compilerOptions":  {
                            "target":  "ES2022",
                            "module":  "NodeNext",
                            "moduleResolution":  "NodeNext",
                            "rootDir":  ".",
                            "outDir":  "dist",
                            "strict":  true,
                            "esModuleInterop":  true,
                            "forceConsistentCasingInFileNames":  true,
                            "skipLibCheck":  true,
                            "resolveJsonModule":  true
                        },
    "include":  [
                    "src/**/*.ts",
                    "scripts/**/*.ts",
                    "tests/**/*.ts"
                ]
}
```

# ============================================================
# SOURCE: tsconfig.build.json
# ============================================================

```text
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": [
    "src/**/*.ts"
  ],
  "exclude": [
    "tests",
    "scripts",
    "dist",
    "node_modules"
  ]
}
```

# ============================================================
# SOURCE: src/app.ts
# ============================================================

```text
import {
  createServer,
  type Server,
} from "node:http";

import { databasePool } from "./database/pool.js";
import { PostgresAuthenticationProvider } from "./http/postgres-authentication.provider.js";
import { SystemClock } from "./infrastructure/clock/system-clock.js";

import { ArchiveCharacterService } from "./modules/characters/application/archive-character.service.js";
import { CalculateCharacterStatsService } from "./modules/characters/application/calculate-character-stats.service.js";
import { CreateCharacterService } from "./modules/characters/application/create-character.service.js";
import { GetCharacterSnapshotService } from "./modules/characters/application/get-character-snapshot.service.js";
import { ListCharactersService } from "./modules/characters/application/list-characters.service.js";
import { PostgresCharacterRepository } from "./modules/characters/infrastructure/postgres-character.repository.js";
import { PostgresCharacterStatisticsRepository } from "./modules/characters/infrastructure/postgres-character-statistics.repository.js";
import { createCharacterHttpHandler } from "./modules/characters/http/character-http.handler.js";

import { GetMonsterDetailsService } from "./modules/monsters/application/get-monster-details.service.js";
import { GetMonsterListService } from "./modules/monsters/application/get-monster-list.service.js";
import { PostgresMonsterDiscoveryRepository } from "./modules/monsters/infrastructure/postgres-monster-discovery.repository.js";
import { createMonsterHttpHandler } from "./modules/monsters/http/monster-http.handler.js";

function isMonsterRoute(
  requestUrl: string | undefined
): boolean {
  const url = new URL(
    requestUrl ?? "/",
    "http://localhost"
  );

  return /^\/characters\/[^/]+\/monsters(?:\/[^/]+)?$/u.test(
    url.pathname
  );
}

export function createApplicationServer(): Server {
  const characterRepository =
    new PostgresCharacterRepository(
      databasePool
    );

  const characterStatisticsRepository =
    new PostgresCharacterStatisticsRepository(
      databasePool
    );

  const monsterRepository =
    new PostgresMonsterDiscoveryRepository(
      databasePool
    );

  const calculateCharacterStatsService =
    new CalculateCharacterStatsService(
      characterStatisticsRepository
    );

  const authenticationProvider =
    new PostgresAuthenticationProvider(
      databasePool
    );

  const clock = new SystemClock();

  const createCharacterService =
    new CreateCharacterService(
      characterRepository
    );

  const listCharactersService =
    new ListCharactersService(
      characterRepository
    );

  const getCharacterSnapshotService =
    new GetCharacterSnapshotService(
      characterRepository,
      calculateCharacterStatsService,
      clock
    );

  const archiveCharacterService =
    new ArchiveCharacterService(
      characterRepository
    );

  const getMonsterListService =
    new GetMonsterListService(
      monsterRepository,
      clock
    );

  const getMonsterDetailsService =
    new GetMonsterDetailsService(
      monsterRepository,
      clock
    );

  const characterHandler =
    createCharacterHttpHandler({
      authenticationProvider,
      createCharacterService,
      listCharactersService,
      getCharacterSnapshotService,
      archiveCharacterService,
    });

  const monsterHandler =
    createMonsterHttpHandler({
      authenticationProvider,
      getMonsterListService,
      getMonsterDetailsService,
    });

  return createServer(
    (request, response) => {
      if (isMonsterRoute(request.url)) {
        void monsterHandler(
          request,
          response
        );

        return;
      }

      void characterHandler(
        request,
        response
      );
    }
  );
}

```

# ============================================================
# SOURCE: src/application/ports/clock.ts
# ============================================================

```text
export interface Clock {
  now(): Date;
}
```

# ============================================================
# SOURCE: src/infrastructure/clock/system-clock.ts
# ============================================================

```text
import type { Clock } from "../../application/ports/clock.js";

export class SystemClock implements Clock {
  public now(): Date {
    return new Date();
  }
}
```

# ============================================================
# SOURCE: src/modules/characters/domain/character.types.ts
# ============================================================

```text
import { CHARACTER_STATUS } from "./character.constants.js";

export type CharacterStatus =
  (typeof CHARACTER_STATUS)[keyof typeof CHARACTER_STATUS];

export type CharacterId = string;
export type AccountId = string;
export type SeasonId = string;

export type CharacterName = {
  display: string;
  normalized: string;
};

export type CharacterResources = {
  currentHealth: number;
  maximumHealth: number;

  currentMana: number;
  maximumMana: number;

  currentEnergy: number;
  maximumEnergy: number;

  resourcesUpdatedAt: Date;
};

export type ResourceRegenerationRates = {
  healthPerMinute: number;
  manaPerMinute: number;
  energyPerMinute: number;
};

export type CharacterBaseStatistics = {
  attack: number;
  defense: number;
  spellPower: number;
};

export type CharacterProgression = {
  level: number;
  experience: bigint;
  gold: bigint;

  craftingLevel: number;
  craftingExperience: bigint;

  gatheringLevel: number;
  gatheringExperience: bigint;
};

export type CharacterUnlocks = {
  spellSlots: number;
  craftingSlots: number;
  inventorySlots: number;
  promoted: boolean;
};

export type CharacterSummary = {
  characterId: CharacterId;
  accountId: AccountId;
  seasonId: SeasonId | null;

  name: string;
  status: CharacterStatus;

  level: number;
  experience: bigint;

  createdAt: Date;
  updatedAt: Date;
};

export type CharacterSnapshot = {
  characterId: CharacterId;
  accountId: AccountId;
  seasonId: SeasonId | null;

  name: string;
  status: CharacterStatus;

  progression: CharacterProgression;
  resources: CharacterResources;
  baseStatistics: CharacterBaseStatistics;
  unlocks: CharacterUnlocks;

  createdAt: Date;
  updatedAt: Date;
};

export type ResourceRegenerationResult = {
  resources: CharacterResources;

  elapsedWholeMinutes: number;

  restoredHealth: number;
  restoredMana: number;
  restoredEnergy: number;

  needsPersistence: boolean;
};
```

# ============================================================
# SOURCE: src/modules/characters/domain/effective-character-statistics.ts
# ============================================================

```text
export type CharacterStatModifiers = {
  attack: number;
  defense: number;
  spellPower: number;
  maximumHealth: number;
  maximumMana: number;
  maximumEnergy: number;
  goldBonusPercent: number;
  experienceBonusPercent: number;
};

export type CalculateEffectiveCharacterStatisticsInput = {
  level: number;
  spellMasteryPower: number;
  equipment?: Partial<CharacterStatModifiers>;
  achievements?: Partial<CharacterStatModifiers>;
  progressionBoosts?: Partial<CharacterStatModifiers>;
  combat?: Partial<CharacterStatModifiers>;
};

export type EffectiveCharacterStatistics = {
  attack: number;
  defense: number;
  spellPower: number;
  maximumHealth: number;
  maximumMana: number;
  maximumEnergy: number;
  goldBonusPercent: number;
  experienceBonusPercent: number;
};

const BASE_STATISTICS = {
  attack: 7,
  defense: 7,
  spellPower: 100,
  maximumHealth: 180,
  maximumMana: 35,
  maximumEnergy: 100,
} as const;

function modifierValue(
  source: Partial<CharacterStatModifiers> | undefined,
  statistic: keyof CharacterStatModifiers
): number {
  return source?.[statistic] ?? 0;
}

function calculateLevelMaximumHealth(level: number): number {
  return (
    BASE_STATISTICS.maximumHealth +
    (level - 1) * 30
  );
}

function calculateLevelMaximumMana(level: number): number {
  return (
    BASE_STATISTICS.maximumMana +
    (level - 1) * 15
  );
}

export function calculateLevelMaximumEnergy(
  level: number
): number {
  if (level < 20) {
    return BASE_STATISTICS.maximumEnergy;
  }

  return Math.min(
    200,
    110 + Math.floor((level - 20) / 10) * 5
  );
}

export function calculateEffectiveCharacterStatistics(
  input: CalculateEffectiveCharacterStatisticsInput
): EffectiveCharacterStatistics {
  if (!Number.isSafeInteger(input.level) || input.level < 1) {
    throw new Error("Character level must be a positive safe integer.");
  }

  if (
    !Number.isFinite(input.spellMasteryPower) ||
    input.spellMasteryPower < 0
  ) {
    throw new Error("Spell Mastery Power must be non-negative.");
  }

  const attack =
    BASE_STATISTICS.attack +
    modifierValue(input.equipment, "attack") +
    modifierValue(input.achievements, "attack") +
    modifierValue(input.progressionBoosts, "attack") +
    modifierValue(input.combat, "attack");

  const defense =
    BASE_STATISTICS.defense +
    modifierValue(input.equipment, "defense") +
    modifierValue(input.achievements, "defense") +
    modifierValue(input.progressionBoosts, "defense") +
    modifierValue(input.combat, "defense");

  const spellPower =
    input.spellMasteryPower +
    modifierValue(input.equipment, "spellPower") +
    modifierValue(input.progressionBoosts, "spellPower") +
    modifierValue(input.combat, "spellPower");

  const maximumHealth =
    calculateLevelMaximumHealth(input.level) +
    modifierValue(input.equipment, "maximumHealth");

  const maximumMana =
    calculateLevelMaximumMana(input.level) +
    modifierValue(input.equipment, "maximumMana");

  const maximumEnergy =
    calculateLevelMaximumEnergy(input.level) +
    modifierValue(input.equipment, "maximumEnergy");

  const goldBonusPercent =
    modifierValue(input.equipment, "goldBonusPercent") +
    modifierValue(input.achievements, "goldBonusPercent") +
    modifierValue(
      input.progressionBoosts,
      "goldBonusPercent"
    );

  const experienceBonusPercent =
    modifierValue(
      input.equipment,
      "experienceBonusPercent"
    ) +
    modifierValue(
      input.achievements,
      "experienceBonusPercent"
    ) +
    modifierValue(
      input.progressionBoosts,
      "experienceBonusPercent"
    );

  return {
    attack: Math.max(0, Math.floor(attack)),
    defense: Math.max(0, Math.floor(defense)),
    spellPower: Math.max(0, Math.floor(spellPower)),
    maximumHealth: Math.max(
      1,
      Math.floor(maximumHealth)
    ),
    maximumMana: Math.max(
      0,
      Math.floor(maximumMana)
    ),
    maximumEnergy: Math.max(
      1,
      Math.floor(maximumEnergy)
    ),
    goldBonusPercent: Math.max(
      0,
      goldBonusPercent
    ),
    experienceBonusPercent: Math.max(
      0,
      experienceBonusPercent
    ),
  };
}


```

# ============================================================
# SOURCE: src/modules/monsters/domain/monster.types.ts
# ============================================================

```text
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

```

# ============================================================
# SOURCE: src/modules/monsters/domain/monster-cooldown.ts
# ============================================================

```text
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

```

# ============================================================
# SOURCE: src/modules/monsters/domain/monster-eligibility.ts
# ============================================================

```text
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

```

# ============================================================
# SOURCE: src/modules/monsters/application/monster-discovery.models.ts
# ============================================================

```text
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

```

# ============================================================
# SOURCE: src/modules/monsters/application/monster-discovery.repository.ts
# ============================================================

```text
import type {
  AccountId,
  CharacterId,
} from "../../characters/domain/character.types.js";
import type {
  MonsterCode,
  MonsterType,
  TaskStatus,
} from "../domain/monster.types.js";

export type MonsterDiscoveryRecord = {
  code: MonsterCode;
  name: string;
  level: number;

  monsterType: MonsterType;
  energyCost: number;

  characterLevel: number;
  bestiaryVisible: boolean;
  cooldownAvailableAt: Date | null;

  taskStatus: TaskStatus | null;

  dailyBossAvailable?: boolean;
  dailyAttemptsUsed?: number;
  dailyAttemptsPerDay?: number;
};

export type MonsterDiscoveryDetailsRecord =
  MonsterDiscoveryRecord & {
    description: string;
  };

export type ListMonstersInput = {
  accountId: AccountId;
  characterId: CharacterId;
};

export type FindMonsterInput = {
  accountId: AccountId;
  characterId: CharacterId;
  monsterCode: MonsterCode;
};

export type ListMonsterRecordsInput =
  ListMonstersInput & {
    observedAt: Date;
  };

export type FindMonsterRecordInput =
  FindMonsterInput & {
    observedAt: Date;
  };

export interface MonsterDiscoveryRepository {
  listMonsters(
    input: ListMonsterRecordsInput
  ): Promise<readonly MonsterDiscoveryRecord[]>;

  findMonster(
    input: FindMonsterRecordInput
  ): Promise<MonsterDiscoveryDetailsRecord | null>;
}

```

# ============================================================
# SOURCE: src/modules/monsters/application/get-monster-list.service.ts
# ============================================================

```text
import type {
  Clock,
} from "../../../application/ports/clock.js";
import {
  calculateMonsterCooldown,
} from "../domain/monster-cooldown.js";
import {
  calculateMonsterEligibility,
} from "../domain/monster-eligibility.js";
import type {
  ListMonstersInput,
  MonsterDiscoveryRecord,
  MonsterDiscoveryRepository,
} from "./monster-discovery.repository.js";
import type {
  MonsterListItem,
} from "./monster-discovery.models.js";

function mapMonsterListItem(
  record: MonsterDiscoveryRecord,
  now: Date
): MonsterListItem {
  const cooldown =
    calculateMonsterCooldown(
      record.cooldownAvailableAt,
      now
    );

  return {
    code: record.code,
    name: record.name,
    level: record.level,

    monsterType: record.monsterType,
    energyCost: record.energyCost,

    eligibility:
      calculateMonsterEligibility({
        characterLevel:
          record.characterLevel,

        monsterLevel: record.level,
        monsterType: record.monsterType,

        cooldownActive:
          cooldown.isActive,

        taskStatus:
          record.taskStatus,

        dailyBossAvailable:
          record.dailyBossAvailable,

        dailyAttemptsUsed:
          record.dailyAttemptsUsed,

        dailyAttemptsPerDay:
          record.dailyAttemptsPerDay,
      }),

    cooldown,

    bestiaryVisible:
      record.bestiaryVisible,
  };
}

export class GetMonsterListService {
  public constructor(
    private readonly repository:
      MonsterDiscoveryRepository,

    private readonly clock: Clock
  ) {}

  public async execute(
    input: ListMonstersInput
  ): Promise<readonly MonsterListItem[]> {
    const observedAt = this.clock.now();

    const records =
      await this.repository.listMonsters({
        ...input,
        observedAt,
      });

    return records.map((record) =>
      mapMonsterListItem(
        record,
        observedAt
      )
    );
  }
}

```

# ============================================================
# SOURCE: src/modules/monsters/application/get-monster-details.service.ts
# ============================================================

```text
import type {
  Clock,
} from "../../../application/ports/clock.js";
import {
  MonsterNotFoundError,
} from "../domain/monster.errors.js";
import {
  calculateMonsterCooldown,
} from "../domain/monster-cooldown.js";
import {
  calculateMonsterEligibility,
} from "../domain/monster-eligibility.js";
import type {
  FindMonsterInput,
  MonsterDiscoveryRepository,
} from "./monster-discovery.repository.js";
import type {
  MonsterDetails,
} from "./monster-discovery.models.js";

export class GetMonsterDetailsService {
  public constructor(
    private readonly repository:
      MonsterDiscoveryRepository,

    private readonly clock: Clock
  ) {}

  public async execute(
    input: FindMonsterInput
  ): Promise<MonsterDetails> {
    const observedAt = this.clock.now();

    const record =
      await this.repository.findMonster({
        ...input,
        observedAt,
      });

    if (!record) {
      throw new MonsterNotFoundError();
    }

    const cooldown =
      calculateMonsterCooldown(
        record.cooldownAvailableAt,
        observedAt
      );

    return {
      code: record.code,
      name: record.name,
      level: record.level,

      monsterType: record.monsterType,
      energyCost: record.energyCost,

      eligibility:
        calculateMonsterEligibility({
          characterLevel:
            record.characterLevel,

          monsterLevel: record.level,
          monsterType:
            record.monsterType,

          cooldownActive:
            cooldown.isActive,

          taskStatus:
            record.taskStatus,

          dailyBossAvailable:
            record.dailyBossAvailable,

          dailyAttemptsUsed:
            record.dailyAttemptsUsed,

          dailyAttemptsPerDay:
            record.dailyAttemptsPerDay,
        }),

      cooldown,

      bestiaryVisible:
        record.bestiaryVisible,

      description: record.description,
    };
  }
}

```

# ============================================================
# SOURCE: documentation/game-design/CURRENT_MILESTONE.md
# ============================================================

```text
# Current Milestone

## Milestone

M3: Monster Discovery and Eligibility

## Status

Completed.

## Objective

Provide authenticated, read-only monster discovery for an owned character.

## Implemented scope

- Monster list endpoint.
- Monster details endpoint loaded by stable monster code.
- Character ownership enforcement.
- Character-level eligibility.
- Character-specific Bestiary visibility.
- Energy-cost preview.
- Support for Normal, MiniBoss, TaskBoss and DailyBoss.
- Deterministic cooldown calculation using Clock.
- Task Boss lifecycle eligibility.
- Daily Boss rotation and attempt eligibility.
- Stable public application models.
- PostgreSQL row validation.
- Authenticated HTTP integration.

## Endpoints

- GET /characters/:characterId/monsters
- GET /characters/:characterId/monsters/:monsterCode

## Eligibility rules

### Normal

- Character level requirement.
- Independent character-and-monster cooldown.

### MiniBoss

- Character level requirement.
- Independent character-and-monster cooldown.

### TaskBoss

- Character level requirement.
- Task status must be UNLOCKED.
- ACTIVE returns TASK_PROGRESS_INCOMPLETE.
- WAITING_FOR_REUNLOCK returns TASK_REUNLOCK_REQUIRED.
- Ordinary monster cooldown does not affect Task Boss eligibility.

Each Task Boss has exactly one monster task.
A specific source monster unlocks a specific Task Boss.
Family-based task aggregation is outside M3.

### DailyBoss

- Character level requirement.
- Boss must belong to the active rotation.
- Character must have attempts remaining.
- Ordinary monster cooldown does not affect Daily Boss eligibility.
- Attempts are tracked per rotation.

## Daily Boss rotation

- Reset hour is configurable in UTC through DAILY_BOSS_RESET_HOUR_UTC.
- A rotation is active when created_at <= observedAt and reset_timestamp > observedAt.
- Multiple active rotations are treated as a configuration error.
- Each rotation contains one definition for tiers 1, 2 and 3.

## Eligibility reasons

- LEVEL_TOO_LOW
- COOLDOWN_ACTIVE
- TASK_PROGRESS_INCOMPLETE
- TASK_REUNLOCK_REQUIRED
- DAILY_BOSS_UNAVAILABLE
- DAILY_ATTEMPTS_EXHAUSTED

## Database changes

- Added tracked migration runner and schema_migrations.
- Added unique Task Boss assignment constraint.
- Added Daily Boss rotation window constraint.
- Changed Daily Boss attempts to be tracked per rotation.
- Added configurable Daily Boss reset hour.

## Out of scope

M3 does not:

- start combat,
- deduct Energy,
- create combat sessions,
- grant rewards,
- write cooldowns,
- update Bestiary,
- update kill statistics,
- mutate Task Boss progress,
- generate or mutate Daily Boss rotations.

## Verification

Verified on 2026-10-07:

- 87 migrations applied.
- 0 pending migrations.
- PostgreSQL connection successful.
- 79 database tables detected.
- TypeScript typecheck passed.
- 42 test files passed.
- 226 tests passed.
- Production build passed.
- Git working tree clean.

## Completion log

M3 Monster Discovery and Eligibility completed and verified.

```

# ============================================================
# SOURCE: documentation/game-design/MASTER_PROJECT_PLAN.md
# ============================================================

```text
# OSTATNIA SZANSA: V1 MASTER PROJECT PLAN

## PROJECT OBJECTIVE

Deliver a playable browser-based RPG where the player can:

Create Character
→ Fight Monsters
→ Gain Experience, Gold, Items, and Materials
→ Equip and Improve Items
→ Use Spells and Consumables
→ Craft Items
→ Gather Materials Offline
→ Trade Through the Marketplace
→ Fight Bosses
→ Complete Achievements and Collections
→ Participate in Seasonal Competition

The game has three primary progression pillars:

1. Combat
2. Economy
3. Crafting and Gathering

Real content creation and balancing are postponed until the associated gameplay systems are implemented and testable.

---

## PROJECT RULES

1. Build complete vertical slices rather than isolated systems.
2. Every milestone must produce a working and testable result.
3. Keep domain logic separate from HTTP controllers and PostgreSQL repositories.
4. The server is authoritative for combat, rewards, costs, ownership, time, and randomness.
5. The client must never generate rewards, random outcomes, timestamps, or final statistics.
6. Randomness must be injectable and reproducible in tests.
7. Time must be injectable and reproducible in tests.
8. Multi-record operations must use database transactions.
9. Duplicate requests must not duplicate actions, rewards, costs, or resources.
10. Use stable content codes when referring to authored content.
11. Treat `dev_*` definitions as development fixtures, not final content.
12. Do not perform production balancing before the associated system exists.
13. Later milestones may depend on earlier milestones, never the reverse.
14. A milestone is incomplete until its automated tests pass.
15. Runtime records must survive application restarts.
16. Account-wide and character-specific progression must remain separate.
17. Seasonal and non-ladder economies must remain isolated.
18. Important resource creation and destruction must be measurable.

---

## OWNERSHIP MODEL

### Account-wide systems

- Achievements
- Achievement Score
- Holy Grail
- Outfit unlocks
- Addon unlocks
- Friend relationships
- Account punishments
- Account administration history

### Character-specific systems

- Level
- Experience
- Gold
- Health
- Mana
- Energy
- Equipment
- Inventory
- Materials
- Consumables
- Spell ownership
- Spell loadout
- Spell Mastery
- Crafting progression
- Gathering progression
- Combat statistics
- Monster kill statistics
- Bestiary
- Active buffs
- Permanent character upgrades
- Marketplace listings
- Seasonal progression

### Character rules

- Maximum three active characters per account.
- Character names are globally unique.
- Characters progress independently.
- Gold, items, materials, consumables, and progression are not shared directly.
- Archived characters are view-only.
- Archived characters free an active character slot.
- Archiving never deletes progression.

---

# GOAL 1: CORE PLAYABLE LOOP

Prove the fundamental loop:

Character
→ Combat
→ Rewards
→ Equipment
→ Increased Power
→ Stronger Combat

---

## M1: CHARACTER FOUNDATION

### Objective

Implement character creation and a complete gameplay-ready character snapshot.

### Deliverables

- Account-to-character ownership enforcement
- Maximum three active characters
- Globally unique character names
- Character creation
- Character listing
- Character details
- Character archiving
- Initial progression
- Initial statistics
- Initial unlocks
- Initial equipment loadout
- Online and offline resource regeneration
- Complete character snapshot

### Initial character state

- Level: 1
- Experience: 0
- Gold: 0
- Health: 180 / 180
- Mana: 35 / 35
- Energy: 100 / 100
- Base Attack: 7
- Base Defense: 7
- Base Spell Power: 100%
- Spell Slots: 1
- Inventory Capacity: 50
- Crafting Level: 1
- Crafting Experience: 0
- Gathering Level: 1
- Gathering Experience: 0
- Crafting Slots: 1
- Promotion: false
- Archived: false

### Suggested endpoints

- POST /characters
- GET /characters
- GET /characters/:characterId
- POST /characters/:characterId/archive

### Character creation transaction

1. Validate and lock the account where required.
2. Count active characters.
3. Reject creation if the account has three active characters.
4. Validate the character name.
5. Create the character.
6. Create character statistics.
7. Create character unlock records.
8. Create the initial equipment loadout.
9. Initialize mandatory progression records.
10. Commit the transaction.

### Definition of done

- Character creation is transactional.
- Duplicate names are rejected.
- A fourth active character is rejected.
- Dependent records are initialized.
- Unauthorized accounts cannot access another account’s character.
- Snapshot includes resources, progression, equipment, storage, and effective statistics.
- Regeneration cannot be applied twice for the same elapsed period.
- Current resources cannot exceed their calculated maximums.
- Unit, integration, authorization, and rollback tests pass.

---

## M2: EFFECTIVE CHARACTER STATISTICS

### Objective

Create one authoritative calculator for final character statistics.

### Required interface

calculateCharacterStats(characterId): EffectiveCharacterStats

### Calculation

Base Character Statistics
+ Equipped Item Base Statistics
+ Item Affixes
+ Set Bonuses
+ Achievement Bonuses
+ Permanent Character Bonuses
+ Active Buffs and Debuffs
= Effective Character Statistics

### Effective statistics

- Attack
- Defense
- Spell Power
- Maximum Health
- Maximum Mana
- Maximum Energy
- Gold Bonus
- Experience Bonus

### Rules

- Controllers must not calculate statistics.
- Combat must use the central calculator.
- Profiles must use the central calculator.
- Equipment comparisons must use the central calculator.
- Equipment changes trigger recalculation.
- Current resources are clamped if maximums decrease.

### Definition of done

- Every statistic has automated tests.
- Equipping and unequipping changes effective statistics correctly.
- Repeated calculations return identical results.
- Current resources are clamped safely.
- No duplicated statistics logic exists.

---

## M3: MONSTER DISCOVERY AND ELIGIBILITY

### Deliverables

- Available-monster list
- Monster details
- Character-level access validation
- Monster cooldown status
- Energy-cost preview
- Monster-type distinction
- Bestiary visibility state
- Stable-code monster loading

### Suggested endpoints

- GET /characters/:characterId/monsters
- GET /characters/:characterId/monsters/:monsterCode

### Access rule

character.level >= monster.level

### Monster types

- Normal
- Mini Boss
- Task Boss
- Daily Boss

### Definition of done

- Eligible monsters are returned.
- Higher-level monsters cannot be started.
- Monsters are loaded by stable code.
- Hidden internal values are not unnecessarily exposed.
- Placeholder monsters require no hardcoded exceptions.
- Cooldowns are character-specific.
- Ownership and eligibility tests pass.

---

## M4: PURE COMBAT ENGINE

### Objective

Implement deterministic combat as a pure TypeScript domain module.

### Required interface

resolveCombatAction(
  state: CombatState,
  action: PlayerAction,
  rng: RandomSource
): CombatResolution

### Initially supported action

PlayerAction:
- type: basic_attack

### Combat flow

Player Action
→ Resolve Player Action
→ Resolve Active Effects
→ Check Monster Death
→ Monster Action
→ Resolve Monster Action
→ Resolve Active Effects
→ Check Player Death
→ Advance Turn

### Basic attack formula

hitChancePercent =
  clamp((attackerAttack - defenderDefense) * 4, 5, 90)

minimumDamage =
  max(0, attackerAttack - defenderDefense)

maximumDamage =
  max(0, (attackerAttack - defenderDefense) * 2)

### Rules

- Player always acts first.
- Combat has no escape action.
- A successful attack may deal zero damage.
- Player and monster basic attacks use the same formula.
- Combat stops immediately when either combatant reaches zero Health.
- Maximum combat duration is 100 turns.
- Exceeding 100 turns results in player defeat.

### Required abstractions

RandomSource:
- nextFloat()
- nextInt(min, max)

Clock:
- now()

### Definition of done

- Seeded random input produces repeatable combat.
- Player acts first.
- Misses work.
- Minimum and maximum hit chances work.
- Zero damage works.
- Death and victory stop combat immediately.
- The 100-turn defeat works.
- Domain logic does not access HTTP or PostgreSQL.
- Domain logic does not call Math.random() or Date.now().
- Unit tests cover hits, misses, zero damage, victory, defeat, and turn limit.

---

## M5: PERSISTENT COMBAT API

### Suggested endpoints

- POST /characters/:characterId/combat
- GET /characters/:characterId/combat
- POST /characters/:characterId/combat/actions
- GET /characters/:characterId/combat/log

### Fight-start transaction

1. Lock the character.
2. Validate ownership.
3. Reject an existing active combat session.
4. Apply resource regeneration.
5. Validate monster access.
6. Validate monster cooldown.
7. Validate available Energy.
8. Deduct Energy exactly once.
9. Snapshot effective character statistics.
10. Snapshot monster statistics.
11. Create the combat session.
12. Commit.

### Action request

{
  "expectedTurn": 4,
  "action": {
    "type": "basic_attack"
  }
}

### Combat-action transaction

1. Lock the active combat session.
2. Validate character ownership.
3. Validate active status.
4. Validate expectedTurn.
5. Resolve the player action.
6. Resolve active effects.
7. Stop if the monster dies.
8. Resolve the monster action.
9. Resolve active effects.
10. Stop if the player dies.
11. Save combat state.
12. Save combat events.
13. Advance the turn.
14. Commit.

### Definition of done

- Duplicate starts cannot deduct Energy twice.
- Duplicate actions cannot execute a turn twice.
- Stale expectedTurn values are rejected.
- One character cannot have multiple active fights.
- Other accounts cannot submit actions.
- Combat survives application restarts.
- Concurrent-action tests pass.

---

## M6: VICTORY, DEATH, AND PROGRESSION

### Deliverables

- Victory resolution
- Experience awards
- Gold awards
- Character-level calculation
- Level-up resource increases
- Death Experience loss
- Promotion modifier
- Blessing modifier
- Combat statistics
- Monster kill statistics
- Recent combat logs
- Monster cooldown recording
- Bestiary updates
- Task progress updates

### Victory transaction

1. Complete combat.
2. Grant Experience.
3. Recalculate level.
4. Apply level rewards.
5. Grant Gold.
6. Generate loot.
7. Update lifetime statistics.
8. Update monster kill count.
9. Update Bestiary.
10. Update task-boss progress.
11. Record monster cooldown.
12. Save combat log.
13. Commit everything.

### Death penalties

- Normal: 10%
- Promoted: 8%
- Blessed: 6%
- Promoted and Blessed: 4%

### Definition of done

- Victory rewards are granted exactly once.
- Multiple levels can be gained.
- Death can reduce one or more levels.
- Promotion and Blessing modify death loss correctly.
- Blessing is consumed exactly once.
- Failed reward generation rolls back the complete victory.
- Only the newest ten combat logs are retained.
- Victory and death tests pass.

---

## M7: ITEM AND LOOT GENERATION

### Canonical item generator

generateItem({
  itemBase,
  itemLevel,
  forcedRarity,
  source,
  rng
}): GeneratedItem

### Item generation pipeline

Select Item Base
→ Determine Item Level
→ Determine Rarity
→ Determine Affix Count
→ Select Eligible Affixes
→ Roll Affix Values
→ Calculate Item Score
→ Persist Item and Affixes

### Rarity and affix counts

- Common: 0
- Magic: 1
- Rare: 2
- Epic: 3
- Legendary: 4

### Independent combat reward rolls

1. Gold
2. Regular equipment
3. Other loot
4. Unique or set item

### Rules

- Duplicate affixes are allowed.
- Affixes must satisfy item-level requirements.
- Rolls must remain inside configured ranges.
- Combat, bosses, gambling, chests, milestones, and administration reuse the same generator.

### Definition of done

- Items use database definitions.
- Rarity produces the correct affix count.
- Only eligible affixes are selected.
- Duplicate affixes work.
- Rolls remain within configured ranges.
- Inventory-full behavior works.
- Gold is granted even when equipment inventory is full.
- Materials and consumables use separate storage.
- Generation is deterministic under a seed.

---

## M8: INVENTORY AND EQUIPMENT

### Suggested endpoints

- GET /characters/:characterId/inventory
- GET /characters/:characterId/equipment
- POST /characters/:characterId/equipment/equip
- POST /characters/:characterId/equipment/unequip

### Rules

- Character must own the item.
- Character must meet its required level.
- Item slot must match the destination.
- Market-locked items cannot be equipped.
- Equipped items cannot be listed or salvaged.
- Two-handed weapons prevent shield use.
- Equipment changes trigger stat recalculation.

### Definition of done

- Dropped items appear in inventory.
- Owned items can be equipped.
- Foreign items cannot be equipped.
- Invalid slots are rejected.
- Two-handed restrictions work.
- Statistics update immediately.
- Inventory capacity is enforced.
- Ownership and concurrency tests pass.

### First playable release

Fight
→ Gain Rewards
→ Receive Equipment
→ Equip Equipment
→ Become Stronger
→ Fight Stronger Monster

---

# GOAL 2: COMBAT DEPTH

## M9: PLAYER SPELLS

### Deliverables

- Spell purchase
- Level and Gold requirements
- Permanent ownership
- One to three spell slots
- Loadout management
- Mana costs
- Cooldowns
- Direct damage
- Healing
- Damage over time
- Healing over time
- Buffs and debuffs
- Mana drain
- Health drain
- Potion disable

### Definition of done

- Duplicate spell slots are rejected.
- Insufficient Mana rejects casting.
- Cooldowns work.
- Spell Power scaling works.
- Effects expire correctly.
- Repeated effects refresh rather than stack.
- Tests cover every supported category.

---

## M10: MONSTER ABILITIES

### Flow

Roll Ability Chance
→ On Failure: Basic Attack
→ On Success: Weighted Ability Selection
→ Resolve Through Shared Spell Engine

### Definition of done

- Monsters reuse the player spell resolver.
- Weighted selection is deterministic.
- Disabled abilities are ignored.
- Monster Spell Power applies correctly.
- Basic-attack fallback works.
- Monsters cannot use consumables.

---

## M11: COMBAT CONSUMABLES

### Deliverables

- Health Potion slot
- Mana Potion slot
- Pre-combat potion loadout
- Carried quantities
- Fixed and percentage restoration
- Potion cooldowns
- Potion-disable effects
- Turn consumption
- Storage deduction

### Definition of done

- Potion use consumes one turn.
- Storage is deducted exactly once.
- Duplicate requests cannot apply a potion twice.
- Potion-disable variants work.
- Restoration is clamped.
- Energy Potions cannot be used in combat.

---

# GOAL 3: COMPLETE ACTIVE PROGRESSION

## M12: ITEM IMPROVEMENT AND DISPOSAL

### Deliverables

- Rarity upgrading
- Upgrade costs
- Upgrade success chances
- Item destruction
- Protection Stones
- Single-affix rerolling
- Salvaging
- NPC selling
- Item Score
- Vendor valuation

### Upgrade rules

- Common → Magic
- Magic → Rare
- Rare → Epic
- Epic → Legendary
- Legendary is final.
- Success adds one affix.
- Unprotected failure destroys the item.
- Protected failure preserves the item.
- Costs and Protection Stone are consumed regardless of outcome.

### Definition of done

- Costs are server-validated.
- Success adds one valid affix.
- Failure consumes costs.
- Equipped and locked items are protected from accidental operations.
- Every operation is transactional.

---

## M13: CHARACTER ECONOMY AND PERMANENT UPGRADES

### Deliverables

- Spell-slot purchasing
- Promotion
- Inventory expansion
- Crafting-slot purchasing
- NPC healing
- Blessing purchase and activation
- Material vendor
- Consumable vendor
- Equipment vendor
- Gambling

### Definition of done

- Gold cannot become negative.
- Permanent upgrades cannot be purchased twice.
- Gambling uses the canonical item generator.
- NPC cooldowns survive restarts.
- Gold creation and destruction are tracked.

---

# GOAL 4: OFFLINE PROGRESSION

## M14: GATHERING

### Flow

Start Gathering
→ Block Active Gameplay
→ Accumulate Completed Minutes
→ Stop at Login or 24 Hours
→ Generate Pending Results
→ Collect Results

### Rules

- Gathering is offline-only.
- One gathering slot exists.
- Maximum duration is 24 hours.
- Partial minutes are ignored.
- Material eligibility depends on Gathering Level.
- Results remain pending until collection.
- Logging in stops gathering.

### Definition of done

- Active gameplay is blocked during gathering.
- Elapsed time cannot be claimed twice.
- Eligibility is enforced.
- Collection is transactional.
- Time is injectable in tests.

---

## M15: CRAFTING

### Deliverables

- Recipe list and details
- Eligibility
- Resource validation
- Quantity selection
- One to three crafting slots
- Maximum 24-hour queue time
- Timestamp-based completion
- Cancellation
- Full refund
- Manual collection
- Crafting Experience and levels
- Crafting history

### Definition of done

- Crafting always succeeds.
- Resources are consumed exactly once.
- Queue capacity is enforced.
- Speed bonuses apply.
- Completion survives restarts.
- Cancellation cannot duplicate refunds.
- Collection cannot duplicate output.

---

# GOAL 5: RETENTION AND ENCOUNTERS

## M16: CHESTS AND LOGIN STREAKS

### Order

1. Hourly Chest
2. Daily Chest
3. Seven-day login streak
4. Additional Daily Chest rewards

### Definition of done

- Claims are transactional.
- Rewards cannot be claimed twice.
- Hourly and Daily timing remain separate.
- Equipment uses the canonical generator.
- Streak reset and rollover work.

---

## M17: BOSS SYSTEMS

### Deliverables

- Mini-boss cooldowns
- Task-boss progress
- Task-boss unlocks
- Task-boss attempts
- Gold re-unlock
- Daily-boss pools
- Daily rotation
- Daily attempts
- Global reset
- Boss reward modifiers

### Definition of done

- Bosses reuse standard combat.
- Failure and victory consume attempts.
- Daily rotation is global.
- Attempts are character-specific.
- Reset is idempotent.
- Duplicate requests cannot recover attempts.

---

## M18: BESTIARY AND ACHIEVEMENTS

### Deliverables

- First-kill Bestiary unlock
- Kill count
- First and last kill dates
- Completion percentage
- Task progress
- Automatic achievements
- Automatic rewards
- Hidden achievements
- Achievement Score
- Account-wide achievement ownership

### Definition of done

- Bestiary is character-specific.
- Achievements are account-wide.
- Progress and rewards are idempotent.
- Archiving does not remove account progress.
- Achievement bonuses feed the statistics calculator.

---

## M19: UNIQUES, SETS, AND HOLY GRAIL

### Deliverables

- Independent unique/set roll
- Pity counter
- Pity increase, maximum, and reset
- Unique and set selection
- Random fixed-stat rolls
- Equipped set bonuses
- Account-wide Holy Grail
- Set-completion progress
- Collection achievements

### Definition of done

- Normal and unique/set loot remain independent.
- Pity is persisted.
- Discovery is permanent.
- Discovery cannot be duplicated.
- Set bonuses activate and deactivate correctly.
- Seasonal changes do not reset Holy Grail.

---

# GOAL 6: PLAYER ECONOMY AND LONG-TERM STRUCTURE

## M20: MARKETPLACE AND MAIL

### Deliverables

- Equipment listings
- Material and consumable stack listings
- Listing fees and durations
- Expiration
- Purchases
- Partial purchases
- Search
- Realm separation
- Anonymous transactions
- Mail delivery
- Attachments
- Recent price history

### Definition of done

- Listed assets are escrowed.
- Equipped items cannot be listed.
- Sellers cannot buy their own listings.
- Concurrent buyers cannot buy the same asset.
- Purchases are transactional.
- Attachments cannot be collected twice.
- Seasonal and non-ladder economies cannot interact.

---

## M21: SEASONS AND LEADERBOARDS

### Deliverables

- Active season
- Seasonal characters
- Experience leaderboard
- Hardcore leaderboard
- Final rankings
- Hall of Fame
- Season closure
- Non-ladder transfer
- Character archival
- Economy separation

### Definition of done

- Seasonal and non-ladder economies are isolated.
- Ranking is deterministic.
- Season closure is idempotent.
- Progress transfers without loss.
- Account-wide progress remains unchanged.
- Hall of Fame becomes immutable.

---

## M22: SOCIAL AND COSMETIC SYSTEMS

### Deliverables

- Friend requests
- Friendship management
- Friend limit
- Online status
- Last seen
- Private messages
- Message limits
- Outfits
- Addons
- Account-wide unlocks
- Cosmetic components

### Definition of done

- Friendships are account-based.
- Duplicate relationships are prevented.
- Limits are enforced.
- Cosmetics survive seasonal changes.
- Cosmetics provide no gameplay statistics.

---

# GOAL 7: LAUNCH READINESS

## M23: ADMINISTRATION AND OBSERVABILITY

### Deliverables

- Structured logging
- Error correlation
- Health checks
- Audit records
- Admin actions
- Announcements
- Bans and mutes
- Economy telemetry
- Combat telemetry
- Loot telemetry
- Crafting telemetry
- Marketplace telemetry
- Backup and restore verification

### Required telemetry

- Gold created and destroyed
- Items generated and destroyed
- Rarity and affix distribution
- Combat wins and defeats
- Deaths
- Combat duration
- Energy spent
- Materials generated and consumed
- Consumables generated and consumed
- Crafting activity
- Marketplace activity
- Upgrade outcomes

---

## M24: SECURITY AND EXPLOIT RESISTANCE

### Deliverables

- Ownership review
- Authorization review
- Transaction review
- Idempotency review
- Input validation
- Rate limits
- Session security
- Concurrency tests
- Economy-abuse tests
- Clock-manipulation tests
- Cross-character isolation tests
- Cross-realm isolation tests

### Required guarantees

- Client cannot author rewards.
- Client cannot submit random outcomes.
- Client cannot provide trusted timestamps.
- Client cannot provide final calculated statistics.
- Duplicate requests cannot duplicate value.
- Concurrent operations preserve balances and ownership.
- Character assets remain isolated.
- Realm assets remain isolated.
- Negative balances are impossible.

---

## M25: REAL CONTENT AND BALANCING

### Content workstreams

- Monsters and families
- Item bases
- Affix tiers
- Spells
- Materials
- Recipes
- Consumables
- Boss pools
- Unique items
- Set items and bonuses
- Achievements
- Chest rewards
- NPCs
- Outfits and Addons
- Artwork
- Descriptions and lore

### Balancing order

1. Combat survivability
2. Monster progression
3. Experience progression
4. Item-base progression
5. Loot frequency
6. Rarity distribution
7. Affix requirements and ranges
8. Material income
9. Crafting costs
10. Gold generation
11. Gold sinks
12. Upgrade costs and odds
13. Boss difficulty
14. Boss rewards
15. Chest rewards
16. Gathering progression
17. Crafting progression
18. Marketplace fees
19. Seasonal progression speed

### Definition of done

- No material exists without a use.
- Every recipe has obtainable inputs.
- Every level band has viable monsters and equipment.
- Every spell and consumable has a clear purpose.
- Core materials are not boss-exclusive.
- Gold sources and sinks are measurable.
- Placeholder content is removed or disabled.
- Progression simulations and complete playtests pass.

---

## M26: RELEASE CANDIDATE

### Exit criteria

- Accounts work.
- Characters work.
- Ownership isolation works.
- Combat works.
- Victory and death work.
- Experience and levels work.
- Loot and equipment work.
- Spells and abilities work.
- Consumables work.
- Item improvement works.
- Vendors and gambling work.
- Gathering and crafting work.
- Chests and bosses work.
- Bestiary and achievements work.
- Holy Grail works.
- Marketplace and mail work.
- Seasons and leaderboards work.
- Social and cosmetic systems work.
- Administration works.
- Production migrations work on a clean database.
- Production content import works.
- Backups can be restored.
- Critical automated tests pass.
- No known duplication exploit remains.
- No known cross-character asset leak remains.
- No known cross-realm asset leak remains.

---

# IMPLEMENTATION ORDER

1. M1 Character Foundation
2. M2 Effective Character Statistics
3. M3 Monster Discovery and Eligibility
4. M4 Pure Combat Engine
5. M5 Persistent Combat API
6. M6 Victory, Death, and Progression
7. M7 Item and Loot Generation
8. M8 Inventory and Equipment
9. M9 Player Spells
10. M10 Monster Abilities
11. M11 Combat Consumables
12. M12 Item Improvement and Disposal
13. M13 Character Economy and Permanent Upgrades
14. M14 Gathering
15. M15 Crafting
16. M16 Chests and Login Streaks
17. M17 Boss Systems
18. M18 Bestiary and Achievements
19. M19 Uniques, Sets, and Holy Grail
20. M20 Marketplace and Mail
21. M21 Seasons and Leaderboards
22. M22 Social and Cosmetic Systems
23. M23 Administration and Observability
24. M24 Security and Exploit Resistance
25. M25 Real Content and Balancing
26. M26 Release Candidate

---

# CURRENT PROJECT STATUS

## Completed

- Database architecture established
- Database migrations created
- Authored-content tables available
- Stable content codes added
- Development workbook created
- Synthetic development content populated
- Workbook validation implemented
- Transactional game-data importer implemented
- Transactional dry run verified
- Complete content import committed
- Repeat import verified
- Foreign-key relationships verified
- Representative table counts verified

## Current development content

- 29 authored-content worksheets
- 248 authored-content records
- 10 materials
- 10 monsters
- 10 item bases
- 10 spells
- 10 recipes
- 10 monster abilities
- 10 loot-table records
- Supporting definitions for bosses, chests, NPCs, achievements, outfits, sets, uniques, and seasons

## Current position

Database Schema: Ready for Gameplay Implementation
Development Content: Populated
Content Importer: Working
Dry Run: Verified
Repeat Import: Verified
Gameplay Implementation: Not Started
Current Milestone: M1 Character Foundation

---

# IMMEDIATE NEXT TASK

Implement M1 Character Foundation.

The first implementation package must include:

1. Character domain rules
2. Character creation service
3. Character repository interface
4. PostgreSQL character repository
5. Character ownership authorization
6. Maximum active-character validation
7. Globally unique name validation
8. Initial progression initialization
9. Initial statistics initialization
10. Initial unlock initialization
11. Initial loadout initialization
12. Resource regeneration service
13. Character snapshot service
14. Character creation endpoint
15. Character list endpoint
16. Character snapshot endpoint
17. Character archive endpoint
18. Unit tests
19. PostgreSQL integration tests
20. Authorization tests
21. Transaction rollback tests

M1 is complete only when a newly created character can be loaded as a complete gameplay-ready snapshot for use by M2 and M3.
```

# ============================================================
# SOURCE: documentation/database-design/combat-design.md
# ============================================================

```text
# Combat Design
## Tibia Browser RPG

---

# 1. Combat Vision

Combat is a turn-based RPG system focused on preparation, character optimization, resource management, and risk versus reward.

The strongest characters are not determined by reaction speed.

Success comes from:

- Equipment optimization
- Spell loadouts
- Consumable management
- Character progression
- Resource preparation

Combat should be:

- Easy to understand
- Fast to resolve
- Difficult to master
- Highly scalable
- Database-driven

The most important decisions happen before combat begins.

---

# 2. Combat Structure

Combat is fully turn-based.

Players fight a single monster at a time.

After combat ends, the player returns to the monster selection interface.

There is no escape mechanic.

Once combat begins it ends only when:

- Player dies
- Monster dies
- Maximum combat duration is reached

Rewards are granted immediately after victory.

---

# 3. Energy Cost

Combat consumes Energy when the encounter begins.

Regular Monster:

- 3 Energy

Boss:

- 5 Energy

Energy is consumed immediately when combat starts.

If insufficient Energy exists:

- Combat cannot begin

Energy is never consumed during combat actions.

---

# 4. Turn Order

Player always acts first.

Combat Flow:

Player Action

↓

Resolve Effects

↓

Monster Action

↓

Resolve Effects

↓

Next Turn

---

# 5. Available Actions

Each turn a player may perform exactly one action.

Available actions:

- Attack
- Cast Spell
- Use Consumable

Using a consumable consumes the entire turn.

---

# 6. Combat Statistics

Combat effectiveness is determined by:

## Attack

Used for:

- Physical hit chance
- Physical damage

## Defense

Used for:

- Physical avoidance
- Physical damage reduction

## Health

Determines survivability.

When Health reaches 0:

- Character dies
- Combat immediately ends

## Mana

Required for spell casting.

## Spell Power

Determines effectiveness of:

- Damage Spells
- Healing Spells
- Damage Over Time
- Heal Over Time
- Health Drain
- Mana Drain

Base Value:

100%

Sources:

- Equipment
- Spell Mastery
- Temporary Buffs

Passive bonuses are not part of combat calculations:

- Gold Bonus %
- Experience Bonus %

---

## Combat Statistic Minimums

Combat uses finalized Effective Character Statistics.

Effective Attack, Defense, and Spell Power cannot be lower than 0.

Combat does not apply separate statistic clamping and does not recalculate
effective statistics independently. Minimum values are enforced by the
authoritative Effective Character Statistics calculator before the statistics
are used by combat.

# 7. Character Combat Resources

## Health

Starting Health:

180

Health does not regenerate during combat.

Health can only be restored through:

- Potions
- Healing Spells
- Heal Over Time
- Health Drain

Health can never exceed maximum Health.

---

## Mana

Starting Mana:

35

Mana is required for casting spells.

Mana regeneration is disabled during combat.

Mana may only be restored through:

- Mana Potions

Mana cannot exceed maximum Mana.
---

Combat never calculates maximum resources.
 
Combat uses EffectiveCharacterStats exclusively.
---

# 8. Physical Combat

Definitions:

AA = Attacker Attack

DD = Defender Defense

---

## Hit Chance Formula

Formula:

((AA - DD) × 4)%

Examples:

AA = 100

DD = 80

Hit Chance = 80%

---

AA = 100

DD = 90

Hit Chance = 40%

---

AA = 100

DD = 100

Hit Chance = 0%

---

## Hit Chance Limits

Minimum Hit Chance:

5%

Maximum Hit Chance:

90%

Rules:

- Every attack can hit
- Every attack can miss

---

## Damage Formula

If the attack hits:

Minimum Damage:

AA - DD

Maximum Damage:

(AA - DD) × 2

Random value rolled inside range.

Examples:

AA = 100

DD = 80

Damage:

20 - 40

---

AA = 100

DD = 98

Damage:

2 - 4

---

AA = 100

DD = 100

Damage:

0

Damage may be zero.

---

# 9. Spell System Overview

Spells are fixed templates.

Players unlock spells permanently.

Requirements:

- Character Level
- Gold Cost

Spells are not randomly acquired.

The game is built around spell loadouts rather than complex rotations.

---

# 10. Spell Slots

Default:

1 Spell Slot

Additional Slots:

Slot 2

Requirements:

- Level 20
- 10,000 Gold

Slot 3

Requirements:

- Level 50
- 100,000 Gold

Maximum:

3 Active Spell Slots

Rules:

- Same spell cannot occupy multiple slots
- Spell loadouts may be changed outside combat

---

# 11. Spell Categories

## Damage

Direct spell damage.

Rules:

- Cannot miss
- Ignores Defense
- Scales with Spell Power

Examples:

- Fireball

---

## Damage Over Time

Applies recurring damage.

Examples:

- Poison
- Burn

---

## Healing

Instant Health restoration.

Rules:

- Cannot exceed Maximum Health
- Scales with Spell Power

Examples:

- Light Healing
- Ultimate Healing

---

## Heal Over Time

Applies Health regeneration over several turns.

---

## Mana Drain

Removes Mana directly.

---

## Health Drain

Deals damage and restores Health.

---

## Stat Buff

Temporarily increases:

- Attack
- Defense
- Spell Power

Examples:

- Battle Focus
- Stone Skin

---

## Stat Debuff

Temporarily decreases:

- Attack
- Defense
- Spell Power

---

## Potion Disable

Prevents potion usage.

Variants:

- Health Potions Only
- Mana Potions Only
- All Potions

---

# 12. Spell Targeting

Every spell has exactly one target type.

Possible targets:

- Self
- Enemy

Examples:

Fireball

→ Enemy

Healing

→ Self

Defense Buff

→ Self

Attack Debuff

→ Enemy

---

# 13. Spell Mana Cost

Every spell has a fixed Mana Cost.

Examples:

Fireball:

30 Mana

Light Healing:

25 Mana

Ultimate Healing:

150 Mana

Mana Cost never scales.

---

# 14. Spell Cooldowns

Every spell stores an independent cooldown.

Cooldown unit:

Turns

Examples:

Fireball

2 Turns

Heal

5 Turns

Ultimate Heal

8 Turns

---

# 15. Spell Power Scaling

Every spell stores Base Value.

Formula:

Final Value = Base Value × Spell Power

Example:

Fireball

Base Damage:

100

Spell Power:

150%

Final Damage:

150

---

Healing Example

Base Heal:

150

Spell Power:

120%

Final Heal:

180

---

# 16. Spell Mastery

Spell Mastery is a global progression system.

Progression:

Cast Spell

↓

Gain Spell Mastery XP

↓

Increase Spell Mastery Level

↓

Increase Spell Power

Characteristics:

- Infinite progression
- Separate experience system
- Independent from Character Level
- Long-term progression

Examples:

Level 1

Spell Power 100%

Level 10

Spell Power 110%

Level 50

Spell Power 150%

Spell Mastery applies to every spell equally.

---

# 17. Effect Duration System

Effects use turn durations.

Examples:

Poison

3 Turns

Defense Buff

5 Turns

Potion Disable

2 Turns

---

# 18. Effect Stacking Rules

Effects do not stack.

Reapplying an active effect:

- Refreshes duration
- Replaces existing effect

Never creates duplicate instances.

Applies to:

- Damage Over Time
- Heal Over Time
- Buffs
- Debuffs
- Potion Disable

---

# 19. Consumables

Consumables may be used during combat.

Using a consumable consumes the player's turn.

Combat consumables:

- Health Potions
- Mana Potions

Energy Potions cannot be used during combat.

---

# 20. Potion Loadout

Characters carry:

- 1 Health Potion Type
- 1 Mana Potion Type

Configured before combat.

Examples:

Health:

Grand Health Potion

Mana:

Large Mana Potion

---

# 21. Potion Capacity

Maximum carried:

10 Health Potions

10 Mana Potions

Potions may be used on consecutive turns.

Example:

Turn 1

Health Potion

Turn 2

Health Potion

Turn 3

Health Potion

Valid

---

# 22. Monster Combat

Monsters use the same combat framework.

Monster Statistics:

- Health
- Attack
- Defense
- Spell Power

Monsters may:

- Attack
- Cast Spells

Monsters cannot:

- Use Consumables

---

# 23. Monster Ability System

Each monster has:

Ability Chance %

Every turn:

Roll Ability Chance

Success:

Use Ability

Failure:

Use Basic Attack

Examples:

Rat

0%

Demon

70%

Ancient Dragon

90%

---

## Available Monster Abilities

Monsters may use:

- Damage Spells
- Damage Over Time
- Healing
- Heal Over Time
- Mana Drain
- Health Drain
- Buffs
- Debuffs
- Potion Disable

Monster abilities use the same spell rules as player spells.

---

# 24. Monster Access Rules

A player may only fight monsters where:

Character Level >= Monster Level

Examples:

Character Level 20

Can Fight:

Levels 1-20

Cannot Fight:

Levels 21+

---

# 25. Boss Combat

Bosses use the normal combat system.

No special mechanics exist in V1.

Boss difficulty is created through:

- Higher Health
- Higher Attack
- Higher Defense
- Higher Spell Power
- Stronger Ability Sets
- Better Loot Tables

Future versions may introduce:

- Multi-phase Battles
- Unique Mechanics
- Enrage Systems
- Summons

---

# 26. Combat Rewards

Rewards are generated immediately upon victory.

Possible rewards:

- Experience
- Gold
- Equipment
- Materials
- Consumables

Reward generation is fully database-driven.

---

# 27. Death System

Death has meaningful progression consequences.

When Health reaches 0:

- Character dies
- Combat ends immediately

Default Death Penalty:

10% Total Experience

Promoted Character:

8% Total Experience

Consequences:

- Experience loss
- Level loss
- Multiple level loss

Experience removed through death is permanently lost.

---

# 28. Blessings

Blessings reduce death penalties.

Only one Blessing may be active at a time.

Blessings must be manually activated.

Upon death:

- Active Blessing is consumed
- Reduced penalty is applied

Death Loss:

Normal Character

10% → 6%

Promoted Character

8% → 4%

Blessings provide protection for one death only.

---

# 29. Promotion

Promotion is a permanent character upgrade.

Requirements:

- Level 20
- 20,000 Gold

Benefits:

Death Penalty

10% → 8%

Promotion is permanent.

---

# 30. Combat Log

Every combat generates a detailed combat log.

Example Information:

- Turns
- Attacks
- Spell Casts
- Damage
- Healing
- Effects
- Resource Changes

Stored Logs:

10 Most Recent Combats

When capacity is exceeded:

- New log added
- Oldest log removed

Purpose:

- Fight Analysis
- Death Review
- Boss Review
- Bug Investigation

Combat logs are not stored permanently.

---

# 31. Maximum Combat Duration

Maximum:

100 Turns

If combat exceeds 100 turns:

- Player loses
- Combat immediately ends
- Death penalties apply

This rule exists to prevent infinite combat caused by extreme defensive or healing combinations.

---

# 32. Combat Design Philosophy

Combat complexity should come from:

- Equipment
- Spell Selection
- Consumables
- Character Progression

Not from execution speed.

The player should solve most combat challenges before the fight begins through preparation and build optimization.

Core Combat Loop:

Character Build

↓

Equipment

↓

Spell Loadout

↓

Consumables

↓

Combat

↓

Rewards

↓

Progression
```

# ============================================================
# SOURCE: documentation/database-design/combat-effect-definition.md
# ============================================================

```text
# COMBAT EFFECT DEFINITION

## Overview

Combat Effects are temporary effects applied during combat.

Combat Effects may be:

- Buffs
- Debuffs
- Damage Over Time Effects
- Heal Over Time Effects

Multiple Combat Effects may exist simultaneously.

Combat Effects are stored separately from character progression buffs.

---

# Effect Categories

## Damage Over Time

Applies damage over multiple turns.

Examples:

- Poison

Target:

- Enemy

Damage Over Time effectiveness scales with Spell Power.

---

## Heal Over Time

Applies healing over several turns.

Target:

- Self

Healing effectiveness scales with Spell Power.

---

## Stat Buff

Temporarily increases character statistics.

Possible Statistics:

- Attack
- Defense
- Spell Power

Target:

- Self

Duration:

- Fixed number of turns

---

## Stat Debuff

Temporarily reduces character statistics.

Possible Statistics:

- Attack
- Defense
- Spell Power

Target:

- Enemy

Duration:

- Fixed number of turns

---

## Mana Drain

Removes Mana directly.

Target:

- Enemy

---

## Health Drain

Deals damage and restores health.

Target:

- Enemy

Health Drain effectiveness scales with Spell Power.

---

## Potion Disable

Prevents potion usage.

Target:

- Enemy

Variants:

- All Potions
- Health Potions Only
- Mana Potions Only

---

# Sources

Combat Effects may originate from:

- Player Spells
- Monster Abilities

Monsters may use:

- Damage Spell
- Damage Over Time
- Self-Heal
- Heal Over Time
- Potion Disable
- Mana Drain
- Health Drain

Monster abilities use the same effect definitions as players.

---

# Spell Power Interaction

Spell Power affects:

- Damage Over Time
- Heal Over Time
- Health Drain

Examples:

Spell Base Value:

100

Spell Power:

100%

Final Value:

100

Spell Power:

150%

Final Value:

150

Monster Spell Power functions identically.

---

# Duration System

Effects use turn durations.

Examples:

Poison:

- 3 Turns

Defense Buff:

- 5 Turns

Potion Disable:

- 2 Turns

Durations are stored in turns.

---

# Stacking Rules

Effects do not stack.

Example:

Poison Active:

- 3 Turns

New Poison Cast

Result:

- Existing effect refreshed

Not:

- Two simultaneous poison effects

This rule applies to:

- Damage Over Time
- Heal Over Time
- Buffs
- Debuffs
- Potion Disable

---

# Targeting Rules

Each effect has exactly one target type.

Target Types:

- Self
- Enemy

Examples:

Heal Over Time

→ Self

Defense Buff

→ Self

Attack Debuff

→ Enemy

Poison

→ Enemy

Mana Drain

→ Enemy

Health Drain

→ Enemy

Potion Disable

→ Enemy

---

# Database

## CombatEffects

Stores:

- Active Buffs
- Active Debuffs
- Damage Over Time
- Heal Over Time
- Potion Disable
- Mana Drain
- Health Drain
- Stat Modifiers
- Remaining Duration
```

# ============================================================
# SOURCE: documentation/database-design/monster-definition.md
# ============================================================

```text
# Monster Definition
## Tibia Browser RPG

---

# 1. Overview

Defines every:

- Monster
- Mini Boss
- Task Boss
- Daily Boss

All content is database-driven.

No formulas generate monster statistics.

Every monster is manually balanced.

---

# 2. Identity

## Monster ID

Unique internal identifier.

---

## Name

Globally unique.

Examples:

Rat

Wolf

Skeleton Archer

Ancient Dragon

No duplicate names are allowed.

---

## Description

Short lore description.

Displayed in:

- Monster Details
- Bestiary

---

## Artwork

Every monster has its own artwork.

Examples:

Rat

Plague Rat

Rat King

All use separate artwork.

---

## Family

Single family assignment.

Examples:

- Rat
- Wolf
- Vampire
- Dragon
- Skeleton

No hierarchy exists.

Relationship:

Family

↓

Monster

Each monster belongs to exactly one family.

---

# 3. Progression

## Monster Level

Defines:

- Accessibility
- Loot Progression
- Material Progression

Requirement:

Character Level ≥ Monster Level

---

## Loot Level Modifier

Default:

0

Possible values:

- Negative
- Positive

Examples:

0

+5

+10

+20

Used during loot generation.

---

## Power Score

Hidden value.

Used for:

- Analytics
- Balancing
- Internal Comparisons

Not visible to players.

---

# 4. Combat Statistics

Every monster stores:

- Health
- Attack
- Defense
- Spell Power

Examples of Spell Power:

100%

125%

200%

---

## Cooldown

Stored in seconds.

Examples:

10

60

300

Cooldown is tracked per player.

Every player has independent cooldown tracking.

---

# 5. Ability System

## Ability Chance %

Every turn:

Roll Ability Chance.

Success:

→ Cast Ability

Failure:

→ Basic Attack

Examples:

0%

25%

50%

100%

---

## Abilities

Abilities are assigned from a shared ability database.

Examples:

- Fireball
- Damage Over Time
- Heal
- Heal Over Time
- Mana Drain
- Health Drain
- Potion Disable

---

## Ability Selection

Abilities use weighted random selection.

Example:

Fireball:

70

Heal:

20

Mana Drain:

10

Result:

70% Fireball

20% Heal

10% Mana Drain

---

## Ability Count

Unlimited abilities may be assigned to a monster.

All assignments are database-driven.

---

## Ability Scaling

Abilities are generic templates.

Example:

Fireball

Damage scales through Monster Spell Power.

There are no separate spell records such as:

- Fireball I
- Fireball II
- Fireball III

---

# 6. Loot Settings

## Gold Rewards

Every monster stores:

- Gold Min
- Gold Max

---

## Equipment Drop Chance

Controls chances for:

- Weapon
- Helmet
- Armor
- Shield
- Legs
- Boots

---

## Jewelry Drop Chance

Controls chances for:

- Rings
- Amulets

Independent from equipment.

---

## Other Loot Chance

Controls:

- Materials
- Potions
- Blessings
- Boosts
- Protection Stones

---

## Unique Modifier

Default:

1.0

Examples:

Rat:

1.0

---

Mini Boss:

2.0

---

Task Boss:

5.0

---

Daily Boss:

10.0

Applied together with the Unique Pity System.

---

# 7. Task Boss Links

## Task Boss ID

Optional field.

Links a monster to its Task Boss.

Example:

Rat

→ Rat King

---

## Required Kills

Number of kills required to unlock the Task Boss.

Examples:

100

500

1000

Fully database-driven.

---

# 8. Bestiary

## Unlock Condition

First Kill

Example:

Kill Rat

↓

Rat unlocked in Bestiary

Once unlocked, all information becomes visible immediately.

There is no progressive discovery system.

---

## Displayed Information

Each Bestiary entry displays:

- Name
- Artwork
- Description
- Monster Family
- Monster Level
- Health
- Attack
- Defense
- Spell Power
- Abilities
- Loot Table
- Material Drops

All information becomes visible immediately after unlock.

---

## Tracking

The Bestiary permanently tracks:

- Kill Count
- First Kill Date
- Last Kill Date

Examples:

Rat:

521 Kills

Wolf:

104 Kills

Dragon:

12 Kills

Tracking is character-specific.

---

## Task Boss Progress

The Bestiary displays Task Boss progress.

Example:

Rat

Kills:

83 / 100

Task Boss:

Rat King

Status:

Locked

---

Rat

Kills:

100 / 100

Task Boss:

Rat King

Status:

Unlocked

Task progress is displayed directly on the monster entry.

---

## Monster Families

Monsters are grouped by Family.

Examples:

Rats

- Rat
- Plague Rat
- Giant Rat

---

Dragons

- Dragon
- Dragon Lord
- Ancient Dragon

---

Vampires

- Vampire
- Vampire Bride
- Vampire Lord

Families are used for organization only.

---

## Bestiary Completion

The Bestiary tracks collection progress.

Examples:

15 / 100

67 / 100

100 / 100

Progress measures unlocked monster entries.

---

## Profile Integration

Character Profiles display:

- Bestiary Completion %
- Total Monsters Unlocked
- Total Monsters Killed

Examples:

Bestiary:

74 / 100

Total Kills:

31,582

---

## Rewards

The Bestiary provides:

- No Gold
- No Items
- No Consumables
- No Permanent Bonuses

The Bestiary is informational only.

Monster-related rewards come from:

- Achievements
- Task Bosses
- Loot Drops

---

# 9. Monster Types

Available Monster Types:

- Normal Monster
- Mini Boss
- Task Boss
- Daily Boss

All are stored as independent database records.

Examples:

Rat

Plague Rat

Rat King

Ancient Rat Emperor

Each has its own:

- Stats
- Loot
- Cooldowns
- Abilities
- Artwork

---

# 10. Database

## BestiaryEntries

Stores:

- Character
- Monster
- Unlock Date

---

## BestiaryStatistics

Stores:

- Monster Kill Count
- First Kill Date
- Last Kill Date

---

# 11. Content Philosophy

Every monster is a unique entity.

Examples:

- Rat
- Wolf
- Spider
- Bear

Not:

- Rat Level 1
- Rat Level 5
- Rat Level 10

Target Content:

- Approximately 100 Unique Monsters
- 10-15 Mini Bosses
- Multiple Task Bosses
- Multiple Daily Bosses

Each monster should feel distinct and collectible.

---

# 12. Design Philosophy

The Bestiary exists to provide:

Monster Discovery

↓

Monster Information

↓

Monster Tracking

↓

Collection Progress

The system is intended to be:

- Simple
- Informative
- Completion-Oriented

without providing additional character power.

---

# 13. Tracking Philosophy

Per Character:

Monster Kill Count

Examples:

Rat:

500

Wolf:

120

Dragon:

7

Used for:

- Achievements
- Task Bosses
- Statistics
- Bestiary

---

# 14. Monster Philosophy

Every monster is manually defined.

Every monster has its own:

- Name
- Artwork
- Stats
- Abilities
- Loot
- Identity

The goal is for every monster to feel like a unique piece of content rather than a scaled version of another monster.
```

# ============================================================
# SOURCE: documentation/database-design/spell-definition.md
# ============================================================

```text
# Spell Definition
## Tibia Browser RPG

---

# 1. Overview

Spells are fixed templates.

Players unlock spells permanently through Gold purchases.

Monsters use the same spell definitions and scale spell effectiveness through Spell Power.

---

# 2. Spell Identity

## Spell ID

Unique internal identifier.

---

## Name

Examples:

- Light Healing
- Intense Healing
- Ultimate Healing
- Fireball
- Poison
- Mana Burn
- Battle Focus
- Stone Skin

---

## Description

Short explanation shown to players.

Example:

"Heals the caster for a moderate amount of Health."

---

## Artwork / Icon

Every spell has its own icon.

Used in:

- Spellbook
- Combat Log
- Spell Slots

---

# 3. Unlocking

All spells are unlocked through:

Spell Menu

↓

Purchase Spell

Requirements:

- Character Level
- Gold Cost

Examples:

Light Healing

Level:

1

Gold:

1,000

---

Ultimate Healing

Level:

100

Gold:

500,000

---

# 4. Spell Slots

Default:

1 Spell Slot

---

## Additional Spell Slots

Slot 2:

- Level Requirement
- Gold Cost

---

Slot 3:

- Level Requirement
- Gold Cost

---

Maximum:

3 Active Spell Slots

---

## Duplicate Rules

The same spell cannot occupy multiple slots.

Example:

Fireball

Fireball

Fireball

Invalid

---

# 5. Spell Categories

## Damage

Direct damage spell.

Target:

Enemy

---

## Damage Over Time

Applies damage over multiple turns.

Target:

Enemy

---

## Healing

Instant healing.

Target:

Self

---

## Heal Over Time

Applies healing over multiple turns.

Target:

Self

---

## Mana Drain

Removes Mana from the target.

Target:

Enemy

---

## Health Drain

Deals damage and restores Health.

Target:

Enemy

---

## Potion Disable

Prevents potion usage.

Target:

Enemy

Variants may include:

- All Potions
- Health Potions Only
- Mana Potions Only

---

## Stat Buff

Temporarily increases:

- Attack
- Defense
- Spell Power

Target:

Self

---

## Stat Debuff

Temporarily reduces:

- Attack
- Defense
- Spell Power

Target:

Enemy

---

# 6. Targeting

Every spell has exactly one target type.

Available Targets:

- Self
- Enemy

No spell can target both.

Examples:

Fireball

→ Enemy

---

Heal

→ Self

---

Defense Buff

→ Self

---

Attack Debuff

→ Enemy

---

# 7. Mana Cost

Every spell contains a fixed Mana Cost.

Examples:

Fireball

30 Mana

---

Light Healing

25 Mana

---

Ultimate Healing

150 Mana

Mana Costs are stored per spell.

Mana Costs never scale.

---

# 8. Cooldowns

Every spell contains a Cooldown.

Cooldowns are stored in turns.

Examples:

Fireball

2 Turns

---

Heal

5 Turns

---

Ultimate Heal

8 Turns

Cooldowns are tracked independently.

---

# 9. Scaling

Every spell stores a Base Value.

Examples:

Fireball

Base Damage:

100

---

Healing

Base Heal:

150

---

Poison

Base Damage:

25 per Turn

---

## Spell Power Formula

Final Value

=

Base Value

×

Spell Power

Examples:

Fireball

Base Damage:

100

Character Spell Power:

150%

Final Damage:

150

Monster Spell Power uses the same formula.

---

# 10. Accuracy

Spells never miss.

Spells always succeed.

There is:

- No Hit Chance
- No Spell Accuracy

---

# 11. Duration System

Effects use turn durations.

Examples:

Poison

3 Turns

---

Defense Buff

5 Turns

---

Potion Disable

2 Turns

---

# 12. Stacking Rules

Effects do not stack.

Example:

Poison

Active:

3 Turns

---

New Poison Cast

Result:

Refresh Existing Effect

Not:

Two Simultaneous Poison Effects

---

This applies to:

- Damage Over Time
- Heal Over Time
- Buffs
- Debuffs
- Potion Disable

---

# 13. Spell Progression

Spells may have stronger successors.

Example:

Light Healing

↓

Intense Healing

↓

Ultimate Healing

These are separate spells.

Players choose which version to equip.

---

# 14. Monster Usage

Monsters use the same spell definitions as players.

Monster abilities are assigned from the shared spell database.

Spell effectiveness scales through Monster Spell Power.

There are no separate monster-only versions such as:

- Fireball I
- Fireball II
- Fireball III

---

# 15. Combat Philosophy

Combat is built around:

Spell Loadouts

not

Spell Rotations.

The primary decision happens before combat begins.

Examples:

Boss Build:

- Ultimate Heal
- Defense Buff
- Health Drain

---

Damage Build:

- Fireball
- Damage Over Time
- Attack Buff

---

Anti-Healing Build:

- Poison
- Healing Reduction
- Fireball

Different encounters should encourage different spell selections.

The strongest players are expected to adapt their loadouts to specific challenges rather than always using the same three spells.

---

# 16. Expected Spell Count

Target:

15-30 Total Spells

Mix:

- Offensive
- Defensive
- Utility

The spell list should remain relatively small and
```

# ============================================================
# RELEVANT FILE INVENTORY
# ============================================================

```text
database\migrations\005_spells.sql
database\migrations\010_monster_families.sql
database\migrations\011_monsters.sql
database\migrations\023_character_spell_mastery.sql
database\migrations\024_character_spells.sql
database\migrations\027_character_statistics.sql
database\migrations\036_bestiary_statistics.sql
database\migrations\038_monster_tasks.sql
database\migrations\039_monster_abilities.sql
database\migrations\040_monster_ability_weights.sql
database\migrations\046_combat_sessions.sql
database\migrations\047_combat_effects.sql
database\migrations\048_combat_spell_cooldowns.sql
database\migrations\049_combat_logs.sql
database\migrations\081_effective_character_statistics.sql
database\migrations\083_add_monster_energy_cost.sql
database\migrations\085_unique_monster_task_boss.sql
documentation\database-design\combat-design.md
documentation\database-design\combat-effect-definition.md
documentation\database-design\monster-definition.md
documentation\database-design\spell-definition.md
src\application\ports\clock.ts
src\infrastructure\clock\system-clock.ts
src\modules\characters\application\character-statistics.repository.ts
src\modules\characters\domain\effective-character-statistics.ts
src\modules\characters\infrastructure\postgres-character-statistics.repository.ts
src\modules\monsters\application\get-monster-details.service.ts
src\modules\monsters\application\get-monster-list.service.ts
src\modules\monsters\application\monster-discovery.models.ts
src\modules\monsters\application\monster-discovery.repository.ts
src\modules\monsters\domain\monster.errors.ts
src\modules\monsters\domain\monster.types.ts
src\modules\monsters\domain\monster-cooldown.ts
src\modules\monsters\domain\monster-eligibility.ts
src\modules\monsters\http\monster-http.handler.ts
src\modules\monsters\http\monster-http.request.ts
src\modules\monsters\infrastructure\postgres-monster.mapper.ts
src\modules\monsters\infrastructure\postgres-monster-discovery.repository.ts
tests\integration\characters\postgres-character-statistics.repository.test.ts
tests\integration\http\monster-discovery.http.test.ts
tests\integration\monsters\daily-boss-discovery.repository.test.ts
tests\integration\monsters\postgres-monster-discovery.repository.test.ts
tests\unit\characters\effective-character-statistics.test.ts
tests\unit\characters\postgres-character-statistics.repository.test.ts
tests\unit\http\monster-http.handler.test.ts
tests\unit\http\monster-http.request.test.ts
tests\unit\infrastructure\system-clock.test.ts
tests\unit\monsters\daily-boss-discovery.service.test.ts
tests\unit\monsters\daily-boss-eligibility.test.ts
tests\unit\monsters\get-monster-details.service.test.ts
tests\unit\monsters\get-monster-list.service.test.ts
tests\unit\monsters\monster-cooldown.test.ts
tests\unit\monsters\monster-eligibility.test.ts
tests\unit\monsters\task-boss-discovery.service.test.ts
```

# ============================================================
# RANDOMNESS AUDIT
# ============================================================

```text
tests/helpers/test-account.ts:1:import { randomUUID } from "node:crypto";
tests/helpers/test-account.ts:20:  const suffix = randomUUID().replaceAll("-", "");
tests/integration/characters/postgres-character-achievements.repository.test.ts:1:n++import { randomUUID } from "node:crypto";
tests/integration/characters/postgres-character-achievements.repository.test.ts:59:      name: `Achievement ${randomUUID().slice(0, 8)}`,
tests/integration/characters/postgres-character-achievements.repository.test.ts:64:    const suffix = randomUUID().replaceAll("-", "");
tests/integration/characters/postgres-character-buffs.repository.test.ts:1:n++import { randomUUID } from "node:crypto";
tests/integration/characters/postgres-character-buffs.repository.test.ts:50:      name: `Buff ${randomUUID().slice(0, 8)}`,
tests/integration/characters/postgres-character-set-bonuses.repository.test.ts:1:n++import { randomUUID } from "node:crypto";
tests/integration/characters/postgres-character-set-bonuses.repository.test.ts:73:      name: `Set ${randomUUID().slice(0, 8)}`,
tests/integration/characters/postgres-character-set-bonuses.repository.test.ts:78:    const suffix = randomUUID().replaceAll("-", "");
tests/integration/characters/postgres-character-statistics.repository.test.ts:1:n++import { randomUUID } from "node:crypto";
tests/integration/characters/postgres-character-statistics.repository.test.ts:82:      name: `Stats ${randomUUID().slice(0, 8)}`,
tests/integration/characters/postgres-character-statistics.repository.test.ts:103:        [`${input.namePrefix.toLowerCase()}_${randomUUID().replaceAll("-", "")}`, `${input.namePrefix} ${randomUUID()}`, input.slot, input.value]
tests/integration/characters/postgres-equipment.repository.test.ts:1:n++import { randomUUID } from "node:crypto";
tests/integration/characters/postgres-equipment.repository.test.ts:95:      `equipment_test_${randomUUID().replaceAll("-", "")}`,
tests/integration/characters/postgres-equipment.repository.test.ts:96:      `Equipment Test ${randomUUID()}`,
tests/integration/characters/postgres-equipment.repository.test.ts:243:        name: `Equip ${randomUUID().slice(0, 8)}`,
tests/integration/characters/postgres-equipment.repository.test.ts:287:        name: `Clamp ${randomUUID().slice(0, 8)}`,
tests/integration/characters/postgres-equipment.repository.test.ts:330:        name: `TwoHanded ${randomUUID().slice(0, 8)}`,
tests/integration/characters/postgres-equipment.repository.test.ts:367:        name: `Shield ${randomUUID().slice(0, 8)}`,
tests/integration/characters/postgres-equipment.repository.test.ts:404:        name: `Level ${randomUUID().slice(0, 8)}`,
tests/integration/http/monster-discovery.http.test.ts:1:import { randomUUID } from "node:crypto";
tests/integration/http/monster-discovery.http.test.ts:74:    `monster-http-${randomUUID()}`;
tests/integration/http/monster-discovery.http.test.ts:182:          `NoAuth-${randomUUID().slice(0, 8)}`
tests/integration/http/monster-discovery.http.test.ts:231:          `List-${randomUUID().slice(0, 8)}`
tests/integration/http/monster-discovery.http.test.ts:307:          `Details-${randomUUID().slice(0, 8)}`
tests/integration/http/monster-discovery.http.test.ts:370:          `Unknown-${randomUUID().slice(0, 8)}`
tests/integration/http/monster-discovery.http.test.ts:427:          `Foreign-${randomUUID().slice(0, 8)}`
tests/integration/infrastructure/transaction.test.ts:1:import { randomUUID } from "node:crypto";
tests/integration/infrastructure/transaction.test.ts:53:    const testId = randomUUID();
tests/integration/infrastructure/transaction.test.ts:101:    const testId = randomUUID();
tests/integration/monsters/daily-boss-discovery.repository.test.ts:1:import { randomUUID } from "node:crypto";
tests/integration/monsters/daily-boss-discovery.repository.test.ts:86:  const suffix = randomUUID().replaceAll(
tests/integration/monsters/daily-boss-discovery.repository.test.ts:389:          `NoRot-${randomUUID().slice(0, 8)}`
tests/integration/monsters/daily-boss-discovery.repository.test.ts:415:          `Active-${randomUUID().slice(0, 8)}`
tests/integration/monsters/daily-boss-discovery.repository.test.ts:448:          `Exhaust-${randomUUID().slice(0, 8)}`
tests/integration/monsters/daily-boss-discovery.repository.test.ts:498:          `Overlap-${randomUUID().slice(0, 8)}`
```

