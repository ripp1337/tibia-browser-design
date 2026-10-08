# M6 Technical Dump

Generated: 2026-10-08 13:49:34 +02:00
Repository root: C:\Projects\ostatnia-szansa-game

## Purpose

Fresh source dump for planning M6: Victory, Death, and Progression.

## Source priority

1. Current compiling code
2. Current PostgreSQL schema
3. Passing automated tests
4. CURRENT_MILESTONE.md
5. MASTER_PROJECT_PLAN.md
6. Historical milestone dumps

## Repository state

```text
Branch: m6/victory-death-progression

Working tree:
?? M6_SCHEMA_DATA_DUMP.md
?? M6_TECHNICAL_DUMP.md
?? scripts/generate-m6-context.ps1

Recent commits:
a56e0c8 align documentation after M5
331a28a complete M5 documentation
2fec50c stabilize combat integration fixtures
de9b527 test persistent combat HTTP flow
f2236f0 connect persistent combat routes
5b0f2dc add authenticated combat HTTP handler
adb6ca5 add persistent combat retrieval
de9ae2f implement transactional combat actions
2db8ec3 implement transactional combat start
263b3ca add transactional combat start infrastructure
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

import { GetActiveCombatService } from "./modules/combat/application/get-active-combat.service.js";
import { GetCombatLogService } from "./modules/combat/application/get-combat-log.service.js";
import { GetCombatSessionService } from "./modules/combat/application/get-combat-session.service.js";
import { ResolveCombatActionService } from "./modules/combat/application/resolve-combat-action.service.js";
import { StartCombatService } from "./modules/combat/application/start-combat.service.js";
import { CryptoRandomSource } from "./modules/combat/infrastructure/crypto-random-source.js";
import { PostgresCombatSessionRepository } from "./modules/combat/infrastructure/postgres-combat-session.repository.js";
import { createCombatHttpHandler } from "./modules/combat/http/combat-http.handler.js";

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

function isCombatRoute(
  requestUrl: string | undefined
): boolean {
  const url = new URL(
    requestUrl ?? "/",
    "http://localhost"
  );

  return /^\/characters\/[^/]+\/combat(?:\/[^/]+(?:\/log)?|\/actions)?$/u.test(
    url.pathname
  );
}

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

  const combatRepository =
    new PostgresCombatSessionRepository(
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
  const randomSource =
    new CryptoRandomSource();

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

  const startCombatService =
    new StartCombatService(
      combatRepository,
      clock
    );

  const resolveCombatActionService =
    new ResolveCombatActionService(
      combatRepository,
      randomSource,
      clock
    );

  const getActiveCombatService =
    new GetActiveCombatService(
      combatRepository
    );

  const getCombatSessionService =
    new GetCombatSessionService(
      combatRepository
    );

  const getCombatLogService =
    new GetCombatLogService(
      combatRepository
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

  const combatHandler =
    createCombatHttpHandler({
      authenticationProvider,
      startCombatService,
      resolveCombatActionService,
      getActiveCombatService,
      getCombatSessionService,
      getCombatLogService,
    });

  return createServer(
    (request, response) => {
      if (isCombatRoute(request.url)) {
        void combatHandler(
          request,
          response
        );

        return;
      }

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
# SOURCE: src/modules/combat/application/combat-session.errors.ts
# ============================================================

```text
import {
  ApplicationError,
} from "../../../application/errors/application-error.js";

export const COMBAT_SESSION_ERROR_CODE = {
  combatAlreadyActive:
    "COMBAT_ALREADY_ACTIVE",
  combatSessionNotFound:
    "COMBAT_SESSION_NOT_FOUND",
  combatTurnMismatch:
    "COMBAT_TURN_MISMATCH",
  combatAlreadyEnded:
    "COMBAT_ALREADY_ENDED",
  insufficientEnergy:
    "INSUFFICIENT_ENERGY",
  characterHealthDepleted:
    "CHARACTER_HEALTH_DEPLETED",
  monsterNotEligible:
    "MONSTER_NOT_ELIGIBLE",
  invalidPersistentCombatState:
    "COMBAT_INVALID_PERSISTENT_STATE",
} as const;

export type CombatSessionErrorCode =
  (typeof COMBAT_SESSION_ERROR_CODE)[keyof typeof COMBAT_SESSION_ERROR_CODE];

export class CombatAlreadyActiveError
  extends ApplicationError {
  public constructor() {
    super({
      code:
        COMBAT_SESSION_ERROR_CODE.combatAlreadyActive,
      message:
        "The character already has an active combat session.",
      statusCode: 409,
    });

    this.name = "CombatAlreadyActiveError";
  }
}

export class CombatSessionNotFoundError
  extends ApplicationError {
  public constructor() {
    super({
      code:
        COMBAT_SESSION_ERROR_CODE.combatSessionNotFound,
      message:
        "Combat session was not found.",
      statusCode: 404,
    });

    this.name = "CombatSessionNotFoundError";
  }
}

export class CombatTurnMismatchError
  extends ApplicationError {
  public constructor(
    expectedTurn: number,
    currentTurn: number
  ) {
    super({
      code:
        COMBAT_SESSION_ERROR_CODE.combatTurnMismatch,
      message:
        "The submitted combat turn does not match the current session turn.",
      statusCode: 409,
      details: {
        expectedTurn,
        currentTurn,
      },
    });

    this.name = "CombatTurnMismatchError";
  }
}

export class PersistentCombatAlreadyEndedError
  extends ApplicationError {
  public constructor() {
    super({
      code:
        COMBAT_SESSION_ERROR_CODE.combatAlreadyEnded,
      message:
        "Combat has already ended.",
      statusCode: 409,
    });

    this.name =
      "PersistentCombatAlreadyEndedError";
  }
}

export class InsufficientEnergyError
  extends ApplicationError {
  public constructor() {
    super({
      code:
        COMBAT_SESSION_ERROR_CODE.insufficientEnergy,
      message:
        "The character does not have enough Energy.",
      statusCode: 409,
    });

    this.name = "InsufficientEnergyError";
  }
}

export class CharacterHealthDepletedError
  extends ApplicationError {
  public constructor() {
    super({
      code:
        COMBAT_SESSION_ERROR_CODE.characterHealthDepleted,
      message:
        "A character with depleted Health cannot start combat.",
      statusCode: 409,
    });

    this.name =
      "CharacterHealthDepletedError";
  }
}

export class MonsterNotEligibleError
  extends ApplicationError {
  public constructor() {
    super({
      code:
        COMBAT_SESSION_ERROR_CODE.monsterNotEligible,
      message:
        "The character is not eligible to fight this monster.",
      statusCode: 409,
    });

    this.name = "MonsterNotEligibleError";
  }
}

export class InvalidPersistentCombatStateError
  extends ApplicationError {
  public constructor(message: string) {
    super({
      code:
        COMBAT_SESSION_ERROR_CODE.invalidPersistentCombatState,
      message,
      statusCode: 500,
    });

    this.name =
      "InvalidPersistentCombatStateError";
  }
}

```

# ============================================================
# SOURCE: src/modules/combat/application/combat-session.models.ts
# ============================================================

```text
import type {
  CombatEvent,
  CombatState,
  PlayerAction,
} from "../domain/combat.types.js";

export const PERSISTENT_COMBAT_STATUS = {
  active: "Active",
  victory: "Victory",
  defeat: "Defeat",
  abandoned: "Abandoned",
} as const;

export const PERSISTENT_COMBAT_DEFEAT_REASON = {
  playerHealthDepleted: "PlayerHealthDepleted",
  turnLimitExceeded: "TurnLimitExceeded",
} as const;

export type CombatSessionId = string;

export type PersistentCombatStatus =
  (typeof PERSISTENT_COMBAT_STATUS)[keyof typeof PERSISTENT_COMBAT_STATUS];

export type PersistentCombatDefeatReason =
  (typeof PERSISTENT_COMBAT_DEFEAT_REASON)[keyof typeof PERSISTENT_COMBAT_DEFEAT_REASON];

export type CombatSessionCombatantSnapshot = {
  currentHealth: number;
  maximumHealth: number;
  attack: number;
  defense: number;
};

export type CombatSessionSnapshot = {
  combatSessionId: CombatSessionId;
  characterId: string;
  monsterId: string;
  monsterCode: string;
  status: PersistentCombatStatus;
  defeatReason: PersistentCombatDefeatReason | null;
  currentTurn: number;
  player: CombatSessionCombatantSnapshot;
  monster: CombatSessionCombatantSnapshot;
  startedAt: Date;
  endedAt: Date | null;
};

export type PersistedCombatEvent = {
  combatSessionEventId: string;
  combatSessionId: CombatSessionId;
  turnNumber: number;
  eventOrder: number;
  eventType: string;
  event: CombatEvent;
  createdAt: Date;
};

export type CombatSessionView = CombatSessionSnapshot & {
  events: readonly CombatEvent[];
};

export type StartCombatInput = {
  accountId: string;
  characterId: string;
  monsterCode: string;
};

export type ResolveCombatActionInput = {
  accountId: string;
  characterId: string;
  expectedTurn: number;
  action: PlayerAction;
};

export type GetActiveCombatInput = {
  accountId: string;
  characterId: string;
};

export type GetCombatSessionInput = {
  accountId: string;
  characterId: string;
  combatSessionId: CombatSessionId;
};

export type CombatEventLog = {
  combatSessionId: CombatSessionId;
  events: readonly PersistedCombatEvent[];
};

export type PersistentCombatState = {
  session: CombatSessionSnapshot;
  combatState: CombatState;
};

```

# ============================================================
# SOURCE: src/modules/combat/application/combat-session.repository.ts
# ============================================================

```text
import type {
  EffectiveCharacterStatistics,
} from "../../characters/domain/effective-character-statistics.js";
import type {
  CharacterResources,
} from "../../characters/domain/character.types.js";
import type {
  MonsterEligibility,
  MonsterType,
} from "../../monsters/domain/monster.types.js";
import type {
  CombatEventLog,
  CombatSessionSnapshot,
  GetActiveCombatInput,
  GetCombatSessionInput,
  PersistedCombatEvent,
} from "./combat-session.models.js";
import type {
  CombatEvent,
  CombatState,
} from "../domain/combat.types.js";

export type CombatStartTransactionInput = {
  accountId: string;
  characterId: string;
  observedAt: Date;
};

export type LockedCombatCharacter = {
  characterId: string;
  accountId: string;
  level: number;
  resources: CharacterResources;
};

export type CombatStartMonster = {
  monsterId: string;
  monsterCode: string;
  monsterType: MonsterType;
  level: number;
  energyCost: number;
  maximumHealth: number;
  attack: number;
  defense: number;
  eligibility: MonsterEligibility;
};

export type CreateCombatSessionInput = {
  characterId: string;
  monsterId: string;
  characterHealth: number;
  characterMana: number;
  characterMaximumHealth: number;
  characterAttack: number;
  characterDefense: number;
  monsterMaximumHealth: number;
  monsterAttack: number;
  monsterDefense: number;
  startedAt: Date;
};

export interface CombatStartTransaction {
  readonly character:
    LockedCombatCharacter;

  hasActiveCombat(): Promise<boolean>;

  findMonster(
    monsterCode: string
  ): Promise<CombatStartMonster | null>;

  calculateCharacterStatistics():
    Promise<EffectiveCharacterStatistics>;

  updateCharacterResources(
    resources: CharacterResources
  ): Promise<void>;

  createCombatSession(
    input: CreateCombatSessionInput
  ): Promise<CombatSessionSnapshot>;
}

export type CombatActionTransactionInput = {
  accountId: string;
  characterId: string;
  observedAt: Date;
};

export type LockedCombatSession = {
  session: CombatSessionSnapshot;
  combatState: CombatState;
};

export type PersistCombatActionInput = {
  state: CombatState;
  resolvedTurn: number;
  events: readonly CombatEvent[];
  observedAt: Date;
};

export interface CombatActionTransaction {
  readonly locked:
    LockedCombatSession;

  persistAction(
    input: PersistCombatActionInput
  ): Promise<readonly PersistedCombatEvent[]>;
}

export interface CombatSessionRepository {
  withStartTransaction<TResult>(
    input: CombatStartTransactionInput,
    operation: (
      transaction: CombatStartTransaction
    ) => Promise<TResult>
  ): Promise<TResult>;

  withActionTransaction<TResult>(
    input: CombatActionTransactionInput,
    operation: (
      transaction: CombatActionTransaction
    ) => Promise<TResult>
  ): Promise<TResult>;

  findActiveSession(
    input: GetActiveCombatInput
  ): Promise<CombatSessionSnapshot | null>;

  findSession(
    input: GetCombatSessionInput
  ): Promise<CombatSessionSnapshot | null>;

  findEventLog(
    input: GetCombatSessionInput
  ): Promise<CombatEventLog | null>;
}

```

# ============================================================
# SOURCE: src/modules/combat/application/get-active-combat.service.ts
# ============================================================

```text
import {
  CombatSessionNotFoundError,
} from "./combat-session.errors.js";
import type {
  CombatSessionRepository,
} from "./combat-session.repository.js";
import type {
  CombatSessionView,
  GetActiveCombatInput,
} from "./combat-session.models.js";

export class GetActiveCombatService {
  public constructor(
    private readonly repository:
      CombatSessionRepository
  ) {}

  public async execute(
    input: GetActiveCombatInput
  ): Promise<CombatSessionView> {
    const session =
      await this.repository.findActiveSession(
        input
      );

    if (session === null) {
      throw new CombatSessionNotFoundError();
    }

    return {
      ...session,
      events: [],
    };
  }
}

```

# ============================================================
# SOURCE: src/modules/combat/application/get-combat-log.service.ts
# ============================================================

```text
import {
  CombatSessionNotFoundError,
} from "./combat-session.errors.js";
import type {
  CombatSessionRepository,
} from "./combat-session.repository.js";
import type {
  CombatEventLog,
  GetCombatSessionInput,
} from "./combat-session.models.js";

export class GetCombatLogService {
  public constructor(
    private readonly repository:
      CombatSessionRepository
  ) {}

  public async execute(
    input: GetCombatSessionInput
  ): Promise<CombatEventLog> {
    const log =
      await this.repository.findEventLog(input);

    if (log === null) {
      throw new CombatSessionNotFoundError();
    }

    return log;
  }
}

```

# ============================================================
# SOURCE: src/modules/combat/application/get-combat-session.service.ts
# ============================================================

```text
import {
  CombatSessionNotFoundError,
} from "./combat-session.errors.js";
import type {
  CombatSessionRepository,
} from "./combat-session.repository.js";
import type {
  CombatSessionView,
  GetCombatSessionInput,
} from "./combat-session.models.js";

export class GetCombatSessionService {
  public constructor(
    private readonly repository:
      CombatSessionRepository
  ) {}

  public async execute(
    input: GetCombatSessionInput
  ): Promise<CombatSessionView> {
    const session =
      await this.repository.findSession(input);

    if (session === null) {
      throw new CombatSessionNotFoundError();
    }

    return {
      ...session,
      events: [],
    };
  }
}

```

# ============================================================
# SOURCE: src/modules/combat/application/resolve-combat-action.service.ts
# ============================================================

```text
import type {
  Clock,
} from "../../../application/ports/clock.js";
import type {
  RandomSource,
} from "../ports/random-source.js";
import {
  COMBAT_STATUS,
} from "../domain/combat.constants.js";
import {
  resolveCombatAction,
} from "../domain/combat-engine.js";
import {
  CombatTurnMismatchError,
} from "./combat-session.errors.js";
import {
  PERSISTENT_COMBAT_DEFEAT_REASON,
  PERSISTENT_COMBAT_STATUS,
  type CombatSessionView,
  type ResolveCombatActionInput,
} from "./combat-session.models.js";
import type {
  CombatSessionRepository,
} from "./combat-session.repository.js";

export class ResolveCombatActionService {
  public constructor(
    private readonly repository:
      CombatSessionRepository,
    private readonly randomSource:
      RandomSource,
    private readonly clock: Clock
  ) {}

  public async execute(
    input: ResolveCombatActionInput
  ): Promise<CombatSessionView> {
    const observedAt = this.clock.now();

    return this.repository.withActionTransaction(
      {
        accountId: input.accountId,
        characterId: input.characterId,
        observedAt,
      },
      async (transaction) => {
        const currentTurn =
          transaction.locked.combatState.turn;

        if (
          input.expectedTurn !==
          currentTurn
        ) {
          throw new CombatTurnMismatchError(
            input.expectedTurn,
            currentTurn
          );
        }

        const resolution =
          resolveCombatAction(
            transaction.locked.combatState,
            input.action,
            this.randomSource
          );

        await transaction.persistAction({
          state: resolution.state,
          resolvedTurn: currentTurn,
          events: resolution.events,
          observedAt,
        });

        const persistentStatus =
          resolution.state.status ===
          COMBAT_STATUS.inProgress
            ? PERSISTENT_COMBAT_STATUS.active
            : resolution.state.status ===
                COMBAT_STATUS.playerVictory
              ? PERSISTENT_COMBAT_STATUS.victory
              : PERSISTENT_COMBAT_STATUS.defeat;

        const defeatReason =
          resolution.state.defeatReason === null
            ? null
            : resolution.state.defeatReason ===
                PERSISTENT_COMBAT_DEFEAT_REASON
                  .playerHealthDepleted
              ? PERSISTENT_COMBAT_DEFEAT_REASON
                  .playerHealthDepleted
              : PERSISTENT_COMBAT_DEFEAT_REASON
                  .turnLimitExceeded;

        return {
          ...transaction.locked.session,
          status: persistentStatus,
          defeatReason,
          currentTurn:
            resolution.state.turn,
          player: {
            ...transaction.locked.session.player,
            currentHealth:
              resolution.state.player
                .currentHealth,
          },
          monster: {
            ...transaction.locked.session.monster,
            currentHealth:
              resolution.state.monster
                .currentHealth,
          },
          endedAt:
            resolution.state.status ===
            COMBAT_STATUS.inProgress
              ? null
              : observedAt,
          events: resolution.events,
        };
      }
    );
  }
}

```

# ============================================================
# SOURCE: src/modules/combat/application/start-combat.service.ts
# ============================================================

```text
import type {
  Clock,
} from "../../../application/ports/clock.js";
import {
  DEFAULT_RESOURCE_REGENERATION,
} from "../../characters/domain/character.constants.js";
import {
  regenerateCharacterResources,
} from "../../characters/domain/resource-regeneration.js";
import {
  CharacterHealthDepletedError,
  InsufficientEnergyError,
  MonsterNotEligibleError,
} from "./combat-session.errors.js";
import type {
  CombatSessionRepository,
} from "./combat-session.repository.js";
import type {
  CombatSessionView,
  StartCombatInput,
} from "./combat-session.models.js";

export class StartCombatService {
  public constructor(
    private readonly repository:
      CombatSessionRepository,
    private readonly clock: Clock
  ) {}

  public async execute(
    input: StartCombatInput
  ): Promise<CombatSessionView> {
    const observedAt = this.clock.now();

    return this.repository.withStartTransaction(
      {
        accountId: input.accountId,
        characterId: input.characterId,
        observedAt,
      },
      async (transaction) => {
        const regeneration =
          regenerateCharacterResources(
            transaction.character.resources,
            DEFAULT_RESOURCE_REGENERATION,
            observedAt
          );

        const resources =
          regeneration.resources;

        const monster =
          await transaction.findMonster(
            input.monsterCode
          );

        if (
          monster === null ||
          !monster.eligibility.isEligible
        ) {
          throw new MonsterNotEligibleError();
        }

        if (resources.currentHealth === 0) {
          throw new CharacterHealthDepletedError();
        }

        if (
          resources.currentEnergy <
          monster.energyCost
        ) {
          throw new InsufficientEnergyError();
        }

        const statistics =
          await transaction
            .calculateCharacterStatistics();

        const updatedResources = {
          ...resources,
          currentEnergy:
            resources.currentEnergy -
            monster.energyCost,
        };

        await transaction.updateCharacterResources(
          updatedResources
        );

        const session =
          await transaction.createCombatSession({
            characterId:
              transaction.character.characterId,
            monsterId: monster.monsterId,
            characterHealth:
              updatedResources.currentHealth,
            characterMana:
              updatedResources.currentMana,
            characterMaximumHealth:
              statistics.maximumHealth,
            characterAttack:
              statistics.attack,
            characterDefense:
              statistics.defense,
            monsterMaximumHealth:
              monster.maximumHealth,
            monsterAttack:
              monster.attack,
            monsterDefense:
              monster.defense,
            startedAt: observedAt,
          });

        return {
          ...session,
          events: [],
        };
      }
    );
  }
}

```

# ============================================================
# SOURCE: src/modules/combat/domain/combat.constants.ts
# ============================================================

```text
export const COMBAT_STATUS = {
  inProgress: "InProgress",
  playerVictory: "PlayerVictory",
  playerDefeat: "PlayerDefeat",
} as const;

export const COMBAT_DEFEAT_REASON = {
  playerHealthDepleted: "PlayerHealthDepleted",
  turnLimitExceeded: "TurnLimitExceeded",
} as const;

export const COMBAT_EVENT_TYPE = {
  attackResolved: "AttackResolved",
  combatEnded: "CombatEnded",
  turnAdvanced: "TurnAdvanced",
} as const;

export const COMBAT_ACTOR = {
  player: "Player",
  monster: "Monster",
} as const;

export const PLAYER_ACTION_TYPE = {
  basicAttack: "basic_attack",
} as const;

```

# ============================================================
# SOURCE: src/modules/combat/domain/combat.errors.ts
# ============================================================

```text
import { ApplicationError } from "../../../application/errors/application-error.js";

export const COMBAT_ERROR_CODE = {
  invalidCombatState:
    "COMBAT_INVALID_STATE",
  combatAlreadyEnded:
    "COMBAT_ALREADY_ENDED",
  invalidRandomSource:
    "INVALID_RANDOM_SOURCE",
} as const;

export type CombatErrorCode =
  (typeof COMBAT_ERROR_CODE)[keyof typeof COMBAT_ERROR_CODE];

export class CombatInvalidStateError extends ApplicationError {
  public constructor(message: string) {
    super({
      code: COMBAT_ERROR_CODE.invalidCombatState,
      message,
      statusCode: 500,
    });

    this.name = "CombatInvalidStateError";
  }
}

export class CombatAlreadyEndedError extends ApplicationError {
  public constructor() {
    super({
      code: COMBAT_ERROR_CODE.combatAlreadyEnded,
      message: "Combat has already ended.",
      statusCode: 500,
    });

    this.name = "CombatAlreadyEndedError";
  }
}

export class InvalidRandomSourceError extends ApplicationError {
  public constructor(message: string) {
    super({
      code: COMBAT_ERROR_CODE.invalidRandomSource,
      message,
      statusCode: 500,
    });

    this.name = "InvalidRandomSourceError";
  }
}

```

# ============================================================
# SOURCE: src/modules/combat/domain/combat.types.ts
# ============================================================

```text
import {
  COMBAT_ACTOR,
  COMBAT_DEFEAT_REASON,
  COMBAT_EVENT_TYPE,
  COMBAT_STATUS,
  PLAYER_ACTION_TYPE,
} from "./combat.constants.js";

export type CombatStatus =
  (typeof COMBAT_STATUS)[keyof typeof COMBAT_STATUS];

export type CombatDefeatReason =
  (typeof COMBAT_DEFEAT_REASON)[keyof typeof COMBAT_DEFEAT_REASON];

export type CombatActor =
  (typeof COMBAT_ACTOR)[keyof typeof COMBAT_ACTOR];

export type PlayerActionType =
  (typeof PLAYER_ACTION_TYPE)[keyof typeof PLAYER_ACTION_TYPE];

export type Combatant = {
  currentHealth: number;
  maximumHealth: number;
  attack: number;
  defense: number;
};

export type CombatEffect = never;

export type PlayerAction = {
  type: PlayerActionType;
};

export type CombatState = {
  player: Combatant;
  monster: Combatant;

  turn: number;

  status: CombatStatus;

  defeatReason: CombatDefeatReason | null;

  effects: readonly CombatEffect[];
};

export type AttackResolvedEvent = {
  type:
    (typeof COMBAT_EVENT_TYPE)["attackResolved"];

  actor: CombatActor;
  target: CombatActor;

  hit: boolean;
  damage: number;
};

export type CombatEndedEvent = {
  type:
    (typeof COMBAT_EVENT_TYPE)["combatEnded"];

  status: CombatStatus;

  defeatReason:
    | CombatDefeatReason
    | null;
};

export type TurnAdvancedEvent = {
  type:
    (typeof COMBAT_EVENT_TYPE)["turnAdvanced"];

  turn: number;
};

export type CombatEvent =
  | AttackResolvedEvent
  | CombatEndedEvent
  | TurnAdvancedEvent;

export type CombatResolution = {
  state: CombatState;

  events: readonly CombatEvent[];
};

```

# ============================================================
# SOURCE: src/modules/combat/domain/combat-attack.ts
# ============================================================

```text
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

```

# ============================================================
# SOURCE: src/modules/combat/domain/combat-effects.ts
# ============================================================

```text
import type {
  CombatState,
} from "./combat.types.js";

export function resolveActiveEffects(
  state: CombatState
): CombatState {
  return state;
}
```

# ============================================================
# SOURCE: src/modules/combat/domain/combat-engine.ts
# ============================================================

```text
import type { RandomSource } from "../ports/random-source.js";
import { resolveBasicAttack } from "./combat-attack.js";
import {
  COMBAT_ACTOR,
  COMBAT_DEFEAT_REASON,
  COMBAT_EVENT_TYPE,
  COMBAT_STATUS,
  PLAYER_ACTION_TYPE,
} from "./combat.constants.js";
import { resolveActiveEffects } from "./combat-effects.js";
import { CombatInvalidStateError } from "./combat.errors.js";
import type {
  AttackResolvedEvent,
  CombatEndedEvent,
  CombatEvent,
  CombatResolution,
  CombatState,
  PlayerAction,
} from "./combat.types.js";
import { assertCombatInProgress } from "./combat-validation.js";

const MAXIMUM_TURN = 100;

function createAttackEvent(
  actor: AttackResolvedEvent["actor"],
  target: AttackResolvedEvent["target"],
  hit: boolean,
  damage: number
): AttackResolvedEvent {
  return {
    type: COMBAT_EVENT_TYPE.attackResolved,
    actor,
    target,
    hit,
    damage,
  };
}

function createCombatEndedEvent(
  state: CombatState
): CombatEndedEvent {
  return {
    type: COMBAT_EVENT_TYPE.combatEnded,
    status: state.status,
    defeatReason: state.defeatReason,
  };
}

export function resolveCombatAction(
  state: CombatState,
  action: PlayerAction,
  randomSource: RandomSource
): CombatResolution {
  assertCombatInProgress(state);

  if (action.type !== PLAYER_ACTION_TYPE.basicAttack) {
    throw new CombatInvalidStateError(
      "Unsupported player action."
    );
  }

  const events: CombatEvent[] = [];

  const playerAttack = resolveBasicAttack(
    state.player,
    state.monster,
    randomSource
  );

  events.push(
    createAttackEvent(
      COMBAT_ACTOR.player,
      COMBAT_ACTOR.monster,
      playerAttack.hit,
      playerAttack.damage
    )
  );

  const stateAfterPlayerAttack: CombatState = {
    ...state,
    monster: {
      ...state.monster,
      currentHealth: Math.max(
        0,
        state.monster.currentHealth -
          playerAttack.damage
      ),
    },
  };

  const stateAfterPlayerEffects =
    resolveActiveEffects(
      stateAfterPlayerAttack
    );

  if (
    stateAfterPlayerEffects.monster.currentHealth === 0
  ) {
    const finalState: CombatState = {
      ...stateAfterPlayerEffects,
      status: COMBAT_STATUS.playerVictory,
      defeatReason: null,
    };

    events.push(
      createCombatEndedEvent(finalState)
    );

    return {
      state: finalState,
      events,
    };
  }

  const monsterAttack = resolveBasicAttack(
    stateAfterPlayerEffects.monster,
    stateAfterPlayerEffects.player,
    randomSource
  );

  events.push(
    createAttackEvent(
      COMBAT_ACTOR.monster,
      COMBAT_ACTOR.player,
      monsterAttack.hit,
      monsterAttack.damage
    )
  );

  const stateAfterMonsterAttack: CombatState = {
    ...stateAfterPlayerEffects,
    player: {
      ...stateAfterPlayerEffects.player,
      currentHealth: Math.max(
        0,
        stateAfterPlayerEffects.player.currentHealth -
          monsterAttack.damage
      ),
    },
  };

  const stateAfterMonsterEffects =
    resolveActiveEffects(
      stateAfterMonsterAttack
    );

  if (
    stateAfterMonsterEffects.player.currentHealth === 0
  ) {
    const finalState: CombatState = {
      ...stateAfterMonsterEffects,
      status: COMBAT_STATUS.playerDefeat,
      defeatReason:
        COMBAT_DEFEAT_REASON.playerHealthDepleted,
    };

    events.push(
      createCombatEndedEvent(finalState)
    );

    return {
      state: finalState,
      events,
    };
  }

  if (state.turn >= MAXIMUM_TURN) {
    const finalState: CombatState = {
      ...stateAfterMonsterEffects,
      status: COMBAT_STATUS.playerDefeat,
      defeatReason:
        COMBAT_DEFEAT_REASON.turnLimitExceeded,
    };

    events.push(
      createCombatEndedEvent(finalState)
    );

    return {
      state: finalState,
      events,
    };
  }

  const nextState: CombatState = {
    ...stateAfterMonsterEffects,
    turn: state.turn + 1,
  };

  events.push({
    type: COMBAT_EVENT_TYPE.turnAdvanced,
    turn: nextState.turn,
  });

  return {
    state: nextState,
    events,
  };
}
```

# ============================================================
# SOURCE: src/modules/combat/domain/combat-validation.ts
# ============================================================

```text
import {
  COMBAT_DEFEAT_REASON,
  COMBAT_STATUS,
} from "./combat.constants.js";
import {
  CombatAlreadyEndedError,
  CombatInvalidStateError,
  InvalidRandomSourceError,
} from "./combat.errors.js";
import type {
  Combatant,
  CombatState,
} from "./combat.types.js";

function assertNonNegativeSafeInteger(
  value: number,
  field: string
): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new CombatInvalidStateError(
      `${field} must be a non-negative safe integer.`
    );
  }
}

function validateCombatant(
  combatant: Combatant,
  field: string
): void {
  assertNonNegativeSafeInteger(
    combatant.currentHealth,
    `${field}.currentHealth`
  );

  if (
    !Number.isSafeInteger(combatant.maximumHealth) ||
    combatant.maximumHealth < 1
  ) {
    throw new CombatInvalidStateError(
      `${field}.maximumHealth must be a positive safe integer.`
    );
  }

  if (
    combatant.currentHealth >
    combatant.maximumHealth
  ) {
    throw new CombatInvalidStateError(
      `${field}.currentHealth cannot exceed maximumHealth.`
    );
  }

  assertNonNegativeSafeInteger(
    combatant.attack,
    `${field}.attack`
  );

  assertNonNegativeSafeInteger(
    combatant.defense,
    `${field}.defense`
  );
}

function validateInProgressState(
  state: CombatState
): void {
  if (state.defeatReason !== null) {
    throw new CombatInvalidStateError(
      "An in-progress combat cannot have a defeat reason."
    );
  }

  if (state.player.currentHealth === 0) {
    throw new CombatInvalidStateError(
      "An in-progress combat requires the player to be alive."
    );
  }

  if (state.monster.currentHealth === 0) {
    throw new CombatInvalidStateError(
      "An in-progress combat requires the monster to be alive."
    );
  }
}

function validatePlayerVictoryState(
  state: CombatState
): void {
  if (state.defeatReason !== null) {
    throw new CombatInvalidStateError(
      "A player victory cannot have a defeat reason."
    );
  }

  if (state.player.currentHealth === 0) {
    throw new CombatInvalidStateError(
      "A player victory requires the player to be alive."
    );
  }

  if (state.monster.currentHealth !== 0) {
    throw new CombatInvalidStateError(
      "A player victory requires depleted monster health."
    );
  }
}

function validatePlayerDefeatState(
  state: CombatState
): void {
  if (
    state.defeatReason ===
    COMBAT_DEFEAT_REASON.playerHealthDepleted
  ) {
    if (state.player.currentHealth !== 0) {
      throw new CombatInvalidStateError(
        "A health-depletion defeat requires depleted player health."
      );
    }

    if (state.monster.currentHealth === 0) {
      throw new CombatInvalidStateError(
        "A health-depletion defeat requires the monster to be alive."
      );
    }

    return;
  }

  if (
    state.defeatReason ===
    COMBAT_DEFEAT_REASON.turnLimitExceeded
  ) {
    if (state.turn !== 100) {
      throw new CombatInvalidStateError(
        "A turn-limit defeat must occur on turn 100."
      );
    }

    if (
      state.player.currentHealth === 0 ||
      state.monster.currentHealth === 0
    ) {
      throw new CombatInvalidStateError(
        "A turn-limit defeat requires both combatants to be alive."
      );
    }

    return;
  }

  throw new CombatInvalidStateError(
    "A player defeat requires a valid defeat reason."
  );
}

function validateStatusState(
  state: CombatState
): void {
  if (state.status === COMBAT_STATUS.inProgress) {
    validateInProgressState(state);
    return;
  }

  if (state.status === COMBAT_STATUS.playerVictory) {
    validatePlayerVictoryState(state);
    return;
  }

  if (state.status === COMBAT_STATUS.playerDefeat) {
    validatePlayerDefeatState(state);
    return;
  }

  throw new CombatInvalidStateError(
    "Combat status is invalid."
  );
}

export function validateCombatState(
  state: CombatState
): void {
  validateCombatant(state.player, "player");
  validateCombatant(state.monster, "monster");

  if (
    !Number.isSafeInteger(state.turn) ||
    state.turn < 1 ||
    state.turn > 100
  ) {
    throw new CombatInvalidStateError(
      "turn must be a safe integer between 1 and 100."
    );
  }

  if (!Array.isArray(state.effects)) {
    throw new CombatInvalidStateError(
      "effects must be an array."
    );
  }

  if (state.effects.length !== 0) {
    throw new CombatInvalidStateError(
      "Active combat effects are not supported in M4."
    );
  }

  validateStatusState(state);
}

export function assertCombatInProgress(
  state: CombatState
): void {
  validateCombatState(state);

  if (state.status !== COMBAT_STATUS.inProgress) {
    throw new CombatAlreadyEndedError();
  }
}

export function validateRandomFloat(
  value: number
): void {
  if (
    !Number.isFinite(value) ||
    value < 0 ||
    value >= 1
  ) {
    throw new InvalidRandomSourceError(
      "Random float must be greater than or equal to 0 and less than 1."
    );
  }
}

export function validateRandomInteger(
  value: number,
  minimum: number,
  maximum: number
): void {
  if (
    !Number.isSafeInteger(value) ||
    value < minimum ||
    value > maximum
  ) {
    throw new InvalidRandomSourceError(
      `Random integer must be between ${minimum} and ${maximum}, inclusive.`
    );
  }
}

```

# ============================================================
# SOURCE: src/modules/combat/http/combat-http.handler.ts
# ============================================================

```text
import type {
  IncomingMessage,
  ServerResponse,
} from "node:http";

import {
  requireAuthentication,
  type AuthenticationProvider,
} from "../../../http/http-auth.js";
import {
  mapErrorToHttpResponse,
} from "../../../http/http-error.js";
import {
  readJsonBody,
  sendJson,
} from "../../../http/http-json.js";
import type {
  GetActiveCombatService,
} from "../application/get-active-combat.service.js";
import type {
  GetCombatLogService,
} from "../application/get-combat-log.service.js";
import type {
  GetCombatSessionService,
} from "../application/get-combat-session.service.js";
import type {
  ResolveCombatActionService,
} from "../application/resolve-combat-action.service.js";
import type {
  StartCombatService,
} from "../application/start-combat.service.js";
import {
  InvalidCombatHttpRequestError,
  parseCombatActionHttpRequest,
  parseCombatCharacterId,
  parseCombatSessionId,
  parseStartCombatHttpRequest,
} from "./combat-http.request.js";

export type CombatHttpHandlerDependencies = {
  authenticationProvider:
    AuthenticationProvider;
  startCombatService:
    StartCombatService;
  resolveCombatActionService:
    ResolveCombatActionService;
  getActiveCombatService:
    GetActiveCombatService;
  getCombatSessionService:
    GetCombatSessionService;
  getCombatLogService:
    GetCombatLogService;
};

type CombatRoute =
  | {
      type: "active";
      characterId: string;
    }
  | {
      type: "actions";
      characterId: string;
    }
  | {
      type: "session";
      characterId: string;
      combatSessionId: string;
    }
  | {
      type: "log";
      characterId: string;
      combatSessionId: string;
    };

function getPathname(
  request: IncomingMessage
): string {
  return new URL(
    request.url ?? "/",
    "http://localhost"
  ).pathname;
}

function decodePathSegment(
  value: string,
  fieldName: string
): string {
  try {
    return decodeURIComponent(value);
  } catch {
    throw new InvalidCombatHttpRequestError(
      `${fieldName} contains invalid encoding.`
    );
  }
}

function parseCombatRoute(
  pathname: string
): CombatRoute | null {
  const logMatch =
    /^\/characters\/([^/]+)\/combat\/([^/]+)\/log$/u.exec(
      pathname
    );

  if (logMatch) {
    return {
      type: "log",
      characterId:
        parseCombatCharacterId(
          decodePathSegment(
            logMatch[1] ?? "",
            "characterId"
          )
        ),
      combatSessionId:
        parseCombatSessionId(
          decodePathSegment(
            logMatch[2] ?? "",
            "combatSessionId"
          )
        ),
    };
  }

  const actionsMatch =
    /^\/characters\/([^/]+)\/combat\/actions$/u.exec(
      pathname
    );

  if (actionsMatch) {
    return {
      type: "actions",
      characterId:
        parseCombatCharacterId(
          decodePathSegment(
            actionsMatch[1] ?? "",
            "characterId"
          )
        ),
    };
  }

  const sessionMatch =
    /^\/characters\/([^/]+)\/combat\/([^/]+)$/u.exec(
      pathname
    );

  if (sessionMatch) {
    return {
      type: "session",
      characterId:
        parseCombatCharacterId(
          decodePathSegment(
            sessionMatch[1] ?? "",
            "characterId"
          )
        ),
      combatSessionId:
        parseCombatSessionId(
          decodePathSegment(
            sessionMatch[2] ?? "",
            "combatSessionId"
          )
        ),
    };
  }

  const activeMatch =
    /^\/characters\/([^/]+)\/combat$/u.exec(
      pathname
    );

  if (activeMatch) {
    return {
      type: "active",
      characterId:
        parseCombatCharacterId(
          decodePathSegment(
            activeMatch[1] ?? "",
            "characterId"
          )
        ),
    };
  }

  return null;
}

export function createCombatHttpHandler(
  dependencies:
    CombatHttpHandlerDependencies
): (
  request: IncomingMessage,
  response: ServerResponse
) => Promise<void> {
  return async (
    request: IncomingMessage,
    response: ServerResponse
  ): Promise<void> => {
    try {
      const pathname =
        getPathname(request);
      const method =
        request.method ?? "GET";
      const route =
        parseCombatRoute(pathname);

      if (route === null) {
        sendJson(response, 404, {
          error: {
            code: "ROUTE_NOT_FOUND",
            message:
              "Route was not found.",
          },
        });

        return;
      }

      const authentication =
        await requireAuthentication(
          request,
          dependencies.authenticationProvider
        );

      if (
        method === "POST" &&
        route.type === "active"
      ) {
        const body =
          await readJsonBody(request);
        const parsed =
          parseStartCombatHttpRequest(body);

        const combat =
          await dependencies
            .startCombatService
            .execute({
              accountId:
                authentication.accountId,
              characterId:
                route.characterId,
              monsterCode:
                parsed.monsterCode,
            });

        sendJson(response, 201, {
          data: combat,
        });

        return;
      }

      if (
        method === "GET" &&
        route.type === "active"
      ) {
        const combat =
          await dependencies
            .getActiveCombatService
            .execute({
              accountId:
                authentication.accountId,
              characterId:
                route.characterId,
            });

        sendJson(response, 200, {
          data: combat,
        });

        return;
      }

      if (
        method === "POST" &&
        route.type === "actions"
      ) {
        const body =
          await readJsonBody(request);
        const parsed =
          parseCombatActionHttpRequest(
            body
          );

        const combat =
          await dependencies
            .resolveCombatActionService
            .execute({
              accountId:
                authentication.accountId,
              characterId:
                route.characterId,
              expectedTurn:
                parsed.expectedTurn,
              action:
                parsed.action,
            });

        sendJson(response, 200, {
          data: combat,
        });

        return;
      }

      if (
        method === "GET" &&
        route.type === "session"
      ) {
        const combat =
          await dependencies
            .getCombatSessionService
            .execute({
              accountId:
                authentication.accountId,
              characterId:
                route.characterId,
              combatSessionId:
                route.combatSessionId,
            });

        sendJson(response, 200, {
          data: combat,
        });

        return;
      }

      if (
        method === "GET" &&
        route.type === "log"
      ) {
        const log =
          await dependencies
            .getCombatLogService
            .execute({
              accountId:
                authentication.accountId,
              characterId:
                route.characterId,
              combatSessionId:
                route.combatSessionId,
            });

        sendJson(response, 200, {
          data: log,
        });

        return;
      }

      sendJson(response, 404, {
        error: {
          code: "ROUTE_NOT_FOUND",
          message:
            "Route was not found.",
        },
      });
    } catch (error: unknown) {
      const mappedError =
        mapErrorToHttpResponse(error);

      sendJson(
        response,
        mappedError.statusCode,
        mappedError.body
      );
    }
  };
}

```

# ============================================================
# SOURCE: src/modules/combat/http/combat-http.request.ts
# ============================================================

```text
import {
  ApplicationError,
} from "../../../application/errors/application-error.js";
import {
  PLAYER_ACTION_TYPE,
} from "../domain/combat.constants.js";
import type {
  PlayerAction,
} from "../domain/combat.types.js";

export class InvalidCombatHttpRequestError
  extends ApplicationError
{
  public constructor(message: string) {
    super({
      code: "INVALID_HTTP_REQUEST",
      message,
      statusCode: 400,
    });

    this.name =
      "InvalidCombatHttpRequestError";
  }
}

export type StartCombatHttpRequest = {
  monsterCode: string;
};

export type CombatActionHttpRequest = {
  expectedTurn: number;
  action: PlayerAction;
};

function isObject(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function parseRequiredPathValue(
  value: string | undefined,
  fieldName: string
): string {
  if (!value?.trim()) {
    throw new InvalidCombatHttpRequestError(
      `${fieldName} is required.`
    );
  }

  return value;
}

export function parseCombatCharacterId(
  value: string | undefined
): string {
  return parseRequiredPathValue(
    value,
    "characterId"
  );
}

export function parseCombatSessionId(
  value: string | undefined
): string {
  return parseRequiredPathValue(
    value,
    "combatSessionId"
  );
}

export function parseStartCombatHttpRequest(
  body: unknown
): StartCombatHttpRequest {
  if (!isObject(body)) {
    throw new InvalidCombatHttpRequestError(
      "Request body must be a JSON object."
    );
  }

  if (
    typeof body.monsterCode !== "string" ||
    !body.monsterCode.trim()
  ) {
    throw new InvalidCombatHttpRequestError(
      "monsterCode must be a non-empty string."
    );
  }

  return {
    monsterCode: body.monsterCode,
  };
}

export function parseCombatActionHttpRequest(
  body: unknown
): CombatActionHttpRequest {
  if (!isObject(body)) {
    throw new InvalidCombatHttpRequestError(
      "Request body must be a JSON object."
    );
  }

  if (
    !Number.isSafeInteger(body.expectedTurn) ||
    Number(body.expectedTurn) < 1
  ) {
    throw new InvalidCombatHttpRequestError(
      "expectedTurn must be a positive safe integer."
    );
  }

  if (!isObject(body.action)) {
    throw new InvalidCombatHttpRequestError(
      "action must be a JSON object."
    );
  }

  const actionKeys =
    Object.keys(body.action);

  if (
    actionKeys.length !== 1 ||
    actionKeys[0] !== "type"
  ) {
    throw new InvalidCombatHttpRequestError(
      "action may contain only type."
    );
  }

  if (
    body.action.type !==
    PLAYER_ACTION_TYPE.basicAttack
  ) {
    throw new InvalidCombatHttpRequestError(
      "Only basic_attack is supported."
    );
  }

  return {
    expectedTurn:
      body.expectedTurn as number,
    action: {
      type:
        PLAYER_ACTION_TYPE.basicAttack,
    },
  };
}

```

# ============================================================
# SOURCE: src/modules/combat/infrastructure/crypto-random-source.ts
# ============================================================

```text
import {
  randomBytes,
  randomInt,
} from "node:crypto";

import type {
  RandomSource,
} from "../ports/random-source.js";

type RandomBytesProvider = (
  size: number
) => Buffer;

type RandomIntProvider = (
  minimum: number,
  maximumExclusive: number
) => number;

const RANDOM_FLOAT_DIVISOR =
  2 ** 53;

const MAXIMUM_CRYPTO_INTEGER_RANGE =
  2 ** 48 - 1;

export class CryptoRandomSource
  implements RandomSource {
  public constructor(
    private readonly randomBytesProvider:
      RandomBytesProvider = randomBytes,
    private readonly randomIntProvider:
      RandomIntProvider = randomInt
  ) {}

  public nextFloat(): number {
    const bytes =
      this.randomBytesProvider(8);

    if (
      !Buffer.isBuffer(bytes) ||
      bytes.length !== 8
    ) {
      throw new Error(
        "Crypto random byte provider must return exactly eight bytes."
      );
    }

    const value =
      Number(bytes.readBigUInt64BE(0) >> 11n);

    return value / RANDOM_FLOAT_DIVISOR;
  }

  public nextInt(
    minimum: number,
    maximum: number
  ): number {
    if (
      !Number.isSafeInteger(minimum) ||
      !Number.isSafeInteger(maximum)
    ) {
      throw new RangeError(
        "Random integer bounds must be safe integers."
      );
    }

    if (minimum > maximum) {
      throw new RangeError(
        "Random integer minimum cannot exceed maximum."
      );
    }

    if (minimum === maximum) {
      return minimum;
    }

    if (
      maximum === Number.MAX_SAFE_INTEGER
    ) {
      throw new RangeError(
        "The inclusive maximum is unsupported by the crypto random integer provider."
      );
    }

    const range =
      maximum - minimum + 1;

    if (
      !Number.isSafeInteger(range) ||
      range > MAXIMUM_CRYPTO_INTEGER_RANGE
    ) {
      throw new RangeError(
        "The requested random integer range is too large."
      );
    }

    return this.randomIntProvider(
      minimum,
      maximum + 1
    );
  }
}


```

# ============================================================
# SOURCE: src/modules/combat/infrastructure/postgres-combat.mapper.ts
# ============================================================

```text
import type {
  CombatSessionSnapshot,
  PersistentCombatDefeatReason,
  PersistentCombatState,
  PersistentCombatStatus,
} from "../application/combat-session.models.js";
import {
  PERSISTENT_COMBAT_DEFEAT_REASON,
  PERSISTENT_COMBAT_STATUS,
} from "../application/combat-session.models.js";
import {
  InvalidPersistentCombatStateError,
} from "../application/combat-session.errors.js";
import {
  COMBAT_DEFEAT_REASON,
  COMBAT_STATUS,
} from "../domain/combat.constants.js";
import type {
  CombatDefeatReason,
  CombatState,
  CombatStatus,
} from "../domain/combat.types.js";
import {
  validateCombatState,
} from "../domain/combat-validation.js";

export type PostgreSqlCombatSessionRow = {
  combat_session_id: unknown;
  character_id: unknown;
  monster_id: unknown;
  monster_code: unknown;
  status: unknown;
  current_turn: unknown;
  character_health: unknown;
  character_maximum_health: unknown;
  character_attack: unknown;
  character_defense: unknown;
  monster_health: unknown;
  monster_maximum_health: unknown;
  monster_attack: unknown;
  monster_defense: unknown;
  defeat_reason: unknown;
  started_at: unknown;
  ended_at: unknown;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

function invalid(
  message: string
): never {
  throw new InvalidPersistentCombatStateError(
    message
  );
}

function mapIdentifier(
  value: unknown,
  fieldName: string
): string {
  if (
    typeof value !== "string" ||
    !UUID_PATTERN.test(value)
  ) {
    return invalid(
      `${fieldName} must contain a valid UUID.`
    );
  }

  return value;
}

function mapMonsterCode(
  value: unknown
): string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    return invalid(
      "monster_code must contain a non-empty string."
    );
  }

  return value;
}

function mapSafeInteger(
  value: unknown,
  fieldName: string,
  minimum: number,
  maximum = Number.MAX_SAFE_INTEGER
): number {
  let mapped: number;

  if (
    typeof value === "string" &&
    /^-?\d+$/u.test(value)
  ) {
    mapped = Number(value);
  } else if (typeof value === "number") {
    mapped = value;
  } else {
    return invalid(
      `${fieldName} must contain an integer.`
    );
  }

  if (
    !Number.isSafeInteger(mapped) ||
    mapped < minimum ||
    mapped > maximum
  ) {
    return invalid(
      `${fieldName} must contain a safe integer between ${minimum} and ${maximum}.`
    );
  }

  return mapped;
}

function mapDate(
  value: unknown,
  fieldName: string
): Date {
  if (
    !(value instanceof Date) ||
    Number.isNaN(value.getTime())
  ) {
    return invalid(
      `${fieldName} must contain a valid date.`
    );
  }

  return new Date(value.getTime());
}

function mapNullableDate(
  value: unknown,
  fieldName: string
): Date | null {
  if (value === null) {
    return null;
  }

  return mapDate(value, fieldName);
}

export function mapPersistentCombatStatus(
  value: unknown
): PersistentCombatStatus {
  switch (value) {
    case PERSISTENT_COMBAT_STATUS.active:
      return PERSISTENT_COMBAT_STATUS.active;

    case PERSISTENT_COMBAT_STATUS.victory:
      return PERSISTENT_COMBAT_STATUS.victory;

    case PERSISTENT_COMBAT_STATUS.defeat:
      return PERSISTENT_COMBAT_STATUS.defeat;

    case PERSISTENT_COMBAT_STATUS.abandoned:
      return PERSISTENT_COMBAT_STATUS.abandoned;

    default:
      return invalid(
        `Unsupported persistent combat status: ${String(value)}`
      );
  }
}

export function mapPersistentDefeatReason(
  value: unknown
): PersistentCombatDefeatReason | null {
  switch (value) {
    case null:
      return null;

    case PERSISTENT_COMBAT_DEFEAT_REASON.playerHealthDepleted:
      return PERSISTENT_COMBAT_DEFEAT_REASON.playerHealthDepleted;

    case PERSISTENT_COMBAT_DEFEAT_REASON.turnLimitExceeded:
      return PERSISTENT_COMBAT_DEFEAT_REASON.turnLimitExceeded;

    default:
      return invalid(
        `Unsupported persistent defeat reason: ${String(value)}`
      );
  }
}

export function mapPersistentStatusToDomain(
  status: PersistentCombatStatus
): CombatStatus {
  switch (status) {
    case PERSISTENT_COMBAT_STATUS.active:
      return COMBAT_STATUS.inProgress;

    case PERSISTENT_COMBAT_STATUS.victory:
      return COMBAT_STATUS.playerVictory;

    case PERSISTENT_COMBAT_STATUS.defeat:
      return COMBAT_STATUS.playerDefeat;

    case PERSISTENT_COMBAT_STATUS.abandoned:
      return invalid(
        "Abandoned combat sessions cannot be reconstructed as M4 combat state."
      );
  }
}

export function mapPersistentDefeatReasonToDomain(
  reason: PersistentCombatDefeatReason | null
): CombatDefeatReason | null {
  switch (reason) {
    case null:
      return null;

    case PERSISTENT_COMBAT_DEFEAT_REASON.playerHealthDepleted:
      return COMBAT_DEFEAT_REASON.playerHealthDepleted;

    case PERSISTENT_COMBAT_DEFEAT_REASON.turnLimitExceeded:
      return COMBAT_DEFEAT_REASON.turnLimitExceeded;
  }
}

function createCombatState(
  snapshot: CombatSessionSnapshot
): CombatState {
  const state: CombatState = {
    player: {
      currentHealth:
        snapshot.player.currentHealth,
      maximumHealth:
        snapshot.player.maximumHealth,
      attack:
        snapshot.player.attack,
      defense:
        snapshot.player.defense,
    },
    monster: {
      currentHealth:
        snapshot.monster.currentHealth,
      maximumHealth:
        snapshot.monster.maximumHealth,
      attack:
        snapshot.monster.attack,
      defense:
        snapshot.monster.defense,
    },
    turn: snapshot.currentTurn,
    status:
      mapPersistentStatusToDomain(
        snapshot.status
      ),
    defeatReason:
      mapPersistentDefeatReasonToDomain(
        snapshot.defeatReason
      ),
    effects: [],
  };

  try {
    validateCombatState(state);
  } catch (error: unknown) {
    throw new InvalidPersistentCombatStateError(
      error instanceof Error
        ? `Persistent combat state is invalid: ${error.message}`
        : "Persistent combat state is invalid."
    );
  }

  return state;
}

export function mapPostgreSqlCombatSessionSnapshotRow(
  row: PostgreSqlCombatSessionRow
): CombatSessionSnapshot {
  const snapshot: CombatSessionSnapshot = {
    combatSessionId: mapIdentifier(
      row.combat_session_id,
      "combat_session_id"
    ),
    characterId: mapIdentifier(
      row.character_id,
      "character_id"
    ),
    monsterId: mapIdentifier(
      row.monster_id,
      "monster_id"
    ),
    monsterCode: mapMonsterCode(
      row.monster_code
    ),
    status: mapPersistentCombatStatus(
      row.status
    ),
    defeatReason:
      mapPersistentDefeatReason(
        row.defeat_reason
      ),
    currentTurn: mapSafeInteger(
      row.current_turn,
      "current_turn",
      1,
      100
    ),
    player: {
      currentHealth: mapSafeInteger(
        row.character_health,
        "character_health",
        0
      ),
      maximumHealth: mapSafeInteger(
        row.character_maximum_health,
        "character_maximum_health",
        1
      ),
      attack: mapSafeInteger(
        row.character_attack,
        "character_attack",
        0
      ),
      defense: mapSafeInteger(
        row.character_defense,
        "character_defense",
        0
      ),
    },
    monster: {
      currentHealth: mapSafeInteger(
        row.monster_health,
        "monster_health",
        0
      ),
      maximumHealth: mapSafeInteger(
        row.monster_maximum_health,
        "monster_maximum_health",
        1
      ),
      attack: mapSafeInteger(
        row.monster_attack,
        "monster_attack",
        0
      ),
      defense: mapSafeInteger(
        row.monster_defense,
        "monster_defense",
        0
      ),
    },
    startedAt: mapDate(
      row.started_at,
      "started_at"
    ),
    endedAt: mapNullableDate(
      row.ended_at,
      "ended_at"
    ),
  };

  return snapshot;
}

export function mapPostgreSqlCombatSessionRow(
  row: PostgreSqlCombatSessionRow
): PersistentCombatState {
  const snapshot =
    mapPostgreSqlCombatSessionSnapshotRow(
      row
    );

  return {
    session: snapshot,
    combatState:
      createCombatState(snapshot),
  };
}

```

# ============================================================
# SOURCE: src/modules/combat/infrastructure/postgres-combat-session.repository.ts
# ============================================================

```text
import type {
  Pool,
  PoolClient,
  QueryResult,
  QueryResultRow,
} from "pg";

import {
  withTransaction,
} from "../../../infrastructure/database/transaction.js";
import {
  CalculateCharacterStatsService,
} from "../../characters/application/calculate-character-stats.service.js";
import {
  CharacterNotFoundError,
} from "../../characters/domain/character.errors.js";
import type {
  CharacterResources,
} from "../../characters/domain/character.types.js";
import {
  PostgresCharacterStatisticsRepository,
} from "../../characters/infrastructure/postgres-character-statistics.repository.js";
import {
  calculateMonsterCooldown,
} from "../../monsters/domain/monster-cooldown.js";
import {
  calculateMonsterEligibility,
} from "../../monsters/domain/monster-eligibility.js";
import type {
  MonsterType,
  TaskStatus,
} from "../../monsters/domain/monster.types.js";
import {
  mapMonsterType,
} from "../../monsters/infrastructure/postgres-monster.mapper.js";
import {
  CombatAlreadyActiveError,
  CombatSessionNotFoundError,
  InvalidPersistentCombatStateError,
} from "../application/combat-session.errors.js";
import {
  PERSISTENT_COMBAT_STATUS,
  type CombatEventLog,
  type CombatSessionSnapshot,
  type GetActiveCombatInput,
  type GetCombatSessionInput,
  type PersistedCombatEvent,
} from "../application/combat-session.models.js";
import type {
  CombatActionTransaction,
  CombatActionTransactionInput,
  CombatSessionRepository,
  CombatStartMonster,
  CombatStartTransaction,
  CombatStartTransactionInput,
  CreateCombatSessionInput,
  LockedCombatCharacter,
  LockedCombatSession,
  PersistCombatActionInput,
} from "../application/combat-session.repository.js";
import {
  mapPostgreSqlCombatSessionRow,
  mapPostgreSqlCombatSessionSnapshotRow,
  type PostgreSqlCombatSessionRow,
} from "./postgres-combat.mapper.js";
import {
  COMBAT_DEFEAT_REASON,
  COMBAT_STATUS,
} from "../domain/combat.constants.js";
import type {
  CombatEvent,
  CombatState,
} from "../domain/combat.types.js";



type PostgreSqlCombatEventRow = {
  combat_session_event_id: string;
  combat_session_id: string;
  turn_number: number;
  event_order: number;
  event_type: string;
  event_data_json: unknown;
  created_at: Date;
};

type LockedCharacterRow = {
  character_id: string;
  account_id: string;
  level: number;
  current_health: string;
  max_health: string;
  current_mana: string;
  max_mana: string;
  current_energy: string;
  max_energy: string;
  resources_updated_at: Date;
};

type ActiveCombatRow = {
  combat_session_id: string;
};

type MonsterStartRow = {
  monster_id: string;
  code: string;
  monster_type: string;
  level: number;
  energy_cost: number;
  health: string;
  attack: string;
  defense: string;
  cooldown_available_at: Date | null;
  task_status: TaskStatus | null;
  daily_boss_available: boolean;
  daily_attempts_used: number;
  daily_attempts_per_day: number | null;
};

function mapSafeInteger(
  value: string | number,
  fieldName: string,
  minimum = 0
): number {
  const mapped = Number(value);

  if (
    !Number.isSafeInteger(mapped) ||
    mapped < minimum
  ) {
    throw new InvalidPersistentCombatStateError(
      `${fieldName} must contain a safe integer greater than or equal to ${minimum}.`
    );
  }

  return mapped;
}

function mapValidDate(
  value: Date,
  fieldName: string
): Date {
  if (
    !(value instanceof Date) ||
    Number.isNaN(value.getTime())
  ) {
    throw new InvalidPersistentCombatStateError(
      `${fieldName} must contain a valid date.`
    );
  }

  return new Date(value.getTime());
}



function mapPersistedEvent(
  row: PostgreSqlCombatEventRow
): PersistedCombatEvent {
  if (
    !Number.isSafeInteger(row.turn_number) ||
    row.turn_number < 1 ||
    row.turn_number > 100
  ) {
    throw new InvalidPersistentCombatStateError(
      "Persisted event turn number is invalid."
    );
  }

  if (
    !Number.isSafeInteger(row.event_order) ||
    row.event_order < 0
  ) {
    throw new InvalidPersistentCombatStateError(
      "Persisted event order is invalid."
    );
  }

  if (
    typeof row.event_type !== "string" ||
    row.event_type.trim().length === 0
  ) {
    throw new InvalidPersistentCombatStateError(
      "Persisted event type is invalid."
    );
  }

  if (
    typeof row.event_data_json !== "object" ||
    row.event_data_json === null ||
    Array.isArray(row.event_data_json)
  ) {
    throw new InvalidPersistentCombatStateError(
      "Persisted event data is invalid."
    );
  }

  return {
    combatSessionEventId:
      row.combat_session_event_id,
    combatSessionId:
      row.combat_session_id,
    turnNumber: row.turn_number,
    eventOrder: row.event_order,
    eventType: row.event_type,
    event:
      row.event_data_json as CombatEvent,
    createdAt: mapValidDate(
      row.created_at,
      "event.created_at"
    ),
  };
}

function mapDomainStatusToPersistent(
  state: CombatState
): {
  status: string;
  defeatReason: string | null;
  endedAtRequired: boolean;
} {
  switch (state.status) {
    case COMBAT_STATUS.inProgress:
      return {
        status:
          PERSISTENT_COMBAT_STATUS.active,
        defeatReason: null,
        endedAtRequired: false,
      };

    case COMBAT_STATUS.playerVictory:
      return {
        status:
          PERSISTENT_COMBAT_STATUS.victory,
        defeatReason: null,
        endedAtRequired: true,
      };

    case COMBAT_STATUS.playerDefeat:
      if (
        state.defeatReason !==
          COMBAT_DEFEAT_REASON.playerHealthDepleted &&
        state.defeatReason !==
          COMBAT_DEFEAT_REASON.turnLimitExceeded
      ) {
        throw new InvalidPersistentCombatStateError(
          "Player defeat requires a valid defeat reason."
        );
      }

      return {
        status:
          PERSISTENT_COMBAT_STATUS.defeat,
        defeatReason:
          state.defeatReason,
        endedAtRequired: true,
      };
  }
}

function mapLockedCharacter(
  row: LockedCharacterRow
): LockedCombatCharacter {
  return {
    characterId: row.character_id,
    accountId: row.account_id,
    level: mapSafeInteger(
      row.level,
      "level",
      1
    ),
    resources: {
      currentHealth: mapSafeInteger(
        row.current_health,
        "current_health"
      ),
      maximumHealth: mapSafeInteger(
        row.max_health,
        "max_health",
        1
      ),
      currentMana: mapSafeInteger(
        row.current_mana,
        "current_mana"
      ),
      maximumMana: mapSafeInteger(
        row.max_mana,
        "max_mana"
      ),
      currentEnergy: mapSafeInteger(
        row.current_energy,
        "current_energy"
      ),
      maximumEnergy: mapSafeInteger(
        row.max_energy,
        "max_energy",
        1
      ),
      resourcesUpdatedAt: mapValidDate(
        row.resources_updated_at,
        "resources_updated_at"
      ),
    },
  };
}

async function lockOwnedActiveCharacter(
  client: PoolClient,
  input: CombatStartTransactionInput
): Promise<LockedCombatCharacter> {
  const result =
    await client.query<LockedCharacterRow>(
      `
        SELECT
          character_id,
          account_id,
          level,
          current_health,
          max_health,
          current_mana,
          max_mana,
          current_energy,
          max_energy,
          resources_updated_at
        FROM characters
        WHERE account_id = $1
          AND character_id = $2
          AND status = 'IsActive'
        FOR UPDATE
      `,
      [
        input.accountId,
        input.characterId,
      ]
    );

  const row = result.rows[0];

  if (!row) {
    throw new CharacterNotFoundError();
  }

  return mapLockedCharacter(row);
}

class PostgresCombatStartTransaction
  implements CombatStartTransaction {
  public constructor(
    private readonly client: PoolClient,
    public readonly character:
      LockedCombatCharacter,
    private readonly observedAt: Date
  ) {}

  public async hasActiveCombat():
  Promise<boolean> {
    const result =
      await this.client.query<ActiveCombatRow>(
        `
          SELECT combat_session_id
          FROM combat_sessions
          WHERE character_id = $1
            AND status = 'Active'
          LIMIT 1
        `,
        [this.character.characterId]
      );

    return result.rows.length > 0;
  }

  public async findMonster(
    monsterCode: string
  ): Promise<CombatStartMonster | null> {
    const result =
      await this.client.query<MonsterStartRow>(
        `
          SELECT
            m.monster_id,
            m.code,
            m.monster_type,
            m.level,
            m.energy_cost,
            m.health,
            m.attack,
            m.defense,

            cc.available_at
              AS cooldown_available_at,

            task_statistics.task_status,

            (
              active_rotation.daily_boss_rotation_id
                IS NOT NULL
              AND daily_definition.daily_boss_definition_id
                IN (
                  active_rotation.tier_1_boss_id,
                  active_rotation.tier_2_boss_id,
                  active_rotation.tier_3_boss_id
                )
            ) AS daily_boss_available,

            COALESCE(
              daily_progress.attempts_used_in_rotation,
              0
            ) AS daily_attempts_used,

            daily_definition.attempts_per_day
              AS daily_attempts_per_day

          FROM monsters AS m

          LEFT JOIN character_cooldowns AS cc
            ON cc.character_id = $1
            AND cc.target_id = m.monster_id
            AND cc.cooldown_type = 'Monster'

          LEFT JOIN bosses AS task_boss
            ON task_boss.monster_id =
              m.monster_id

          LEFT JOIN monster_tasks
            AS task_definition
            ON task_definition.boss_id =
              task_boss.boss_id

          LEFT JOIN bestiary_statistics
            AS task_statistics
            ON task_statistics.character_id = $1
            AND task_statistics.monster_id =
              task_definition.monster_id

          LEFT JOIN bosses AS daily_boss
            ON daily_boss.monster_id =
              m.monster_id

          LEFT JOIN daily_boss_definitions
            AS daily_definition
            ON daily_definition.boss_id =
              daily_boss.boss_id

          LEFT JOIN daily_boss_rotation
            AS active_rotation
            ON active_rotation.created_at <= $2
            AND active_rotation.reset_timestamp > $2

          LEFT JOIN character_daily_boss_progress
            AS daily_progress
            ON daily_progress.character_id = $1
            AND daily_progress.daily_boss_definition_id =
              daily_definition.daily_boss_definition_id
            AND daily_progress.daily_boss_rotation_id =
              active_rotation.daily_boss_rotation_id

          WHERE m.code = $3
        `,
        [
          this.character.characterId,
          this.observedAt,
          monsterCode,
        ]
      );

    if (result.rows.length > 1) {
      throw new Error(
        "Monster start query returned multiple rows."
      );
    }

    const row = result.rows[0];

    if (!row) {
      return null;
    }

    const monsterType: MonsterType =
      mapMonsterType(row.monster_type);

    const cooldown =
      calculateMonsterCooldown(
        row.cooldown_available_at,
        this.observedAt
      );

    const dailyAttemptsPerDay =
      row.daily_attempts_per_day === null
        ? undefined
        : mapSafeInteger(
            row.daily_attempts_per_day,
            "daily_attempts_per_day",
            1
          );

    const eligibility =
      calculateMonsterEligibility({
        characterLevel:
          this.character.level,
        monsterLevel: mapSafeInteger(
          row.level,
          "monster.level",
          1
        ),
        monsterType,
        cooldownActive:
          cooldown.isActive,
        taskStatus: row.task_status,
        dailyBossAvailable:
          row.daily_boss_available,
        dailyAttemptsUsed:
          mapSafeInteger(
            row.daily_attempts_used,
            "daily_attempts_used"
          ),
        dailyAttemptsPerDay,
      });

    return {
      monsterId: row.monster_id,
      monsterCode: row.code,
      monsterType,
      level: mapSafeInteger(
        row.level,
        "monster.level",
        1
      ),
      energyCost: mapSafeInteger(
        row.energy_cost,
        "monster.energy_cost"
      ),
      maximumHealth: mapSafeInteger(
        row.health,
        "monster.health",
        1
      ),
      attack: mapSafeInteger(
        row.attack,
        "monster.attack"
      ),
      defense: mapSafeInteger(
        row.defense,
        "monster.defense"
      ),
      eligibility,
    };
  }

  public async calculateCharacterStatistics() {
    const repository =
      new PostgresCharacterStatisticsRepository(
        this.client
      );

    const service =
      new CalculateCharacterStatsService(
        repository
      );

    return service.execute({
      characterId:
        this.character.characterId,
      observedAt: this.observedAt,
    });
  }

  public async updateCharacterResources(
    resources: CharacterResources
  ): Promise<void> {
    const result = await this.client.query(
      `
        UPDATE characters
        SET
          current_health = $2,
          max_health = $3,
          current_mana = $4,
          max_mana = $5,
          current_energy = $6,
          max_energy = $7,
          resources_updated_at = $8,
          updated_at = $9
        WHERE character_id = $1
          AND status = 'IsActive'
      `,
      [
        this.character.characterId,
        resources.currentHealth,
        resources.maximumHealth,
        resources.currentMana,
        resources.maximumMana,
        resources.currentEnergy,
        resources.maximumEnergy,
        resources.resourcesUpdatedAt,
        this.observedAt,
      ]
    );

    if (result.rowCount !== 1) {
      throw new CharacterNotFoundError();
    }
  }

  public async createCombatSession(
    input: CreateCombatSessionInput
  ): Promise<CombatSessionSnapshot> {
    try {
      const result =
        await this.client.query<
          PostgreSqlCombatSessionRow
        >(
          `
            INSERT INTO combat_sessions (
              character_id,
              monster_id,
              status,
              current_turn,
              character_health,
              character_mana,
              monster_health,
              started_at,
              character_maximum_health,
              character_attack,
              character_defense,
              monster_maximum_health,
              monster_attack,
              monster_defense,
              defeat_reason
            )
            VALUES (
              $1,
              $2,
              'Active',
              1,
              $3,
              $4,
              $5,
              $6,
              $7,
              $8,
              $9,
              $10,
              $11,
              $12,
              NULL
            )
            RETURNING
              combat_session_id,
              character_id,
              monster_id,
              (
                SELECT code
                FROM monsters
                WHERE monster_id = $2
              ) AS monster_code,
              status,
              current_turn,
              character_health,
              character_maximum_health,
              character_attack,
              character_defense,
              monster_health,
              monster_maximum_health,
              monster_attack,
              monster_defense,
              defeat_reason,
              started_at,
              ended_at
          `,
          [
            this.character.characterId,
            input.monsterId,
            input.characterHealth,
            input.characterMana,
            input.monsterMaximumHealth,
            input.startedAt,
            input.characterMaximumHealth,
            input.characterAttack,
            input.characterDefense,
            input.monsterMaximumHealth,
            input.monsterAttack,
            input.monsterDefense,
          ]
        );

      const row = result.rows[0];

      if (!row) {
        throw new Error(
          "Combat session insert did not return a row."
        );
      }

      return mapPostgreSqlCombatSessionRow(
        row
      ).session;
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "23505"
      ) {
        throw new CombatAlreadyActiveError();
      }

      throw error;
    }
  }
}



class PostgresCombatActionTransaction
  implements CombatActionTransaction {
  public constructor(
    private readonly client: PoolClient,
    public readonly locked:
      LockedCombatSession
  ) {}

  public async persistAction(
    input: PersistCombatActionInput
  ): Promise<readonly PersistedCombatEvent[]> {
    const persistent =
      mapDomainStatusToPersistent(
        input.state
      );

    const endedAt =
      persistent.endedAtRequired
        ? input.observedAt
        : null;

    const update =
      await this.client.query(
        `
          UPDATE combat_sessions
          SET
            status = $2,
            current_turn = $3,
            character_health = $4,
            monster_health = $5,
            defeat_reason = $6,
            ended_at = $7,
            updated_at = $8
          WHERE combat_session_id = $1
            AND status = 'Active'
        `,
        [
          this.locked.session
            .combatSessionId,
          persistent.status,
          input.state.turn,
          input.state.player
            .currentHealth,
          input.state.monster
            .currentHealth,
          persistent.defeatReason,
          endedAt,
          input.observedAt,
        ]
      );

    if (update.rowCount !== 1) {
      throw new CombatSessionNotFoundError();
    }

    const persistedEvents:
      PersistedCombatEvent[] = [];

    for (
      let eventOrder = 0;
      eventOrder < input.events.length;
      eventOrder += 1
    ) {
      const event =
        input.events[eventOrder];

      if (event === undefined) {
        throw new InvalidPersistentCombatStateError(
          "Combat event array contains an empty position."
        );
      }

      const result =
        await this.client.query<
          PostgreSqlCombatEventRow
        >(
          `
            INSERT INTO combat_session_events (
              combat_session_id,
              turn_number,
              event_order,
              event_type,
              event_data_json,
              created_at
            )
            VALUES (
              $1,
              $2,
              $3,
              $4,
              $5::jsonb,
              $6
            )
            RETURNING
              combat_session_event_id,
              combat_session_id,
              turn_number,
              event_order,
              event_type,
              event_data_json,
              created_at
          `,
          [
            this.locked.session
              .combatSessionId,
            input.resolvedTurn,
            eventOrder,
            event.type,
            JSON.stringify(event),
            input.observedAt,
          ]
        );

      const row = result.rows[0];

      if (!row) {
        throw new Error(
          "Combat event insert did not return a row."
        );
      }

      persistedEvents.push(
        mapPersistedEvent(row)
      );
    }

    if (
      input.state.status !==
      COMBAT_STATUS.inProgress
    ) {
      const health =
        input.state.status ===
        COMBAT_STATUS.playerDefeat
          ? 0
          : input.state.player
              .currentHealth;

      const healthUpdate =
        await this.client.query(
          `
            UPDATE characters
            SET
              current_health = $2,
              updated_at = $3
            WHERE character_id = $1
              AND status = 'IsActive'
          `,
          [
            this.locked.session
              .characterId,
            health,
            input.observedAt,
          ]
        );

      if (
        healthUpdate.rowCount !== 1
      ) {
        throw new CharacterNotFoundError();
      }
    }

    return persistedEvents;
  }
}

export class PostgresCombatSessionRepository
  implements CombatSessionRepository {
  public constructor(
    private readonly pool: Pool
  ) {}

  public async withStartTransaction<TResult>(
    input: CombatStartTransactionInput,
    operation: (
      transaction: CombatStartTransaction
    ) => Promise<TResult>
  ): Promise<TResult> {
    if (
      !(input.observedAt instanceof Date) ||
      Number.isNaN(
        input.observedAt.getTime()
      )
    ) {
      throw new Error(
        "observedAt must contain a valid date."
      );
    }

    return withTransaction(
      this.pool,
      async (client) => {
        const character =
          await lockOwnedActiveCharacter(
            client,
            input
          );

        const transaction =
          new PostgresCombatStartTransaction(
            client,
            character,
            input.observedAt
          );

        if (
          await transaction.hasActiveCombat()
        ) {
          throw new CombatAlreadyActiveError();
        }

        return operation(transaction);
      }
    );
  }

  public async withActionTransaction<TResult>(
    input: CombatActionTransactionInput,
    operation: (
      transaction: CombatActionTransaction
    ) => Promise<TResult>
  ): Promise<TResult> {
    if (
      !(input.observedAt instanceof Date) ||
      Number.isNaN(
        input.observedAt.getTime()
      )
    ) {
      throw new Error(
        "observedAt must contain a valid date."
      );
    }

    return withTransaction(
      this.pool,
      async (client) => {
        const result =
          await client.query<
            PostgreSqlCombatSessionRow
          >(
            `
              SELECT
                cs.combat_session_id,
                cs.character_id,
                cs.monster_id,
                m.code AS monster_code,
                cs.status,
                cs.current_turn,
                cs.character_health,
                cs.character_maximum_health,
                cs.character_attack,
                cs.character_defense,
                cs.monster_health,
                cs.monster_maximum_health,
                cs.monster_attack,
                cs.monster_defense,
                cs.defeat_reason,
                cs.started_at,
                cs.ended_at
              FROM combat_sessions AS cs
              INNER JOIN characters AS c
                ON c.character_id =
                  cs.character_id
              INNER JOIN monsters AS m
                ON m.monster_id =
                  cs.monster_id
              WHERE c.account_id = $1
                AND c.character_id = $2
                AND c.status = 'IsActive'
                AND cs.status = 'Active'
              FOR UPDATE OF cs
            `,
            [
              input.accountId,
              input.characterId,
            ]
          );

        const row = result.rows[0];

        if (!row) {
          throw new CombatSessionNotFoundError();
        }

        const mapped =
          mapPostgreSqlCombatSessionRow(
            row
          );

        const transaction =
          new PostgresCombatActionTransaction(
            client,
            {
              session: mapped.session,
              combatState:
                mapped.combatState,
            }
          );

        return operation(transaction);
      }
    );
  }


  public async findActiveSession(
    input: GetActiveCombatInput
  ): Promise<CombatSessionSnapshot | null> {
    const result =
      await this.pool.query<
        PostgreSqlCombatSessionRow
      >(
        `
          SELECT
            cs.combat_session_id,
            cs.character_id,
            cs.monster_id,
            m.code AS monster_code,
            cs.status,
            cs.current_turn,
            cs.character_health,
            cs.character_maximum_health,
            cs.character_attack,
            cs.character_defense,
            cs.monster_health,
            cs.monster_maximum_health,
            cs.monster_attack,
            cs.monster_defense,
            cs.defeat_reason,
            cs.started_at,
            cs.ended_at
          FROM combat_sessions AS cs
          INNER JOIN characters AS c
            ON c.character_id =
              cs.character_id
          INNER JOIN monsters AS m
            ON m.monster_id =
              cs.monster_id
          WHERE c.account_id = $1
            AND c.character_id = $2
            AND c.status = 'IsActive'
            AND cs.status = 'Active'
          LIMIT 1
        `,
        [
          input.accountId,
          input.characterId,
        ]
      );

    const row = result.rows[0];

    return row
      ? mapPostgreSqlCombatSessionSnapshotRow(
          row
        )
      : null;
  }

  public async findSession(
    input: GetCombatSessionInput
  ): Promise<CombatSessionSnapshot | null> {
    const result =
      await this.pool.query<
        PostgreSqlCombatSessionRow
      >(
        `
          SELECT
            cs.combat_session_id,
            cs.character_id,
            cs.monster_id,
            m.code AS monster_code,
            cs.status,
            cs.current_turn,
            cs.character_health,
            cs.character_maximum_health,
            cs.character_attack,
            cs.character_defense,
            cs.monster_health,
            cs.monster_maximum_health,
            cs.monster_attack,
            cs.monster_defense,
            cs.defeat_reason,
            cs.started_at,
            cs.ended_at
          FROM combat_sessions AS cs
          INNER JOIN characters AS c
            ON c.character_id =
              cs.character_id
          INNER JOIN monsters AS m
            ON m.monster_id =
              cs.monster_id
          WHERE c.account_id = $1
            AND c.character_id = $2
            AND c.status = 'IsActive'
            AND cs.combat_session_id = $3
          LIMIT 1
        `,
        [
          input.accountId,
          input.characterId,
          input.combatSessionId,
        ]
      );

    const row = result.rows[0];

    return row
      ? mapPostgreSqlCombatSessionSnapshotRow(
          row
        )
      : null;
  }

  public async findEventLog(
    input: GetCombatSessionInput
  ): Promise<CombatEventLog | null> {
    const session =
      await this.findSession(input);

    if (session === null) {
      return null;
    }

    const result =
      await this.pool.query<
        PostgreSqlCombatEventRow
      >(
        `
          SELECT
            cse.combat_session_event_id,
            cse.combat_session_id,
            cse.turn_number,
            cse.event_order,
            cse.event_type,
            cse.event_data_json,
            cse.created_at
          FROM combat_session_events
            AS cse
          WHERE cse.combat_session_id = $1
          ORDER BY
            cse.turn_number ASC,
            cse.event_order ASC
        `,
        [
          input.combatSessionId,
        ]
      );

    return {
      combatSessionId:
        session.combatSessionId,
      events: result.rows.map(
        mapPersistedEvent
      ),
    };
  }

}

```

# ============================================================
# SOURCE: src/modules/combat/ports/random-source.ts
# ============================================================

```text
export interface RandomSource {
  nextFloat(): number;

  nextInt(
    minimum: number,
    maximum: number
  ): number;
}

```

# ============================================================
# SOURCE: src/modules/characters/application/calculate-character-stats.service.ts
# ============================================================

```text
import type {
  CharacterStatisticsRepository,
} from "./character-statistics.repository.js";
import {
  calculateEffectiveCharacterStatistics,
  type EffectiveCharacterStatistics,
} from "../domain/effective-character-statistics.js";
import {
  CharacterNotFoundError,
} from "../domain/character.errors.js";
import type {
  CharacterId,
} from "../domain/character.types.js";

export type CalculateCharacterStatsInput = {
  characterId: CharacterId;
  observedAt?: Date;
};

export class CalculateCharacterStatsService {
  public constructor(
    private readonly repository:
      CharacterStatisticsRepository
  ) {}

  public async execute(
    input: CalculateCharacterStatsInput
  ): Promise<EffectiveCharacterStatistics> {
    const sources =
      input.observedAt === undefined
        ? await this.repository.findCalculationSources(
            input.characterId
          )
        : await this.repository.findCalculationSources(
            input.characterId,
            input.observedAt
          );

    if (sources === null) {
      throw new CharacterNotFoundError();
    }

    return calculateEffectiveCharacterStatistics({
      level: sources.level,
      spellMasteryPower:
        sources.spellMasteryPower,
      equipment: sources.equipment,
      achievements: sources.achievements,
      progressionBoosts: sources.progressionBoosts,
    });
  }
}

```

# ============================================================
# SOURCE: src/modules/characters/application/character.repository.ts
# ============================================================

```text
import type {
  AccountId,
  CharacterId,
  CharacterResources,
  CharacterSnapshot,
  CharacterSummary,
  SeasonId,
} from "../domain/character.types.js";

export type CreateCharacterGraphInput = {
  accountId: AccountId;
  seasonId: SeasonId | null;
  name: string;
  spellLoadoutName: string;
  equipmentLoadoutName: string;
};

export type FindCharacterSnapshotInput = {
  accountId: AccountId;
  characterId: CharacterId;
};

export type ArchiveCharacterInput = {
  accountId: AccountId;
  characterId: CharacterId;
};

export type UpdateCharacterResourcesInput = {
  accountId: AccountId;
  characterId: CharacterId;
  resources: CharacterResources;
};

export interface CharacterRepository {
  createCharacterGraph(
    input: CreateCharacterGraphInput
  ): Promise<CharacterSnapshot>;

  listByAccount(
    accountId: AccountId
  ): Promise<readonly CharacterSummary[]>;

  findSnapshotById(
    input: FindCharacterSnapshotInput
  ): Promise<CharacterSnapshot | null>;

  archive(
    input: ArchiveCharacterInput
  ): Promise<CharacterSummary | null>;

  updateResources(
    input: UpdateCharacterResourcesInput
  ): Promise<boolean>;
}
```

# ============================================================
# SOURCE: src/modules/characters/application/character-statistics.repository.ts
# ============================================================

```text
import type {
  CharacterId,
} from "../domain/character.types.js";
import type {
  CharacterStatModifiers,
} from "../domain/effective-character-statistics.js";

export type CharacterStatisticsSources = {
  level: number;
  spellMasteryPower: number;
  equipment: CharacterStatModifiers;
  achievements: Partial<CharacterStatModifiers>;
  progressionBoosts: Partial<CharacterStatModifiers>;
};

export interface CharacterStatisticsRepository {
  findCalculationSources(
    characterId: CharacterId,
    observedAt?: Date
  ): Promise<CharacterStatisticsSources | null>;
}

```

# ============================================================
# SOURCE: src/modules/characters/application/get-character-snapshot.service.ts
# ============================================================

```text
import type {
  Clock,
} from "../../../application/ports/clock.js";
import type {
  CharacterRepository,
} from "./character.repository.js";
import type {
  CalculateCharacterStatsService,
} from "./calculate-character-stats.service.js";
import {
  CHARACTER_STATUS,
  DEFAULT_RESOURCE_REGENERATION,
} from "../domain/character.constants.js";
import {
  CharacterNotFoundError,
} from "../domain/character.errors.js";
import type {
  EffectiveCharacterStatistics,
} from "../domain/effective-character-statistics.js";
import {
  regenerateCharacterResources,
} from "../domain/resource-regeneration.js";
import type {
  AccountId,
  CharacterId,
  CharacterResources,
  CharacterSnapshot,
  ResourceRegenerationRates,
} from "../domain/character.types.js";

export type GetCharacterSnapshotInput = {
  accountId: AccountId;
  characterId: CharacterId;
};

export type EffectiveCharacterSnapshot =
  CharacterSnapshot & {
    effectiveStatistics:
      EffectiveCharacterStatistics;
  };

function applyEffectiveMaximums(
  resources: CharacterResources,
  statistics: EffectiveCharacterStatistics
): CharacterResources {
  return {
    ...resources,

    currentHealth: Math.min(
      resources.currentHealth,
      statistics.maximumHealth
    ),
    maximumHealth: statistics.maximumHealth,

    currentMana: Math.min(
      resources.currentMana,
      statistics.maximumMana
    ),
    maximumMana: statistics.maximumMana,

    currentEnergy: Math.min(
      resources.currentEnergy,
      statistics.maximumEnergy
    ),
    maximumEnergy: statistics.maximumEnergy,
  };
}

function resourcesAreEqual(
  first: CharacterResources,
  second: CharacterResources
): boolean {
  return (
    first.currentHealth === second.currentHealth &&
    first.maximumHealth === second.maximumHealth &&
    first.currentMana === second.currentMana &&
    first.maximumMana === second.maximumMana &&
    first.currentEnergy === second.currentEnergy &&
    first.maximumEnergy === second.maximumEnergy &&
    first.resourcesUpdatedAt.getTime() ===
      second.resourcesUpdatedAt.getTime()
  );
}

export class GetCharacterSnapshotService {
  public constructor(
    private readonly repository: CharacterRepository,
    private readonly statisticsService:
      CalculateCharacterStatsService,
    private readonly clock: Clock,
    private readonly regenerationRates:
      ResourceRegenerationRates =
        DEFAULT_RESOURCE_REGENERATION
  ) {}

  public async execute(
    input: GetCharacterSnapshotInput
  ): Promise<EffectiveCharacterSnapshot> {
    const snapshot =
      await this.repository.findSnapshotById({
        accountId: input.accountId,
        characterId: input.characterId,
      });

    if (!snapshot) {
      throw new CharacterNotFoundError();
    }

    const effectiveStatistics =
      await this.statisticsService.execute({
        characterId: input.characterId,
      });

    const clampedResources =
      applyEffectiveMaximums(
        snapshot.resources,
        effectiveStatistics
      );

    if (
      snapshot.status ===
      CHARACTER_STATUS.archived
    ) {
      return {
        ...snapshot,
        resources: clampedResources,
        effectiveStatistics,
      };
    }

    const regeneration =
      regenerateCharacterResources(
        clampedResources,
        this.regenerationRates,
        this.clock.now()
      );

    const needsPersistence =
      regeneration.needsPersistence ||
      !resourcesAreEqual(
        snapshot.resources,
        regeneration.resources
      );

    if (needsPersistence) {
      const updated =
        await this.repository.updateResources({
          accountId: input.accountId,
          characterId: input.characterId,
          resources: regeneration.resources,
        });

      if (!updated) {
        throw new CharacterNotFoundError();
      }
    }

    return {
      ...snapshot,
      resources: regeneration.resources,
      effectiveStatistics,
    };
  }
}

```

# ============================================================
# SOURCE: src/modules/characters/domain/character.constants.ts
# ============================================================

```text
export const CHARACTER_STATUS = {
  active: "IsActive",
  archived: "Archived",
} as const;

export const CHARACTER_NAME_POLICY = {
  minimumLength: 3,
  maximumLength: 24,
} as const;

export const CHARACTER_LIMITS = {
  maximumActiveCharactersPerAccount: 3,
} as const;

export const INITIAL_CHARACTER = {
  level: 1,
  experience: 0n,
  gold: 0n,

  currentHealth: 180,
  maximumHealth: 180,

  currentMana: 35,
  maximumMana: 35,

  currentEnergy: 100,
  maximumEnergy: 100,

  baseAttack: 7,
  baseDefense: 7,
  baseSpellPower: 100,

  craftingLevel: 1,
  craftingExperience: 0n,

  gatheringLevel: 1,
  gatheringExperience: 0n,

  spellSlots: 1,
  craftingSlots: 1,
  inventorySlots: 50,
} as const;

export const DEFAULT_RESOURCE_REGENERATION = {
  healthPerMinute: 0,
  manaPerMinute: 0,
  energyPerMinute: 1,
} as const;
```

# ============================================================
# SOURCE: src/modules/characters/domain/character.errors.ts
# ============================================================

```text
import { ApplicationError } from "../../../application/errors/application-error.js";

export const CHARACTER_ERROR_CODE = {
  invalidName: "CHARACTER_NAME_INVALID",
  nameTaken: "CHARACTER_NAME_TAKEN",
  limitReached: "CHARACTER_LIMIT_REACHED",
  notFound: "CHARACTER_NOT_FOUND",
  accessDenied: "CHARACTER_ACCESS_DENIED",
  alreadyArchived: "CHARACTER_ALREADY_ARCHIVED",
  invalidResourceState: "CHARACTER_RESOURCE_STATE_INVALID",
  inventoryItemNotFound: "INVENTORY_ITEM_NOT_FOUND",
  equipmentLevelRequired: "EQUIPMENT_LEVEL_REQUIRED",
  equipmentAlreadyEquipped: "EQUIPMENT_ALREADY_EQUIPPED",
  equipmentNotEquipped: "EQUIPMENT_NOT_EQUIPPED",
} as const;

export type CharacterErrorCode =
  (typeof CHARACTER_ERROR_CODE)[keyof typeof CHARACTER_ERROR_CODE];

export class CharacterNameInvalidError extends ApplicationError {
  public constructor(reason: string) {
    super({
      code: CHARACTER_ERROR_CODE.invalidName,
      message: "Character name is invalid.",
      statusCode: 400,
      details: {
        reason,
      },
    });

    this.name = "CharacterNameInvalidError";
  }
}

export class CharacterNameTakenError extends ApplicationError {
  public constructor() {
    super({
      code: CHARACTER_ERROR_CODE.nameTaken,
      message: "Character name is already taken.",
      statusCode: 409,
    });

    this.name = "CharacterNameTakenError";
  }
}

export class CharacterLimitReachedError extends ApplicationError {
  public constructor(maximumActiveCharacters: number) {
    super({
      code: CHARACTER_ERROR_CODE.limitReached,
      message: "Active character limit has been reached.",
      statusCode: 409,
      details: {
        maximumActiveCharacters,
      },
    });

    this.name = "CharacterLimitReachedError";
  }
}

export class CharacterNotFoundError extends ApplicationError {
  public constructor() {
    super({
      code: CHARACTER_ERROR_CODE.notFound,
      message: "Character was not found.",
      statusCode: 404,
    });

    this.name = "CharacterNotFoundError";
  }
}

export class CharacterAccessDeniedError extends ApplicationError {
  public constructor() {
    super({
      code: CHARACTER_ERROR_CODE.accessDenied,
      message: "Character access was denied.",
      statusCode: 403,
    });

    this.name = "CharacterAccessDeniedError";
  }
}

export class CharacterAlreadyArchivedError extends ApplicationError {
  public constructor() {
    super({
      code: CHARACTER_ERROR_CODE.alreadyArchived,
      message: "Character is already archived.",
      statusCode: 409,
    });

    this.name = "CharacterAlreadyArchivedError";
  }
}

export class CharacterResourceStateInvalidError extends ApplicationError {
  public constructor(reason: string) {
    super({
      code: CHARACTER_ERROR_CODE.invalidResourceState,
      message: "Character resource state is invalid.",
      statusCode: 500,
      details: {
        reason,
      },
    });

    this.name = "CharacterResourceStateInvalidError";
  }
}
export class InventoryItemNotFoundError extends ApplicationError {
  public constructor() {
    super({
      code: CHARACTER_ERROR_CODE.inventoryItemNotFound,
      message: "Inventory item was not found.",
      statusCode: 404,
    });

    this.name = "InventoryItemNotFoundError";
  }
}

export class EquipmentLevelRequiredError extends ApplicationError {
  public constructor(
    requiredLevel: number,
    characterLevel: number
  ) {
    super({
      code: CHARACTER_ERROR_CODE.equipmentLevelRequired,
      message: "Character level is too low to equip this item.",
      statusCode: 409,
      details: {
        requiredLevel,
        characterLevel,
      },
    });

    this.name = "EquipmentLevelRequiredError";
  }
}

export class EquipmentAlreadyEquippedError extends ApplicationError {
  public constructor() {
    super({
      code: CHARACTER_ERROR_CODE.equipmentAlreadyEquipped,
      message: "Inventory item is already equipped.",
      statusCode: 409,
    });

    this.name = "EquipmentAlreadyEquippedError";
  }
}

export class EquipmentNotEquippedError extends ApplicationError {
  public constructor() {
    super({
      code: CHARACTER_ERROR_CODE.equipmentNotEquipped,
      message: "Inventory item is not equipped.",
      statusCode: 409,
    });

    this.name = "EquipmentNotEquippedError";
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
# SOURCE: src/modules/characters/domain/resource-regeneration.ts
# ============================================================

```text
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
```

# ============================================================
# SOURCE: src/modules/characters/infrastructure/postgres-character.mapper.ts
# ============================================================

```text
import {
  INITIAL_CHARACTER,
} from "../domain/character.constants.js";
import {
  CharacterResourceStateInvalidError,
} from "../domain/character.errors.js";
import type {
  CharacterSnapshot,
  CharacterStatus,
  CharacterSummary,
} from "../domain/character.types.js";

export type PostgreSqlCharacterSummaryRow = {
  character_id: string;
  account_id: string;
  season_id: string | null;
  name: string;
  status: CharacterStatus;
  level: number;
  experience: string;
  created_at: Date;
  updated_at: Date;
};

export type PostgreSqlCharacterSnapshotRow = {
  character_id: string;
  account_id: string;
  season_id: string | null;
  name: string;
  status: CharacterStatus;

  level: number;
  experience: string;
  gold: string;

  current_health: string;
  max_health: string;

  current_mana: string;
  max_mana: string;

  current_energy: string;
  max_energy: string;

  crafting_level: number;
  crafting_xp: string;

  gathering_level: number;
  gathering_xp: string;

  resources_updated_at: Date;

  is_promoted: boolean;
  spell_slots_unlocked: number;
  crafting_slots_unlocked: number;
  inventory_slots: number;

  current_spell_power: string;

  created_at: Date;
  updated_at: Date;
};

function parseBigIntValue(
  value: string,
  fieldName: string
): bigint {
  try {
    return BigInt(value);
  } catch (error: unknown) {
    throw new CharacterResourceStateInvalidError(
      `${fieldName} must contain a valid bigint value.`
    );
  }
}

function parseSafeInteger(
  value: string,
  fieldName: string
): number {
  const parsedValue = Number(value);

  if (
    !Number.isSafeInteger(parsedValue) ||
    parsedValue < 0
  ) {
    throw new CharacterResourceStateInvalidError(
      `${fieldName} must contain a non-negative safe integer.`
    );
  }

  return parsedValue;
}

function parseSpellPower(value: string): number {
  const parsedValue = Number(value);

  if (
    !Number.isFinite(parsedValue) ||
    parsedValue < 0
  ) {
    throw new CharacterResourceStateInvalidError(
      "current_spell_power must be a non-negative number."
    );
  }

  return parsedValue;
}

function assertValidDate(
  value: Date,
  fieldName: string
): Date {
  if (
    !(value instanceof Date) ||
    Number.isNaN(value.getTime())
  ) {
    throw new CharacterResourceStateInvalidError(
      `${fieldName} must contain a valid date.`
    );
  }

  return value;
}

export function mapCharacterSummaryRow(
  row: PostgreSqlCharacterSummaryRow
): CharacterSummary {
  return {
    characterId: row.character_id,
    accountId: row.account_id,
    seasonId: row.season_id,

    name: row.name,
    status: row.status,

    level: row.level,
    experience: parseBigIntValue(
      row.experience,
      "experience"
    ),

    createdAt: assertValidDate(
      row.created_at,
      "created_at"
    ),

    updatedAt: assertValidDate(
      row.updated_at,
      "updated_at"
    ),
  };
}

export function mapCharacterSnapshotRow(
  row: PostgreSqlCharacterSnapshotRow
): CharacterSnapshot {
  return {
    characterId: row.character_id,
    accountId: row.account_id,
    seasonId: row.season_id,

    name: row.name,
    status: row.status,

    progression: {
      level: row.level,

      experience: parseBigIntValue(
        row.experience,
        "experience"
      ),

      gold: parseBigIntValue(
        row.gold,
        "gold"
      ),

      craftingLevel: row.crafting_level,

      craftingExperience: parseBigIntValue(
        row.crafting_xp,
        "crafting_xp"
      ),

      gatheringLevel: row.gathering_level,

      gatheringExperience: parseBigIntValue(
        row.gathering_xp,
        "gathering_xp"
      ),
    },

    resources: {
      currentHealth: parseSafeInteger(
        row.current_health,
        "current_health"
      ),

      maximumHealth: parseSafeInteger(
        row.max_health,
        "max_health"
      ),

      currentMana: parseSafeInteger(
        row.current_mana,
        "current_mana"
      ),

      maximumMana: parseSafeInteger(
        row.max_mana,
        "max_mana"
      ),

      currentEnergy: parseSafeInteger(
        row.current_energy,
        "current_energy"
      ),

      maximumEnergy: parseSafeInteger(
        row.max_energy,
        "max_energy"
      ),

      resourcesUpdatedAt: assertValidDate(
        row.resources_updated_at,
        "resources_updated_at"
      ),
    },

    baseStatistics: {
      attack: INITIAL_CHARACTER.baseAttack,
      defense: INITIAL_CHARACTER.baseDefense,

      spellPower: parseSpellPower(
        row.current_spell_power
      ),
    },

    unlocks: {
      promoted: row.is_promoted,
      spellSlots: row.spell_slots_unlocked,
      craftingSlots: row.crafting_slots_unlocked,
      inventorySlots: row.inventory_slots,
    },

    createdAt: assertValidDate(
      row.created_at,
      "created_at"
    ),

    updatedAt: assertValidDate(
      row.updated_at,
      "updated_at"
    ),
  };
}
```

# ============================================================
# SOURCE: src/modules/characters/infrastructure/postgres-character.repository.ts
# ============================================================

```text
import type {
  Pool,
  PoolClient,
  QueryResult,
  QueryResultRow,
} from "pg";

import type {
  ArchiveCharacterInput,
  CharacterRepository,
  CreateCharacterGraphInput,
  FindCharacterSnapshotInput,
  UpdateCharacterResourcesInput,
} from "../application/character.repository.js";
import {
  CHARACTER_LIMITS,
  CHARACTER_STATUS,
} from "../domain/character.constants.js";
import {
  CharacterAccessDeniedError,
  CharacterLimitReachedError,
  CharacterNameTakenError,
} from "../domain/character.errors.js";
import type {
  AccountId,
  CharacterSnapshot,
  CharacterSummary,
} from "../domain/character.types.js";
import { withTransaction } from "../../../infrastructure/database/transaction.js";
import {
  mapCharacterSnapshotRow,
  mapCharacterSummaryRow,
  type PostgreSqlCharacterSnapshotRow,
  type PostgreSqlCharacterSummaryRow,
} from "./postgres-character.mapper.js";

type PostgreSqlError = {
  code?: string;
  constraint?: string;
};

type Queryable = {
  query<Row extends QueryResultRow>(
    queryText: string,
    values?: unknown[]
  ): Promise<QueryResult<Row>>;
};

type CharacterIdRow = {
  character_id: string;
};

type CountRow = {
  active_character_count: string;
};

const SUMMARY_COLUMNS = `
  character_id,
  account_id,
  season_id,
  name,
  status,
  level,
  experience,
  created_at,
  updated_at
`;

const SNAPSHOT_QUERY = `
  SELECT
    c.character_id,
    c.account_id,
    c.season_id,
    c.name,
    c.status,

    c.level,
    c.experience,
    c.gold,

    c.current_health,
    c.max_health,

    c.current_mana,
    c.max_mana,

    c.current_energy,
    c.max_energy,

    c.crafting_level,
    c.crafting_xp,

    c.gathering_level,
    c.gathering_xp,

    c.resources_updated_at,

    u.is_promoted,
    u.spell_slots_unlocked,
    u.crafting_slots_unlocked,
    u.inventory_slots,

    m.current_spell_power,

    c.created_at,
    c.updated_at
  FROM characters AS c
  INNER JOIN character_unlocks AS u
    ON u.character_id = c.character_id
  INNER JOIN character_spell_mastery AS m
    ON m.character_id = c.character_id
  WHERE c.account_id = $1
    AND c.character_id = $2
`;

function isPostgreSqlError(error: unknown): error is PostgreSqlError {
  return typeof error === "object" && error !== null;
}

function isCharacterNameUniquenessError(error: unknown): boolean {
  if (!isPostgreSqlError(error) || error.code !== "23505") {
    return false;
  }

  return (
    error.constraint === "ux_characters_name" ||
    error.constraint === "ux_characters_normalized_name"
  );
}

async function findSnapshot(
  queryable: Queryable,
  accountId: string,
  characterId: string
): Promise<CharacterSnapshot | null> {
  const result =
    await queryable.query<PostgreSqlCharacterSnapshotRow>(
      SNAPSHOT_QUERY,
      [accountId, characterId]
    );

  const row = result.rows[0];

  return row ? mapCharacterSnapshotRow(row) : null;
}

export class PostgresCharacterRepository
  implements CharacterRepository
{
  public constructor(private readonly pool: Pool) {}

  public async createCharacterGraph(
    input: CreateCharacterGraphInput
  ): Promise<CharacterSnapshot> {
    try {
      return await withTransaction(
        this.pool,
        async (client: PoolClient) => {
          await this.lockAccount(client, input.accountId);

          const activeCharacterCount =
            await this.countActiveCharacters(
              client,
              input.accountId
            );

          if (
            activeCharacterCount >=
            CHARACTER_LIMITS.maximumActiveCharactersPerAccount
          ) {
            throw new CharacterLimitReachedError(
              CHARACTER_LIMITS.maximumActiveCharactersPerAccount
            );
          }

          const characterResult =
            await client.query<CharacterIdRow>(
              `
                INSERT INTO characters (
                  account_id,
                  season_id,
                  name
                )
                VALUES ($1, $2, $3)
                RETURNING character_id
              `,
              [
                input.accountId,
                input.seasonId,
                input.name,
              ]
            );

          const characterRow = characterResult.rows[0];

          if (!characterRow) {
            throw new Error(
              "Character insert did not return character_id."
            );
          }

          const characterId = characterRow.character_id;

          await client.query(
            `
              INSERT INTO character_statistics (
                character_id
              )
              VALUES ($1)
            `,
            [characterId]
          );

          await client.query(
            `
              INSERT INTO character_unlocks (
                character_id
              )
              VALUES ($1)
            `,
            [characterId]
          );

          await client.query(
            `
              INSERT INTO character_spell_mastery (
                character_id
              )
              VALUES ($1)
            `,
            [characterId]
          );

          await client.query(
            `
              INSERT INTO character_loadouts (
                character_id,
                name,
                is_default
              )
              VALUES ($1, $2, TRUE)
            `,
            [
              characterId,
              input.spellLoadoutName,
            ]
          );

          await client.query(
            `
              INSERT INTO equipment_loadouts (
                character_id,
                name,
                is_default
              )
              VALUES ($1, $2, TRUE)
            `,
            [
              characterId,
              input.equipmentLoadoutName,
            ]
          );

          const snapshot = await findSnapshot(
            client,
            input.accountId,
            characterId
          );

          if (!snapshot) {
            throw new Error(
              "Created character snapshot could not be loaded."
            );
          }

          return snapshot;
        }
      );
    } catch (error: unknown) {
      if (isCharacterNameUniquenessError(error)) {
        throw new CharacterNameTakenError();
      }

      throw error;
    }
  }

  public async listByAccount(
    accountId: AccountId
  ): Promise<readonly CharacterSummary[]> {
    const result =
      await this.pool.query<PostgreSqlCharacterSummaryRow>(
        `
          SELECT
            ${SUMMARY_COLUMNS}
          FROM characters
          WHERE account_id = $1
          ORDER BY
            CASE
              WHEN status = $2 THEN 0
              ELSE 1
            END,
            created_at ASC,
            character_id ASC
        `,
        [
          accountId,
          CHARACTER_STATUS.active,
        ]
      );

    return result.rows.map(mapCharacterSummaryRow);
  }

  public async findSnapshotById(
    input: FindCharacterSnapshotInput
  ): Promise<CharacterSnapshot | null> {
    return findSnapshot(
      this.pool,
      input.accountId,
      input.characterId
    );
  }

  public async archive(
    input: ArchiveCharacterInput
  ): Promise<CharacterSummary | null> {
    const result =
      await this.pool.query<PostgreSqlCharacterSummaryRow>(
        `
          UPDATE characters
          SET
            status = $3,
            updated_at = now()
          WHERE account_id = $1
            AND character_id = $2
            AND status = $4
          RETURNING
            ${SUMMARY_COLUMNS}
        `,
        [
          input.accountId,
          input.characterId,
          CHARACTER_STATUS.archived,
          CHARACTER_STATUS.active,
        ]
      );

    const row = result.rows[0];

    return row ? mapCharacterSummaryRow(row) : null;
  }

  public async updateResources(
    input: UpdateCharacterResourcesInput
  ): Promise<boolean> {
    const result = await this.pool.query(
      `
        UPDATE characters
        SET
          current_health = $3,
          max_health = $4,
          current_mana = $5,
          max_mana = $6,
          current_energy = $7,
          max_energy = $8,
          resources_updated_at = $9,
          updated_at = now()
        WHERE account_id = $1
          AND character_id = $2
      `,
      [
        input.accountId,
        input.characterId,
        input.resources.currentHealth,
        input.resources.maximumHealth,
        input.resources.currentMana,
        input.resources.maximumMana,
        input.resources.currentEnergy,
        input.resources.maximumEnergy,
        input.resources.resourcesUpdatedAt,
      ]
    );

    return result.rowCount === 1;
  }

  private async lockAccount(
    client: PoolClient,
    accountId: AccountId
  ): Promise<void> {
    const result = await client.query(
      `
        SELECT account_id
        FROM accounts
        WHERE account_id = $1
          AND status = 'Active'
        FOR UPDATE
      `,
      [accountId]
    );

    if (result.rowCount !== 1) {
      throw new CharacterAccessDeniedError();
    }
  }

  private async countActiveCharacters(
    client: PoolClient,
    accountId: AccountId
  ): Promise<number> {
    const result = await client.query<CountRow>(
      `
        SELECT COUNT(*)::text AS active_character_count
        FROM characters
        WHERE account_id = $1
          AND status = $2
      `,
      [
        accountId,
        CHARACTER_STATUS.active,
      ]
    );

    const row = result.rows[0];

    if (!row) {
      throw new Error(
        "Active character count query returned no row."
      );
    }

    const count = Number(row.active_character_count);

    if (!Number.isSafeInteger(count) || count < 0) {
      throw new Error(
        "Active character count is invalid."
      );
    }

    return count;
  }
}
```

# ============================================================
# SOURCE: src/modules/characters/infrastructure/postgres-character-statistics.repository.ts
# ============================================================

```text
import type {
  Pool,
  QueryResult,
  QueryResultRow,
} from "pg";

import type {
  CharacterStatisticsRepository,
  CharacterStatisticsSources,
} from "../application/character-statistics.repository.js";
import type {
  CharacterId,
} from "../domain/character.types.js";

type Queryable = {
  query<Row extends QueryResultRow>(
    queryText: string,
    values?: unknown[]
  ): Promise<QueryResult<Row>>;
};

type CharacterStatisticsSourcesRow = {
  level: number;
  current_spell_power: string;
  equipment_attack: string;
  equipment_defense: string;
  equipment_spell_power: string;
  equipment_health: string;
  equipment_mana: string;
  equipment_energy: string;
  equipment_gold_percent: string;
  equipment_experience_percent: string;
  achievement_attack: string;
  achievement_defense: string;
  achievement_gold_percent: string;
  achievement_experience_percent: string;
  boost_gold_percent: string;
  boost_experience_percent: string;
};

const CALCULATION_SOURCES_QUERY = `
  SELECT
    c.level,
    csm.current_spell_power,

    COALESCE(SUM(ib.attack + COALESCE(ia.attack, 0)), 0) +
      COALESCE(MAX(sb.attack), 0) AS equipment_attack,

    COALESCE(SUM(ib.defense + COALESCE(ia.defense, 0)), 0) +
      COALESCE(MAX(sb.defense), 0) AS equipment_defense,

    COALESCE(SUM(ib.spell_power + COALESCE(ia.spell_power, 0)), 0) +
      COALESCE(MAX(sb.spell_power), 0) AS equipment_spell_power,

    COALESCE(SUM(ib.health + COALESCE(ia.health, 0)), 0) +
      COALESCE(MAX(sb.health), 0) AS equipment_health,

    COALESCE(SUM(ib.mana + COALESCE(ia.mana, 0)), 0) +
      COALESCE(MAX(sb.mana), 0) AS equipment_mana,

    COALESCE(SUM(ib.energy + COALESCE(ia.energy, 0)), 0)
      AS equipment_energy,

    COALESCE(
      SUM(ib.gold_percent + COALESCE(ia.gold_percent, 0)),
      0
    ) + COALESCE(MAX(sb.gold_percent), 0)
      AS equipment_gold_percent,

    COALESCE(
      SUM(
        ib.experience_percent +
        COALESCE(ia.experience_percent, 0)
      ),
      0
    ) + COALESCE(MAX(sb.experience_percent), 0)
      AS equipment_experience_percent,

    COALESCE(MAX(achievement.attack), 0)
      AS achievement_attack,
    COALESCE(MAX(achievement.defense), 0)
      AS achievement_defense,
    COALESCE(MAX(achievement.gold_percent), 0)
      AS achievement_gold_percent,
    COALESCE(MAX(achievement.experience_percent), 0)
      AS achievement_experience_percent,

    COALESCE(MAX(boost.gold_percent), 0) AS boost_gold_percent,
    COALESCE(MAX(boost.experience_percent), 0)
      AS boost_experience_percent

  FROM characters c

  INNER JOIN character_spell_mastery csm
    ON csm.character_id = c.character_id

  LEFT JOIN inventory_items ii
    ON ii.character_id = c.character_id
    AND ii.is_equipped = TRUE

  LEFT JOIN items i
    ON i.item_id = ii.item_id

  LEFT JOIN item_bases ib
    ON ib.item_base_id = i.item_base_id

  LEFT JOIN LATERAL (
    SELECT
      COALESCE(SUM(ia.roll_value) FILTER (
        WHERE at.affix_type = 'Attack'
      ), 0) AS attack,
      COALESCE(SUM(ia.roll_value) FILTER (
        WHERE at.affix_type = 'Defense'
      ), 0) AS defense,
      COALESCE(SUM(ia.roll_value) FILTER (
        WHERE at.affix_type = 'SpellPower'
      ), 0) AS spell_power,
      COALESCE(SUM(ia.roll_value) FILTER (
        WHERE at.affix_type = 'Health'
      ), 0) AS health,
      COALESCE(SUM(ia.roll_value) FILTER (
        WHERE at.affix_type = 'Mana'
      ), 0) AS mana,
      COALESCE(SUM(ia.roll_value) FILTER (
        WHERE at.affix_type = 'Energy'
      ), 0) AS energy,
      COALESCE(SUM(ia.roll_value) FILTER (
        WHERE at.affix_type = 'GoldPercent'
      ), 0) AS gold_percent,
      COALESCE(SUM(ia.roll_value) FILTER (
        WHERE at.affix_type = 'ExperiencePercent'
      ), 0) AS experience_percent
    FROM item_affixes ia
    INNER JOIN affix_templates at
      ON at.affix_template_id = ia.affix_template_id
    WHERE ia.item_id = i.item_id
  ) ia ON TRUE

  LEFT JOIN LATERAL (
    SELECT
      COALESCE(SUM(selected.bonus_value) FILTER (
        WHERE selected.bonus_type = 'Attack'
      ), 0) AS attack,
      COALESCE(SUM(selected.bonus_value) FILTER (
        WHERE selected.bonus_type = 'Defense'
      ), 0) AS defense,
      COALESCE(SUM(selected.bonus_value) FILTER (
        WHERE selected.bonus_type = 'SpellPower'
      ), 0) AS spell_power,
      COALESCE(SUM(selected.bonus_value) FILTER (
        WHERE selected.bonus_type = 'Health'
      ), 0) AS health,
      COALESCE(SUM(selected.bonus_value) FILTER (
        WHERE selected.bonus_type = 'Mana'
      ), 0) AS mana,
      COALESCE(SUM(selected.bonus_value) FILTER (
        WHERE selected.bonus_type = 'GoldPercent'
      ), 0) AS gold_percent,
      COALESCE(SUM(selected.bonus_value) FILTER (
        WHERE selected.bonus_type = 'ExperiencePercent'
      ), 0) AS experience_percent
    FROM (
      SELECT DISTINCT ON (
        bonus.set_template_id,
        bonus.bonus_type
      )
        bonus.set_template_id,
        bonus.bonus_type,
        bonus.bonus_value
      FROM set_bonuses bonus
      INNER JOIN (
        SELECT
          equipped_base.set_template_id,
          COUNT(*) AS equipped_pieces
        FROM inventory_items equipped_inventory
        INNER JOIN items equipped_item
          ON equipped_item.item_id = equipped_inventory.item_id
        INNER JOIN item_bases equipped_base
          ON equipped_base.item_base_id = equipped_item.item_base_id
        WHERE equipped_inventory.character_id = c.character_id
          AND equipped_inventory.is_equipped = TRUE
          AND equipped_base.set_template_id IS NOT NULL
        GROUP BY equipped_base.set_template_id
      ) equipped_sets
        ON equipped_sets.set_template_id = bonus.set_template_id
        AND bonus.required_pieces <= equipped_sets.equipped_pieces
      ORDER BY
        bonus.set_template_id,
        bonus.bonus_type,
        bonus.required_pieces DESC
    ) selected
  ) sb ON TRUE

  LEFT JOIN LATERAL (
    SELECT
      COALESCE(SUM(a.reward_attack), 0) AS attack,
      COALESCE(SUM(a.reward_defense), 0) AS defense,
      COALESCE(SUM(a.reward_gold_percent), 0) AS gold_percent,
      COALESCE(SUM(a.reward_experience_percent), 0)
        AS experience_percent
    FROM achievement_progress ap
    INNER JOIN achievements a
      ON a.achievement_id = ap.achievement_id
    WHERE ap.account_id = c.account_id
      AND ap.is_completed = TRUE
  ) achievement ON TRUE

  LEFT JOIN LATERAL (
    SELECT

      COALESCE(SUM(cb.value) FILTER (
        WHERE cb.buff_type = 'GoldBoost'
      ), 0) AS gold_percent,
      COALESCE(SUM(cb.value) FILTER (
        WHERE cb.buff_type = 'ExperienceBoost'
      ), 0) AS experience_percent
    FROM character_buffs cb
    WHERE cb.character_id = c.character_id
      AND cb.is_positive = TRUE
      AND (
        cb.duration_type = 'Permanent'
        OR cb.duration_remaining > 0
      )
      AND (
        cb.expires_at IS NULL
        OR cb.expires_at > COALESCE($2::timestamptz, NOW())
      )
  ) boost ON TRUE

  WHERE c.character_id = $1

  GROUP BY
    c.character_id,
    c.level,
    csm.current_spell_power
`;

function parseNumericValue(
  value: string,
  fieldName: string
): number {
  const parsedValue = Number(value);

  if (
    !Number.isFinite(parsedValue) ||
    parsedValue < 0
  ) {
    throw new Error(
      `${fieldName} must be a non-negative finite number.`
    );
  }

  return parsedValue;
}

export class PostgresCharacterStatisticsRepository
  implements CharacterStatisticsRepository
{
  public constructor(
    private readonly database: Queryable
  ) {}

  public async findCalculationSources(
    characterId: CharacterId,
    observedAt?: Date
  ): Promise<CharacterStatisticsSources | null> {
    if (
      observedAt !== undefined &&
      (
        !(observedAt instanceof Date) ||
        Number.isNaN(observedAt.getTime())
      )
    ) {
      throw new Error(
        "observedAt must contain a valid date."
      );
    }
    const result =
      await this.database.query<CharacterStatisticsSourcesRow>(
        CALCULATION_SOURCES_QUERY,
        [characterId, observedAt ?? null]
      );

    const row = result.rows[0];

    if (row === undefined) {
      return null;
    }

    return {
      level: row.level,
      spellMasteryPower: parseNumericValue(
        row.current_spell_power,
        "current_spell_power"
      ),
           progressionBoosts: {

        goldBonusPercent: parseNumericValue(
          row.boost_gold_percent,
          "boost_gold_percent"
        ),
        experienceBonusPercent: parseNumericValue(
          row.boost_experience_percent,
          "boost_experience_percent"
        ),
      },
      achievements: {
        attack: parseNumericValue(
          row.achievement_attack,
          "achievement_attack"
        ),
        defense: parseNumericValue(
          row.achievement_defense,
          "achievement_defense"
        ),
        goldBonusPercent: parseNumericValue(
          row.achievement_gold_percent,
          "achievement_gold_percent"
        ),
        experienceBonusPercent: parseNumericValue(
          row.achievement_experience_percent,
          "achievement_experience_percent"
        ),
      },
      equipment: {
        attack: parseNumericValue(
          row.equipment_attack,
          "equipment_attack"
        ),
        defense: parseNumericValue(
          row.equipment_defense,
          "equipment_defense"
        ),
        spellPower: parseNumericValue(
          row.equipment_spell_power,
          "equipment_spell_power"
        ),
        maximumHealth: parseNumericValue(
          row.equipment_health,
          "equipment_health"
        ),
        maximumMana: parseNumericValue(
          row.equipment_mana,
          "equipment_mana"
        ),
        maximumEnergy: parseNumericValue(
          row.equipment_energy,
          "equipment_energy"
        ),
        goldBonusPercent: parseNumericValue(
          row.equipment_gold_percent,
          "equipment_gold_percent"
        ),
        experienceBonusPercent: parseNumericValue(
          row.equipment_experience_percent,
          "equipment_experience_percent"
        ),
      },
    };
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
# SOURCE: src/modules/monsters/domain/monster.errors.ts
# ============================================================

```text
import { ApplicationError } from "../../../application/errors/application-error.js";

export const MONSTER_ERROR_CODE = {
  notFound: "MONSTER_NOT_FOUND",
} as const;

export type MonsterErrorCode =
  (typeof MONSTER_ERROR_CODE)[keyof typeof MONSTER_ERROR_CODE];

export class MonsterNotFoundError extends ApplicationError {
  public constructor() {
    super({
      code: MONSTER_ERROR_CODE.notFound,
      message: "Monster was not found.",
      statusCode: 404,
    });

    this.name = "MonsterNotFoundError";
  }
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
# SOURCE: src/modules/monsters/infrastructure/postgres-monster.mapper.ts
# ============================================================

```text
import type {
  MonsterDiscoveryDetailsRecord,
  MonsterDiscoveryRecord,
} from "../application/monster-discovery.repository.js";
import {
  MONSTER_TYPE,
  TASK_STATUS,
  type MonsterType,
  type TaskStatus,
} from "../domain/monster.types.js";

export type PostgreSqlMonsterRow = {
  monster_id: string;
  monster_family_id: string;

  code: string;
  name: string;
  description: string;
  artwork: string | null;

  monster_type: string;
  level: number;
  energy_cost: number;
  cooldown_seconds: number;

  character_level: number;
  bestiary_visible: boolean;
  cooldown_available_at: Date | null;

  task_status: string | null;

  daily_boss_available: boolean;
  daily_attempts_used: number;
  daily_attempts_per_day: number | null;
};

export type PostgreSqlMonsterListRow =
  PostgreSqlMonsterRow;

export type PostgreSqlMonsterDetailsRow =
  PostgreSqlMonsterRow;

export function mapMonsterType(
  value: string
): MonsterType {
  switch (value) {
    case MONSTER_TYPE.normal:
      return MONSTER_TYPE.normal;

    case MONSTER_TYPE.miniBoss:
      return MONSTER_TYPE.miniBoss;

    case MONSTER_TYPE.taskBoss:
      return MONSTER_TYPE.taskBoss;

    case MONSTER_TYPE.dailyBoss:
      return MONSTER_TYPE.dailyBoss;

    default:
      throw new Error(
        `Unsupported monster type: ${value}`
      );
  }
}

function mapTaskStatus(
  value: string | null
): TaskStatus | null {
  switch (value) {
    case null:
      return null;

    case TASK_STATUS.active:
      return TASK_STATUS.active;

    case TASK_STATUS.unlocked:
      return TASK_STATUS.unlocked;

    case TASK_STATUS.waitingForReunlock:
      return TASK_STATUS.waitingForReunlock;

    default:
      throw new Error(
        `Unsupported task status: ${value}`
      );
  }
}

function assertNonNegativeInteger(
  value: number,
  fieldName: string
): number {
  if (
    !Number.isSafeInteger(value) ||
    value < 0
  ) {
    throw new Error(
      `${fieldName} must contain a non-negative safe integer.`
    );
  }

  return value;
}

function mapNullableDate(
  value: Date | null,
  fieldName: string
): Date | null {
  if (value === null) {
    return null;
  }

  if (
    !(value instanceof Date) ||
    Number.isNaN(value.getTime())
  ) {
    throw new Error(
      `${fieldName} must contain a valid date or null.`
    );
  }

  return value;
}

export function mapMonsterListRow(
  row: PostgreSqlMonsterListRow
): MonsterDiscoveryRecord {
  return {
    code: row.code,
    name: row.name,

    level: assertNonNegativeInteger(
      row.level,
      "level"
    ),

    monsterType: mapMonsterType(
      row.monster_type
    ),

    energyCost: assertNonNegativeInteger(
      row.energy_cost,
      "energy_cost"
    ),

    characterLevel: assertNonNegativeInteger(
      row.character_level,
      "character_level"
    ),

    bestiaryVisible:
      row.bestiary_visible,

    cooldownAvailableAt: mapNullableDate(
      row.cooldown_available_at,
      "cooldown_available_at"
    ),

    taskStatus: mapTaskStatus(
      row.task_status
    ),

    dailyBossAvailable:
      row.daily_boss_available,

    dailyAttemptsUsed:
      assertNonNegativeInteger(
        row.daily_attempts_used,
        "daily_attempts_used"
      ),

    dailyAttemptsPerDay:
      row.daily_attempts_per_day === null
        ? undefined
        : assertNonNegativeInteger(
            row.daily_attempts_per_day,
            "daily_attempts_per_day"
          ),
  };
}

export function mapMonsterDetailsRow(
  row: PostgreSqlMonsterDetailsRow
): MonsterDiscoveryDetailsRecord {
  return {
    ...mapMonsterListRow(row),
    description: row.description,
  };
}

```

# ============================================================
# SOURCE: src/modules/monsters/infrastructure/postgres-monster-discovery.repository.ts
# ============================================================

```text
import type {
  QueryResult,
  QueryResultRow,
} from "pg";

import type {
  FindMonsterRecordInput,
  ListMonsterRecordsInput,
  MonsterDiscoveryDetailsRecord,
  MonsterDiscoveryRecord,
  MonsterDiscoveryRepository,
} from "../application/monster-discovery.repository.js";
import {
  CharacterNotFoundError,
} from "../../characters/domain/character.errors.js";
import {
  mapMonsterDetailsRow,
  mapMonsterListRow,
  type PostgreSqlMonsterDetailsRow,
  type PostgreSqlMonsterListRow,
} from "./postgres-monster.mapper.js";

type CharacterLevelRow = {
  level: number;
};

type ActiveRotationRow = {
  daily_boss_rotation_id: string;
};

const MONSTER_COLUMNS = `
  m.monster_id,
  m.monster_family_id,
  m.code,
  m.name,
  m.description,
  m.artwork,
  m.monster_type,
  m.level,
  m.energy_cost,
  m.cooldown_seconds,

  $2::integer AS character_level,

  (
    be.bestiary_entry_id IS NOT NULL
  ) AS bestiary_visible,

  cc.available_at AS cooldown_available_at,

  task_statistics.task_status,

  (
    active_rotation.daily_boss_rotation_id
      IS NOT NULL
    AND daily_definition.daily_boss_definition_id
      IN (
        active_rotation.tier_1_boss_id,
        active_rotation.tier_2_boss_id,
        active_rotation.tier_3_boss_id
      )
  ) AS daily_boss_available,

  COALESCE(
    daily_progress.attempts_used_in_rotation,
    0
  ) AS daily_attempts_used,

  daily_definition.attempts_per_day
    AS daily_attempts_per_day
`;

const MONSTER_JOINS = `
  LEFT JOIN bestiary_entries AS be
    ON be.character_id = $1
    AND be.monster_id = m.monster_id

  LEFT JOIN character_cooldowns AS cc
    ON cc.character_id = $1
    AND cc.target_id = m.monster_id
    AND cc.cooldown_type = 'Monster'

  LEFT JOIN bosses AS task_boss
    ON task_boss.monster_id = m.monster_id

  LEFT JOIN monster_tasks AS task_definition
    ON task_definition.boss_id =
      task_boss.boss_id

  LEFT JOIN bestiary_statistics
    AS task_statistics
    ON task_statistics.character_id = $1
    AND task_statistics.monster_id =
      task_definition.monster_id

  LEFT JOIN bosses AS daily_boss
    ON daily_boss.monster_id = m.monster_id

  LEFT JOIN daily_boss_definitions
    AS daily_definition
    ON daily_definition.boss_id =
      daily_boss.boss_id

  LEFT JOIN daily_boss_rotation
    AS active_rotation
    ON active_rotation.daily_boss_rotation_id =
      $3::uuid

  LEFT JOIN character_daily_boss_progress
    AS daily_progress
    ON daily_progress.character_id = $1
    AND daily_progress.daily_boss_definition_id =
      daily_definition.daily_boss_definition_id
    AND daily_progress.daily_boss_rotation_id =
      active_rotation.daily_boss_rotation_id
`;

type Queryable = {
  query<Row extends QueryResultRow>(
    queryText: string,
    values?: unknown[]
  ): Promise<QueryResult<Row>>;
};

export class PostgresMonsterDiscoveryRepository
  implements MonsterDiscoveryRepository
{
  public constructor(
    private readonly pool: Queryable
  ) {}

  public async listMonsters(
    input: ListMonsterRecordsInput
  ): Promise<readonly MonsterDiscoveryRecord[]> {
    const characterLevel =
      await this.getOwnedCharacterLevel(
        input.accountId,
        input.characterId
      );

    const activeRotationId =
      await this.findActiveRotationId(
        input.observedAt
      );

    const result =
      await this.pool.query<PostgreSqlMonsterListRow>(
        `
          SELECT
            ${MONSTER_COLUMNS}
          FROM monsters AS m
          ${MONSTER_JOINS}
          ORDER BY
            m.level ASC,
            m.name ASC,
            m.monster_id ASC
        `,
        [
          input.characterId,
          characterLevel,
          activeRotationId,
        ]
      );

    return result.rows.map(
      mapMonsterListRow
    );
  }

  public async findMonster(
    input: FindMonsterRecordInput
  ): Promise<MonsterDiscoveryDetailsRecord | null> {
    const characterLevel =
      await this.getOwnedCharacterLevel(
        input.accountId,
        input.characterId
      );

    const activeRotationId =
      await this.findActiveRotationId(
        input.observedAt
      );

    const result =
      await this.pool.query<PostgreSqlMonsterDetailsRow>(
        `
          SELECT
            ${MONSTER_COLUMNS}
          FROM monsters AS m
          ${MONSTER_JOINS}
          WHERE m.code = $4
        `,
        [
          input.characterId,
          characterLevel,
          activeRotationId,
          input.monsterCode,
        ]
      );

    const row = result.rows[0];

    return row
      ? mapMonsterDetailsRow(row)
      : null;
  }

  private async getOwnedCharacterLevel(
    accountId: string,
    characterId: string
  ): Promise<number> {
    const result =
      await this.pool.query<CharacterLevelRow>(
        `
          SELECT level
          FROM characters
          WHERE account_id = $1
            AND character_id = $2
        `,
        [
          accountId,
          characterId,
        ]
      );

    const row = result.rows[0];

    if (!row) {
      throw new CharacterNotFoundError();
    }

    if (
      !Number.isSafeInteger(row.level) ||
      row.level < 1
    ) {
      throw new Error(
        "Character level must be a positive safe integer."
      );
    }

    return row.level;
  }

  private async findActiveRotationId(
    observedAt: Date
  ): Promise<string | null> {
    if (
      !(observedAt instanceof Date) ||
      Number.isNaN(observedAt.getTime())
    ) {
      throw new Error(
        "observedAt must contain a valid date."
      );
    }

    const result =
      await this.pool.query<ActiveRotationRow>(
        `
          SELECT daily_boss_rotation_id
          FROM daily_boss_rotation
          WHERE created_at <= $1
            AND reset_timestamp > $1
          ORDER BY created_at DESC
          LIMIT 2
        `,
        [observedAt]
      );

    if (result.rows.length > 1) {
      throw new Error(
        "Multiple active Daily Boss rotations were found."
      );
    }

    return (
      result.rows[0]
        ?.daily_boss_rotation_id ??
      null
    );
  }
}

```

# ============================================================
# SOURCE: tests/unit/combat/combat-engine.test.ts
# ============================================================

```text
import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  RandomSource,
} from "../../../src/modules/combat/ports/random-source.js";
import {
  COMBAT_DEFEAT_REASON,
  COMBAT_EVENT_TYPE,
  COMBAT_STATUS,
  PLAYER_ACTION_TYPE,
} from "../../../src/modules/combat/domain/combat.constants.js";
import type {
  CombatState,
} from "../../../src/modules/combat/domain/combat.types.js";
import {
  resolveCombatAction,
} from "../../../src/modules/combat/domain/combat-engine.js";

class SequenceRandomSource implements RandomSource {
  public constructor(
    private readonly floats: number[],
    private readonly integers: number[]
  ) {}

  public nextFloat(): number {
    const value = this.floats.shift();

    if (value === undefined) {
      throw new Error(
        "No random float available."
      );
    }

    return value;
  }

  public nextInt(
    minimum: number,
    maximum: number
  ): number {
    void minimum;
    void maximum;

    const value = this.integers.shift();

    if (value === undefined) {
      throw new Error(
        "No random integer available."
      );
    }

    return value;
  }
}

function createCombatState(): CombatState {
  return {
    player: {
      currentHealth: 100,
      maximumHealth: 100,
      attack: 20,
      defense: 10,
    },
    monster: {
      currentHealth: 100,
      maximumHealth: 100,
      attack: 15,
      defense: 5,
    },
    turn: 1,
    status: COMBAT_STATUS.inProgress,
    defeatReason: null,
    effects: [],
  };
}

const basicAttack = {
  type: PLAYER_ACTION_TYPE.basicAttack,
} as const;

describe("Combat engine", () => {
  it("resolves a complete round and advances the turn", () => {
    const state = createCombatState();
    const randomSource =
      new SequenceRandomSource(
        [0, 0],
        [20, 10]
      );

    const result = resolveCombatAction(
      state,
      basicAttack,
      randomSource
    );

    expect(result.state).toMatchObject({
      player: {
        currentHealth: 90,
      },
      monster: {
        currentHealth: 80,
      },
      turn: 2,
      status: COMBAT_STATUS.inProgress,
    });

    expect(result.events).toHaveLength(3);
    expect(result.events[2]).toEqual({
      type: COMBAT_EVENT_TYPE.turnAdvanced,
      turn: 2,
    });
  });

  it("ends combat immediately after the player kills the monster", () => {
    const state = createCombatState();

    state.monster.currentHealth = 10;

    const randomSource =
      new SequenceRandomSource(
        [0],
        [20]
      );

    const result = resolveCombatAction(
      state,
      basicAttack,
      randomSource
    );

    expect(result.state).toMatchObject({
      monster: {
        currentHealth: 0,
      },
      turn: 1,
      status: COMBAT_STATUS.playerVictory,
      defeatReason: null,
    });

    expect(result.events).toHaveLength(2);
    expect(result.events[1]).toEqual({
      type: COMBAT_EVENT_TYPE.combatEnded,
      status: COMBAT_STATUS.playerVictory,
      defeatReason: null,
    });
  });

  it("ends combat when the monster kills the player", () => {
    const state = createCombatState();

    state.player.currentHealth = 5;

    const randomSource =
      new SequenceRandomSource(
        [0.99, 0],
        [10]
      );

    const result = resolveCombatAction(
      state,
      basicAttack,
      randomSource
    );

    expect(result.state).toMatchObject({
      player: {
        currentHealth: 0,
      },
      turn: 1,
      status: COMBAT_STATUS.playerDefeat,
      defeatReason:
        COMBAT_DEFEAT_REASON.playerHealthDepleted,
    });

    expect(result.events).toHaveLength(3);
  });

  it("defeats the player after both survive turn one hundred", () => {
    const state = createCombatState();

    state.turn = 100;

    const randomSource =
      new SequenceRandomSource(
        [0.99, 0.99],
        []
      );

    const result = resolveCombatAction(
      state,
      basicAttack,
      randomSource
    );

    expect(result.state).toMatchObject({
      turn: 100,
      status: COMBAT_STATUS.playerDefeat,
      defeatReason:
        COMBAT_DEFEAT_REASON.turnLimitExceeded,
    });

    expect(result.events).toHaveLength(3);
    expect(result.events[2]).toEqual({
      type: COMBAT_EVENT_TYPE.combatEnded,
      status: COMBAT_STATUS.playerDefeat,
      defeatReason:
        COMBAT_DEFEAT_REASON.turnLimitExceeded,
    });
  });

  it("does not mutate the input state", () => {
    const state = createCombatState();
    const original =
      structuredClone(state);

    const randomSource =
      new SequenceRandomSource(
        [0, 0],
        [20, 10]
      );

    resolveCombatAction(
      state,
      basicAttack,
      randomSource
    );

    expect(state).toEqual(original);
  });
});

```

# ============================================================
# SOURCE: tests/unit/combat/resolve-combat-action.service.test.ts
# ============================================================

```text
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
  CombatTurnMismatchError,
} from "../../../src/modules/combat/application/combat-session.errors.js";
import {
  PERSISTENT_COMBAT_STATUS,
} from "../../../src/modules/combat/application/combat-session.models.js";
import type {
  CombatActionTransaction,
  CombatSessionRepository,
} from "../../../src/modules/combat/application/combat-session.repository.js";
import {
  ResolveCombatActionService,
} from "../../../src/modules/combat/application/resolve-combat-action.service.js";
import {
  COMBAT_DEFEAT_REASON,
  COMBAT_EVENT_TYPE,
  COMBAT_STATUS,
  PLAYER_ACTION_TYPE,
} from "../../../src/modules/combat/domain/combat.constants.js";
import type {
  CombatState,
} from "../../../src/modules/combat/domain/combat.types.js";
import type {
  RandomSource,
} from "../../../src/modules/combat/ports/random-source.js";

const observedAt = new Date(
  "2026-10-07T20:00:00.000Z"
);

function createState(
  overrides: Partial<CombatState> = {}
): CombatState {
  return {
    player: {
      currentHealth: 100,
      maximumHealth: 100,
      attack: 20,
      defense: 10,
    },
    monster: {
      currentHealth: 100,
      maximumHealth: 100,
      attack: 15,
      defense: 5,
    },
    turn: 1,
    status: COMBAT_STATUS.inProgress,
    defeatReason: null,
    effects: [],
    ...overrides,
  };
}

function createFixture(
  state = createState(),
  randomSource: RandomSource = {
    nextFloat: vi.fn(() => 0),
    nextInt: vi.fn((
      minimum: number
    ) => minimum),
  }
) {
  const persistAction = vi.fn<
    CombatActionTransaction["persistAction"]
  >(async () => []);

  const transaction:
  CombatActionTransaction = {
    locked: {
      session: {
        combatSessionId: "session-1",
        characterId: "character-1",
        monsterId: "monster-1",
        monsterCode: "dev_rat",
        status:
          PERSISTENT_COMBAT_STATUS.active,
        defeatReason: null,
        currentTurn: state.turn,
        player: {
          ...state.player,
        },
        monster: {
          ...state.monster,
        },
        startedAt:
          new Date(
            "2026-10-07T19:59:00.000Z"
          ),
        endedAt: null,
      },
      combatState: state,
    },
    persistAction,
  };

  const withActionTransaction =
    vi.fn(async (
      _input,
      operation
    ) => operation(transaction));

  const repository:
  CombatSessionRepository = {
    withStartTransaction:
      vi.fn(async () => {
        throw new Error(
          "Start transaction is not used by action tests."
        );
      }),
    withActionTransaction,
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
    new ResolveCombatActionService(
      repository,
      randomSource,
      clock
    );

  return {
    service,
    clock,
    randomSource,
    persistAction,
    withActionTransaction,
  };
}

const actionInput = {
  accountId: "account-1",
  characterId: "character-1",
  expectedTurn: 1,
  action: {
    type: PLAYER_ACTION_TYPE.basicAttack,
  },
} as const;

describe(
  "ResolveCombatActionService",
  () => {
    it("resolves and persists one continuing round", async () => {
      const fixture = createFixture();

      const result =
        await fixture.service.execute(
          actionInput
        );

      expect(
        fixture.clock.now
      ).toHaveBeenCalledOnce();

      expect(
        fixture.withActionTransaction
      ).toHaveBeenCalledWith(
        {
          accountId: "account-1",
          characterId: "character-1",
          observedAt,
        },
        expect.any(Function)
      );

      expect(
        fixture.persistAction
      ).toHaveBeenCalledOnce();

      expect(
        fixture.persistAction
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          resolvedTurn: 1,
          observedAt,
        })
      );

      expect(result).toMatchObject({
        status: "Active",
        currentTurn: 2,
        endedAt: null,
      });

      expect(
        result.events.map(
          (event) => event.type
        )
      ).toEqual([
        COMBAT_EVENT_TYPE.attackResolved,
        COMBAT_EVENT_TYPE.attackResolved,
        COMBAT_EVENT_TYPE.turnAdvanced,
      ]);
    });

    it("rejects a stale expected turn before resolving combat", async () => {
      const fixture = createFixture();

      await expect(
        fixture.service.execute({
          ...actionInput,
          expectedTurn: 2,
        })
      ).rejects.toBeInstanceOf(
        CombatTurnMismatchError
      );

      expect(
        fixture.randomSource.nextFloat
      ).not.toHaveBeenCalled();

      expect(
        fixture.persistAction
      ).not.toHaveBeenCalled();
    });

    it("returns player victory and current-operation events", async () => {
      const state = createState({
        monster: {
          currentHealth: 5,
          maximumHealth: 100,
          attack: 15,
          defense: 5,
        },
      });

      const fixture = createFixture(
        state,
        {
          nextFloat: vi.fn(() => 0),
          nextInt: vi.fn(() => 20),
        }
      );

      const result =
        await fixture.service.execute(
          actionInput
        );

      expect(result).toMatchObject({
        status: "Victory",
        defeatReason: null,
        currentTurn: 1,
        endedAt: observedAt,
        monster: {
          currentHealth: 0,
        },
      });

      expect(
        result.events.at(-1)
      ).toEqual({
        type:
          COMBAT_EVENT_TYPE.combatEnded,
        status:
          COMBAT_STATUS.playerVictory,
        defeatReason: null,
      });
    });

    it("returns defeat through depleted player Health", async () => {
      const state = createState({
        player: {
          currentHealth: 5,
          maximumHealth: 100,
          attack: 20,
          defense: 10,
        },
      });

      const fixture = createFixture(
        state,
        {
          nextFloat: vi
            .fn()
            .mockReturnValueOnce(0.99)
            .mockReturnValueOnce(0),
          nextInt: vi.fn(() => 10),
        }
      );

      const result =
        await fixture.service.execute(
          actionInput
        );

      expect(result).toMatchObject({
        status: "Defeat",
        defeatReason:
          COMBAT_DEFEAT_REASON
            .playerHealthDepleted,
        currentTurn: 1,
        endedAt: observedAt,
        player: {
          currentHealth: 0,
        },
      });
    });

    it("returns defeat through the turn limit", async () => {
      const state = createState({
        turn: 100,
      });

      const fixture = createFixture(
        state,
        {
          nextFloat: vi.fn(() => 0.99),
          nextInt: vi.fn(),
        }
      );

      const result =
        await fixture.service.execute({
          ...actionInput,
          expectedTurn: 100,
        });

      expect(result).toMatchObject({
        status: "Defeat",
        defeatReason:
          COMBAT_DEFEAT_REASON
            .turnLimitExceeded,
        currentTurn: 100,
        endedAt: observedAt,
      });
    });

    it("preserves event order passed to persistence", async () => {
      const fixture = createFixture();

      await fixture.service.execute(
        actionInput
      );

      const persistedInput =
        fixture.persistAction
          .mock.calls[0]?.[0];

      expect(
        persistedInput?.events.map(
          (event) => event.type
        )
      ).toEqual([
        COMBAT_EVENT_TYPE.attackResolved,
        COMBAT_EVENT_TYPE.attackResolved,
        COMBAT_EVENT_TYPE.turnAdvanced,
      ]);
    });

    it("propagates persistence failure for transaction rollback", async () => {
      const fixture = createFixture();
      const failure =
        new Error(
          "Event persistence failed."
        );

      fixture.persistAction
        .mockRejectedValueOnce(failure);

      await expect(
        fixture.service.execute(
          actionInput
        )
      ).rejects.toBe(failure);
    });
  }
);

```

# ============================================================
# SOURCE: tests/unit/combat/start-combat.service.test.ts
# ============================================================

```text
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
    startedAt: observedAt,
    endedAt: null,
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

```

# ============================================================
# SOURCE: tests/unit/combat/postgres-combat-session.repository.test.ts
# ============================================================

```text
import type {
  Pool,
  PoolClient,
  QueryResult,
  QueryResultRow,
} from "pg";
import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  CombatAlreadyActiveError,
} from "../../../src/modules/combat/application/combat-session.errors.js";
import {
  PostgresCombatSessionRepository,
} from "../../../src/modules/combat/infrastructure/postgres-combat-session.repository.js";

type QueryResponse = {
  rows: QueryResultRow[];
  rowCount: number;
};

function createQueryResult(
  rows: QueryResultRow[] = [],
  rowCount = rows.length
): QueryResponse {
  return {
    rows,
    rowCount,
  };
}

function createLockedCharacterRow() {
  return {
    character_id: "character-1",
    account_id: "account-1",
    level: 10,
    current_health: "180",
    max_health: "180",
    current_mana: "35",
    max_mana: "35",
    current_energy: "100",
    max_energy: "100",
    resources_updated_at:
      new Date("2026-10-07T20:00:00.000Z"),
  };
}

function createRepositoryFixture(
  activeCombat = false
) {
  const release = vi.fn();

  const query = vi.fn(
    async (
      queryText: string
    ): Promise<QueryResponse> => {
      const normalized = queryText.trim();

      if (
        normalized === "BEGIN" ||
        normalized === "COMMIT" ||
        normalized === "ROLLBACK"
      ) {
        return createQueryResult();
      }

      if (
        normalized.includes("FROM characters") &&
        normalized.includes("FOR UPDATE")
      ) {
        return createQueryResult([
          createLockedCharacterRow(),
        ]);
      }

      if (
        normalized.includes("FROM combat_sessions") &&
        normalized.includes("status = 'Active'")
      ) {
        return activeCombat
          ? createQueryResult([
              {
                combat_session_id: "session-1",
              },
            ])
          : createQueryResult();
      }

      throw new Error(
        `Unexpected query in test: ${normalized}`
      );
    }
  );

  const client = {
    query: query as unknown as PoolClient["query"],
    release,
  } as unknown as PoolClient;

  const connect =
    vi.fn().mockResolvedValue(client);

  const pool = {
    connect,
  } as unknown as Pool;

  return {
    repository:
      new PostgresCombatSessionRepository(pool),
    query,
    release,
    connect,
  };
}

const transactionInput = {
  accountId: "account-1",
  characterId: "character-1",
  observedAt:
    new Date("2026-10-07T21:00:00.000Z"),
};

describe(
  "PostgresCombatSessionRepository start transaction",
  () => {
    it(
      "locks the owned active character and commits",
      async () => {
        const fixture =
          createRepositoryFixture();

        const operation = vi.fn(
          async (transaction) => {
            expect(
              transaction.character
            ).toMatchObject({
              characterId: "character-1",
              accountId: "account-1",
              level: 10,
            });

            return "completed";
          }
        );

        const result =
          await fixture.repository.withStartTransaction(
            transactionInput,
            operation
          );

        expect(result).toBe("completed");
        expect(operation).toHaveBeenCalledOnce();

        const lockCall =
          fixture.query.mock.calls.find(
            ([queryText]) =>
              String(queryText).includes(
                "FROM characters"
              )
          );

        expect(lockCall).toBeDefined();
        expect(String(lockCall?.[0])).toContain(
          "FOR UPDATE"
        );
        expect(
          (
            lockCall as unknown as
              | [string, unknown[]]
              | undefined
          )?.[1]
        ).toEqual([
          "account-1",
          "character-1",
        ]);

        expect(fixture.query).toHaveBeenCalledWith(
          "BEGIN"
        );
        expect(fixture.query).toHaveBeenCalledWith(
          "COMMIT"
        );
        expect(
          fixture.query
        ).not.toHaveBeenCalledWith("ROLLBACK");
        expect(fixture.release).toHaveBeenCalledOnce();
      }
    );

    it(
      "rejects an existing active combat before operation",
      async () => {
        const fixture =
          createRepositoryFixture(true);

        const operation = vi.fn();

        await expect(
          fixture.repository.withStartTransaction(
            transactionInput,
            operation
          )
        ).rejects.toBeInstanceOf(
          CombatAlreadyActiveError
        );

        expect(operation).not.toHaveBeenCalled();
        expect(fixture.query).toHaveBeenCalledWith(
          "ROLLBACK"
        );
        expect(
          fixture.query
        ).not.toHaveBeenCalledWith("COMMIT");
        expect(fixture.release).toHaveBeenCalledOnce();
      }
    );

    it(
      "rolls back when the transaction operation fails",
      async () => {
        const fixture =
          createRepositoryFixture();

        const failure =
          new Error("Forced operation failure");

        await expect(
          fixture.repository.withStartTransaction(
            transactionInput,
            async () => {
              throw failure;
            }
          )
        ).rejects.toBe(failure);

        expect(fixture.query).toHaveBeenCalledWith(
          "ROLLBACK"
        );
        expect(
          fixture.query
        ).not.toHaveBeenCalledWith("COMMIT");
        expect(fixture.release).toHaveBeenCalledOnce();
      }
    );

    it("rejects an invalid observedAt value", async () => {
      const fixture =
        createRepositoryFixture();

      await expect(
        fixture.repository.withStartTransaction(
          {
            ...transactionInput,
            observedAt: new Date("invalid"),
          },
          async () => undefined
        )
      ).rejects.toThrow(
        "observedAt must contain a valid date."
      );

      expect(fixture.connect).not.toHaveBeenCalled();
    });
  }
);

```

# ============================================================
# SOURCE: tests/unit/combat/postgres-combat.mapper.test.ts
# ============================================================

```text
import {
  describe,
  expect,
  it,
} from "vitest";

import {
  PERSISTENT_COMBAT_STATUS,
} from "../../../src/modules/combat/application/combat-session.models.js";
import {
  InvalidPersistentCombatStateError,
} from "../../../src/modules/combat/application/combat-session.errors.js";
import {
  COMBAT_DEFEAT_REASON,
  COMBAT_STATUS,
} from "../../../src/modules/combat/domain/combat.constants.js";
import {
  mapPostgreSqlCombatSessionRow,
} from "../../../src/modules/combat/infrastructure/postgres-combat.mapper.js";
import type {
  PostgreSqlCombatSessionRow,
} from "../../../src/modules/combat/infrastructure/postgres-combat.mapper.js";

function createRow():
PostgreSqlCombatSessionRow {
  return {
    combat_session_id:
      "11111111-1111-4111-8111-111111111111",
    character_id:
      "22222222-2222-4222-8222-222222222222",
    monster_id:
      "33333333-3333-4333-8333-333333333333",
    monster_code: "dev_rat",
    status: "Active",
    current_turn: 1,
    character_health: "100",
    character_maximum_health: "100",
    character_attack: "20",
    character_defense: "10",
    monster_health: "80",
    monster_maximum_health: "80",
    monster_attack: "15",
    monster_defense: "8",
    defeat_reason: null,
    started_at:
      new Date("2026-01-01T00:00:00.000Z"),
    ended_at: null,
  };
}

describe("PostgreSQL combat mapper", () => {
  it("maps an active PostgreSQL row to a session and M4 state", () => {
    const result =
      mapPostgreSqlCombatSessionRow(
        createRow()
      );

    expect(result.session).toMatchObject({
      monsterCode: "dev_rat",
      status:
        PERSISTENT_COMBAT_STATUS.active,
      currentTurn: 1,
      player: {
        currentHealth: 100,
        maximumHealth: 100,
        attack: 20,
        defense: 10,
      },
      monster: {
        currentHealth: 80,
        maximumHealth: 80,
        attack: 15,
        defense: 8,
      },
    });

    expect(result.combatState).toEqual({
      player: {
        currentHealth: 100,
        maximumHealth: 100,
        attack: 20,
        defense: 10,
      },
      monster: {
        currentHealth: 80,
        maximumHealth: 80,
        attack: 15,
        defense: 8,
      },
      turn: 1,
      status: COMBAT_STATUS.inProgress,
      defeatReason: null,
      effects: [],
    });
  });

  it("maps a valid player victory", () => {
    const row = createRow();

    row.status = "Victory";
    row.monster_health = "0";
    row.ended_at =
      new Date("2026-01-01T00:01:00.000Z");

    const result =
      mapPostgreSqlCombatSessionRow(row);

    expect(result.combatState.status).toBe(
      COMBAT_STATUS.playerVictory
    );
    expect(
      result.combatState.defeatReason
    ).toBeNull();
  });

  it("maps a valid player defeat", () => {
    const row = createRow();

    row.status = "Defeat";
    row.character_health = "0";
    row.defeat_reason =
      "PlayerHealthDepleted";
    row.ended_at =
      new Date("2026-01-01T00:01:00.000Z");

    const result =
      mapPostgreSqlCombatSessionRow(row);

    expect(result.combatState.status).toBe(
      COMBAT_STATUS.playerDefeat
    );
    expect(
      result.combatState.defeatReason
    ).toBe(
      COMBAT_DEFEAT_REASON.playerHealthDepleted
    );
  });

  it("rejects an abandoned session because M4 has no abandoned state", () => {
    const row = createRow();

    row.status = "Abandoned";
    row.ended_at =
      new Date("2026-01-01T00:01:00.000Z");

    expect(() =>
      mapPostgreSqlCombatSessionRow(row)
    ).toThrow(
      InvalidPersistentCombatStateError
    );
  });

  it("rejects unsupported statuses and defeat reasons", () => {
    const statusRow = createRow();
    statusRow.status = "Unknown";

    expect(() =>
      mapPostgreSqlCombatSessionRow(
        statusRow
      )
    ).toThrow(
      InvalidPersistentCombatStateError
    );

    const reasonRow = createRow();
    reasonRow.defeat_reason = "Unknown";

    expect(() =>
      mapPostgreSqlCombatSessionRow(
        reasonRow
      )
    ).toThrow(
      InvalidPersistentCombatStateError
    );
  });

  it("rejects invalid identifiers, dates, and integers", () => {
    const identifierRow = createRow();
    identifierRow.character_id =
      "not-a-uuid";

    expect(() =>
      mapPostgreSqlCombatSessionRow(
        identifierRow
      )
    ).toThrow(
      InvalidPersistentCombatStateError
    );

    const dateRow = createRow();
    dateRow.started_at =
      new Date("invalid");

    expect(() =>
      mapPostgreSqlCombatSessionRow(
        dateRow
      )
    ).toThrow(
      InvalidPersistentCombatStateError
    );

    const integerRow = createRow();
    integerRow.current_turn = 101;

    expect(() =>
      mapPostgreSqlCombatSessionRow(
        integerRow
      )
    ).toThrow(
      InvalidPersistentCombatStateError
    );
  });

  it("rejects state that violates M4 validation", () => {
    const row = createRow();

    row.character_health = "101";
    row.character_maximum_health = "100";

    expect(() =>
      mapPostgreSqlCombatSessionRow(row)
    ).toThrow(
      InvalidPersistentCombatStateError
    );
  });
});

```

# ============================================================
# SOURCE: tests/unit/characters/effective-character-statistics.test.ts
# ============================================================

```text
import { describe, expect, it } from "vitest";

import {
  calculateEffectiveCharacterStatistics,
  calculateLevelMaximumEnergy,
} from "../../../src/modules/characters/domain/effective-character-statistics.js";

describe("calculateEffectiveCharacterStatistics", () => {
  it("returns base statistics for a level 1 character", () => {
    const result = calculateEffectiveCharacterStatistics({
      level: 1,
      spellMasteryPower: 100,
    });

    expect(result).toEqual({
      attack: 7,
      defense: 7,
      spellPower: 100,
      maximumHealth: 180,
      maximumMana: 35,
      maximumEnergy: 100,
      goldBonusPercent: 0,
      experienceBonusPercent: 0,
    });
  });

  it("applies Health and Mana progression from level 2", () => {
    const result = calculateEffectiveCharacterStatistics({
      level: 2,
      spellMasteryPower: 100,
    });

    expect(result.maximumHealth).toBe(210);
    expect(result.maximumMana).toBe(50);
  });

  it.each([
    [1, 100],
    [19, 100],
    [20, 110],
    [30, 115],
    [40, 120],
    [100, 150],
    [150, 175],
    [200, 200],
    [201, 200],
  ])(
    "returns Maximum Energy %i for level %i",
    (level, expectedEnergy) => {
      expect(calculateLevelMaximumEnergy(level)).toBe(
        expectedEnergy
      );
    }
  );

  it("adds equipment, achievement and combat modifiers", () => {
    const result = calculateEffectiveCharacterStatistics({
      level: 1,
      spellMasteryPower: 110,
      equipment: {
        attack: 20,
        defense: 10,
        spellPower: 15,
        maximumHealth: 100,
        maximumMana: 20,
        maximumEnergy: 5,
      },
      achievements: {
        attack: 2,
        defense: 3,
      },
      combat: {
        attack: -5,
        defense: 10,
        spellPower: -20,
      },
    });

    expect(result.attack).toBe(24);
    expect(result.defense).toBe(30);
    expect(result.spellPower).toBe(105);
    expect(result.maximumHealth).toBe(280);
    expect(result.maximumMana).toBe(55);
    expect(result.maximumEnergy).toBe(105);
  });

  it("does not allow combat statistics below 0", () => {
    const result = calculateEffectiveCharacterStatistics({
      level: 1,
      spellMasteryPower: 100,
      combat: {
        attack: -100,
        defense: -100,
        spellPower: -100,
      },
    });

    expect(result.attack).toBe(0);
    expect(result.defense).toBe(0);
    expect(result.spellPower).toBe(0);
  });

  it("adds Gold and Experience percentage points", () => {
    const result = calculateEffectiveCharacterStatistics({
      level: 1,
      spellMasteryPower: 100,
      equipment: {
        goldBonusPercent: 20,
        experienceBonusPercent: 10,
      },
      achievements: {
        goldBonusPercent: 5,
        experienceBonusPercent: 3,
      },
      progressionBoosts: {
        goldBonusPercent: 15,
        experienceBonusPercent: 25,
      },
    });

    expect(result.goldBonusPercent).toBe(40);
    expect(result.experienceBonusPercent).toBe(38);
  });

  it("rejects an invalid character level", () => {
    expect(() =>
      calculateEffectiveCharacterStatistics({
        level: 0,
        spellMasteryPower: 100,
      })
    ).toThrow(
      "Character level must be a positive safe integer."
    );
  });

  it("rejects negative Spell Mastery Power", () => {
    expect(() =>
      calculateEffectiveCharacterStatistics({
        level: 1,
        spellMasteryPower: -1,
      })
    ).toThrow("Spell Mastery Power must be non-negative.");
  });

  it("returns identical results for repeated calculations", () => {
    const input = {
      level: 50,
      spellMasteryPower: 125,
      equipment: {
        attack: 12.75,
        defense: 8.25,
        spellPower: 15.5,
        maximumHealth: 100,
        maximumMana: 40,
        maximumEnergy: 20,
        goldBonusPercent: 5.5,
        experienceBonusPercent: 7.25,
      },
      achievements: {
        attack: 3,
        defense: 2,
        goldBonusPercent: 1.5,
        experienceBonusPercent: 2.5,
      },
      progressionBoosts: {
        goldBonusPercent: 10,
        experienceBonusPercent: 20,
      },
      combat: {
        attack: -4,
        defense: 6,
        spellPower: -10,
      },
    };

    const first =
      calculateEffectiveCharacterStatistics(input);

    const second =
      calculateEffectiveCharacterStatistics(input);

    expect(second).toEqual(first);
    expect(input).toEqual({
      level: 50,
      spellMasteryPower: 125,
      equipment: {
        attack: 12.75,
        defense: 8.25,
        spellPower: 15.5,
        maximumHealth: 100,
        maximumMana: 40,
        maximumEnergy: 20,
        goldBonusPercent: 5.5,
        experienceBonusPercent: 7.25,
      },
      achievements: {
        attack: 3,
        defense: 2,
        goldBonusPercent: 1.5,
        experienceBonusPercent: 2.5,
      },
      progressionBoosts: {
        goldBonusPercent: 10,
        experienceBonusPercent: 20,
      },
      combat: {
        attack: -4,
        defense: 6,
        spellPower: -10,
      },
    });
  });});


```

# ============================================================
# SOURCE: tests/unit/monsters/monster-cooldown.test.ts
# ============================================================

```text
import {
  describe,
  expect,
  it,
} from "vitest";

import {
  calculateMonsterCooldown,
} from "../../../src/modules/monsters/domain/monster-cooldown.js";

describe("monster cooldown", () => {
  const now = new Date(
    "2026-10-07T10:00:00.000Z"
  );

  it("returns inactive when cooldown does not exist", () => {
    expect(
      calculateMonsterCooldown(null, now)
    ).toEqual({
      isActive: false,
      availableAt: null,
    });
  });

  it("returns active for a future timestamp", () => {
    const availableAt = new Date(
      "2026-10-07T11:00:00.000Z"
    );

    expect(
      calculateMonsterCooldown(
        availableAt,
        now
      )
    ).toEqual({
      isActive: true,
      availableAt,
    });
  });

  it("returns inactive for an expired timestamp", () => {
    const availableAt = new Date(
      "2026-10-07T09:00:00.000Z"
    );

    expect(
      calculateMonsterCooldown(
        availableAt,
        now
      )
    ).toEqual({
      isActive: false,
      availableAt,
    });
  });

  it("returns inactive when timestamp equals current time", () => {
    expect(
      calculateMonsterCooldown(now, now)
    ).toEqual({
      isActive: false,
      availableAt: now,
    });
  });

  it("rejects an invalid current time", () => {
    expect(() =>
      calculateMonsterCooldown(
        null,
        new Date("invalid")
      )
    ).toThrow(
      "now must contain a valid date."
    );
  });

  it("rejects an invalid cooldown timestamp", () => {
    expect(() =>
      calculateMonsterCooldown(
        new Date("invalid"),
        now
      )
    ).toThrow(
      "availableAt must contain a valid date."
    );
  });
});

```

# ============================================================
# SOURCE: tests/unit/monsters/task-boss-discovery.service.test.ts
# ============================================================

```text
import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  Clock,
} from "../../../src/application/ports/clock.js";
import { GetMonsterDetailsService } from "../../../src/modules/monsters/application/get-monster-details.service.js";
import { GetMonsterListService } from "../../../src/modules/monsters/application/get-monster-list.service.js";
import type {
  FindMonsterInput,
  ListMonstersInput,
  MonsterDiscoveryDetailsRecord,
  MonsterDiscoveryRecord,
  MonsterDiscoveryRepository,
} from "../../../src/modules/monsters/application/monster-discovery.repository.js";

class FakeMonsterDiscoveryRepository
  implements MonsterDiscoveryRepository
{
  public constructor(
    private readonly record:
      MonsterDiscoveryDetailsRecord
  ) {}

  public async listMonsters(
    input: ListMonstersInput
  ): Promise<readonly MonsterDiscoveryRecord[]> {
    void input;

    return [this.record];
  }

  public async findMonster(
    input: FindMonsterInput
  ): Promise<MonsterDiscoveryDetailsRecord | null> {
    void input;

    return this.record;
  }
}

function createClock(): Clock {
  return {
    now: () =>
      new Date(
        "2026-10-07T10:00:00.000Z"
      ),
  };
}

function createTaskBossRecord(
  taskStatus:
    | "ACTIVE"
    | "UNLOCKED"
    | "WAITING_FOR_REUNLOCK"
): MonsterDiscoveryDetailsRecord {
  return {
    code: "rat_king",
    name: "Rat King",
    description:
      "Boss unlocked by defeating rats.",
    level: 10,
    monsterType: "TaskBoss",
    energyCost: 15,

    characterLevel: 10,
    bestiaryVisible: false,
    cooldownAvailableAt: null,

    taskStatus,
  };
}

const listInput: ListMonstersInput = {
  accountId: "account-1",
  characterId: "character-1",
};

const detailsInput: FindMonsterInput = {
  ...listInput,
  monsterCode: "rat_king",
};

describe(
  "Task Boss discovery services",
  () => {
    it("reports incomplete progress for ACTIVE status", async () => {
      const repository =
        new FakeMonsterDiscoveryRepository(
          createTaskBossRecord("ACTIVE")
        );

      const service =
        new GetMonsterListService(
          repository,
          createClock()
        );

      const result =
        await service.execute(listInput);

      expect(result[0]).toMatchObject({
        code: "rat_king",
        eligibility: {
          isEligible: false,
          reasons: [
            "TASK_PROGRESS_INCOMPLETE",
          ],
        },
      });
    });

    it("allows an UNLOCKED Task Boss", async () => {
      const repository =
        new FakeMonsterDiscoveryRepository(
          createTaskBossRecord("UNLOCKED")
        );

      const listService =
        new GetMonsterListService(
          repository,
          createClock()
        );

      const detailsService =
        new GetMonsterDetailsService(
          repository,
          createClock()
        );

      const listResult =
        await listService.execute(listInput);

      const detailsResult =
        await detailsService.execute(
          detailsInput
        );

      expect(listResult[0]).toMatchObject({
        eligibility: {
          isEligible: true,
          reasons: [],
        },
      });

      expect(detailsResult).toMatchObject({
        code: "rat_king",
        eligibility: {
          isEligible: true,
          reasons: [],
        },
      });
    });

    it("requires re-unlock after defeating the Task Boss", async () => {
      const repository =
        new FakeMonsterDiscoveryRepository(
          createTaskBossRecord(
            "WAITING_FOR_REUNLOCK"
          )
        );

      const service =
        new GetMonsterDetailsService(
          repository,
          createClock()
        );

      const result =
        await service.execute(
          detailsInput
        );

      expect(result).toMatchObject({
        eligibility: {
          isEligible: false,
          reasons: [
            "TASK_REUNLOCK_REQUIRED",
          ],
        },
      });
    });

    it("ignores cooldown when evaluating Task Boss eligibility", async () => {
      const record = {
        ...createTaskBossRecord("ACTIVE"),
        level: 12,
        characterLevel: 10,
        cooldownAvailableAt: new Date(
          "2026-10-07T11:00:00.000Z"
        ),
      };

      const repository =
        new FakeMonsterDiscoveryRepository(
          record
        );

      const service =
        new GetMonsterDetailsService(
          repository,
          createClock()
        );

      const result =
        await service.execute(
          detailsInput
        );

      expect(result).toMatchObject({
        eligibility: {
          isEligible: false,
          reasons: [
            "LEVEL_TOO_LOW",
            "TASK_PROGRESS_INCOMPLETE",
          ],
        },
        cooldown: {
          isActive: true,
          availableAt:
            record.cooldownAvailableAt,
        },
      });
    });
  }
);


```

# ============================================================
# SOURCE: tests/integration/combat/combat-retrieval.integration.test.ts
# ============================================================

```text
import { randomUUID } from "node:crypto";

import { Pool } from "pg";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import { env } from "../../../src/config/env.js";
import {
  CombatSessionNotFoundError,
} from "../../../src/modules/combat/application/combat-session.errors.js";
import {
  GetActiveCombatService,
} from "../../../src/modules/combat/application/get-active-combat.service.js";
import {
  GetCombatLogService,
} from "../../../src/modules/combat/application/get-combat-log.service.js";
import {
  GetCombatSessionService,
} from "../../../src/modules/combat/application/get-combat-session.service.js";
import {
  PostgresCombatSessionRepository,
} from "../../../src/modules/combat/infrastructure/postgres-combat-session.repository.js";
import {
  PostgresCharacterRepository,
} from "../../../src/modules/characters/infrastructure/postgres-character.repository.js";
import {
  createTestAccount,
  deleteTestAccount,
} from "../../helpers/test-account.js";

const testPool = new Pool({
  host: env.database.host,
  port: env.database.port,
  database: env.database.name,
  user: env.database.user,
  password: env.database.password,
  max: 3,
  idleTimeoutMillis: 5_000,
  connectionTimeoutMillis: 5_000,
});

const repository =
  new PostgresCombatSessionRepository(
    testPool
  );

const activeService =
  new GetActiveCombatService(repository);

const sessionService =
  new GetCombatSessionService(repository);

const logService =
  new GetCombatLogService(repository);

const characterRepository =
  new PostgresCharacterRepository(
    testPool
  );

const createdAccountIds: string[] = [];

type Fixture = {
  accountId: string;
  characterId: string;
  combatSessionId: string;
};

async function createFixture():
Promise<Fixture> {
  const account =
    await createTestAccount(testPool);

  createdAccountIds.push(
    account.accountId
  );

  const character =
    await characterRepository
      .createCharacterGraph({
        accountId: account.accountId,
        seasonId: null,
        name:
          `Retrieval ${randomUUID().slice(0, 8)}`,
        spellLoadoutName:
          "Default Spells",
        equipmentLoadoutName:
          "Default Equipment",
      });

  const monsterResult =
    await testPool.query<{
      monster_id: string;
    }>(
      `
        SELECT monster_id
        FROM monsters
        WHERE monster_type = 'Normal'
        ORDER BY monster_id
        LIMIT 1
      `
    );

  const monster =
    monsterResult.rows[0];

  if (!monster) {
    throw new Error(
      "Combat retrieval tests require one seeded monster."
    );
  }

  const sessionResult =
    await testPool.query<{
      combat_session_id: string;
    }>(
      `
        INSERT INTO combat_sessions (
          character_id,
          monster_id,
          status,
          current_turn,
          character_health,
          character_mana,
          monster_health,
          character_maximum_health,
          character_attack,
          character_defense,
          monster_maximum_health,
          monster_attack,
          monster_defense,
          started_at
        )
        VALUES (
          $1,
          $2,
          'Active',
          2,
          90,
          30,
          70,
          100,
          20,
          10,
          80,
          15,
          8,
          $3
        )
        RETURNING combat_session_id
      `,
      [
        character.characterId,
        monster.monster_id,
        new Date(
          "2026-10-07T20:00:00.000Z"
        ),
      ]
    );

  const session =
    sessionResult.rows[0];

  if (!session) {
    throw new Error(
      "Combat session was not created."
    );
  }

  await testPool.query(
    `
      INSERT INTO combat_session_events (
        combat_session_id,
        turn_number,
        event_order,
        event_type,
        event_data_json,
        created_at
      )
      VALUES
        (
          $1,
          1,
          1,
          'AttackResolved',
          '{"type":"AttackResolved","sequence":2}'::jsonb,
          $2
        ),
        (
          $1,
          1,
          0,
          'AttackResolved',
          '{"type":"AttackResolved","sequence":1}'::jsonb,
          $2
        ),
        (
          $1,
          1,
          2,
          'TurnAdvanced',
          '{"type":"TurnAdvanced","sequence":3}'::jsonb,
          $2
        )
    `,
    [
      session.combat_session_id,
      new Date(
        "2026-10-07T20:01:00.000Z"
      ),
    ]
  );

  return {
    accountId: account.accountId,
    characterId:
      character.characterId,
    combatSessionId:
      session.combat_session_id,
  };
}

describe(
  "Combat retrieval integration",
  () => {
    beforeAll(async () => {
      await testPool.query("SELECT 1");
    });

    afterEach(async () => {
      while (
        createdAccountIds.length > 0
      ) {
        const accountId =
          createdAccountIds.pop();

        if (accountId) {
          await deleteTestAccount(
            testPool,
            accountId
          );
        }
      }
    });

    afterAll(async () => {
      await testPool.end();
    });

    it(
      "returns the active owned session",
      async () => {
        const fixture =
          await createFixture();

        const result =
          await activeService.execute({
            accountId:
              fixture.accountId,
            characterId:
              fixture.characterId,
          });

        expect(result).toMatchObject({
          combatSessionId:
            fixture.combatSessionId,
          characterId:
            fixture.characterId,
          status: "Active",
          currentTurn: 2,
          player: {
            currentHealth: 90,
            maximumHealth: 100,
          },
          monster: {
            currentHealth: 70,
            maximumHealth: 80,
          },
          events: [],
        });
      }
    );

    it(
      "returns a specific owned session",
      async () => {
        const fixture =
          await createFixture();

        const result =
          await sessionService.execute({
            accountId:
              fixture.accountId,
            characterId:
              fixture.characterId,
            combatSessionId:
              fixture.combatSessionId,
          });

        expect(result).toMatchObject({
          combatSessionId:
            fixture.combatSessionId,
          monsterCode:
            expect.any(String),
          status: "Active",
          events: [],
        });
      }
    );

    it(
      "returns events ordered by turn and event order",
      async () => {
        const fixture =
          await createFixture();

        const result =
          await logService.execute({
            accountId:
              fixture.accountId,
            characterId:
              fixture.characterId,
            combatSessionId:
              fixture.combatSessionId,
          });

        expect(
          result.combatSessionId
        ).toBe(
          fixture.combatSessionId
        );

        expect(
          result.events.map(
            (event) => ({
              turnNumber:
                event.turnNumber,
              eventOrder:
                event.eventOrder,
              sequence:
                (
                  event.event as {
                    sequence?: number;
                  }
                ).sequence,
            })
          )
        ).toEqual([
          {
            turnNumber: 1,
            eventOrder: 0,
            sequence: 1,
          },
          {
            turnNumber: 1,
            eventOrder: 1,
            sequence: 2,
          },
          {
            turnNumber: 1,
            eventOrder: 2,
            sequence: 3,
          },
        ]);
      }
    );

    it(
      "does not expose a session through another account",
      async () => {
        const fixture =
          await createFixture();

        const stranger =
          await createTestAccount(
            testPool
          );

        createdAccountIds.push(
          stranger.accountId
        );

        await expect(
          sessionService.execute({
            accountId:
              stranger.accountId,
            characterId:
              fixture.characterId,
            combatSessionId:
              fixture.combatSessionId,
          })
        ).rejects.toBeInstanceOf(
          CombatSessionNotFoundError
        );

        await expect(
          logService.execute({
            accountId:
              stranger.accountId,
            characterId:
              fixture.characterId,
            combatSessionId:
              fixture.combatSessionId,
          })
        ).rejects.toBeInstanceOf(
          CombatSessionNotFoundError
        );
      }
    );

    it(
      "returns not found after the session is no longer active",
      async () => {
        const fixture =
          await createFixture();

        await testPool.query(
          `
            UPDATE combat_sessions
            SET
              status = 'Abandoned',
              ended_at = $2
            WHERE combat_session_id = $1
          `,
          [
            fixture.combatSessionId,
            new Date(
              "2026-10-07T20:02:00.000Z"
            ),
          ]
        );

        await expect(
          activeService.execute({
            accountId:
              fixture.accountId,
            characterId:
              fixture.characterId,
          })
        ).rejects.toBeInstanceOf(
          CombatSessionNotFoundError
        );

        await expect(
          sessionService.execute({
            accountId:
              fixture.accountId,
            characterId:
              fixture.characterId,
            combatSessionId:
              fixture.combatSessionId,
          })
        ).resolves.toMatchObject({
          status: "Abandoned",
        });
      }
    );
  }
);

```

# ============================================================
# SOURCE: tests/integration/combat/persistent-combat-schema.test.ts
# ============================================================

```text
import { randomUUID } from "node:crypto";

import { Pool } from "pg";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import { env } from "../../../src/config/env.js";
import {
  createTestAccount,
  deleteTestAccount,
} from "../../helpers/test-account.js";

const testPool = new Pool({
  host: env.database.host,
  port: env.database.port,
  database: env.database.name,
  user: env.database.user,
  password: env.database.password,
  max: 2,
  idleTimeoutMillis: 5_000,
  connectionTimeoutMillis: 5_000,
});

type SessionOverrides = {
  status?: "Active" | "Victory" | "Defeat" | "Abandoned";
  currentTurn?: number;
  characterHealth?: number;
  characterMaximumHealth?: number;
  characterAttack?: number;
  characterDefense?: number;
  monsterHealth?: number;
  monsterMaximumHealth?: number;
  monsterAttack?: number;
  monsterDefense?: number;
  defeatReason?:
    | "PlayerHealthDepleted"
    | "TurnLimitExceeded"
    | string
    | null;
  endedAt?: Date | null;
};

let accountId: string;
let characterId: string;
let monsterId: string;

async function insertCombatSession(
  overrides: SessionOverrides = {}
): Promise<string> {
  const status = overrides.status ?? "Active";
  const endedAt =
    overrides.endedAt !== undefined
      ? overrides.endedAt
      : status === "Active"
        ? null
        : new Date();

  const result = await testPool.query<{
    combat_session_id: string;
  }>(
    `
      INSERT INTO combat_sessions (
        character_id,
        monster_id,
        status,
        current_turn,
        character_health,
        character_mana,
        monster_health,
        started_at,
        ended_at,
        character_maximum_health,
        character_attack,
        character_defense,
        monster_maximum_health,
        monster_attack,
        monster_defense,
        defeat_reason
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        NOW() - INTERVAL '1 minute',
        $8,
        $9, $10, $11, $12, $13, $14, $15
      )
      RETURNING combat_session_id
    `,
    [
      characterId,
      monsterId,
      status,
      overrides.currentTurn ?? 1,
      overrides.characterHealth ?? 100,
      35,
      overrides.monsterHealth ?? 80,
      endedAt,
      overrides.characterMaximumHealth ?? 100,
      overrides.characterAttack ?? 20,
      overrides.characterDefense ?? 10,
      overrides.monsterMaximumHealth ?? 80,
      overrides.monsterAttack ?? 15,
      overrides.monsterDefense ?? 8,
      overrides.defeatReason ?? null,
    ]
  );

  const row = result.rows[0];

  if (!row) {
    throw new Error(
      "Combat session insert did not return an ID."
    );
  }

  return row.combat_session_id;
}

async function expectCheckViolation(
  operation: () => Promise<unknown>
): Promise<void> {
  await expect(operation()).rejects.toMatchObject({
    code: "23514",
  });
}

describe("M5 persistent combat schema", () => {
  beforeAll(async () => {
    const account = await createTestAccount(testPool);
    accountId = account.accountId;

    const character = await testPool.query<{
      character_id: string;
    }>(
      `
        INSERT INTO characters (
          account_id,
          name
        )
        VALUES ($1, $2)
        RETURNING character_id
      `,
      [
        accountId,
        `Combat-${randomUUID().slice(0, 8)}`,
      ]
    );

    const characterRow = character.rows[0];

    if (!characterRow) {
      throw new Error(
        "Character insert did not return an ID."
      );
    }

    characterId = characterRow.character_id;

    const monster = await testPool.query<{
      monster_id: string;
    }>(
      `
        SELECT monster_id
        FROM monsters
        WHERE monster_type = 'Normal'
        ORDER BY monster_id
        LIMIT 1
      `
    );

    const monsterRow = monster.rows[0];

    if (!monsterRow) {
      throw new Error(
        "Persistent combat schema tests require one seeded monster."
      );
    }

    monsterId = monsterRow.monster_id;
  });

  beforeEach(async () => {
    await testPool.query(
      `
        DELETE FROM combat_sessions
        WHERE character_id = $1
      `,
      [characterId]
    );
  });

  afterAll(async () => {
    try {
      if (accountId) {
        await deleteTestAccount(
          testPool,
          accountId
        );
      }
    } finally {
      await testPool.end();
    }
  });

  it("contains the M5 snapshot columns and event table", async () => {
    const columns = await testPool.query<{
      table_name: string;
      column_name: string;
    }>(
      `
        SELECT
          table_name,
          column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name IN (
            'combat_sessions',
            'combat_session_events'
          )
      `
    );

    const names = new Set(
      columns.rows.map(
        (row) =>
          `${row.table_name}.${row.column_name}`
      )
    );

    expect(names).toEqual(
      expect.objectContaining({})
    );

    expect(names.has(
      "combat_sessions.character_maximum_health"
    )).toBe(true);
    expect(names.has(
      "combat_sessions.character_attack"
    )).toBe(true);
    expect(names.has(
      "combat_sessions.character_defense"
    )).toBe(true);
    expect(names.has(
      "combat_sessions.monster_maximum_health"
    )).toBe(true);
    expect(names.has(
      "combat_sessions.monster_attack"
    )).toBe(true);
    expect(names.has(
      "combat_sessions.monster_defense"
    )).toBe(true);
    expect(names.has(
      "combat_sessions.defeat_reason"
    )).toBe(true);
    expect(names.has(
      "combat_session_events.event_data_json"
    )).toBe(true);
  });

  it("rejects non-positive maximum Health", async () => {
    await expectCheckViolation(() =>
      insertCombatSession({
        characterMaximumHealth: 0,
      })
    );

    await expectCheckViolation(() =>
      insertCombatSession({
        monsterMaximumHealth: 0,
      })
    );
  });

  it("rejects negative Attack and Defense", async () => {
    await expectCheckViolation(() =>
      insertCombatSession({
        characterAttack: -1,
      })
    );

    await expectCheckViolation(() =>
      insertCombatSession({
        monsterDefense: -1,
      })
    );
  });

  it("rejects current Health above maximum Health", async () => {
    await expectCheckViolation(() =>
      insertCombatSession({
        characterHealth: 101,
        characterMaximumHealth: 100,
      })
    );

    await expectCheckViolation(() =>
      insertCombatSession({
        monsterHealth: 81,
        monsterMaximumHealth: 80,
      })
    );
  });

  it("rejects turns outside the range from 1 to 100", async () => {
    await expectCheckViolation(() =>
      insertCombatSession({
        currentTurn: 0,
      })
    );

    await expectCheckViolation(() =>
      insertCombatSession({
        currentTurn: 101,
      })
    );
  });

  it("accepts valid terminal state combinations", async () => {
    await insertCombatSession({
      status: "Victory",
      monsterHealth: 0,
      defeatReason: null,
    });

    await insertCombatSession({
      status: "Defeat",
      characterHealth: 0,
      defeatReason: "PlayerHealthDepleted",
    });

    await insertCombatSession({
      status: "Abandoned",
      defeatReason: null,
    });
  });

  it("rejects inconsistent status and defeat reason combinations", async () => {
    await expectCheckViolation(() =>
      insertCombatSession({
        status: "Active",
        defeatReason: "TurnLimitExceeded",
      })
    );

    await expectCheckViolation(() =>
      insertCombatSession({
        status: "Victory",
        defeatReason: "PlayerHealthDepleted",
      })
    );

    await expectCheckViolation(() =>
      insertCombatSession({
        status: "Defeat",
        defeatReason: null,
      })
    );

    await expectCheckViolation(() =>
      insertCombatSession({
        status: "Abandoned",
        defeatReason: "TurnLimitExceeded",
      })
    );
  });

  it("rejects an unsupported defeat reason", async () => {
    await expectCheckViolation(() =>
      insertCombatSession({
        status: "Defeat",
        defeatReason: "UnsupportedReason",
      })
    );
  });

  it("rejects duplicate event positions in one turn", async () => {
    const sessionId =
      await insertCombatSession();

    const insertEvent = () =>
      testPool.query(
        `
          INSERT INTO combat_session_events (
            combat_session_id,
            turn_number,
            event_order,
            event_type,
            event_data_json
          )
          VALUES ($1, 1, 0, $2, $3::jsonb)
        `,
        [
          sessionId,
          "AttackResolved",
          JSON.stringify({
            type: "AttackResolved",
          }),
        ]
      );

    await insertEvent();

    await expect(
      insertEvent()
    ).rejects.toMatchObject({
      code: "23505",
    });
  });

  it("allows the same event order in different turns", async () => {
    const sessionId =
      await insertCombatSession();

    await testPool.query(
      `
        INSERT INTO combat_session_events (
          combat_session_id,
          turn_number,
          event_order,
          event_type,
          event_data_json
        )
        VALUES
          ($1, 1, 0, 'AttackResolved', '{}'::jsonb),
          ($1, 2, 0, 'AttackResolved', '{}'::jsonb)
      `,
      [sessionId]
    );

    const result = await testPool.query<{
      count: string;
    }>(
      `
        SELECT COUNT(*)::text AS count
        FROM combat_session_events
        WHERE combat_session_id = $1
      `,
      [sessionId]
    );

    expect(result.rows[0]?.count).toBe("2");
  });

  it("deletes events when their session is deleted", async () => {
    const sessionId =
      await insertCombatSession();

    await testPool.query(
      `
        INSERT INTO combat_session_events (
          combat_session_id,
          turn_number,
          event_order,
          event_type,
          event_data_json
        )
        VALUES (
          $1,
          1,
          0,
          'AttackResolved',
          '{}'::jsonb
        )
      `,
      [sessionId]
    );

    await testPool.query(
      `
        DELETE FROM combat_sessions
        WHERE combat_session_id = $1
      `,
      [sessionId]
    );

    const result = await testPool.query<{
      count: string;
    }>(
      `
        SELECT COUNT(*)::text AS count
        FROM combat_session_events
        WHERE combat_session_id = $1
      `,
      [sessionId]
    );

    expect(result.rows[0]?.count).toBe("0");
  });

  it("allows only one active session per character", async () => {
    await insertCombatSession();

    await expect(
      insertCombatSession()
    ).rejects.toMatchObject({
      code: "23505",
    });
  });
});

```

# ============================================================
# SOURCE: tests/integration/combat/resolve-combat-action.integration.test.ts
# ============================================================

```text
import { randomUUID } from "node:crypto";

import { Pool } from "pg";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import type {
  Clock,
} from "../../../src/application/ports/clock.js";
import { env } from "../../../src/config/env.js";
import {
  CombatTurnMismatchError,
} from "../../../src/modules/combat/application/combat-session.errors.js";
import {
  ResolveCombatActionService,
} from "../../../src/modules/combat/application/resolve-combat-action.service.js";
import {
  PLAYER_ACTION_TYPE,
} from "../../../src/modules/combat/domain/combat.constants.js";
import {
  PostgresCombatSessionRepository,
} from "../../../src/modules/combat/infrastructure/postgres-combat-session.repository.js";
import type {
  RandomSource,
} from "../../../src/modules/combat/ports/random-source.js";
import {
  PostgresCharacterRepository,
} from "../../../src/modules/characters/infrastructure/postgres-character.repository.js";
import {
  createTestAccount,
  deleteTestAccount,
} from "../../helpers/test-account.js";

const testPool = new Pool({
  host: env.database.host,
  port: env.database.port,
  database: env.database.name,
  user: env.database.user,
  password: env.database.password,
  max: 5,
  idleTimeoutMillis: 5_000,
  connectionTimeoutMillis: 5_000,
});

const observedAt = new Date(
  "2026-10-07T20:00:00.000Z"
);

const clock: Clock = {
  now: () => observedAt,
};

const characterRepository =
  new PostgresCharacterRepository(testPool);

const combatRepository =
  new PostgresCombatSessionRepository(testPool);

const createdAccountIds: string[] = [];

type Fixture = {
  accountId: string;
  characterId: string;
  combatSessionId: string;
};

class MissRandomSource
  implements RandomSource {
  public nextFloat(): number {
    return 0.99;
  }

  public nextInt(
    minimum: number,
    maximum: number
  ): number {
    void maximum;
    return minimum;
  }
}

class VictoryRandomSource
  implements RandomSource {
  public nextFloat(): number {
    return 0;
  }

  public nextInt(
    minimum: number,
    maximum: number
  ): number {
    void minimum;
    return maximum;
  }
}

async function createFixture(
  monsterHealth = 100
): Promise<Fixture> {
  const account =
    await createTestAccount(testPool);

  createdAccountIds.push(
    account.accountId
  );

  const character =
    await characterRepository
      .createCharacterGraph({
        accountId: account.accountId,
        seasonId: null,
        name:
          `Action ${randomUUID().slice(0, 8)}`,
        spellLoadoutName:
          "Default Spells",
        equipmentLoadoutName:
          "Default Equipment",
      });

  const sessionResult =
    await testPool.query<{
      combat_session_id: string;
    }>(
      `
        INSERT INTO combat_sessions (
          character_id,
          monster_id,
          status,
          current_turn,
          character_health,
          character_mana,
          monster_health,
          character_maximum_health,
          character_attack,
          character_defense,
          monster_maximum_health,
          monster_attack,
          monster_defense,
          started_at
        )
        SELECT
          $1,
          m.monster_id,
          'Active',
          1,
          100,
          35,
          $2,
          100,
          20,
          10,
          $2,
          15,
          5,
          $3
        FROM monsters AS m
        WHERE m.monster_type = 'Normal'
        ORDER BY m.monster_id
        LIMIT 1
        RETURNING combat_session_id
      `,
      [
        character.characterId,
        monsterHealth,
        new Date(
          observedAt.getTime() - 60_000
        ),
      ]
    );

  const session =
    sessionResult.rows[0];

  if (!session) {
    throw new Error(
      "Combat session was not created."
    );
  }

  return {
    accountId: account.accountId,
    characterId:
      character.characterId,
    combatSessionId:
      session.combat_session_id,
  };
}

function createService(
  randomSource: RandomSource
): ResolveCombatActionService {
  return new ResolveCombatActionService(
    combatRepository,
    randomSource,
    clock
  );
}

function actionInput(
  fixture: Fixture
) {
  return {
    accountId: fixture.accountId,
    characterId:
      fixture.characterId,
    expectedTurn: 1,
    action: {
      type:
        PLAYER_ACTION_TYPE.basicAttack,
    },
  } as const;
}

describe(
  "Transactional combat action integration",
  () => {
    beforeAll(async () => {
      await testPool.query("SELECT 1");
    });

    afterEach(async () => {
      while (
        createdAccountIds.length > 0
      ) {
        const accountId =
          createdAccountIds.pop();

        if (accountId) {
          await deleteTestAccount(
            testPool,
            accountId
          );
        }
      }
    });

    afterAll(async () => {
      await testPool.end();
    });

    it(
      "persists the next state and ordered events atomically",
      async () => {
        const fixture =
          await createFixture();

        const service = createService(
          new MissRandomSource()
        );

        const result =
          await service.execute(
            actionInput(fixture)
          );

        expect(result).toMatchObject({
          combatSessionId:
            fixture.combatSessionId,
          status: "Active",
          currentTurn: 2,
        });

        const storedSession =
          await testPool.query<{
            current_turn: number;
            status: string;
          }>(
            `
              SELECT
                current_turn,
                status
              FROM combat_sessions
              WHERE combat_session_id = $1
            `,
            [
              fixture.combatSessionId,
            ]
          );

        expect(
          storedSession.rows[0]
        ).toEqual({
          current_turn: 2,
          status: "Active",
        });

        const events =
          await testPool.query<{
            turn_number: number;
            event_order: number;
            event_type: string;
          }>(
            `
              SELECT
                turn_number,
                event_order,
                event_type
              FROM combat_session_events
              WHERE combat_session_id = $1
              ORDER BY
                turn_number,
                event_order
            `,
            [
              fixture.combatSessionId,
            ]
          );

        expect(events.rows).toEqual([
          {
            turn_number: 1,
            event_order: 0,
            event_type:
              "AttackResolved",
          },
          {
            turn_number: 1,
            event_order: 1,
            event_type:
              "AttackResolved",
          },
          {
            turn_number: 1,
            event_order: 2,
            event_type:
              "TurnAdvanced",
          },
        ]);
      }
    );

    it(
      "rejects a stale turn without creating additional events",
      async () => {
        const fixture =
          await createFixture();

        const service = createService(
          new MissRandomSource()
        );

        await service.execute(
          actionInput(fixture)
        );

        await expect(
          service.execute(
            actionInput(fixture)
          )
        ).rejects.toBeInstanceOf(
          CombatTurnMismatchError
        );

        const events =
          await testPool.query<{
            count: string;
          }>(
            `
              SELECT COUNT(*)::text
                AS count
              FROM combat_session_events
              WHERE combat_session_id = $1
            `,
            [
              fixture.combatSessionId,
            ]
          );

        expect(
          events.rows[0]?.count
        ).toBe("3");
      }
    );

    it(
      "persists victory and synchronizes final character Health",
      async () => {
        const fixture =
          await createFixture(10);

        const service = createService(
          new VictoryRandomSource()
        );

        const result =
          await service.execute(
            actionInput(fixture)
          );

        expect(result).toMatchObject({
          status: "Victory",
          currentTurn: 1,
          endedAt: observedAt,
          monster: {
            currentHealth: 0,
          },
        });

        const stored =
          await testPool.query<{
            status: string;
            ended_at: Date | null;
            current_health: string;
          }>(
            `
              SELECT
                cs.status,
                cs.ended_at,
                c.current_health
              FROM combat_sessions AS cs
              INNER JOIN characters AS c
                ON c.character_id =
                  cs.character_id
              WHERE cs.combat_session_id = $1
            `,
            [
              fixture.combatSessionId,
            ]
          );

        expect(
          stored.rows[0]?.status
        ).toBe("Victory");

        expect(
          stored.rows[0]?.ended_at
        ).toEqual(observedAt);

        expect(
          stored.rows[0]?.current_health
        ).toBe("100");
      }
    );

    it(
      "allows only one of two concurrent requests to resolve the turn",
      async () => {
        const fixture =
          await createFixture();

        const service = createService(
          new MissRandomSource()
        );

        const execute = () =>
          service.execute(
            actionInput(fixture)
          );

        const results =
          await Promise.allSettled([
            execute(),
            execute(),
          ]);

        expect(
          results.filter(
            (result) =>
              result.status ===
              "fulfilled"
          )
        ).toHaveLength(1);

        const rejected =
          results.filter(
            (result) =>
              result.status ===
              "rejected"
          );

        expect(rejected).toHaveLength(1);

        if (
          rejected[0]?.status ===
          "rejected"
        ) {
          expect(
            rejected[0].reason
          ).toBeInstanceOf(
            CombatTurnMismatchError
          );
        }

        const stored =
          await testPool.query<{
            current_turn: number;
            event_count: string;
          }>(
            `
              SELECT
                cs.current_turn,
                COUNT(cse.*)::text
                  AS event_count
              FROM combat_sessions AS cs
              LEFT JOIN combat_session_events
                AS cse
                ON cse.combat_session_id =
                  cs.combat_session_id
              WHERE cs.combat_session_id = $1
              GROUP BY
                cs.combat_session_id,
                cs.current_turn
            `,
            [
              fixture.combatSessionId,
            ]
          );

        expect(
          stored.rows[0]
        ).toEqual({
          current_turn: 2,
          event_count: "3",
        });
      }
    );
  }
);

```

# ============================================================
# SOURCE: tests/integration/combat/start-combat.integration.test.ts
# ============================================================

```text
import { randomUUID } from "node:crypto";

import { Pool } from "pg";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import type {
  Clock,
} from "../../../src/application/ports/clock.js";
import { env } from "../../../src/config/env.js";
import {
  CombatAlreadyActiveError,
  InsufficientEnergyError,
} from "../../../src/modules/combat/application/combat-session.errors.js";
import {
  StartCombatService,
} from "../../../src/modules/combat/application/start-combat.service.js";
import {
  PostgresCombatSessionRepository,
} from "../../../src/modules/combat/infrastructure/postgres-combat-session.repository.js";
import {
  createTestAccount,
  deleteTestAccount,
} from "../../helpers/test-account.js";
import { PostgresCharacterRepository } from "../../../src/modules/characters/infrastructure/postgres-character.repository.js";

const testPool = new Pool({
  host: env.database.host,
  port: env.database.port,
  database: env.database.name,
  user: env.database.user,
  password: env.database.password,
  max: 5,
  idleTimeoutMillis: 5_000,
  connectionTimeoutMillis: 5_000,
});

const observedAt = new Date(
  "2026-10-07T20:00:00.000Z"
);

const clock: Clock = {
  now: () => observedAt,
};

const characterRepository =
  new PostgresCharacterRepository(testPool);

const combatRepository =
  new PostgresCombatSessionRepository(testPool);

const service =
  new StartCombatService(
    combatRepository,
    clock
  );

const createdAccountIds: string[] = [];
const createdMonsterIds: string[] = [];

type Fixture = {
  accountId: string;
  characterId: string;
  monsterId: string;
  monsterCode: string;
  energyCost: number;
};

async function createFixture():
Promise<Fixture> {
  const account =
    await createTestAccount(testPool);

  createdAccountIds.push(
    account.accountId
  );

  const character =
    await characterRepository
      .createCharacterGraph({
        accountId: account.accountId,
        seasonId: null,
        name:
          `Combat ${randomUUID().slice(0, 8)}`,
        spellLoadoutName:
          "Default Spells",
        equipmentLoadoutName:
          "Default Equipment",
      });

  const monsterSuffix =
    randomUUID().replaceAll("-", "");

  const monsterResult =
    await testPool.query<{
      monster_id: string;
      code: string;
      energy_cost: number;
    }>(
      `
        INSERT INTO monsters (
          monster_family_id,
          code,
          name,
          description,
          monster_type,
          level,
          health,
          attack,
          defense,
          energy_cost
        )
        SELECT
          monster_family_id,
          $1,
          $2,
          $3,
          'Normal',
          1,
          100,
          5,
          2,
          5
        FROM monster_families
        ORDER BY monster_family_id
        LIMIT 1
        RETURNING
          monster_id,
          code,
          energy_cost
      `,
      [
        `combat_test_${monsterSuffix}`,
        `Combat Test ${monsterSuffix}`,
        "Integration-test combat monster.",
      ]
    );

  const monster =
    monsterResult.rows[0];

  if (!monster) {
    throw new Error(
      "Combat start integration fixture could not create a test monster."
    );
  }

  createdMonsterIds.push(
    monster.monster_id
  );

  await testPool.query(
    `
      UPDATE characters
      SET
        current_health = 100,
        current_energy = 50,
        resources_updated_at = $2
      WHERE character_id = $1
    `,
    [
      character.characterId,
      observedAt,
    ]
  );

  return {
    accountId: account.accountId,
    characterId:
      character.characterId,
    monsterId: monster.monster_id,
    monsterCode: monster.code,
    energyCost:
      monster.energy_cost,
  };
}

async function readEnergy(
  characterId: string
): Promise<number> {
  const result =
    await testPool.query<{
      current_energy: string;
    }>(
      `
        SELECT current_energy
        FROM characters
        WHERE character_id = $1
      `,
      [characterId]
    );

  const row = result.rows[0];

  if (!row) {
    throw new Error(
      "Character was not found."
    );
  }

  return Number(row.current_energy);
}

describe(
  "Transactional combat start integration",
  () => {
    beforeAll(async () => {
      await testPool.query("SELECT 1");
    });

    afterEach(async () => {
      while (
        createdAccountIds.length > 0
      ) {
        const accountId =
          createdAccountIds.pop();

        if (accountId) {
          await deleteTestAccount(
            testPool,
            accountId
          );
        }
      }

      while (
        createdMonsterIds.length > 0
      ) {
        const monsterId =
          createdMonsterIds.pop();

        if (monsterId) {
          await testPool.query(
            `
              DELETE FROM monsters
              WHERE monster_id = $1
            `,
            [monsterId]
          );
        }
      }
    });

    afterAll(async () => {
      await testPool.end();
    });

    it(
      "deducts Energy once and persists combat snapshots",
      async () => {
        const fixture =
          await createFixture();

        const result =
          await service.execute({
            accountId:
              fixture.accountId,
            characterId:
              fixture.characterId,
            monsterCode:
              fixture.monsterCode,
          });

        expect(
          await readEnergy(
            fixture.characterId
          )
        ).toBe(
          50 - fixture.energyCost
        );

        expect(result).toMatchObject({
          characterId:
            fixture.characterId,
          monsterId:
            fixture.monsterId,
          monsterCode:
            fixture.monsterCode,
          status: "Active",
          currentTurn: 1,
          defeatReason: null,
          events: [],
        });

        expect(
          result.player.currentHealth
        ).toBe(100);

        expect(
          result.player.maximumHealth
        ).toBeGreaterThan(0);

        expect(
          result.monster.maximumHealth
        ).toBeGreaterThan(0);

        const stored =
          await testPool.query<{
            count: string;
          }>(
            `
              SELECT COUNT(*)::text
                AS count
              FROM combat_sessions
              WHERE character_id = $1
                AND status = 'Active'
            `,
            [fixture.characterId]
          );

        expect(
          stored.rows[0]?.count
        ).toBe("1");
      }
    );

    it(
      "rolls back Energy when session creation fails",
      async () => {
        const fixture =
          await createFixture();

        await testPool.query(
          `
            INSERT INTO combat_sessions (
              character_id,
              monster_id,
              status,
              current_turn,
              character_health,
              character_mana,
              monster_health,
              character_maximum_health,
              character_attack,
              character_defense,
              monster_maximum_health,
              monster_attack,
              monster_defense,
              started_at
            )
            SELECT
              $1,
              m.monster_id,
              'Active',
              1,
              100,
              35,
              m.health,
              180,
              7,
              7,
              m.health,
              FLOOR(m.attack)::bigint,
              FLOOR(m.defense)::bigint,
              $2
            FROM monsters AS m
            WHERE m.monster_id = $3
          `,
          [
            fixture.characterId,
            observedAt,
            fixture.monsterId,
          ]
        );

        await expect(
          service.execute({
            accountId:
              fixture.accountId,
            characterId:
              fixture.characterId,
            monsterCode:
              fixture.monsterCode,
          })
        ).rejects.toBeInstanceOf(
          CombatAlreadyActiveError
        );

        expect(
          await readEnergy(
            fixture.characterId
          )
        ).toBe(50);
      }
    );

    it(
      "does not persist regeneration or a session when Energy remains insufficient",
      async () => {
        const fixture =
          await createFixture();

        const earlier = new Date(
          observedAt.getTime() - 60_000
        );

        await testPool.query(
          `
            UPDATE characters
            SET
              current_energy = 0,
              resources_updated_at = $2
            WHERE character_id = $1
          `,
          [
            fixture.characterId,
            earlier,
          ]
        );

        await expect(
          service.execute({
            accountId:
              fixture.accountId,
            characterId:
              fixture.characterId,
            monsterCode:
              fixture.monsterCode,
          })
        ).rejects.toBeInstanceOf(
          InsufficientEnergyError
        );

        expect(
          await readEnergy(
            fixture.characterId
          )
        ).toBe(0);

        const sessions =
          await testPool.query<{
            count: string;
          }>(
            `
              SELECT COUNT(*)::text
                AS count
              FROM combat_sessions
              WHERE character_id = $1
            `,
            [fixture.characterId]
          );

        expect(
          sessions.rows[0]?.count
        ).toBe("0");
      }
    );

    it(
      "allows only one of two concurrent starts to succeed",
      async () => {
        const fixture =
          await createFixture();

        const start = () =>
          service.execute({
            accountId:
              fixture.accountId,
            characterId:
              fixture.characterId,
            monsterCode:
              fixture.monsterCode,
          });

        const results =
          await Promise.allSettled([
            start(),
            start(),
          ]);

        const fulfilled =
          results.filter(
            (result) =>
              result.status ===
              "fulfilled"
          );

        const rejected =
          results.filter(
            (result) =>
              result.status ===
              "rejected"
          );

        expect(fulfilled).toHaveLength(1);
        expect(rejected).toHaveLength(1);

        if (
          rejected[0]?.status ===
          "rejected"
        ) {
          expect(
            rejected[0].reason
          ).toBeInstanceOf(
            CombatAlreadyActiveError
          );
        }

        expect(
          await readEnergy(
            fixture.characterId
          )
        ).toBe(
          50 - fixture.energyCost
        );

        const sessions =
          await testPool.query<{
            count: string;
          }>(
            `
              SELECT COUNT(*)::text
                AS count
              FROM combat_sessions
              WHERE character_id = $1
                AND status = 'Active'
            `,
            [fixture.characterId]
          );

        expect(
          sessions.rows[0]?.count
        ).toBe("1");
      }
    );
  }
);

```

# ============================================================
# SOURCE: tests/integration/characters/postgres-character-statistics.repository.test.ts
# ============================================================

```text
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { env } from "../../../src/config/env.js";
import { PostgresCharacterRepository } from "../../../src/modules/characters/infrastructure/postgres-character.repository.js";
import { PostgresCharacterStatisticsRepository } from "../../../src/modules/characters/infrastructure/postgres-character-statistics.repository.js";
import { createTestAccount, deleteTestAccount } from "../../helpers/test-account.js";

const testPool = new Pool({
  host: env.database.host,
  port: env.database.port,
  database: env.database.name,
  user: env.database.user,
  password: env.database.password,
  max: 2,
  idleTimeoutMillis: 5_000,
  connectionTimeoutMillis: 5_000,
});

const characterRepository = new PostgresCharacterRepository(testPool);
const statisticsRepository = new PostgresCharacterStatisticsRepository(testPool);
const createdAccountIds: string[] = [];
const createdItemIds: string[] = [];
const createdItemBaseIds: string[] = [];
const createdAffixTemplateIds: string[] = [];

describe("PostgresCharacterStatisticsRepository integration", () => {
  beforeAll(async () => {
    await testPool.query("SELECT 1");
  });

  afterEach(async () => {
    while (createdAccountIds.length > 0) {
      const accountId = createdAccountIds.pop();
      if (accountId !== undefined) {
        await deleteTestAccount(testPool, accountId);
      }
    }

    while (createdItemIds.length > 0) {
      const itemId = createdItemIds.pop();
      if (itemId !== undefined) {
        await testPool.query("DELETE FROM items WHERE item_id = $1", [itemId]);
      }
    }

    while (createdAffixTemplateIds.length > 0) {
      const affixTemplateId =
        createdAffixTemplateIds.pop();

      if (affixTemplateId !== undefined) {
        await testPool.query(
          `
            DELETE FROM affix_templates
            WHERE affix_template_id = $1
          `,
          [affixTemplateId]
        );
      }
    }

    while (createdItemBaseIds.length > 0) {
      const itemBaseId = createdItemBaseIds.pop();
      if (itemBaseId !== undefined) {
        await testPool.query("DELETE FROM item_bases WHERE item_base_id = $1", [itemBaseId]);
      }
    }
  });

  afterAll(async () => {
    await testPool.end();
  });

  it("includes equipped items and ignores unequipped items", async () => {
    const account = await createTestAccount(testPool);
    createdAccountIds.push(account.accountId);

    const character = await characterRepository.createCharacterGraph({
      accountId: account.accountId,
      seasonId: null,
      name: `Stats ${randomUUID().slice(0, 8)}`,
      spellLoadoutName: "Default Spells",
      equipmentLoadoutName: "Default Equipment",
    });

    async function createItemBase(input: {
      namePrefix: string;
      slot: "Ring" | "Amulet";
      value: number;
    }): Promise<string> {
      const result = await testPool.query<{ item_base_id: string }>(
        `
          INSERT INTO item_bases (
            code, name, description, item_level, required_level, slot,
            attack, defense, spell_power, health, mana, energy,
            gold_percent, experience_percent
          )
          VALUES ($1, $2, 'Integration test item', 1, 1, $3,
            $4, $4, $4, $4, $4, $4, $4, $4)
          RETURNING item_base_id
        `,
        [`${input.namePrefix.toLowerCase()}_${randomUUID().replaceAll("-", "")}`, `${input.namePrefix} ${randomUUID()}`, input.slot, input.value]
      );

      const itemBaseId = result.rows[0]?.item_base_id;
      if (itemBaseId === undefined) {
        throw new Error("Item base was not created.");
      }

      createdItemBaseIds.push(itemBaseId);
      return itemBaseId;
    }

    async function createItem(itemBaseId: string): Promise<string> {
      const result = await testPool.query<{ item_id: string }>(
        `
          INSERT INTO items (item_base_id, item_level, rarity, item_score)
          VALUES ($1, 1, 'Common', 0)
          RETURNING item_id
        `,
        [itemBaseId]
      );

      const itemId = result.rows[0]?.item_id;
      if (itemId === undefined) {
        throw new Error("Item was not created.");
      }

      createdItemIds.push(itemId);
      return itemId;
    }

    const equippedBaseId = await createItemBase({
      namePrefix: "Equipped",
      slot: "Ring",
      value: 5,
    });
    const unequippedBaseId = await createItemBase({
      namePrefix: "Unequipped",
      slot: "Amulet",
      value: 1000,
    });

    const equippedItemId = await createItem(equippedBaseId);
    const unequippedItemId = await createItem(unequippedBaseId);

    const affixTemplateResult =
      await testPool.query<{
        affix_template_id: string;
      }>(
        `
          INSERT INTO affix_templates (
            affix_type,
            tier,
            required_item_level,
            min_value,
            max_value
          )
          VALUES (
            'Attack',
            999999,
            1,
            0,
            1000
          )
          RETURNING affix_template_id
        `
      );

    const affixTemplateId =
      affixTemplateResult.rows[0]?.affix_template_id;

    if (affixTemplateId === undefined) {
      throw new Error(
        "Affix template was not created."
      );
    }

    createdAffixTemplateIds.push(
      affixTemplateId
    );

    await testPool.query(
      `
        INSERT INTO item_affixes (
          item_id,
          affix_template_id,
          roll_value
        )
        VALUES
          ($1, $3, 7),
          ($2, $3, 500)
      `,
      [
        equippedItemId,
        unequippedItemId,
        affixTemplateId,
      ]
    );

    await testPool.query(
      `
        INSERT INTO inventory_items (
          character_id, item_id, position, is_equipped
        )
        VALUES ($1, $2, 1, TRUE), ($1, $3, 2, FALSE)
      `,
      [character.characterId, equippedItemId, unequippedItemId]
    );

    const result = await statisticsRepository.findCalculationSources(
      character.characterId
    );

    expect(result).not.toBeNull();
    expect(result?.equipment).toEqual({
      attack: 12,
      defense: 5,
      spellPower: 5,
      maximumHealth: 5,
      maximumMana: 5,
      maximumEnergy: 5,
      goldBonusPercent: 5,
      experienceBonusPercent: 5,
    });
  });
});





```

# ============================================================
# SOURCE: tests/integration/http/combat.http.test.ts
# ============================================================

```text
import { randomUUID } from "node:crypto";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";

import { Pool } from "pg";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import {
  createApplicationServer,
} from "../../../src/app.js";
import { env } from "../../../src/config/env.js";
import {
  hashSessionToken,
} from "../../../src/http/postgres-authentication.provider.js";
import {
  PostgresCharacterRepository,
} from "../../../src/modules/characters/infrastructure/postgres-character.repository.js";
import {
  createTestAccount,
  deleteTestAccount,
} from "../../helpers/test-account.js";

const testPool = new Pool({
  host: env.database.host,
  port: env.database.port,
  database: env.database.name,
  user: env.database.user,
  password: env.database.password,
  max: 4,
  idleTimeoutMillis: 5_000,
  connectionTimeoutMillis: 5_000,
});

const characterRepository =
  new PostgresCharacterRepository(
    testPool
  );

const createdAccountIds: string[] = [];
const createdMonsterIds: string[] = [];
const openedServers: Server[] = [];

async function createAuthorizationSession(
  accountId: string
): Promise<string> {
  const token =
    `combat-http-${randomUUID()}`;

  const now = Date.now();

  await testPool.query(
    `
      INSERT INTO account_sessions (
        account_id,
        session_token_hash,
        created_at,
        last_activity_at,
        expires_at,
        is_revoked,
        revoked_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $3,
        $4,
        FALSE,
        NULL
      )
    `,
    [
      accountId,
      hashSessionToken(token),
      new Date(now - 60_000),
      new Date(now + 3_600_000),
    ]
  );

  return token;
}

async function createCombatMonster() {
  const suffix =
    randomUUID().replaceAll("-", "");

  const result = await testPool.query<{
    monster_id: string;
    code: string;
  }>(
    `
      INSERT INTO monsters (
        monster_family_id,
        code,
        name,
        description,
        monster_type,
        level,
        health,
        attack,
        defense,
        energy_cost
      )
      SELECT
        monster_family_id,
        $1,
        $2,
        $3,
        'Normal',
        1,
        100,
        5,
        2,
        5
      FROM monster_families
      ORDER BY monster_family_id
      LIMIT 1
      RETURNING
        monster_id,
        code
    `,
    [
      `combat_http_${suffix}`,
      `Combat HTTP ${suffix}`,
      "HTTP integration-test monster.",
    ]
  );

  const monster = result.rows[0];

  if (!monster) {
    throw new Error(
      "Could not create the HTTP combat test monster."
    );
  }

  createdMonsterIds.push(
    monster.monster_id
  );

  return monster;
}

async function startServer() {
  const server =
    createApplicationServer();

  openedServers.push(server);

  await new Promise<void>(
    (resolve, reject) => {
      server.once("error", reject);

      server.listen(
        0,
        "127.0.0.1",
        resolve
      );
    }
  );

  const address =
    server.address() as AddressInfo;

  return {
    baseUrl:
      `http://127.0.0.1:${address.port}`,
  };
}

function authorization(
  token: string
): Record<string, string> {
  return {
    authorization:
      `Bearer ${token}`,
  };
}

function jsonRequest(
  token: string,
  body: unknown
): RequestInit {
  return {
    method: "POST",
    headers: {
      ...authorization(token),
      "content-type":
        "application/json",
    },
    body: JSON.stringify(body),
  };
}

describe(
  "persistent combat HTTP integration",
  () => {
    beforeAll(async () => {
      await testPool.query("SELECT 1");
    });

    afterEach(async () => {
      while (openedServers.length > 0) {
        const server =
          openedServers.pop();

        if (server) {
          await new Promise<void>(
            (resolve, reject) => {
              server.close((error) => {
                if (error) {
                  reject(error);
                  return;
                }

                resolve();
              });
            }
          );
        }
      }

      while (
        createdAccountIds.length > 0
      ) {
        const accountId =
          createdAccountIds.pop();

        if (accountId) {
          await deleteTestAccount(
            testPool,
            accountId
          );
        }
      }

      while (
        createdMonsterIds.length > 0
      ) {
        const monsterId =
          createdMonsterIds.pop();

        if (monsterId) {
          await testPool.query(
            `
              DELETE FROM monsters
              WHERE monster_id = $1
            `,
            [monsterId]
          );
        }
      }
    });

    afterAll(async () => {
      await testPool.end();
    });

    it(
      "supports the complete authenticated combat flow",
      async () => {
        const account =
          await createTestAccount(
            testPool
          );

        createdAccountIds.push(
          account.accountId
        );

        const character =
          await characterRepository
            .createCharacterGraph({
              accountId:
                account.accountId,
              seasonId: null,
              name:
                `Http-${randomUUID().slice(0, 8)}`,
              spellLoadoutName:
                "Default Spells",
              equipmentLoadoutName:
                "Default Equipment",
            });

        await testPool.query(
          `
            UPDATE characters
            SET
              current_health = 100,
              current_energy = 50,
              resources_updated_at = NOW()
            WHERE character_id = $1
          `,
          [character.characterId]
        );

        const monster =
          await createCombatMonster();

        const token =
          await createAuthorizationSession(
            account.accountId
          );

        const { baseUrl } =
          await startServer();

        const combatUrl =
          `${baseUrl}/characters/${character.characterId}/combat`;

        const startResponse =
          await fetch(
            combatUrl,
            jsonRequest(token, {
              monsterCode:
                monster.code,
            })
          );

        expect(
          startResponse.status
        ).toBe(201);

        const startBody =
          await startResponse.json() as {
            data: {
              combatSessionId: string;
              status: string;
              currentTurn: number;
              events: unknown[];
            };
          };

        expect(startBody.data).toMatchObject({
          status: "Active",
          currentTurn: 1,
          events: [],
        });

        const combatSessionId =
          startBody.data.combatSessionId;

        const activeResponse =
          await fetch(combatUrl, {
            headers:
              authorization(token),
          });

        expect(
          activeResponse.status
        ).toBe(200);

        await expect(
          activeResponse.json()
        ).resolves.toMatchObject({
          data: {
            combatSessionId,
            status: "Active",
            currentTurn: 1,
          },
        });

        const actionResponse =
          await fetch(
            `${combatUrl}/actions`,
            jsonRequest(token, {
              expectedTurn: 1,
              action: {
                type: "basic_attack",
              },
            })
          );

        expect(
          actionResponse.status
        ).toBe(200);

        const actionBody =
          await actionResponse.json() as {
            data: {
              combatSessionId: string;
              events: unknown[];
            };
          };

        expect(
          actionBody.data.combatSessionId
        ).toBe(combatSessionId);

        expect(
          actionBody.data.events.length
        ).toBeGreaterThan(0);

        const sessionResponse =
          await fetch(
            `${combatUrl}/${combatSessionId}`,
            {
              headers:
                authorization(token),
            }
          );

        expect(
          sessionResponse.status
        ).toBe(200);

        await expect(
          sessionResponse.json()
        ).resolves.toMatchObject({
          data: {
            combatSessionId,
          },
        });

        const logResponse =
          await fetch(
            `${combatUrl}/${combatSessionId}/log`,
            {
              headers:
                authorization(token),
            }
          );

        expect(
          logResponse.status
        ).toBe(200);

        const logBody =
          await logResponse.json() as {
            data: {
              combatSessionId: string;
              events: unknown[];
            };
          };

        expect(logBody.data).toMatchObject({
          combatSessionId,
        });

        expect(
          logBody.data.events.length
        ).toBeGreaterThan(0);
      }
    );

    it("requires authentication", async () => {
      const { baseUrl } =
        await startServer();

      const response = await fetch(
        `${baseUrl}/characters/character-1/combat`
      );

      expect(response.status).toBe(401);
    });
  }
);

```

# ============================================================
# SOURCE: documentation/game-design/CURRENT_MILESTONE.md
# ============================================================

```text
# Current Milestone

## Milestone

M5: Persistent Combat API

## Status

Completed.

## Objective

Connect the pure M4 combat engine to authenticated HTTP endpoints and persistent PostgreSQL combat sessions.

## Implemented scope

- Persistent combat-session schema.
- Combat-ready player and monster statistic snapshots.
- Persistent current Health and turn state.
- Persistent terminal status and defeat reason.
- Ordered combat-session events.
- Transactional combat start.
- Transactional combat-action resolution.
- Active combat retrieval.
- Specific combat-session retrieval.
- Ordered combat-log retrieval.
- Authenticated combat HTTP API.
- Character and session ownership isolation.
- Server-controlled cryptographic randomness.
- Application-controlled time through `Clock`.
- Rollback and concurrency protection.
- Full unit, PostgreSQL integration, HTTP integration, and regression coverage.

## HTTP API

Implemented endpoints:

```http
POST /characters/:characterId/combat
GET /characters/:characterId/combat
GET /characters/:characterId/combat/:combatSessionId
POST /characters/:characterId/combat/actions
GET /characters/:characterId/combat/:combatSessionId/log
```

All combat endpoints require authentication.

All operations validate that the character belongs to the authenticated account.

Specific session and log endpoints also validate that the session belongs to the selected character.

Foreign characters and sessions are not disclosed.

## Start-combat request

```json
{
  "monsterCode": "stable_monster_code"
}
```

Combat start:

1. Reads one timestamp from `Clock`.
2. Opens a PostgreSQL transaction.
3. Locks the owned active character with `FOR UPDATE`.
4. Rejects an existing active combat.
5. Applies authoritative resource regeneration.
6. Loads the monster by stable code.
7. Revalidates monster eligibility.
8. Requires positive character Health.
9. Validates available Energy.
10. Calculates authoritative effective character statistics.
11. Deducts Energy exactly once.
12. Persists updated character resources.
13. Creates the active combat session with combat-ready snapshots.
14. Commits the transaction.
15. Returns the current session view.

Any failure rolls back the whole transaction.

Concurrent combat-start requests cannot create multiple active sessions or deduct Energy more than once.

## Combat-action request

```json
{
  "expectedTurn": 1,
  "action": {
    "type": "basic_attack"
  }
}
```

Rules:

- `expectedTurn` must be a positive safe integer.
- The action must be a JSON object.
- The action may contain only `type`.
- M5 currently supports only `basic_attack`.
- Clients cannot submit random values, combat results, statistics, timestamps, or damage.
- The action endpoint resolves the character's current active session.

Combat action:

1. Reads one timestamp from `Clock`.
2. Opens a PostgreSQL transaction.
3. Locks the owned active session with `FOR UPDATE`.
4. Compares `expectedTurn` with the locked session turn.
5. Reconstructs the M4 combat state from persistent snapshots.
6. Resolves the action through the pure M4 engine.
7. Uses server-controlled cryptographic randomness.
8. Persists the resulting session state.
9. Persists ordered combat events.
10. Synchronizes terminal character Health when required.
11. Commits the transaction.
12. Returns the current session view and current-operation events.

A stale action does not resolve combat or modify persistent state.

Concurrent requests cannot resolve the same turn twice.

## Persistence

Migration:

```txt
088_persistent_combat_api.sql
```

The migration:

- strengthens persistent combat-state constraints,
- adds combat-ready statistic snapshots,
- supports persistent defeat reasons,
- enforces valid turn values,
- creates `combat_session_events`,
- preserves one active combat per character,
- supports deterministic event ordering.

Persistent combat sessions survive application restarts.

The database stores all combat statistics required to reconstruct the M4 combat state without recalculating equipment or progression during an active fight.

## Combat-session events

Each persisted event stores:

- combat-session ID,
- resolved turn,
- event order within the turn,
- event type,
- complete event data as JSONB,
- creation timestamp.

Event logs are returned in deterministic order:

1. turn number,
2. event order.

The M5 log endpoint reads from `combat_session_events`.

The older `combat_logs` table remains outside the incremental M5 action flow.

## Retrieval

### Active combat

```http
GET /characters/:characterId/combat
```

Returns only the character's active combat session.

If no active session exists, the API returns:

```txt
COMBAT_SESSION_NOT_FOUND
```

### Specific session

```http
GET /characters/:characterId/combat/:combatSessionId
```

Returns an owned active or completed combat session.

Foreign or unavailable sessions return the same not-found response.

### Combat log

```http
GET /characters/:characterId/combat/:combatSessionId/log
```

Returns the complete ordered persistent event log for an owned session.

## Randomness and time

Production combat uses:

```ts
CryptoRandomSource
```

It implements:

```ts
interface RandomSource {
  nextFloat(): number;

  nextInt(
    minimum: number,
    maximum: number
  ): number;
}
```

Production combat does not use `Math.random()`.

Application services receive time through `Clock`.

The pure M4 combat engine remains independent from PostgreSQL, HTTP, system time, and cryptographic APIs.

## Error handling

Stable application errors cover:

- missing or foreign characters,
- missing or foreign combat sessions,
- an existing active combat,
- stale expected turns,
- insufficient Energy,
- depleted character Health,
- ineligible monsters,
- invalid persistent combat state,
- malformed HTTP requests,
- unsupported actions,
- authentication failure.

HTTP errors use the existing application error mapper.

## Concurrency guarantees

M5 guarantees:

- one active combat per character,
- one Energy deduction per successful combat start,
- concurrent starts cannot create duplicate sessions,
- concurrent actions cannot resolve the same turn twice,
- stale actions are rejected after lock acquisition,
- session updates and event inserts are atomic,
- terminal Health synchronization is atomic,
- failed transactions roll back all related changes.

## Implemented module structure

```txt
src/modules/combat/
+-- application/
|   +-- combat-session.errors.ts
|   +-- combat-session.models.ts
|   +-- combat-session.repository.ts
|   +-- get-active-combat.service.ts
|   +-- get-combat-log.service.ts
|   +-- get-combat-session.service.ts
|   +-- resolve-combat-action.service.ts
|   +-- start-combat.service.ts
+-- domain/
|   +-- combat-attack.ts
|   +-- combat-effects.ts
|   +-- combat-engine.ts
|   +-- combat-validation.ts
|   +-- combat.constants.ts
|   +-- combat.errors.ts
|   +-- combat.types.ts
+-- http/
|   +-- combat-http.handler.ts
|   +-- combat-http.request.ts
+-- infrastructure/
|   +-- crypto-random-source.ts
|   +-- postgres-combat.mapper.ts
|   +-- postgres-combat-session.repository.ts
+-- ports/
    +-- random-source.ts
```

## Verification

Verified during M5 completion:

- PostgreSQL connection passed.
- Database contains 80 tables.
- 88 migrations are applied.
- 0 migrations are pending.
- TypeScript typecheck passed.
- Production build passed.
- 60 test files passed.
- 361 tests passed.
- Combat unit tests passed.
- PostgreSQL integration tests passed.
- HTTP integration tests passed.
- Transaction rollback tests passed.
- Concurrent combat-start tests passed.
- Concurrent combat-action tests passed.
- Full five-endpoint authenticated combat flow passed.
- Full regression suite passed.
- No whitespace errors were detected.
- The M5 branch was pushed and synchronized with `origin/m5/persistent-combat-api`.

## Out of scope

The following remain outside M5:

- victory rewards,
- Experience rewards,
- Gold rewards,
- loot generation,
- death penalties,
- blessing consumption,
- monster kill statistics,
- Bestiary progression,
- Task Boss progression,
- monster cooldown writes,
- final combat summaries in `combat_logs`,
- player spells,
- combat consumables,
- monster abilities,
- buffs and debuffs,
- damage and healing over time,
- multiple targets,
- escape,
- combat abandonment.

## Completion log

M5 Persistent Combat API completed and verified.

The next milestone is M6: Victory, Death, and Progression.
```

# ============================================================
# SOURCE: documentation/game-design/MASTER_PROJECT_PLAN.md
# ============================================================

```text
# OSTATNIA SZANSA: V1 MASTER PROJECT PLAN

## PROJECT OBJECTIVE

Deliver a playable browser-based RPG where the player can:

Create Character
â†’ Fight Monsters
â†’ Gain Experience, Gold, Items, and Materials
â†’ Equip and Improve Items
â†’ Use Spells and Consumables
â†’ Craft Items
â†’ Gather Materials Offline
â†’ Trade Through the Marketplace
â†’ Fight Bosses
â†’ Complete Achievements and Collections
â†’ Participate in Seasonal Competition

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
â†’ Combat
â†’ Rewards
â†’ Equipment
â†’ Increased Power
â†’ Stronger Combat

---

## M1: CHARACTER FOUNDATION

### Status

Completed.

### Objective

Deliver a production-ready character foundation supporting authenticated character creation, character listing, gameplay-ready snapshot retrieval, deterministic resource regeneration, and character archiving.

### Implemented scope

- Shared application-error foundation.
- Injectable `Clock` abstraction.
- PostgreSQL transaction helper.
- Character domain constants and types.
- Character-name normalization and validation.
- Deterministic resource regeneration.
- Character repository contract.
- PostgreSQL character persistence and mapping.
- Transactional creation of the complete character graph.
- Character creation service.
- Character listing service.
- Character snapshot service.
- Character archiving service.
- HTTP JSON utilities.
- HTTP request parsing and error mapping.
- PostgreSQL-backed session authentication.
- Four authenticated character endpoints.
- Node.js HTTP server bootstrap.
- Production TypeScript build.
- Unit, integration, authorization, rollback, and manual smoke tests.

### Architecture

The character feature is separated into:

- Domain,
- Application,
- Infrastructure,
- HTTP.

Domain logic does not depend on PostgreSQL or HTTP.

Application services depend on the `CharacterRepository` contract.

PostgreSQL queries and database mapping remain in the infrastructure layer.

HTTP handlers authenticate requests, parse input, invoke application services, and map application errors to stable JSON responses.

### Initial character state

A newly created character starts with:

- Level: `1`
- Experience: `0`
- Gold: `0`
- Health: `180 / 180`
- Mana: `35 / 35`
- Energy: `100 / 100`
- Base Attack: `7`
- Base Defense: `7`
- Base Spell Power: `100%`
- Spell Slots: `1`
- Inventory Capacity: `50`
- Crafting Level: `1`
- Crafting Experience: `0`
- Gathering Level: `1`
- Gathering Experience: `0`
- Crafting Slots: `1`
- Promotion: `false`
- Archived: `false`

### Character-name rules

Character names:

- are globally unique after normalization,
- contain from `3` through `24` characters,
- support Unicode letters,
- may contain single spaces,
- may contain apostrophes,
- may contain hyphens,
- have leading and trailing whitespace removed,
- have repeated spaces collapsed.

Character names reject:

- digits,
- underscores,
- invalid separator placement,
- duplicate normalized names.

### Character creation transaction

Character creation is atomic.

The transaction:

1. Locks the account row using `FOR UPDATE`.
2. Validates that the account is active.
3. Counts active characters.
4. Rejects creation when the account already has three active characters.
5. Normalizes and validates the character name.
6. Creates the character.
7. Creates character statistics.
8. Creates character unlock records.
9. Creates character spell-mastery state.
10. Creates the default spell loadout.
11. Creates the default equipment loadout.
12. Initializes mandatory progression data.
13. Commits the complete character graph.

If any operation fails, the entire transaction is rolled back.

### Character limit and archiving

- An account may have a maximum of three active characters.
- Archived characters do not consume active character slots.
- Only active characters owned by the authenticated account may be archived.
- Archiving does not delete character progression.
- Archiving frees one active character slot.
- An already archived character cannot be archived again through the active-character operation.

### Ownership isolation

Repository operations are scoped by:

- `account_id`,
- `character_id`.

The HTTP API does not accept an account ID from the client.

The authenticated session is the only source of `accountId`.

A user cannot retrieve, modify, or archive another accountâ€™s character.

### Authentication

The character API accepts:

```http
Authorization: Bearer <session-token>
```

Raw session tokens are hashed with SHA-256 before database lookup.

Authentication rejects:

- missing authorization,
- malformed authorization,
- unknown sessions,
- expired sessions,
- revoked sessions,
- sessions belonging to non-active accounts.

Successful authentication updates `last_activity_at`.

Registration, login, token creation, token refresh, logout, and password verification remain outside M1.

### Resource regeneration

Resource regeneration is deterministic and uses an injected `Clock`.

Rules:

- only complete elapsed minutes are applied,
- resources never exceed their maximum values,
- partial-minute progress is preserved,
- the same elapsed interval cannot be applied twice,
- archived characters do not regenerate.

M1 regeneration defaults:

- Health: `0` per minute,
- Mana: `0` per minute,
- Energy: `1` per minute.

The `resources_updated_at` timestamp records the authoritative regeneration checkpoint.

### Numeric and JSON mapping

PostgreSQL progression values stored as `bigint` map to JavaScript `bigint`.

Resource values map to JavaScript `number` after safe-integer validation.

HTTP JSON serializes JavaScript `bigint` values as decimal strings.

### Implemented endpoints

```http
POST /characters
GET /characters
GET /characters/:characterId
POST /characters/:characterId/archive
```

All endpoints require authentication.

#### Create character

```http
POST /characters
```

Creates the complete character graph and returns:

```http
201 Created
```

#### List characters

```http
GET /characters
```

Returns characters belonging to the authenticated account.

#### Get character snapshot

```http
GET /characters/:characterId
```

Returns an account-scoped gameplay snapshot.

The snapshot includes the characterâ€™s persistent resources and progression data required by the implemented foundation.

Effective Character Statistics were integrated later in M2.

#### Archive character

```http
POST /characters/:characterId/archive
```

Archives an active character owned by the authenticated account.

### HTTP behavior

The API uses the built-in `node:http` server.

HTTP infrastructure provides:

- consistent JSON responses,
- JSON request parsing,
- a maximum request-body size of `16,384` bytes,
- stable application-error responses,
- generic responses for unexpected internal errors.

Production compilation uses `tsconfig.build.json`.

Only production source files are included in `dist`; tests are excluded.

### Stable errors

M1 includes stable errors such as:

- `400 INVALID_JSON_BODY`
- `400 INVALID_HTTP_REQUEST`
- `400 CHARACTER_NAME_INVALID`
- `401 AUTHENTICATION_REQUIRED`
- `403 CHARACTER_ACCESS_DENIED`
- `404 CHARACTER_NOT_FOUND`
- `404 ROUTE_NOT_FOUND`
- `409 CHARACTER_NAME_TAKEN`
- `409 CHARACTER_LIMIT_REACHED`
- `409 CHARACTER_ALREADY_ARCHIVED`
- `413 REQUEST_BODY_TOO_LARGE`
- `500 INTERNAL_SERVER_ERROR`

### Database tables involved

Primary M1 tables include:

- `accounts`
- `account_sessions`
- `characters`
- `character_statistics`
- `character_unlocks`
- `character_spell_mastery`
- `character_loadouts`
- `equipment_loadouts`

Referenced tables include:

- `seasons`
- `spells`
- `items`
- `monsters`
- `bosses`

### Schema support

M1 used the existing character-related schema and added:

```text
080_character_foundation_support.sql
```

The migration added foundation support including:

- the resource-regeneration checkpoint,
- normalized-name support required by character-name uniqueness.

The M1 database verification detected `78` tables at completion.

Later milestones added further migrations and tables.

### Implemented files

```text
src/modules/characters/
â”œâ”€â”€ application/
â”‚   â”œâ”€â”€ archive-character.service.ts
â”‚   â”œâ”€â”€ character.repository.ts
â”‚   â”œâ”€â”€ create-character.service.ts
â”‚   â”œâ”€â”€ get-character-snapshot.service.ts
â”‚   â””â”€â”€ list-characters.service.ts
â”œâ”€â”€ domain/
â”‚   â”œâ”€â”€ character.constants.ts
â”‚   â”œâ”€â”€ character.errors.ts
â”‚   â”œâ”€â”€ character.types.ts
â”‚   â”œâ”€â”€ character-name.ts
â”‚   â””â”€â”€ resource-regeneration.ts
â”œâ”€â”€ http/
â”‚   â”œâ”€â”€ character-http.handler.ts
â”‚   â””â”€â”€ character-http.request.ts
â””â”€â”€ infrastructure/
    â”œâ”€â”€ postgres-character.mapper.ts
    â””â”€â”€ postgres-character.repository.ts
```

Shared M1 infrastructure also includes:

- application errors,
- PostgreSQL transaction handling,
- system clock,
- HTTP authentication,
- HTTP JSON handling,
- HTTP error mapping,
- application composition,
- server bootstrap.

Files related to effective statistics and equipment repositories were added or expanded in M2 and are documented under M2 rather than M1.

### Verification

M1 completion verified:

- transactional character creation,
- complete graph rollback,
- active-character limit enforcement,
- normalized global name uniqueness,
- account ownership isolation,
- character creation,
- character listing,
- character snapshot retrieval,
- deterministic resource regeneration,
- character archiving,
- PostgreSQL session authentication,
- HTTP request parsing,
- HTTP error mapping,
- authenticated character routes,
- production TypeScript compilation,
- manual unauthenticated-request behavior,
- manual unknown-route behavior.

Verification results recorded at M1 completion:

- TypeScript typecheck passed.
- Production build passed.
- PostgreSQL connectivity passed.
- `78` database tables were detected.
- Authored-content validation passed for `29` worksheets and `248` rows.
- Unit tests passed.
- Integration tests passed.
- Authorization tests passed.
- Transaction rollback tests passed.
- Manual unauthenticated request returned HTTP `401`.
- Manual unknown route returned HTTP `404`.

### Completion commits

```text
3721e29  Prepare character foundation schema and test infrastructure
398e47b  Add shared application and transaction foundation
653e59b  Add character domain rules and resource regeneration
c531a3d  Add PostgreSQL character persistence
aa8cba8  Add character application services
b6da8c3  Add authenticated character HTTP API
5f06d5f  Complete M1 character foundation milestone
```

### Definition of done

- [x] Character domain rules and initial values defined.
- [x] Character-name normalization and validation implemented.
- [x] Maximum of three active characters enforced.
- [x] Archived characters excluded from the active-character limit.
- [x] Account ownership isolation enforced.
- [x] Character creation implemented transactionally.
- [x] Complete character-graph rollback verified.
- [x] Character listing implemented.
- [x] Character snapshot retrieval implemented.
- [x] Deterministic resource regeneration implemented.
- [x] Resource maxima enforced.
- [x] Character archiving implemented.
- [x] PostgreSQL session authentication implemented.
- [x] Four authenticated HTTP endpoints implemented.
- [x] Unit and integration tests passed.
- [x] Authorization and rollback tests passed.
- [x] TypeScript typecheck passed.
- [x] Production build passed.
- [x] PostgreSQL connectivity verified.
- [x] Manual HTTP smoke tests passed.
- [x] M1 documentation completed.

### Out of scope

The following remained outside M1:

- registration,
- login,
- password verification,
- session-token creation,
- token refresh,
- logout,
- character deletion,
- character restoration,
- character renaming,
- character selection state,
- authoritative Effective Character Statistics,
- combat,
- monster discovery,
- inventory operations,
- equipment changes,
- spells,
- crafting,
- gathering,
- achievements,
- frontend implementation,
- deployment automation,
- rate limiting,
- HTTPS termination.

### Completion log

M1 Character Foundation completed and verified.

M2 continues the character module with the authoritative Effective Character Statistics system.

---

## M2: EFFECTIVE CHARACTER STATISTICS

### Status

Completed.

### Objective

Provide one authoritative and deterministic calculator for effective character statistics.

The calculator is used by character snapshots, equipment operations, combat preparation, and future reward or progression systems.

### Implemented scope

- Normalized Spell Power representation.
- Pure effective-statistics domain calculator.
- Character-level Health and Mana progression.
- Character-level Energy progression.
- Spell Mastery contribution.
- Equipped item base statistics.
- Equipped item affixes.
- Set bonuses.
- Completed account achievement bonuses.
- Active Gold and Experience progression boosts.
- Optional combat-context modifiers.
- PostgreSQL calculation-source repository.
- Central statistics application service.
- Character snapshot integration.
- Resource maximum synchronization.
- Current-resource hard clamping.
- Transactional equipment operations.
- Equipment ownership and level validation.
- Equipment-slot replacement.
- Two-handed weapon and Shield conflict handling.
- Unit and PostgreSQL integration coverage.

### Central application service

The authoritative application entry point is:

```ts
CalculateCharacterStatsService.execute({
  characterId
})
```

The application service:

1. Loads authoritative calculation sources from the repository.
2. Rejects a missing character.
3. Passes the sources to the pure domain calculator.
4. Returns the final effective statistics.

### Effective statistics

The calculator returns:

```ts
type EffectiveCharacterStatistics = {
  attack: number;
  defense: number;
  spellPower: number;
  maximumHealth: number;
  maximumMana: number;
  maximumEnergy: number;
  goldBonusPercent: number;
  experienceBonusPercent: number;
};
```

### Calculation sources

Implemented sources:

- base character statistics,
- character level,
- Spell Mastery Power,
- equipped item base statistics,
- equipped item affixes,
- highest reached set-bonus threshold,
- completed account achievement bonuses,
- active Gold progression boosts,
- active Experience progression boosts,
- optional combat-context modifiers.

There is no separate permanent-character-bonus source in M2.

An experimental permanent-bonus implementation was added and then reverted during development.

### Calculation model

```text
Base Character Statistics
+ Character Level Progression
+ Spell Mastery Power
+ Equipped Item Base Statistics
+ Equipped Item Affixes
+ Active Set Bonuses
+ Completed Achievement Bonuses
+ Active Progression Boosts
+ Optional Combat Modifiers
= Effective Character Statistics
```

### Base statistics

At level `1`, without external modifiers:

```text
Attack:             7
Defense:            7
Spell Power:        100
Maximum Health:     180
Maximum Mana:       35
Maximum Energy:     100
Gold Bonus:         0%
Experience Bonus:   0%
```

### Level progression

Character level affects maximum resources.

Health and Mana progression begins from level `2`.

Maximum Energy follows level thresholds and is capped.

Verified Energy values include:

```text
Level 1:    100
Level 19:   100
Level 20:   110
Level 30:   115
Level 40:   120
Level 100:  150
Level 150:  175
Level 200:  200
Level 201:  200
```

Character level must be a positive safe integer.

### Spell Power

Spell Power uses one normalized numeric representation.

Migration `081_effective_character_statistics.sql` renamed:

```text
current_spell_power_percent
```

to:

```text
current_spell_power
```

The migration also replaced the previous check constraint with a constraint requiring non-negative Spell Power.

Spell Mastery Power contributes directly to effective Spell Power.

Negative Spell Mastery Power is rejected.

### Equipment statistics

Only inventory items where:

```sql
inventory_items.is_equipped = TRUE
```

contribute to effective statistics.

Unequipped items are ignored.

Equipment contributions include:

- Attack,
- Defense,
- Spell Power,
- maximum Health,
- maximum Mana,
- maximum Energy,
- Gold Bonus percentage points,
- Experience Bonus percentage points.

### Item affixes

Affix roll values from equipped items contribute to the matching statistic.

Affixes attached to unequipped items are ignored.

Item-base statistics and affix statistics are added together before the final calculation.

### Set bonuses

Set bonuses are calculated from equipped set pieces.

When several thresholds exist for the same set and bonus type, only the highest reached threshold is applied.

Example:

```text
2 pieces: +10 Attack
4 pieces: +20 Attack
```

With four equipped pieces, the result is:

```text
+20 Attack
```

The lower threshold is not added again.

### Achievement bonuses

Only completed achievements contribute bonuses.

Incomplete achievements are ignored.

Achievement bonuses are account-wide and affect each character belonging to that account.

Implemented achievement contributions include:

- Attack,
- Defense,
- Gold Bonus percentage points,
- Experience Bonus percentage points.

### Progression boosts

M2 supports active progression boosts for:

- Gold Bonus,
- Experience Bonus.

Valid progression boosts may use permanent, time-based, or fight-based duration data according to their stored definition.

Expired boosts are ignored.

Combat-turn buffs and debuffs are not included in a normal out-of-combat character snapshot.

### Combat modifiers

The pure calculator accepts optional combat-context modifiers for:

- Attack,
- Defense,
- Spell Power.

Combat modifiers are kept separate from persistent progression boosts.

M2 does not load active combat effects into the normal character snapshot.

Combat modifiers are supplied explicitly by a combat context when required.

Final combat statistics cannot fall below `0`.

This minimum applies to:

- Attack,
- Defense,
- Spell Power.

### Percentage bonuses

Gold and Experience bonuses are additive percentage points.

Example:

```text
Equipment Gold Bonus:      20
Achievement Gold Bonus:     5
Progression Gold Bonus:    15
Final Gold Bonus:          40
```

The calculator does not multiply individual percentage sources.

### Numeric rules

- Character level must be a positive safe integer.
- Spell Mastery Power must be non-negative.
- Persistent calculation sources must contain finite, non-negative numeric values.
- Invalid database values are rejected.
- Final integer combat and resource statistics are rounded down.
- Attack cannot be lower than `0`.
- Defense cannot be lower than `0`.
- Spell Power cannot be lower than `0`.
- Gold and Experience bonuses are returned as additive percentage points.

### Determinism and immutability

The domain calculator is deterministic.

Repeated calculations with identical input return identical output.

The calculator does not mutate its input.

Final-statistic formulas do not depend on:

- PostgreSQL,
- HTTP,
- system time,
- randomness.

### Architecture

The implementation is separated into:

- pure domain calculation,
- calculation-source repository contract,
- PostgreSQL calculation-source repository,
- central application service,
- character snapshot integration,
- transactional equipment repository.

Final-statistic formulas exist only in the domain calculator.

Controllers do not calculate statistics.

PostgreSQL repositories load and aggregate authoritative source data but do not own final-statistic formulas.

### Character snapshot integration

The character snapshot uses `CalculateCharacterStatsService`.

The snapshot returns effective statistics together with persistent character data.

The snapshot flow:

1. Loads the owned character snapshot.
2. Calculates current effective statistics.
3. Replaces stored resource maximums with effective maximums.
4. Clamps current resources if a maximum decreased.
5. Applies deterministic resource regeneration for active characters.
6. Persists resource changes when required.
7. Returns the updated snapshot with effective statistics.

Archived characters receive effective statistics but do not regenerate resources.

### Resource synchronization

Effective maximums control:

- maximum Health,
- maximum Mana,
- maximum Energy.

When an effective maximum decreases, the current value is hard-clamped:

```text
currentHealth <= maximumHealth
currentMana   <= maximumMana
currentEnergy <= maximumEnergy
```

Clamping is persisted even when no complete regeneration minute has elapsed.

### Equipment operations

M2 introduced transactional equipment operations through `PostgresEquipmentRepository`.

Implemented operations:

- equip an owned inventory item,
- unequip an equipped inventory item.

Each operation:

1. Begins a PostgreSQL transaction.
2. Locks the owned active character.
3. Locks the selected inventory item.
4. Validates item ownership.
5. Validates the character level requirement.
6. Applies equipment-slot rules.
7. Updates equipped-state records.
8. Recalculates effective statistics.
9. Persists new maximum resources.
10. Hard-clamps current resources if required.
11. Commits the transaction.
12. Returns updated equipment state, effective statistics, and resources.

Any failure rolls back the whole operation.

### Equipment-slot rules

- Equipping an item replaces the currently equipped item in the same slot.
- Equipping a two-handed weapon automatically unequips the Shield.
- Equipping a Shield automatically unequips an equipped two-handed weapon.
- Item level requirements are validated before equipment state changes.
- An invalid equipment operation does not alter the currently equipped items.
- Resource maxima and current-resource clamps are persisted in the same transaction as the equipment change.

### Item handedness

Migration `082_add_item_handedness.sql` added explicit item handedness required by equipment conflict handling.

Supported weapon-handedness behavior includes:

- one-handed weapons,
- two-handed weapons,
- two-handed weapon and Shield mutual exclusion.

### Stable equipment errors

M2 added equipment-specific application errors, including rejection of items whose required level exceeds the character level.

Verified error code:

```text
EQUIPMENT_LEVEL_REQUIRED
```

Invalid operations leave equipment and resources unchanged.

### Database tables involved

Primary calculation sources include:

- `characters`
- `character_spell_mastery`
- `inventory_items`
- `items`
- `item_bases`
- `item_affixes`
- `affix_templates`
- `set_templates`
- `set_bonuses`
- `achievements`
- `achievement_progress`
- `character_buffs`

### Implemented files

```text
src/modules/characters/
â”œâ”€â”€ application/
â”‚   â”œâ”€â”€ calculate-character-stats.service.ts
â”‚   â”œâ”€â”€ character-statistics.repository.ts
â”‚   â”œâ”€â”€ equipment.repository.ts
â”‚   â””â”€â”€ get-character-snapshot.service.ts
â”œâ”€â”€ domain/
â”‚   â””â”€â”€ effective-character-statistics.ts
â””â”€â”€ infrastructure/
    â”œâ”€â”€ postgres-character-statistics.repository.ts
    â””â”€â”€ postgres-equipment.repository.ts
```

M2 also updated:

- character constants,
- character errors,
- character types,
- character snapshot composition,
- application dependency composition,
- PostgreSQL character mapping,
- database-design documentation.

### Schema changes

M2 added:

```text
081_effective_character_statistics.sql
082_add_item_handedness.sql
```

Migration `081`:

- normalized the Spell Power column name,
- enforced non-negative Spell Power.

Migration `082`:

- added item handedness,
- enabled authoritative two-handed weapon and Shield conflict handling.

### Test coverage

Automated coverage includes:

- level `1` base statistics,
- Health and Mana level progression,
- Energy progression thresholds,
- Energy cap,
- Spell Mastery Power,
- equipped item statistics,
- ignored unequipped items,
- equipped item affixes,
- ignored affixes from unequipped items,
- highest reached set-bonus threshold,
- completed achievements,
- ignored incomplete achievements,
- active Gold progression boosts,
- active Experience progression boosts,
- ignored combat buffs outside combat,
- ignored expired buffs,
- optional combat modifiers,
- zero minimum for combat statistics,
- additive Gold and Experience percentage points,
- deterministic repeated calculations,
- input immutability,
- invalid character level,
- invalid Spell Mastery Power,
- invalid persistent numeric sources,
- missing characters,
- character snapshot integration,
- resource hard clamping,
- transactional equip operations,
- transactional unequip operations,
- same-slot replacement,
- two-handed weapon and Shield conflicts,
- equipment level rejection,
- rollback-safe equipment behavior.

### Completion commits

```text
d54fa19  Normalize spell power model for M2
3500fad  Add M2 effective character statistics foundation
96dd873  Implement effective character statistics
2c4ff41  Add achievement bonuses to effective statistics
70a4c75  Add active buffs to effective statistics
4fac0c3  Add permanent bonuses to effective statistics
5d4e219  Revert permanent bonuses from effective statistics
17a90fc  Integrate effective statistics with character snapshot
ba11478  Separate progression boosts from combat modifiers
03d8c5c  Finalize effective statistics behavior
bfd1efb  Update current milestone for M2
0082bd4  Add item handedness for equipment conflicts
4a762c2  Add equipment mutation contract and errors
e1b1b7f  Implement transactional equipment repository
342ea37  Add transactional equip and unequip operations
4637546  Complete M2 effective character statistics
```

### Definition of done

- [x] One central effective-statistics calculator exists.
- [x] All eight effective statistics are implemented.
- [x] Character level progression is included.
- [x] Spell Mastery Power is included.
- [x] Equipped item base statistics are included.
- [x] Equipped item affixes are included.
- [x] Unequipped items are ignored.
- [x] Highest reached set-bonus thresholds are applied.
- [x] Completed achievement bonuses are included.
- [x] Incomplete achievements are ignored.
- [x] Active Gold and Experience boosts are included.
- [x] Combat modifiers are separated from progression boosts.
- [x] Combat statistics cannot fall below zero.
- [x] Calculations are deterministic.
- [x] Calculator input is not mutated.
- [x] Character snapshots use the central calculator.
- [x] Effective resource maxima are synchronized.
- [x] Current resources are hard-clamped safely.
- [x] Equip operations are transactional.
- [x] Unequip operations are transactional.
- [x] Same-slot replacement is implemented.
- [x] Two-handed weapon and Shield conflicts are implemented.
- [x] Equipment level requirements are enforced.
- [x] Failed equipment operations preserve previous state.
- [x] Unit tests pass.
- [x] PostgreSQL integration tests pass.
- [x] TypeScript typecheck passes.
- [x] Production build passes.
- [x] Database verification passes.
- [x] M2 documentation is completed.

### Out of scope

The following remained outside M2:

- HTTP inventory endpoints,
- HTTP equipment endpoints,
- inventory capacity operations,
- item generation,
- loot generation,
- item rarity generation,
- affix generation,
- item upgrading,
- item rerolling,
- item salvaging,
- marketplace operations,
- final combat calculations,
- persistent combat sessions,
- spells and spell effects,
- combat consumables,
- victory rewards,
- Experience awards,
- Gold awards,
- death penalties.

The equipment repository implemented the transactional mutation foundation required by later inventory and equipment APIs, but M2 did not expose those operations through HTTP.

### Completion log

M2 Effective Character Statistics completed and verified.

M3 uses the completed character foundation and effective-statistics architecture while implementing Monster Discovery and Eligibility.

---

## M3: MONSTER DISCOVERY AND ELIGIBILITY

### Status

Completed.

### Objective

Provide authenticated, read-only monster discovery and eligibility evaluation for a character owned by the authenticated account.

M3 allows the client to discover monsters, inspect public monster details, preview Energy costs, and understand whether a monster can currently be fought.

### Implemented scope

- Authenticated monster-list endpoint.
- Authenticated monster-details endpoint.
- Character ownership enforcement.
- Stable monster-code lookup.
- Character-level eligibility.
- Energy-cost preview.
- Monster-type distinction.
- Character-specific cooldown calculation.
- Character-specific Bestiary visibility.
- Normal Monster eligibility.
- Mini Boss eligibility.
- Task Boss lifecycle eligibility.
- Daily Boss rotation eligibility.
- Daily Boss attempt eligibility.
- Deterministic time handling through `Clock`.
- PostgreSQL discovery repository.
- PostgreSQL row validation and mapping.
- Stable public application models.
- HTTP request parsing and error mapping.
- Unit, PostgreSQL integration, and HTTP integration tests.
- Tracked database migration runner.

### Implemented endpoints

```http
GET /characters/:characterId/monsters
GET /characters/:characterId/monsters/:monsterCode
```

Both endpoints require authentication.

Both endpoints validate that the selected character belongs to the authenticated account.

### Monster list

```http
GET /characters/:characterId/monsters
```

Returns discovery entries for monsters visible to the owned character.

The list may include monsters that are currently unavailable.

Each entry contains public discovery information, including:

- stable monster code,
- display name,
- monster type,
- monster level,
- Energy cost,
- eligibility state,
- ineligibility reason when applicable,
- cooldown state when applicable,
- Bestiary visibility state.

Higher-level monsters may remain visible but are reported as unavailable.

### Monster details

```http
GET /characters/:characterId/monsters/:monsterCode
```

Loads a monster by its stable public code.

The endpoint:

- validates character ownership,
- rejects an unknown monster code,
- returns public monster details,
- includes the current eligibility result,
- includes Energy-cost preview,
- does not expose unnecessary internal database identifiers.

### Stable monster codes

Public monster lookup uses:

```text
monsterCode
```

Internal database IDs are not used as public monster identifiers.

Stable codes allow authored monster definitions to be referenced without coupling clients to PostgreSQL UUIDs.

### Basic level requirement

The basic level rule is:

```text
character.level >= monster.level
```

When the character level is lower than the monster level:

```text
eligible = false
reason = LEVEL_TOO_LOW
```

The monster may still appear in discovery results.

### Supported monster types

M3 supports:

- `Normal`
- `MiniBoss`
- `TaskBoss`
- `DailyBoss`

Eligibility rules depend on the monster type.

### Eligibility result

Discovery returns a stable eligibility result containing:

- whether the monster is currently eligible,
- the specific reason when it is unavailable.

Implemented ineligibility reasons:

- `LEVEL_TOO_LOW`
- `COOLDOWN_ACTIVE`
- `TASK_PROGRESS_INCOMPLETE`
- `TASK_REUNLOCK_REQUIRED`
- `DAILY_BOSS_UNAVAILABLE`
- `DAILY_ATTEMPTS_EXHAUSTED`

### Normal Monster eligibility

A Normal Monster requires:

- the character level requirement to be satisfied,
- no active character-and-monster cooldown.

Cooldowns are specific to:

- one character,
- one monster.

A cooldown belonging to another character does not affect eligibility.

### Mini Boss eligibility

A Mini Boss requires:

- the character level requirement to be satisfied,
- no active character-and-monster cooldown.

Mini Boss cooldown eligibility uses the same deterministic cooldown model as Normal Monsters.

### Cooldown model

Cooldown state is calculated from:

- the authoritative cooldown timestamp,
- the current time supplied through `Clock`.

The eligibility layer does not call `Date.now()` directly.

When a cooldown is active:

```text
eligible = false
reason = COOLDOWN_ACTIVE
```

When the cooldown expires, the monster becomes eligible if all other rules pass.

M3 reads cooldown state but does not create or update cooldown records.

### Task Boss eligibility

A Task Boss requires:

- the character level requirement to be satisfied,
- a matching monster task,
- the required Task Boss lifecycle state.

Task statuses:

- `ACTIVE`
- `UNLOCKED`
- `WAITING_FOR_REUNLOCK`

Eligibility behavior:

```text
ACTIVE
â†’ TASK_PROGRESS_INCOMPLETE

UNLOCKED
â†’ eligible

WAITING_FOR_REUNLOCK
â†’ TASK_REUNLOCK_REQUIRED
```

An ordinary monster cooldown does not affect Task Boss eligibility.

### Task Boss assignment

Each Task Boss has exactly one associated monster task.

A specific source monster unlocks a specific Task Boss.

Family-wide task aggregation is not implemented in M3.

Migration `085_unique_monster_task_boss.sql` enforces unique Task Boss assignment.

### Task-status schema

M3 replaced the earlier Boolean task-unlock representation with an explicit lifecycle status.

Migration:

```text
084_task_status_refactor.sql
```

The explicit status allows discovery to distinguish:

- unfinished task progress,
- unlocked Task Boss access,
- the need to pay or satisfy a re-unlock condition.

### Daily Boss eligibility

A Daily Boss requires:

- the character level requirement to be satisfied,
- membership in the currently active rotation,
- at least one remaining attempt for the character in that rotation.

An ordinary monster cooldown does not affect Daily Boss eligibility.

If the boss is outside the active rotation:

```text
eligible = false
reason = DAILY_BOSS_UNAVAILABLE
```

If the character has exhausted attempts:

```text
eligible = false
reason = DAILY_ATTEMPTS_EXHAUSTED
```

### Daily Boss rotation

Daily Boss eligibility is based on an explicit rotation window.

A rotation is active when:

```text
created_at <= observedAt
AND reset_timestamp > observedAt
```

The reset hour is configured in UTC through:

```text
DAILY_BOSS_RESET_HOUR_UTC
```

The active rotation contains one Daily Boss definition for each supported tier:

- Tier 1,
- Tier 2,
- Tier 3.

Multiple active rotations are treated as invalid configuration rather than silently selecting one.

### Daily Boss attempts

Attempts are character-specific and rotation-specific.

Migration:

```text
087_daily_boss_attempt_rotation.sql
```

M3 changed Daily Boss attempt tracking from date-based identity to rotation-based identity.

A characterâ€™s attempts in one rotation do not affect another rotation.

M3 reads attempt state but does not consume attempts.

### Bestiary visibility

Discovery includes character-specific Bestiary visibility.

Bestiary state is loaded for the selected character.

One characterâ€™s Bestiary visibility does not affect another character.

M3 reads Bestiary state but does not create or update Bestiary records.

### Energy-cost preview

Every discovery result exposes the authoritative Energy cost required to start combat with that monster.

Migration:

```text
083_add_monster_energy_cost.sql
```

The client may display the Energy cost before combat begins.

M3 does not:

- validate the characterâ€™s current Energy balance for combat start,
- deduct Energy,
- reserve Energy.

Energy validation and deduction belong to M5 combat start.

### Server authority

The server controls:

- character ownership,
- character level,
- monster level,
- monster type,
- stable monster code,
- Energy cost,
- cooldown timestamps,
- Task Boss state,
- Daily Boss rotation,
- Daily Boss attempts,
- Bestiary visibility,
- observed time.

The client cannot author or override eligibility results.

### Architecture

The monster discovery feature is separated into:

- Domain,
- Application,
- Infrastructure,
- HTTP.

#### Domain

Contains:

- monster types,
- eligibility rules,
- cooldown calculation,
- stable eligibility reasons,
- domain errors.

#### Application

Contains:

- monster-list service,
- monster-details service,
- public discovery models,
- discovery repository contract,
- Task Boss eligibility coordination,
- Daily Boss eligibility coordination.

#### Infrastructure

Contains:

- PostgreSQL discovery queries,
- row models,
- row validation,
- PostgreSQL-to-domain mapping,
- character-specific discovery data loading.

#### HTTP

Contains:

- authenticated route handling,
- path parsing,
- application-service invocation,
- JSON response serialization,
- stable error mapping.

HTTP handlers do not:

- execute SQL,
- calculate cooldowns,
- evaluate eligibility rules directly,
- mutate discovery data.

### Implemented module structure

```text
src/modules/monsters/
â”œâ”€â”€ application/
â”‚   â”œâ”€â”€ get-monster-details.service.ts
â”‚   â”œâ”€â”€ get-monster-list.service.ts
â”‚   â”œâ”€â”€ monster-discovery.models.ts
â”‚   â””â”€â”€ monster-discovery.repository.ts
â”œâ”€â”€ domain/
â”‚   â”œâ”€â”€ monster-cooldown.ts
â”‚   â”œâ”€â”€ monster-eligibility.ts
â”‚   â”œâ”€â”€ monster.errors.ts
â”‚   â””â”€â”€ monster.types.ts
â”œâ”€â”€ http/
â”‚   â”œâ”€â”€ monster-http.handler.ts
â”‚   â””â”€â”€ monster-http.request.ts
â””â”€â”€ infrastructure/
    â”œâ”€â”€ postgres-monster-discovery.repository.ts
    â””â”€â”€ postgres-monster.mapper.ts
```

### Database changes

M3 added migrations:

```text
083_add_monster_energy_cost.sql
084_task_status_refactor.sql
085_unique_monster_task_boss.sql
086_daily_boss_rotation_window.sql
087_daily_boss_attempt_rotation.sql
```

These migrations:

- added authoritative monster Energy costs,
- replaced the Boolean Task Boss unlock state with lifecycle status,
- enforced one task assignment per Task Boss,
- enforced Daily Boss rotation windows,
- changed Daily Boss attempt tracking to rotation-based identity.

### Migration runner

M3 introduced a tracked database migration runner.

The runner:

- applies unapplied migrations in order,
- records applied migrations in `schema_migrations`,
- reports migration status,
- allows verification that no migrations remain pending.

At M3 completion:

```text
87 migrations applied
0 migrations pending
```

### Test coverage

Automated coverage includes:

- character-level eligibility,
- higher-level monster ineligibility,
- Normal Monster eligibility,
- Mini Boss eligibility,
- deterministic cooldown calculation,
- active cooldown rejection,
- expired cooldown handling,
- stable-code loading,
- missing-monster handling,
- character ownership isolation,
- public monster-list models,
- public monster-details models,
- PostgreSQL row mapping,
- PostgreSQL row validation,
- character-specific Bestiary visibility,
- Energy-cost preview,
- Task Boss `ACTIVE` state,
- Task Boss `UNLOCKED` state,
- Task Boss `WAITING_FOR_REUNLOCK` state,
- Task Boss cooldown exclusion,
- unique Task Boss assignment,
- Daily Boss active-rotation discovery,
- Daily Boss unavailable outside the active rotation,
- Daily Boss remaining attempts,
- exhausted Daily Boss attempts,
- per-rotation attempt isolation,
- overlapping rotation rejection,
- authenticated list endpoint,
- authenticated details endpoint,
- unauthenticated request rejection.

### M3 test files

```text
tests/integration/http/
â””â”€â”€ monster-discovery.http.test.ts

tests/integration/monsters/
â”œâ”€â”€ daily-boss-discovery.repository.test.ts
â””â”€â”€ postgres-monster-discovery.repository.test.ts

tests/unit/monsters/
â”œâ”€â”€ daily-boss-discovery.service.test.ts
â”œâ”€â”€ daily-boss-eligibility.test.ts
â”œâ”€â”€ get-monster-details.service.test.ts
â”œâ”€â”€ get-monster-list.service.test.ts
â”œâ”€â”€ monster-cooldown.test.ts
â”œâ”€â”€ monster-eligibility.test.ts
â””â”€â”€ task-boss-discovery.service.test.ts
```

Additional HTTP unit coverage exists for monster request parsing and handlers.

### Completion commits

```text
3f84ece  Replace task_unlocked with task_status
30ea6d8  Add monster Energy costs and task-status lifecycle
637240d  Finalize M3 monster discovery preparation
03136a6  Finalize M3 monster discovery preparation
01760e5  Add M3 monster discovery domain contract
9c50aea  Refine M3 monster discovery repository contract
2df79a4  Add monster details service
d65ccfd  Add monster list service
3d63450  Add monster eligibility domain logic
39ee38e  Add monster cooldown domain model
10c8413  Prepare M3 infrastructure layer
b269f2c  Add monster PostgreSQL row models
214c274  Add monster Energy-cost mapping
8cc5551  Add monster discovery repository skeleton
ebd0457  Add monster PostgreSQL mapper
fbe3d4f  Add character-specific monster discovery queries
eca0c02  Test monster discovery repository integration
b1dad30  Add deterministic monster cooldown logic
f3513e1  Implement monster discovery eligibility services
4a4f7aa  Test monster discovery application services
667865e  Add Task Boss eligibility rules
20ea9f8  Enforce one task per Task Boss
f2bf096  Add tracked database migration runner
c2ad486  Define Task Boss unlock semantics
858f4a8  Test Task Boss discovery lifecycle
f2964f2  Implement Task Boss discovery eligibility
f5b06b7  Add configurable Daily Boss reset hour
500039f  Track Daily Boss attempts by rotation
e1f1c6c  Define eligibility rules by monster type
539b557  Add Daily Boss application eligibility
dbebb42  Connect Daily Boss rotation to monster discovery
5e1cada  Test Daily Boss rotation discovery
2629101  Add monster discovery HTTP handler
f8b6b63  Connect monster discovery routes
849b58f  Update database table count after migration tracking
35804ba  Test monster discovery HTTP endpoints
e66e8d0  Complete M3 documentation
```

### Definition of done

- [x] Authenticated monster-list endpoint implemented.
- [x] Authenticated monster-details endpoint implemented.
- [x] Character ownership enforced.
- [x] Monsters loaded by stable code.
- [x] Higher-level monsters reported as unavailable.
- [x] Energy costs exposed as read-only preview data.
- [x] Normal Monster eligibility implemented.
- [x] Mini Boss eligibility implemented.
- [x] Character-specific cooldown state implemented.
- [x] Cooldown calculation uses injected time.
- [x] Character-specific Bestiary visibility implemented.
- [x] Task Boss lifecycle eligibility implemented.
- [x] Task Boss assignment uniqueness enforced.
- [x] Daily Boss active-rotation eligibility implemented.
- [x] Daily Boss attempt eligibility implemented.
- [x] Daily Boss attempts tracked per rotation.
- [x] Overlapping active rotations rejected.
- [x] Public application models hide unnecessary internal data.
- [x] PostgreSQL rows validated before mapping.
- [x] Unit tests passed.
- [x] PostgreSQL integration tests passed.
- [x] HTTP integration tests passed.
- [x] TypeScript typecheck passed.
- [x] Production build passed.
- [x] Migration status verified.
- [x] M3 documentation completed.

### Verification

M3 was verified on `2026-10-07`.

Final M3 results:

- `87` migrations applied.
- `0` migrations pending.
- PostgreSQL connection passed.
- `79` database tables detected.
- TypeScript typecheck passed.
- `42` test files passed.
- `226` tests passed.
- Production build passed.
- Git working tree was clean.

### Out of scope

M3 does not:

- start combat,
- deduct Energy,
- create combat sessions,
- resolve combat actions,
- grant rewards,
- generate loot,
- write monster cooldowns,
- update Bestiary,
- update kill statistics,
- mutate Task Boss progress,
- consume Daily Boss attempts,
- generate Daily Boss rotations,
- mutate Daily Boss rotations.

Discovery is read-only.

Combat start and Energy deduction belong to M5.

Victory, defeat, cooldown recording, Bestiary progression, kill statistics, and Task Boss progression belong to M6 or later milestones.

### Completion log

M3 Monster Discovery and Eligibility completed and verified.

M4 uses the completed discovery and eligibility layer as the foundation for the pure deterministic combat engine.

---

## M4: PURE COMBAT ENGINE

### Status

Completed.

### Objective

Implement deterministic turn-based combat as a pure TypeScript domain module processing one player action at a time.

The engine returns a new immutable combat state together with an ordered list of domain events.

### Public domain interface

```ts
resolveCombatAction(
  state: CombatState,
  action: PlayerAction,
  rng: RandomSource
): CombatResolution
```

### Supported player action

```ts
{
  type: "basic_attack"
}
```

Spells, consumables, escape, and other player actions remain outside M4.

### Implemented scope

- Pure TypeScript combat domain.
- Immutable combat-state transitions.
- Injected `RandomSource`.
- Player and monster `basic_attack`.
- Shared attack resolution.
- Player-first round flow.
- Hit-chance and damage-range calculation.
- Misses and successful zero-damage hits.
- Immediate victory and defeat handling.
- Maximum duration of 100 complete rounds.
- Ordered combat events.
- Dedicated combat-domain errors.
- Combat-state and RNG-output validation.
- Explicit no-op extension point for future active effects.
- Deterministic and immutability tests.

### Combat flow

One turn represents one complete combat round:

```text
Resolve Player Basic Attack
â†’ Stop if Monster Health reaches 0
â†’ Resolve Monster Basic Attack
â†’ Stop if Player Health reaches 0
â†’ Apply Turn-Limit Rule
â†’ Advance Turn if Combat Continues
```

Rules:

1. The player always acts first.
2. The monster does not act after being killed by the player.
3. Combat ends immediately when either combatant reaches zero Health.
4. The turn advances only while combat remains in progress.
5. Terminal combat preserves the number of the round in which it ended.

### Basic attack formulas

```text
hitChancePercent =
  clamp((attackerAttack - defenderDefense) * 4, 5, 90)

minimumDamage =
  max(0, attackerAttack - defenderDefense)

maximumDamage =
  max(0, (attackerAttack - defenderDefense) * 2)
```

Player and monster basic attacks use the same formulas.

### Hit and damage resolution

A hit occurs when:

```text
rng.nextFloat() * 100 < hitChancePercent
```

Hit chance is clamped to the inclusive range from `5%` through `90%`.

When an attack hits, damage is selected from the inclusive range:

```text
minimumDamage <= damage <= maximumDamage
```

A successful hit may deal zero damage. A miss and a successful zero-damage hit remain distinct outcomes.

Health cannot fall below `0`.

### Randomness contract

```ts
interface RandomSource {
  nextFloat(): number;

  nextInt(
    minimum: number,
    maximum: number
  ): number;
}
```

Rules:

- `nextFloat()` must return `0 <= value < 1`.
- `nextInt(minimum, maximum)` uses inclusive bounds.
- Returned integers must remain within the requested range.
- Invalid RNG output causes a dedicated domain error.
- Tests inject controlled random sources.
- M4 does not call `Math.random()`.

### Combat-state validation

- Current Health, maximum Health, Attack, Defense, and turn must be safe integers.
- Maximum Health must be positive.
- Current Health, Attack, and Defense must be non-negative.
- Current Health cannot exceed maximum Health.
- Initial combat turn is `1`.
- Terminal combat cannot resolve another action.
- Invalid state is rejected rather than repaired.

### Immutability and determinism

The engine does not mutate the input state, submitted action, or active-effects collection.

Equivalent state, action, and RNG input produce equivalent results.

### Combat outcomes

Statuses:

```text
InProgress
PlayerVictory
PlayerDefeat
```

Defeat reasons:

```text
PlayerHealthDepleted
TurnLimitExceeded
```

Victory and in-progress combat have no defeat reason. Player defeat requires a valid reason.

### Turn limit

Turn `100` resolves normally:

1. The player attacks.
2. Player victory wins immediately if the monster reaches zero Health.
3. Otherwise, the monster attacks.
4. Health-depletion defeat wins precedence if the player reaches zero Health.
5. If both survive, combat ends in `PlayerDefeat` with `TurnLimitExceeded`.

The engine never begins turn `101`.

### Combat events

Supported ordered events:

```text
AttackResolved
CombatEnded
TurnAdvanced
```

A continuing round emits:

```text
Player AttackResolved
Monster AttackResolved
TurnAdvanced
```

A terminal round emits attack events followed by `CombatEnded`. `TurnAdvanced` is emitted only when combat remains in progress.

### Active-effects extension point

Combat state contains an active-effects collection, but M4 does not implement buffs, debuffs, damage over time, healing over time, effect duration, stacking, or refreshing. The collection remains empty in M4.

### Architectural boundary

M4 does not:

- expose HTTP endpoints,
- access PostgreSQL,
- use repositories,
- authenticate accounts,
- persist sessions, events, or logs,
- deduct Energy,
- calculate effective statistics,
- validate monster discovery eligibility,
- grant rewards or progression,
- write cooldowns, Bestiary, kill, or Task Boss progress,
- read system time,
- call `Math.random()`,
- call `Date.now()`.

`Clock` is not part of the M4 engine interface. M4 receives final combat-ready statistics and requires only state, action, and `RandomSource`.

### Implemented files

```text
src/modules/combat/
â”œâ”€â”€ domain/
â”‚   â”œâ”€â”€ combat-attack.ts
â”‚   â”œâ”€â”€ combat-effects.ts
â”‚   â”œâ”€â”€ combat-engine.ts
â”‚   â”œâ”€â”€ combat-validation.ts
â”‚   â”œâ”€â”€ combat.constants.ts
â”‚   â”œâ”€â”€ combat.errors.ts
â”‚   â””â”€â”€ combat.types.ts
â””â”€â”€ ports/
    â””â”€â”€ random-source.ts
```

M4 contains no application, HTTP, infrastructure, or repository layer.

### Tests

```text
tests/unit/combat/
â”œâ”€â”€ combat-attack.test.ts
â”œâ”€â”€ combat-determinism.test.ts
â”œâ”€â”€ combat-engine.test.ts
â””â”€â”€ combat-validation.test.ts
```

Coverage includes hits, misses, hit-chance bounds, minimum and maximum damage, zero damage, shared formulas, player-first ordering, victory, defeat, turn advancement, terminal-state rejection, turn `100`, deterministic output, immutability, state validation, RNG validation, ordered events, and the empty-effects extension point.

### Verification

Verified on `2026-10-07`:

- TypeScript typecheck passed.
- `4` M4 test files passed.
- `41` M4 tests passed.
- `46` total test files passed.
- `267` total tests passed.
- Production build passed.
- No regressions were detected in M1 through M3.
- No `Math.random()` or `Date.now()` usage was found in the M4 combat module.
- The M4 branch was synchronized with `origin/m4/pure-combat-engine`.

### Completion commits

```text
554df74  Approve M4 combat semantics
1d90a4c  Add M4 combat domain contracts
48008ab  Remove duplicate combat random source contract
9e435e4  Add M4 combat validation
b493752  Add M4 basic attack resolution
871e446  Add M4 combat round resolution
85f8da6  Complete M4 documentation
3dfe03a  Complete M4 pure combat engine
```

### Definition of done

- [x] Pure TypeScript combat module implemented.
- [x] Public `resolveCombatAction` interface implemented.
- [x] Player and monster basic attacks implemented through shared logic.
- [x] Player-first flow implemented.
- [x] Hit and damage formulas implemented.
- [x] Misses and successful zero-damage hits implemented.
- [x] Immediate victory and defeat implemented.
- [x] Complete turn-100 handling implemented.
- [x] Ordered events implemented.
- [x] State and RNG validation implemented.
- [x] Immutable deterministic transitions verified.
- [x] Domain remains independent from HTTP, PostgreSQL, repositories, and time.
- [x] M4 tests, regression suite, typecheck, and build passed.
- [x] M4 documentation completed.

### Out of scope

Persistent combat sessions, combat HTTP endpoints, authentication, ownership, expected-turn concurrency, Energy deduction, persistent events and logs, rewards, progression, cooldown writes, Bestiary updates, Task Boss progression, spells, consumables, monster abilities, active effects, multiple targets, escape, and abandonment remain outside M4.

### Completion log

M4 Pure Combat Engine completed and verified.

M5 connects the pure engine to authenticated HTTP endpoints and persistent PostgreSQL sessions.

---

## M5: PERSISTENT COMBAT API

### Status

Completed.

### Objective

Connect the pure M4 combat engine to authenticated HTTP endpoints and persistent PostgreSQL combat sessions.

### Implemented endpoints

```http
POST /characters/:characterId/combat
GET /characters/:characterId/combat
GET /characters/:characterId/combat/:combatSessionId
POST /characters/:characterId/combat/actions
GET /characters/:characterId/combat/:combatSessionId/log
```

All endpoints require authentication and character ownership.

Specific-session and event-log retrieval also validate that the combat session belongs to the selected character.

Foreign characters and sessions are not disclosed.

### Start-combat request

```json
{
  "monsterCode": "stable_monster_code"
}
```

### Fight-start transaction

1. Read one authoritative timestamp from `Clock`.
2. Begin a PostgreSQL transaction.
3. Lock the owned active character using `FOR UPDATE`.
4. Reject an existing active combat session.
5. Apply authoritative resource regeneration.
6. Load the monster by stable code.
7. Revalidate monster eligibility.
8. Require positive Character Health.
9. Validate available Energy.
10. Calculate authoritative effective character statistics.
11. Deduct Energy exactly once.
12. Persist updated character resources.
13. Snapshot character combat-ready statistics.
14. Snapshot monster combat-ready statistics.
15. Create the active combat session.
16. Commit the transaction.
17. Return the current session view.

Any failure rolls back:

- resource regeneration writes,
- Energy deduction,
- combat-session creation.

Concurrent combat-start requests cannot:

- create multiple active sessions,
- deduct Energy more than once.

### Action request

```json
{
  "expectedTurn": 4,
  "action": {
    "type": "basic_attack"
  }
}
```

Action-request rules:

- `expectedTurn` must be a positive safe integer.
- `action` must be a JSON object.
- `action` may contain only `type`.
- M5 supports only `basic_attack`.
- The client does not provide a combat-session ID.
- The action endpoint resolves the characterâ€™s current active session.
- The client cannot provide statistics, damage, hit results, random values, timestamps, events, or final outcomes.

### Combat-action transaction

1. Read one authoritative timestamp from `Clock`.
2. Begin a PostgreSQL transaction.
3. Lock the owned active combat session using `FOR UPDATE`.
4. Validate account and character ownership.
5. Compare `expectedTurn` with the locked session turn.
6. Reconstruct the pure M4 combat state from persistent snapshots.
7. Resolve the action through the M4 combat engine.
8. Use server-controlled cryptographic randomness.
9. Update the persistent combat-session state.
10. Persist generated events in domain order.
11. Synchronize terminal Character Health when required.
12. Commit the transaction.
13. Return the current session view and current-operation events.

A stale action does not:

- resolve combat,
- modify Health,
- advance the turn,
- change session status,
- create combat events.

Concurrent requests cannot resolve the same turn twice.

### Persistent combat state

Migration:

```text
088_persistent_combat_api.sql
```

Persistent combat sessions store:

- current status,
- current turn,
- current Character Health,
- current Character Mana,
- current Monster Health,
- defeat reason,
- start and end timestamps,
- character maximum Health snapshot,
- character Attack snapshot,
- character Defense snapshot,
- monster maximum Health snapshot,
- monster Attack snapshot,
- monster Defense snapshot.

Supported persistent statuses:

- `Active`
- `Victory`
- `Defeat`
- `Abandoned`

Supported defeat reasons:

- `PlayerHealthDepleted`
- `TurnLimitExceeded`

M5 does not create new abandoned sessions, but historical abandoned sessions remain retrievable.

The database enforces:

- valid turn values from `1` through `100`,
- valid status and defeat-reason combinations,
- valid terminal timestamps,
- non-negative Health and statistics,
- one active combat session per character.

Persistent sessions survive application restarts.

Active combat does not recalculate equipment, progression, or effective statistics after the session starts.

### Combat-session events

Incremental combat events are stored in:

```text
combat_session_events
```

Each event stores:

- combat-session ID,
- resolved turn number,
- event order within the turn,
- event type,
- complete event payload as JSONB,
- creation timestamp.

Supported M4 event types include:

- `AttackResolved`
- `CombatEnded`
- `TurnAdvanced`

The session update and all generated events are persisted atomically.

A rejected or stale action creates no events.

Events are retrieved in deterministic order:

```sql
ORDER BY
  turn_number ASC,
  event_order ASC
```

The combination below is unique:

```text
combat_session_id
turn_number
event_order
```

### Active-combat retrieval

```http
GET /characters/:characterId/combat
```

Returns only the characterâ€™s active combat session.

If no active session exists, the API returns:

```text
COMBAT_SESSION_NOT_FOUND
```

### Specific-session retrieval

```http
GET /characters/:characterId/combat/:combatSessionId
```

Returns an owned active or completed session.

The endpoint validates:

- authenticated account ownership,
- character ownership,
- session-to-character ownership.

Foreign and unavailable sessions return the same not-found response.

### Event-log retrieval

```http
GET /characters/:characterId/combat/:combatSessionId/log
```

Returns the complete ordered event stream from `combat_session_events`.

The M5 endpoint does not read from the older `combat_logs` table.

`combat_logs` remains reserved for final whole-combat summaries and recent-history retention in M6 or a later milestone.

### Server authority

Production combat uses `CryptoRandomSource`.

Application time is supplied through `Clock`.

The server controls:

- combat statistics,
- resource regeneration,
- Energy cost,
- timestamps,
- random values,
- hit results,
- damage,
- event data,
- combat outcomes.

The pure M4 combat engine remains independent from:

- HTTP,
- PostgreSQL,
- system time,
- cryptographic APIs,
- repositories.

### Definition of done

- Persistent combat migration is applied.
- No combat migration remains pending.
- Combat-ready statistics are snapshotted.
- Combat sessions survive application restarts.
- Only one active combat may exist per character.
- Duplicate starts cannot deduct Energy twice.
- Failed starts roll back all changes.
- Duplicate actions cannot execute one turn twice.
- Stale `expectedTurn` values are rejected.
- Session state persists after every accepted action.
- Ordered events persist atomically with session updates.
- Terminal status and defeat reason persist correctly.
- Terminal Character Health synchronizes atomically.
- Active combat Health remains isolated in the session.
- Active combat can be retrieved.
- Owned active or completed sessions can be retrieved.
- Ordered session-event logs can be retrieved.
- Authentication is required.
- Character ownership is enforced.
- Session-to-character ownership is enforced.
- Foreign sessions are not disclosed.
- Production randomness is controlled by the server.
- Client input cannot author combat outcomes.
- Unit tests pass.
- PostgreSQL integration tests pass.
- HTTP integration tests pass.
- Rollback tests pass.
- Concurrent-start tests pass.
- Concurrent-action tests pass.
- Full regression suite passes.
- TypeScript typecheck passes.
- Production build passes.

### Verification result

M5 was completed with:

- 88 applied database migrations,
- 0 pending migrations,
- 80 database tables,
- 60 passing test files,
- 361 passing tests,
- passing TypeScript typecheck,
- passing production build,
- passing PostgreSQL connection test,
- passing transactional rollback tests,
- passing concurrency tests,
- passing authenticated five-endpoint HTTP flow.

### Implemented files

```text
src/modules/combat/
â”œâ”€â”€ application/
â”‚   â”œâ”€â”€ combat-session.errors.ts
â”‚   â”œâ”€â”€ combat-session.models.ts
â”‚   â”œâ”€â”€ combat-session.repository.ts
â”‚   â”œâ”€â”€ get-active-combat.service.ts
â”‚   â”œâ”€â”€ get-combat-log.service.ts
â”‚   â”œâ”€â”€ get-combat-session.service.ts
â”‚   â”œâ”€â”€ resolve-combat-action.service.ts
â”‚   â””â”€â”€ start-combat.service.ts
â”œâ”€â”€ http/
â”‚   â”œâ”€â”€ combat-http.handler.ts
â”‚   â””â”€â”€ combat-http.request.ts
â””â”€â”€ infrastructure/
    â”œâ”€â”€ crypto-random-source.ts
    â”œâ”€â”€ postgres-combat-session.repository.ts
    â””â”€â”€ postgres-combat.mapper.ts
```

### M5 tests

M5 added dedicated unit, PostgreSQL integration, concurrency, rollback, retrieval, schema, and authenticated HTTP flow coverage.

Confirmed M5 test files include:

```text
tests/integration/combat/
â”œâ”€â”€ combat-retrieval.integration.test.ts
â”œâ”€â”€ persistent-combat-schema.test.ts
â”œâ”€â”€ resolve-combat-action.integration.test.ts
â””â”€â”€ start-combat.integration.test.ts

tests/integration/http/
â””â”€â”€ combat.http.test.ts
```

Unit coverage includes combat-session errors, retrieval services, request validation, HTTP handlers, cryptographic randomness, PostgreSQL mapping and repository behavior, combat start, and action resolution.

### Completion commits

```text
886a4b1  Prepare M5 implementation context
ceed2e4  Add M5 persistent combat schema
e4c3466  Add persistent combat contracts and adapters
263b3ca  Add transactional combat start infrastructure
2db8ec3  Implement transactional combat start
de9ae2f  Implement transactional combat actions
adb6ca5  Add persistent combat retrieval
5b0f2dc  Add authenticated combat HTTP handler
f2236f0  Connect persistent combat routes
de9b527  Test persistent combat HTTP flow
2fec50c  Stabilize combat integration fixtures
331a28a  Complete M5 documentation
```

### Out of scope

The following remain outside M5:

- victory rewards,
- Experience awards,
- Gold awards,
- loot generation,
- death penalties,
- promotion death modifiers,
- Blessing death modifiers and consumption,
- final summaries in `combat_logs`,
- recent final-log retention,
- monster cooldown writes,
- Bestiary progression,
- monster kill statistics,
- Task Boss progression,
- player spells,
- combat consumables,
- monster abilities,
- active buffs and debuffs,
- damage and healing over time,
- escape,
- combat abandonment.

---

### Completion log

M5 Persistent Combat API completed and verified.

The next milestone is M6: Victory, Death, and Progression.

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
â†’ Determine Item Level
â†’ Determine Rarity
â†’ Determine Affix Count
â†’ Select Eligible Affixes
â†’ Roll Affix Values
â†’ Calculate Item Score
â†’ Persist Item and Affixes

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
â†’ Gain Rewards
â†’ Receive Equipment
â†’ Equip Equipment
â†’ Become Stronger
â†’ Fight Stronger Monster

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
â†’ On Failure: Basic Attack
â†’ On Success: Weighted Ability Selection
â†’ Resolve Through Shared Spell Engine

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

- Common â†’ Magic
- Magic â†’ Rare
- Rare â†’ Epic
- Epic â†’ Legendary
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
â†’ Block Active Gameplay
â†’ Accumulate Completed Minutes
â†’ Stop at Login or 24 Hours
â†’ Generate Pending Results
â†’ Collect Results

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

## CURRENT PROJECT STATUS

### Completed milestones

- M1: Character Foundation
- M2: Effective Character Statistics
- M3: Monster Discovery and Eligibility
- M4: Pure Combat Engine
- M5: Persistent Combat API

### Completed platform foundations

- Database architecture established.
- Production migrations implemented through migration `088`.
- Authored-content tables available.
- Stable content codes added.
- Development workbook created.
- Synthetic development content populated.
- Workbook validation implemented.
- Transactional game-data importer implemented.
- Transactional dry run verified.
- Complete content import committed.
- Repeat import verified.
- Foreign-key relationships verified.
- Character ownership isolation implemented.
- Effective Character Statistics calculator implemented.
- Monster discovery and eligibility implemented.
- Pure deterministic combat engine implemented.
- Persistent combat sessions implemented.
- Authenticated combat HTTP API implemented.
- Combat concurrency and rollback protection verified.

### Current development content

- 29 authored-content worksheets.
- 248 authored-content records.
- 10 materials.
- 10 monsters.
- 10 item bases.
- 10 spells.
- 10 recipes.
- 10 monster abilities.
- 10 loot-table records.
- Supporting definitions for bosses, chests, NPCs, achievements, outfits, sets, uniques, and seasons.

Development definitions remain synthetic fixtures rather than final production content.

### Current technical state

```text
Database schema: Ready through M5
Database migrations: 88 applied, 0 pending
Database tables: 80
Character foundation: Implemented
Effective statistics: Implemented
Monster discovery: Implemented
Pure combat engine: Implemented
Persistent combat API: Implemented
Authenticated combat routes: Implemented
Combat integration flow: Verified
Test files: 60 passing
Tests: 361 passing
TypeScript typecheck: Passing
Production build: Passing
Current milestone: M6 Victory, Death, and Progression
```

### Current playable backend flow

```text
Create Character
â†’ Discover Eligible Monsters
â†’ Start Authenticated Combat
â†’ Deduct Energy Exactly Once
â†’ Persist Combat Session
â†’ Submit Expected-Turn Actions
â†’ Persist State and Ordered Events
â†’ Retrieve Active or Completed Session
â†’ Retrieve Ordered Combat Event Log
```

The backend does not yet settle victory rewards, death penalties, Experience, Gold, loot, cooldowns, Bestiary progress, kill statistics, or Task Boss progress.

## IMMEDIATE NEXT TASK

Prepare and approve the M6 implementation context for:

```text
M6: Victory, Death, and Progression
```

The M6 discovery and planning package must inspect and resolve:

- victory settlement,
- defeat settlement,
- Experience awards,
- Gold awards,
- level recalculation,
- multiple level gains,
- level-up resource changes,
- death Experience loss,
- multiple level losses,
- promotion death modifiers,
- Blessing state and consumption,
- exactly-once reward settlement,
- combat statistics,
- monster kill statistics,
- Bestiary updates,
- Task Boss progression,
- monster cooldown recording,
- final `combat_logs` summaries,
- recent-log retention,
- rollback behavior,
- concurrency behavior,
- interaction with future M7 item and loot generation.

M6 must preserve the existing M5 guarantees:

- one active combat per character,
- expected-turn concurrency control,
- atomic combat state and event persistence,
- ownership isolation,
- server-controlled randomness and time,
- no client-authored rewards or outcomes,
- persistent sessions recoverable after application restarts.

Do not begin M6 implementation until its source audit, approved decisions, schema implications, implementation plan, and master prompt are complete.
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

â†“

Resolve Effects

â†“

Monster Action

â†“

Resolve Effects

â†“

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
Â 
Combat uses EffectiveCharacterStats exclusively.
---

# 8. Physical Combat

Definitions:

AA = Attacker Attack

DD = Defender Defense

---

## Hit Chance Formula

Formula:

((AA - DD) Ã— 4)%

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

(AA - DD) Ã— 2

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

â†’ Enemy

Healing

â†’ Self

Defense Buff

â†’ Self

Attack Debuff

â†’ Enemy

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

Final Value = Base Value Ã— Spell Power

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

â†“

Gain Spell Mastery XP

â†“

Increase Spell Mastery Level

â†“

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

10% â†’ 6%

Promoted Character

8% â†’ 4%

Blessings provide protection for one death only.

---

# 29. Promotion

Promotion is a permanent character upgrade.

Requirements:

- Level 20
- 20,000 Gold

Benefits:

Death Penalty

10% â†’ 8%

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

â†“

Equipment

â†“

Spell Loadout

â†“

Consumables

â†“

Combat

â†“

Rewards

â†“

Progression
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

â†“

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

Character Level â‰¥ Monster Level

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

â†’ Cast Ability

Failure:

â†’ Basic Attack

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

â†’ Rat King

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

â†“

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

â†“

Monster Information

â†“

Monster Tracking

â†“

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
# SOURCE: database-design/combat/combat-sessions.md
# ============================================================

```text
# Combat Sessions

## ENTITY

`CombatSessions`

## PRIMARY KEY

`CombatSessionId`

## FOREIGN KEYS

`CharacterId`
â†’ `Characters.CharacterId`

`MonsterId`
â†’ `Monsters.MonsterId`

## CARDINALITY

```text
Characters
â””â”€â”€ CombatSessions (1:N)

Monsters
â””â”€â”€ CombatSessions (1:N)

CombatSessions
â”œâ”€â”€ CombatEffects (1:N)
â”œâ”€â”€ CombatSpellCooldowns (1:N)
â”œâ”€â”€ CombatSessionEvents (1:N)
â””â”€â”€ CombatLogs (1:1, reserved for a later milestone)
```

## REFERENCED BY

- `CombatEffects.CombatSessionId`
- `CombatSpellCooldowns.CombatSessionId`
- `CombatSessionEvents.CombatSessionId`
- `CombatLogs.CombatSessionId`

## PURPOSE

Stores active, completed, defeated, and abandoned combat encounters.

Acts as the authoritative server-side persistent combat state.

The session stores all combat-ready statistics required to reconstruct the pure combat-domain state. Active combat does not recalculate equipment, progression, or effective statistics after the session has started.

## CORE COLUMNS

### Identity

- `CombatSessionId`
- `CharacterId`
- `MonsterId`

### Status

`Status`

Supported values:

- `Active`
- `Victory`
- `Defeat`
- `Abandoned`

`DefeatReason`

Supported values:

- `PlayerHealthDepleted`
- `TurnLimitExceeded`

### Turn state

- `CurrentTurn`

### Current combat resources

- `CharacterHealth`
- `CharacterMana`
- `MonsterHealth`

### Character statistic snapshot

- `CharacterMaximumHealth`
- `CharacterAttack`
- `CharacterDefense`

### Monster statistic snapshot

- `MonsterMaximumHealth`
- `MonsterAttack`
- `MonsterDefense`

### Timestamps

- `StartedAt`
- `EndedAt`
- `CreatedAt`
- `UpdatedAt`

## STATUS RULES

### Active

- `DefeatReason` must be null.
- `EndedAt` must be null.
- Character Health must be greater than zero.
- Monster Health must be greater than zero.
- The session may accept another combat action.

### Victory

- `DefeatReason` must be null.
- `EndedAt` is required.
- Character Health must be greater than zero.
- Monster Health must equal zero.
- The session cannot accept another combat action.

### Defeat

- `DefeatReason` is required.
- `EndedAt` is required.
- The session cannot accept another combat action.
- `PlayerHealthDepleted` requires Character Health to equal zero.
- `TurnLimitExceeded` requires both combatants to remain alive on turn `100`.

### Abandoned

- `EndedAt` is required.
- The session cannot accept another combat action.
- M5 does not create new abandoned sessions.
- Historical abandoned sessions remain retrievable.

## TURN RULES

- The initial turn is `1`.
- Valid turn values are from `1` through `100`.
- Turn `100` resolves normally.
- Terminal combat does not advance to another turn.
- `ExpectedTurn` from an action request is compared with the locked `CurrentTurn`.
- A stale action is rejected without changing combat state or creating events.

## RESOURCE RULES

- Character Health cannot be negative.
- Character Mana cannot be negative.
- Monster Health cannot be negative.
- Current Health cannot exceed snapshotted maximum Health.
- Active-combat Health remains isolated in the combat session.
- Character Health stored in `Characters` is synchronized when combat becomes terminal and synchronization is required.
- M5 snapshots Character Mana but does not yet implement spell actions or in-combat Mana consumption.

## STATISTIC SNAPSHOT RULES

Character combat-ready statistics are calculated authoritatively when combat starts.

The character snapshot contains:

- maximum Health,
- Attack,
- Defense.

The monster snapshot contains:

- maximum Health,
- Attack,
- Defense.

Snapshot values remain unchanged throughout the session.

Equipment, progression, character bonuses, and monster definitions are not recalculated during an active fight.

## INDEXES AND CONSTRAINTS

- Primary-key index on `CombatSessionId`.
- Character lookup index.
- Monster lookup index.
- Status lookup index.
- Partial unique index allowing only one active combat session per character.
- Valid turn constraint.
- Valid status and defeat-reason constraints.
- Non-negative resource and statistic constraints.
- Status, Health, defeat reason, and ending timestamp must form a valid persistent combat state.

## COMBAT-START TRANSACTION

Combat start:

1. Locks the owned active character using `FOR UPDATE`.
2. Rejects an existing active combat.
3. Applies authoritative resource regeneration.
4. Loads the monster by stable code.
5. Revalidates monster eligibility.
6. Requires positive Character Health.
7. Validates available Energy.
8. Calculates authoritative effective character statistics.
9. Deducts Energy exactly once.
10. Persists updated character resources.
11. Creates the active session with combat-ready snapshots.
12. Commits the transaction.

Any failure rolls back the complete operation.

Concurrent start requests cannot:

- create multiple active sessions,
- deduct Energy more than once.

## COMBAT-ACTION TRANSACTION

Combat action:

1. Locks the owned active session using `FOR UPDATE`.
2. Validates account and character ownership.
3. Compares `ExpectedTurn` with the locked turn.
4. Reconstructs the pure combat-domain state.
5. Resolves the action using server-controlled randomness.
6. Updates the persistent session state.
7. Inserts ordered combat-session events.
8. Synchronizes terminal Character Health when required.
9. Commits the transaction.

The session update and event inserts are atomic.

Concurrent action requests cannot resolve the same turn twice.

## EVENT RELATIONSHIP

Incremental combat events are stored in:

`CombatSessionEvents`

Each event stores:

- Combat Session ID,
- resolved turn number,
- event order within the turn,
- event type,
- complete event data,
- creation timestamp.

Events are retrieved in deterministic order:

1. turn number,
2. event order.

M5 does not use `CombatLogs` for incremental action events.

## OWNERSHIP AND RETRIEVAL

Combat-session access requires:

- an authenticated account,
- a character owned by that account,
- a session belonging to that character.

Foreign characters and sessions are not disclosed.

Supported retrieval endpoints:

```http
GET /characters/:characterId/combat
GET /characters/:characterId/combat/:combatSessionId
GET /characters/:characterId/combat/:combatSessionId/log
```

The active-combat endpoint returns only an `Active` session.

The specific-session endpoint may return an owned active or completed session.

The log endpoint returns ordered records from `CombatSessionEvents`.

## BUSINESS RULES

- Only one active combat session may exist per character.
- The server is authoritative.
- Combat state is never trusted from the client.
- Clients cannot provide combat statistics, damage, results, timestamps, or random values.
- Energy is deducted exactly once when combat starts.
- Combat-ready statistics are snapshotted when combat starts.
- Session state persists after every accepted action.
- Session state and generated events are persisted atomically.
- Stale actions do not modify state or create events.
- Completed sessions are read-only.
- Persistent sessions survive application restarts.
- Foreign session existence is not disclosed.
- Victory does not create a `CombatLog` entry in M5.
- Defeat does not create a `CombatLog` entry in M5.
- Final records in `CombatLogs` remain reserved for M6 or a later milestone.

## M5 IMPLEMENTATION STATUS

Implemented in M5:

- persistent combat sessions,
- combat-ready statistic snapshots,
- transactional combat start,
- transactional combat actions,
- one active session per character,
- exact-once Energy deduction,
- expected-turn validation,
- stale-action rejection,
- concurrent-request protection,
- persistent ordered events,
- active-session retrieval,
- historical-session retrieval,
- authenticated HTTP endpoints,
- ownership isolation,
- server-controlled cryptographic randomness.

Not implemented in M5:

- victory rewards,
- Experience rewards,
- Gold rewards,
- loot generation,
- death penalties,
- Blessing consumption,
- final summaries in `CombatLogs`,
- recent-log retention,
- monster cooldown writes,
- Bestiary progression,
- monster kill statistics,
- Task Boss progression,
- player spells,
- combat consumables,
- monster abilities,
- active buffs and debuffs,
- damage or healing over time,
- escape,
- combat abandonment.
```

# ============================================================
# SOURCE: database-design/combat/combat-session-events.md
# ============================================================

```text
# Combat Session Events

## ENTITY

`CombatSessionEvents`

## DATABASE TABLE

`combat_session_events`

## PRIMARY KEY

`CombatSessionEventId`

## FOREIGN KEY

`CombatSessionId`  
â†’ `CombatSessions.CombatSessionId`

## CARDINALITY

```text
CombatSessions
â””â”€â”€ CombatSessionEvents (1:N)
```

## PURPOSE

Stores the authoritative incremental event stream generated by persistent combat actions.

Every accepted combat action may produce one or more ordered events.

The events are persisted in the same PostgreSQL transaction that updates the associated combat session.

`CombatSessionEvents` is the data source for the M5 combat-log endpoint.

## CORE COLUMNS

### Identity

- `CombatSessionEventId`
- `CombatSessionId`

### Event position

- `TurnNumber`
- `EventOrder`

### Event content

- `EventType`
- `EventDataJson`

### Timestamp

- `CreatedAt`

## TURN NUMBER

`TurnNumber` identifies the combat turn resolved by the action that produced the event.

Rules:

- Valid values are from `1` through `100`.
- All events produced by one resolved action use the same resolved turn number.
- The stored turn represents the turn that was resolved, not necessarily the next turn shown in the resulting combat state.
- A stale action does not create events.

## EVENT ORDER

`EventOrder` defines deterministic ordering within one resolved turn.

Rules:

- Event ordering starts at `0`.
- Events are stored in the order returned by the pure combat engine.
- Event order must be non-negative.
- Two events cannot occupy the same position within one session and turn.

The following combination is unique:

```text
CombatSessionId
TurnNumber
EventOrder
```

## EVENT TYPE

`EventType` stores the stable type of the domain event.

M5 persists event types produced by the M4 combat engine, including:

- `AttackResolved`
- `CombatEnded`
- `TurnAdvanced`

The event type must be a non-empty string.

## EVENT DATA

`EventDataJson` stores the complete domain event as JSONB.

The payload is generated by the server.

Clients cannot provide:

- event results,
- damage,
- hit or miss results,
- random values,
- timestamps,
- final combat outcomes,
- event ordering.

Example event payload:

```json
{
  "type": "AttackResolved",
  "actor": "Player",
  "target": "Monster",
  "hit": true,
  "damage": 12
}
```

The exact payload depends on the event type.

## CREATED TIMESTAMP

`CreatedAt` stores the authoritative timestamp supplied to the combat-action transaction.

All events created by one resolved action use the same observed timestamp.

Application time is supplied through `Clock`.

## INDEXES AND CONSTRAINTS

The schema includes:

- a primary-key index on `CombatSessionEventId`,
- a foreign key to `CombatSessions`,
- a unique constraint on session, turn, and event order,
- validation of turn numbers from `1` through `100`,
- validation of non-negative event order,
- validation of non-empty event type,
- an index supporting deterministic event-log retrieval.

## PERSISTENCE TRANSACTION

For each accepted combat action:

1. Lock the owned active combat session using `FOR UPDATE`.
2. Validate account and character ownership.
3. Compare `ExpectedTurn` with the locked session turn.
4. Reconstruct the pure combat-domain state.
5. Resolve the action using server-controlled randomness.
6. Update the persistent combat-session state.
7. Insert generated events in domain order.
8. Synchronize terminal Character Health when required.
9. Commit the transaction.

The session update and all event inserts are atomic.

If any persistence step fails:

- the session update is rolled back,
- all inserted events are rolled back,
- terminal Character Health synchronization is rolled back.

## CONCURRENCY RULES

- A stale action creates no events.
- Concurrent requests cannot resolve the same turn twice.
- The request that acquires the session lock first may resolve the expected turn.
- A later request observes the updated turn and is rejected when its `ExpectedTurn` is stale.
- The unique event-position constraint provides an additional database safeguard.

## DETERMINISTIC RETRIEVAL

Events are returned in this order:

```sql
ORDER BY
  turn_number ASC,
  event_order ASC
```

This guarantees deterministic ordering across the complete session history.

## HTTP RETRIEVAL

Implemented endpoint:

```http
GET /characters/:characterId/combat/:combatSessionId/log
```

Response shape:

```ts
{
  combatSessionId: string;
  events: readonly PersistedCombatEvent[];
}
```

Each persisted event includes:

```ts
{
  combatSessionEventId: string;
  combatSessionId: string;
  turnNumber: number;
  eventOrder: number;
  eventType: string;
  event: CombatEvent;
  createdAt: Date;
}
```

## OWNERSHIP RULES

The event log is available only when:

- the request is authenticated,
- the character belongs to the authenticated account,
- the combat session belongs to that character.

Foreign and unavailable sessions return the same not-found response.

The API does not disclose the existence of another accountâ€™s session or events.

## RELATIONSHIP WITH COMBAT LOGS

`CombatSessionEvents` stores incremental per-action events and is implemented in M5.

`CombatLogs` is reserved for later final whole-combat summaries and recent-history retention.

M5 does not write final records to `CombatLogs`.

The two entities serve different purposes and must not be treated as interchangeable.

## MIGRATION

Created by:

```text
088_persistent_combat_api.sql
```

## BUSINESS RULES

- Events are generated only by the server.
- Events are immutable after insertion.
- Events belong to exactly one combat session.
- Event order is deterministic.
- Session state and events are persisted atomically.
- Rejected actions create no events.
- Clients cannot author event data.
- Foreign event logs are not disclosed.
- Incremental events survive application restarts with their combat session.

## M5 IMPLEMENTATION STATUS

Implemented in M5:

- incremental event persistence,
- atomic session and event writes,
- deterministic event ordering,
- complete JSONB event payloads,
- stale-action protection,
- concurrent-action protection,
- authenticated HTTP retrieval,
- character and session ownership isolation,
- PostgreSQL integration tests,
- HTTP integration tests.

Not implemented in M5:

- final summaries in `CombatLogs`,
- retention of the ten newest final logs,
- automatic deletion of older final logs,
- victory rewards,
- Experience or Gold changes,
- loot generation,
- death penalties,
- Blessing consumption,
- monster cooldown writes,
- Bestiary progression,
- monster kill statistics,
- Task Boss progression.
```

# ============================================================
# SOURCE: database-design/combat/combat-logs.md
# ============================================================

```text
# Combat Logs

## ENTITY

`CombatLogs`

## PRIMARY KEY

`CombatLogId`

## FOREIGN KEYS

`CharacterId`
â†’ `Characters.CharacterId'

`MonsterId`
â†’ `Monsters.MonsterId`

`CombatSessionId`
â†’ `CombatSessions.CombatSessionId`

## CARDINALITY

```text
Characters
â””â”€â”€ CombatLogs (1:N)

Monsters
â””â”€â”€ CombatLogs (1:N)

CombatSessions
â””â”€â”€ CombatLogs (1:1)
```

## PURPOSE

Reserved for final whole-combat summaries and recent combat history.

Planned uses include:

- fight analysis,
- death review,
- boss review,
- recent combat history,
- compact summaries of completed encounters.

`CombatLogs` is not the source of incremental combat events implemented in M5.

## CORE COLUMNS

### Identity

- `CombatLogId`
- `CombatSessionId`
- `CharacterId`
- `MonsterId`

### Result

`CombatResult`

Supported values:

- `Victory`
- `Defeat`

### Summary

- `TurnCount`
- `StartedAt`
- `EndedAt`
- `CombatDataJson`
- `CreatedAt`

## INDEXES

- Primary-key index on `CombatLogId`.
- Character lookup index.
- Monster lookup index.
- Creation-time lookup index.

## RELATIONSHIP WITH COMBAT SESSION EVENTS

M5 stores incremental, per-action combat events in:

`CombatSessionEvents`

These events include:

- resolved turn number,
- event order within the turn,
- event type,
- complete event payload,
- creation timestamp.

The M5 combat-log endpoint reads from `CombatSessionEvents`, not from `CombatLogs`.

Implemented endpoint:

```http
GET /characters/:characterId/combat/:combatSessionId/log
```

The endpoint:

- requires authentication,
- validates character ownership,
- validates that the session belongs to the selected character,
- does not disclose foreign session existence,
- returns events ordered by turn number and event order.

## SEPARATION OF RESPONSIBILITIES

### CombatSessionEvents

Stores the authoritative incremental event stream generated after every accepted combat action.

Used by M5 for:

- atomic event persistence,
- deterministic event ordering,
- combat-log retrieval through HTTP,
- reconstruction of action-by-action combat history.

### CombatLogs

Reserved for later final summaries of completed combat.

Planned uses include:

- recent-combat history,
- compact fight summaries,
- death review,
- boss review,
- final replay or diagnostic data.

The two entities are not interchangeable.

## M5 IMPLEMENTATION STATUS

M5 does not create, update, retain, or delete records in `CombatLogs`.

Victory does not create a `CombatLogs` record in M5.

Defeat does not create a `CombatLogs` record in M5.

M5 persists incremental events exclusively in `CombatSessionEvents`.

## PLANNED BUSINESS RULES

The following rules describe future behavior and are not implemented in M5:

- A completed combat may create one final `CombatLogs` record.
- Final combat logs are immutable.
- A character may retain a maximum of ten final combat logs.
- The oldest final logs may be removed when the retention limit is exceeded.
- `CombatDataJson` may store a final summary or replay representation.
- Victory and defeat settlement may write final log data within the same transaction as progression changes.

The precise implementation belongs to M6: Victory, Death, and Progression, or a later approved milestone.

## NOT IMPLEMENTED IN M5

- Final combat-summary creation.
- Automatic log creation after victory.
- Automatic log creation after defeat.
- Retention of the newest ten final logs.
- Automatic removal of old logs.
- Final replay generation.
- Victory rewards.
- Experience or Gold changes.
- Loot generation.
- Death penalties.
- Blessing consumption.
- Monster cooldown recording.
- Bestiary progression.
- Monster kill statistics.
- Task Boss progression.
```

# ============================================================
# SOURCE: database-design/characters/character-cooldowns.md
# ============================================================

```text
ENTITY: CharacterCooldowns

### PRIMARY KEY

CharacterCooldownId

### FOREIGN KEYS

CharacterId
â†’ Characters.CharacterId

TargetId
â†’ Monsters.MonsterId
(nullable)

Used when CooldownType = Monster

### CARDINALITY

Characters
â””â”€â”€ CharacterCooldowns (1:N)

Monsters
â””â”€â”€ CharacterCooldowns (1:N)

### UNIQUE CONSTRAINTS

(CharacterId, CooldownType, TargetId)

### PURPOSE

Stores character-specific cooldowns
for monsters, NPC interactions and
future time-gated content.

### CORE COLUMNS

CharacterCooldownId

CharacterId

CooldownType
(
Monster,
NpcHealer
)

TargetId
(nullable)

AvailableAt

CreatedAt
UpdatedAt

### INDEXES

PK_CharacterCooldownId
IX_CharacterCooldowns_CharacterId
IX_CharacterCooldowns_CooldownType
IX_CharacterCooldowns_TargetId
IX_CharacterCooldowns_AvailableAt

### BUSINESS RULES

- Monster cooldowns use:
  CooldownType = Monster
  TargetId = Monsters.MonsterId

- NPC healer cooldowns use:
  CooldownType = NpcHealer
  TargetId = NULL

- One NPC healer cooldown may exist per character

- Character may access content when:
  AvailableAt <= CurrentTime

- Defeating a monster starts a new cooldown

- Using the NPC healer starts a new cooldown
```

# ============================================================
# RELEVANT FILE INVENTORY
# ============================================================

```text
database\migrations\010_monster_families.sql
database\migrations\011_monsters.sql
database\migrations\020_characters.sql
database\migrations\021_achievement_progress.sql
database\migrations\022_character_unlocks.sql
database\migrations\023_character_spell_mastery.sql
database\migrations\024_character_spells.sql
database\migrations\025_character_loadouts.sql
database\migrations\026_character_cooldowns.sql
database\migrations\027_character_statistics.sql
database\migrations\028_character_buffs.sql
database\migrations\035_bestiary_entries.sql
database\migrations\036_bestiary_statistics.sql
database\migrations\037_character_daily_boss_progress.sql
database\migrations\038_monster_tasks.sql
database\migrations\039_monster_abilities.sql
database\migrations\040_monster_ability_weights.sql
database\migrations\042_chest_reward_definitions.sql
database\migrations\043_daily_chest_progress.sql
database\migrations\044_hourly_chest_progress.sql
database\migrations\045_login_streak_progress.sql
database\migrations\046_combat_sessions.sql
database\migrations\047_combat_effects.sql
database\migrations\048_combat_spell_cooldowns.sql
database\migrations\049_combat_logs.sql
database\migrations\060_set_progress.sql
database\migrations\080_character_foundation_support.sql
database\migrations\081_effective_character_statistics.sql
database\migrations\083_add_monster_energy_cost.sql
database\migrations\084_task_status_refactor.sql
database\migrations\085_unique_monster_task_boss.sql
database\migrations\088_persistent_combat_api.sql
database-design\achievements\achievement-progress.md
database-design\bestiary\bestiary-entries.md
database-design\bestiary\bestiary-statistics.md
database-design\bosses\character-daily-boss-progress.md
database-design\bosses\monster-tasks.md
database-design\buffs\character-buffs.md
database-design\characters\character-cooldowns.md
database-design\characters\character-loadouts.md
database-design\characters\characters.md
database-design\characters\character-spell-mastery.md
database-design\characters\character-spells.md
database-design\characters\character-statistics.md
database-design\characters\character-unlocks.md
database-design\chests\chest-reward-definitions.md
database-design\chests\daily-chest-progress.md
database-design\chests\hourly-chest-progress.md
database-design\chests\login-streak-progress.md
database-design\combat\combat-effects.md
database-design\combat\combat-logs.md
database-design\combat\combat-session-events.md
database-design\combat\combat-sessions.md
database-design\combat\combat-spells-cooldowns.md
database-design\holy-grail\set-progress.md
database-design\monsters\monster-abilities.md
database-design\monsters\monster-ability-weights.md
database-design\monsters\monster-families.md
database-design\monsters\monsters.md
documentation\database-design\bestiary-definition.md
documentation\database-design\character-definition.md
documentation\database-design\combat-design.md
documentation\database-design\combat-effect-definition.md
documentation\database-design\monster-definition.md
documentation\database-design\task-boss-definition.md
documentation\database-design\task-system.md
documentation\game-design\PROJECT_CATALOG.md
src\modules\characters\application\archive-character.service.ts
src\modules\characters\application\calculate-character-stats.service.ts
src\modules\characters\application\character.repository.ts
src\modules\characters\application\character-statistics.repository.ts
src\modules\characters\application\create-character.service.ts
src\modules\characters\application\equipment.repository.ts
src\modules\characters\application\get-character-snapshot.service.ts
src\modules\characters\application\list-characters.service.ts
src\modules\characters\domain\character.constants.ts
src\modules\characters\domain\character.errors.ts
src\modules\characters\domain\character.types.ts
src\modules\characters\domain\character-name.ts
src\modules\characters\domain\effective-character-statistics.ts
src\modules\characters\domain\resource-regeneration.ts
src\modules\characters\http\character-http.handler.ts
src\modules\characters\http\character-http.request.ts
src\modules\characters\infrastructure\postgres-character.mapper.ts
src\modules\characters\infrastructure\postgres-character.repository.ts
src\modules\characters\infrastructure\postgres-character-statistics.repository.ts
src\modules\characters\infrastructure\postgres-equipment.repository.ts
src\modules\combat\application\combat-session.errors.ts
src\modules\combat\application\combat-session.models.ts
src\modules\combat\application\combat-session.repository.ts
src\modules\combat\application\get-active-combat.service.ts
src\modules\combat\application\get-combat-log.service.ts
src\modules\combat\application\get-combat-session.service.ts
src\modules\combat\application\resolve-combat-action.service.ts
src\modules\combat\application\start-combat.service.ts
src\modules\combat\domain\combat.constants.ts
src\modules\combat\domain\combat.errors.ts
src\modules\combat\domain\combat.types.ts
src\modules\combat\domain\combat-attack.ts
src\modules\combat\domain\combat-effects.ts
src\modules\combat\domain\combat-engine.ts
src\modules\combat\domain\combat-validation.ts
src\modules\combat\http\combat-http.handler.ts
src\modules\combat\http\combat-http.request.ts
src\modules\combat\infrastructure\crypto-random-source.ts
src\modules\combat\infrastructure\postgres-combat.mapper.ts
src\modules\combat\infrastructure\postgres-combat-session.repository.ts
src\modules\combat\ports\random-source.ts
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
tests\integration\characters\postgres-character.repository.test.ts
tests\integration\characters\postgres-character-achievements.repository.test.ts
tests\integration\characters\postgres-character-buffs.repository.test.ts
tests\integration\characters\postgres-character-set-bonuses.repository.test.ts
tests\integration\characters\postgres-character-statistics.repository.test.ts
tests\integration\characters\postgres-equipment.repository.test.ts
tests\integration\combat\combat-retrieval.integration.test.ts
tests\integration\combat\persistent-combat-schema.test.ts
tests\integration\combat\resolve-combat-action.integration.test.ts
tests\integration\combat\start-combat.integration.test.ts
tests\integration\http\combat.http.test.ts
tests\integration\http\monster-discovery.http.test.ts
tests\integration\monsters\daily-boss-discovery.repository.test.ts
tests\integration\monsters\postgres-monster-discovery.repository.test.ts
tests\unit\characters\archive-character.service.test.ts
tests\unit\characters\calculate-character-stats.service.test.ts
tests\unit\characters\character-foundation.test.ts
tests\unit\characters\character-name.test.ts
tests\unit\characters\character-repository-contract.test.ts
tests\unit\characters\create-character.service.test.ts
tests\unit\characters\effective-character-statistics.test.ts
tests\unit\characters\get-character-snapshot.service.test.ts
tests\unit\characters\list-characters.service.test.ts
tests\unit\characters\postgres-character.mapper.test.ts
tests\unit\characters\postgres-character-statistics.repository.test.ts
tests\unit\characters\resource-regeneration.test.ts
tests\unit\combat\combat-attack.test.ts
tests\unit\combat\combat-determinism.test.ts
tests\unit\combat\combat-engine.test.ts
tests\unit\combat\combat-retrieval.services.test.ts
tests\unit\combat\combat-session-errors.test.ts
tests\unit\combat\combat-validation.test.ts
tests\unit\combat\crypto-random-source.test.ts
tests\unit\combat\postgres-combat.mapper.test.ts
tests\unit\combat\postgres-combat-session.repository.test.ts
tests\unit\combat\resolve-combat-action.service.test.ts
tests\unit\combat\start-combat.service.test.ts
tests\unit\http\character-http.handler.test.ts
tests\unit\http\character-http.request.test.ts
tests\unit\http\combat-http.handler.test.ts
tests\unit\http\combat-http.request.test.ts
tests\unit\http\monster-http.handler.test.ts
tests\unit\http\monster-http.request.test.ts
tests\unit\monsters\daily-boss-discovery.service.test.ts
tests\unit\monsters\daily-boss-eligibility.test.ts
tests\unit\monsters\get-monster-details.service.test.ts
tests\unit\monsters\get-monster-list.service.test.ts
tests\unit\monsters\monster-cooldown.test.ts
tests\unit\monsters\monster-eligibility.test.ts
tests\unit\monsters\task-boss-discovery.service.test.ts
```

# ============================================================
# M6 SETTLEMENT REFERENCE AUDIT
# ============================================================

```text
database-design/achievements/achievements.md:71:RewardExperiencePercent
database-design/achievements/achievements.md:94:- RewardGoldPercent and RewardExperiencePercent are percentage values
database-design/achievements/achievements.md:100:- RewardGoldPercent and RewardExperiencePercent are percentage-point modifiers.
database-design/bestiary/bestiary-entries.md:1:ENTITY: BestiaryEntries
database-design/bestiary/bestiary-entries.md:5:BestiaryEntryId
database-design/bestiary/bestiary-entries.md:18:ΓööΓöÇΓöÇ BestiaryEntries (1:N)
database-design/bestiary/bestiary-entries.md:21:ΓööΓöÇΓöÇ BestiaryEntries (1:N)
database-design/bestiary/bestiary-entries.md:36:- Bestiary is character-specific
database-design/bestiary/bestiary-entries.md:41:BestiaryEntryId
database-design/bestiary/bestiary-entries.md:52:PK_BestiaryEntryId
database-design/bestiary/bestiary-entries.md:54:UX_BestiaryEntries_Character_Monster
database-design/bestiary/bestiary-entries.md:56:IX_BestiaryEntries_CharacterId
database-design/bestiary/bestiary-entries.md:57:IX_BestiaryEntries_MonsterId
database-design/bestiary/bestiary-statistics.md:1:ENTITY: BestiaryStatistics
database-design/bestiary/bestiary-statistics.md:5:BestiaryStatisticsId
database-design/bestiary/bestiary-statistics.md:18:ΓööΓöÇΓöÇ BestiaryStatistics (1:N)
database-design/bestiary/bestiary-statistics.md:21:ΓööΓöÇΓöÇ BestiaryStatistics (1:N)
database-design/bestiary/bestiary-statistics.md:30:for Bestiary and progression systems.
database-design/bestiary/bestiary-statistics.md:37:- Bestiary Statistics
database-design/bestiary/bestiary-statistics.md:49:BestiaryStatisticsId
database-design/bestiary/bestiary-statistics.md:68:PK_BestiaryStatisticsId
database-design/bestiary/bestiary-statistics.md:70:UX_BestiaryStatistics_Character_Monster
database-design/bestiary/bestiary-statistics.md:72:IX_BestiaryStatistics_CharacterId
database-design/bestiary/bestiary-statistics.md:74:IX_BestiaryStatistics_MonsterId
database-design/bestiary/bestiary-statistics.md:76:IX_BestiaryStatistics_KillCount
database-design/bosses/bosses.md:43:AdditionalCooldownSeconds
database-design/buffs/character-buffs.md:37:- Experience Boost
database-design/buffs/character-buffs.md:67:  ExperienceBoost,
database-design/characters/character-cooldowns.md:1:ENTITY: CharacterCooldowns
database-design/characters/character-cooldowns.md:5:CharacterCooldownId
database-design/characters/character-cooldowns.md:16:Used when CooldownType = Monster
database-design/characters/character-cooldowns.md:21:ΓööΓöÇΓöÇ CharacterCooldowns (1:N)
database-design/characters/character-cooldowns.md:24:ΓööΓöÇΓöÇ CharacterCooldowns (1:N)
database-design/characters/character-cooldowns.md:28:(CharacterId, CooldownType, TargetId)
database-design/characters/character-cooldowns.md:32:Stores character-specific cooldowns
database-design/characters/character-cooldowns.md:38:CharacterCooldownId
database-design/characters/character-cooldowns.md:42:CooldownType
database-design/characters/character-cooldowns.md:58:PK_CharacterCooldownId
database-design/characters/character-cooldowns.md:59:IX_CharacterCooldowns_CharacterId
database-design/characters/character-cooldowns.md:60:IX_CharacterCooldowns_CooldownType
database-design/characters/character-cooldowns.md:61:IX_CharacterCooldowns_TargetId
database-design/characters/character-cooldowns.md:62:IX_CharacterCooldowns_AvailableAt
database-design/characters/character-cooldowns.md:66:- Monster cooldowns use:
database-design/characters/character-cooldowns.md:67:  CooldownType = Monster
database-design/characters/character-cooldowns.md:70:- NPC healer cooldowns use:
database-design/characters/character-cooldowns.md:71:  CooldownType = NpcHealer
database-design/characters/character-cooldowns.md:74:- One NPC healer cooldown may exist per character
database-design/characters/character-cooldowns.md:79:- Defeating a monster starts a new cooldown
database-design/characters/character-cooldowns.md:81:- Using the NPC healer starts a new cooldown
database-design/characters/character-spell-mastery.md:30:MasteryExperience
database-design/characters/character-unlocks.md:26:IsPromoted
database-design/characters/characters.md:20:CharacterCooldowns.CharacterId
database-design/characters/characters.md:41:BestiaryEntries.CharacterId
database-design/characters/characters.md:42:BestiaryStatistics.CharacterId
database-design/characters/characters.md:90:Γö£ΓöÇΓöÇ BestiaryEntries (1:N)
database-design/characters/characters.md:91:Γö£ΓöÇΓöÇ BestiaryStatistics (1:N)
database-design/characters/characters.md:103:Experience
database-design/characters/characters.md:120:PromotionUnlocked
database-design/characters/characters.md:135:IX_Characters_Experience
database-design/chests/chest-definitions.md:11:CooldownSeconds
database-design/chests/chest-reward-definitions.md:13:Blessing,
database-design/combat/combat-logs.md:158:- Victory and defeat settlement may write final log data within the same transaction as progression changes.
database-design/combat/combat-logs.md:171:- Experience or Gold changes.
database-design/combat/combat-logs.md:174:- Blessing consumption.
database-design/combat/combat-logs.md:175:- Monster cooldown recording.
database-design/combat/combat-logs.md:176:- Bestiary progression.
database-design/combat/combat-session-events.md:286:- Experience or Gold changes,
database-design/combat/combat-session-events.md:289:- Blessing consumption,
database-design/combat/combat-session-events.md:290:- monster cooldown writes,
database-design/combat/combat-session-events.md:291:- Bestiary progression,
database-design/combat/combat-sessions.md:30:Γö£ΓöÇΓöÇ CombatSpellCooldowns (1:N)
database-design/combat/combat-sessions.md:38:- `CombatSpellCooldowns.CombatSessionId`
database-design/combat/combat-sessions.md:318:- Experience rewards,
database-design/combat/combat-sessions.md:322:- Blessing consumption,
database-design/combat/combat-sessions.md:325:- monster cooldown writes,
database-design/combat/combat-sessions.md:326:- Bestiary progression,
database-design/combat/combat-spells-cooldowns.md:1:ENTITY: CombatSpellCooldowns
database-design/combat/combat-spells-cooldowns.md:5:CombatSpellCooldownId
database-design/combat/combat-spells-cooldowns.md:18:ΓööΓöÇΓöÇ CombatSpellCooldowns (1:N)
database-design/combat/combat-spells-cooldowns.md:21:ΓööΓöÇΓöÇ CombatSpellCooldowns (1:N)
database-design/combat/combat-spells-cooldowns.md:29:Stores active spell cooldowns that exist
database-design/combat/combat-spells-cooldowns.md:37:CombatSpellCooldownId
database-design/combat/combat-spells-cooldowns.md:49:PK_CombatSpellCooldownId
database-design/combat/combat-spells-cooldowns.md:51:UX_CombatSpellCooldowns_CombatSession_Spell
database-design/combat/combat-spells-cooldowns.md:53:IX_CombatSpellCooldowns_CombatSessionId
database-design/combat/combat-spells-cooldowns.md:55:IX_CombatSpellCooldowns_SpellId
database-design/combat/combat-spells-cooldowns.md:59:- Spell cooldowns only exist during combat
database-design/combat/combat-spells-cooldowns.md:60:- Cooldowns are tracked independently per spell
database-design/combat/combat-spells-cooldowns.md:61:- Using a spell creates or refreshes its cooldown
database-design/combat/combat-spells-cooldowns.md:63:- A spell may be cast only when no active cooldown exists
database-design/combat/combat-spells-cooldowns.md:64:- Spell cooldowns are deleted when combat ends
database-design/combat/combat-spells-cooldowns.md:65:- Cooldowns are never persisted outside combat
database-design/combat/combat-spells-cooldowns.md:66:- Server is authoritative for cooldown validation
database-design/consumables/consumable-definitions.md:37:- Experience Boosts
database-design/consumables/consumable-definitions.md:38:- Blessings
database-design/consumables/consumable-definitions.md:55:  ExperienceBoost,
database-design/consumables/consumable-definitions.md:56:  Blessing,
database-design/consumables/consumable-definitions.md:76:  ExperienceBonus,
database-design/consumables/consumable-definitions.md:77:  Blessing,
database-design/consumables/consumable-definitions.md:92:PotionCooldownTurns
database-design/consumables/consumable-definitions.md:114:- Blessings are manually activated
database-design/consumables/consumable-definitions.md:116:- Gold/Experience boosts do not stack with same category
database-design/crafting/recipes.md:41:(Potion, Blessing, Upgrade, Boost)
database-design/database-blueprint.md:71:# BESTIARY DOMAIN
database-design/database-blueprint.md:73:BestiaryEntries
database-design/database-blueprint.md:74:BestiaryStatistics
database-design/database-relationships.md:32:Γö£ΓöÇΓöÇ BestiaryEntries (1:N)
database-design/database-relationships.md:33:Γö£ΓöÇΓöÇ BestiaryStatistics (1:N)
database-design/database-relationships.md:74:Γö£ΓöÇΓöÇ BestiaryEntries (1:N)
database-design/database-relationships.md:75:Γö£ΓöÇΓöÇ BestiaryStatistics (1:N)
database-design/entity-inventory.md:89:BESTIARY DOMAIN
database-design/entity-inventory.md:91:BestiaryEntries
database-design/entity-inventory.md:92:BestiaryStatistics
database-design/gathering/gathering-sessions.md:43:ExperienceEarned
database-design/items/affix-templates.md:26: Energy, GoldPercent, ExperiencePercent)
database-design/items/affix-templates.md:48:- GoldPercent and ExperiencePercent values are percentage-point modifiers.
database-design/items/item-bases.md:53:ExperiencePercent
database-design/items/item-bases.md:77:- GoldPercent and ExperiencePercent are percentage-point modifiers.
database-design/items/set-bonuses.md:30: GoldPercent, ExperiencePercent, Health, Mana)
database-design/loot/other-loot-tables.md:37:- Blessings
database-design/monsters/monsters.md:24:BestiaryEntries.MonsterId
database-design/monsters/monsters.md:25:BestiaryStatistics.MonsterId
database-design/monsters/monsters.md:29:CharacterCooldowns.TargetId
database-design/monsters/monsters.md:40:Γö£ΓöÇΓöÇ BestiaryEntries (1:N)
database-design/monsters/monsters.md:41:Γö£ΓöÇΓöÇ BestiaryStatistics (1:N)
database-design/monsters/monsters.md:74:CooldownSeconds
database-design/npc/npc-definitions.md:23:- Blessing Merchant
database-design/npc/npc-definitions.md:24:- Promotion Trainer
database-design/npc/npc-definitions.md:40:BlessingMerchant,
database-design/npc/npc-definitions.md:41:PromotionTrainer
database-design/seasons/hall-of-fame.md:47:FinalExperience
database-design/seasons/season-rankings.md:32:- Experience rankings
database-design/seasons/season-rankings.md:46:Experience,
database-design/seasons/season-rankings.md:54:CharacterExperience
database-design/spells/spells.md:50:CooldownTurns
database/metadata/table-columns.csv:55:achievements,13,reward_experience_percent,numeric,numeric,NO,0,,8,4
database/metadata/table-columns.csv:116:bestiary_entries,1,bestiary_entry_id,uuid,uuid,NO,gen_random_uuid(),,,
database/metadata/table-columns.csv:117:bestiary_entries,2,character_id,uuid,uuid,NO,,,,
database/metadata/table-columns.csv:118:bestiary_entries,3,monster_id,uuid,uuid,NO,,,,
database/metadata/table-columns.csv:119:bestiary_entries,4,unlocked_at,timestamp with time zone,timestamptz,NO,now(),,,
database/metadata/table-columns.csv:120:bestiary_entries,5,created_at,timestamp with time zone,timestamptz,NO,now(),,,
database/metadata/table-columns.csv:121:bestiary_statistics,1,bestiary_statistics_id,uuid,uuid,NO,gen_random_uuid(),,,
database/metadata/table-columns.csv:122:bestiary_statistics,2,character_id,uuid,uuid,NO,,,,
database/metadata/table-columns.csv:123:bestiary_statistics,3,monster_id,uuid,uuid,NO,,,,
database/metadata/table-columns.csv:124:bestiary_statistics,4,kill_count,bigint,int8,NO,1,,64,0
database/metadata/table-columns.csv:125:bestiary_statistics,5,first_kill_at,timestamp with time zone,timestamptz,NO,now(),,,
database/metadata/table-columns.csv:126:bestiary_statistics,6,last_kill_at,timestamp with time zone,timestamptz,NO,now(),,,
database/metadata/table-columns.csv:127:bestiary_statistics,7,task_progress,bigint,int8,NO,0,,64,0
database/metadata/table-columns.csv:128:bestiary_statistics,8,task_unlocked,boolean,bool,NO,false,,,
database/metadata/table-columns.csv:129:bestiary_statistics,9,created_at,timestamp with time zone,timestamptz,NO,now(),,,
database/metadata/table-columns.csv:130:bestiary_statistics,10,updated_at,timestamp with time zone,timestamptz,NO,now(),,,
database/metadata/table-columns.csv:136:bosses,6,additional_cooldown_seconds,integer,int4,NO,0,,32,0
database/metadata/table-columns.csv:153:character_cooldowns,1,character_cooldown_id,uuid,uuid,NO,gen_random_uuid(),,,
database/metadata/table-columns.csv:154:character_cooldowns,2,character_id,uuid,uuid,NO,,,,
database/metadata/table-columns.csv:155:character_cooldowns,3,cooldown_type,character varying,varchar,NO,,32,,
database/metadata/table-columns.csv:156:character_cooldowns,4,target_id,uuid,uuid,YES,,,,
database/metadata/table-columns.csv:157:character_cooldowns,5,available_at,timestamp with time zone,timestamptz,NO,,,,
database/metadata/table-columns.csv:158:character_cooldowns,6,created_at,timestamp with time zone,timestamptz,NO,now(),,,
database/metadata/table-columns.csv:159:character_cooldowns,7,updated_at,timestamp with time zone,timestamptz,NO,now(),,,
database/metadata/table-columns.csv:184:character_spell_mastery,4,mastery_experience,bigint,int8,NO,0,,64,0
database/metadata/table-columns.csv:215:character_unlocks,3,is_promoted,boolean,bool,NO,false,,,
database/metadata/table-columns.csv:226:characters,6,experience,bigint,int8,NO,0,,64,0
database/metadata/table-columns.csv:244:chest_definitions,3,cooldown_seconds,integer,int4,NO,,,32,0
database/metadata/table-columns.csv:269:combat_logs,1,combat_log_id,uuid,uuid,NO,gen_random_uuid(),,,
database/metadata/table-columns.csv:270:combat_logs,2,combat_session_id,uuid,uuid,NO,,,,
database/metadata/table-columns.csv:271:combat_logs,3,character_id,uuid,uuid,NO,,,,
database/metadata/table-columns.csv:272:combat_logs,4,monster_id,uuid,uuid,NO,,,,
database/metadata/table-columns.csv:273:combat_logs,5,combat_result,character varying,varchar,NO,,20,,
database/metadata/table-columns.csv:274:combat_logs,6,turn_count,integer,int4,NO,,,32,0
database/metadata/table-columns.csv:275:combat_logs,7,started_at,timestamp with time zone,timestamptz,NO,,,,
database/metadata/table-columns.csv:276:combat_logs,8,ended_at,timestamp with time zone,timestamptz,NO,,,,
database/metadata/table-columns.csv:277:combat_logs,9,combat_data_json,jsonb,jsonb,NO,,,,
database/metadata/table-columns.csv:278:combat_logs,10,created_at,timestamp with time zone,timestamptz,NO,now(),,,
database/metadata/table-columns.csv:291:combat_spell_cooldowns,1,combat_spell_cooldown_id,uuid,uuid,NO,gen_random_uuid(),,,
database/metadata/table-columns.csv:292:combat_spell_cooldowns,2,combat_session_id,uuid,uuid,NO,,,,
database/metadata/table-columns.csv:293:combat_spell_cooldowns,3,spell_id,uuid,uuid,NO,,,,
database/metadata/table-columns.csv:294:combat_spell_cooldowns,4,remaining_turns,integer,int4,NO,,,32,0
database/metadata/table-columns.csv:295:combat_spell_cooldowns,5,created_at,timestamp with time zone,timestamptz,NO,now(),,,
database/metadata/table-columns.csv:306:consumable_definitions,11,potion_cooldown_turns,integer,int4,NO,0,,32,0
database/metadata/table-columns.csv:393:gathering_sessions,8,experience_earned,bigint,int8,NO,0,,64,0
database/metadata/table-columns.csv:403:hall_of_fame,7,final_experience,bigint,int8,NO,,,64,0
database/metadata/table-columns.csv:454:item_bases,18,experience_percent,numeric,numeric,NO,0,,8,4
database/metadata/table-columns.csv:569:monsters,12,cooldown_seconds,integer,int4,NO,0,,32,0
database/metadata/table-columns.csv:653:season_rankings,7,character_experience,bigint,int8,NO,,,64,0
database/metadata/table-columns.csv:699:spells,8,cooldown_turns,integer,int4,NO,0,,32,0
database/metadata/table-constraints.csv:78:achievements,achievements_reward_experience_percent_not_null,CHECK,reward_experience_percent IS NOT NULL
database/metadata/table-constraints.csv:86:achievements,chk_achievements_reward_experience_percent,CHECK,(reward_experience_percent >= (0)::numeric)
database/metadata/table-constraints.csv:119:affix_templates,chk_affix_templates_type,CHECK,"((affix_type)::text = ANY ((ARRAY['Attack'::character varying, 'Defense'::character varying, 'SpellPower'::character varying, 'Health'::character varying, 'Mana'::character varying, 'Energy'::character varying, 'GoldPercent'::character varying, 'ExperiencePercent'::character varying])::text[]))"
database/metadata/table-constraints.csv:173:bestiary_entries,bestiary_entries_bestiary_entry_id_not_null,CHECK,bestiary_entry_id IS NOT NULL
database/metadata/table-constraints.csv:174:bestiary_entries,bestiary_entries_character_id_not_null,CHECK,character_id IS NOT NULL
database/metadata/table-constraints.csv:175:bestiary_entries,bestiary_entries_created_at_not_null,CHECK,created_at IS NOT NULL
database/metadata/table-constraints.csv:176:bestiary_entries,bestiary_entries_monster_id_not_null,CHECK,monster_id IS NOT NULL
database/metadata/table-constraints.csv:177:bestiary_entries,bestiary_entries_unlocked_at_not_null,CHECK,unlocked_at IS NOT NULL
database/metadata/table-constraints.csv:178:bestiary_entries,fk_bestiary_entries_character,FOREIGN KEY,
database/metadata/table-constraints.csv:179:bestiary_entries,fk_bestiary_entries_monster,FOREIGN KEY,
database/metadata/table-constraints.csv:180:bestiary_entries,bestiary_entries_pkey,PRIMARY KEY,
database/metadata/table-constraints.csv:181:bestiary_entries,ux_bestiary_entries_character_monster,UNIQUE,
database/metadata/table-constraints.csv:182:bestiary_statistics,bestiary_statistics_bestiary_statistics_id_not_null,CHECK,bestiary_statistics_id IS NOT NULL
database/metadata/table-constraints.csv:183:bestiary_statistics,bestiary_statistics_character_id_not_null,CHECK,character_id IS NOT NULL
database/metadata/table-constraints.csv:184:bestiary_statistics,bestiary_statistics_created_at_not_null,CHECK,created_at IS NOT NULL
database/metadata/table-constraints.csv:185:bestiary_statistics,bestiary_statistics_first_kill_at_not_null,CHECK,first_kill_at IS NOT NULL
database/metadata/table-constraints.csv:186:bestiary_statistics,bestiary_statistics_kill_count_not_null,CHECK,kill_count IS NOT NULL
database/metadata/table-constraints.csv:187:bestiary_statistics,bestiary_statistics_last_kill_at_not_null,CHECK,last_kill_at IS NOT NULL
database/metadata/table-constraints.csv:188:bestiary_statistics,bestiary_statistics_monster_id_not_null,CHECK,monster_id IS NOT NULL
database/metadata/table-constraints.csv:189:bestiary_statistics,bestiary_statistics_task_progress_not_null,CHECK,task_progress IS NOT NULL
database/metadata/table-constraints.csv:190:bestiary_statistics,bestiary_statistics_task_unlocked_not_null,CHECK,task_unlocked IS NOT NULL
database/metadata/table-constraints.csv:191:bestiary_statistics,bestiary_statistics_updated_at_not_null,CHECK,updated_at IS NOT NULL
database/metadata/table-constraints.csv:192:bestiary_statistics,chk_bestiary_statistics_dates,CHECK,(last_kill_at >= first_kill_at)
database/metadata/table-constraints.csv:193:bestiary_statistics,chk_bestiary_statistics_kill_count,CHECK,(kill_count >= 1)
database/metadata/table-constraints.csv:194:bestiary_statistics,chk_bestiary_statistics_task_progress,CHECK,(task_progress >= 0)
database/metadata/table-constraints.csv:195:bestiary_statistics,fk_bestiary_statistics_character,FOREIGN KEY,
database/metadata/table-constraints.csv:196:bestiary_statistics,fk_bestiary_statistics_monster,FOREIGN KEY,
database/metadata/table-constraints.csv:197:bestiary_statistics,bestiary_statistics_pkey,PRIMARY KEY,
database/metadata/table-constraints.csv:198:bestiary_statistics,ux_bestiary_statistics_character_monster,UNIQUE,
database/metadata/table-constraints.csv:199:bosses,bosses_additional_cooldown_seconds_not_null,CHECK,additional_cooldown_seconds IS NOT NULL
database/metadata/table-constraints.csv:207:bosses,chk_bosses_additional_cooldown,CHECK,(additional_cooldown_seconds >= 0)
database/metadata/table-constraints.csv:229:character_buffs,chk_character_buffs_type,CHECK,"((buff_type)::text = ANY ((ARRAY['GoldBoost'::character varying, 'ExperienceBoost'::character varying, 'AttackBuff'::character varying, 'DefenseBuff'::character varying, 'SpellPowerBuff'::character varying, 'DamageOverTime'::character varying, 'HealOverTime'::character varying, 'ManaDrain'::character varying, 'HealthDrain'::character varying, 'PotionDisable'::character varying])::text[]))"
database/metadata/table-constraints.csv:235:character_cooldowns,character_cooldowns_available_at_not_null,CHECK,available_at IS NOT NULL
database/metadata/table-constraints.csv:236:character_cooldowns,character_cooldowns_character_cooldown_id_not_null,CHECK,character_cooldown_id IS NOT NULL
database/metadata/table-constraints.csv:237:character_cooldowns,character_cooldowns_character_id_not_null,CHECK,character_id IS NOT NULL
database/metadata/table-constraints.csv:238:character_cooldowns,character_cooldowns_cooldown_type_not_null,CHECK,cooldown_type IS NOT NULL
database/metadata/table-constraints.csv:239:character_cooldowns,character_cooldowns_created_at_not_null,CHECK,created_at IS NOT NULL
database/metadata/table-constraints.csv:240:character_cooldowns,character_cooldowns_updated_at_not_null,CHECK,updated_at IS NOT NULL
database/metadata/table-constraints.csv:241:character_cooldowns,chk_character_cooldowns_target,CHECK,((((cooldown_type)::text = 'Monster'::text) AND (target_id IS NOT NULL)) OR (((cooldown_type)::text = 'NpcHealer'::text) AND (target_id IS NULL)))
database/metadata/table-constraints.csv:242:character_cooldowns,chk_character_cooldowns_type,CHECK,"((cooldown_type)::text = ANY ((ARRAY['Monster'::character varying, 'NpcHealer'::character varying])::text[]))"
database/metadata/table-constraints.csv:243:character_cooldowns,fk_character_cooldowns_character,FOREIGN KEY,
database/metadata/table-constraints.csv:244:character_cooldowns,fk_character_cooldowns_target,FOREIGN KEY,
database/metadata/table-constraints.csv:245:character_cooldowns,character_cooldowns_pkey,PRIMARY KEY,
database/metadata/table-constraints.csv:281:character_spell_mastery,character_spell_mastery_mastery_experience_not_null,CHECK,mastery_experience IS NOT NULL
database/metadata/table-constraints.csv:284:character_spell_mastery,chk_character_spell_mastery_experience,CHECK,(mastery_experience >= 0)
database/metadata/table-constraints.csv:329:character_unlocks,character_unlocks_is_promoted_not_null,CHECK,is_promoted IS NOT NULL
database/metadata/table-constraints.csv:346:characters,characters_experience_not_null,CHECK,experience IS NOT NULL
database/metadata/table-constraints.csv:358:characters,chk_characters_experience,CHECK,(experience >= 0)
database/metadata/table-constraints.csv:370:chest_definitions,chest_definitions_cooldown_seconds_not_null,CHECK,cooldown_seconds IS NOT NULL
database/metadata/table-constraints.csv:375:chest_definitions,chk_chest_definitions_cooldown,CHECK,(cooldown_seconds > 0)
database/metadata/table-constraints.csv:391:chest_reward_definitions,chk_chest_reward_definitions_type,CHECK,"((reward_type)::text = ANY ((ARRAY['Gold'::character varying, 'Item'::character varying, 'Material'::character varying, 'Consumable'::character varying, 'Blessing'::character varying, 'ProtectionStone'::character varying, 'UniqueRoll'::character varying, 'SetRoll'::character varying])::text[]))"
database/metadata/table-constraints.csv:413:combat_logs,chk_combat_logs_dates,CHECK,(ended_at >= started_at)
database/metadata/table-constraints.csv:414:combat_logs,chk_combat_logs_result,CHECK,"((combat_result)::text = ANY ((ARRAY['Victory'::character varying, 'Defeat'::character varying])::text[]))"
database/metadata/table-constraints.csv:415:combat_logs,chk_combat_logs_turn_count,CHECK,(turn_count >= 1)
database/metadata/table-constraints.csv:416:combat_logs,combat_logs_character_id_not_null,CHECK,character_id IS NOT NULL
database/metadata/table-constraints.csv:417:combat_logs,combat_logs_combat_data_json_not_null,CHECK,combat_data_json IS NOT NULL
database/metadata/table-constraints.csv:418:combat_logs,combat_logs_combat_log_id_not_null,CHECK,combat_log_id IS NOT NULL
database/metadata/table-constraints.csv:419:combat_logs,combat_logs_combat_result_not_null,CHECK,combat_result IS NOT NULL
database/metadata/table-constraints.csv:420:combat_logs,combat_logs_combat_session_id_not_null,CHECK,combat_session_id IS NOT NULL
database/metadata/table-constraints.csv:421:combat_logs,combat_logs_created_at_not_null,CHECK,created_at IS NOT NULL
database/metadata/table-constraints.csv:422:combat_logs,combat_logs_ended_at_not_null,CHECK,ended_at IS NOT NULL
database/metadata/table-constraints.csv:423:combat_logs,combat_logs_monster_id_not_null,CHECK,monster_id IS NOT NULL
database/metadata/table-constraints.csv:424:combat_logs,combat_logs_started_at_not_null,CHECK,started_at IS NOT NULL
database/metadata/table-constraints.csv:425:combat_logs,combat_logs_turn_count_not_null,CHECK,turn_count IS NOT NULL
database/metadata/table-constraints.csv:426:combat_logs,fk_combat_logs_character,FOREIGN KEY,
database/metadata/table-constraints.csv:427:combat_logs,fk_combat_logs_monster,FOREIGN KEY,
database/metadata/table-constraints.csv:428:combat_logs,fk_combat_logs_session,FOREIGN KEY,
database/metadata/table-constraints.csv:429:combat_logs,combat_logs_pkey,PRIMARY KEY,
database/metadata/table-constraints.csv:430:combat_logs,combat_logs_combat_session_id_key,UNIQUE,
database/metadata/table-constraints.csv:449:combat_spell_cooldowns,chk_combat_spell_cooldowns_turns,CHECK,(remaining_turns >= 0)
database/metadata/table-constraints.csv:450:combat_spell_cooldowns,combat_spell_cooldowns_combat_session_id_not_null,CHECK,combat_session_id IS NOT NULL
database/metadata/table-constraints.csv:451:combat_spell_cooldowns,combat_spell_cooldowns_combat_spell_cooldown_id_not_null,CHECK,combat_spell_cooldown_id IS NOT NULL
database/metadata/table-constraints.csv:452:combat_spell_cooldowns,combat_spell_cooldowns_created_at_not_null,CHECK,created_at IS NOT NULL
database/metadata/table-constraints.csv:453:combat_spell_cooldowns,combat_spell_cooldowns_remaining_turns_not_null,CHECK,remaining_turns IS NOT NULL
database/metadata/table-constraints.csv:454:combat_spell_cooldowns,combat_spell_cooldowns_spell_id_not_null,CHECK,spell_id IS NOT NULL
database/metadata/table-constraints.csv:455:combat_spell_cooldowns,fk_combat_spell_cooldowns_session,FOREIGN KEY,
database/metadata/table-constraints.csv:456:combat_spell_cooldowns,fk_combat_spell_cooldowns_spell,FOREIGN KEY,
database/metadata/table-constraints.csv:457:combat_spell_cooldowns,combat_spell_cooldowns_pkey,PRIMARY KEY,
database/metadata/table-constraints.csv:458:combat_spell_cooldowns,ux_combat_spell_cooldowns_session_spell,UNIQUE,
database/metadata/table-constraints.csv:459:consumable_definitions,chk_consumable_definitions_category,CHECK,"((category)::text = ANY ((ARRAY['HealthPotion'::character varying, 'ManaPotion'::character varying, 'EnergyPotion'::character varying, 'GoldBoost'::character varying, 'ExperienceBoost'::character varying, 'Blessing'::character varying, 'ProtectionStone'::character varying])::text[]))"
database/metadata/table-constraints.csv:463:consumable_definitions,chk_consumable_definitions_effect_type,CHECK,"((effect_type)::text = ANY ((ARRAY['RestoreHealth'::character varying, 'RestoreMana'::character varying, 'RestoreEnergy'::character varying, 'GoldBonus'::character varying, 'ExperienceBonus'::character varying, 'Blessing'::character varying, 'UpgradeProtection'::character varying])::text[]))"
database/metadata/table-constraints.csv:465:consumable_definitions,chk_consumable_definitions_potion_cooldown,CHECK,(potion_cooldown_turns >= 0)
database/metadata/table-constraints.csv:479:consumable_definitions,consumable_definitions_potion_cooldown_turns_not_null,CHECK,potion_cooldown_turns IS NOT NULL
database/metadata/table-constraints.csv:612:gathering_sessions,chk_gathering_sessions_xp,CHECK,(experience_earned >= 0)
database/metadata/table-constraints.csv:615:gathering_sessions,gathering_sessions_experience_earned_not_null,CHECK,experience_earned IS NOT NULL
database/metadata/table-constraints.csv:626:hall_of_fame,chk_hall_of_fame_experience,CHECK,(final_experience >= 0)
database/metadata/table-constraints.csv:635:hall_of_fame,hall_of_fame_final_experience_not_null,CHECK,final_experience IS NOT NULL
database/metadata/table-constraints.csv:696:item_bases,chk_item_bases_stats,CHECK,((attack >= (0)::numeric) AND (defense >= (0)::numeric) AND (spell_power >= (0)::numeric) AND (health >= (0)::numeric) AND (mana >= (0)::numeric) AND (energy >= (0)::numeric) AND (gold_percent >= (0)::numeric) AND (experience_percent >= (0)::numeric) AND (base_item_score >= 0))
database/metadata/table-constraints.csv:706:item_bases,item_bases_experience_percent_not_null,CHECK,experience_percent IS NOT NULL
database/metadata/table-constraints.csv:876:monsters,chk_monsters_cooldown,CHECK,(cooldown_seconds >= 0)
database/metadata/table-constraints.csv:887:monsters,monsters_cooldown_seconds_not_null,CHECK,cooldown_seconds IS NOT NULL
database/metadata/table-constraints.csv:909:npc_definitions,chk_npc_definitions_type,CHECK,"((npc_type)::text = ANY ((ARRAY['Vendor'::character varying, 'Healer'::character varying, 'BlessingMerchant'::character varying, 'PromotionTrainer'::character varying])::text[]))"
database/metadata/table-constraints.csv:987:recipes,chk_recipes_category,CHECK,"((category)::text = ANY ((ARRAY['Potion'::character varying, 'Blessing'::character varying, 'Upgrade'::character varying, 'Boost'::character varying])::text[]))"
database/metadata/table-constraints.csv:1014:season_rankings,chk_season_rankings_experience,CHECK,(character_experience >= 0)
database/metadata/table-constraints.csv:1017:season_rankings,chk_season_rankings_type,CHECK,"((ranking_type)::text = ANY ((ARRAY['Experience'::character varying, 'Hardcore'::character varying])::text[]))"
database/metadata/table-constraints.csv:1019:season_rankings,season_rankings_character_experience_not_null,CHECK,character_experience IS NOT NULL
database/metadata/table-constraints.csv:1056:set_bonuses,chk_set_bonuses_type,CHECK,"((bonus_type)::text = ANY ((ARRAY['Attack'::character varying, 'Defense'::character varying, 'SpellPower'::character varying, 'GoldPercent'::character varying, 'ExperiencePercent'::character varying, 'Health'::character varying, 'Mana'::character varying])::text[]))"
database/metadata/table-constraints.csv:1095:spells,chk_spells_cooldown_turns,CHECK,(cooldown_turns >= 0)
database/metadata/table-constraints.csv:1104:spells,spells_cooldown_turns_not_null,CHECK,cooldown_turns IS NOT NULL
database/metadata/table-foreign-keys.csv:23:bestiary_entries,character_id,characters,character_id,CASCADE,NO ACTION
database/metadata/table-foreign-keys.csv:24:bestiary_entries,monster_id,monsters,monster_id,RESTRICT,NO ACTION
database/metadata/table-foreign-keys.csv:25:bestiary_statistics,character_id,characters,character_id,CASCADE,NO ACTION
database/metadata/table-foreign-keys.csv:26:bestiary_statistics,monster_id,monsters,monster_id,RESTRICT,NO ACTION
database/metadata/table-foreign-keys.csv:31:character_cooldowns,target_id,monsters,monster_id,RESTRICT,NO ACTION
database/metadata/table-foreign-keys.csv:32:character_cooldowns,character_id,characters,character_id,CASCADE,NO ACTION
database/metadata/table-foreign-keys.csv:52:combat_logs,character_id,characters,character_id,CASCADE,NO ACTION
database/metadata/table-foreign-keys.csv:53:combat_logs,combat_session_id,combat_sessions,combat_session_id,RESTRICT,NO ACTION
database/metadata/table-foreign-keys.csv:54:combat_logs,monster_id,monsters,monster_id,RESTRICT,NO ACTION
database/metadata/table-foreign-keys.csv:57:combat_spell_cooldowns,combat_session_id,combat_sessions,combat_session_id,CASCADE,NO ACTION
database/metadata/table-foreign-keys.csv:58:combat_spell_cooldowns,spell_id,spells,spell_id,RESTRICT,NO ACTION
database/migration-audit-dump.txt:63:    reward_experience_percent NUMERIC(8, 4) NOT NULL DEFAULT 0,
database/migration-audit-dump.txt:82:    CONSTRAINT chk_achievements_reward_experience_percent
database/migration-audit-dump.txt:83:        CHECK (reward_experience_percent >= 0)
database/migration-audit-dump.txt:211:    cooldown_turns INTEGER NOT NULL DEFAULT 0,
database/migration-audit-dump.txt:233:    CONSTRAINT chk_spells_cooldown_turns CHECK (cooldown_turns >= 0),
database/migration-audit-dump.txt:267:    potion_cooldown_turns INTEGER NOT NULL DEFAULT 0,
database/migration-audit-dump.txt:280:            'ExperienceBoost', 'Blessing', 'ProtectionStone'
database/migration-audit-dump.txt:289:            'ExperienceBonus', 'Blessing', 'UpgradeProtection'
database/migration-audit-dump.txt:305:    CONSTRAINT chk_consumable_definitions_potion_cooldown
database/migration-audit-dump.txt:306:        CHECK (potion_cooldown_turns >= 0),
database/migration-audit-dump.txt:514:    cooldown_seconds INTEGER NOT NULL DEFAULT 0,
database/migration-audit-dump.txt:541:    CONSTRAINT chk_monsters_cooldown CHECK (cooldown_seconds >= 0),
database/migration-audit-dump.txt:574:    additional_cooldown_seconds INTEGER NOT NULL DEFAULT 0,
database/migration-audit-dump.txt:591:    CONSTRAINT chk_bosses_additional_cooldown
database/migration-audit-dump.txt:592:        CHECK (additional_cooldown_seconds >= 0)
database/migration-audit-dump.txt:813:    experience_percent NUMERIC(8, 4) NOT NULL DEFAULT 0,
database/migration-audit-dump.txt:853:            AND gold_percent >= 0 AND experience_percent >= 0
database/migration-audit-dump.txt:909:            'Energy', 'GoldPercent', 'ExperiencePercent'
database/migration-audit-dump.txt:990:    experience BIGINT NOT NULL DEFAULT 0,
database/migration-audit-dump.txt:1026:    CONSTRAINT chk_characters_experience CHECK (experience >= 0),
database/migration-audit-dump.txt:1058:CREATE INDEX ix_characters_experience
database/migration-audit-dump.txt:1059:    ON characters(experience);
database/migration-audit-dump.txt:1132:    is_promoted BOOLEAN NOT NULL DEFAULT FALSE,
database/migration-audit-dump.txt:1172:    mastery_experience BIGINT NOT NULL DEFAULT 0,
database/migration-audit-dump.txt:1189:    CONSTRAINT chk_character_spell_mastery_experience
database/migration-audit-dump.txt:1190:        CHECK (mastery_experience >= 0),
database/migration-audit-dump.txt:1304:FILE: 026_character_cooldowns.sql
database/migration-audit-dump.txt:1308:-- 026_character_cooldowns.sql
database/migration-audit-dump.txt:1312:CREATE TABLE character_cooldowns (
database/migration-audit-dump.txt:1313:    character_cooldown_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
database/migration-audit-dump.txt:1315:    cooldown_type VARCHAR(32) NOT NULL,
database/migration-audit-dump.txt:1321:    CONSTRAINT fk_character_cooldowns_character
database/migration-audit-dump.txt:1326:    CONSTRAINT fk_character_cooldowns_target
database/migration-audit-dump.txt:1331:    CONSTRAINT chk_character_cooldowns_type
database/migration-audit-dump.txt:1332:        CHECK (cooldown_type IN ('Monster', 'NpcHealer')),
database/migration-audit-dump.txt:1334:    CONSTRAINT chk_character_cooldowns_target
database/migration-audit-dump.txt:1336:            (cooldown_type = 'Monster' AND target_id IS NOT NULL)
database/migration-audit-dump.txt:1338:            (cooldown_type = 'NpcHealer' AND target_id IS NULL)
database/migration-audit-dump.txt:1342:CREATE UNIQUE INDEX ux_character_cooldowns_monster
database/migration-audit-dump.txt:1343:    ON character_cooldowns(character_id, target_id)
database/migration-audit-dump.txt:1344:    WHERE cooldown_type = 'Monster';
database/migration-audit-dump.txt:1346:CREATE UNIQUE INDEX ux_character_cooldowns_npc_healer
database/migration-audit-dump.txt:1347:    ON character_cooldowns(character_id)
database/migration-audit-dump.txt:1348:    WHERE cooldown_type = 'NpcHealer';
database/migration-audit-dump.txt:1350:CREATE INDEX ix_character_cooldowns_character_id
database/migration-audit-dump.txt:1351:    ON character_cooldowns(character_id);
database/migration-audit-dump.txt:1353:CREATE INDEX ix_character_cooldowns_cooldown_type
database/migration-audit-dump.txt:1354:    ON character_cooldowns(cooldown_type);
database/migration-audit-dump.txt:1356:CREATE INDEX ix_character_cooldowns_target_id
database/migration-audit-dump.txt:1357:    ON character_cooldowns(target_id);
database/migration-audit-dump.txt:1359:CREATE INDEX ix_character_cooldowns_available_at
database/migration-audit-dump.txt:1360:    ON character_cooldowns(available_at);
database/migration-audit-dump.txt:1483:            'GoldBoost', 'ExperienceBoost', 'AttackBuff', 'DefenseBuff',
database/migration-audit-dump.txt:1722:        CHECK (bonus_type IN ('Attack', 'Defense', 'SpellPower', 'GoldPercent', 'ExperiencePercent', 'Health', 'Mana')),
database/migration-audit-dump.txt:1729:FILE: 035_bestiary_entries.sql
database/migration-audit-dump.txt:1733:-- 035_bestiary_entries.sql
database/migration-audit-dump.txt:1737:CREATE TABLE bestiary_entries (
database/migration-audit-dump.txt:1738:    bestiary_entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
database/migration-audit-dump.txt:1744:    CONSTRAINT fk_bestiary_entries_character
database/migration-audit-dump.txt:1746:    CONSTRAINT fk_bestiary_entries_monster
database/migration-audit-dump.txt:1748:    CONSTRAINT ux_bestiary_entries_character_monster UNIQUE (character_id, monster_id)
database/migration-audit-dump.txt:1751:CREATE INDEX ix_bestiary_entries_character_id ON bestiary_entries(character_id);
database/migration-audit-dump.txt:1752:CREATE INDEX ix_bestiary_entries_monster_id ON bestiary_entries(monster_id);
database/migration-audit-dump.txt:1755:FILE: 036_bestiary_statistics.sql
database/migration-audit-dump.txt:1759:-- 036_bestiary_statistics.sql
database/migration-audit-dump.txt:1763:CREATE TABLE bestiary_statistics (
database/migration-audit-dump.txt:1764:    bestiary_statistics_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
database/migration-audit-dump.txt:1775:    CONSTRAINT fk_bestiary_statistics_character
database/migration-audit-dump.txt:1777:    CONSTRAINT fk_bestiary_statistics_monster
database/migration-audit-dump.txt:1779:    CONSTRAINT ux_bestiary_statistics_character_monster UNIQUE (character_id, monster_id),
database/migration-audit-dump.txt:1780:    CONSTRAINT chk_bestiary_statistics_kill_count CHECK (kill_count >= 1),
database/migration-audit-dump.txt:1781:    CONSTRAINT chk_bestiary_statistics_task_progress CHECK (task_progress >= 0),
database/migration-audit-dump.txt:1782:    CONSTRAINT chk_bestiary_statistics_dates CHECK (last_kill_at >= first_kill_at)
database/migration-audit-dump.txt:1785:CREATE INDEX ix_bestiary_statistics_character_id ON bestiary_statistics(character_id);
database/migration-audit-dump.txt:1786:CREATE INDEX ix_bestiary_statistics_monster_id ON bestiary_statistics(monster_id);
database/migration-audit-dump.txt:1787:CREATE INDEX ix_bestiary_statistics_kill_count ON bestiary_statistics(kill_count);
database/migration-audit-dump.txt:1966: cooldown_seconds INTEGER NOT NULL,
database/migration-audit-dump.txt:1971: CONSTRAINT chk_chest_definitions_cooldown CHECK (cooldown_seconds > 0)
database/migration-audit-dump.txt:1993: CONSTRAINT chk_chest_reward_definitions_type CHECK (reward_type IN ('Gold','Item','Material','Consumable','Blessing','ProtectionStone','UniqueRoll','SetRoll')),
database/migration-audit-dump.txt:2135:FILE: 048_combat_spell_cooldowns.sql
database/migration-audit-dump.txt:2138:-- 048_combat_spell_cooldowns.sql
database/migration-audit-dump.txt:2140:CREATE TABLE combat_spell_cooldowns (
database/migration-audit-dump.txt:2141: combat_spell_cooldown_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
database/migration-audit-dump.txt:2146: CONSTRAINT fk_combat_spell_cooldowns_session FOREIGN KEY (combat_session_id) REFERENCES combat_sessions(combat_session_id) ON DELETE CASCADE,
database/migration-audit-dump.txt:2147: CONSTRAINT fk_combat_spell_cooldowns_spell FOREIGN KEY (spell_id) REFERENCES spells(spell_id) ON DELETE RESTRICT,
database/migration-audit-dump.txt:2148: CONSTRAINT ux_combat_spell_cooldowns_session_spell UNIQUE (combat_session_id,spell_id),
database/migration-audit-dump.txt:2149: CONSTRAINT chk_combat_spell_cooldowns_turns CHECK (remaining_turns >= 0)
database/migration-audit-dump.txt:2151:CREATE INDEX ix_combat_spell_cooldowns_session_id ON combat_spell_cooldowns(combat_session_id);
database/migration-audit-dump.txt:2152:CREATE INDEX ix_combat_spell_cooldowns_spell_id ON combat_spell_cooldowns(spell_id);
database/migration-audit-dump.txt:2155:FILE: 049_combat_logs.sql
database/migration-audit-dump.txt:2158:-- 049_combat_logs.sql
database/migration-audit-dump.txt:2160:CREATE TABLE combat_logs (
database/migration-audit-dump.txt:2171: CONSTRAINT fk_combat_logs_session FOREIGN KEY (combat_session_id) REFERENCES combat_sessions(combat_session_id) ON DELETE RESTRICT,
database/migration-audit-dump.txt:2172: CONSTRAINT fk_combat_logs_character FOREIGN KEY (character_id) REFERENCES characters(character_id) ON DELETE CASCADE,
database/migration-audit-dump.txt:2173: CONSTRAINT fk_combat_logs_monster FOREIGN KEY (monster_id) REFERENCES monsters(monster_id) ON DELETE RESTRICT,
database/migration-audit-dump.txt:2174: CONSTRAINT chk_combat_logs_result CHECK (combat_result IN ('Victory','Defeat')),
database/migration-audit-dump.txt:2175: CONSTRAINT chk_combat_logs_turn_count CHECK (turn_count >= 1),
database/migration-audit-dump.txt:2176: CONSTRAINT chk_combat_logs_dates CHECK (ended_at >= started_at)
database/migration-audit-dump.txt:2178:CREATE INDEX ix_combat_logs_character_id ON combat_logs(character_id);
database/migration-audit-dump.txt:2179:CREATE INDEX ix_combat_logs_monster_id ON combat_logs(monster_id);
database/migration-audit-dump.txt:2180:CREATE INDEX ix_combat_logs_created_at ON combat_logs(created_at);
database/migration-audit-dump.txt:2204: CONSTRAINT chk_recipes_category CHECK (category IN ('Potion','Blessing','Upgrade','Boost')),
database/migration-audit-dump.txt:2299: experience_earned BIGINT NOT NULL DEFAULT 0,
database/migration-audit-dump.txt:2307: CONSTRAINT chk_gathering_sessions_xp CHECK (experience_earned >= 0),
database/migration-audit-dump.txt:2602: CONSTRAINT chk_npc_definitions_type CHECK (npc_type IN ('Vendor','Healer','BlessingMerchant','PromotionTrainer')),
database/migration-audit-dump.txt:2981:    character_experience BIGINT NOT NULL,
database/migration-audit-dump.txt:3014:                'Experience',
database/migration-audit-dump.txt:3025:    CONSTRAINT chk_season_rankings_experience
database/migration-audit-dump.txt:3026:        CHECK (character_experience >= 0),
database/migration-audit-dump.txt:3057: final_experience BIGINT NOT NULL,
database/migration-audit-dump.txt:3069: CONSTRAINT chk_hall_of_fame_experience CHECK (final_experience>=0),
database/migrations/002_achievements.sql:21:    reward_experience_percent NUMERIC(8, 4) NOT NULL DEFAULT 0,
database/migrations/002_achievements.sql:40:    CONSTRAINT chk_achievements_reward_experience_percent
database/migrations/002_achievements.sql:41:        CHECK (reward_experience_percent >= 0)
database/migrations/005_spells.sql:16:    cooldown_turns INTEGER NOT NULL DEFAULT 0,
database/migrations/005_spells.sql:38:    CONSTRAINT chk_spells_cooldown_turns CHECK (cooldown_turns >= 0),
database/migrations/006_consumable_definitions.sql:19:    potion_cooldown_turns INTEGER NOT NULL DEFAULT 0,
database/migrations/006_consumable_definitions.sql:32:            'ExperienceBoost', 'Blessing', 'ProtectionStone'
database/migrations/006_consumable_definitions.sql:41:            'ExperienceBonus', 'Blessing', 'UpgradeProtection'
database/migrations/006_consumable_definitions.sql:57:    CONSTRAINT chk_consumable_definitions_potion_cooldown
database/migrations/006_consumable_definitions.sql:58:        CHECK (potion_cooldown_turns >= 0),
database/migrations/011_monsters.sql:22:    cooldown_seconds INTEGER NOT NULL DEFAULT 0,
database/migrations/011_monsters.sql:49:    CONSTRAINT chk_monsters_cooldown CHECK (cooldown_seconds >= 0),
database/migrations/012_bosses.sql:13:    additional_cooldown_seconds INTEGER NOT NULL DEFAULT 0,
database/migrations/012_bosses.sql:30:    CONSTRAINT chk_bosses_additional_cooldown
database/migrations/012_bosses.sql:31:        CHECK (additional_cooldown_seconds >= 0)
database/migrations/017_item_bases.sql:29:    experience_percent NUMERIC(8, 4) NOT NULL DEFAULT 0,
database/migrations/017_item_bases.sql:69:            AND gold_percent >= 0 AND experience_percent >= 0
database/migrations/018_affix_templates.sql:24:            'Energy', 'GoldPercent', 'ExperiencePercent'
database/migrations/020_characters.sql:15:    experience BIGINT NOT NULL DEFAULT 0,
database/migrations/020_characters.sql:51:    CONSTRAINT chk_characters_experience CHECK (experience >= 0),
database/migrations/020_characters.sql:83:CREATE INDEX ix_characters_experience
database/migrations/020_characters.sql:84:    ON characters(experience);
database/migrations/022_character_unlocks.sql:10:    is_promoted BOOLEAN NOT NULL DEFAULT FALSE,
database/migrations/023_character_spell_mastery.sql:11:    mastery_experience BIGINT NOT NULL DEFAULT 0,
database/migrations/023_character_spell_mastery.sql:28:    CONSTRAINT chk_character_spell_mastery_experience
database/migrations/023_character_spell_mastery.sql:29:        CHECK (mastery_experience >= 0),
database/migrations/026_character_cooldowns.sql:2:-- 026_character_cooldowns.sql
database/migrations/026_character_cooldowns.sql:6:CREATE TABLE character_cooldowns (
database/migrations/026_character_cooldowns.sql:7:    character_cooldown_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
database/migrations/026_character_cooldowns.sql:9:    cooldown_type VARCHAR(32) NOT NULL,
database/migrations/026_character_cooldowns.sql:15:    CONSTRAINT fk_character_cooldowns_character
database/migrations/026_character_cooldowns.sql:20:    CONSTRAINT fk_character_cooldowns_target
database/migrations/026_character_cooldowns.sql:25:    CONSTRAINT chk_character_cooldowns_type
database/migrations/026_character_cooldowns.sql:26:        CHECK (cooldown_type IN ('Monster', 'NpcHealer')),
database/migrations/026_character_cooldowns.sql:28:    CONSTRAINT chk_character_cooldowns_target
database/migrations/026_character_cooldowns.sql:30:            (cooldown_type = 'Monster' AND target_id IS NOT NULL)
database/migrations/026_character_cooldowns.sql:32:            (cooldown_type = 'NpcHealer' AND target_id IS NULL)
database/migrations/026_character_cooldowns.sql:36:CREATE UNIQUE INDEX ux_character_cooldowns_monster
database/migrations/026_character_cooldowns.sql:37:    ON character_cooldowns(character_id, target_id)
database/migrations/026_character_cooldowns.sql:38:    WHERE cooldown_type = 'Monster';
database/migrations/026_character_cooldowns.sql:40:CREATE UNIQUE INDEX ux_character_cooldowns_npc_healer
database/migrations/026_character_cooldowns.sql:41:    ON character_cooldowns(character_id)
database/migrations/026_character_cooldowns.sql:42:    WHERE cooldown_type = 'NpcHealer';
database/migrations/026_character_cooldowns.sql:44:CREATE INDEX ix_character_cooldowns_character_id
database/migrations/026_character_cooldowns.sql:45:    ON character_cooldowns(character_id);
database/migrations/026_character_cooldowns.sql:47:CREATE INDEX ix_character_cooldowns_cooldown_type
database/migrations/026_character_cooldowns.sql:48:    ON character_cooldowns(cooldown_type);
database/migrations/026_character_cooldowns.sql:50:CREATE INDEX ix_character_cooldowns_target_id
database/migrations/026_character_cooldowns.sql:51:    ON character_cooldowns(target_id);
database/migrations/026_character_cooldowns.sql:53:CREATE INDEX ix_character_cooldowns_available_at
database/migrations/026_character_cooldowns.sql:54:    ON character_cooldowns(available_at);
database/migrations/028_character_buffs.sql:42:            'GoldBoost', 'ExperienceBoost', 'AttackBuff', 'DefenseBuff',
database/migrations/034_set_bonuses.sql:20:        CHECK (bonus_type IN ('Attack', 'Defense', 'SpellPower', 'GoldPercent', 'ExperiencePercent', 'Health', 'Mana')),
database/migrations/035_bestiary_entries.sql:2:-- 035_bestiary_entries.sql
database/migrations/035_bestiary_entries.sql:6:CREATE TABLE bestiary_entries (
database/migrations/035_bestiary_entries.sql:7:    bestiary_entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
database/migrations/035_bestiary_entries.sql:13:    CONSTRAINT fk_bestiary_entries_character
database/migrations/035_bestiary_entries.sql:15:    CONSTRAINT fk_bestiary_entries_monster
database/migrations/035_bestiary_entries.sql:17:    CONSTRAINT ux_bestiary_entries_character_monster UNIQUE (character_id, monster_id)
database/migrations/035_bestiary_entries.sql:20:CREATE INDEX ix_bestiary_entries_character_id ON bestiary_entries(character_id);
database/migrations/035_bestiary_entries.sql:21:CREATE INDEX ix_bestiary_entries_monster_id ON bestiary_entries(monster_id);
database/migrations/036_bestiary_statistics.sql:2:-- 036_bestiary_statistics.sql
database/migrations/036_bestiary_statistics.sql:6:CREATE TABLE bestiary_statistics (
database/migrations/036_bestiary_statistics.sql:7:    bestiary_statistics_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
database/migrations/036_bestiary_statistics.sql:18:    CONSTRAINT fk_bestiary_statistics_character
database/migrations/036_bestiary_statistics.sql:20:    CONSTRAINT fk_bestiary_statistics_monster
database/migrations/036_bestiary_statistics.sql:22:    CONSTRAINT ux_bestiary_statistics_character_monster UNIQUE (character_id, monster_id),
database/migrations/036_bestiary_statistics.sql:23:    CONSTRAINT chk_bestiary_statistics_kill_count CHECK (kill_count >= 1),
database/migrations/036_bestiary_statistics.sql:24:    CONSTRAINT chk_bestiary_statistics_task_progress CHECK (task_progress >= 0),
database/migrations/036_bestiary_statistics.sql:25:    CONSTRAINT chk_bestiary_statistics_dates CHECK (last_kill_at >= first_kill_at)
database/migrations/036_bestiary_statistics.sql:28:CREATE INDEX ix_bestiary_statistics_character_id ON bestiary_statistics(character_id);
database/migrations/036_bestiary_statistics.sql:29:CREATE INDEX ix_bestiary_statistics_monster_id ON bestiary_statistics(monster_id);
database/migrations/036_bestiary_statistics.sql:30:CREATE INDEX ix_bestiary_statistics_kill_count ON bestiary_statistics(kill_count);
database/migrations/041_chest_definitions.sql:5: cooldown_seconds INTEGER NOT NULL,
database/migrations/041_chest_definitions.sql:10: CONSTRAINT chk_chest_definitions_cooldown CHECK (cooldown_seconds > 0)
database/migrations/042_chest_reward_definitions.sql:15: CONSTRAINT chk_chest_reward_definitions_type CHECK (reward_type IN ('Gold','Item','Material','Consumable','Blessing','ProtectionStone','UniqueRoll','SetRoll')),
database/migrations/048_combat_spell_cooldowns.sql:1:∩╗┐-- 048_combat_spell_cooldowns.sql
database/migrations/048_combat_spell_cooldowns.sql:3:CREATE TABLE combat_spell_cooldowns (
database/migrations/048_combat_spell_cooldowns.sql:4: combat_spell_cooldown_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
database/migrations/048_combat_spell_cooldowns.sql:9: CONSTRAINT fk_combat_spell_cooldowns_session FOREIGN KEY (combat_session_id) REFERENCES combat_sessions(combat_session_id) ON DELETE CASCADE,
database/migrations/048_combat_spell_cooldowns.sql:10: CONSTRAINT fk_combat_spell_cooldowns_spell FOREIGN KEY (spell_id) REFERENCES spells(spell_id) ON DELETE RESTRICT,
database/migrations/048_combat_spell_cooldowns.sql:11: CONSTRAINT ux_combat_spell_cooldowns_session_spell UNIQUE (combat_session_id,spell_id),
database/migrations/048_combat_spell_cooldowns.sql:12: CONSTRAINT chk_combat_spell_cooldowns_turns CHECK (remaining_turns >= 0)
database/migrations/048_combat_spell_cooldowns.sql:14:CREATE INDEX ix_combat_spell_cooldowns_session_id ON combat_spell_cooldowns(combat_session_id);
database/migrations/048_combat_spell_cooldowns.sql:15:CREATE INDEX ix_combat_spell_cooldowns_spell_id ON combat_spell_cooldowns(spell_id);
database/migrations/049_combat_logs.sql:1:∩╗┐-- 049_combat_logs.sql
database/migrations/049_combat_logs.sql:3:CREATE TABLE combat_logs (
database/migrations/049_combat_logs.sql:14: CONSTRAINT fk_combat_logs_session FOREIGN KEY (combat_session_id) REFERENCES combat_sessions(combat_session_id) ON DELETE RESTRICT,
database/migrations/049_combat_logs.sql:15: CONSTRAINT fk_combat_logs_character FOREIGN KEY (character_id) REFERENCES characters(character_id) ON DELETE CASCADE,
database/migrations/049_combat_logs.sql:16: CONSTRAINT fk_combat_logs_monster FOREIGN KEY (monster_id) REFERENCES monsters(monster_id) ON DELETE RESTRICT,
database/migrations/049_combat_logs.sql:17: CONSTRAINT chk_combat_logs_result CHECK (combat_result IN ('Victory','Defeat')),
database/migrations/049_combat_logs.sql:18: CONSTRAINT chk_combat_logs_turn_count CHECK (turn_count >= 1),
database/migrations/049_combat_logs.sql:19: CONSTRAINT chk_combat_logs_dates CHECK (ended_at >= started_at)
database/migrations/049_combat_logs.sql:21:CREATE INDEX ix_combat_logs_character_id ON combat_logs(character_id);
database/migrations/049_combat_logs.sql:22:CREATE INDEX ix_combat_logs_monster_id ON combat_logs(monster_id);
database/migrations/049_combat_logs.sql:23:CREATE INDEX ix_combat_logs_created_at ON combat_logs(created_at);
database/migrations/050_recipes.sql:19: CONSTRAINT chk_recipes_category CHECK (category IN ('Potion','Blessing','Upgrade','Boost')),
database/migrations/054_gathering_sessions.sql:11: experience_earned BIGINT NOT NULL DEFAULT 0,
database/migrations/054_gathering_sessions.sql:19: CONSTRAINT chk_gathering_sessions_xp CHECK (experience_earned >= 0),
database/migrations/063_npc_definitions.sql:13: CONSTRAINT chk_npc_definitions_type CHECK (npc_type IN ('Vendor','Healer','BlessingMerchant','PromotionTrainer')),
database/migrations/076_season_rankings.sql:19:    character_experience BIGINT NOT NULL,
database/migrations/076_season_rankings.sql:52:                'Experience',
database/migrations/076_season_rankings.sql:63:    CONSTRAINT chk_season_rankings_experience
database/migrations/076_season_rankings.sql:64:        CHECK (character_experience >= 0),
database/migrations/077_hall_of_fame.sql:10: final_experience BIGINT NOT NULL,
database/migrations/077_hall_of_fame.sql:22: CONSTRAINT chk_hall_of_fame_experience CHECK (final_experience>=0),
database/migrations/084_task_status_refactor.sql:2:-- 084_task_status_refactor.sql
database/migrations/084_task_status_refactor.sql:6:ALTER TABLE bestiary_statistics
database/migrations/084_task_status_refactor.sql:7:ADD COLUMN task_status VARCHAR(32);
database/migrations/084_task_status_refactor.sql:9:UPDATE bestiary_statistics
database/migrations/084_task_status_refactor.sql:10:SET task_status =
database/migrations/084_task_status_refactor.sql:17:ALTER TABLE bestiary_statistics
database/migrations/084_task_status_refactor.sql:18:ALTER COLUMN task_status SET NOT NULL;
database/migrations/084_task_status_refactor.sql:20:ALTER TABLE bestiary_statistics
database/migrations/084_task_status_refactor.sql:21:ADD CONSTRAINT chk_bestiary_statistics_task_status
database/migrations/084_task_status_refactor.sql:23:    task_status IN (
database/migrations/084_task_status_refactor.sql:30:ALTER TABLE bestiary_statistics
database/schema-v1.sql:65:    reward_experience_percent NUMERIC(8, 4) NOT NULL DEFAULT 0,
database/schema-v1.sql:84:    CONSTRAINT chk_achievements_reward_experience_percent
database/schema-v1.sql:85:        CHECK (reward_experience_percent >= 0)
database/schema-v1.sql:213:    cooldown_turns INTEGER NOT NULL DEFAULT 0,
database/schema-v1.sql:235:    CONSTRAINT chk_spells_cooldown_turns CHECK (cooldown_turns >= 0),
database/schema-v1.sql:269:    potion_cooldown_turns INTEGER NOT NULL DEFAULT 0,
database/schema-v1.sql:282:            'ExperienceBoost', 'Blessing', 'ProtectionStone'
database/schema-v1.sql:291:            'ExperienceBonus', 'Blessing', 'UpgradeProtection'
database/schema-v1.sql:307:    CONSTRAINT chk_consumable_definitions_potion_cooldown
database/schema-v1.sql:308:        CHECK (potion_cooldown_turns >= 0),
database/schema-v1.sql:516:    cooldown_seconds INTEGER NOT NULL DEFAULT 0,
database/schema-v1.sql:543:    CONSTRAINT chk_monsters_cooldown CHECK (cooldown_seconds >= 0),
database/schema-v1.sql:576:    additional_cooldown_seconds INTEGER NOT NULL DEFAULT 0,
database/schema-v1.sql:593:    CONSTRAINT chk_bosses_additional_cooldown
database/schema-v1.sql:594:        CHECK (additional_cooldown_seconds >= 0)
database/schema-v1.sql:815:    experience_percent NUMERIC(8, 4) NOT NULL DEFAULT 0,
database/schema-v1.sql:855:            AND gold_percent >= 0 AND experience_percent >= 0
database/schema-v1.sql:911:            'Energy', 'GoldPercent', 'ExperiencePercent'
database/schema-v1.sql:992:    experience BIGINT NOT NULL DEFAULT 0,
database/schema-v1.sql:1028:    CONSTRAINT chk_characters_experience CHECK (experience >= 0),
database/schema-v1.sql:1060:CREATE INDEX ix_characters_experience
database/schema-v1.sql:1061:    ON characters(experience);
database/schema-v1.sql:1134:    is_promoted BOOLEAN NOT NULL DEFAULT FALSE,
database/schema-v1.sql:1174:    mastery_experience BIGINT NOT NULL DEFAULT 0,
database/schema-v1.sql:1191:    CONSTRAINT chk_character_spell_mastery_experience
database/schema-v1.sql:1192:        CHECK (mastery_experience >= 0),
database/schema-v1.sql:1306:-- FILE: 026_character_cooldowns.sql
database/schema-v1.sql:1310:-- 026_character_cooldowns.sql
database/schema-v1.sql:1314:CREATE TABLE character_cooldowns (
database/schema-v1.sql:1315:    character_cooldown_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
database/schema-v1.sql:1317:    cooldown_type VARCHAR(32) NOT NULL,
database/schema-v1.sql:1323:    CONSTRAINT fk_character_cooldowns_character
database/schema-v1.sql:1328:    CONSTRAINT fk_character_cooldowns_target
database/schema-v1.sql:1333:    CONSTRAINT chk_character_cooldowns_type
database/schema-v1.sql:1334:        CHECK (cooldown_type IN ('Monster', 'NpcHealer')),
database/schema-v1.sql:1336:    CONSTRAINT chk_character_cooldowns_target
database/schema-v1.sql:1338:            (cooldown_type = 'Monster' AND target_id IS NOT NULL)
database/schema-v1.sql:1340:            (cooldown_type = 'NpcHealer' AND target_id IS NULL)
database/schema-v1.sql:1344:CREATE UNIQUE INDEX ux_character_cooldowns_monster
database/schema-v1.sql:1345:    ON character_cooldowns(character_id, target_id)
database/schema-v1.sql:1346:    WHERE cooldown_type = 'Monster';
database/schema-v1.sql:1348:CREATE UNIQUE INDEX ux_character_cooldowns_npc_healer
database/schema-v1.sql:1349:    ON character_cooldowns(character_id)
database/schema-v1.sql:1350:    WHERE cooldown_type = 'NpcHealer';
database/schema-v1.sql:1352:CREATE INDEX ix_character_cooldowns_character_id
database/schema-v1.sql:1353:    ON character_cooldowns(character_id);
database/schema-v1.sql:1355:CREATE INDEX ix_character_cooldowns_cooldown_type
database/schema-v1.sql:1356:    ON character_cooldowns(cooldown_type);
database/schema-v1.sql:1358:CREATE INDEX ix_character_cooldowns_target_id
database/schema-v1.sql:1359:    ON character_cooldowns(target_id);
database/schema-v1.sql:1361:CREATE INDEX ix_character_cooldowns_available_at
database/schema-v1.sql:1362:    ON character_cooldowns(available_at);
database/schema-v1.sql:1485:            'GoldBoost', 'ExperienceBoost', 'AttackBuff', 'DefenseBuff',
database/schema-v1.sql:1724:        CHECK (bonus_type IN ('Attack', 'Defense', 'SpellPower', 'GoldPercent', 'ExperiencePercent', 'Health', 'Mana')),
database/schema-v1.sql:1731:-- FILE: 035_bestiary_entries.sql
database/schema-v1.sql:1735:-- 035_bestiary_entries.sql
database/schema-v1.sql:1739:CREATE TABLE bestiary_entries (
database/schema-v1.sql:1740:    bestiary_entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
database/schema-v1.sql:1746:    CONSTRAINT fk_bestiary_entries_character
database/schema-v1.sql:1748:    CONSTRAINT fk_bestiary_entries_monster
database/schema-v1.sql:1750:    CONSTRAINT ux_bestiary_entries_character_monster UNIQUE (character_id, monster_id)
database/schema-v1.sql:1753:CREATE INDEX ix_bestiary_entries_character_id ON bestiary_entries(character_id);
database/schema-v1.sql:1754:CREATE INDEX ix_bestiary_entries_monster_id ON bestiary_entries(monster_id);
database/schema-v1.sql:1757:-- FILE: 036_bestiary_statistics.sql
database/schema-v1.sql:1761:-- 036_bestiary_statistics.sql
database/schema-v1.sql:1765:CREATE TABLE bestiary_statistics (
database/schema-v1.sql:1766:    bestiary_statistics_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
database/schema-v1.sql:1777:    CONSTRAINT fk_bestiary_statistics_character
database/schema-v1.sql:1779:    CONSTRAINT fk_bestiary_statistics_monster
database/schema-v1.sql:1781:    CONSTRAINT ux_bestiary_statistics_character_monster UNIQUE (character_id, monster_id),
database/schema-v1.sql:1782:    CONSTRAINT chk_bestiary_statistics_kill_count CHECK (kill_count >= 1),
database/schema-v1.sql:1783:    CONSTRAINT chk_bestiary_statistics_task_progress CHECK (task_progress >= 0),
database/schema-v1.sql:1784:    CONSTRAINT chk_bestiary_statistics_dates CHECK (last_kill_at >= first_kill_at)
database/schema-v1.sql:1787:CREATE INDEX ix_bestiary_statistics_character_id ON bestiary_statistics(character_id);
database/schema-v1.sql:1788:CREATE INDEX ix_bestiary_statistics_monster_id ON bestiary_statistics(monster_id);
database/schema-v1.sql:1789:CREATE INDEX ix_bestiary_statistics_kill_count ON bestiary_statistics(kill_count);
database/schema-v1.sql:1968: cooldown_seconds INTEGER NOT NULL,
database/schema-v1.sql:1973: CONSTRAINT chk_chest_definitions_cooldown CHECK (cooldown_seconds > 0)
database/schema-v1.sql:1995: CONSTRAINT chk_chest_reward_definitions_type CHECK (reward_type IN ('Gold','Item','Material','Consumable','Blessing','ProtectionStone','UniqueRoll','SetRoll')),
database/schema-v1.sql:2137:-- FILE: 048_combat_spell_cooldowns.sql
database/schema-v1.sql:2140:-- 048_combat_spell_cooldowns.sql
database/schema-v1.sql:2142:CREATE TABLE combat_spell_cooldowns (
database/schema-v1.sql:2143: combat_spell_cooldown_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
database/schema-v1.sql:2148: CONSTRAINT fk_combat_spell_cooldowns_session FOREIGN KEY (combat_session_id) REFERENCES combat_sessions(combat_session_id) ON DELETE CASCADE,
database/schema-v1.sql:2149: CONSTRAINT fk_combat_spell_cooldowns_spell FOREIGN KEY (spell_id) REFERENCES spells(spell_id) ON DELETE RESTRICT,
database/schema-v1.sql:2150: CONSTRAINT ux_combat_spell_cooldowns_session_spell UNIQUE (combat_session_id,spell_id),
database/schema-v1.sql:2151: CONSTRAINT chk_combat_spell_cooldowns_turns CHECK (remaining_turns >= 0)
database/schema-v1.sql:2153:CREATE INDEX ix_combat_spell_cooldowns_session_id ON combat_spell_cooldowns(combat_session_id);
database/schema-v1.sql:2154:CREATE INDEX ix_combat_spell_cooldowns_spell_id ON combat_spell_cooldowns(spell_id);
database/schema-v1.sql:2157:-- FILE: 049_combat_logs.sql
database/schema-v1.sql:2160:-- 049_combat_logs.sql
database/schema-v1.sql:2162:CREATE TABLE combat_logs (
database/schema-v1.sql:2173: CONSTRAINT fk_combat_logs_session FOREIGN KEY (combat_session_id) REFERENCES combat_sessions(combat_session_id) ON DELETE RESTRICT,
database/schema-v1.sql:2174: CONSTRAINT fk_combat_logs_character FOREIGN KEY (character_id) REFERENCES characters(character_id) ON DELETE CASCADE,
database/schema-v1.sql:2175: CONSTRAINT fk_combat_logs_monster FOREIGN KEY (monster_id) REFERENCES monsters(monster_id) ON DELETE RESTRICT,
database/schema-v1.sql:2176: CONSTRAINT chk_combat_logs_result CHECK (combat_result IN ('Victory','Defeat')),
database/schema-v1.sql:2177: CONSTRAINT chk_combat_logs_turn_count CHECK (turn_count >= 1),
database/schema-v1.sql:2178: CONSTRAINT chk_combat_logs_dates CHECK (ended_at >= started_at)
database/schema-v1.sql:2180:CREATE INDEX ix_combat_logs_character_id ON combat_logs(character_id);
database/schema-v1.sql:2181:CREATE INDEX ix_combat_logs_monster_id ON combat_logs(monster_id);
database/schema-v1.sql:2182:CREATE INDEX ix_combat_logs_created_at ON combat_logs(created_at);
database/schema-v1.sql:2206: CONSTRAINT chk_recipes_category CHECK (category IN ('Potion','Blessing','Upgrade','Boost')),
database/schema-v1.sql:2301: experience_earned BIGINT NOT NULL DEFAULT 0,
database/schema-v1.sql:2309: CONSTRAINT chk_gathering_sessions_xp CHECK (experience_earned >= 0),
database/schema-v1.sql:2604: CONSTRAINT chk_npc_definitions_type CHECK (npc_type IN ('Vendor','Healer','BlessingMerchant','PromotionTrainer')),
database/schema-v1.sql:2983:    character_experience BIGINT NOT NULL,
database/schema-v1.sql:3016:                'Experience',
database/schema-v1.sql:3027:    CONSTRAINT chk_season_rankings_experience
database/schema-v1.sql:3028:        CHECK (character_experience >= 0),
database/schema-v1.sql:3059: final_experience BIGINT NOT NULL,
database/schema-v1.sql:3071: CONSTRAINT chk_hall_of_fame_experience CHECK (final_experience>=0),
database/seeds/001_chest_definitions.sql:8:    cooldown_seconds,
database/seeds/001_chest_definitions.sql:16:    cooldown_seconds = EXCLUDED.cooldown_seconds,
documentation/database-design/GDD.md:24:Earn experience, gold, equipment, and materials
documentation/database-design/GDD.md:61:Experience is earned primarily through combat.
documentation/database-design/GDD.md:66:Scaling experience requirements
documentation/database-design/GDD.md:78:Casting spells grants Spell Mastery experience.
documentation/database-design/GDD.md:111:Promotion
documentation/database-design/GDD.md:113:Promotion is a permanent unlock.
documentation/database-design/GDD.md:167:Experience %
documentation/database-design/GDD.md:199:Experience bonuses
documentation/database-design/GDD.md:301:Longer cooldowns
documentation/database-design/GDD.md:423:Blessings
documentation/database-design/achievement-design.md:60:- Experience gain percentage points  
documentation/database-design/achievement-design.md:62:Gold and Experience bonuses are percentage values.  
documentation/database-design/achievement-design.md:99:- +1% Experience Gain
documentation/database-design/achievement-design.md:118:- Experience gain bonuses
documentation/database-design/affix-definition.md:48:- Experience %
documentation/database-design/affix-definition.md:56:- Cooldown Reduction
documentation/database-design/affix-definition.md:290:Experience:
documentation/database-design/affix-definition.md:328:Experience:
documentation/database-design/affix-definition.md:362:- Experience Farming Gear
documentation/database-design/affix-definition.md:509:Experience %
documentation/database-design/bestiary-definition.md:1:# Bestiary System
documentation/database-design/bestiary-definition.md:5:The Bestiary is a monster encyclopedia and tracking system.
documentation/database-design/bestiary-definition.md:7:The Bestiary exists to:
documentation/database-design/bestiary-definition.md:16:The Bestiary is an informational system.
documentation/database-design/bestiary-definition.md:32:Bestiary progress is character-specific.
documentation/database-design/bestiary-definition.md:42:Bestiary progress is not shared between characters.
documentation/database-design/bestiary-definition.md:56:Rat appears in Bestiary
documentation/database-design/bestiary-definition.md:68:The Bestiary does not use progressive discovery.
documentation/database-design/bestiary-definition.md:85:Every unlocked Bestiary entry displays:
documentation/database-design/bestiary-definition.md:135:The Bestiary shows available rewards after unlock.
documentation/database-design/bestiary-definition.md:141:The Bestiary permanently tracks monster statistics.
documentation/database-design/bestiary-definition.md:178:Different characters do not share Bestiary statistics.
documentation/database-design/bestiary-definition.md:184:The Bestiary tracks Task Boss progression.
documentation/database-design/bestiary-definition.md:228:The Bestiary serves as the primary interface for Task Boss progression.
documentation/database-design/bestiary-definition.md:274:# Bestiary Completion
documentation/database-design/bestiary-definition.md:276:The Bestiary tracks collection progress.
documentation/database-design/bestiary-definition.md:294:Bestiary Completion % =
documentation/database-design/bestiary-definition.md:303:Character Profiles display Bestiary progression.
documentation/database-design/bestiary-definition.md:307:- Bestiary Completion %
documentation/database-design/bestiary-definition.md:313:Bestiary:
documentation/database-design/bestiary-definition.md:323:The Bestiary supports all monster categories.
documentation/database-design/bestiary-definition.md:381:- Cooldowns
documentation/database-design/bestiary-definition.md:383:All monster types appear in the Bestiary.
documentation/database-design/bestiary-definition.md:387:# Bestiary Rewards
documentation/database-design/bestiary-definition.md:389:The Bestiary provides no direct rewards.
documentation/database-design/bestiary-definition.md:398:The Bestiary is informational only.
documentation/database-design/bestiary-definition.md:411:Bestiary data supports multiple game systems.
documentation/database-design/bestiary-definition.md:430:- Bestiary Tracking
documentation/database-design/bestiary-definition.md:436:The Bestiary acts as a collection system.
documentation/database-design/bestiary-definition.md:443:- Complete Bestiary Unlocks
documentation/database-design/bestiary-definition.md:457:## BestiaryEntries
documentation/database-design/bestiary-definition.md:467:## BestiaryStatistics
documentation/database-design/bestiary-definition.md:479:The Bestiary exists to provide:
documentation/database-design/bestiary-definition.md:501:The Bestiary should help players understand the game world and track their accomplishments without becoming a progression system itself.
documentation/database-design/bestiary-definition.md:510:rather than Bestiary completion itself.
documentation/database-design/buff-system.md:23:- Experience Boost
documentation/database-design/buff-system.md:47:- Experience Boost
documentation/database-design/buff-system.md:315:## Experience Boosts
documentation/database-design/buff-system.md:317:Experience Boosts increase experience rewards from combat.
documentation/database-design/buff-system.md:321:### Small Experience Boost
documentation/database-design/buff-system.md:326:### Medium Experience Boost
documentation/database-design/buff-system.md:331:### Large Experience Boost
documentation/database-design/buff-system.md:384:- Experience Boost
documentation/database-design/buff-system.md:448:- Experience Boost
documentation/database-design/character-definition.md:10:- Experience
documentation/database-design/character-definition.md:96:- Tibia-Inspired Experience Curve
documentation/database-design/character-definition.md:97:- Combat-Focused Experience Gain
documentation/database-design/character-definition.md:99:Experience requirements continue indefinitely through a custom scaling formula.
documentation/database-design/character-definition.md:103:### Example Experience Milestones
documentation/database-design/character-definition.md:105:| Level | Total Experience |
documentation/database-design/character-definition.md:118:The experience curve continues infinitely.
documentation/database-design/character-definition.md:229:- Experience Bonus
documentation/database-design/character-definition.md:231:Gold and Experience bonuses are never flat values.
documentation/database-design/character-definition.md:265:Gold and Experience rewards are rounded down only when the final reward is calculated.
documentation/database-design/character-definition.md:341:- Small Experience Boost
documentation/database-design/character-definition.md:348:- Small Experience Boost
documentation/database-design/character-definition.md:355:- Medium Experience Boost
documentation/database-design/character-definition.md:362:- Large Experience Boost
documentation/database-design/character-definition.md:369:- 5 Large Experience Boosts
documentation/database-design/character-definition.md:382:-> Gain Spell Mastery Experience
documentation/database-design/character-definition.md:389:- Independent Experience Curve
documentation/database-design/character-definition.md:468:- Promotion
documentation/database-design/character-definition.md:477:## Promotion
documentation/database-design/character-definition.md:479:Promotion is a one-time permanent upgrade.
documentation/database-design/character-definition.md:488:Promotion reduces experience loss on death:
documentation/database-design/character-definition.md:490:- Default: 10% of Total Experience
documentation/database-design/character-definition.md:491:- Promoted: 8% of Total Experience
documentation/database-design/character-definition.md:493:Promotion is permanent.
documentation/database-design/character-definition.md:501:On death, the character loses experience.
documentation/database-design/character-definition.md:503:Experience loss:
documentation/database-design/character-definition.md:505:- Default: 10% of Total Experience
documentation/database-design/character-definition.md:506:- Promoted: 8% of Total Experience
documentation/database-design/character-definition.md:507:- Blessed: further reduced by Blessing effects
documentation/database-design/character-definition.md:511:- Experience Loss
documentation/database-design/character-definition.md:555:- Experience
documentation/database-design/character-definition.md:560:- Bestiary Progress
documentation/database-design/character-definition.md:599:- Experience
documentation/database-design/character-definition.md:624:- Experience
documentation/database-design/chest-design.md:72:The cooldown begins when the previous chest is opened.
documentation/database-design/chest-design.md:222:- Small Experience Boosts
documentation/database-design/chest-design.md:232:- Blessings
documentation/database-design/chest-design.md:245:The cooldown begins when the previous Daily Chest is opened.
documentation/database-design/chest-design.md:399:# Blessings
documentation/database-design/chest-design.md:401:Daily Chests may contain Blessings.
documentation/database-design/chest-design.md:409:- 1 Blessing
documentation/database-design/chest-design.md:443:- Experience Boosts
documentation/database-design/chest-design.md:527:- Large Experience Boost
documentation/database-design/chest-design.md:544:- Blessing
documentation/database-design/chest-design.md:628:The ideal player experience is:
documentation/database-design/combat-design.md:169:- Experience Bonus %
documentation/database-design/combat-design.md:535:# 14. Spell Cooldowns
documentation/database-design/combat-design.md:537:Every spell stores an independent cooldown.
documentation/database-design/combat-design.md:539:Cooldown unit:
documentation/database-design/combat-design.md:624:- Separate experience system
documentation/database-design/combat-design.md:875:- Experience
documentation/database-design/combat-design.md:896:10% Total Experience
documentation/database-design/combat-design.md:898:Promoted Character:
documentation/database-design/combat-design.md:900:8% Total Experience
documentation/database-design/combat-design.md:904:- Experience loss
documentation/database-design/combat-design.md:908:Experience removed through death is permanently lost.
documentation/database-design/combat-design.md:912:# 28. Blessings
documentation/database-design/combat-design.md:914:Blessings reduce death penalties.
documentation/database-design/combat-design.md:916:Only one Blessing may be active at a time.
documentation/database-design/combat-design.md:918:Blessings must be manually activated.
documentation/database-design/combat-design.md:922:- Active Blessing is consumed
documentation/database-design/combat-design.md:931:Promoted Character
documentation/database-design/combat-design.md:935:Blessings provide protection for one death only.
documentation/database-design/combat-design.md:939:# 29. Promotion
documentation/database-design/combat-design.md:941:Promotion is a permanent character upgrade.
documentation/database-design/combat-design.md:954:Promotion is permanent.
documentation/database-design/consumable-definition.md:13:- Blessings
documentation/database-design/consumable-definition.md:55:- Experience Boosts
documentation/database-design/consumable-definition.md:59:## Blessings
documentation/database-design/consumable-definition.md:276:# Potion Cooldowns
documentation/database-design/consumable-definition.md:280:Every potion may define a cooldown.
documentation/database-design/consumable-definition.md:282:Cooldowns are measured in turns.
documentation/database-design/consumable-definition.md:294:### Short Cooldown
documentation/database-design/consumable-definition.md:300:### Long Cooldown
documentation/database-design/consumable-definition.md:308:Default Potion Cooldown:
documentation/database-design/consumable-definition.md:340:Allowed if no cooldown prevents usage.
documentation/database-design/consumable-definition.md:413:# Experience Boosts
documentation/database-design/consumable-definition.md:417:Increase Experience gained from combat.
documentation/database-design/consumable-definition.md:423:### Small Experience Boost
documentation/database-design/consumable-definition.md:427:+10% Experience
documentation/database-design/consumable-definition.md:435:### Medium Experience Boost
documentation/database-design/consumable-definition.md:439:+15% Experience
documentation/database-design/consumable-definition.md:447:### Large Experience Boost
documentation/database-design/consumable-definition.md:451:+25% Experience
documentation/database-design/consumable-definition.md:551:Experience Boost
documentation/database-design/consumable-definition.md:583:# Blessings
documentation/database-design/consumable-definition.md:587:Blessings reduce death penalties.
documentation/database-design/consumable-definition.md:593:Blessings must be activated manually.
documentation/database-design/consumable-definition.md:609:- One Active Blessing
documentation/database-design/consumable-definition.md:611:Additional Blessings remain stored in inventory.
documentation/database-design/consumable-definition.md:619:- Active Blessing is consumed
documentation/database-design/consumable-definition.md:622:A new Blessing must be activated manually after death.
documentation/database-design/consumable-definition.md:628:### Non-Promoted Character
documentation/database-design/consumable-definition.md:632:10% Experience Loss
documentation/database-design/consumable-definition.md:634:With Blessing:
documentation/database-design/consumable-definition.md:636:6% Experience Loss
documentation/database-design/consumable-definition.md:640:### Promoted Character
documentation/database-design/consumable-definition.md:644:8% Experience Loss
documentation/database-design/consumable-definition.md:646:With Blessing:
documentation/database-design/consumable-definition.md:648:4% Experience Loss
documentation/database-design/consumable-definition.md:654:Blessing effects apply only once.
documentation/database-design/consumable-definition.md:658:- Blessing is consumed
documentation/database-design/consumable-definition.md:735:- Experience Boosts
documentation/database-design/consumable-definition.md:736:- Blessings
documentation/database-design/consumable-definition.md:762:- Blessings
documentation/database-design/consumable-definition.md:827:- Blessings
documentation/database-design/crafting-design.md:68:Gain Crafting Experience
documentation/database-design/crafting-design.md:83:- Separate Experience Track
documentation/database-design/crafting-design.md:84:- Unique Experience Formula
documentation/database-design/crafting-design.md:164:- Experience Boosts
documentation/database-design/crafting-design.md:178:## Blessings
documentation/database-design/crafting-design.md:180:Blessings may be crafted as an alternative to:
documentation/database-design/crafting-design.md:277:### Blessing
documentation/database-design/crafting-design.md:297:# Crafting Experience
documentation/database-design/crafting-design.md:301:Every recipe grants a fixed amount of Crafting Experience.
documentation/database-design/crafting-design.md:303:Experience values never decay.
documentation/database-design/crafting-design.md:327:The same recipe always grants the same Crafting Experience.
documentation/database-design/crafting-design.md:355:Blessing
documentation/database-design/crafting-design.md:641:# Blessings
documentation/database-design/crafting-design.md:645:Blessings may be crafted.
documentation/database-design/crafting-design.md:662:Blessing recipes require:
documentation/database-design/crafting-design.md:735:## Experience Boosts
documentation/database-design/crafting-design.md:739:+10% Experience
documentation/database-design/crafting-design.md:747:+15% Experience
documentation/database-design/crafting-design.md:755:+25% Experience
documentation/database-design/crafting-design.md:792:Experience Boost
documentation/database-design/crafting-design.md:828:Blessing
documentation/database-design/daily-boss-definition.md:564:This provides visible prestige for experienced players.
documentation/database-design/database-architecture.md:240:- Experience
documentation/database-design/database-architecture.md:277:- Promotion
documentation/database-design/database-architecture.md:582:- Cooldown
documentation/database-design/economy-design.md:78:- Blessing purchases
documentation/database-design/economy-design.md:249:# Blessings Economy
documentation/database-design/economy-design.md:251:Blessings may be:
documentation/database-design/economy-design.md:259:## Blessing Cost
documentation/database-design/economy-design.md:287:# Promotion
documentation/database-design/economy-design.md:289:Promotion is a one-time permanent upgrade.
documentation/database-design/economy-design.md:298:- Reduces death experience loss from 10% to 8%
documentation/database-design/economy-design.md:374:- Blessings
documentation/database-design/economy-design.md:375:- Experience boosts
documentation/database-design/economy-design.md:594:3. Blessings
documentation/database-design/equipment-design.md:214:- Experience %
documentation/database-design/equipment-design.md:318:- Experience %
documentation/database-design/equipment-design.md:326:- Cooldown Reduction
documentation/database-design/equipment-design.md:392:Experience +5%
documentation/database-design/equipment-design.md:438:Experience: 5
documentation/database-design/equipment-design.md:446:Experience: 100
documentation/database-design/equipment-design.md:748:+5% Experience
documentation/database-design/friend-system.md:212:- Bestiary Progress
documentation/database-design/gambling-definition.md:181:- Blessing Purchases
documentation/database-design/gambling-definition.md:190:3. Blessings
documentation/database-design/gathering-design.md:64:Gain Gathering Experience
documentation/database-design/gathering-design.md:79:- Separate Experience Track
documentation/database-design/gathering-design.md:362:# Gathering Experience
documentation/database-design/gathering-design.md:366:Gathering Experience is awarded from successful gathering activity.
documentation/database-design/gathering-design.md:382:Experience accumulates while the player is offline.
documentation/database-design/gathering-design.md:430:- Blessings
documentation/database-design/gathering-design.md:435:- Experience Boosts
documentation/database-design/gathering-design.md:477:- Blessings
documentation/database-design/gathering-design.md:696:The intended experience is:
documentation/database-design/holy-grail-definition.md:87:- Experience
documentation/database-design/holy-grail-definition.md:92:- Bestiary Progress
documentation/database-design/item-definition.md:69:- Bestiary
documentation/database-design/item-definition.md:203:- Experience %
documentation/database-design/item-definition.md:341:Experience:
documentation/database-design/item-definition.md:353:Experience:
documentation/database-design/item-definition.md:491:+5% Experience
documentation/database-design/loot-design.md:265:- Blessings
documentation/database-design/loot-design.md:291:- Higher Blessing Rates
documentation/database-design/loot-design.md:303:- Blessing Crafting
documentation/database-design/loot-design.md:370:- Blessings
documentation/database-design/loot-design.md:564:Blessings:
documentation/database-design/mail-system.md:65:- Blessings
documentation/database-design/marketplace-definition.md:125:- Blessings
documentation/database-design/marketplace-definition.md:401:- Blessings
documentation/database-design/marketplace-definition.md:502:- Experience %
documentation/database-design/material-definition.md:11:- Blessings
documentation/database-design/material-definition.md:344:ΓåÆ Endgame Blessings
documentation/database-design/monster-definition.md:56:- Bestiary
documentation/database-design/monster-definition.md:176:## Cooldown
documentation/database-design/monster-definition.md:188:Cooldown is tracked per player.
documentation/database-design/monster-definition.md:190:Every player has independent cooldown tracking.
documentation/database-design/monster-definition.md:333:- Blessings
documentation/database-design/monster-definition.md:405:# 8. Bestiary
documentation/database-design/monster-definition.md:417:Rat unlocked in Bestiary
documentation/database-design/monster-definition.md:427:Each Bestiary entry displays:
documentation/database-design/monster-definition.md:448:The Bestiary permanently tracks:
documentation/database-design/monster-definition.md:474:The Bestiary displays Task Boss progress.
documentation/database-design/monster-definition.md:544:## Bestiary Completion
documentation/database-design/monster-definition.md:546:The Bestiary tracks collection progress.
documentation/database-design/monster-definition.md:564:- Bestiary Completion %
documentation/database-design/monster-definition.md:570:Bestiary:
documentation/database-design/monster-definition.md:582:The Bestiary provides:
documentation/database-design/monster-definition.md:589:The Bestiary is informational only.
documentation/database-design/monster-definition.md:624:- Cooldowns
documentation/database-design/monster-definition.md:632:## BestiaryEntries
documentation/database-design/monster-definition.md:642:## BestiaryStatistics
documentation/database-design/monster-definition.md:682:The Bestiary exists to provide:
documentation/database-design/monster-definition.md:733:- Bestiary
documentation/database-design/npc-definition.md:11:- Blessing Vendors
documentation/database-design/npc-definition.md:40:- Blessings
documentation/database-design/npc-definition.md:41:- Experience Boosts
documentation/database-design/npc-definition.md:126:# Blessings
documentation/database-design/npc-definition.md:128:Blessings may be purchased from NPC Vendors.
documentation/database-design/npc-definition.md:130:Blessings may also be:
documentation/database-design/npc-definition.md:137:## Blessing Cost
documentation/database-design/npc-definition.md:244:# Promotion
documentation/database-design/npc-definition.md:246:Promotion is a permanent character upgrade.
documentation/database-design/npc-definition.md:255:- Reduces death experience loss from 10% to 8%
documentation/database-design/npc-definition.md:257:The method of purchasing Promotion is not specified.
documentation/database-design/npc-definition.md:273:- Blessing Purchases
documentation/database-design/npc-definition.md:287:- Blessing Access
documentation/database-design/recipe-definition.md:36:- Blessing
documentation/database-design/recipe-definition.md:92:Blessing
documentation/database-design/recipe-definition.md:126:- Experience Boost
documentation/database-design/recipe-definition.md:127:- Blessing
documentation/database-design/recipe-definition.md:180:Blessing:
documentation/database-design/recipe-definition.md:212:Blessing
documentation/database-design/recipe-definition.md:220:# 9. Crafting Experience
documentation/database-design/recipe-definition.md:222:Each recipe grants a fixed amount of Crafting Experience.
documentation/database-design/recipe-definition.md:238:Blessing
documentation/database-design/recipe-definition.md:242:Crafting Experience is granted when crafting completes.
documentation/database-design/recipe-definition.md:260:Blessing
documentation/database-design/recipe-definition.md:294:- Blessings
documentation/database-design/recipe-definition.md:317:## Blessings
documentation/database-design/recipe-definition.md:321:- Blessings
documentation/database-design/recipe-definition.md:401:# 15. Blessings
documentation/database-design/recipe-definition.md:403:Only one Blessing exists.
documentation/database-design/recipe-definition.md:454:The intended player experience is:
documentation/database-design/season-design.md:63:Experience Leaderboard
documentation/database-design/season-design.md:68:2. Highest Experience
documentation/database-design/season-design.md:70:The player with the most experience at season end is the winner.
documentation/database-design/season-design.md:146:- Final Experience
documentation/database-design/season-design.md:174:- Experience
documentation/database-design/season-design.md:265:- No Bonus Experience
documentation/database-design/season-design.md:399:#1 on the Experience Leaderboard
documentation/database-design/spell-definition.md:319:# 8. Cooldowns
documentation/database-design/spell-definition.md:321:Every spell contains a Cooldown.
documentation/database-design/spell-definition.md:323:Cooldowns are stored in turns.
documentation/database-design/spell-definition.md:343:Cooldowns are tracked independently.
documentation/database-design/task-boss-definition.md:150:- Cooldowns
documentation/database-design/task-boss-definition.md:197:# Bestiary Integration
documentation/database-design/task-boss-definition.md:199:The Bestiary displays task progress for monsters that unlock Task Bosses.
documentation/database-design/task-boss-definition.md:262:- Bestiary
documentation/database-design/task-boss-definition.md:284:- Cooldowns
documentation/database-design/task-system.md:110:# Bestiary Integration
documentation/database-design/task-system.md:112:Task progress is displayed directly in the Bestiary.
documentation/database-design/task-system.md:178:- Bestiary
documentation/database-design/upgrade-system.md:277:- Blessing Crafting
documentation/game-design/CURRENT_MILESTONE.md:163:The older `combat_logs` table remains outside the incremental M5 action flow.
documentation/game-design/CURRENT_MILESTONE.md:317:- Experience rewards,
documentation/game-design/CURRENT_MILESTONE.md:321:- blessing consumption,
documentation/game-design/CURRENT_MILESTONE.md:323:- Bestiary progression,
documentation/game-design/CURRENT_MILESTONE.md:325:- monster cooldown writes,
documentation/game-design/CURRENT_MILESTONE.md:326:- final combat summaries in `combat_logs`,
documentation/game-design/MASTER_PROJECT_PLAN.md:9:ΓåÆ Gain Experience, Gold, Items, and Materials
documentation/game-design/MASTER_PROJECT_PLAN.md:68:- Experience
documentation/game-design/MASTER_PROJECT_PLAN.md:84:- Bestiary
documentation/game-design/MASTER_PROJECT_PLAN.md:170:- Experience: `0`
documentation/game-design/MASTER_PROJECT_PLAN.md:181:- Crafting Experience: `0`
documentation/game-design/MASTER_PROJECT_PLAN.md:183:- Gathering Experience: `0`
documentation/game-design/MASTER_PROJECT_PLAN.md:185:- Promotion: `false`
documentation/game-design/MASTER_PROJECT_PLAN.md:593:- Active Gold and Experience progression boosts.
documentation/game-design/MASTER_PROJECT_PLAN.md:636:  experienceBonusPercent: number;
documentation/game-design/MASTER_PROJECT_PLAN.md:652:- active Experience progression boosts,
documentation/game-design/MASTER_PROJECT_PLAN.md:686:Experience Bonus:   0%
documentation/game-design/MASTER_PROJECT_PLAN.md:756:- Experience Bonus percentage points.
documentation/game-design/MASTER_PROJECT_PLAN.md:800:- Experience Bonus percentage points.
documentation/game-design/MASTER_PROJECT_PLAN.md:807:- Experience Bonus.
documentation/game-design/MASTER_PROJECT_PLAN.md:839:Gold and Experience bonuses are additive percentage points.
documentation/game-design/MASTER_PROJECT_PLAN.md:862:- Gold and Experience bonuses are returned as additive percentage points.
documentation/game-design/MASTER_PROJECT_PLAN.md:1068:- active Experience progression boosts,
documentation/game-design/MASTER_PROJECT_PLAN.md:1073:- additive Gold and Experience percentage points,
documentation/game-design/MASTER_PROJECT_PLAN.md:1122:- [x] Active Gold and Experience boosts are included.
documentation/game-design/MASTER_PROJECT_PLAN.md:1163:- Experience awards,
documentation/game-design/MASTER_PROJECT_PLAN.md:1198:- Character-specific cooldown calculation.
documentation/game-design/MASTER_PROJECT_PLAN.md:1199:- Character-specific Bestiary visibility.
documentation/game-design/MASTER_PROJECT_PLAN.md:1243:- cooldown state when applicable,
documentation/game-design/MASTER_PROJECT_PLAN.md:1244:- Bestiary visibility state.
documentation/game-design/MASTER_PROJECT_PLAN.md:1315:- `COOLDOWN_ACTIVE`
documentation/game-design/MASTER_PROJECT_PLAN.md:1326:- no active character-and-monster cooldown.
documentation/game-design/MASTER_PROJECT_PLAN.md:1328:Cooldowns are specific to:
documentation/game-design/MASTER_PROJECT_PLAN.md:1333:A cooldown belonging to another character does not affect eligibility.
documentation/game-design/MASTER_PROJECT_PLAN.md:1340:- no active character-and-monster cooldown.
documentation/game-design/MASTER_PROJECT_PLAN.md:1342:Mini Boss cooldown eligibility uses the same deterministic cooldown model as Normal Monsters.
documentation/game-design/MASTER_PROJECT_PLAN.md:1344:### Cooldown model
documentation/game-design/MASTER_PROJECT_PLAN.md:1346:Cooldown state is calculated from:
documentation/game-design/MASTER_PROJECT_PLAN.md:1348:- the authoritative cooldown timestamp,
documentation/game-design/MASTER_PROJECT_PLAN.md:1353:When a cooldown is active:
documentation/game-design/MASTER_PROJECT_PLAN.md:1357:reason = COOLDOWN_ACTIVE
documentation/game-design/MASTER_PROJECT_PLAN.md:1360:When the cooldown expires, the monster becomes eligible if all other rules pass.
documentation/game-design/MASTER_PROJECT_PLAN.md:1362:M3 reads cooldown state but does not create or update cooldown records.
documentation/game-design/MASTER_PROJECT_PLAN.md:1391:An ordinary monster cooldown does not affect Task Boss eligibility.
documentation/game-design/MASTER_PROJECT_PLAN.md:1410:084_task_status_refactor.sql
documentation/game-design/MASTER_PROJECT_PLAN.md:1427:An ordinary monster cooldown does not affect Daily Boss eligibility.
documentation/game-design/MASTER_PROJECT_PLAN.md:1484:### Bestiary visibility
documentation/game-design/MASTER_PROJECT_PLAN.md:1486:Discovery includes character-specific Bestiary visibility.
documentation/game-design/MASTER_PROJECT_PLAN.md:1488:Bestiary state is loaded for the selected character.
documentation/game-design/MASTER_PROJECT_PLAN.md:1490:One characterΓÇÖs Bestiary visibility does not affect another character.
documentation/game-design/MASTER_PROJECT_PLAN.md:1492:M3 reads Bestiary state but does not create or update Bestiary records.
documentation/game-design/MASTER_PROJECT_PLAN.md:1524:- cooldown timestamps,
documentation/game-design/MASTER_PROJECT_PLAN.md:1528:- Bestiary visibility,
documentation/game-design/MASTER_PROJECT_PLAN.md:1548:- cooldown calculation,
documentation/game-design/MASTER_PROJECT_PLAN.md:1586:- calculate cooldowns,
documentation/game-design/MASTER_PROJECT_PLAN.md:1600:Γöé   Γö£ΓöÇΓöÇ monster-cooldown.ts
documentation/game-design/MASTER_PROJECT_PLAN.md:1618:084_task_status_refactor.sql
documentation/game-design/MASTER_PROJECT_PLAN.md:1658:- deterministic cooldown calculation,
documentation/game-design/MASTER_PROJECT_PLAN.md:1659:- active cooldown rejection,
documentation/game-design/MASTER_PROJECT_PLAN.md:1660:- expired cooldown handling,
documentation/game-design/MASTER_PROJECT_PLAN.md:1668:- character-specific Bestiary visibility,
documentation/game-design/MASTER_PROJECT_PLAN.md:1673:- Task Boss cooldown exclusion,
documentation/game-design/MASTER_PROJECT_PLAN.md:1700:Γö£ΓöÇΓöÇ monster-cooldown.test.ts
documentation/game-design/MASTER_PROJECT_PLAN.md:1710:3f84ece  Replace task_unlocked with task_status
documentation/game-design/MASTER_PROJECT_PLAN.md:1719:39ee38e  Add monster cooldown domain model
documentation/game-design/MASTER_PROJECT_PLAN.md:1727:b1dad30  Add deterministic monster cooldown logic
documentation/game-design/MASTER_PROJECT_PLAN.md:1759:- [x] Character-specific cooldown state implemented.
documentation/game-design/MASTER_PROJECT_PLAN.md:1760:- [x] Cooldown calculation uses injected time.
documentation/game-design/MASTER_PROJECT_PLAN.md:1761:- [x] Character-specific Bestiary visibility implemented.
documentation/game-design/MASTER_PROJECT_PLAN.md:1804:- write monster cooldowns,
documentation/game-design/MASTER_PROJECT_PLAN.md:1805:- update Bestiary,
documentation/game-design/MASTER_PROJECT_PLAN.md:1816:Victory, defeat, cooldown recording, Bestiary progression, kill statistics, and Task Boss progression belong to M6 or later milestones.
documentation/game-design/MASTER_PROJECT_PLAN.md:2038:- write cooldowns, Bestiary, kill, or Task Boss progress,
documentation/game-design/MASTER_PROJECT_PLAN.md:2121:Persistent combat sessions, combat HTTP endpoints, authentication, ownership, expected-turn concurrency, Energy deduction, persistent events and logs, rewards, progression, cooldown writes, Bestiary updates, Task Boss progression, spells, consumables, monster abilities, active effects, multiple targets, escape, and abandonment remain outside M4.
documentation/game-design/MASTER_PROJECT_PLAN.md:2374:The M5 endpoint does not read from the older `combat_logs` table.
documentation/game-design/MASTER_PROJECT_PLAN.md:2376:`combat_logs` remains reserved for final whole-combat summaries and recent-history retention in M6 or a later milestone.
documentation/game-design/MASTER_PROJECT_PLAN.md:2518:- Experience awards,
documentation/game-design/MASTER_PROJECT_PLAN.md:2522:- promotion death modifiers,
documentation/game-design/MASTER_PROJECT_PLAN.md:2523:- Blessing death modifiers and consumption,
documentation/game-design/MASTER_PROJECT_PLAN.md:2524:- final summaries in `combat_logs`,
documentation/game-design/MASTER_PROJECT_PLAN.md:2526:- monster cooldown writes,
documentation/game-design/MASTER_PROJECT_PLAN.md:2527:- Bestiary progression,
documentation/game-design/MASTER_PROJECT_PLAN.md:2553:- Experience awards
documentation/game-design/MASTER_PROJECT_PLAN.md:2557:- Death Experience loss
documentation/game-design/MASTER_PROJECT_PLAN.md:2558:- Promotion modifier
documentation/game-design/MASTER_PROJECT_PLAN.md:2559:- Blessing modifier
documentation/game-design/MASTER_PROJECT_PLAN.md:2563:- Monster cooldown recording
documentation/game-design/MASTER_PROJECT_PLAN.md:2564:- Bestiary updates
documentation/game-design/MASTER_PROJECT_PLAN.md:2570:2. Grant Experience.
documentation/game-design/MASTER_PROJECT_PLAN.md:2577:9. Update Bestiary.
documentation/game-design/MASTER_PROJECT_PLAN.md:2579:11. Record monster cooldown.
documentation/game-design/MASTER_PROJECT_PLAN.md:2586:- Promoted: 8%
documentation/game-design/MASTER_PROJECT_PLAN.md:2588:- Promoted and Blessed: 4%
documentation/game-design/MASTER_PROJECT_PLAN.md:2595:- Promotion and Blessing modify death loss correctly.
documentation/game-design/MASTER_PROJECT_PLAN.md:2596:- Blessing is consumed exactly once.
documentation/game-design/MASTER_PROJECT_PLAN.md:2715:- Cooldowns
documentation/game-design/MASTER_PROJECT_PLAN.md:2729:- Cooldowns work.
documentation/game-design/MASTER_PROJECT_PLAN.md:2766:- Potion cooldowns
documentation/game-design/MASTER_PROJECT_PLAN.md:2826:- Promotion
documentation/game-design/MASTER_PROJECT_PLAN.md:2830:- Blessing purchase and activation
documentation/game-design/MASTER_PROJECT_PLAN.md:2841:- NPC cooldowns survive restarts.
documentation/game-design/MASTER_PROJECT_PLAN.md:2893:- Crafting Experience and levels
documentation/game-design/MASTER_PROJECT_PLAN.md:2933:- Mini-boss cooldowns
documentation/game-design/MASTER_PROJECT_PLAN.md:2955:## M18: BESTIARY AND ACHIEVEMENTS
documentation/game-design/MASTER_PROJECT_PLAN.md:2959:- First-kill Bestiary unlock
documentation/game-design/MASTER_PROJECT_PLAN.md:2972:- Bestiary is character-specific.
documentation/game-design/MASTER_PROJECT_PLAN.md:3042:- Experience leaderboard
documentation/game-design/MASTER_PROJECT_PLAN.md:3181:3. Experience progression
documentation/game-design/MASTER_PROJECT_PLAN.md:3221:- Experience and levels work.
documentation/game-design/MASTER_PROJECT_PLAN.md:3229:- Bestiary and achievements work.
documentation/game-design/MASTER_PROJECT_PLAN.md:3264:18. M18 Bestiary and Achievements
documentation/game-design/MASTER_PROJECT_PLAN.md:3357:The backend does not yet settle victory rewards, death penalties, Experience, Gold, loot, cooldowns, Bestiary progress, kill statistics, or Task Boss progress.
documentation/game-design/MASTER_PROJECT_PLAN.md:3369:- victory settlement,
documentation/game-design/MASTER_PROJECT_PLAN.md:3370:- defeat settlement,
documentation/game-design/MASTER_PROJECT_PLAN.md:3371:- Experience awards,
documentation/game-design/MASTER_PROJECT_PLAN.md:3376:- death Experience loss,
documentation/game-design/MASTER_PROJECT_PLAN.md:3378:- promotion death modifiers,
documentation/game-design/MASTER_PROJECT_PLAN.md:3379:- Blessing state and consumption,
documentation/game-design/MASTER_PROJECT_PLAN.md:3380:- exactly-once reward settlement,
documentation/game-design/MASTER_PROJECT_PLAN.md:3383:- Bestiary updates,
documentation/game-design/MASTER_PROJECT_PLAN.md:3385:- monster cooldown recording,
documentation/game-design/MASTER_PROJECT_PLAN.md:3386:- final `combat_logs` summaries,
src/modules/characters/domain/character.constants.ts:17:  experience: 0n,
src/modules/characters/domain/character.constants.ts:34:  craftingExperience: 0n,
src/modules/characters/domain/character.constants.ts:37:  gatheringExperience: 0n,
src/modules/characters/domain/character.types.ts:42:  experience: bigint;
src/modules/characters/domain/character.types.ts:46:  craftingExperience: bigint;
src/modules/characters/domain/character.types.ts:49:  gatheringExperience: bigint;
src/modules/characters/domain/character.types.ts:56:  promoted: boolean;
src/modules/characters/domain/character.types.ts:68:  experience: bigint;
src/modules/characters/domain/effective-character-statistics.ts:9:  experienceBonusPercent: number;
src/modules/characters/domain/effective-character-statistics.ts:29:  experienceBonusPercent: number;
src/modules/characters/domain/effective-character-statistics.ts:129:  const experienceBonusPercent =
src/modules/characters/domain/effective-character-statistics.ts:132:      "experienceBonusPercent"
src/modules/characters/domain/effective-character-statistics.ts:136:      "experienceBonusPercent"
src/modules/characters/domain/effective-character-statistics.ts:140:      "experienceBonusPercent"
src/modules/characters/domain/effective-character-statistics.ts:163:    experienceBonusPercent: Math.max(
src/modules/characters/domain/effective-character-statistics.ts:165:      experienceBonusPercent
src/modules/characters/infrastructure/postgres-character-statistics.repository.ts:32:  equipment_experience_percent: string;
src/modules/characters/infrastructure/postgres-character-statistics.repository.ts:36:  achievement_experience_percent: string;
src/modules/characters/infrastructure/postgres-character-statistics.repository.ts:38:  boost_experience_percent: string;
src/modules/characters/infrastructure/postgres-character-statistics.repository.ts:72:        ib.experience_percent +
src/modules/characters/infrastructure/postgres-character-statistics.repository.ts:73:        COALESCE(ia.experience_percent, 0)
src/modules/characters/infrastructure/postgres-character-statistics.repository.ts:76:    ) + COALESCE(MAX(sb.experience_percent), 0)
src/modules/characters/infrastructure/postgres-character-statistics.repository.ts:77:      AS equipment_experience_percent,
src/modules/characters/infrastructure/postgres-character-statistics.repository.ts:85:    COALESCE(MAX(achievement.experience_percent), 0)
src/modules/characters/infrastructure/postgres-character-statistics.repository.ts:86:      AS achievement_experience_percent,
src/modules/characters/infrastructure/postgres-character-statistics.repository.ts:89:    COALESCE(MAX(boost.experience_percent), 0)
src/modules/characters/infrastructure/postgres-character-statistics.repository.ts:90:      AS boost_experience_percent
src/modules/characters/infrastructure/postgres-character-statistics.repository.ts:131:        WHERE at.affix_type = 'ExperiencePercent'
src/modules/characters/infrastructure/postgres-character-statistics.repository.ts:132:      ), 0) AS experience_percent
src/modules/characters/infrastructure/postgres-character-statistics.repository.ts:160:        WHERE selected.bonus_type = 'ExperiencePercent'
src/modules/characters/infrastructure/postgres-character-statistics.repository.ts:161:      ), 0) AS experience_percent
src/modules/characters/infrastructure/postgres-character-statistics.repository.ts:199:      COALESCE(SUM(a.reward_experience_percent), 0)
src/modules/characters/infrastructure/postgres-character-statistics.repository.ts:200:        AS experience_percent
src/modules/characters/infrastructure/postgres-character-statistics.repository.ts:215:        WHERE cb.buff_type = 'ExperienceBoost'
src/modules/characters/infrastructure/postgres-character-statistics.repository.ts:216:      ), 0) AS experience_percent
src/modules/characters/infrastructure/postgres-character-statistics.repository.ts:302:        experienceBonusPercent: parseNumericValue(
src/modules/characters/infrastructure/postgres-character-statistics.repository.ts:303:          row.boost_experience_percent,
src/modules/characters/infrastructure/postgres-character-statistics.repository.ts:304:          "boost_experience_percent"
src/modules/characters/infrastructure/postgres-character-statistics.repository.ts:320:        experienceBonusPercent: parseNumericValue(
src/modules/characters/infrastructure/postgres-character-statistics.repository.ts:321:          row.achievement_experience_percent,
src/modules/characters/infrastructure/postgres-character-statistics.repository.ts:322:          "achievement_experience_percent"
src/modules/characters/infrastructure/postgres-character-statistics.repository.ts:354:        experienceBonusPercent: parseNumericValue(
src/modules/characters/infrastructure/postgres-character-statistics.repository.ts:355:          row.equipment_experience_percent,
src/modules/characters/infrastructure/postgres-character-statistics.repository.ts:356:          "equipment_experience_percent"
src/modules/characters/infrastructure/postgres-character.mapper.ts:20:  experience: string;
src/modules/characters/infrastructure/postgres-character.mapper.ts:33:  experience: string;
src/modules/characters/infrastructure/postgres-character.mapper.ts:53:  is_promoted: boolean;
src/modules/characters/infrastructure/postgres-character.mapper.ts:138:    experience: parseBigIntValue(
src/modules/characters/infrastructure/postgres-character.mapper.ts:139:      row.experience,
src/modules/characters/infrastructure/postgres-character.mapper.ts:140:      "experience"
src/modules/characters/infrastructure/postgres-character.mapper.ts:169:      experience: parseBigIntValue(
src/modules/characters/infrastructure/postgres-character.mapper.ts:170:        row.experience,
src/modules/characters/infrastructure/postgres-character.mapper.ts:171:        "experience"
src/modules/characters/infrastructure/postgres-character.mapper.ts:181:      craftingExperience: parseBigIntValue(
src/modules/characters/infrastructure/postgres-character.mapper.ts:188:      gatheringExperience: parseBigIntValue(
src/modules/characters/infrastructure/postgres-character.mapper.ts:241:      promoted: row.is_promoted,
src/modules/characters/infrastructure/postgres-character.repository.ts:64:  experience,
src/modules/characters/infrastructure/postgres-character.repository.ts:78:    c.experience,
src/modules/characters/infrastructure/postgres-character.repository.ts:98:    u.is_promoted,
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:24:  calculateMonsterCooldown,
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:25:} from "../../monsters/domain/monster-cooldown.js";
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:113:  cooldown_available_at: Date | null;
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:114:  task_status: TaskStatus | null;
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:389:              AS cooldown_available_at,
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:391:            task_statistics.task_status,
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:414:          LEFT JOIN character_cooldowns AS cc
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:417:            AND cc.cooldown_type = 'Monster'
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:428:          LEFT JOIN bestiary_statistics
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:480:    const cooldown =
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:481:      calculateMonsterCooldown(
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:482:        row.cooldown_available_at,
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:505:        cooldownActive:
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:506:          cooldown.isActive,
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:507:        taskStatus: row.task_status,
src/modules/monsters/application/get-monster-details.service.ts:8:  calculateMonsterCooldown,
src/modules/monsters/application/get-monster-details.service.ts:9:} from "../domain/monster-cooldown.js";
src/modules/monsters/application/get-monster-details.service.ts:44:    const cooldown =
src/modules/monsters/application/get-monster-details.service.ts:45:      calculateMonsterCooldown(
src/modules/monsters/application/get-monster-details.service.ts:46:        record.cooldownAvailableAt,
src/modules/monsters/application/get-monster-details.service.ts:67:          cooldownActive:
src/modules/monsters/application/get-monster-details.service.ts:68:            cooldown.isActive,
src/modules/monsters/application/get-monster-details.service.ts:83:      cooldown,
src/modules/monsters/application/get-monster-details.service.ts:85:      bestiaryVisible:
src/modules/monsters/application/get-monster-details.service.ts:86:        record.bestiaryVisible,
src/modules/monsters/application/get-monster-list.service.ts:5:  calculateMonsterCooldown,
src/modules/monsters/application/get-monster-list.service.ts:6:} from "../domain/monster-cooldown.js";
src/modules/monsters/application/get-monster-list.service.ts:23:  const cooldown =
src/modules/monsters/application/get-monster-list.service.ts:24:    calculateMonsterCooldown(
src/modules/monsters/application/get-monster-list.service.ts:25:      record.cooldownAvailableAt,
src/modules/monsters/application/get-monster-list.service.ts:45:        cooldownActive:
src/modules/monsters/application/get-monster-list.service.ts:46:          cooldown.isActive,
src/modules/monsters/application/get-monster-list.service.ts:61:    cooldown,
src/modules/monsters/application/get-monster-list.service.ts:63:    bestiaryVisible:
src/modules/monsters/application/get-monster-list.service.ts:64:      record.bestiaryVisible,
src/modules/monsters/application/monster-discovery.models.ts:7:  MonsterCooldown,
src/modules/monsters/application/monster-discovery.models.ts:8:} from "../domain/monster-cooldown.js";
src/modules/monsters/application/monster-discovery.models.ts:19:  cooldown: MonsterCooldown;
src/modules/monsters/application/monster-discovery.models.ts:21:  bestiaryVisible: boolean;
src/modules/monsters/application/monster-discovery.repository.ts:20:  bestiaryVisible: boolean;
src/modules/monsters/application/monster-discovery.repository.ts:21:  cooldownAvailableAt: Date | null;
src/modules/monsters/domain/monster-cooldown.ts:1:export type MonsterCooldown = {
src/modules/monsters/domain/monster-cooldown.ts:20:export function calculateMonsterCooldown(
src/modules/monsters/domain/monster-cooldown.ts:23:): MonsterCooldown {
src/modules/monsters/domain/monster-eligibility.ts:3:  TASK_STATUS,
src/modules/monsters/domain/monster-eligibility.ts:15:  cooldownActive: boolean;
src/modules/monsters/domain/monster-eligibility.ts:91:  const usesStandardCooldown =
src/modules/monsters/domain/monster-eligibility.ts:98:    usesStandardCooldown &&
src/modules/monsters/domain/monster-eligibility.ts:99:    input.cooldownActive
src/modules/monsters/domain/monster-eligibility.ts:101:    reasons.push("COOLDOWN_ACTIVE");
src/modules/monsters/domain/monster-eligibility.ts:110:      input.taskStatus === TASK_STATUS.active
src/modules/monsters/domain/monster-eligibility.ts:117:      TASK_STATUS.waitingForReunlock
src/modules/monsters/domain/monster.types.ts:11:export const TASK_STATUS = {
src/modules/monsters/domain/monster.types.ts:19:  (typeof TASK_STATUS)[keyof typeof TASK_STATUS];
src/modules/monsters/domain/monster.types.ts:25:  | "COOLDOWN_ACTIVE"
src/modules/monsters/infrastructure/postgres-monster-discovery.repository.ts:41:  m.cooldown_seconds,
src/modules/monsters/infrastructure/postgres-monster-discovery.repository.ts:46:    be.bestiary_entry_id IS NOT NULL
src/modules/monsters/infrastructure/postgres-monster-discovery.repository.ts:47:  ) AS bestiary_visible,
src/modules/monsters/infrastructure/postgres-monster-discovery.repository.ts:49:  cc.available_at AS cooldown_available_at,
src/modules/monsters/infrastructure/postgres-monster-discovery.repository.ts:51:  task_statistics.task_status,
src/modules/monsters/infrastructure/postgres-monster-discovery.repository.ts:74:  LEFT JOIN bestiary_entries AS be
src/modules/monsters/infrastructure/postgres-monster-discovery.repository.ts:78:  LEFT JOIN character_cooldowns AS cc
src/modules/monsters/infrastructure/postgres-monster-discovery.repository.ts:81:    AND cc.cooldown_type = 'Monster'
src/modules/monsters/infrastructure/postgres-monster-discovery.repository.ts:90:  LEFT JOIN bestiary_statistics
src/modules/monsters/infrastructure/postgres-monster.mapper.ts:7:  TASK_STATUS,
src/modules/monsters/infrastructure/postgres-monster.mapper.ts:24:  cooldown_seconds: number;
src/modules/monsters/infrastructure/postgres-monster.mapper.ts:27:  bestiary_visible: boolean;
src/modules/monsters/infrastructure/postgres-monster.mapper.ts:28:  cooldown_available_at: Date | null;
src/modules/monsters/infrastructure/postgres-monster.mapper.ts:30:  task_status: string | null;
src/modules/monsters/infrastructure/postgres-monster.mapper.ts:73:    case TASK_STATUS.active:
src/modules/monsters/infrastructure/postgres-monster.mapper.ts:74:      return TASK_STATUS.active;
src/modules/monsters/infrastructure/postgres-monster.mapper.ts:76:    case TASK_STATUS.unlocked:
src/modules/monsters/infrastructure/postgres-monster.mapper.ts:77:      return TASK_STATUS.unlocked;
src/modules/monsters/infrastructure/postgres-monster.mapper.ts:79:    case TASK_STATUS.waitingForReunlock:
src/modules/monsters/infrastructure/postgres-monster.mapper.ts:80:      return TASK_STATUS.waitingForReunlock;
src/modules/monsters/infrastructure/postgres-monster.mapper.ts:151:    bestiaryVisible:
src/modules/monsters/infrastructure/postgres-monster.mapper.ts:152:      row.bestiary_visible,
src/modules/monsters/infrastructure/postgres-monster.mapper.ts:154:    cooldownAvailableAt: mapNullableDate(
src/modules/monsters/infrastructure/postgres-monster.mapper.ts:155:      row.cooldown_available_at,
src/modules/monsters/infrastructure/postgres-monster.mapper.ts:156:      "cooldown_available_at"
src/modules/monsters/infrastructure/postgres-monster.mapper.ts:160:      row.task_status
tests/integration/characters/postgres-character-achievements.repository.test.ts:72:          reward_gold_percent, reward_experience_percent
tests/integration/characters/postgres-character-achievements.repository.test.ts:119:      experienceBonusPercent: 4.5,
tests/integration/characters/postgres-character-buffs.repository.test.ts:72:          ($1, 'ExperienceBoost', 'System', 4.5, 'Fights', 2,
tests/integration/characters/postgres-character-buffs.repository.test.ts:94:      experienceBonusPercent: 4.5,
tests/integration/characters/postgres-character-statistics.repository.test.ts:97:            gold_percent, experience_percent
tests/integration/characters/postgres-character-statistics.repository.test.ts:225:      experienceBonusPercent: 5,
tests/integration/characters/postgres-character.repository.test.ts:77:      experience: 0n,
tests/integration/characters/postgres-character.repository.test.ts:80:      craftingExperience: 0n,
tests/integration/characters/postgres-character.repository.test.ts:82:      gatheringExperience: 0n,
tests/integration/characters/postgres-character.repository.test.ts:95:      promoted: false,
tests/integration/combat/resolve-combat-action.integration.test.ts:457:          await Promise.allSettled([
tests/integration/combat/start-combat.integration.test.ts:472:          await Promise.allSettled([
tests/integration/http/monster-discovery.http.test.ts:277:          cooldown: {
tests/integration/http/monster-discovery.http.test.ts:281:          bestiaryVisible:
tests/integration/monsters/daily-boss-discovery.repository.test.ts:110:          cooldown_seconds,
tests/integration/monsters/postgres-monster-discovery.repository.test.ts:112:        bestiaryVisible: false,
tests/integration/monsters/postgres-monster-discovery.repository.test.ts:113:        cooldownAvailableAt: null,
tests/integration/monsters/postgres-monster-discovery.repository.test.ts:118:      "returns character-specific Bestiary and cooldown state",
tests/integration/monsters/postgres-monster-discovery.repository.test.ts:125:          "Cooldown Discovery Hero"
tests/integration/monsters/postgres-monster-discovery.repository.test.ts:157:            INSERT INTO bestiary_entries (
tests/integration/monsters/postgres-monster-discovery.repository.test.ts:171:            INSERT INTO character_cooldowns (
tests/integration/monsters/postgres-monster-discovery.repository.test.ts:173:              cooldown_type,
tests/integration/monsters/postgres-monster-discovery.repository.test.ts:198:          bestiaryVisible: true,
tests/integration/monsters/postgres-monster-discovery.repository.test.ts:202:          details?.cooldownAvailableAt
tests/unit/characters/archive-character.service.test.ts:29:    experience: 0n,
tests/unit/characters/calculate-character-stats.service.test.ts:38:        experienceBonusPercent: 4,
tests/unit/characters/calculate-character-stats.service.test.ts:57:      experienceBonusPercent: 4,
tests/unit/characters/character-foundation.test.ts:18:      experience: 0n,
tests/unit/characters/character-foundation.test.ts:35:      craftingExperience: 0n,
tests/unit/characters/character-foundation.test.ts:38:      gatheringExperience: 0n,
tests/unit/characters/create-character.service.test.ts:30:      experience: 0n,
tests/unit/characters/create-character.service.test.ts:33:      craftingExperience: 0n,
tests/unit/characters/create-character.service.test.ts:35:      gatheringExperience: 0n,
tests/unit/characters/create-character.service.test.ts:55:      promoted: false,
tests/unit/characters/effective-character-statistics.test.ts:23:      experienceBonusPercent: 0,
tests/unit/characters/effective-character-statistics.test.ts:103:  it("adds Gold and Experience percentage points", () => {
tests/unit/characters/effective-character-statistics.test.ts:109:        experienceBonusPercent: 10,
tests/unit/characters/effective-character-statistics.test.ts:113:        experienceBonusPercent: 3,
tests/unit/characters/effective-character-statistics.test.ts:117:        experienceBonusPercent: 25,
tests/unit/characters/effective-character-statistics.test.ts:122:    expect(result.experienceBonusPercent).toBe(38);
tests/unit/characters/effective-character-statistics.test.ts:157:        experienceBonusPercent: 7.25,
tests/unit/characters/effective-character-statistics.test.ts:163:        experienceBonusPercent: 2.5,
tests/unit/characters/effective-character-statistics.test.ts:167:        experienceBonusPercent: 20,
tests/unit/characters/effective-character-statistics.test.ts:194:        experienceBonusPercent: 7.25,
tests/unit/characters/effective-character-statistics.test.ts:200:        experienceBonusPercent: 2.5,
tests/unit/characters/effective-character-statistics.test.ts:204:        experienceBonusPercent: 20,
tests/unit/characters/get-character-snapshot.service.test.ts:44:          experienceBonusPercent: 0,
tests/unit/characters/get-character-snapshot.service.test.ts:76:      experience: 0n,
tests/unit/characters/get-character-snapshot.service.test.ts:79:      craftingExperience: 0n,
tests/unit/characters/get-character-snapshot.service.test.ts:81:      gatheringExperience: 0n,
tests/unit/characters/get-character-snapshot.service.test.ts:101:      promoted: false,
tests/unit/characters/get-character-snapshot.service.test.ts:199:        experienceBonusPercent: 0,
tests/unit/characters/get-character-snapshot.service.test.ts:246:        experienceBonusPercent: 0,
tests/unit/characters/list-characters.service.test.ts:30:    experience: 0n,
tests/unit/characters/postgres-character-statistics.repository.test.ts:25:          equipment_experience_percent: "4.25",
tests/unit/characters/postgres-character-statistics.repository.test.ts:29:          achievement_experience_percent: "1.25",
tests/unit/characters/postgres-character-statistics.repository.test.ts:34:          boost_experience_percent: "15.25",
tests/unit/characters/postgres-character-statistics.repository.test.ts:64:        experienceBonusPercent: 1.25,
tests/unit/characters/postgres-character-statistics.repository.test.ts:68:        experienceBonusPercent: 15.25,
tests/unit/characters/postgres-character-statistics.repository.test.ts:78:        experienceBonusPercent: 4.25,
tests/unit/characters/postgres-character-statistics.repository.test.ts:130:          equipment_experience_percent: "0",
tests/unit/characters/postgres-character-statistics.repository.test.ts:134:          achievement_experience_percent: "0",
tests/unit/characters/postgres-character-statistics.repository.test.ts:139:          boost_experience_percent: "0",
tests/unit/characters/postgres-character.mapper.test.ts:26:    experience: "123456789012345",
tests/unit/characters/postgres-character.mapper.test.ts:44:    experience: "123456789012345",
tests/unit/characters/postgres-character.mapper.test.ts:64:    is_promoted: false,
tests/unit/characters/postgres-character.mapper.test.ts:90:      experience: 123456789012345n,
tests/unit/characters/postgres-character.mapper.test.ts:96:  it("rejects an invalid experience value", () => {
tests/unit/characters/postgres-character.mapper.test.ts:100:          experience: "invalid",
tests/unit/characters/postgres-character.mapper.test.ts:131:        experience: 123456789012345n,
tests/unit/characters/postgres-character.mapper.test.ts:134:        craftingExperience: 250n,
tests/unit/characters/postgres-character.mapper.test.ts:136:        gatheringExperience: 750n,
tests/unit/characters/postgres-character.mapper.test.ts:156:        promoted: false,
tests/unit/characters/postgres-character.mapper.test.ts:232:        experience: "9223372036854775807",
tests/unit/characters/postgres-character.mapper.test.ts:239:    expect(result.progression.experience).toBe(
tests/unit/characters/postgres-character.mapper.test.ts:247:    expect(result.progression.craftingExperience).toBe(
tests/unit/characters/postgres-character.mapper.test.ts:251:    expect(result.progression.gatheringExperience).toBe(
tests/unit/characters/postgres-character.mapper.test.ts:260:        experience: "9223372036854775807",
tests/unit/characters/postgres-character.mapper.test.ts:267:    expect(result.progression.experience).toBe(
tests/unit/characters/postgres-character.mapper.test.ts:275:    expect(result.progression.craftingExperience).toBe(
tests/unit/characters/postgres-character.mapper.test.ts:279:    expect(result.progression.gatheringExperience).toBe(
tests/unit/combat/start-combat.service.test.ts:124:      experienceBonusPercent: 0,
tests/unit/combat/start-combat.service.test.ts:441:        experienceBonusPercent: 0,
tests/unit/http/character-http.handler.test.ts:38:    experience: 0n,
tests/unit/http/character-http.handler.test.ts:56:      experience: 0n,
tests/unit/http/character-http.handler.test.ts:59:      craftingExperience: 0n,
tests/unit/http/character-http.handler.test.ts:61:      gatheringExperience: 0n,
tests/unit/http/character-http.handler.test.ts:81:      promoted: false,
tests/unit/http/character-http.handler.test.ts:235:          experience: "0",
tests/unit/http/character-http.handler.test.ts:263:          experience: "0",
tests/unit/http/http-json.test.ts:27:        experience: 123456789012345n,
tests/unit/http/http-json.test.ts:33:      '{"experience":"123456789012345","nested":{"gold":"9876543210"}}'
tests/unit/http/monster-http.handler.test.ts:48:    cooldown: {
tests/unit/http/monster-http.handler.test.ts:53:    bestiaryVisible: false,
tests/unit/monsters/daily-boss-discovery.service.test.ts:75:    bestiaryVisible: false,
tests/unit/monsters/daily-boss-discovery.service.test.ts:76:    cooldownAvailableAt: null,
tests/unit/monsters/daily-boss-discovery.service.test.ts:187:    it("ignores ordinary cooldown when evaluating a Daily Boss", async () => {
tests/unit/monsters/daily-boss-discovery.service.test.ts:191:            cooldownAvailableAt: new Date(
tests/unit/monsters/daily-boss-discovery.service.test.ts:214:        cooldown: {
tests/unit/monsters/daily-boss-eligibility.test.ts:18:        cooldownActive: false,
tests/unit/monsters/daily-boss-eligibility.test.ts:37:        cooldownActive: false,
tests/unit/monsters/daily-boss-eligibility.test.ts:56:        cooldownActive: false,
tests/unit/monsters/daily-boss-eligibility.test.ts:77:        cooldownActive: false,
tests/unit/monsters/daily-boss-eligibility.test.ts:91:  it("ignores ordinary cooldown state for a Daily Boss", () => {
tests/unit/monsters/daily-boss-eligibility.test.ts:97:        cooldownActive: true,
tests/unit/monsters/get-monster-details.service.test.ts:62:        bestiaryVisible: true,
tests/unit/monsters/get-monster-details.service.test.ts:63:        cooldownAvailableAt: null,
tests/unit/monsters/get-monster-details.service.test.ts:88:      cooldown: {
tests/unit/monsters/get-monster-details.service.test.ts:92:      bestiaryVisible: true,
tests/unit/monsters/get-monster-details.service.test.ts:96:  it("uses the injected Clock for cooldown state", async () => {
tests/unit/monsters/get-monster-details.service.test.ts:110:        bestiaryVisible: false,
tests/unit/monsters/get-monster-details.service.test.ts:111:        cooldownAvailableAt: availableAt,
tests/unit/monsters/get-monster-details.service.test.ts:130:        reasons: ["COOLDOWN_ACTIVE"],
tests/unit/monsters/get-monster-details.service.test.ts:132:      cooldown: {
tests/unit/monsters/get-monster-list.service.test.ts:50:  it("maps eligible monster without cooldown", async () => {
tests/unit/monsters/get-monster-list.service.test.ts:60:          bestiaryVisible: false,
tests/unit/monsters/get-monster-list.service.test.ts:61:          cooldownAvailableAt: null,
tests/unit/monsters/get-monster-list.service.test.ts:86:        cooldown: {
tests/unit/monsters/get-monster-list.service.test.ts:90:        bestiaryVisible: false,
tests/unit/monsters/get-monster-list.service.test.ts:95:  it("reports level and cooldown reasons together", async () => {
tests/unit/monsters/get-monster-list.service.test.ts:109:          bestiaryVisible: true,
tests/unit/monsters/get-monster-list.service.test.ts:110:          cooldownAvailableAt: availableAt,
tests/unit/monsters/get-monster-list.service.test.ts:129:          "COOLDOWN_ACTIVE",
tests/unit/monsters/get-monster-list.service.test.ts:132:      cooldown: {
tests/unit/monsters/get-monster-list.service.test.ts:136:      bestiaryVisible: true,
tests/unit/monsters/get-monster-list.service.test.ts:140:  it("treats an expired cooldown as inactive", async () => {
tests/unit/monsters/get-monster-list.service.test.ts:154:          bestiaryVisible: false,
tests/unit/monsters/get-monster-list.service.test.ts:155:          cooldownAvailableAt: availableAt,
tests/unit/monsters/get-monster-list.service.test.ts:174:      cooldown: {
tests/unit/monsters/monster-cooldown.test.ts:8:  calculateMonsterCooldown,
tests/unit/monsters/monster-cooldown.test.ts:9:} from "../../../src/modules/monsters/domain/monster-cooldown.js";
tests/unit/monsters/monster-cooldown.test.ts:11:describe("monster cooldown", () => {
tests/unit/monsters/monster-cooldown.test.ts:16:  it("returns inactive when cooldown does not exist", () => {
tests/unit/monsters/monster-cooldown.test.ts:18:      calculateMonsterCooldown(null, now)
tests/unit/monsters/monster-cooldown.test.ts:31:      calculateMonsterCooldown(
tests/unit/monsters/monster-cooldown.test.ts:47:      calculateMonsterCooldown(
tests/unit/monsters/monster-cooldown.test.ts:59:      calculateMonsterCooldown(now, now)
tests/unit/monsters/monster-cooldown.test.ts:68:      calculateMonsterCooldown(
tests/unit/monsters/monster-cooldown.test.ts:77:  it("rejects an invalid cooldown timestamp", () => {
tests/unit/monsters/monster-cooldown.test.ts:79:      calculateMonsterCooldown(
tests/unit/monsters/monster-eligibility.test.ts:40:  it("applies an individual cooldown to a normal monster", () => {
tests/unit/monsters/monster-eligibility.test.ts:46:        cooldownActive: true,
tests/unit/monsters/monster-eligibility.test.ts:51:      reasons: ["COOLDOWN_ACTIVE"],
tests/unit/monsters/monster-eligibility.test.ts:55:  it("applies an individual cooldown to a Mini Boss", () => {
tests/unit/monsters/monster-eligibility.test.ts:61:        cooldownActive: true,
tests/unit/monsters/monster-eligibility.test.ts:66:      reasons: ["COOLDOWN_ACTIVE"],
tests/unit/monsters/monster-eligibility.test.ts:76:        cooldownActive: false,
tests/unit/monsters/monster-eligibility.test.ts:93:        cooldownActive: false,
tests/unit/monsters/monster-eligibility.test.ts:108:        cooldownActive: false,
tests/unit/monsters/monster-eligibility.test.ts:120:  it("ignores ordinary cooldown state for a Task Boss", () => {
tests/unit/monsters/monster-eligibility.test.ts:126:        cooldownActive: true,
tests/unit/monsters/monster-eligibility.test.ts:141:        cooldownActive: true,
tests/unit/monsters/task-boss-discovery.service.test.ts:70:    bestiaryVisible: false,
tests/unit/monsters/task-boss-discovery.service.test.ts:71:    cooldownAvailableAt: null,
tests/unit/monsters/task-boss-discovery.service.test.ts:187:    it("ignores cooldown when evaluating Task Boss eligibility", async () => {
tests/unit/monsters/task-boss-discovery.service.test.ts:192:        cooldownAvailableAt: new Date(
tests/unit/monsters/task-boss-discovery.service.test.ts:221:        cooldown: {
tests/unit/monsters/task-boss-discovery.service.test.ts:224:            record.cooldownAvailableAt,
```

