# M7 Technical Dump

Generated: 2026-10-20 22:17:24 +02:00
Repository root: C:\Projects\ostatnia-szansa-game

## Purpose

Fresh source dump for planning M7: Item and Loot Generation.

## Source priority

1. M7 approved decisions D1-D24
2. Current compiling code
3. Current PostgreSQL schema
4. Passing automated tests
5. CURRENT_MILESTONE.md
6. MASTER_PROJECT_PLAN.md
7. Historical milestone dumps

## Repository state

```text
Branch: m7/developer-ui

Working tree:
 M M7_P20_DEVELOPER_UI_PLAN.md
 M developer-ui/HTTP_CONTRACT.md
 M documentation/game-design/CURRENT_MILESTONE.md
 M documentation/game-design/MASTER_PROJECT_PLAN.md
?? .continue/
?? developer-ui/V23_MANUAL_EVIDENCE.md

Recent commits:
62ff5d5 refactor(combat): restore defeat settlement tests and clean up loot level bonus repository mapping
0341d55 feat(ui): display combat loot settlement with XSS protection and resilient BigInt handling
d35a594 feat(combat): apply boss loot level bonus and isolate integration test fixtures
e5d74ff apply monster cooldown after defeat
5b8724d add development game content pack
c9cb3ee update combat tests for resource regeneration
8448561 configure default resource regeneration
84d1259 test successful combat cooldown settlement
d8552e8 add local combat session history
16aad0f add combat settlement and loot developer UI
06c436c add active combat developer UI
a9c10e0 add monster discovery developer UI
b019bb0 add character snapshot developer UI
e2101ad connect developer UI to backend
744bd80 add developer UI foundation
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
        "db:migrate:status": "tsx scripts/run-migrations.ts --status",
        "dev:session": "tsx scripts/create-developer-session.ts",
        "ui:dev": "npm --prefix developer-ui run dev",
        "ui:typecheck": "npm --prefix developer-ui run typecheck",
        "ui:build": "npm --prefix developer-ui run build"
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
        "vite": "^8.3.4",
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
import type { RandomSource } from "./modules/combat/ports/random-source.js";
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

export type ApplicationServerDependencies = {
  randomSource?: RandomSource;
};

export function createApplicationServer(
  dependencies:
    ApplicationServerDependencies = {}
): Server {
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
    dependencies.randomSource ??
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
# SOURCE: scripts/import-game-data.ts
# ============================================================

```text
import path from "node:path";
import { fileURLToPath } from "node:url";
import ExcelJS from "exceljs";
import JSZip from "jszip";
import { readFile } from "node:fs/promises";
import type { PoolClient } from "pg";
import { databasePool } from "../src/database/pool.js";

type WorkbookRow = Record<string, unknown>;
type Mode = "validate" | "check" | "import";

type ReferenceRule = {
  workbookColumn: string;
  databaseColumn: string;
  target: string;
  optional?: boolean;
};

type TableConfig = {
  sheet: string;
  table: string;
  keys: string[];
  references?: ReferenceRule[];
  allowNullKeys?: boolean;
};

type ColumnMetadata = {
  column_name: string;
  data_type: string;
  is_nullable: "YES" | "NO";
  column_default: string | null;
};

type TableSummary = {
  table: string;
  inserted: number;
  updated: number;
  rows: number;
};

const DEFAULT_WORKBOOK = "game-data/workbooks/development-data.xlsx";

const CONFIGS: TableConfig[] = [
  { sheet: "achievements", table: "achievements", keys: ["code"] },
  { sheet: "affix_templates", table: "affix_templates", keys: ["affix_type", "tier"] },
  { sheet: "announcements", table: "announcements", keys: ["title"] },
  { sheet: "chest_definitions", table: "chest_definitions", keys: ["name"] },
  { sheet: "consumable_definitions", table: "consumable_definitions", keys: ["code"] },
  { sheet: "mail_templates", table: "mail_templates", keys: ["code"] },
  { sheet: "materials", table: "materials", keys: ["code"] },
  { sheet: "monster_families", table: "monster_families", keys: ["code"] },
  { sheet: "npc_definitions", table: "npc_definitions", keys: ["code"] },
  { sheet: "outfit_definitions", table: "outfit_definitions", keys: ["code"] },
  { sheet: "seasons", table: "seasons", keys: ["season_number"] },
  { sheet: "set_templates", table: "set_templates", keys: ["code"] },
  { sheet: "spells", table: "spells", keys: ["code"] },
  { sheet: "unique_templates", table: "unique_templates", keys: ["code"] },
  {
    sheet: "addon_definitions",
    table: "addon_definitions",
    keys: ["outfit_definition_id", "name"],
    references: [{ workbookColumn: "outfit_definition_code", databaseColumn: "outfit_definition_id", target: "outfit_definitions" }]
  },
  {
    sheet: "chest_reward_definitions",
    table: "chest_reward_definitions",
    keys: ["chest_definition_id", "reward_type", "minimum_character_level", "maximum_character_level"],
    references: [{ workbookColumn: "chest_definition_code", databaseColumn: "chest_definition_id", target: "chest_definitions" }]
  },
  {
    sheet: "item_bases",
    table: "item_bases",
    keys: ["code"],
    references: [
      { workbookColumn: "unique_template_code", databaseColumn: "unique_template_id", target: "unique_templates", optional: true },
      { workbookColumn: "set_template_code", databaseColumn: "set_template_id", target: "set_templates", optional: true }
    ]
  },
  {
    sheet: "item_base_affix_weights",
    table: "item_base_affix_weights",
    keys: ["item_base_id", "affix_template_id"],
    references: [
      { workbookColumn: "item_base_code", databaseColumn: "item_base_id", target: "item_bases" }
    ]
  },
  {
    sheet: "item_base_fixed_stat_ranges",
    table: "item_base_fixed_stat_ranges",
    keys: ["item_base_id", "stat_position"],
    references: [
      { workbookColumn: "item_base_code", databaseColumn: "item_base_id", target: "item_bases" }
    ]
  },
  { sheet: "item_score_coefficients", table: "item_score_coefficients", keys: ["score_component"] },
  {
    sheet: "monsters",
    table: "monsters",
    keys: ["code"],
    references: [{ workbookColumn: "monster_family_code", databaseColumn: "monster_family_id", target: "monster_families" }]
  },
  {
    sheet: "recipes",
    table: "recipes",
    keys: ["code"],
    references: [{ workbookColumn: "consumable_definition_code", databaseColumn: "consumable_definition_id", target: "consumable_definitions" }]
  },
  {
    sheet: "set_bonuses",
    table: "set_bonuses",
    keys: ["set_template_id", "required_pieces", "bonus_type"],
    references: [{ workbookColumn: "set_template_code", databaseColumn: "set_template_id", target: "set_templates" }]
  },
  {
    sheet: "bosses",
    table: "bosses",
    keys: ["monster_id"],
    references: [{ workbookColumn: "monster_code", databaseColumn: "monster_id", target: "monsters" }]
  },
  {
    sheet: "loot_tables",
    table: "loot_tables",
    keys: ["monster_id", "item_base_id"],
    references: [
      { workbookColumn: "monster_code", databaseColumn: "monster_id", target: "monsters" },
      { workbookColumn: "item_base_code", databaseColumn: "item_base_id", target: "item_bases" }
    ]
  },
  {
    sheet: "special_item_sources",
    table: "special_item_sources",
    keys: ["monster_id", "monster_family_id", "item_base_id"],
    allowNullKeys: true,
    references: [
      { workbookColumn: "monster_code", databaseColumn: "monster_id", target: "monsters", optional: true },
      { workbookColumn: "monster_family_code", databaseColumn: "monster_family_id", target: "monster_families", optional: true },
      { workbookColumn: "item_base_code", databaseColumn: "item_base_id", target: "item_bases" }
    ]
  },
  {
    sheet: "monster_abilities",
    table: "monster_abilities",
    keys: ["monster_id", "spell_id"],
    references: [
      { workbookColumn: "monster_code", databaseColumn: "monster_id", target: "monsters" },
      { workbookColumn: "spell_code", databaseColumn: "spell_id", target: "spells" }
    ]
  },
  {
    sheet: "other_loot_tables",
    table: "other_loot_tables",
    keys: ["monster_id", "material_id", "consumable_definition_id"],
    allowNullKeys: true,
    references: [
      { workbookColumn: "monster_code", databaseColumn: "monster_id", target: "monsters" },
      { workbookColumn: "material_code", databaseColumn: "material_id", target: "materials", optional: true },
      { workbookColumn: "consumable_definition_code", databaseColumn: "consumable_definition_id", target: "consumable_definitions", optional: true }
    ]
  },
  {
    sheet: "recipe_materials",
    table: "recipe_materials",
    keys: ["recipe_id", "material_id"],
    references: [
      { workbookColumn: "recipe_code", databaseColumn: "recipe_id", target: "recipes" },
      { workbookColumn: "material_code", databaseColumn: "material_id", target: "materials" }
    ]
  },
  {
    sheet: "daily_boss_definitions",
    table: "daily_boss_definitions",
    keys: ["boss_id"],
    references: [{ workbookColumn: "boss_code", databaseColumn: "boss_id", target: "bosses" }]
  },
  {
    sheet: "monster_ability_weights",
    table: "monster_ability_weights",
    keys: ["monster_ability_id"],
    references: [{ workbookColumn: "monster_ability_code", databaseColumn: "monster_ability_id", target: "monster_abilities" }]
  },
  {
    sheet: "monster_tasks",
    table: "monster_tasks",
    keys: ["monster_id"],
    references: [
      { workbookColumn: "monster_code", databaseColumn: "monster_id", target: "monsters" },
      { workbookColumn: "boss_code", databaseColumn: "boss_id", target: "bosses" }
    ]
  },
  {
    sheet: "daily_boss_pools",
    table: "daily_boss_pools",
    keys: ["tier", "daily_boss_definition_id"],
    references: [{ workbookColumn: "daily_boss_definition_code", databaseColumn: "daily_boss_definition_id", target: "daily_boss_definitions" }]
  }
];

function quoteIdentifier(value: string): string {
  if (!/^[a-z_][a-z0-9_]*$/.test(value)) throw new Error(`Unsafe SQL identifier: ${value}`);
  return `"${value}"`;
}

function isBlank(value: unknown): boolean {
  return value === null || value === undefined || (typeof value === "string" && value.trim() === "");
}

function normalizedString(value: unknown): string {
  return String(value ?? "").trim();
}

export function validatePositiveInteger(
  value: unknown,
  fieldName: string
): string | null {
  const text = normalizedString(value);
  if (!/^[0-9]+$/.test(text) || BigInt(text) <= 0n) {
    return `${fieldName} must be a positive integer.`;
  }
  if (BigInt(text) > 9223372036854775807n) {
    return `${fieldName} must not exceed PostgreSQL BIGINT maximum.`;
  }
  return null;
}

export function validateNonNegativeInteger(
  value: unknown,
  fieldName: string
): string | null {
  const text = normalizedString(value);
  if (!/^[0-9]+$/.test(text)) {
    return `${fieldName} must be a non-negative integer.`;
  }
  if (BigInt(text) > 9223372036854775807n) {
    return `${fieldName} must not exceed PostgreSQL BIGINT maximum.`;
  }
  return null;
}

export function validateInclusiveIntegerRange(
  minimum: unknown,
  maximum: unknown
): string | null {
  const minimumText = normalizedString(minimum);
  const maximumText = normalizedString(maximum);
  if (!/^[0-9]+$/.test(minimumText) || !/^[0-9]+$/.test(maximumText)) {
    return "min_value and max_value must be non-negative integers.";
  }
  if (BigInt(minimumText) > BigInt(maximumText)) {
    return "min_value must not exceed max_value.";
  }
  return null;
}

export function validateSpecialItemSourceOwner(
  monsterCode: unknown,
  monsterFamilyCode: unknown
): string | null {
  const ownerCount = [monsterCode, monsterFamilyCode]
    .map(normalizedString)
    .filter(Boolean).length;
  return ownerCount === 1
    ? null
    : "exactly one of monster_code or monster_family_code is required.";
}

export function validateMonsterExperienceReward(
  value: unknown
): string | null {
  const text = normalizedString(value);

  if (!text) {
    return "experience_reward is required.";
  }

  if (!/^[0-9]+$/.test(text)) {
    return "experience_reward must be a non-negative integer.";
  }

  const reward = BigInt(text);

  if (
    reward <= 0n ||
    reward > 9223372036854775807n
  ) {
    return "experience_reward must be between 1 and PostgreSQL BIGINT maximum.";
  }

  return null;
}

function unwrapCellValue(value: ExcelJS.CellValue): unknown {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value;
  if (typeof value !== "object") return value;
  if ("result" in value && value.result !== undefined) return value.result;
  if ("text" in value && typeof value.text === "string") return value.text;
  if ("richText" in value && Array.isArray(value.richText)) {
    return value.richText.map((part) => part.text).join("");
  }
  if ("hyperlink" in value && "text" in value) return value.text;
  return String(value);
}

function readSheet(workbook: ExcelJS.Workbook, sheetName: string): WorkbookRow[] {
  const sheet = workbook.getWorksheet(sheetName);
  if (!sheet) throw new Error(`Missing worksheet: ${sheetName}`);

  const headers: string[] = [];
  sheet.getRow(1).eachCell({ includeEmpty: true }, (cell, columnNumber) => {
    headers[columnNumber - 1] = normalizedString(unwrapCellValue(cell.value));
  });

  const lastHeaderIndex = headers.reduce(
    (last, header, index) => (header ? index : last),
    -1
  );
  if (lastHeaderIndex < 0) return [];
  const effectiveHeaders = headers.slice(0, lastHeaderIndex + 1);
  const duplicateHeaders = effectiveHeaders.filter(
    (value, index) => value && effectiveHeaders.indexOf(value) !== index
  );
  if (duplicateHeaders.length > 0) {
    throw new Error(
      `${sheetName}: duplicate headers: ${[...new Set(duplicateHeaders)].join(", ")}`
    );
  }
  if (effectiveHeaders.some((header) => !header)) {
    throw new Error(`${sheetName}: blank header inside the used column range.`);
  }

  const rows: WorkbookRow[] = [];
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const values = effectiveHeaders.map((_, index) =>
      unwrapCellValue(row.getCell(index + 1).value)
    );
    if (values.every(isBlank)) return;
    rows.push(
      Object.fromEntries(
        effectiveHeaders.map((header, index) => [header, values[index] ?? null])
      )
    );
  });
  return rows;
}

function parseMode(): { mode: Mode; workbookPath: string } {
  const args = process.argv.slice(2);
  let mode: Mode = "import";
  let workbookPath = DEFAULT_WORKBOOK;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--validate-only") mode = "validate";
    else if (arg === "--dry-run") mode = "check";
    else if (arg === "--file") {
      const next = args[++index];
      if (!next) throw new Error("--file requires a workbook path.");
      workbookPath = next;
    } else throw new Error(`Unknown argument: ${arg}`);
  }
  return { mode, workbookPath };
}

function workbookIdentity(config: TableConfig, row: WorkbookRow): string {
  if (config.table === "item_base_affix_weights") {
    return ["item_base_code", "affix_type", "affix_tier"]
      .map((column) => normalizedString(row[column]))
      .join("|");
  }

  const refs = new Map((config.references ?? []).map((rule) => [rule.databaseColumn, rule.workbookColumn]));
  return config.keys.map((key) => normalizedString(row[refs.get(key) ?? key])).join("|");
}

const ITEM_SCORE_COMPONENTS = [
  "ItemLevel",
  "Attack",
  "Defense",
  "SpellPower",
  "Health",
  "Mana",
  "Energy",
  "GoldPercent",
  "ExperiencePercent"
] as const;

const RETIRED_WORKBOOK_COLUMNS: Record<string, string[]> = {
  loot_tables: [
    "drop_chance_percent",
    "min_item_level",
    "max_item_level",
    "loot_level_modifier"
  ],
  other_loot_tables: ["drop_chance_percent"],
  unique_templates: [
    "min_attack", "max_attack", "min_defense", "max_defense",
    "min_spell_power", "max_spell_power", "min_health", "max_health",
    "min_mana", "max_mana", "min_energy", "max_energy"
  ]
};

function validateWorkbook(workbook: ExcelJS.Workbook): Map<string, WorkbookRow[]> {
  const rowsBySheet = new Map<string, WorkbookRow[]>();
  const problems: string[] = [];
  const codeSets = new Map<string, Set<string>>();

  for (const config of CONFIGS) {
    try {
      const rows = readSheet(workbook, config.sheet);
      rowsBySheet.set(config.sheet, rows);
      const identities = new Map<string, number>();
      rows.forEach((row, index) => {
        const identity = workbookIdentity(config, row);
        const identityParts = identity.split("|");
        const hasMissingIdentityPart = identityParts.some((part) => part === "");
        if (!identity || (hasMissingIdentityPart && !config.allowNullKeys)) {
          problems.push(`${config.sheet} row ${index + 2}: missing identity field.`);
        } else if (identities.has(identity)) {
          problems.push(`${config.sheet} row ${index + 2}: duplicate identity "${identity}".`);
        } else identities.set(identity, index + 2);
      });
      if (config.table === "monsters") {
        rows.forEach((row, index) => {
          const problem =
            validateMonsterExperienceReward(
              row.experience_reward
            );

          if (problem) {
            problems.push(
              `${config.sheet} row ${index + 2}: ${problem}`
            );
          }
        });
      }

      if (config.table === "other_loot_tables") {
        rows.forEach((row, index) => {
          const materialCode = normalizedString(row.material_code);
          const consumableCode = normalizedString(row.consumable_definition_code);
          if (!materialCode && !consumableCode) {
            problems.push(
              `${config.sheet} row ${index + 2}: material_code or consumable_definition_code is required.`
            );
          }
          if (materialCode && consumableCode) {
            problems.push(
              `${config.sheet} row ${index + 2}: use either material_code or consumable_definition_code, not both.`
            );
          }
        });
      }

      const retiredColumns = RETIRED_WORKBOOK_COLUMNS[config.sheet] ?? [];
      for (const retiredColumn of retiredColumns) {
        if (rows.some((row) => Object.hasOwn(row, retiredColumn))) {
          problems.push(`${config.sheet}: retired column ${retiredColumn} must be removed.`);
        }
      }

      if (["loot_tables", "other_loot_tables", "item_base_affix_weights", "special_item_sources"].includes(config.table)) {
        rows.forEach((row, index) => {
          const problem = validatePositiveInteger(row.selection_weight, "selection_weight");
          if (problem) problems.push(`${config.sheet} row ${index + 2}: ${problem}`);
        });
      }

      if (config.table === "item_score_coefficients") {
        rows.forEach((row, index) => {
          const problem = validateNonNegativeInteger(row.coefficient, "coefficient");
          if (problem) problems.push(`${config.sheet} row ${index + 2}: ${problem}`);
        });
      }

      if (config.table === "item_base_fixed_stat_ranges") {
        rows.forEach((row, index) => {
          const positionProblem = validatePositiveInteger(row.stat_position, "stat_position");
          const rangeProblem = validateInclusiveIntegerRange(row.min_value, row.max_value);
          if (positionProblem) problems.push(`${config.sheet} row ${index + 2}: ${positionProblem}`);
          if (rangeProblem) problems.push(`${config.sheet} row ${index + 2}: ${rangeProblem}`);
        });
      }

      if (config.table === "special_item_sources") {
        rows.forEach((row, index) => {
          const problem = validateSpecialItemSourceOwner(row.monster_code, row.monster_family_code);
          if (problem) problems.push(`${config.sheet} row ${index + 2}: ${problem}`);
        });
      }

      if (config.table === "item_base_affix_weights") {
        rows.forEach((row, index) => {
          if (!normalizedString(row.affix_type)) {
            problems.push(`${config.sheet} row ${index + 2}: affix_type is required.`);
          }
          const tierProblem = validatePositiveInteger(row.affix_tier, "affix_tier");
          if (tierProblem) problems.push(`${config.sheet} row ${index + 2}: ${tierProblem}`);
        });
      }

      const codes = new Set(rows.map((row) => normalizedString(row.code)).filter(Boolean));
      if (codes.size > 0) codeSets.set(config.table, codes);
      if (config.table === "chest_definitions") {
        codeSets.set(config.table, new Set(rows.map((row) => normalizedString(row.name)).filter(Boolean)));
      }
    } catch (error) {
      problems.push(error instanceof Error ? error.message : String(error));
    }
  }

  for (const config of CONFIGS) {
    const rows = rowsBySheet.get(config.sheet) ?? [];
    for (const [index, row] of rows.entries()) {
      for (const rule of config.references ?? []) {
        const value = normalizedString(row[rule.workbookColumn]);
        if (!value) {
          if (!rule.optional) problems.push(`${config.sheet} row ${index + 2}: ${rule.workbookColumn} is required.`);
          continue;
        }
        if (["bosses", "daily_boss_definitions", "monster_abilities"].includes(rule.target)) continue;
        const targetCodes = codeSets.get(rule.target);
        if (targetCodes && !targetCodes.has(value)) {
          problems.push(`${config.sheet} row ${index + 2}: ${rule.workbookColumn} references missing ${rule.target} value "${value}".`);
        }
      }
    }
  }

  const itemBases = rowsBySheet.get("item_bases") ?? [];
  const itemBaseByCode = new Map(
    itemBases.map((row) => [normalizedString(row.code), row])
  );
  const regularItemBaseCodes = new Set(
    itemBases
      .filter((row) => row.is_unique !== true && row.is_set !== true)
      .map((row) => normalizedString(row.code))
  );
  const specialItemBaseCodes = new Set(
    itemBases
      .filter((row) => row.is_unique === true || row.is_set === true)
      .map((row) => normalizedString(row.code))
  );

  const affixWeights = rowsBySheet.get("item_base_affix_weights") ?? [];
  const affixPoolCodes = new Set(affixWeights.map((row) => normalizedString(row.item_base_code)));
  for (const code of regularItemBaseCodes) {
    if (!affixPoolCodes.has(code)) problems.push(`item_bases: regular Item Base "${code}" has no affix pool.`);
  }
  affixWeights.forEach((row, index) => {
    const code = normalizedString(row.item_base_code);
    if (specialItemBaseCodes.has(code)) {
      problems.push(`item_base_affix_weights row ${index + 2}: special Item Base "${code}" cannot use normal affixes.`);
    }
  });

  const fixedRanges = rowsBySheet.get("item_base_fixed_stat_ranges") ?? [];
  const fixedRangesByBase = new Map<string, WorkbookRow[]>();
  fixedRanges.forEach((row, index) => {
    const code = normalizedString(row.item_base_code);
    if (regularItemBaseCodes.has(code)) {
      problems.push(`item_base_fixed_stat_ranges row ${index + 2}: regular Item Base "${code}" cannot use fixed stats.`);
    }
    const list = fixedRangesByBase.get(code) ?? [];
    list.push(row);
    fixedRangesByBase.set(code, list);
  });
  for (const code of specialItemBaseCodes) {
    const ranges = fixedRangesByBase.get(code) ?? [];
    if (ranges.length === 0) {
      problems.push(`item_bases: special Item Base "${code}" has no fixed-stat ranges.`);
      continue;
    }
    const positions = ranges
      .map((row) => Number(normalizedString(row.stat_position)))
      .sort((left, right) => left - right);
    positions.forEach((position, index) => {
      if (position !== index + 1) {
        problems.push(`item_base_fixed_stat_ranges: Item Base "${code}" must use contiguous stat_position values starting at 1.`);
      }
    });
  }

  const specialSources = rowsBySheet.get("special_item_sources") ?? [];
  specialSources.forEach((row, index) => {
    const code = normalizedString(row.item_base_code);
    if (!specialItemBaseCodes.has(code)) {
      problems.push(`special_item_sources row ${index + 2}: Item Base "${code}" is not Unique or Set.`);
    }
  });
  for (const code of specialItemBaseCodes) {
    if (!specialSources.some((row) => normalizedString(row.item_base_code) === code)) {
      problems.push(`item_bases: special Item Base "${code}" has no special-item source.`);
    }
  }

  const coefficientRows = rowsBySheet.get("item_score_coefficients") ?? [];
  const coefficientComponents = new Set(
    coefficientRows.map((row) => normalizedString(row.score_component))
  );
  for (const component of ITEM_SCORE_COMPONENTS) {
    if (!coefficientComponents.has(component)) {
      problems.push(`item_score_coefficients: missing component "${component}".`);
    }
  }
  coefficientRows.forEach((row, index) => {
    const component = normalizedString(row.score_component);
    if (!(ITEM_SCORE_COMPONENTS as readonly string[]).includes(component)) {
      problems.push(`item_score_coefficients row ${index + 2}: unknown score_component "${component}".`);
    }
  });

  void itemBaseByCode;

  if (problems.length > 0) throw new Error(`Workbook validation failed:\n${problems.map((problem) => `- ${problem}`).join("\n")}`);
  return rowsBySheet;
}

async function getColumnMetadata(client: PoolClient, table: string): Promise<Map<string, ColumnMetadata>> {
  const result = await client.query<ColumnMetadata>(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = $1
    ORDER BY ordinal_position;
  `, [table]);
  return new Map(result.rows.map((row) => [row.column_name, row]));
}

async function getPrimaryKey(client: PoolClient, table: string): Promise<string> {
  const result = await client.query<{ column_name: string }>(`
    SELECT kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.constraint_schema = kcu.constraint_schema
    WHERE tc.table_schema = 'public'
      AND tc.table_name = $1
      AND tc.constraint_type = 'PRIMARY KEY'
    ORDER BY kcu.ordinal_position;
  `, [table]);
  if (result.rows.length !== 1) throw new Error(`${table}: expected one primary-key column.`);
  return result.rows[0].column_name;
}

function convertValue(value: unknown, metadata: ColumnMetadata): unknown {
  if (isBlank(value)) return null;
  switch (metadata.data_type) {
    case "boolean": {
      if (typeof value === "boolean") return value;
      const text = normalizedString(value).toLowerCase();
      if (text === "true") return true;
      if (text === "false") return false;
      throw new Error(`${metadata.column_name}: expected TRUE or FALSE, received "${value}".`);
    }
    case "smallint":
    case "integer": {
      const number =
        typeof value === "number"
          ? value
          : Number(normalizedString(value));

      if (!Number.isSafeInteger(number)) {
        throw new Error(
          `${metadata.column_name}: expected a safe integer, received "${value}".`
        );
      }

      return number;
    }
    case "bigint": {
      const text = normalizedString(value);

      if (!/^-?[0-9]+$/.test(text)) {
        throw new Error(
          `${metadata.column_name}: expected an integer, received "${value}".`
        );
      }

      const number = BigInt(text);

      if (
        number < -9223372036854775808n ||
        number > 9223372036854775807n
      ) {
        throw new Error(
          `${metadata.column_name}: value is outside PostgreSQL BIGINT range.`
        );
      }

      return number.toString();
    }
    case "numeric":
    case "real":
    case "double precision": {
      const number = typeof value === "number" ? value : Number(normalizedString(value));
      if (!Number.isFinite(number)) throw new Error(`${metadata.column_name}: expected a number, received "${value}".`);
      return number;
    }
    case "timestamp with time zone":
    case "timestamp without time zone":
      return value instanceof Date ? value : normalizedString(value);
    default:
      return typeof value === "string" ? value.trim() : value;
  }
}

async function resolveReference(client: PoolClient, target: string, value: string): Promise<string> {
  let query: string;
  let parameters: unknown[];
  if (target === "chest_definitions") {
    query = "SELECT chest_definition_id AS id FROM chest_definitions WHERE name = $1";
    parameters = [value];
  } else if (target === "bosses") {
    query = `SELECT b.boss_id AS id FROM bosses b JOIN monsters m ON m.monster_id = b.monster_id WHERE m.code = $1`;
    parameters = [value];
  } else if (target === "daily_boss_definitions") {
    query = `SELECT d.daily_boss_definition_id AS id FROM daily_boss_definitions d JOIN bosses b ON b.boss_id = d.boss_id JOIN monsters m ON m.monster_id = b.monster_id WHERE m.code = $1`;
    parameters = [value];
  } else if (target === "monster_abilities") {
    const separator = value.indexOf("__");
    if (separator < 1) throw new Error(`monster_ability_code must use monster_code__spell_code: ${value}`);
    const monsterCode = value.slice(0, separator);
    const spellCode = value.slice(separator + 2);
    query = `SELECT ma.monster_ability_id AS id FROM monster_abilities ma JOIN monsters m ON m.monster_id = ma.monster_id JOIN spells s ON s.spell_id = ma.spell_id WHERE m.code = $1 AND s.code = $2`;
    parameters = [monsterCode, spellCode];
  } else {
    const targetConfig = CONFIGS.find((config) => config.table === target);
    if (!targetConfig) throw new Error(`Unknown reference target: ${target}`);
    const primaryKey = await getPrimaryKey(client, target);
    query = `SELECT ${quoteIdentifier(primaryKey)} AS id FROM ${quoteIdentifier(target)} WHERE code = $1`;
    parameters = [value];
  }
  const result = await client.query<{ id: string }>(query, parameters);
  if (result.rows.length !== 1) throw new Error(`Could not resolve ${target} reference "${value}".`);
  return result.rows[0].id;
}

async function mapRow(
  client: PoolClient,
  config: TableConfig,
  row: WorkbookRow,
  metadata: Map<string, ColumnMetadata>
): Promise<Record<string, unknown>> {
  const mapped: Record<string, unknown> = {};
  const referenceColumns = new Set((config.references ?? []).map((rule) => rule.workbookColumn));

  for (const [workbookColumn, rawValue] of Object.entries(row)) {
    if (!workbookColumn || referenceColumns.has(workbookColumn)) continue;
    const column = metadata.get(workbookColumn);
    if (!column) {
      if (config.table === "item_base_affix_weights" && ["affix_type", "affix_tier"].includes(workbookColumn)) continue;
      throw new Error(`${workbookColumn}: column does not exist in ${config.table}.`);
    }
    if (isBlank(rawValue) && column.column_default !== null) continue;
    mapped[workbookColumn] = convertValue(rawValue, column);
  }

  if (config.table === "item_base_affix_weights") {
    const affixType = normalizedString(row.affix_type);
    const affixTier = normalizedString(row.affix_tier);
    const result = await client.query<{ id: string }>(
      `SELECT affix_template_id AS id FROM affix_templates WHERE affix_type = $1 AND tier = $2`,
      [affixType, Number(affixTier)]
    );
    if (result.rows.length !== 1) {
      throw new Error(`Could not resolve affix_templates reference "${affixType} Tier ${affixTier}".`);
    }
    mapped.affix_template_id = result.rows[0].id;
  }

  for (const rule of config.references ?? []) {
    const value = normalizedString(row[rule.workbookColumn]);
    if (!value) {
      if (!rule.optional) throw new Error(`${rule.workbookColumn} is required.`);
      mapped[rule.databaseColumn] = null;
    } else {
      mapped[rule.databaseColumn] = await resolveReference(client, rule.target, value);
    }
  }

  return mapped;
}

async function importTable(
  client: PoolClient,
  config: TableConfig,
  rows: WorkbookRow[]
): Promise<TableSummary> {
  const metadata = await getColumnMetadata(client, config.table);
  const primaryKey = await getPrimaryKey(client, config.table);
  const summary: TableSummary = { table: config.table, inserted: 0, updated: 0, rows: rows.length };

  for (const [index, row] of rows.entries()) {
    let mapped: Record<string, unknown>;
    try {
      mapped = await mapRow(client, config, row, metadata);
    } catch (error) {
      throw new Error(`${config.sheet} row ${index + 2}: ${error instanceof Error ? error.message : String(error)}`);
    }

    const keyValues = config.keys.map((key) => mapped[key]);
    if (
      !config.allowNullKeys &&
      keyValues.some((value) => value === null || value === undefined)
    ) {
      throw new Error(`${config.sheet} row ${index + 2}: missing database identity value.`);
    }
    const where = config.keys.map((key, keyIndex) => `${quoteIdentifier(key)} IS NOT DISTINCT FROM $${keyIndex + 1}`).join(" AND ");
    const existing = await client.query<Record<string, unknown>>(
      `SELECT * FROM ${quoteIdentifier(config.table)} WHERE ${where} FOR UPDATE`,
      keyValues
    );

    if (existing.rows.length > 1) throw new Error(`${config.sheet} row ${index + 2}: identity matched multiple database rows.`);

    if (existing.rows.length === 0) {
      const columns = Object.keys(mapped);
      const values = columns.map((column) => mapped[column]);
      const placeholders = columns.map((_, valueIndex) => `$${valueIndex + 1}`).join(", ");
      await client.query(
        `INSERT INTO ${quoteIdentifier(config.table)} (${columns.map(quoteIdentifier).join(", ")}) VALUES (${placeholders})`,
        values
      );
      summary.inserted += 1;
      continue;
    }

    const updateColumns = Object.keys(mapped).filter((column) => column !== primaryKey && !config.keys.includes(column));
    if (updateColumns.length > 0) {
      const values = updateColumns.map((column) => mapped[column]);
      const assignments = updateColumns.map((column, valueIndex) => `${quoteIdentifier(column)} = $${valueIndex + 1}`).join(", ");
      values.push(existing.rows[0][primaryKey]);
      const updatedAt = metadata.has("updated_at") ? ", updated_at = NOW()" : "";
      await client.query(
        `UPDATE ${quoteIdentifier(config.table)} SET ${assignments}${updatedAt} WHERE ${quoteIdentifier(primaryKey)} = $${values.length}`,
        values
      );
    }
    summary.updated += 1;
  }

  return summary;
}

async function main(): Promise<void> {
  const { mode, workbookPath: requestedPath } = parseMode();
  const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
  const projectRoot = path.resolve(scriptDirectory, "..");
  const workbookPath = path.resolve(projectRoot, requestedPath);
  // ExcelJS 4.4 can reject otherwise valid workbooks when parsing
  // docProps/core.xml metadata such as lastModifiedBy. The importer does not
  // use document metadata, so remove that optional package part in memory.
  const workbookBytes = await readFile(workbookPath);
  const archive = await JSZip.loadAsync(workbookBytes);
  archive.remove("docProps/core.xml");
  const sanitizedWorkbookBytes = await archive.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE"
  });

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(sanitizedWorkbookBytes as unknown as ExcelJS.Buffer);
  const rowsBySheet = validateWorkbook(workbook);

  console.log(`Workbook validation passed: ${path.relative(projectRoot, workbookPath)}`);
  console.log(`Content worksheets: ${CONFIGS.length}`);
  console.log(`Content rows: ${[...rowsBySheet.values()].reduce((sum, rows) => sum + rows.length, 0)}`);

  if (mode === "validate") return;

  const client = await databasePool.connect();
  const summaries: TableSummary[] = [];
  try {
    await client.query("BEGIN");
    for (const config of CONFIGS) {
      summaries.push(await importTable(client, config, rowsBySheet.get(config.sheet) ?? []));
    }
    if (mode === "check") await client.query("ROLLBACK");
    else await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await databasePool.end();
  }

  console.log("");
  console.log(mode === "check" ? "Game-data check completed and rolled back." : "Game-data import committed.");
  for (const summary of summaries) {
    console.log(`${summary.table}: rows=${summary.rows}, inserted=${summary.inserted}, updated=${summary.updated}`);
  }
}

main().catch((error: unknown) => {
  console.error("Game-data import failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

```

# ============================================================
# SOURCE: tests/unit/import-game-data.test.ts
# ============================================================

```text
import {
  describe,
  expect,
  it,
} from "vitest";

import {
  validateInclusiveIntegerRange,
  validateMonsterExperienceReward,
  validateNonNegativeInteger,
  validatePositiveInteger,
  validateSpecialItemSourceOwner,
} from "../../scripts/import-game-data.js";

describe("monster Experience reward import validation", () => {
  it.each([
    [null, "experience_reward is required."],
    ["", "experience_reward is required."],
    ["abc", "experience_reward must be a non-negative integer."],
    ["1.5", "experience_reward must be a non-negative integer."],
    ["-1", "experience_reward must be a non-negative integer."],
    [0, "experience_reward must be between 1 and PostgreSQL BIGINT maximum."],
    [
      "9223372036854775808",
      "experience_reward must be between 1 and PostgreSQL BIGINT maximum.",
    ],
  ])(
    "rejects invalid value %s",
    (value, expected) => {
      expect(
        validateMonsterExperienceReward(value)
      ).toBe(expected);
    }
  );

  it.each([
    1,
    50,
    "500",
    "9223372036854775807",
  ])(
    "accepts valid value %s",
    (value) => {
      expect(
        validateMonsterExperienceReward(value)
      ).toBeNull();
    }
  );
});


describe("M7 game-data validation helpers", () => {
  it.each([1, "10", "9223372036854775807"])(
    "accepts positive integer %s",
    (value) => expect(validatePositiveInteger(value, "selection_weight")).toBeNull()
  );

  it.each([null, "", 0, -1, "1.5"])(
    "rejects invalid positive integer %s",
    (value) => expect(validatePositiveInteger(value, "selection_weight")).not.toBeNull()
  );

  it.each([0, 1, "100"])(
    "accepts non-negative integer %s",
    (value) => expect(validateNonNegativeInteger(value, "coefficient")).toBeNull()
  );

  it("validates inclusive whole-number ranges", () => {
    expect(validateInclusiveIntegerRange(1, 10)).toBeNull();
    expect(validateInclusiveIntegerRange(10, 1)).toBe(
      "min_value must not exceed max_value."
    );
    expect(validateInclusiveIntegerRange("1.5", 2)).toBe(
      "min_value and max_value must be non-negative integers."
    );
  });

  it("requires exactly one special-item source owner", () => {
    expect(validateSpecialItemSourceOwner("monster", null)).toBeNull();
    expect(validateSpecialItemSourceOwner(null, "family")).toBeNull();
    expect(validateSpecialItemSourceOwner(null, null)).not.toBeNull();
    expect(validateSpecialItemSourceOwner("monster", "family")).not.toBeNull();
  });
});

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
import type {
  LootSettlementResult,
} from "../../items/application/loot-settlement.service.js";

export const PERSISTENT_COMBAT_STATUS = {
  active: "Active",
  victory: "Victory",
  defeat: "Defeat",
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
  rewards: {
    monsterExperienceReward: bigint;
    monsterGoldMinimum: bigint;
    monsterGoldMaximum: bigint;
  };
  startedAt: Date;
  endedAt: Date | null;
  settledAt: Date | null;
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

export type CombatSettlementOutcome =
  | "Victory"
  | "Defeat";

export type CombatSettlementExperience = {
  before: bigint;
  awarded: bigint;
  lost: bigint;
  after: bigint;
};

export type CombatSettlementGold = {
  before: bigint;
  baseRolled: bigint;
  awarded: bigint;
  after: bigint;
};

export type CombatSettlementLevel = {
  before: number;
  after: number;
  levelsChanged: number;
};

export type CombatSettlementBestiary = {
  discovered: boolean;
  killCount: bigint | null;
};

export type CombatSettlementTaskBoss = {
  progressed: boolean;
  status: string | null;
};

export type CombatSettlementCooldown = {
  applied: boolean;
  availableAt: Date | null;
};

export type CombatSettlementDailyBoss = {
  updated: boolean;
  victoryRecorded: boolean;
};

export type CombatSettlementStatistics = {
  damageDealt: bigint;
  damageTaken: bigint;
  highestPhysicalHit: bigint;
};

export type CombatFinalSummary = {
  combatSessionId: CombatSessionId;
  outcome: CombatSettlementOutcome;
  turnCount: number;
  startedAt: Date;
  endedAt: Date;
};

export type CombatSettlement = {
  outcome: CombatSettlementOutcome;
  experience: CombatSettlementExperience;
  gold: CombatSettlementGold;
  level: CombatSettlementLevel;
  blessingConsumed: boolean;
  bestiary: CombatSettlementBestiary;
  taskBoss: CombatSettlementTaskBoss;
  cooldown: CombatSettlementCooldown;
  dailyBoss: CombatSettlementDailyBoss;
  statistics: CombatSettlementStatistics;
  finalSummary: CombatFinalSummary;
};

export type CombatSessionView = CombatSessionSnapshot & {
  events: readonly CombatEvent[];
  settlement: CombatSettlement | null;
  loot: LootSettlementResult | null;
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
  CombatSettlement,
  GetActiveCombatInput,
  GetCombatSessionInput,
  PersistedCombatEvent,
} from "./combat-session.models.js";
import type {
  CombatEvent,
  CombatState,
} from "../domain/combat.types.js";
import type {
  LootGenerationContext,
  LootSettlementTransaction,
} from "../../items/application/loot.repository.js";

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
  experienceReward: bigint;
  goldMinimum: bigint;
  goldMaximum: bigint;
  maximumHealth: number;
  attack: number;
  defense: number;
  eligibility: MonsterEligibility;

  dailyBossAttempt?: {
    dailyBossDefinitionId: string;
    dailyBossRotationId: string;
    attemptsLimit: number;
  };
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
  monsterExperienceReward: bigint;
  monsterGoldMinimum: bigint;
  monsterGoldMaximum: bigint;
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

  consumeDailyBossAttempt(
    monster: CombatStartMonster
  ): Promise<void>;

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

export type CombatSettlementCharacter = {
  characterId: string;
  level: number;
  experience: bigint;
  gold: bigint;
  resources: CharacterResources;
};

export type CombatSettlementStatistics = {
  totalGoldEarned: bigint;
  highestGoldOwned: bigint;
  totalMonstersKilled: bigint;
  totalBossesKilled: bigint;
  totalDailyBossesKilled: bigint;
  totalDeaths: bigint;
  totalDamageDealt: bigint;
  totalDamageTaken: bigint;
  highestPhysicalHit: bigint;

  strongestMonsterKilledId:
    string | null;
  strongestMonsterPowerScore:
    bigint | null;

  strongestBossKilledId:
    string | null;
  strongestBossPowerScore:
    bigint | null;

  currentNoDeathStreak: bigint;
  longestNoDeathStreak: bigint;
};

export type CombatSettlementMonster = {
  monsterId: string;
  monsterFamilyId: string | null;
  monsterType: MonsterType;
  level: number;
  powerScore: bigint;
  cooldownSeconds: number;
  bossId: string | null;
  bossType:
    | "MiniBoss"
    | "TaskBoss"
    | "DailyBoss"
    | null;
  additionalCooldownSeconds: number;
  lootLevelBonus: number;
};

export type CombatSettlementTask = {
  monsterTaskId: string;
  progressMonsterId: string;
  taskBossId: string;
  requiredKills: bigint;
  currentProgress: bigint;
  currentStatus:
    | "ACTIVE"
    | "UNLOCKED"
    | "WAITING_FOR_REUNLOCK";
};

export type CombatSettlementDailyBoss = {
  dailyBossDefinitionId: string;
  dailyBossRotationId: string;
  tier: number;
  attemptsUsedInRotation: number;
  totalAttempts: bigint;
  totalVictories: bigint;
  highestTierDefeated: number | null;
};

export type CombatSettlementFightBuff = {
  characterBuffId: string;
  buffType: string;
  value: number;
  durationRemaining: number;
};

export type CombatSettlementContext = {
  character: CombatSettlementCharacter;
  promoted: boolean;
  blessed: boolean;
  statistics: CombatSettlementStatistics;
  rewardBonuses: {
    goldBonusPercent: number;
    experienceBonusPercent: number;
  };
  monster: CombatSettlementMonster;

  task: CombatSettlementTask | null;

  dailyBoss:
    CombatSettlementDailyBoss | null;

  fightBuffs:
    readonly CombatSettlementFightBuff[];

  events:
    readonly PersistedCombatEvent[];
};

export type ApplyVictorySettlementInput = {
  context: CombatSettlementContext;

  state: CombatState;
  resolvedTurn: number;
  events: readonly CombatEvent[];
  observedAt: Date;

  baseExperience: bigint;
  baseGold: bigint;

  experienceBonusBasisPoints: bigint;
  goldBonusBasisPoints: bigint;

  experienceAwarded: bigint;
  goldAwarded: bigint;

  experienceAfter: bigint;
  goldAfter: bigint;

  levelAfter: number;

  resourcesAfter: CharacterResources;

  damageDealt: bigint;
  damageTaken: bigint;
  highestPhysicalHit: bigint;

  strongestMonsterKilledIdAfter:
    string;
  strongestBossKilledIdAfter:
    string | null;

  statisticsAfter: {
    totalGoldEarned: bigint;
    highestGoldOwned: bigint;
    totalMonstersKilled: bigint;
    totalBossesKilled: bigint;
    totalDailyBossesKilled: bigint;
    totalDamageDealt: bigint;
    totalDamageTaken: bigint;
    highestPhysicalHit: bigint;
    currentNoDeathStreak: bigint;
    longestNoDeathStreak: bigint;
  };
};

export type ApplyDefeatSettlementInput = {
  context: CombatSettlementContext;

  state: CombatState;
  resolvedTurn: number;
  events: readonly CombatEvent[];
  observedAt: Date;

  lossPercent: 10 | 8 | 6 | 4;

  experienceLost: bigint;
  experienceAfter: bigint;

  goldAfter: bigint;
  levelAfter: number;

  resourcesAfter:
    CharacterResources;

  blessingConsumed: boolean;

  damageDealt: bigint;
  damageTaken: bigint;
  highestPhysicalHit: bigint;

  statisticsAfter: {
    totalDeaths: bigint;
    totalDamageDealt: bigint;
    totalDamageTaken: bigint;
    highestPhysicalHit: bigint;
    currentNoDeathStreak: bigint;
    longestNoDeathStreak: bigint;
  };
};

export interface CombatActionTransaction {
  readonly locked:
    LockedCombatSession;

  loadSettlementContext():
    Promise<CombatSettlementContext>;

  withLootSettlement?<TResult>(
    context: LootGenerationContext,
    operation: (
      transaction: LootSettlementTransaction
    ) => Promise<TResult>
  ): Promise<TResult>;

  applyVictorySettlement(
    input: ApplyVictorySettlementInput
  ): Promise<CombatSettlement>;

  applyDefeatSettlement(
    input: ApplyDefeatSettlementInput
  ): Promise<CombatSettlement>;

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
  planDefeatSettlement,
} from "../../progression/domain/defeat-settlement.js";
import {
  planVictorySettlement,
} from "../../progression/domain/victory-settlement.js";
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
import {
  LootSettlementService,
  type LootSettlementResult,
} from "../../items/application/loot-settlement.service.js";
import type {
  LootRepository,
} from "../../items/application/loot.repository.js";

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

        let settlement = null;
        let loot: LootSettlementResult | null = null;

        if (
          resolution.state.status ===
          COMBAT_STATUS.playerVictory
        ) {
          const victoryContext =
            await transaction
              .loadSettlementContext();

          const completeEvents = [
            ...victoryContext.events.map(
              (event) => event.event
            ),
            ...resolution.events,
          ];

          const victoryPlan =
            planVictorySettlement(
              transaction.locked.session,
              victoryContext,
              resolution.state.player
                .currentHealth,
              completeEvents,
              this.randomSource
            );

          settlement =
            await transaction
              .applyVictorySettlement({
                context:
                  victoryContext,
                state:
                  resolution.state,
                resolvedTurn:
                  currentTurn,
                events:
                  resolution.events,
                observedAt,

                baseExperience:
                  victoryPlan.baseExperience,
                baseGold:
                  victoryPlan.baseGold,

                experienceBonusBasisPoints:
                  victoryPlan
                    .experienceBonusBasisPoints,
                goldBonusBasisPoints:
                  victoryPlan
                    .goldBonusBasisPoints,

                experienceAwarded:
                  victoryPlan
                    .experienceAwarded,
                goldAwarded:
                  victoryPlan
                    .goldAwarded,

                experienceAfter:
                  victoryPlan
                    .experienceAfter,
                goldAfter:
                  victoryPlan.goldAfter,

                levelAfter:
                  victoryPlan.levelAfter,

                resourcesAfter: {
                  ...victoryPlan
                    .resourcesAfter,
                  resourcesUpdatedAt:
                    observedAt,
                },

                damageDealt:
                  victoryPlan.damageDealt,
                damageTaken:
                  victoryPlan.damageTaken,
                highestPhysicalHit:
                  victoryPlan
                    .highestPhysicalHit,

                strongestMonsterKilledIdAfter:
                  victoryPlan
                    .strongestMonsterKilledIdAfter,

                strongestBossKilledIdAfter:
                  victoryPlan
                    .strongestBossKilledIdAfter,

                statisticsAfter:
                  victoryPlan
                    .statisticsAfter,
              });

          if (transaction.withLootSettlement === undefined) {
            throw new Error(
              "Combat transaction does not support Loot settlement."
            );
          }

          const lootRepository: LootRepository = {
            withSettlementTransaction: async (
              context,
              operation
            ) => transaction.withLootSettlement!(
              context,
              operation
            ),
          };
          const lootService = new LootSettlementService(
            lootRepository,
            this.randomSource
          );
          loot = await lootService.settle({
            characterId: victoryContext.character.characterId,
            monsterId: victoryContext.monster.monsterId,
            monsterFamilyId: victoryContext.monster.monsterFamilyId,
            monsterLevel: victoryContext.monster.level,
            bossBonusLootLevel: Number(
              victoryContext.monster.lootLevelBonus ?? 0
            ),
            isBoss: victoryContext.monster.monsterType !== "Normal",
          });
        } else if (
          resolution.state.status ===
          COMBAT_STATUS.playerDefeat
        ) {
          if (
            resolution.state.defeatReason ===
            null
          ) {
            throw new Error(
              "Terminal Defeat state requires a defeat reason."
            );
          }

          const defeatContext =
            await transaction
              .loadSettlementContext();

          const completeEvents = [
            ...defeatContext.events.map(
              (event) => event.event
            ),
            ...resolution.events,
          ];

          const defeatPlan =
            planDefeatSettlement(
              defeatContext,
              resolution.state.player
                .currentHealth,
              resolution.state.defeatReason,
              completeEvents
            );

          settlement =
            await transaction
              .applyDefeatSettlement({
                context:
                  defeatContext,

                state:
                  resolution.state,

                resolvedTurn:
                  currentTurn,

                events:
                  resolution.events,

                observedAt,

                lossPercent:
                  defeatPlan.lossPercent,

                experienceLost:
                  defeatPlan
                    .experienceLost,

                experienceAfter:
                  defeatPlan
                    .experienceAfter,

                goldAfter:
                  defeatPlan.goldAfter,

                levelAfter:
                  defeatPlan.levelAfter,

                resourcesAfter: {
                  ...defeatPlan
                    .resourcesAfter,

                  resourcesUpdatedAt:
                    observedAt,
                },

                blessingConsumed:
                  defeatPlan
                    .blessingConsumed,

                damageDealt:
                  defeatPlan.damageDealt,

                damageTaken:
                  defeatPlan.damageTaken,

                highestPhysicalHit:
                  defeatPlan
                    .highestPhysicalHit,

                statisticsAfter:
                  defeatPlan
                    .statisticsAfter,
              });
        } else {
          await transaction.persistAction({
            state: resolution.state,
            resolvedTurn: currentTurn,
            events: resolution.events,
            observedAt,
          });
        }

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
          settledAt:
            resolution.state.status ===
            COMBAT_STATUS.inProgress
              ? null
              : observedAt,
          events: resolution.events,
          settlement,
          loot,
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

        if (
          monster.monsterType ===
          "DailyBoss"
        ) {
          await transaction
            .consumeDailyBossAttempt(
              monster
            );
        }

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
            monsterExperienceReward:
              monster.experienceReward,
            monsterGoldMinimum:
              monster.goldMinimum,
            monsterGoldMaximum:
              monster.goldMaximum,
            startedAt: observedAt,
          });

        return {
          ...session,
          events: [],
          settlement: null,
          loot: null,
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

  public nextBigInt(
    minimum: bigint,
    maximum: bigint
  ): bigint {
    if (minimum > maximum) {
      throw new RangeError(
        "Random bigint minimum cannot exceed maximum."
      );
    }

    if (minimum === maximum) {
      return minimum;
    }

    const range =
      maximum - minimum + 1n;

    const bitLength =
      range.toString(2).length;

    const byteLength =
      Math.ceil(bitLength / 8);

    const excessBits =
      byteLength * 8 - bitLength;

    while (true) {
      const bytes =
        this.randomBytesProvider(
          byteLength
        );

      if (
        !Buffer.isBuffer(bytes) ||
        bytes.length !== byteLength
      ) {
        throw new Error(
          "Crypto random byte provider returned an invalid bigint buffer."
        );
      }

      const candidateBytes =
        Buffer.from(bytes);

      if (excessBits > 0) {
        const mask =
          0xff >>> excessBits;

        candidateBytes[0] =
          (candidateBytes[0] ?? 0) &
          mask;
      }

      let candidate = 0n;

      for (const byte of candidateBytes) {
        candidate =
          candidate * 256n +
          BigInt(byte);
      }

      if (candidate < range) {
        return minimum + candidate;
      }
    }
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
  monster_experience_reward: unknown;
  monster_gold_min: unknown;
  monster_gold_max: unknown;
  started_at: unknown;
  ended_at: unknown;
  settled_at: unknown;
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

function mapBigInt(
  value: unknown,
  fieldName: string
): bigint {
  if (
    typeof value !== "string" ||
    !/^[0-9]+$/u.test(value)
  ) {
    return invalid(
      `${fieldName} must contain a non-negative bigint.`
    );
  }

  return BigInt(value);
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
    rewards: {
      monsterExperienceReward: mapBigInt(
        row.monster_experience_reward,
        "monster_experience_reward"
      ),
      monsterGoldMinimum: mapBigInt(
        row.monster_gold_min,
        "monster_gold_min"
      ),
      monsterGoldMaximum: mapBigInt(
        row.monster_gold_max,
        "monster_gold_max"
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
    settledAt: mapNullableDate(
      row.settled_at,
      "settled_at"
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
  type CombatSettlement,
  type CombatSessionSnapshot,
  type GetActiveCombatInput,
  type GetCombatSessionInput,
  type PersistedCombatEvent,
} from "../application/combat-session.models.js";
import type {
  ApplyDefeatSettlementInput,
  ApplyVictorySettlementInput,
  CombatActionTransaction,
  CombatActionTransactionInput,
  CombatSessionRepository,
  CombatSettlementContext,
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
import type {
  LootGenerationContext,
  LootSettlementTransaction,
} from "../../items/application/loot.repository.js";
import {
  createPostgresLootSettlementTransaction,
} from "../../items/infrastructure/postgres-loot-transaction.js";



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

type SettlementCharacterRow = {
  character_id: string;
  level: number;
  experience: string;
  gold: string;
  current_health: string;
  max_health: string;
  current_mana: string;
  max_mana: string;
  current_energy: string;
  max_energy: string;
  resources_updated_at: Date;
};

type SettlementUnlockRow = {
  is_promoted: boolean;
};

type SettlementBlessingRow = {
  character_blessing_id: string;
};

type SettlementStatisticsRow = {
  total_gold_earned: string;
  highest_gold_owned: string;
  total_monsters_killed: string;
  total_bosses_killed: string;
  total_daily_bosses_killed: string;
  total_deaths: string;
  total_damage_dealt: string;
  total_damage_taken: string;
  highest_physical_hit: string;

  strongest_monster_killed_id:
    string | null;
  strongest_monster_power_score:
    string | null;

  strongest_boss_killed_id:
    string | null;
  strongest_boss_power_score:
    string | null;

  current_no_death_streak: string;
  longest_no_death_streak: string;
};

type SettlementMonsterRow = {
  monster_id: string;
  monster_family_id: string | null;
  monster_type: string;
  level: number;
  power_score: string;
  cooldown_seconds: number;
  boss_id: string | null;
  boss_type: string | null;
  additional_cooldown_seconds: number | null;
  loot_level_bonus: number | null;
};

type SettlementTaskDefinitionRow = {
  monster_task_id: string;
  progress_monster_id: string;
  task_boss_id: string;
  required_kills: string;
};

type SettlementTaskProgressRow = {
  task_progress: string;
  task_status: TaskStatus;
};

type SettlementDailyDefinitionRow = {
  daily_boss_definition_id: string;
  daily_boss_rotation_id: string;
  tier: number;
};

type SettlementDailyProgressRow = {
  attempts_used_in_rotation: number;
  total_attempts: string;
  total_victories: string;
  highest_tier_defeated: number | null;
};

type SettlementFightBuffRow = {
  character_buff_id: string;
  buff_type: string;
  value: string;
  duration_remaining: number;
};

type MonsterStartRow = {
  monster_id: string;
  code: string;
  monster_type: string;
  level: number;
  energy_cost: number;
  experience_reward: string;
  gold_min: string;
  gold_max: string;
  health: string;
  attack: string;
  defense: string;
  cooldown_available_at: Date | null;
  task_status: TaskStatus | null;
  daily_boss_available: boolean;
  daily_attempts_used: number;
  daily_attempts_per_day: number | null;
  daily_boss_definition_id:
    string | null;
  daily_boss_rotation_id:
    string | null;
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

function parseNumericValue(
  value: string | number,
  fieldName: string
): number {
  const mapped = Number(value);

  if (
    !Number.isFinite(mapped) ||
    mapped < 0
  ) {
    throw new InvalidPersistentCombatStateError(
      `${fieldName} must contain a non-negative finite number.`
    );
  }

  return mapped;
}

function mapNonNegativeBigInt(
  value: string,
  fieldName: string
): bigint {
  if (!/^[0-9]+$/u.test(value)) {
    throw new InvalidPersistentCombatStateError(
      `${fieldName} must contain a non-negative bigint.`
    );
  }

  return BigInt(value);
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
            m.experience_reward,
            m.gold_min,
            m.gold_max,
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
              AS daily_attempts_per_day,

            daily_definition.daily_boss_definition_id
              AS daily_boss_definition_id,

            active_rotation.daily_boss_rotation_id
              AS daily_boss_rotation_id

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
      experienceReward:
        mapNonNegativeBigInt(
          row.experience_reward,
          "monster.experience_reward"
        ),
      goldMinimum:
        mapNonNegativeBigInt(
          row.gold_min,
          "monster.gold_min"
        ),
      goldMaximum:
        mapNonNegativeBigInt(
          row.gold_max,
          "monster.gold_max"
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

      dailyBossAttempt:
        monsterType === "DailyBoss" &&
        row.daily_boss_definition_id !== null &&
        row.daily_boss_rotation_id !== null &&
        dailyAttemptsPerDay !== undefined
          ? {
              dailyBossDefinitionId:
                row.daily_boss_definition_id,
              dailyBossRotationId:
                row.daily_boss_rotation_id,
              attemptsLimit:
                dailyAttemptsPerDay,
            }
          : undefined,
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

  public async consumeDailyBossAttempt(
    monster: CombatStartMonster
  ): Promise<void> {
    if (
      monster.monsterType !==
      "DailyBoss"
    ) {
      return;
    }

    const attempt =
      monster.dailyBossAttempt;

    if (attempt === undefined) {
      throw new InvalidPersistentCombatStateError(
        "Daily Boss start metadata is incomplete."
      );
    }

    const result =
      await this.client.query(
        `
          INSERT INTO character_daily_boss_progress (
            character_id,
            daily_boss_definition_id,
            daily_boss_rotation_id,
            attempts_used_in_rotation,
            total_attempts,
            last_attempt_at,
            created_at,
            updated_at
          )
          VALUES (
            $1,
            $2,
            $3,
            1,
            1,
            $4,
            $4,
            $4
          )
          ON CONFLICT (
            character_id,
            daily_boss_definition_id,
            daily_boss_rotation_id
          )
          DO UPDATE
          SET
            attempts_used_in_rotation =
              character_daily_boss_progress
                .attempts_used_in_rotation + 1,
            total_attempts =
              character_daily_boss_progress
                .total_attempts + 1,
            last_attempt_at = $4,
            updated_at = $4
          WHERE
            character_daily_boss_progress
              .attempts_used_in_rotation < $5
          RETURNING
            character_daily_boss_progress_id
        `,
        [
          this.character.characterId,
          attempt.dailyBossDefinitionId,
          attempt.dailyBossRotationId,
          this.observedAt,
          attempt.attemptsLimit,
        ]
      );

    if (result.rowCount !== 1) {
      throw new InvalidPersistentCombatStateError(
        "Daily Boss attempt could not be consumed."
      );
    }
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
              defeat_reason,
              monster_experience_reward,
              monster_gold_min,
              monster_gold_max
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
              NULL,
              $13,
              $14,
              $15
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
              monster_experience_reward,
              monster_gold_min,
              monster_gold_max,
              started_at,
              ended_at,
              settled_at
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
            input.monsterExperienceReward.toString(),
            input.monsterGoldMinimum.toString(),
            input.monsterGoldMaximum.toString(),
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



export type CombatSettlementFailurePoint =
  | "victory.character"
  | "victory.statistics"
  | "victory.core"
  | "victory.bestiary"
  | "victory.task"
  | "victory.dailyBoss"
  | "victory.cooldown"
  | "victory.fightBuff"
  | "victory.consequences"
  | "victory.finalLog"
  | "victory.retention"
  | "victory.terminalSession"
  | "defeat.character"
  | "defeat.statistics"
  | "defeat.blessing"
  | "defeat.fightBuff"
  | "defeat.cooldown"
  | "defeat.core"
  | "defeat.finalLog"
  | "defeat.retention"
  | "defeat.terminalSession";

export type CombatSettlementFailureInjector = (
  point: CombatSettlementFailurePoint
) => void | Promise<void>;

export type PostgresCombatSessionRepositoryOptions = {
  settlementFailureInjector?:
    CombatSettlementFailureInjector;
};

class PostgresCombatActionTransaction
  implements CombatActionTransaction {
  public constructor(
    private readonly client: PoolClient,
    public readonly locked:
      LockedCombatSession,
    private readonly observedAt: Date,
    private readonly settlementFailureInjector?:
      CombatSettlementFailureInjector
  ) {}

  private async injectSettlementFailure(
    point: CombatSettlementFailurePoint
  ): Promise<void> {
    await this.settlementFailureInjector?.(
      point
    );
  }

  public async withLootSettlement<TResult>(
    context: LootGenerationContext,
    operation: (
      transaction: LootSettlementTransaction
    ) => Promise<TResult>
  ): Promise<TResult> {
    if (
      context.characterId !== this.locked.session.characterId ||
      context.monsterId !== this.locked.session.monsterId
    ) {
      throw new InvalidPersistentCombatStateError(
        "Loot settlement context does not match the locked Combat session."
      );
    }

    const transaction = await createPostgresLootSettlementTransaction(
      this.client,
      context
    );
    return operation(transaction);
  }

  public async loadSettlementContext():
  Promise<CombatSettlementContext> {
    const characterResult =
      await this.client.query<
        SettlementCharacterRow
      >(
        `
          SELECT
            character_id,
            level,
            experience,
            gold,
            current_health,
            max_health,
            current_mana,
            max_mana,
            current_energy,
            max_energy,
            resources_updated_at
          FROM characters
          WHERE character_id = $1
            AND status = 'IsActive'
          FOR UPDATE
        `,
        [
          this.locked.session
            .characterId,
        ]
      );

    const character =
      characterResult.rows[0];

    if (!character) {
      throw new CharacterNotFoundError();
    }

    const unlockResult =
      await this.client.query<
        SettlementUnlockRow
      >(
        `
          SELECT is_promoted
          FROM character_unlocks
          WHERE character_id = $1
          FOR UPDATE
        `,
        [character.character_id]
      );

    const unlock = unlockResult.rows[0];

    if (!unlock) {
      throw new InvalidPersistentCombatStateError(
        "Character unlock state was not found."
      );
    }

    const blessingResult =
      await this.client.query<
        SettlementBlessingRow
      >(
        `
          SELECT character_blessing_id
          FROM character_blessings
          WHERE character_id = $1
          FOR UPDATE
        `,
        [character.character_id]
      );

    const statisticsResult =
      await this.client.query<
        SettlementStatisticsRow
      >(
        `
          SELECT
            total_gold_earned,
            highest_gold_owned,
            total_monsters_killed,
            total_bosses_killed,
            total_daily_bosses_killed,
            total_deaths,
            total_damage_dealt,
            total_damage_taken,
            statistics.highest_physical_hit,

            statistics.strongest_monster_killed_id,
            strongest_monster.power_score::text
              AS strongest_monster_power_score,

            statistics.strongest_boss_killed_id,
            strongest_boss_monster.power_score::text
              AS strongest_boss_power_score,

            statistics.current_no_death_streak,
            statistics.longest_no_death_streak
          FROM character_statistics
            AS statistics
          LEFT JOIN monsters
            AS strongest_monster
            ON strongest_monster.monster_id =
              statistics.strongest_monster_killed_id
          LEFT JOIN bosses
            AS strongest_boss
            ON strongest_boss.boss_id =
              statistics.strongest_boss_killed_id
          LEFT JOIN monsters
            AS strongest_boss_monster
            ON strongest_boss_monster.monster_id =
              strongest_boss.monster_id
          WHERE statistics.character_id = $1
          FOR UPDATE OF statistics
        `,
        [character.character_id]
      );

    const statistics =
      statisticsResult.rows[0];

    if (!statistics) {
      throw new InvalidPersistentCombatStateError(
        "Character statistics were not found."
      );
    }

    const monsterResult =
      await this.client.query<
        SettlementMonsterRow
      >(
        `
          SELECT
            m.monster_id,
            m.monster_family_id,
            m.monster_type,
            m.level,
            m.power_score,
            m.cooldown_seconds,
            b.boss_id,
            b.boss_type,
            b.additional_cooldown_seconds,
            b.loot_level_bonus
          FROM monsters AS m
          LEFT JOIN bosses AS b
            ON b.monster_id =
              m.monster_id
          WHERE m.monster_id = $1
        `,
        [
          this.locked.session
            .monsterId,
        ]
      );

    const monster =
      monsterResult.rows[0];

    if (!monster) {
      throw new InvalidPersistentCombatStateError(
        "Settlement monster was not found."
      );
    }

    const taskDefinitionResult =
      await this.client.query<
        SettlementTaskDefinitionRow
      >(
        `
          SELECT
            mt.monster_task_id,
            mt.monster_id
              AS progress_monster_id,
            mt.boss_id
              AS task_boss_id,
            mt.required_kills
          FROM monster_tasks AS mt
          LEFT JOIN bosses AS encountered_boss
            ON encountered_boss.boss_id =
              mt.boss_id
          WHERE mt.monster_id = $1
            OR encountered_boss.monster_id = $1
          ORDER BY mt.monster_task_id
        `,
        [
          this.locked.session
            .monsterId,
        ]
      );

    if (
      taskDefinitionResult.rows.length > 1
    ) {
      throw new InvalidPersistentCombatStateError(
        "Settlement monster matched multiple Task definitions."
      );
    }

    const taskDefinition =
      taskDefinitionResult.rows[0] ?? null;

    let taskProgress:
      SettlementTaskProgressRow | null =
        null;

    if (taskDefinition !== null) {
      const taskProgressResult =
        await this.client.query<
          SettlementTaskProgressRow
        >(
          `
            SELECT
              task_progress,
              task_status
            FROM bestiary_statistics
            WHERE character_id = $1
              AND monster_id = $2
            FOR UPDATE
          `,
          [
            character.character_id,
            taskDefinition
              .progress_monster_id,
          ]
        );

      taskProgress =
        taskProgressResult.rows[0] ?? null;
    }

    const dailyDefinitionResult =
      await this.client.query<
        SettlementDailyDefinitionRow
      >(
        `
          SELECT
            definition.daily_boss_definition_id,
            rotation.daily_boss_rotation_id,
            definition.tier
          FROM bosses AS boss
          INNER JOIN daily_boss_definitions
            AS definition
            ON definition.boss_id =
              boss.boss_id
          INNER JOIN daily_boss_rotation
            AS rotation
            ON definition.daily_boss_definition_id
              IN (
                rotation.tier_1_boss_id,
                rotation.tier_2_boss_id,
                rotation.tier_3_boss_id
              )
            AND rotation.created_at <= $2
            AND rotation.reset_timestamp > $2
          WHERE boss.monster_id = $1
          ORDER BY
            rotation.created_at DESC,
            rotation.daily_boss_rotation_id DESC
          LIMIT 1
        `,
        [
          this.locked.session
            .monsterId,
          this.observedAt,
        ]
      );

    const dailyDefinition =
      dailyDefinitionResult.rows[0] ?? null;

    let dailyProgress:
      SettlementDailyProgressRow | null =
        null;

    if (dailyDefinition !== null) {
      const dailyProgressResult =
        await this.client.query<
          SettlementDailyProgressRow
        >(
          `
            SELECT
              attempts_used_in_rotation,
              total_attempts,
              total_victories,
              highest_tier_defeated
            FROM character_daily_boss_progress
            WHERE character_id = $1
              AND daily_boss_definition_id = $2
              AND daily_boss_rotation_id = $3
            FOR UPDATE
          `,
          [
            character.character_id,
            dailyDefinition
              .daily_boss_definition_id,
            dailyDefinition
              .daily_boss_rotation_id,
          ]
        );

      dailyProgress =
        dailyProgressResult.rows[0] ?? null;
    }

    const fightBuffResult =
      await this.client.query<
        SettlementFightBuffRow
      >(
        `
          SELECT
            character_buff_id,
            buff_type,
            value,
            duration_remaining
          FROM character_buffs
          WHERE character_id = $1
            AND duration_type = 'Fights'
            AND duration_remaining > 0
            AND (
              expires_at IS NULL
              OR expires_at > $2
            )
          ORDER BY character_buff_id
          FOR UPDATE
        `,
        [
          character.character_id,
          this.observedAt,
        ]
      );

    const eventResult =
      await this.client.query<
        PostgreSqlCombatEventRow
      >(
        `
          SELECT
            combat_session_event_id,
            combat_session_id,
            turn_number,
            event_order,
            event_type,
            event_data_json,
            created_at
          FROM combat_session_events
          WHERE combat_session_id = $1
          ORDER BY
            turn_number ASC,
            event_order ASC
        `,
        [
          this.locked.session
            .combatSessionId,
        ]
      );

    const statisticsRepository =
      new PostgresCharacterStatisticsRepository(
        this.client
      );

    const statisticsService =
      new CalculateCharacterStatsService(
        statisticsRepository
      );

    const effectiveStatistics =
      await statisticsService.execute({
        characterId:
          character.character_id,
        observedAt: this.observedAt,
      });

    const bossType =
      monster.boss_type === null
        ? null
        : monster.boss_type === "MiniBoss" ||
            monster.boss_type === "TaskBoss" ||
            monster.boss_type === "DailyBoss"
          ? monster.boss_type
          : (() => {
              throw new InvalidPersistentCombatStateError(
                "Settlement boss type is invalid."
              );
            })();

    return {
      character: {
        characterId:
          character.character_id,
        level: mapSafeInteger(
          character.level,
          "settlement.character.level",
          1
        ),
        experience:
          mapNonNegativeBigInt(
            character.experience,
            "settlement.character.experience"
          ),
        gold:
          mapNonNegativeBigInt(
            character.gold,
            "settlement.character.gold"
          ),
        resources: {
          currentHealth: mapSafeInteger(
            character.current_health,
            "settlement.character.current_health"
          ),
          maximumHealth: mapSafeInteger(
            character.max_health,
            "settlement.character.max_health",
            1
          ),
          currentMana: mapSafeInteger(
            character.current_mana,
            "settlement.character.current_mana"
          ),
          maximumMana: mapSafeInteger(
            character.max_mana,
            "settlement.character.max_mana"
          ),
          currentEnergy: mapSafeInteger(
            character.current_energy,
            "settlement.character.current_energy"
          ),
          maximumEnergy: mapSafeInteger(
            character.max_energy,
            "settlement.character.max_energy",
            1
          ),
          resourcesUpdatedAt:
            mapValidDate(
              character.resources_updated_at,
              "settlement.character.resources_updated_at"
            ),
        },
      },

      promoted: unlock.is_promoted,

      blessed:
        blessingResult.rows.length === 1,

      statistics: {
        totalGoldEarned:
          mapNonNegativeBigInt(
            statistics.total_gold_earned,
            "settlement.statistics.total_gold_earned"
          ),
        highestGoldOwned:
          mapNonNegativeBigInt(
            statistics.highest_gold_owned,
            "settlement.statistics.highest_gold_owned"
          ),
        totalMonstersKilled:
          mapNonNegativeBigInt(
            statistics.total_monsters_killed,
            "settlement.statistics.total_monsters_killed"
          ),
        totalBossesKilled:
          mapNonNegativeBigInt(
            statistics.total_bosses_killed,
            "settlement.statistics.total_bosses_killed"
          ),
        totalDailyBossesKilled:
          mapNonNegativeBigInt(
            statistics.total_daily_bosses_killed,
            "settlement.statistics.total_daily_bosses_killed"
          ),
        totalDeaths:
          mapNonNegativeBigInt(
            statistics.total_deaths,
            "settlement.statistics.total_deaths"
          ),
        totalDamageDealt:
          mapNonNegativeBigInt(
            statistics.total_damage_dealt,
            "settlement.statistics.total_damage_dealt"
          ),
        totalDamageTaken:
          mapNonNegativeBigInt(
            statistics.total_damage_taken,
            "settlement.statistics.total_damage_taken"
          ),
        highestPhysicalHit:
          mapNonNegativeBigInt(
            statistics.highest_physical_hit,
            "settlement.statistics.highest_physical_hit"
          ),

        strongestMonsterKilledId:
          statistics
            .strongest_monster_killed_id,

        strongestMonsterPowerScore:
          statistics
            .strongest_monster_power_score ===
          null
            ? null
            : mapNonNegativeBigInt(
                statistics
                  .strongest_monster_power_score,
                "settlement.statistics.strongest_monster_power_score"
              ),

        strongestBossKilledId:
          statistics
            .strongest_boss_killed_id,

        strongestBossPowerScore:
          statistics
            .strongest_boss_power_score ===
          null
            ? null
            : mapNonNegativeBigInt(
                statistics
                  .strongest_boss_power_score,
                "settlement.statistics.strongest_boss_power_score"
              ),

        currentNoDeathStreak:
          mapNonNegativeBigInt(
            statistics.current_no_death_streak,
            "settlement.statistics.current_no_death_streak"
          ),
        longestNoDeathStreak:
          mapNonNegativeBigInt(
            statistics.longest_no_death_streak,
            "settlement.statistics.longest_no_death_streak"
          ),
      },

      rewardBonuses: {
        goldBonusPercent:
          effectiveStatistics
            .goldBonusPercent,
        experienceBonusPercent:
          effectiveStatistics
            .experienceBonusPercent,
      },

      monster: {
        monsterId:
          monster.monster_id,
        monsterFamilyId:
          monster.monster_family_id,
        monsterType:
          mapMonsterType(
            monster.monster_type
          ),
        level: mapSafeInteger(
          monster.level,
          "settlement.monster.level",
          1
        ),
        powerScore:
          mapNonNegativeBigInt(
            monster.power_score,
            "settlement.monster.power_score"
          ),
        cooldownSeconds:
          mapSafeInteger(
            monster.cooldown_seconds,
            "settlement.monster.cooldown_seconds"
          ),
        bossId: monster.boss_id,
        bossType,
        additionalCooldownSeconds:
          monster.additional_cooldown_seconds ===
          null
            ? 0
            : mapSafeInteger(
                monster.additional_cooldown_seconds,
                "settlement.monster.additional_cooldown_seconds"
              ),
        lootLevelBonus:
          monster.loot_level_bonus === null
            ? 0
            : mapSafeInteger(
                monster.loot_level_bonus,
                "settlement.monster.loot_level_bonus"
              ),
      },

      task:
        taskDefinition === null
          ? null
          : {
              monsterTaskId:
                taskDefinition
                  .monster_task_id,
              progressMonsterId:
                taskDefinition
                  .progress_monster_id,
              taskBossId:
                taskDefinition
                  .task_boss_id,
              requiredKills:
                mapNonNegativeBigInt(
                  taskDefinition
                    .required_kills,
                  "settlement.task.required_kills"
                ),
              currentProgress:
                taskProgress === null
                  ? 0n
                  : mapNonNegativeBigInt(
                      taskProgress
                        .task_progress,
                      "settlement.task.current_progress"
                    ),
              currentStatus:
                taskProgress === null
                  ? "ACTIVE"
                  : taskProgress.task_status,
            },

      dailyBoss:
        dailyDefinition === null
          ? null
          : {
              dailyBossDefinitionId:
                dailyDefinition
                  .daily_boss_definition_id,
              dailyBossRotationId:
                dailyDefinition
                  .daily_boss_rotation_id,
              tier: mapSafeInteger(
                dailyDefinition.tier,
                "settlement.daily_boss.tier",
                1
              ),
              attemptsUsedInRotation:
                dailyProgress === null
                  ? 0
                  : mapSafeInteger(
                      dailyProgress
                        .attempts_used_in_rotation,
                      "settlement.daily_boss.attempts_used_in_rotation"
                    ),
              totalAttempts:
                dailyProgress === null
                  ? 0n
                  : mapNonNegativeBigInt(
                      dailyProgress
                        .total_attempts,
                      "settlement.daily_boss.total_attempts"
                    ),
              totalVictories:
                dailyProgress === null
                  ? 0n
                  : mapNonNegativeBigInt(
                      dailyProgress
                        .total_victories,
                      "settlement.daily_boss.total_victories"
                    ),
              highestTierDefeated:
                dailyProgress
                  ?.highest_tier_defeated ??
                null,
            },

      fightBuffs:
        fightBuffResult.rows.map(
          (row) => ({
            characterBuffId:
              row.character_buff_id,
            buffType: row.buff_type,
            value: parseNumericValue(
              row.value,
              "settlement.fight_buff.value"
            ),
            durationRemaining:
              mapSafeInteger(
                row.duration_remaining,
                "settlement.fight_buff.duration_remaining",
                1
              ),
          })
        ),

      events:
        eventResult.rows.map(
          mapPersistedEvent
        ),
    };
  }

  private async persistMonsterCooldown(input: {
    monsterType: MonsterType;
    cooldownSeconds: number;
    additionalCooldownSeconds: number;
    observedAt: Date;
  }): Promise<{
    applied: boolean;
    availableAt: Date | null;
  }> {
    if (
      input.monsterType !== "Normal" &&
      input.monsterType !== "MiniBoss"
    ) {
      return {
        applied: false,
        availableAt: null,
      };
    }

    const additionalSeconds =
      input.monsterType === "MiniBoss"
        ? input.additionalCooldownSeconds
        : 0;

    const totalSeconds =
      input.cooldownSeconds +
      additionalSeconds;

    if (
      !Number.isSafeInteger(
        totalSeconds
      ) ||
      totalSeconds < 0
    ) {
      throw new InvalidPersistentCombatStateError(
        "Cooldown duration is invalid."
      );
    }

    if (totalSeconds === 0) {
      return {
        applied: false,
        availableAt: null,
      };
    }

    const availableAt =
      new Date(
        input.observedAt.getTime() +
        totalSeconds * 1000
      );

    if (
      Number.isNaN(
        availableAt.getTime()
      )
    ) {
      throw new InvalidPersistentCombatStateError(
        "Cooldown timestamp is invalid."
      );
    }

    const cooldownWrite =
      await this.client.query(
        `
          INSERT INTO character_cooldowns (
            character_id,
            cooldown_type,
            target_id,
            available_at,
            created_at,
            updated_at
          )
          VALUES (
            $1,
            'Monster',
            $2,
            $3,
            $4,
            $4
          )
          ON CONFLICT (
            character_id,
            target_id
          )
          WHERE cooldown_type = 'Monster'
          DO UPDATE
          SET
            available_at =
              EXCLUDED.available_at,
            updated_at =
              EXCLUDED.updated_at
        `,
        [
          this.locked.session
            .characterId,
          this.locked.session
            .monsterId,
          availableAt,
          input.observedAt,
        ]
      );

    if (cooldownWrite.rowCount !== 1) {
      throw new InvalidPersistentCombatStateError(
        "Cooldown could not be persisted."
      );
    }

    return {
      applied: true,
      availableAt,
    };
  }

  private async persistVictoryCharacter(
    input: ApplyVictorySettlementInput
  ): Promise<void> {
    const update =
      await this.client.query(
        `
          UPDATE characters
          SET
            level = $2,
            experience = $3,
            gold = $4,
            current_health = $5,
            max_health = $6,
            current_mana = $7,
            max_mana = $8,
            current_energy = $9,
            max_energy = $10,
            resources_updated_at = $11,
            updated_at = $11
          WHERE character_id = $1
            AND status = 'IsActive'
            AND level = $12
            AND experience = $13
            AND gold = $14
        `,
        [
          this.locked.session
            .characterId,
          input.levelAfter,
          input.experienceAfter
            .toString(),
          input.goldAfter.toString(),
          input.resourcesAfter
            .currentHealth,
          input.resourcesAfter
            .maximumHealth,
          input.resourcesAfter
            .currentMana,
          input.resourcesAfter
            .maximumMana,
          input.resourcesAfter
            .currentEnergy,
          input.resourcesAfter
            .maximumEnergy,
          input.observedAt,
          input.context.character.level,
          input.context.character
            .experience.toString(),
          input.context.character
            .gold.toString(),
        ]
      );

    if (update.rowCount !== 1) {
      throw new InvalidPersistentCombatStateError(
        "Victory character state changed after settlement loading."
      );
    }
  }

  private async persistVictoryStatistics(
    input: ApplyVictorySettlementInput
  ): Promise<void> {
    const update =
      await this.client.query(
        `
          UPDATE character_statistics
          SET
            total_gold_earned = $2,
            highest_gold_owned = $3,
            total_monsters_killed = $4,
            total_bosses_killed = $5,
            total_daily_bosses_killed = $6,
            total_damage_dealt = $7,
            total_damage_taken = $8,
            highest_physical_hit = $9,
            strongest_monster_killed_id = $10,
            strongest_boss_killed_id = $11,
            current_no_death_streak = $12,
            longest_no_death_streak = $13,
            updated_at = $14
          WHERE character_id = $1
            AND total_gold_earned = $15
            AND highest_gold_owned = $16
            AND total_monsters_killed = $17
            AND total_bosses_killed = $18
            AND total_daily_bosses_killed = $19
            AND total_damage_dealt = $20
            AND total_damage_taken = $21
            AND highest_physical_hit = $22
            AND current_no_death_streak = $23
            AND longest_no_death_streak = $24
        `,
        [
          this.locked.session
            .characterId,

          input.statisticsAfter
            .totalGoldEarned.toString(),
          input.statisticsAfter
            .highestGoldOwned.toString(),
          input.statisticsAfter
            .totalMonstersKilled.toString(),
          input.statisticsAfter
            .totalBossesKilled.toString(),
          input.statisticsAfter
            .totalDailyBossesKilled
            .toString(),
          input.statisticsAfter
            .totalDamageDealt.toString(),
          input.statisticsAfter
            .totalDamageTaken.toString(),
          input.statisticsAfter
            .highestPhysicalHit.toString(),

          input
            .strongestMonsterKilledIdAfter,
          input
            .strongestBossKilledIdAfter,

          input.statisticsAfter
            .currentNoDeathStreak
            .toString(),
          input.statisticsAfter
            .longestNoDeathStreak
            .toString(),

          input.observedAt,

          input.context.statistics
            .totalGoldEarned.toString(),
          input.context.statistics
            .highestGoldOwned.toString(),
          input.context.statistics
            .totalMonstersKilled.toString(),
          input.context.statistics
            .totalBossesKilled.toString(),
          input.context.statistics
            .totalDailyBossesKilled
            .toString(),
          input.context.statistics
            .totalDamageDealt.toString(),
          input.context.statistics
            .totalDamageTaken.toString(),
          input.context.statistics
            .highestPhysicalHit.toString(),
          input.context.statistics
            .currentNoDeathStreak
            .toString(),
          input.context.statistics
            .longestNoDeathStreak
            .toString(),
        ]
      );

    if (update.rowCount !== 1) {
      throw new InvalidPersistentCombatStateError(
        "Victory statistics changed after settlement loading."
      );
    }
  }

  private async persistVictoryCore(
    input: ApplyVictorySettlementInput
  ): Promise<void> {
    if (
      input.state.status !==
      COMBAT_STATUS.playerVictory
    ) {
      throw new InvalidPersistentCombatStateError(
        "Victory persistence requires a player Victory state."
      );
    }

    if (
      input.context.character.characterId !==
      this.locked.session.characterId
    ) {
      throw new InvalidPersistentCombatStateError(
        "Victory settlement character does not match the locked session."
      );
    }

    if (
      input.context.monster.monsterId !==
      this.locked.session.monsterId
    ) {
      throw new InvalidPersistentCombatStateError(
        "Victory settlement monster does not match the locked session."
      );
    }

    await this.persistCombatEvents({
      resolvedTurn:
        input.resolvedTurn,
      events: input.events,
      observedAt: input.observedAt,
    });

    const characterUpdate =
      await this.client.query(
        `
          UPDATE characters
          SET
            level = $2,
            experience = $3,
            gold = $4,
            current_health = $5,
            max_health = $6,
            current_mana = $7,
            max_mana = $8,
            current_energy = $9,
            max_energy = $10,
            resources_updated_at = $11,
            updated_at = $11
          WHERE character_id = $1
            AND status = 'IsActive'
        `,
        [
          this.locked.session
            .characterId,
          input.levelAfter,
          input.experienceAfter
            .toString(),
          input.goldAfter
            .toString(),
          input.resourcesAfter
            .currentHealth,
          input.resourcesAfter
            .maximumHealth,
          input.resourcesAfter
            .currentMana,
          input.resourcesAfter
            .maximumMana,
          input.resourcesAfter
            .currentEnergy,
          input.resourcesAfter
            .maximumEnergy,
          input.observedAt,
        ]
      );

    if (
      characterUpdate.rowCount !== 1
    ) {
      throw new CharacterNotFoundError();
    }

    await this.injectSettlementFailure(
      "victory.character"
    );

    const statisticsUpdate =
      await this.client.query(
        `
          UPDATE character_statistics
          SET
            total_gold_earned = $2,
            highest_gold_owned = $3,
            total_monsters_killed = $4,
            total_bosses_killed = $5,
            total_daily_bosses_killed = $6,
            total_damage_dealt = $7,
            total_damage_taken = $8,
            highest_physical_hit = $9,
            strongest_monster_killed_id = $10,
            strongest_boss_killed_id = $11,
            current_no_death_streak = $12,
            longest_no_death_streak = $13,
            updated_at = $14
          WHERE character_id = $1
        `,
        [
          this.locked.session
            .characterId,
          input.statisticsAfter
            .totalGoldEarned
            .toString(),
          input.statisticsAfter
            .highestGoldOwned
            .toString(),
          input.statisticsAfter
            .totalMonstersKilled
            .toString(),
          input.statisticsAfter
            .totalBossesKilled
            .toString(),
          input.statisticsAfter
            .totalDailyBossesKilled
            .toString(),
          input.statisticsAfter
            .totalDamageDealt
            .toString(),
          input.statisticsAfter
            .totalDamageTaken
            .toString(),
          input.statisticsAfter
            .highestPhysicalHit
            .toString(),
          input.strongestMonsterKilledIdAfter,
          input.strongestBossKilledIdAfter,
          input.statisticsAfter
            .currentNoDeathStreak
            .toString(),
          input.statisticsAfter
            .longestNoDeathStreak
            .toString(),
          input.observedAt,
        ]
      );

    if (
      statisticsUpdate.rowCount !== 1
    ) {
      throw new InvalidPersistentCombatStateError(
        "Victory settlement could not update character statistics."
      );
    }

    await this.injectSettlementFailure(
      "victory.statistics"
    );
  }

  private async persistVictoryConsequences(
    input: ApplyVictorySettlementInput
  ): Promise<{
    bestiary: {
      discovered: boolean;
      killCount: bigint;
    };
    taskBoss: {
      progressed: boolean;
      status: string | null;
    };
    cooldown: {
      applied: boolean;
      availableAt: Date | null;
    };
    dailyBoss: {
      updated: boolean;
      victoryRecorded: boolean;
    };
  }> {
    const bestiaryEntryInsert =
      await this.client.query(
        `
          INSERT INTO bestiary_entries (
            character_id,
            monster_id,
            unlocked_at,
            created_at
          )
          VALUES (
            $1,
            $2,
            $3,
            $3
          )
          ON CONFLICT (
            character_id,
            monster_id
          )
          DO NOTHING
          RETURNING bestiary_entry_id
        `,
        [
          this.locked.session
            .characterId,
          this.locked.session
            .monsterId,
          input.observedAt,
        ]
      );

    const bestiaryStatistics =
      await this.client.query<{
        kill_count: string;
        task_progress: string;
        task_status: string;
      }>(
        `
          INSERT INTO bestiary_statistics (
            character_id,
            monster_id,
            kill_count,
            first_kill_at,
            last_kill_at,
            task_progress,
            task_status,
            created_at,
            updated_at
          )
          VALUES (
            $1,
            $2,
            1,
            $3,
            $3,
            0,
            'ACTIVE',
            $3,
            $3
          )
          ON CONFLICT (
            character_id,
            monster_id
          )
          DO UPDATE
          SET
            kill_count =
              bestiary_statistics.kill_count + 1,
            last_kill_at = EXCLUDED.last_kill_at,
            updated_at = EXCLUDED.updated_at
          RETURNING
            kill_count,
            task_progress,
            task_status
        `,
        [
          this.locked.session
            .characterId,
          this.locked.session
            .monsterId,
          input.observedAt,
        ]
      );

    const bestiaryRow =
      bestiaryStatistics.rows[0];

    if (!bestiaryRow) {
      throw new InvalidPersistentCombatStateError(
        "Victory settlement could not update Bestiary statistics."
      );
    }

    await this.injectSettlementFailure(
      "victory.bestiary"
    );

    let taskProgressed = false;
    let taskStatus: string | null =
      input.context.task
        ?.currentStatus ??
      null;

    const task =
      input.context.task;

    if (
      task !== null &&
      this.locked.session.monsterId ===
        task.progressMonsterId
    ) {
      const progressUpdate =
        await this.client.query<{
          task_progress: string;
          task_status: string;
        }>(
          `
            UPDATE bestiary_statistics
            SET
              task_progress = LEAST(
                $3::bigint,
                task_progress + 1
              ),
              task_status =
                CASE
                  WHEN LEAST(
                    $3::bigint,
                    task_progress + 1
                  ) >= $3::bigint
                    THEN 'UNLOCKED'
                  ELSE task_status
                END,
              updated_at = $4
            WHERE character_id = $1
              AND monster_id = $2
              AND task_status = 'ACTIVE'
            RETURNING
              task_progress,
              task_status
          `,
          [
            this.locked.session
              .characterId,
            task.progressMonsterId,
            task.requiredKills
              .toString(),
            input.observedAt,
          ]
        );

      const progressRow =
        progressUpdate.rows[0];

      if (progressRow) {
        taskProgressed = true;
        taskStatus =
          progressRow.task_status;
      }
    }

    if (
      task !== null &&
      input.context.monster.bossId ===
        task.taskBossId
    ) {
      const bossUpdate =
        await this.client.query<{
          task_status: string;
        }>(
          `
            UPDATE bestiary_statistics
            SET
              task_status =
                'WAITING_FOR_REUNLOCK',
              updated_at = $3
            WHERE character_id = $1
              AND monster_id = $2
              AND task_status = 'UNLOCKED'
            RETURNING task_status
          `,
          [
            this.locked.session
              .characterId,
            task.progressMonsterId,
            input.observedAt,
          ]
        );

      const bossRow =
        bossUpdate.rows[0];

      if (bossRow) {
        taskProgressed = true;
        taskStatus =
          bossRow.task_status;
      }

      await this.injectSettlementFailure(
        "victory.task"
      );
    }

    let dailyBossUpdated = false;
    let dailyBossVictoryRecorded = false;

    const dailyBoss =
      input.context.dailyBoss;

    if (dailyBoss !== null) {
      const dailyUpdate =
        await this.client.query(
          `
            UPDATE character_daily_boss_progress
            SET
              total_victories =
                total_victories + 1,
              last_victory_at = $4,
              highest_tier_defeated =
                GREATEST(
                  COALESCE(
                    highest_tier_defeated,
                    0
                  ),
                  $5
                ),
              updated_at = $4
            WHERE character_id = $1
              AND daily_boss_definition_id = $2
              AND daily_boss_rotation_id = $3
          `,
          [
            this.locked.session
              .characterId,
            dailyBoss
              .dailyBossDefinitionId,
            dailyBoss
              .dailyBossRotationId,
            input.observedAt,
            dailyBoss.tier,
          ]
        );

      if (dailyUpdate.rowCount !== 1) {
        throw new InvalidPersistentCombatStateError(
          "Daily Boss Victory progress was not found."
        );
      }

      dailyBossUpdated = true;
      dailyBossVictoryRecorded = true;

      await this.injectSettlementFailure(
        "victory.dailyBoss"
      );
    }

    const cooldown =
      await this.persistMonsterCooldown({
        monsterType:
          input.context.monster
            .monsterType,
        cooldownSeconds:
          input.context.monster
            .cooldownSeconds,
        additionalCooldownSeconds:
          input.context.monster
            .additionalCooldownSeconds,
        observedAt: input.observedAt,
      });

    if (cooldown.applied) {
      await this.injectSettlementFailure(
        "victory.cooldown"
      );
    }

    for (
      const buff of
      input.context.fightBuffs
    ) {
      if (
        buff.durationRemaining === 1
      ) {
        const deletion =
          await this.client.query(
            `
              DELETE FROM character_buffs
              WHERE character_buff_id = $1
                AND character_id = $2
                AND duration_type = 'Fights'
                AND duration_remaining = 1
            `,
            [
              buff.characterBuffId,
              this.locked.session
                .characterId,
            ]
          );

        if (deletion.rowCount !== 1) {
          throw new InvalidPersistentCombatStateError(
            "Fight-based buff could not be consumed."
          );
        }

        await this.injectSettlementFailure(
          "victory.fightBuff"
        );

        continue;
      }

      const decrement =
        await this.client.query(
          `
            UPDATE character_buffs
            SET
              duration_remaining =
                duration_remaining - 1,
              updated_at = $3
            WHERE character_buff_id = $1
              AND character_id = $2
              AND duration_type = 'Fights'
              AND duration_remaining > 1
          `,
          [
            buff.characterBuffId,
            this.locked.session
              .characterId,
            input.observedAt,
          ]
        );

      if (decrement.rowCount !== 1) {
        throw new InvalidPersistentCombatStateError(
          "Fight-based buff duration could not be decremented."
        );
      }
    }

    return {
      bestiary: {
        discovered:
          bestiaryEntryInsert.rowCount ===
          1,
        killCount:
          mapNonNegativeBigInt(
            bestiaryRow.kill_count,
            "victory.bestiary.kill_count"
          ),
      },
      taskBoss: {
        progressed: taskProgressed,
        status: taskStatus,
      },
      cooldown: {
        applied: cooldown.applied,
        availableAt:
          cooldown.availableAt,
      },
      dailyBoss: {
        updated:
          dailyBossUpdated,
        victoryRecorded:
          dailyBossVictoryRecorded,
      },
    };
  }

  public async applyVictorySettlement(
    input: ApplyVictorySettlementInput
  ): Promise<CombatSettlement> {
    if (
      input.state.status !==
      COMBAT_STATUS.playerVictory
    ) {
      throw new InvalidPersistentCombatStateError(
        "Victory settlement requires a player Victory state."
      );
    }

    if (
      input.state.defeatReason !== null
    ) {
      throw new InvalidPersistentCombatStateError(
        "Victory settlement cannot contain a defeat reason."
      );
    }

    if (
      !(input.observedAt instanceof Date) ||
      Number.isNaN(
        input.observedAt.getTime()
      )
    ) {
      throw new InvalidPersistentCombatStateError(
        "Victory settlement time is invalid."
      );
    }

    if (
      input.observedAt.getTime() <
      this.locked.session
        .startedAt.getTime()
    ) {
      throw new InvalidPersistentCombatStateError(
        "Victory settlement cannot predate combat start."
      );
    }

    await this.persistVictoryCore(
      input
    );

    await this.injectSettlementFailure(
      "victory.core"
    );

    const consequences =
      await this.persistVictoryConsequences(
        input
      );

    await this.injectSettlementFailure(
      "victory.consequences"
    );

    const summary = {
      version: 1,
      outcome: "Victory",
      defeatReason: null,

      endingResources: {
        health:
          input.resourcesAfter
            .currentHealth,
        maximumHealth:
          input.resourcesAfter
            .maximumHealth,
        mana:
          input.resourcesAfter
            .currentMana,
        maximumMana:
          input.resourcesAfter
            .maximumMana,
        energy:
          input.resourcesAfter
            .currentEnergy,
        maximumEnergy:
          input.resourcesAfter
            .maximumEnergy,
      },

      turnCount: input.state.turn,

      damage: {
        dealt:
          input.damageDealt
            .toString(),
        taken:
          input.damageTaken
            .toString(),
        highestPhysicalHit:
          input.highestPhysicalHit
            .toString(),
      },

      rewards: {
        baseExperience:
          input.baseExperience
            .toString(),
        finalExperience:
          input.experienceAwarded
            .toString(),
        baseGold:
          input.baseGold
            .toString(),
        finalGold:
          input.goldAwarded
            .toString(),
        experienceBonusBasisPoints:
          input.experienceBonusBasisPoints
            .toString(),
        goldBonusBasisPoints:
          input.goldBonusBasisPoints
            .toString(),
      },

      progression: {
        experienceBefore:
          input.context.character
            .experience
            .toString(),
        experienceAfter:
          input.experienceAfter
            .toString(),
        goldBefore:
          input.context.character
            .gold
            .toString(),
        goldAfter:
          input.goldAfter
            .toString(),
        levelBefore:
          input.context.character
            .level,
        levelAfter:
          input.levelAfter,
        experienceLost: "0",
      },

      blessingConsumed: false,
      bestiary:
        consequences.bestiary,
      taskBoss:
        consequences.taskBoss,

      cooldown: {
        applied:
          consequences.cooldown
            .applied,
        availableAt:
          consequences.cooldown
            .availableAt
            ?.toISOString() ??
          null,
      },

      dailyBoss:
        consequences.dailyBoss,

      fightBuffsConsumed:
        input.context.fightBuffs
          .length,
    };

    const logInsert =
      await this.client.query(
        `
          INSERT INTO combat_logs (
            combat_session_id,
            character_id,
            monster_id,
            combat_result,
            turn_count,
            started_at,
            ended_at,
            combat_data_json,
            created_at
          )
          VALUES (
            $1,
            $2,
            $3,
            'Victory',
            $4,
            $5,
            $6,
            $7::jsonb,
            $6
          )
        `,
        [
          this.locked.session
            .combatSessionId,
          this.locked.session
            .characterId,
          this.locked.session
            .monsterId,
          input.state.turn,
          this.locked.session
            .startedAt,
          input.observedAt,
          JSON.stringify(
            summary,
            (_key, value: unknown) =>
              typeof value === "bigint"
                ? value.toString()
                : value
          ),
        ]
      );

    if (logInsert.rowCount !== 1) {
      throw new InvalidPersistentCombatStateError(
        "Victory final combat log could not be created."
      );
    }

    await this.injectSettlementFailure(
      "victory.finalLog"
    );

    await this.client.query(
      `
        DELETE FROM combat_logs
        WHERE combat_log_id IN (
          SELECT combat_log_id
          FROM combat_logs
          WHERE character_id = $1
          ORDER BY
            created_at DESC,
            combat_log_id DESC
          OFFSET 10
        )
      `,
      [
        this.locked.session
          .characterId,
      ]
    );

    await this.injectSettlementFailure(
      "victory.retention"
    );

    const finalSessionUpdate =
      await this.client.query(
        `
          UPDATE combat_sessions
          SET
            status = 'Victory',
            current_turn = $2,
            character_health = $3,
            monster_health = $4,
            defeat_reason = NULL,
            ended_at = $5,
            settled_at = $5,
            updated_at = $5
          WHERE combat_session_id = $1
            AND status = 'Active'
            AND ended_at IS NULL
            AND settled_at IS NULL
        `,
        [
          this.locked.session
            .combatSessionId,
          input.state.turn,
          input.state.player
            .currentHealth,
          input.state.monster
            .currentHealth,
          input.observedAt,
        ]
      );

    if (
      finalSessionUpdate.rowCount !== 1
    ) {
      throw new CombatSessionNotFoundError();
    }

    await this.injectSettlementFailure(
      "victory.terminalSession"
    );

    return {
      outcome: "Victory",

      experience: {
        before:
          input.context.character
            .experience,
        awarded:
          input.experienceAwarded,
        lost: 0n,
        after:
          input.experienceAfter,
      },

      gold: {
        before:
          input.context.character
            .gold,
        baseRolled:
          input.baseGold,
        awarded:
          input.goldAwarded,
        after:
          input.goldAfter,
      },

      level: {
        before:
          input.context.character
            .level,
        after:
          input.levelAfter,
        levelsChanged:
          input.levelAfter -
          input.context.character
            .level,
      },

      blessingConsumed: false,

      bestiary:
        consequences.bestiary,

      taskBoss:
        consequences.taskBoss,

      cooldown:
        consequences.cooldown,

      dailyBoss:
        consequences.dailyBoss,

      statistics: {
        damageDealt:
          input.damageDealt,
        damageTaken:
          input.damageTaken,
        highestPhysicalHit:
          input.highestPhysicalHit,
      },

      finalSummary: {
        combatSessionId:
          this.locked.session
            .combatSessionId,
        outcome: "Victory",
        turnCount:
          input.state.turn,
        startedAt:
          this.locked.session
            .startedAt,
        endedAt:
          input.observedAt,
      },
    };
  }

  private async persistDefeatCore(
    input: ApplyDefeatSettlementInput
  ): Promise<{
    cooldown: {
      applied: boolean;
      availableAt: Date | null;
    };
  }> {
    if (
      input.state.status !==
      COMBAT_STATUS.playerDefeat
    ) {
      throw new InvalidPersistentCombatStateError(
        "Defeat persistence requires a player Defeat state."
      );
    }

    if (
      input.state.defeatReason === null
    ) {
      throw new InvalidPersistentCombatStateError(
        "Defeat persistence requires a defeat reason."
      );
    }

    if (
      input.context.character.characterId !==
      this.locked.session.characterId
    ) {
      throw new InvalidPersistentCombatStateError(
        "Defeat settlement character does not match the locked session."
      );
    }

    if (
      input.context.monster.monsterId !==
      this.locked.session.monsterId
    ) {
      throw new InvalidPersistentCombatStateError(
        "Defeat settlement monster does not match the locked session."
      );
    }

    if (
      input.blessingConsumed !==
      input.context.blessed
    ) {
      throw new InvalidPersistentCombatStateError(
        "Defeat Blessing result does not match the locked settlement context."
      );
    }

    await this.persistCombatEvents({
      resolvedTurn:
        input.resolvedTurn,
      events: input.events,
      observedAt: input.observedAt,
    });

    const characterUpdate =
      await this.client.query(
        `
          UPDATE characters
          SET
            level = $2,
            experience = $3,
            gold = $4,
            current_health = $5,
            max_health = $6,
            current_mana = $7,
            max_mana = $8,
            current_energy = $9,
            max_energy = $10,
            resources_updated_at = $11,
            updated_at = $11
          WHERE character_id = $1
            AND status = 'IsActive'
        `,
        [
          this.locked.session
            .characterId,
          input.levelAfter,
          input.experienceAfter
            .toString(),
          input.goldAfter
            .toString(),
          input.resourcesAfter
            .currentHealth,
          input.resourcesAfter
            .maximumHealth,
          input.resourcesAfter
            .currentMana,
          input.resourcesAfter
            .maximumMana,
          input.resourcesAfter
            .currentEnergy,
          input.resourcesAfter
            .maximumEnergy,
          input.observedAt,
        ]
      );

    if (
      characterUpdate.rowCount !== 1
    ) {
      throw new CharacterNotFoundError();
    }

    await this.injectSettlementFailure(
      "defeat.character"
    );

    const statisticsUpdate =
      await this.client.query(
        `
          UPDATE character_statistics
          SET
            total_deaths = $2,
            total_damage_dealt = $3,
            total_damage_taken = $4,
            highest_physical_hit = $5,
            current_no_death_streak = $6,
            longest_no_death_streak = $7,
            updated_at = $8
          WHERE character_id = $1
        `,
        [
          this.locked.session
            .characterId,
          input.statisticsAfter
            .totalDeaths
            .toString(),
          input.statisticsAfter
            .totalDamageDealt
            .toString(),
          input.statisticsAfter
            .totalDamageTaken
            .toString(),
          input.statisticsAfter
            .highestPhysicalHit
            .toString(),
          input.statisticsAfter
            .currentNoDeathStreak
            .toString(),
          input.statisticsAfter
            .longestNoDeathStreak
            .toString(),
          input.observedAt,
        ]
      );

    if (
      statisticsUpdate.rowCount !== 1
    ) {
      throw new InvalidPersistentCombatStateError(
        "Defeat settlement could not update character statistics."
      );
    }

    await this.injectSettlementFailure(
      "defeat.statistics"
    );

    if (input.blessingConsumed) {
      const blessingDeletion =
        await this.client.query(
          `
            DELETE FROM character_blessings
            WHERE character_id = $1
          `,
          [
            this.locked.session
              .characterId,
          ]
        );

      if (
        blessingDeletion.rowCount !== 1
      ) {
        throw new InvalidPersistentCombatStateError(
          "Defeat Blessing could not be consumed."
        );
      }

      await this.injectSettlementFailure(
        "defeat.blessing"
      );
    }

    for (
      const buff of
      input.context.fightBuffs
    ) {
      if (
        buff.durationRemaining === 1
      ) {
        const deletion =
          await this.client.query(
            `
              DELETE FROM character_buffs
              WHERE character_buff_id = $1
                AND character_id = $2
                AND duration_type = 'Fights'
                AND duration_remaining = 1
            `,
            [
              buff.characterBuffId,
              this.locked.session
                .characterId,
            ]
          );

        if (deletion.rowCount !== 1) {
          throw new InvalidPersistentCombatStateError(
            "Fight-based buff could not be consumed after Defeat."
          );
        }

        await this.injectSettlementFailure(
          "defeat.fightBuff"
        );

        continue;
      }

      const decrement =
        await this.client.query(
          `
            UPDATE character_buffs
            SET
              duration_remaining =
                duration_remaining - 1,
              updated_at = $3
            WHERE character_buff_id = $1
              AND character_id = $2
              AND duration_type = 'Fights'
              AND duration_remaining > 1
          `,
          [
            buff.characterBuffId,
            this.locked.session
              .characterId,
            input.observedAt,
          ]
        );

      if (decrement.rowCount !== 1) {
        throw new InvalidPersistentCombatStateError(
          "Fight-based buff duration could not be decremented after Defeat."
        );
      }
    }

    const cooldown =
      await this.persistMonsterCooldown({
        monsterType:
          input.context.monster
            .monsterType,
        cooldownSeconds:
          input.context.monster
            .cooldownSeconds,
        additionalCooldownSeconds:
          input.context.monster
            .additionalCooldownSeconds,
        observedAt: input.observedAt,
      });

    if (cooldown.applied) {
      await this.injectSettlementFailure(
        "defeat.cooldown"
      );
    }

    return { cooldown };
  }

  public async applyDefeatSettlement(
    input: ApplyDefeatSettlementInput
  ): Promise<CombatSettlement> {
    if (
      input.state.status !==
      COMBAT_STATUS.playerDefeat
    ) {
      throw new InvalidPersistentCombatStateError(
        "Defeat settlement requires a player Defeat state."
      );
    }

    if (
      input.state.defeatReason === null
    ) {
      throw new InvalidPersistentCombatStateError(
        "Defeat settlement requires a defeat reason."
      );
    }

    if (
      !(input.observedAt instanceof Date) ||
      Number.isNaN(
        input.observedAt.getTime()
      )
    ) {
      throw new InvalidPersistentCombatStateError(
        "Defeat settlement time is invalid."
      );
    }

    if (
      input.observedAt.getTime() <
      this.locked.session
        .startedAt.getTime()
    ) {
      throw new InvalidPersistentCombatStateError(
        "Defeat settlement cannot predate combat start."
      );
    }

    const persistent =
      mapDomainStatusToPersistent(
        input.state
      );

    if (
      persistent.status !==
        PERSISTENT_COMBAT_STATUS.defeat ||
      persistent.defeatReason === null
    ) {
      throw new InvalidPersistentCombatStateError(
        "Defeat settlement could not map the terminal state."
      );
    }

    const consequences =
      await this.persistDefeatCore(
        input
      );

    await this.injectSettlementFailure(
      "defeat.core"
    );

    const summary = {
      version: 1,
      outcome: "Defeat",
      defeatReason:
        persistent.defeatReason,

      endingResources: {
        health:
          input.resourcesAfter
            .currentHealth,
        maximumHealth:
          input.resourcesAfter
            .maximumHealth,
        mana:
          input.resourcesAfter
            .currentMana,
        maximumMana:
          input.resourcesAfter
            .maximumMana,
        energy:
          input.resourcesAfter
            .currentEnergy,
        maximumEnergy:
          input.resourcesAfter
            .maximumEnergy,
      },

      turnCount:
        input.state.turn,

      damage: {
        dealt:
          input.damageDealt
            .toString(),
        taken:
          input.damageTaken
            .toString(),
        highestPhysicalHit:
          input.highestPhysicalHit
            .toString(),
      },

      rewards: {
        baseExperience: "0",
        finalExperience: "0",
        baseGold: "0",
        finalGold: "0",
        experienceBonusBasisPoints: "0",
        goldBonusBasisPoints: "0",
      },

      progression: {
        experienceBefore:
          input.context.character
            .experience
            .toString(),
        experienceAfter:
          input.experienceAfter
            .toString(),
        experienceLost:
          input.experienceLost
            .toString(),
        experienceLossPercent:
          input.lossPercent,

        goldBefore:
          input.context.character
            .gold
            .toString(),
        goldAfter:
          input.goldAfter
            .toString(),

        levelBefore:
          input.context.character
            .level,
        levelAfter:
          input.levelAfter,
      },

      blessingConsumed:
        input.blessingConsumed,

      bestiary: {
        discovered: false,
        killCount: null,
      },

      taskBoss: {
        progressed: false,
        status:
          input.context.task
            ?.currentStatus ??
          null,
      },

      cooldown: {
        applied:
          consequences.cooldown
            .applied,
        availableAt:
          consequences.cooldown
            .availableAt
            ?.toISOString() ??
          null,
      },

      dailyBoss: {
        updated: false,
        victoryRecorded: false,
      },

      fightBuffsConsumed:
        input.context.fightBuffs
          .length,
    };

    const logInsert =
      await this.client.query(
        `
          INSERT INTO combat_logs (
            combat_session_id,
            character_id,
            monster_id,
            combat_result,
            turn_count,
            started_at,
            ended_at,
            combat_data_json,
            created_at
          )
          VALUES (
            $1,
            $2,
            $3,
            'Defeat',
            $4,
            $5,
            $6,
            $7::jsonb,
            $6
          )
        `,
        [
          this.locked.session
            .combatSessionId,
          this.locked.session
            .characterId,
          this.locked.session
            .monsterId,
          input.state.turn,
          this.locked.session
            .startedAt,
          input.observedAt,
          JSON.stringify(
            summary,
            (_key, value) =>
              typeof value === "bigint"
                ? value.toString()
                : value
          ),
        ]
      );

    if (logInsert.rowCount !== 1) {
      throw new InvalidPersistentCombatStateError(
        "Defeat final combat log could not be created."
      );
    }

    await this.injectSettlementFailure(
      "defeat.finalLog"
    );

    await this.client.query(
      `
        DELETE FROM combat_logs
        WHERE combat_log_id IN (
          SELECT combat_log_id
          FROM combat_logs
          WHERE character_id = $1
          ORDER BY
            created_at DESC,
            combat_log_id DESC
          OFFSET 10
        )
      `,
      [
        this.locked.session
          .characterId,
      ]
    );

    await this.injectSettlementFailure(
      "defeat.retention"
    );

    const finalSessionUpdate =
      await this.client.query(
        `
          UPDATE combat_sessions
          SET
            status = 'Defeat',
            current_turn = $2,
            character_health = $3,
            monster_health = $4,
            defeat_reason = $5,
            ended_at = $6,
            settled_at = $6,
            updated_at = $6
          WHERE combat_session_id = $1
            AND status = 'Active'
            AND ended_at IS NULL
            AND settled_at IS NULL
        `,
        [
          this.locked.session
            .combatSessionId,
          input.state.turn,
          input.state.player
            .currentHealth,
          input.state.monster
            .currentHealth,
          persistent.defeatReason,
          input.observedAt,
        ]
      );

    if (
      finalSessionUpdate.rowCount !== 1
    ) {
      throw new CombatSessionNotFoundError();
    }

    await this.injectSettlementFailure(
      "defeat.terminalSession"
    );

    return {
      outcome: "Defeat",

      experience: {
        before:
          input.context.character
            .experience,
        awarded: 0n,
        lost:
          input.experienceLost,
        after:
          input.experienceAfter,
      },

      gold: {
        before:
          input.context.character
            .gold,
        baseRolled: 0n,
        awarded: 0n,
        after:
          input.goldAfter,
      },

      level: {
        before:
          input.context.character
            .level,
        after:
          input.levelAfter,
        levelsChanged:
          input.levelAfter -
          input.context.character
            .level,
      },

      blessingConsumed:
        input.blessingConsumed,

      bestiary: {
        discovered: false,
        killCount: null,
      },

      taskBoss: {
        progressed: false,
        status:
          input.context.task
            ?.currentStatus ??
          null,
      },

      cooldown:
        consequences.cooldown,

      dailyBoss: {
        updated: false,
        victoryRecorded: false,
      },

      statistics: {
        damageDealt:
          input.damageDealt,
        damageTaken:
          input.damageTaken,
        highestPhysicalHit:
          input.highestPhysicalHit,
      },

      finalSummary: {
        combatSessionId:
          this.locked.session
            .combatSessionId,
        outcome: "Defeat",
        turnCount:
          input.state.turn,
        startedAt:
          this.locked.session
            .startedAt,
        endedAt:
          input.observedAt,
      },
    };
  }

  private async persistCombatEvents(
    input: {
      resolvedTurn: number;
      events: readonly CombatEvent[];
      observedAt: Date;
    }
  ): Promise<readonly PersistedCombatEvent[]> {
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

    return persistedEvents;
  }

  private async persistCombatState(
    input: PersistCombatActionInput
  ): Promise<void> {
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
  }

  public async persistAction(
    input: PersistCombatActionInput
  ): Promise<readonly PersistedCombatEvent[]> {
    if (
      input.state.status !==
      COMBAT_STATUS.inProgress
    ) {
      throw new InvalidPersistentCombatStateError(
        "Terminal combat must use settlement persistence."
      );
    }

    const persistedEvents =
      await this.persistCombatEvents({
        resolvedTurn:
          input.resolvedTurn,
        events: input.events,
        observedAt: input.observedAt,
      });

    await this.persistCombatState(input);

    return persistedEvents;
  }
}

export class PostgresCombatSessionRepository
  implements CombatSessionRepository {
  public constructor(
    private readonly pool: Pool,
    private readonly options:
      PostgresCombatSessionRepositoryOptions = {}
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
                cs.monster_experience_reward,
                cs.monster_gold_min,
                cs.monster_gold_max,
                cs.started_at,
                cs.ended_at,
                cs.settled_at
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
            },
            input.observedAt,
            this.options
              .settlementFailureInjector
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
            cs.monster_experience_reward,
            cs.monster_gold_min,
            cs.monster_gold_max,
            cs.started_at,
            cs.ended_at,
            cs.settled_at
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
            cs.monster_experience_reward,
            cs.monster_gold_min,
            cs.monster_gold_max,
            cs.started_at,
            cs.ended_at,
            cs.settled_at
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

  nextBigInt?(
    minimum: bigint,
    maximum: bigint
  ): bigint;
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
# SOURCE: src/modules/characters/application/equipment.repository.ts
# ============================================================

```text
import type {
  AccountId,
  CharacterId,
  CharacterResources,
} from "../domain/character.types.js";
import type {
  EffectiveCharacterStatistics,
} from "../domain/effective-character-statistics.js";

export type InventoryItemId = string;

export type EquipmentMutationInput = {
  accountId: AccountId;
  characterId: CharacterId;
  inventoryItemId: InventoryItemId;
};

export type EquipmentMutationResult = {
  inventoryItemId: InventoryItemId;
  effectiveStatistics: EffectiveCharacterStatistics;
  resources: CharacterResources;
};

export interface EquipmentRepository {
  equip(
    input: EquipmentMutationInput
  ): Promise<EquipmentMutationResult>;

  unequip(
    input: EquipmentMutationInput
  ): Promise<EquipmentMutationResult>;
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
  healthPerMinute: 30,
  manaPerMinute: 10,
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

export function calculateLevelMaximumHealth(level: number): number {
  return (
    BASE_STATISTICS.maximumHealth +
    (level - 1) * 30
  );
}

export function calculateLevelMaximumMana(level: number): number {
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
# SOURCE: src/modules/characters/infrastructure/postgres-equipment.repository.ts
# ============================================================

```text
import type {
  Pool,
  PoolClient,
  QueryResult,
  QueryResultRow,
} from "pg";

import {
  CalculateCharacterStatsService,
} from "../application/calculate-character-stats.service.js";
import type {
  EquipmentMutationInput,
  EquipmentMutationResult,
  EquipmentRepository,
} from "../application/equipment.repository.js";
import {
  CharacterAccessDeniedError,
  EquipmentAlreadyEquippedError,
  EquipmentLevelRequiredError,
  EquipmentNotEquippedError,
  InventoryItemNotFoundError,
} from "../domain/character.errors.js";
import {
  withTransaction,
} from "../../../infrastructure/database/transaction.js";
import {
  PostgresCharacterStatisticsRepository,
} from "./postgres-character-statistics.repository.js";

type CharacterResourceRow = {
  level: number;
  current_health: string;
  current_mana: string;
  current_energy: string;
  resources_updated_at: Date;
};

type InventoryEquipmentRow = {
  inventory_item_id: string;
  slot: string;
  handedness: "OneHanded" | "TwoHanded" | null;
  required_level: number;
  is_equipped: boolean;
};

type Queryable = {
  query<Row extends QueryResultRow>(
    queryText: string,
    values?: unknown[]
  ): Promise<QueryResult<Row>>;
};

function parseSafeInteger(
  value: string,
  fieldName: string
): number {
  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new Error(
      `${fieldName} must be a non-negative safe integer.`
    );
  }

  return parsed;
}

async function lockCharacter(
  client: PoolClient,
  input: EquipmentMutationInput
): Promise<CharacterResourceRow> {
  const result =
    await client.query<CharacterResourceRow>(
      `
        SELECT
          level,
          current_health,
          current_mana,
          current_energy,
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

  if (row === undefined) {
    throw new CharacterAccessDeniedError();
  }

  return row;
}

async function lockInventory(
  client: PoolClient,
  characterId: string
): Promise<void> {
  await client.query(
    `
      SELECT inventory_item_id
      FROM inventory_items
      WHERE character_id = $1
      ORDER BY inventory_item_id
      FOR UPDATE
    `,
    [characterId]
  );
}

async function findInventoryItem(
  database: Queryable,
  input: EquipmentMutationInput
): Promise<InventoryEquipmentRow> {
  const result =
    await database.query<InventoryEquipmentRow>(
      `
        SELECT
          ii.inventory_item_id,
          ib.slot,
          ib.handedness,
          ib.required_level,
          ii.is_equipped
        FROM inventory_items ii
        INNER JOIN items i
          ON i.item_id = ii.item_id
        INNER JOIN item_bases ib
          ON ib.item_base_id = i.item_base_id
        WHERE ii.character_id = $1
          AND ii.inventory_item_id = $2
      `,
      [
        input.characterId,
        input.inventoryItemId,
      ]
    );

  const row = result.rows[0];

  if (row === undefined) {
    throw new InventoryItemNotFoundError();
  }

  return row;
}

async function unequipConflictingItems(
  client: PoolClient,
  characterId: string,
  item: InventoryEquipmentRow
): Promise<void> {
  await client.query(
    `
      UPDATE inventory_items current_inventory
      SET is_equipped = FALSE
      FROM items current_item
      INNER JOIN item_bases current_base
        ON current_base.item_base_id =
          current_item.item_base_id
      WHERE current_inventory.item_id =
          current_item.item_id
        AND current_inventory.character_id = $1
        AND current_inventory.inventory_item_id <> $2
        AND current_inventory.is_equipped = TRUE
        AND current_base.slot = $3
    `,
    [
      characterId,
      item.inventory_item_id,
      item.slot,
    ]
  );

  if (
    item.slot === "Weapon" &&
    item.handedness === "TwoHanded"
  ) {
    await client.query(
      `
        UPDATE inventory_items current_inventory
        SET is_equipped = FALSE
        FROM items current_item
        INNER JOIN item_bases current_base
          ON current_base.item_base_id =
            current_item.item_base_id
        WHERE current_inventory.item_id =
            current_item.item_id
          AND current_inventory.character_id = $1
          AND current_inventory.is_equipped = TRUE
          AND current_base.slot = 'Shield'
      `,
      [characterId]
    );
  }

  if (item.slot === "Shield") {
    await client.query(
      `
        UPDATE inventory_items current_inventory
        SET is_equipped = FALSE
        FROM items current_item
        INNER JOIN item_bases current_base
          ON current_base.item_base_id =
            current_item.item_base_id
        WHERE current_inventory.item_id =
            current_item.item_id
          AND current_inventory.character_id = $1
          AND current_inventory.is_equipped = TRUE
          AND current_base.slot = 'Weapon'
          AND current_base.handedness = 'TwoHanded'
      `,
      [characterId]
    );
  }
}

async function recalculateAndPersistResources(
  client: PoolClient,
  input: EquipmentMutationInput,
  character: CharacterResourceRow
): Promise<EquipmentMutationResult> {
  const statisticsRepository =
    new PostgresCharacterStatisticsRepository(client);

  const statisticsService =
    new CalculateCharacterStatsService(
      statisticsRepository
    );

  const effectiveStatistics =
    await statisticsService.execute({
      characterId: input.characterId,
    });

  const currentHealth = Math.min(
    parseSafeInteger(
      character.current_health,
      "current_health"
    ),
    effectiveStatistics.maximumHealth
  );

  const currentMana = Math.min(
    parseSafeInteger(
      character.current_mana,
      "current_mana"
    ),
    effectiveStatistics.maximumMana
  );

  const currentEnergy = Math.min(
    parseSafeInteger(
      character.current_energy,
      "current_energy"
    ),
    effectiveStatistics.maximumEnergy
  );

  const resources = {
    currentHealth,
    maximumHealth:
      effectiveStatistics.maximumHealth,

    currentMana,
    maximumMana:
      effectiveStatistics.maximumMana,

    currentEnergy,
    maximumEnergy:
      effectiveStatistics.maximumEnergy,

    resourcesUpdatedAt:
      character.resources_updated_at,
  };

  await client.query(
    `
      UPDATE characters
      SET
        current_health = $3,
        max_health = $4,
        current_mana = $5,
        max_mana = $6,
        current_energy = $7,
        max_energy = $8,
        updated_at = NOW()
      WHERE account_id = $1
        AND character_id = $2
    `,
    [
      input.accountId,
      input.characterId,
      resources.currentHealth,
      resources.maximumHealth,
      resources.currentMana,
      resources.maximumMana,
      resources.currentEnergy,
      resources.maximumEnergy,
    ]
  );

  return {
    inventoryItemId: input.inventoryItemId,
    effectiveStatistics,
    resources,
  };
}

export class PostgresEquipmentRepository
  implements EquipmentRepository
{
  public constructor(
    private readonly pool: Pool
  ) {}

  public async equip(
    input: EquipmentMutationInput
  ): Promise<EquipmentMutationResult> {
    return withTransaction(
      this.pool,
      async (client) => {
        const character =
          await lockCharacter(client, input);

        await lockInventory(
          client,
          input.characterId
        );

        const item =
          await findInventoryItem(client, input);

        if (item.is_equipped) {
          throw new EquipmentAlreadyEquippedError();
        }

        if (character.level < item.required_level) {
          throw new EquipmentLevelRequiredError(
            item.required_level,
            character.level
          );
        }

        await unequipConflictingItems(
          client,
          input.characterId,
          item
        );

        await client.query(
          `
            UPDATE inventory_items
            SET is_equipped = TRUE
            WHERE character_id = $1
              AND inventory_item_id = $2
          `,
          [
            input.characterId,
            input.inventoryItemId,
          ]
        );

        return recalculateAndPersistResources(
          client,
          input,
          character
        );
      }
    );
  }

  public async unequip(
    input: EquipmentMutationInput
  ): Promise<EquipmentMutationResult> {
    return withTransaction(
      this.pool,
      async (client) => {
        const character =
          await lockCharacter(client, input);

        await lockInventory(
          client,
          input.characterId
        );

        const item =
          await findInventoryItem(client, input);

        if (!item.is_equipped) {
          throw new EquipmentNotEquippedError();
        }

        await client.query(
          `
            UPDATE inventory_items
            SET is_equipped = FALSE
            WHERE character_id = $1
              AND inventory_item_id = $2
          `,
          [
            input.characterId,
            input.inventoryItemId,
          ]
        );

        return recalculateAndPersistResources(
          client,
          input,
          character
        );
      }
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
# SOURCE: src/modules/progression/domain/victory-settlement.ts
# ============================================================

```text
import type {
  CombatSettlementContext,
} from "../../combat/application/combat-session.repository.js";
import type {
  CombatSessionSnapshot,
} from "../../combat/application/combat-session.models.js";
import type {
  CombatEvent,
} from "../../combat/domain/combat.types.js";
import type {
  RandomSource,
} from "../../combat/ports/random-source.js";
import {
  adjustResourcesAfterLevelGain,
  aggregateCombatStatistics,
  calculateReward,
  levelFromExperience,
  percentagePointsToBasisPoints,
  POSTGRES_BIGINT_MAX,
  type ProgressionResources,
} from "./progression.js";
import {
  rollBigIntInclusive,
} from "./gold-roll.js";

export type VictoryStatisticsAfter = {
  totalGoldEarned: bigint;
  highestGoldOwned: bigint;
  totalMonstersKilled: bigint;
  totalBossesKilled: bigint;
  totalDailyBossesKilled: bigint;
  totalDamageDealt: bigint;
  totalDamageTaken: bigint;
  highestPhysicalHit: bigint;
  currentNoDeathStreak: bigint;
  longestNoDeathStreak: bigint;
};

export type VictorySettlementPlan = {
  baseExperience: bigint;
  baseGold: bigint;
  experienceBonusBasisPoints: bigint;
  goldBonusBasisPoints: bigint;
  experienceAwarded: bigint;
  goldAwarded: bigint;
  experienceBefore: bigint;
  experienceAfter: bigint;
  goldBefore: bigint;
  goldAfter: bigint;
  levelBefore: number;
  levelAfter: number;
  resourcesAfter: ProgressionResources;
  damageDealt: bigint;
  damageTaken: bigint;
  highestPhysicalHit: bigint;

  strongestMonsterKilledIdAfter:
    string;
  strongestBossKilledIdAfter:
    string | null;

  statisticsAfter:
    VictoryStatisticsAfter;
};

function checkedAdd(
  left: bigint,
  right: bigint,
  fieldName: string
): bigint {
  const result = left + right;

  if (
    result < 0n ||
    result > POSTGRES_BIGINT_MAX
  ) {
    throw new RangeError(
      `${fieldName} exceeds PostgreSQL BIGINT.`
    );
  }

  return result;
}

export function planVictorySettlement(
  session: CombatSessionSnapshot,
  context: CombatSettlementContext,
  terminalPlayerHealth: number,
  events: readonly CombatEvent[],
  randomSource: RandomSource
): VictorySettlementPlan {
  if (
    session.characterId !==
    context.character.characterId
  ) {
    throw new Error(
      "Settlement character does not match combat session."
    );
  }

  if (
    session.monsterId !==
    context.monster.monsterId
  ) {
    throw new Error(
      "Settlement monster does not match combat session."
    );
  }

  const baseExperience =
    session.rewards
      .monsterExperienceReward;

  const baseGold =
    rollBigIntInclusive(
      session.rewards
        .monsterGoldMinimum,
      session.rewards
        .monsterGoldMaximum,
      randomSource
    );

  const experienceBonusBasisPoints =
    percentagePointsToBasisPoints(
      context.rewardBonuses
        .experienceBonusPercent
    );

  const goldBonusBasisPoints =
    percentagePointsToBasisPoints(
      context.rewardBonuses
        .goldBonusPercent
    );

  const experienceAwarded =
    calculateReward(
      baseExperience,
      experienceBonusBasisPoints
    );

  const goldAwarded =
    calculateReward(
      baseGold,
      goldBonusBasisPoints
    );

  const experienceAfter =
    checkedAdd(
      context.character.experience,
      experienceAwarded,
      "Experience after Victory"
    );

  const goldAfter =
    checkedAdd(
      context.character.gold,
      goldAwarded,
      "Gold after Victory"
    );

  const levelAfter =
    levelFromExperience(
      experienceAfter
    );

  if (
    levelAfter <
    context.character.level
  ) {
    throw new Error(
      "Victory cannot reduce character level."
    );
  }

  if (
    !Number.isSafeInteger(
      terminalPlayerHealth
    ) ||
    terminalPlayerHealth < 0 ||
    terminalPlayerHealth >
      context.character.resources
        .maximumHealth
  ) {
    throw new Error(
      "Terminal player Health is invalid."
    );
  }

  const resourcesAfter =
    adjustResourcesAfterLevelGain(
      {
        ...context.character.resources,
        currentHealth:
          terminalPlayerHealth,
      },
      context.character.level,
      levelAfter
    );

  const statistics =
    aggregateCombatStatistics(
      events
    );

  const totalGoldEarned =
    checkedAdd(
      context.statistics
        .totalGoldEarned,
      goldAwarded,
      "Total Gold earned after Victory"
    );

  const totalMonstersKilled =
    checkedAdd(
      context.statistics
        .totalMonstersKilled,
      1n,
      "Total monsters killed after Victory"
    );

  const totalBossesKilled =
    checkedAdd(
      context.statistics
        .totalBossesKilled,
      context.monster.bossId === null
        ? 0n
        : 1n,
      "Total bosses killed after Victory"
    );

  const totalDailyBossesKilled =
    checkedAdd(
      context.statistics
        .totalDailyBossesKilled,
      context.monster.bossType ===
      "DailyBoss"
        ? 1n
        : 0n,
      "Total Daily Bosses killed after Victory"
    );

  const totalDamageDealt =
    checkedAdd(
      context.statistics
        .totalDamageDealt,
      statistics.damageDealt,
      "Total damage dealt after Victory"
    );

  const totalDamageTaken =
    checkedAdd(
      context.statistics
        .totalDamageTaken,
      statistics.damageTaken,
      "Total damage taken after Victory"
    );

  const currentNoDeathStreak =
    checkedAdd(
      context.statistics
        .currentNoDeathStreak,
      1n,
      "Current no-death streak after Victory"
    );

  const strongestMonsterKilledIdAfter =
    context.statistics
      .strongestMonsterPowerScore ===
      null ||
    context.monster.powerScore >
      context.statistics
        .strongestMonsterPowerScore
      ? context.monster.monsterId
      : context.statistics
          .strongestMonsterKilledId ??
        context.monster.monsterId;

  const strongestBossKilledIdAfter =
    context.monster.bossId === null
      ? context.statistics
          .strongestBossKilledId
      : context.statistics
            .strongestBossPowerScore ===
          null ||
        context.monster.powerScore >
          context.statistics
            .strongestBossPowerScore
        ? context.monster.bossId
        : context.statistics
            .strongestBossKilledId ??
          context.monster.bossId;

  const statisticsAfter:
    VictoryStatisticsAfter = {
      totalGoldEarned,

      highestGoldOwned:
        goldAfter >
        context.statistics
          .highestGoldOwned
          ? goldAfter
          : context.statistics
              .highestGoldOwned,

      totalMonstersKilled,
      totalBossesKilled,
      totalDailyBossesKilled,
      totalDamageDealt,
      totalDamageTaken,

      highestPhysicalHit:
        statistics.highestPhysicalHit >
        context.statistics
          .highestPhysicalHit
          ? statistics.highestPhysicalHit
          : context.statistics
              .highestPhysicalHit,

      currentNoDeathStreak,

      longestNoDeathStreak:
        currentNoDeathStreak >
        context.statistics
          .longestNoDeathStreak
          ? currentNoDeathStreak
          : context.statistics
              .longestNoDeathStreak,
    };

  return {
    baseExperience,
    baseGold,
    experienceBonusBasisPoints,
    goldBonusBasisPoints,
    experienceAwarded,
    goldAwarded,
    experienceBefore:
      context.character.experience,
    experienceAfter,
    goldBefore:
      context.character.gold,
    goldAfter,
    levelBefore:
      context.character.level,
    levelAfter,
    resourcesAfter,
    damageDealt:
      statistics.damageDealt,
    damageTaken:
      statistics.damageTaken,
    highestPhysicalHit:
      statistics.highestPhysicalHit,

    strongestMonsterKilledIdAfter,
    strongestBossKilledIdAfter,

    statisticsAfter,
  };
}

```

# ============================================================
# SOURCE: src/modules/progression/domain/victory-rewards.ts
# ============================================================

```text
import type {
  RandomSource,
} from "../../combat/ports/random-source.js";
import {
  validateRandomInteger,
} from "../../combat/domain/combat-validation.js";
import {
  calculateReward,
  percentagePointsToBasisPoints,
} from "./progression.js";

export type CalculateVictoryRewardsInput = {
  baseExperience: bigint;
  minimumGold: bigint;
  maximumGold: bigint;
  experienceBonusPercent: number;
  goldBonusPercent: number;
};

export type VictoryRewards = {
  baseExperience: bigint;
  finalExperience: bigint;
  baseGold: bigint;
  finalGold: bigint;
  experienceBonusBasisPoints: bigint;
  goldBonusBasisPoints: bigint;
};

function toSafeRandomBound(
  value: bigint,
  fieldName: string
): number {
  if (
    value < 0n ||
    value > BigInt(Number.MAX_SAFE_INTEGER)
  ) {
    throw new RangeError(
      `${fieldName} must fit within a safe integer for random selection.`
    );
  }

  return Number(value);
}

export function rollBaseGold(
  minimumGold: bigint,
  maximumGold: bigint,
  randomSource: RandomSource
): bigint {
  if (minimumGold > maximumGold) {
    throw new RangeError(
      "Minimum Gold cannot exceed maximum Gold."
    );
  }

  const minimum =
    toSafeRandomBound(
      minimumGold,
      "Minimum Gold"
    );

  const maximum =
    toSafeRandomBound(
      maximumGold,
      "Maximum Gold"
    );

  const rolled =
    randomSource.nextInt(
      minimum,
      maximum
    );

  validateRandomInteger(
    rolled,
    minimum,
    maximum
  );

  return BigInt(rolled);
}

export function calculateVictoryRewards(
  input: CalculateVictoryRewardsInput,
  randomSource: RandomSource
): VictoryRewards {
  const experienceBonusBasisPoints =
    percentagePointsToBasisPoints(
      input.experienceBonusPercent
    );

  const goldBonusBasisPoints =
    percentagePointsToBasisPoints(
      input.goldBonusPercent
    );

  const baseGold =
    rollBaseGold(
      input.minimumGold,
      input.maximumGold,
      randomSource
    );

  return {
    baseExperience:
      input.baseExperience,

    finalExperience:
      calculateReward(
        input.baseExperience,
        experienceBonusBasisPoints
      ),

    baseGold,

    finalGold:
      calculateReward(
        baseGold,
        goldBonusBasisPoints
      ),

    experienceBonusBasisPoints,
    goldBonusBasisPoints,
  };
}

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
  const withLootSettlement = vi.fn(async (
    _context,
    operation
  ) => operation({
    character: {
      characterId: "character-1",
      inventoryCapacity: 20,
      occupiedInventoryPositions: [],
      pity: { eligibleKillCount: 0, chancePerMille: 1 },
    },
    loadCatalog: vi.fn(async () => ({
      regularItemBases: [],
      otherLootCandidates: [],
      specialItemCandidates: [],
      itemScoreCoefficients: {
        ItemLevel: 1n, Attack: 1n, Defense: 1n, SpellPower: 1n,
        Health: 1n, Mana: 1n, Energy: 1n, GoldPercent: 1n,
        ExperiencePercent: 1n,
      },
    })),
    persistRegularItem: vi.fn(),
    persistSpecialItem: vi.fn(),
    applyOtherLoot: vi.fn(),
    updateUniquePity: vi.fn(),
  }));

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
    rewards: {
      monsterExperienceReward: 50n,
      monsterGoldMinimum: 10n,
      monsterGoldMaximum: 20n,
    },
        startedAt:
          new Date(
            "2026-10-07T19:59:00.000Z"
          ),
        endedAt: null,
        settledAt: null,
      },
      combatState: state,
    },
    withLootSettlement,
    loadSettlementContext:
      vi.fn(async () => ({
        character: {
          characterId: "character-1",
          level: 1,
          experience: 0n,
          gold: 0n,
          resources: {
            currentHealth:
              state.player.currentHealth,
            maximumHealth: 180,
            currentMana: 35,
            maximumMana: 35,
            currentEnergy: 100,
            maximumEnergy: 100,
            resourcesUpdatedAt:
              new Date(
                "2026-10-07T19:59:00.000Z"
              ),
          },
        },

        promoted: false,
        blessed: false,

        statistics: {
          totalGoldEarned: 0n,
          highestGoldOwned: 0n,
          totalMonstersKilled: 0n,
          totalBossesKilled: 0n,
          totalDailyBossesKilled: 0n,
          totalDeaths: 0n,
          totalDamageDealt: 0n,
          totalDamageTaken: 0n,
          highestPhysicalHit: 0n,

          strongestMonsterKilledId:
            null,
          strongestMonsterPowerScore:
            null,
          strongestBossKilledId:
            null,
          strongestBossPowerScore:
            null,

          currentNoDeathStreak: 0n,
          longestNoDeathStreak: 0n,
        },

        rewardBonuses: {
          goldBonusPercent: 0,
          experienceBonusPercent: 0,
        },

        monster: {
          monsterId: "monster-1",
          monsterFamilyId: "family-1",
          monsterType: "Normal" as const,
          level: 1,
          powerScore: 10n,
          cooldownSeconds: 30,
          bossId: null,
          bossType: null,
          additionalCooldownSeconds: 0,
          lootLevelBonus: 0,
        },

        task: null,
        dailyBoss: null,
        fightBuffs: [],
        events: [],
      })),

    applyVictorySettlement:
      vi.fn(async (input) => ({
        outcome: "Victory" as const,

        experience: {
          before:
            input.context.character
              .experience,
          awarded:
            input.experienceAwarded,
          lost: 0n,
          after:
            input.experienceAfter,
        },

        gold: {
          before:
            input.context.character
              .gold,
          baseRolled:
            input.baseGold,
          awarded:
            input.goldAwarded,
          after:
            input.goldAfter,
        },

        level: {
          before:
            input.context.character
              .level,
          after:
            input.levelAfter,
          levelsChanged:
            input.levelAfter -
            input.context.character
              .level,
        },

        blessingConsumed: false,

        bestiary: {
          discovered: true,
          killCount: 1n,
        },

        taskBoss: {
          progressed: false,
          status: null,
        },

        cooldown: {
          applied: true,
          availableAt:
            new Date(
              input.observedAt.getTime() +
              30_000
            ),
        },

        dailyBoss: {
          updated: false,
          victoryRecorded: false,
        },

        statistics: {
          damageDealt:
            input.damageDealt,
          damageTaken:
            input.damageTaken,
          highestPhysicalHit:
            input.highestPhysicalHit,
        },

        finalSummary: {
          combatSessionId:
            "session-1",
          outcome: "Victory" as const,
          turnCount:
            input.state.turn,
          startedAt:
            new Date(
              "2026-10-07T19:59:00.000Z"
            ),
          endedAt:
            input.observedAt,
        },
      })),

    applyDefeatSettlement:
      vi.fn(async (input) => ({
        outcome: "Defeat" as const,

        experience: {
          before:
            input.context.character
              .experience,
          awarded: 0n,
          lost:
            input.experienceLost,
          after:
            input.experienceAfter,
        },

        gold: {
          before:
            input.context.character
              .gold,
          baseRolled: 0n,
          awarded: 0n,
          after:
            input.goldAfter,
        },

        level: {
          before:
            input.context.character
              .level,
          after:
            input.levelAfter,
          levelsChanged:
            input.levelAfter -
            input.context.character
              .level,
        },

        blessingConsumed:
          input.blessingConsumed,

        bestiary: {
          discovered: false,
          killCount: null,
        },

        taskBoss: {
          progressed: false,
          status: null,
        },

        cooldown: {
          applied: false,
          availableAt: null,
        },

        dailyBoss: {
          updated: false,
          victoryRecorded: false,
        },

        statistics: {
          damageDealt:
            input.damageDealt,
          damageTaken:
            input.damageTaken,
          highestPhysicalHit:
            input.highestPhysicalHit,
        },

        finalSummary: {
          combatSessionId:
            "session-1",
          outcome: "Defeat" as const,
          turnCount:
            input.state.turn,
          startedAt:
            new Date(
              "2026-10-07T19:59:00.000Z"
            ),
          endedAt:
            input.observedAt,
        },
      })),
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
    withLootSettlement,
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
        settledAt: null,
        settlement: null,
        loot: null,
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
          nextInt: vi.fn((
            minimum: number,
            maximum: number
          ) => maximum === 1000
            ? maximum
            : Math.max(minimum, maximum)),
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

      expect(fixture.withLootSettlement).toHaveBeenCalledOnce();
      expect(result.loot).toMatchObject({
        specialRollOutcome: "Ineligible",
        otherLoot: null,
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
        loot: null,
      });
      expect(fixture.withLootSettlement).not.toHaveBeenCalled();
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
    consumeDailyBossAttempt,
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
      currentHealth: 180,
      maximumHealth: 180,
      currentMana: 35,
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
      characterHealth: 180,
      characterMana: 35,
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
        characterHealth: 180,
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

  it("consumes a Daily Boss attempt before persisting resources", async () => {
    const fixture = createFixture();

    fixture.findMonster.mockResolvedValueOnce({
      monsterId: "daily-monster-1",
      monsterCode: "daily_dragon",
      monsterType:
        MONSTER_TYPE.dailyBoss,
      level: 10,
      energyCost: 3,
      experienceReward: 100n,
      goldMinimum: 20n,
      goldMaximum: 30n,
      maximumHealth: 200,
      attack: 25,
      defense: 12,
      eligibility: {
        isEligible: true,
        reasons: [],
      },
      dailyBossAttempt: {
        dailyBossDefinitionId:
          "daily-definition-1",
        dailyBossRotationId:
          "daily-rotation-1",
        attemptsLimit: 1,
      },
    });

    await fixture.service.execute({
      ...input,
      monsterCode: "daily_dragon",
    });

    expect(
      fixture.consumeDailyBossAttempt
    ).toHaveBeenCalledOnce();

    expect(
      fixture.consumeDailyBossAttempt
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        monsterId: "daily-monster-1",
        monsterType: "DailyBoss",
        dailyBossAttempt: {
          dailyBossDefinitionId:
            "daily-definition-1",
          dailyBossRotationId:
            "daily-rotation-1",
          attemptsLimit: 1,
        },
      })
    );

    expect(
      fixture.consumeDailyBossAttempt
        .mock.invocationCallOrder[0]
    ).toBeLessThan(
      fixture.updateCharacterResources
        .mock.invocationCallOrder[0]
    );

    expect(
      fixture.updateCharacterResources
    ).toHaveBeenCalledOnce();

    expect(
      fixture.createCombatSession
    ).toHaveBeenCalledOnce();
  });

  it("stops Daily Boss start when attempt consumption fails", async () => {
    const fixture = createFixture();

    fixture.findMonster.mockResolvedValueOnce({
      monsterId: "daily-monster-1",
      monsterCode: "daily_dragon",
      monsterType:
        MONSTER_TYPE.dailyBoss,
      level: 10,
      energyCost: 3,
      experienceReward: 100n,
      goldMinimum: 20n,
      goldMaximum: 30n,
      maximumHealth: 200,
      attack: 25,
      defense: 12,
      eligibility: {
        isEligible: true,
        reasons: [],
      },
      dailyBossAttempt: {
        dailyBossDefinitionId:
          "daily-definition-1",
        dailyBossRotationId:
          "daily-rotation-1",
        attemptsLimit: 1,
      },
    });

    const failure =
      new Error(
        "Daily Boss attempt failed."
      );

    fixture.consumeDailyBossAttempt
      .mockRejectedValueOnce(failure);

    await expect(
      fixture.service.execute({
        ...input,
        monsterCode: "daily_dragon",
      })
    ).rejects.toBe(failure);

    expect(
      fixture.consumeDailyBossAttempt
    ).toHaveBeenCalledOnce();

    expect(
      fixture.updateCharacterResources
    ).not.toHaveBeenCalled();

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
    monster_experience_reward: "50",
    monster_gold_min: "10",
    monster_gold_max: "20",
    started_at:
      new Date("2026-01-01T00:00:00.000Z"),
    ended_at: null,
    settled_at: null,
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
# SOURCE: tests/unit/progression/victory-settlement.test.ts
# ============================================================

```text
import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  PERSISTENT_COMBAT_STATUS,
  type CombatSessionSnapshot,
} from "../../../src/modules/combat/application/combat-session.models.js";
import type {
  CombatSettlementContext,
} from "../../../src/modules/combat/application/combat-session.repository.js";
import {
  COMBAT_ACTOR,
  COMBAT_EVENT_TYPE,
} from "../../../src/modules/combat/domain/combat.constants.js";
import type {
  CombatEvent,
} from "../../../src/modules/combat/domain/combat.types.js";
import type {
  RandomSource,
} from "../../../src/modules/combat/ports/random-source.js";
import {
  planVictorySettlement,
} from "../../../src/modules/progression/domain/victory-settlement.js";

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
      currentHealth: 40,
      maximumHealth: 180,
      attack: 20,
      defense: 10,
    },
    monster: {
      currentHealth: 10,
      maximumHealth: 80,
      attack: 15,
      defense: 8,
    },
    rewards: {
      monsterExperienceReward: 200n,
      monsterGoldMinimum: 10n,
      monsterGoldMaximum: 20n,
    },
    startedAt:
      new Date("2026-10-08T20:00:00.000Z"),
    endedAt: null,
    settledAt: null,
  };
}

function createContext():
CombatSettlementContext {
  return {
    character: {
      characterId: "character-1",
      level: 1,
      experience: 0n,
      gold: 100n,
      resources: {
        currentHealth: 40,
        maximumHealth: 180,
        currentMana: 10,
        maximumMana: 35,
        currentEnergy: 60,
        maximumEnergy: 100,
        resourcesUpdatedAt:
          new Date("2026-10-08T20:00:00.000Z"),
      },
    },
    promoted: false,
    blessed: false,
    statistics: {
      totalGoldEarned: 0n,
      highestGoldOwned: 100n,
      totalMonstersKilled: 0n,
      totalBossesKilled: 0n,
      totalDailyBossesKilled: 0n,
      totalDeaths: 0n,
      totalDamageDealt: 0n,
      totalDamageTaken: 0n,
      highestPhysicalHit: 0n,
      strongestMonsterKilledId: null,
      strongestMonsterPowerScore: null,
      strongestBossKilledId: null,
      strongestBossPowerScore: null,
      currentNoDeathStreak: 0n,
      longestNoDeathStreak: 0n,
    },
    rewardBonuses: {
      goldBonusPercent: 25,
      experienceBonusPercent: 10,
    },
    monster: {
      monsterId: "monster-1",
      monsterFamilyId: null,
      monsterType: "Normal",
      level: 1,
      powerScore: 10n,
      cooldownSeconds: 30,
      bossId: null,
      bossType: null,
      additionalCooldownSeconds: 0,
      lootLevelBonus: 0,
    },
    task: null,
    dailyBoss: null,
    fightBuffs: [],
    events: [],
  };
}

const events: CombatEvent[] = [
  {
    type:
      COMBAT_EVENT_TYPE.attackResolved,
    actor: COMBAT_ACTOR.player,
    target: COMBAT_ACTOR.monster,
    hit: true,
    damage: 25,
  },
  {
    type:
      COMBAT_EVENT_TYPE.attackResolved,
    actor: COMBAT_ACTOR.monster,
    target: COMBAT_ACTOR.player,
    hit: true,
    damage: 8,
  },
];

describe("M6 Victory settlement plan", () => {
  it("calculates rewards, levels, resources and statistics", () => {
    const randomSource: RandomSource = {
      nextFloat: vi.fn(() => 0),
      nextInt: vi.fn(() => 20),
    };

    const result =
      planVictorySettlement(
        createSession(),
        createContext(),
        40,
        events,
        randomSource
      );

    expect(result).toMatchObject({
      baseExperience: 200n,
      baseGold: 20n,
      experienceAwarded: 220n,
      goldAwarded: 25n,
      experienceBefore: 0n,
      experienceAfter: 220n,
      goldBefore: 100n,
      goldAfter: 125n,
      levelBefore: 1,
      levelAfter: 3,
      damageDealt: 25n,
      damageTaken: 8n,
      highestPhysicalHit: 25n,
      resourcesAfter: {
        currentHealth: 100,
        maximumHealth: 240,
        currentMana: 40,
        maximumMana: 65,
        currentEnergy: 60,
        maximumEnergy: 100,
      },
      statisticsAfter: {
        totalGoldEarned: 25n,
        highestGoldOwned: 125n,
        totalMonstersKilled: 1n,
        totalBossesKilled: 0n,
        totalDailyBossesKilled: 0n,
        totalDamageDealt: 25n,
        totalDamageTaken: 8n,
        highestPhysicalHit: 25n,
        currentNoDeathStreak: 1n,
        longestNoDeathStreak: 1n,
      },
    });

    expect(
      randomSource.nextInt
    ).toHaveBeenCalledWith(10, 20);
  });

  it("supports zero rewards without rolling equal Gold bounds", () => {
    const session = createSession();

    session.rewards = {
      monsterExperienceReward: 0n,
      monsterGoldMinimum: 0n,
      monsterGoldMaximum: 0n,
    };

    const randomSource: RandomSource = {
      nextFloat: vi.fn(() => 0),
      nextInt: vi.fn(),
    };

    const result =
      planVictorySettlement(
        session,
        createContext(),
        40,
        [],
        randomSource
      );

    expect(result.experienceAwarded)
      .toBe(0n);

    expect(result.goldAwarded)
      .toBe(0n);

    expect(result.levelAfter)
      .toBe(1);

    expect(
      randomSource.nextInt
    ).not.toHaveBeenCalled();
  });

  it("rejects mismatched authoritative entities", () => {
    const context = createContext();

    context.monster.monsterId =
      "different-monster";

    expect(() =>
      planVictorySettlement(
        createSession(),
        context,
        40,
        [],
        {
          nextFloat: vi.fn(() => 0),
          nextInt: vi.fn(() => 10),
        }
      )
    ).toThrow(
      "Settlement monster does not match combat session."
    );
  });

  it("rejects progression overflow", () => {
    const context = createContext();

    context.character.gold =
      9_223_372_036_854_775_807n;

    expect(() =>
      planVictorySettlement(
        createSession(),
        context,
        40,
        [],
        {
          nextFloat: vi.fn(() => 0),
          nextInt: vi.fn(() => 20),
        }
      )
    ).toThrow(
      "Gold after Victory exceeds PostgreSQL BIGINT."
    );
  });

  it("increments boss and Daily Boss statistics", () => {
    const context = createContext();

    context.monster.bossId =
      "boss-1";

    context.monster.bossType =
      "DailyBoss";

    context.statistics
      .totalMonstersKilled = 10n;

    context.statistics
      .totalBossesKilled = 4n;

    context.statistics
      .totalDailyBossesKilled = 2n;

    context.statistics
      .currentNoDeathStreak = 5n;

    context.statistics
      .longestNoDeathStreak = 8n;

    const result =
      planVictorySettlement(
        createSession(),
        context,
        40,
        events,
        {
          nextFloat: vi.fn(() => 0),
          nextInt: vi.fn(() => 10),
        }
      );

    expect(
      result.statisticsAfter
    ).toMatchObject({
      totalMonstersKilled: 11n,
      totalBossesKilled: 5n,
      totalDailyBossesKilled: 3n,
      currentNoDeathStreak: 6n,
      longestNoDeathStreak: 8n,
    });
  });

  it("rejects statistics overflow", () => {
    const context = createContext();

    context.statistics
      .totalMonstersKilled =
      9_223_372_036_854_775_807n;

    expect(() =>
      planVictorySettlement(
        createSession(),
        context,
        40,
        [],
        {
          nextFloat: vi.fn(() => 0),
          nextInt: vi.fn(() => 10),
        }
      )
    ).toThrow(
      "Total monsters killed after Victory exceeds PostgreSQL BIGINT."
    );
  });


  it("updates strongest defeated opponents by power score", () => {
    const context = createContext();

    context.monster.bossId =
      "boss-strong";
    context.monster.bossType =
      "MiniBoss";
    context.monster.powerScore =
      500n;

    context.statistics
      .strongestMonsterKilledId =
      "monster-old";
    context.statistics
      .strongestMonsterPowerScore =
      400n;

    context.statistics
      .strongestBossKilledId =
      "boss-old";
    context.statistics
      .strongestBossPowerScore =
      450n;

    const result =
      planVictorySettlement(
        createSession(),
        context,
        40,
        [],
        {
          nextFloat: vi.fn(() => 0),
          nextInt: vi.fn(() => 10),
        }
      );

    expect(
      result.strongestMonsterKilledIdAfter
    ).toBe("monster-1");

    expect(
      result.strongestBossKilledIdAfter
    ).toBe("boss-strong");
  });

  it("preserves stronger historical opponents", () => {
    const context = createContext();

    context.monster.bossId =
      "boss-weaker";
    context.monster.bossType =
      "MiniBoss";
    context.monster.powerScore =
      100n;

    context.statistics
      .strongestMonsterKilledId =
      "monster-strong";
    context.statistics
      .strongestMonsterPowerScore =
      900n;

    context.statistics
      .strongestBossKilledId =
      "boss-strong";
    context.statistics
      .strongestBossPowerScore =
      800n;

    const result =
      planVictorySettlement(
        createSession(),
        context,
        40,
        [],
        {
          nextFloat: vi.fn(() => 0),
          nextInt: vi.fn(() => 10),
        }
      );

    expect(
      result.strongestMonsterKilledIdAfter
    ).toBe("monster-strong");

    expect(
      result.strongestBossKilledIdAfter
    ).toBe("boss-strong");
  });


  it("uses terminal Health from the ending action", () => {
    const context = createContext();

    context.character.resources
      .currentHealth = 100;

    const result =
      planVictorySettlement(
        createSession(),
        context,
        25,
        [],
        {
          nextFloat: vi.fn(() => 0),
          nextInt: vi.fn(() => 10),
        }
      );

    expect(
      result.resourcesAfter.currentHealth
    ).toBe(85);

    expect(
      result.resourcesAfter.maximumHealth
    ).toBe(240);
  });

  it("rejects invalid terminal Health", () => {
    expect(() =>
      planVictorySettlement(
        createSession(),
        createContext(),
        181,
        [],
        {
          nextFloat: vi.fn(() => 0),
          nextInt: vi.fn(() => 10),
        }
      )
    ).toThrow(
      "Terminal player Health is invalid."
    );
  });

});

```

# ============================================================
# SOURCE: tests/unit/progression/victory-rewards.test.ts
# ============================================================

```text
import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  calculateVictoryRewards,
  rollBaseGold,
} from "../../../src/modules/progression/domain/victory-rewards.js";
import type {
  RandomSource,
} from "../../../src/modules/combat/ports/random-source.js";

function createRandomSource(
  rolledGold: number
): RandomSource {
  return {
    nextFloat: vi.fn(() => 0),
    nextInt: vi.fn(
      () => rolledGold
    ),
  };
}

describe("M6 Victory rewards", () => {
  it("rolls the inclusive minimum", () => {
    const randomSource =
      createRandomSource(10);

    expect(
      rollBaseGold(
        10n,
        20n,
        randomSource
      )
    ).toBe(10n);

    expect(
      randomSource.nextInt
    ).toHaveBeenCalledWith(10, 20);
  });

  it("rolls the inclusive maximum", () => {
    expect(
      rollBaseGold(
        10n,
        20n,
        createRandomSource(20)
      )
    ).toBe(20n);
  });

  it("supports an equal Gold range", () => {
    expect(
      rollBaseGold(
        15n,
        15n,
        createRandomSource(15)
      )
    ).toBe(15n);
  });

  it("calculates final Experience and Gold", () => {
    const result =
      calculateVictoryRewards(
        {
          baseExperience: 101n,
          minimumGold: 10n,
          maximumGold: 20n,
          experienceBonusPercent: 12.5,
          goldBonusPercent: 2.5,
        },
        createRandomSource(15)
      );

    expect(result).toEqual({
      baseExperience: 101n,
      finalExperience: 113n,
      baseGold: 15n,
      finalGold: 15n,
      experienceBonusBasisPoints:
        1_250n,
      goldBonusBasisPoints: 250n,
    });
  });

  it("supports zero rewards", () => {
    expect(
      calculateVictoryRewards(
        {
          baseExperience: 0n,
          minimumGold: 0n,
          maximumGold: 0n,
          experienceBonusPercent: 0,
          goldBonusPercent: 0,
        },
        createRandomSource(0)
      )
    ).toMatchObject({
      finalExperience: 0n,
      baseGold: 0n,
      finalGold: 0n,
    });
  });

  it("rejects an invalid Gold range", () => {
    expect(() =>
      rollBaseGold(
        20n,
        10n,
        createRandomSource(15)
      )
    ).toThrow(
      "Minimum Gold cannot exceed maximum Gold."
    );
  });

  it("rejects unsafe random bounds", () => {
    expect(() =>
      rollBaseGold(
        0n,
        BigInt(Number.MAX_SAFE_INTEGER) +
          1n,
        createRandomSource(0)
      )
    ).toThrow(
      "Maximum Gold must fit within a safe integer for random selection."
    );
  });

  it("rejects an invalid RNG result", () => {
    expect(() =>
      rollBaseGold(
        10n,
        20n,
        createRandomSource(21)
      )
    ).toThrow();
  });

  it("rolls Gold exactly once", () => {
    const randomSource =
      createRandomSource(12);

    calculateVictoryRewards(
      {
        baseExperience: 50n,
        minimumGold: 10n,
        maximumGold: 20n,
        experienceBonusPercent: 0,
        goldBonusPercent: 0,
      },
      randomSource
    );

    expect(
      randomSource.nextInt
    ).toHaveBeenCalledOnce();
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
  type CombatSettlementFailurePoint,
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

class DefeatRandomSource
  implements RandomSource {
  private floatCall = 0;

  public nextFloat(): number {
    this.floatCall += 1;

    return this.floatCall === 1
      ? 0.99
      : 0;
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

/**
 * Drives a deterministic regular Equipment drop for a boss while pinning
 * the canonical Item Level range. The Equipment success roll returns the
 * minimum (always within the boss threshold); the Item Level roll is
 * identified by its canonical inclusive range [15, 30] and returns the
 * minimum (15). Every other roll returns its minimum, which is a valid
 * low edge for weighted selections and quantity ranges.
 */
class BossLootLevelRandomSource
  implements RandomSource {
  public itemLevelRange:
    { minimum: number; maximum: number } | null =
    null;

  public nextFloat(): number {
    return 0;
  }

  public nextInt(
    minimum: number,
    maximum: number
  ): number {
    if (
      minimum === 15 &&
      maximum === 30
    ) {
      this.itemLevelRange = {
        minimum,
        maximum,
      };

      return minimum;
    }

    return minimum;
  }

  public nextBigInt(
    minimum: bigint,
    _maximum: bigint
  ): bigint {
    return minimum;
  }
}

class InvalidLootRandomSource
  implements RandomSource {
  private integerCall = 0;

  public nextFloat(): number {
    return 0;
  }

  public nextInt(
    minimum: number,
    maximum: number
  ): number {
    this.integerCall += 1;

    if (this.integerCall === 1) {
      return maximum;
    }

    if (this.integerCall === 2) {
      return minimum;
    }

    return maximum + 1;
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

type RollbackState = {
  status: string;
  current_turn: number;
  session_health: number;
  monster_health: number;
  defeat_reason: string | null;
  ended_at: Date | null;
  settled_at: Date | null;
  level: number;
  experience: string;
  gold: string;
  character_health: string;
  total_gold_earned: string;
  total_monsters_killed: string;
  total_deaths: string;
  total_damage_dealt: string;
  total_damage_taken: string;
  highest_physical_hit: string;
  event_count: string;
  log_count: string;
  bestiary_entry_count: string;
  bestiary_statistics_count: string;
  cooldown_count: string;
  blessing_count: string;
  fight_buff_count: string;
  fight_buff_duration: string | null;
};

async function readRollbackState(
  fixture: Fixture
): Promise<RollbackState> {
  const result =
    await testPool.query<RollbackState>(
      `
        SELECT
          cs.status,
          cs.current_turn,
          cs.character_health
            AS session_health,
          cs.monster_health,
          cs.defeat_reason,
          cs.ended_at,
          cs.settled_at,
          character.level,
          character.experience,
          character.gold,
          character.current_health
            AS character_health,
          statistics.total_gold_earned,
          statistics.total_monsters_killed,
          statistics.total_deaths,
          statistics.total_damage_dealt,
          statistics.total_damage_taken,
          statistics.highest_physical_hit,
          (
            SELECT COUNT(*)::text
            FROM combat_session_events
            WHERE combat_session_id =
              cs.combat_session_id
          ) AS event_count,
          (
            SELECT COUNT(*)::text
            FROM combat_logs
            WHERE combat_session_id =
              cs.combat_session_id
          ) AS log_count,
          (
            SELECT COUNT(*)::text
            FROM bestiary_entries
            WHERE character_id =
              cs.character_id
              AND monster_id =
                cs.monster_id
          ) AS bestiary_entry_count,
          (
            SELECT COUNT(*)::text
            FROM bestiary_statistics
            WHERE character_id =
              cs.character_id
              AND monster_id =
                cs.monster_id
          ) AS bestiary_statistics_count,
          (
            SELECT COUNT(*)::text
            FROM character_cooldowns
            WHERE character_id =
              cs.character_id
              AND target_id =
                cs.monster_id
          ) AS cooldown_count,
          (
            SELECT COUNT(*)::text
            FROM character_blessings
            WHERE character_id =
              cs.character_id
          ) AS blessing_count,
          (
            SELECT COUNT(*)::text
            FROM character_buffs
            WHERE character_id =
              cs.character_id
              AND duration_type =
                'Fights'
          ) AS fight_buff_count,
          (
            SELECT
              MAX(
                duration_remaining
              )::text
            FROM character_buffs
            WHERE character_id =
              cs.character_id
              AND duration_type =
                'Fights'
          ) AS fight_buff_duration
        FROM combat_sessions AS cs
        INNER JOIN characters
          AS character
          ON character.character_id =
            cs.character_id
        INNER JOIN character_statistics
          AS statistics
          ON statistics.character_id =
            cs.character_id
        WHERE cs.combat_session_id = $1
      `,
      [
        fixture.combatSessionId,
      ]
    );

  const state = result.rows[0];

  if (!state) {
    throw new Error(
      "Rollback state was not found."
    );
  }

  return state;
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
      "loads authoritative settlement context under transaction locks",
      async () => {
        const fixture =
          await createFixture();

        const context =
          await combatRepository
            .withActionTransaction(
              {
                accountId:
                  fixture.accountId,
                characterId:
                  fixture.characterId,
                observedAt,
              },
              async (transaction) =>
                transaction
                  .loadSettlementContext()
            );

        expect(context).toMatchObject({
          character: {
            characterId:
              fixture.characterId,
            level: 1,
            experience: 0n,
            gold: 0n,
          },
          promoted: false,
          blessed: false,
          rewardBonuses: {
            goldBonusPercent: 0,
            experienceBonusPercent: 0,
          },
          statistics: {
            totalGoldEarned: 0n,
            totalMonstersKilled: 0n,
            totalDeaths: 0n,
            currentNoDeathStreak: 0n,
          },
        });

        expect(
          context.character.resources
            .currentHealth
        ).toBeGreaterThanOrEqual(0);

        expect(
          context.monster.powerScore
        ).toBeGreaterThanOrEqual(0n);

        expect(
          context.monster.cooldownSeconds
        ).toBeGreaterThanOrEqual(0);

        expect(context.events).toEqual([]);
        expect(context.fightBuffs).toEqual([]);
        expect(context.task).toBeNull();
        expect(context.dailyBoss).toBeNull();
      }
    );

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
      "rolls back Combat settlement when Loot generation fails",
      async () => {
        const fixture =
          await createFixture(10);

        const before =
          await readRollbackState(
            fixture
          );

        const service = createService(
          new InvalidLootRandomSource()
        );

        await expect(
          service.execute(
            actionInput(fixture)
          )
        ).rejects.toThrow(
          "Random Item Level is outside the canonical inclusive range."
        );

        const after =
          await readRollbackState(
            fixture
          );

        expect(after).toEqual(before);
        expect(after.status).toBe("Active");
        expect(after.event_count).toBe("0");
        expect(after.log_count).toBe("0");
        expect(after.bestiary_entry_count).toBe("0");
        expect(after.bestiary_statistics_count).toBe("0");
      }
    );

    it(
      "persists Health-depletion Defeat and applies death progression",
      async () => {
        const fixture =
          await createFixture();

        await testPool.query(
          `
            UPDATE characters
            SET
              level = 3,
              experience = 220,
              current_health = 5,
              max_health = 240,
              current_mana = 60,
              max_mana = 65,
              current_energy = 90,
              max_energy = 100
            WHERE character_id = $1
          `,
          [
            fixture.characterId,
          ]
        );

        await testPool.query(
          `
            UPDATE combat_sessions
            SET
              character_health = 5,
              character_maximum_health = 240
            WHERE combat_session_id = $1
          `,
          [
            fixture.combatSessionId,
          ]
        );

        const service = createService(
          new DefeatRandomSource()
        );

        const result =
          await service.execute(
            actionInput(fixture)
          );

        expect(result).toMatchObject({
          status: "Defeat",
          defeatReason:
            "PlayerHealthDepleted",
          currentTurn: 1,
          endedAt: observedAt,
          settledAt: observedAt,

          player: {
            currentHealth: 0,
          },

          settlement: {
            outcome: "Defeat",

            experience: {
              before: 220n,
              awarded: 0n,
              lost: 22n,
              after: 198n,
            },

            gold: {
              awarded: 0n,
            },

            level: {
              before: 3,
              after: 2,
              levelsChanged: -1,
            },

            blessingConsumed: false,
          },
        });

        const stored =
          await testPool.query<{
            status: string;
            defeat_reason: string | null;
            ended_at: Date | null;
            settled_at: Date | null;
            session_health: number;
            character_health: string;
            level: number;
            experience: string;
            total_deaths: string;
            current_no_death_streak: string;
            log_count: string;
          }>(
            `
              SELECT
                cs.status,
                cs.defeat_reason,
                cs.ended_at,
                cs.settled_at,
                cs.character_health
                  AS session_health,
                c.current_health
                  AS character_health,
                c.level,
                c.experience,
                statistics.total_deaths,
                statistics.current_no_death_streak,
                COUNT(logs.combat_log_id)::text
                  AS log_count
              FROM combat_sessions AS cs
              INNER JOIN characters AS c
                ON c.character_id =
                  cs.character_id
              INNER JOIN character_statistics
                AS statistics
                ON statistics.character_id =
                  c.character_id
              LEFT JOIN combat_logs AS logs
                ON logs.combat_session_id =
                  cs.combat_session_id
              WHERE cs.combat_session_id = $1
              GROUP BY
                cs.combat_session_id,
                c.character_id,
                statistics.character_id,
                statistics.total_deaths,
                statistics.current_no_death_streak
            `,
            [
              fixture.combatSessionId,
            ]
          );

        expect(stored.rows[0]).toEqual({
          status: "Defeat",
          defeat_reason:
            "PlayerHealthDepleted",
          ended_at: observedAt,
          settled_at: observedAt,
          session_health: "0",
          character_health: "0",
          level: 2,
          experience: "198",
          total_deaths: "1",
          current_no_death_streak: "0",
          log_count: "1",
        });
      }
    );

    it(
      "retains ten newest final logs without deleting old sessions or events",
      async () => {
        const fixture =
          await createFixture(10);

        const historicalSessionIds:
          string[] = [];

        for (
          let index = 0;
          index < 10;
          index += 1
        ) {
          const endedAt =
            new Date(
              observedAt.getTime() -
              (10 - index) * 60_000
            );

          const startedAt =
            new Date(
              endedAt.getTime() -
              30_000
            );

          const sessionInsert =
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
                  started_at,
                  ended_at,
                  character_maximum_health,
                  character_attack,
                  character_defense,
                  monster_maximum_health,
                  monster_attack,
                  monster_defense,
                  defeat_reason,
                  settled_at,
                  monster_experience_reward,
                  monster_gold_min,
                  monster_gold_max
                )
                SELECT
                  character_id,
                  monster_id,
                  'Victory',
                  1,
                  character_health,
                  character_mana,
                  0,
                  $2,
                  $3,
                  character_maximum_health,
                  character_attack,
                  character_defense,
                  monster_maximum_health,
                  monster_attack,
                  monster_defense,
                  NULL,
                  $3,
                  monster_experience_reward,
                  monster_gold_min,
                  monster_gold_max
                FROM combat_sessions
                WHERE combat_session_id = $1
                RETURNING
                  combat_session_id
              `,
              [
                fixture.combatSessionId,
                startedAt,
                endedAt,
              ]
            );

          const historicalSessionId =
            sessionInsert.rows[0]
              ?.combat_session_id;

          if (!historicalSessionId) {
            throw new Error(
              "Historical combat session was not created."
            );
          }

          historicalSessionIds.push(
            historicalSessionId
          );

          await testPool.query(
            `
              INSERT INTO combat_logs (
                combat_session_id,
                character_id,
                monster_id,
                combat_result,
                turn_count,
                started_at,
                ended_at,
                combat_data_json,
                created_at
              )
              SELECT
                combat_session_id,
                character_id,
                monster_id,
                'Victory',
                1,
                started_at,
                ended_at,
                jsonb_build_object(
                  'version',
                  1,
                  'sequence',
                  $2::integer
                ),
                ended_at
              FROM combat_sessions
              WHERE combat_session_id = $1
            `,
            [
              historicalSessionId,
              index + 1,
            ]
          );
        }

        const oldestSessionId =
          historicalSessionIds[0];

        if (!oldestSessionId) {
          throw new Error(
            "Oldest historical session is missing."
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
            VALUES (
              $1,
              1,
              0,
              'AttackResolved',
              $2::jsonb,
              $3
            )
          `,
          [
            oldestSessionId,
            JSON.stringify({
              type:
                "AttackResolved",
              attacker: "Player",
              defender: "Monster",
              hit: true,
              critical: false,
              damage: 1,
            }),
            new Date(
              observedAt.getTime() -
              10 * 60_000
            ),
          ]
        );

        const service = createService(
          new VictoryRandomSource()
        );

        const result =
          await service.execute(
            actionInput(fixture)
          );

        expect(
          result.settlement
        ).toMatchObject({
          outcome: "Victory",
          finalSummary: {
            combatSessionId:
              fixture.combatSessionId,
            outcome: "Victory",
            endedAt: observedAt,
          },
        });

        const retainedLogs =
          await testPool.query<{
            combat_session_id: string;
            created_at: Date;
            combat_data_json: {
              version?: number;
              outcome?: string;
              sequence?: number;
            };
          }>(
            `
              SELECT
                combat_session_id,
                created_at,
                combat_data_json
              FROM combat_logs
              WHERE character_id = $1
              ORDER BY
                created_at DESC,
                combat_log_id DESC
            `,
            [
              fixture.characterId,
            ]
          );

        expect(
          retainedLogs.rows
        ).toHaveLength(10);

        expect(
          retainedLogs.rows[0]
            ?.combat_session_id
        ).toBe(
          fixture.combatSessionId
        );

        expect(
          retainedLogs.rows[0]
            ?.combat_data_json
        ).toMatchObject({
          version: 1,
          outcome: "Victory",
        });

        expect(
          retainedLogs.rows.some(
            (row) =>
              row.combat_session_id ===
              oldestSessionId
          )
        ).toBe(false);

        const preserved =
          await testPool.query<{
            session_count: string;
            event_count: string;
          }>(
            `
              SELECT
                (
                  SELECT COUNT(*)::text
                  FROM combat_sessions
                  WHERE combat_session_id = $1
                ) AS session_count,
                (
                  SELECT COUNT(*)::text
                  FROM combat_session_events
                  WHERE combat_session_id = $1
                ) AS event_count
            `,
            [
              oldestSessionId,
            ]
          );

        expect(
          preserved.rows[0]
        ).toEqual({
          session_count: "1",
          event_count: "1",
        });

        const totalSessions =
          await testPool.query<{
            count: string;
          }>(
            `
              SELECT COUNT(*)::text
                AS count
              FROM combat_sessions
              WHERE character_id = $1
            `,
            [
              fixture.characterId,
            ]
          );

        expect(
          totalSessions.rows[0]?.count
        ).toBe("11");
      }
    );

    it(
      "isolates retention per character and resolves timestamp ties by log id",
      async () => {
        const primary =
          await createFixture(10);

        const secondary =
          await createFixture(100);

        const tiedCreatedAt =
          new Date(
            observedAt.getTime() -
            60_000
          );

        const primaryLogIds = [
          "00000000-0000-0000-0000-000000000001",
          "00000000-0000-0000-0000-000000000002",
          "00000000-0000-0000-0000-000000000003",
          "00000000-0000-0000-0000-000000000004",
          "00000000-0000-0000-0000-000000000005",
          "00000000-0000-0000-0000-000000000006",
          "00000000-0000-0000-0000-000000000007",
          "00000000-0000-0000-0000-000000000008",
          "00000000-0000-0000-0000-000000000009",
          "00000000-0000-0000-0000-00000000000a",
        ] as const;

        const secondaryLogIds = [
          "00000000-0000-0000-0000-000000000011",
          "00000000-0000-0000-0000-000000000012",
          "00000000-0000-0000-0000-000000000013",
          "00000000-0000-0000-0000-000000000014",
          "00000000-0000-0000-0000-000000000015",
          "00000000-0000-0000-0000-000000000016",
          "00000000-0000-0000-0000-000000000017",
          "00000000-0000-0000-0000-000000000018",
          "00000000-0000-0000-0000-000000000019",
          "00000000-0000-0000-0000-00000000001a",
        ] as const;

        const insertHistoricalLog =
          async (
            fixture: Fixture,
            combatLogId: string,
            sequence: number
          ): Promise<string> => {
            const startedAt =
              new Date(
                tiedCreatedAt.getTime() -
                30_000
              );

            const sessionInsert =
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
                    started_at,
                    ended_at,
                    character_maximum_health,
                    character_attack,
                    character_defense,
                    monster_maximum_health,
                    monster_attack,
                    monster_defense,
                    defeat_reason,
                    settled_at,
                    monster_experience_reward,
                    monster_gold_min,
                    monster_gold_max
                  )
                  SELECT
                    character_id,
                    monster_id,
                    'Victory',
                    1,
                    character_health,
                    character_mana,
                    0,
                    $2,
                    $3,
                    character_maximum_health,
                    character_attack,
                    character_defense,
                    monster_maximum_health,
                    monster_attack,
                    monster_defense,
                    NULL,
                    $3,
                    monster_experience_reward,
                    monster_gold_min,
                    monster_gold_max
                  FROM combat_sessions
                  WHERE combat_session_id = $1
                  RETURNING
                    combat_session_id
                `,
                [
                  fixture.combatSessionId,
                  startedAt,
                  tiedCreatedAt,
                ]
              );

            const sessionId =
              sessionInsert.rows[0]
                ?.combat_session_id;

            if (!sessionId) {
              throw new Error(
                "Historical session was not created."
              );
            }

            await testPool.query(
              `
                INSERT INTO combat_logs (
                  combat_log_id,
                  combat_session_id,
                  character_id,
                  monster_id,
                  combat_result,
                  turn_count,
                  started_at,
                  ended_at,
                  combat_data_json,
                  created_at
                )
                SELECT
                  $2::uuid,
                  combat_session_id,
                  character_id,
                  monster_id,
                  'Victory',
                  1,
                  started_at,
                  ended_at,
                  jsonb_build_object(
                    'version',
                    1,
                    'sequence',
                    $3::integer
                  ),
                  $4
                FROM combat_sessions
                WHERE combat_session_id = $1
              `,
              [
                sessionId,
                combatLogId,
                sequence,
                tiedCreatedAt,
              ]
            );

            return sessionId;
          };

        const primarySessionIds:
          string[] = [];

        for (
          let index = 0;
          index < primaryLogIds.length;
          index += 1
        ) {
          const logId =
            primaryLogIds[index];

          if (!logId) {
            throw new Error(
              "Primary log ID is missing."
            );
          }

          primarySessionIds.push(
            await insertHistoricalLog(
              primary,
              logId,
              index + 1
            )
          );
        }

        for (
          let index = 0;
          index < secondaryLogIds.length;
          index += 1
        ) {
          const logId =
            secondaryLogIds[index];

          if (!logId) {
            throw new Error(
              "Secondary log ID is missing."
            );
          }

          await insertHistoricalLog(
            secondary,
            logId,
            index + 1
          );
        }

        const service = createService(
          new VictoryRandomSource()
        );

        await service.execute(
          actionInput(primary)
        );

        const primaryLogs =
          await testPool.query<{
            combat_log_id: string;
            combat_session_id: string;
          }>(
            `
              SELECT
                combat_log_id,
                combat_session_id
              FROM combat_logs
              WHERE character_id = $1
              ORDER BY
                created_at DESC,
                combat_log_id DESC
            `,
            [
              primary.characterId,
            ]
          );

        expect(
          primaryLogs.rows
        ).toHaveLength(10);

        expect(
          primaryLogs.rows[0]
            ?.combat_session_id
        ).toBe(
          primary.combatSessionId
        );

        expect(
          primaryLogs.rows.some(
            (row) =>
              row.combat_log_id ===
              primaryLogIds[0]
          )
        ).toBe(false);

        for (
          const retainedId of
          primaryLogIds.slice(1)
        ) {
          expect(
            primaryLogs.rows.some(
              (row) =>
                row.combat_log_id ===
                retainedId
            )
          ).toBe(true);
        }

        const secondaryLogs =
          await testPool.query<{
            combat_log_id: string;
          }>(
            `
              SELECT combat_log_id
              FROM combat_logs
              WHERE character_id = $1
              ORDER BY
                created_at DESC,
                combat_log_id DESC
            `,
            [
              secondary.characterId,
            ]
          );

        expect(
          secondaryLogs.rows
        ).toHaveLength(10);

        expect(
          secondaryLogs.rows.map(
            (row) =>
              row.combat_log_id
          )
        ).toEqual(
          [...secondaryLogIds].reverse()
        );

        const deletedLogSession =
          primarySessionIds[0];

        if (!deletedLogSession) {
          throw new Error(
            "Deleted log session is missing."
          );
        }

        const preservedSession =
          await testPool.query<{
            count: string;
          }>(
            `
              SELECT COUNT(*)::text
                AS count
              FROM combat_sessions
              WHERE combat_session_id = $1
            `,
            [
              deletedLogSession,
            ]
          );

        expect(
          preservedSession.rows[0]
            ?.count
        ).toBe("1");
      }
    );

    it(
      "persists turn-limit Defeat for a Normal Monster",
      async () => {
        const fixture =
          await createFixture();

        await testPool.query(
          `
            UPDATE combat_sessions
            SET current_turn = 100
            WHERE combat_session_id = $1
          `,
          [
            fixture.combatSessionId,
          ]
        );

        const service = createService(
          new MissRandomSource()
        );

        const result =
          await service.execute({
            ...actionInput(fixture),
            expectedTurn: 100,
          });

        expect(result).toMatchObject({
          status: "Defeat",
          currentTurn: 100,
          defeatReason:
            "TurnLimitExceeded",
          endedAt: observedAt,
        });

        expect(result.settlement).toMatchObject({
          outcome: "Defeat",
        });

        const stored =
          await testPool.query<{
            status: string;
            current_turn: number;
            defeat_reason:
              string | null;
            ended_at:
              Date | null;
          }>(
            `
              SELECT
                status,
                current_turn,
                defeat_reason,
                ended_at
              FROM combat_sessions
              WHERE combat_session_id = $1
            `,
            [
              fixture.combatSessionId,
            ]
          );

        expect(stored.rows[0]).toMatchObject({
          status: "Defeat",
          current_turn: 100,
          defeat_reason:
            "TurnLimitExceeded",
          ended_at: observedAt,
        });
      }
    );

    it(
      "persists Mini Boss Victory",
      async () => {
        const fixture =
          await createFixture(10);

        const miniBoss =
          await testPool.query<{
            monster_id: string;
          }>(
            `
              SELECT boss.monster_id
              FROM bosses AS boss
              WHERE boss.boss_type =
                'MiniBoss'
              ORDER BY boss.boss_id
              LIMIT 1
            `
          );

        const miniBossId =
          miniBoss.rows[0]
            ?.monster_id;

        if (!miniBossId) {
          throw new Error(
            "Mini Boss fixture was not found."
          );
        }

        await testPool.query(
          `
            UPDATE combat_sessions
            SET monster_id = $2
            WHERE combat_session_id = $1
          `,
          [
            fixture.combatSessionId,
            miniBossId,
          ]
        );

        const service = createService(
          new VictoryRandomSource()
        );

        const result =
          await service.execute(
            actionInput(fixture)
          );

        expect(result).toMatchObject({
          status: "Victory",
          monsterId: miniBossId,
          monster: {
            currentHealth: 0,
          },
          settlement: {
            outcome: "Victory",
          },
        });

        const stored =
          await testPool.query<{
            status: string;
            monster_id: string;
          }>(
            `
              SELECT
                status,
                monster_id
              FROM combat_sessions
              WHERE combat_session_id = $1
            `,
            [
              fixture.combatSessionId,
            ]
          );

                expect(stored.rows[0]).toEqual({
          status: "Victory",
          monster_id: miniBossId,
        });
      }
    );

    it(
      "applies the boss loot level bonus to the rolled Item Level",
      async () => {
        const fixture =
          await createFixture(10);

        const boss = await testPool.query<{
          boss_id: string;
          monster_id: string;
          level: number;
          loot_level_bonus: number;
        }>(
          `
            SELECT
              b.boss_id,
              b.monster_id,
              m.level,
              b.loot_level_bonus
            FROM bosses AS b
            INNER JOIN monsters AS m
              ON m.monster_id = b.monster_id
            INNER JOIN loot_tables AS lt
              ON lt.monster_id = b.monster_id
              AND lt.is_enabled = TRUE
            WHERE b.boss_type = 'MiniBoss'
            ORDER BY b.boss_id
            LIMIT 1
          `
        );

        const bossRow = boss.rows[0];

        if (!bossRow) {
          throw new Error(
            "Boss loot level fixture was not found."
          );
        }

        await testPool.query(
          `
            UPDATE combat_sessions
            SET monster_id = $2
            WHERE combat_session_id = $1
          `,
          [
            fixture.combatSessionId,
            bossRow.monster_id,
          ]
        );

        const randomSource =
          new BossLootLevelRandomSource();

        try {
          // Boss level 20 with loot level bonus 5 yields the canonical
          // Item Level range [15, 30] (effective loot level 25).
          await testPool.query(
            `
              UPDATE monsters
              SET level = 20
              WHERE monster_id = $1
            `,
            [bossRow.monster_id]
          );

          await testPool.query(
            `
              UPDATE bosses
              SET loot_level_bonus = 5
              WHERE boss_id = $1
            `,
            [bossRow.boss_id]
          );

          const service =
            createService(randomSource);

          const result =
            await service.execute(
              actionInput(fixture)
            );

          expect(result).toMatchObject({
            status: "Victory",
            monsterId: bossRow.monster_id,
            settlement: {
              outcome: "Victory",
            },
          });

          if (
            result.loot === null ||
            result.loot.regularEquipment
              .generated === null
          ) {
            throw new Error(
              "Expected a generated regular Equipment drop."
            );
          }

          const generated =
            result.loot.regularEquipment
              .generated;

          const persisted =
            result.loot.regularEquipment
              .persisted;

          if (persisted === null) {
            throw new Error(
              "Expected the regular Equipment drop to be persisted."
            );
          }

          // Primary assertion: the boss loot level bonus reached the
          // canonical Item Level roll.
          expect(generated.itemLevel).toBe(15);

          expect(generated.requiredLevel).toBe(15);

          // The pinned range is identified by the canonical bounds, not
          // by global call ordering.
          expect(
            randomSource.itemLevelRange
          ).toEqual({
            minimum: 15,
            maximum: 30,
          });

          // The persisted Item rows keep the same canonical Item Level.
          const storedItem =
            await testPool.query<{
              item_level: number;
              required_level: number;
            }>(
              `
                SELECT
                  item_level,
                  required_level
                FROM items
                WHERE item_id = $1
              `,
              [persisted.itemId]
            );

          expect(
            storedItem.rows[0]
          ).toEqual({
            item_level: 15,
            required_level: 15,
          });
        } finally {
          await testPool.query(
            `
              UPDATE monsters
              SET level = $2
              WHERE monster_id = $1
            `,
            [
              bossRow.monster_id,
              bossRow.level,
            ]
          );

          await testPool.query(
            `
              UPDATE bosses
              SET loot_level_bonus = $2
              WHERE boss_id = $1
            `,
            [
              bossRow.boss_id,
              bossRow.loot_level_bonus,
            ]
          );
        }
      }
    );

    it(
      "persists Mini Boss Defeat",
      async () => {
        const fixture =
          await createFixture();

        const miniBoss =
          await testPool.query<{
            monster_id: string;
          }>(
            `
              SELECT boss.monster_id
              FROM bosses AS boss
              WHERE boss.boss_type =
                'MiniBoss'
              ORDER BY boss.boss_id
              LIMIT 1
            `
          );

        const miniBossId =
          miniBoss.rows[0]
            ?.monster_id;

        if (!miniBossId) {
          throw new Error(
            "Mini Boss fixture was not found."
          );
        }

        await testPool.query(
          `
            UPDATE characters
            SET current_health = 5
            WHERE character_id = $1
          `,
          [
            fixture.characterId,
          ]
        );

        await testPool.query(
          `
            UPDATE combat_sessions
            SET
              monster_id = $2,
              character_health = 5
            WHERE combat_session_id = $1
          `,
          [
            fixture.combatSessionId,
            miniBossId,
          ]
        );

        const service = createService(
          new DefeatRandomSource()
        );

        const result =
          await service.execute(
            actionInput(fixture)
          );

        expect(result).toMatchObject({
          status: "Defeat",
          monsterId: miniBossId,
          defeatReason:
            "PlayerHealthDepleted",
          player: {
            currentHealth: 0,
          },
          settlement: {
            outcome: "Defeat",
          },
        });

        const stored =
          await testPool.query<{
            status: string;
            monster_id: string;
            defeat_reason:
              string | null;
          }>(
            `
              SELECT
                status,
                monster_id,
                defeat_reason
              FROM combat_sessions
              WHERE combat_session_id = $1
            `,
            [
              fixture.combatSessionId,
            ]
          );

        expect(stored.rows[0]).toEqual({
          status: "Defeat",
          monster_id: miniBossId,
          defeat_reason:
            "PlayerHealthDepleted",
        });
      }
    );

    it(
      "persists Task progress monster Victory",
      async () => {
        const fixture =
          await createFixture(10);

        const task =
          await testPool.query<{
            progress_monster_id: string;
            required_kills: string;
          }>(
            `
              SELECT
                task.monster_id
                  AS progress_monster_id,
                task.required_kills::text
                  AS required_kills
              FROM monster_tasks AS task
              INNER JOIN bosses AS boss
                ON boss.boss_id =
                  task.boss_id
              WHERE boss.boss_type =
                'TaskBoss'
              ORDER BY
                task.monster_task_id
              LIMIT 1
            `
          );

        const taskRow =
          task.rows[0];

        if (!taskRow) {
          throw new Error(
            "Task progress fixture was not found."
          );
        }

        const requiredKills =
          BigInt(taskRow.required_kills);

        await testPool.query(
          `
            UPDATE combat_sessions
            SET monster_id = $2
            WHERE combat_session_id = $1
          `,
          [
            fixture.combatSessionId,
            taskRow.progress_monster_id,
          ]
        );

        await testPool.query(
          `
            INSERT INTO bestiary_statistics (
              character_id,
              monster_id,
              kill_count,
              first_kill_at,
              last_kill_at,
              task_progress,
              task_status,
              created_at,
              updated_at
            )
            VALUES (
              $1,
              $2,
              1,
              $3,
              $3,
              $4,
              'ACTIVE',
              $3,
              $3
            )
          `,
          [
            fixture.characterId,
            taskRow.progress_monster_id,
            new Date(
              observedAt.getTime() -
              60_000
            ),
            (
              requiredKills -
              1n
            ).toString(),
          ]
        );

        const service = createService(
          new VictoryRandomSource()
        );

        const result =
          await service.execute(
            actionInput(fixture)
          );

        expect(result).toMatchObject({
          status: "Victory",
          monsterId:
            taskRow.progress_monster_id,
          settlement: {
            outcome: "Victory",
            taskBoss: {
              progressed: true,
              status: "UNLOCKED",
            },
          },
        });

        const progress =
          await testPool.query<{
            task_progress: string;
            task_status: string;
          }>(
            `
              SELECT
                task_progress,
                task_status
              FROM bestiary_statistics
              WHERE character_id = $1
                AND monster_id = $2
            `,
            [
              fixture.characterId,
              taskRow.progress_monster_id,
            ]
          );

        expect(progress.rows[0]).toEqual({
          task_progress:
            requiredKills.toString(),
          task_status: "UNLOCKED",
        });
      }
    );

    it(
      "persists Task Boss Victory",
      async () => {
        const fixture =
          await createFixture(10);

        const task =
          await testPool.query<{
            progress_monster_id: string;
            boss_monster_id: string;
            required_kills: string;
          }>(
            `
              SELECT
                task.monster_id
                  AS progress_monster_id,
                boss.monster_id
                  AS boss_monster_id,
                task.required_kills::text
                  AS required_kills
              FROM monster_tasks AS task
              INNER JOIN bosses AS boss
                ON boss.boss_id =
                  task.boss_id
              WHERE boss.boss_type =
                'TaskBoss'
              ORDER BY
                task.monster_task_id
              LIMIT 1
            `
          );

        const taskRow =
          task.rows[0];

        if (!taskRow) {
          throw new Error(
            "Task Boss fixture was not found."
          );
        }

        await testPool.query(
          `
            UPDATE combat_sessions
            SET monster_id = $2
            WHERE combat_session_id = $1
          `,
          [
            fixture.combatSessionId,
            taskRow.boss_monster_id,
          ]
        );

        await testPool.query(
          `
            INSERT INTO bestiary_statistics (
              character_id,
              monster_id,
              kill_count,
              first_kill_at,
              last_kill_at,
              task_progress,
              task_status,
              created_at,
              updated_at
            )
            VALUES (
              $1,
              $2,
              10,
              $3,
              $3,
              $4,
              'UNLOCKED',
              $3,
              $3
            )
          `,
          [
            fixture.characterId,
            taskRow.progress_monster_id,
            new Date(
              observedAt.getTime() -
              60_000
            ),
            taskRow.required_kills,
          ]
        );

        const service = createService(
          new VictoryRandomSource()
        );

        const result =
          await service.execute(
            actionInput(fixture)
          );

        expect(result).toMatchObject({
          status: "Victory",
          monsterId:
            taskRow.boss_monster_id,
          settlement: {
            outcome: "Victory",
            taskBoss: {
              progressed: true,
              status:
                "WAITING_FOR_REUNLOCK",
            },
          },
        });

        const progress =
          await testPool.query<{
            task_progress: string;
            task_status: string;
          }>(
            `
              SELECT
                task_progress,
                task_status
              FROM bestiary_statistics
              WHERE character_id = $1
                AND monster_id = $2
            `,
            [
              fixture.characterId,
              taskRow.progress_monster_id,
            ]
          );

        expect(progress.rows[0]).toEqual({
          task_progress:
            taskRow.required_kills,
          task_status:
            "WAITING_FOR_REUNLOCK",
        });
      }
    );

    it(
      "rolls back every main Victory settlement phase",
      async () => {
        const points:
          CombatSettlementFailurePoint[] = [
            "victory.character",
            "victory.statistics",
            "victory.core",
            "victory.bestiary",
            "victory.consequences",
            "victory.finalLog",
            "victory.retention",
            "victory.terminalSession",
          ];

        for (const point of points) {
          const fixture =
            await createFixture(10);

          const before =
            await readRollbackState(
              fixture
            );

          const failure =
            new Error(
              `Injected failure at ${point}.`
            );

          const repository =
            new PostgresCombatSessionRepository(
              testPool,
              {
                settlementFailureInjector:
                  async (currentPoint) => {
                    if (
                      currentPoint === point
                    ) {
                      throw failure;
                    }
                  },
              }
            );

          const service =
            new ResolveCombatActionService(
              repository,
              new VictoryRandomSource(),
              clock
            );

          await expect(
            service.execute(
              actionInput(fixture)
            )
          ).rejects.toBe(failure);

          const after =
            await readRollbackState(
              fixture
            );

          expect(
            after,
            `Rollback mismatch at ${point}`
          ).toEqual(before);
        }
      }
    );

    it(
      "rolls back every main Defeat settlement phase",
      async () => {
        const points:
          CombatSettlementFailurePoint[] = [
            "defeat.character",
            "defeat.statistics",
            "defeat.core",
            "defeat.finalLog",
            "defeat.retention",
            "defeat.terminalSession",
          ];

        for (const point of points) {
          const fixture =
            await createFixture();

          await testPool.query(
            `
              UPDATE characters
              SET
                level = 3,
                experience = 220,
                current_health = 5,
                max_health = 240,
                current_mana = 60,
                max_mana = 65,
                current_energy = 90,
                max_energy = 100
              WHERE character_id = $1
            `,
            [
              fixture.characterId,
            ]
          );

          await testPool.query(
            `
              UPDATE combat_sessions
              SET
                character_health = 5,
                character_maximum_health =
                  240
              WHERE combat_session_id = $1
            `,
            [
              fixture.combatSessionId,
            ]
          );

          const before =
            await readRollbackState(
              fixture
            );

          const failure =
            new Error(
              `Injected failure at ${point}.`
            );

          const repository =
            new PostgresCombatSessionRepository(
              testPool,
              {
                settlementFailureInjector:
                  async (currentPoint) => {
                    if (
                      currentPoint === point
                    ) {
                      throw failure;
                    }
                  },
              }
            );

          const service =
            new ResolveCombatActionService(
              repository,
              new DefeatRandomSource(),
              clock
            );

          await expect(
            service.execute(
              actionInput(fixture)
            )
          ).rejects.toBe(failure);

          const after =
            await readRollbackState(
              fixture
            );

          expect(
            after,
            `Rollback mismatch at ${point}`
          ).toEqual(before);
        }
      }
    );

    it(
      "rolls back Victory when cooldown persistence is followed by failure",
      async () => {
        const fixture =
          await createFixture(10);

        const monster =
          await testPool.query<{
            monster_id: string;
            cooldown_seconds: number;
          }>(
            `
              SELECT
                monster.monster_id,
                monster.cooldown_seconds
              FROM combat_sessions
                AS session
              INNER JOIN monsters
                AS monster
                ON monster.monster_id =
                  session.monster_id
              WHERE
                session.combat_session_id =
                  $1
            `,
            [
              fixture.combatSessionId,
            ]
          );

        const monsterRow =
          monster.rows[0];

        if (!monsterRow) {
          throw new Error(
            "Cooldown rollback monster was not found."
          );
        }

        try {
          await testPool.query(
            `
              UPDATE monsters
              SET cooldown_seconds = 30
              WHERE monster_id = $1
            `,
            [
              monsterRow.monster_id,
            ]
          );

          const before =
            await readRollbackState(
              fixture
            );

          expect(
            before.cooldown_count
          ).toBe("0");

          const failure =
            new Error(
              "Injected failure at victory.cooldown."
            );

          const repository =
            new PostgresCombatSessionRepository(
              testPool,
              {
                settlementFailureInjector:
                  async (point) => {
                    if (
                      point ===
                      "victory.cooldown"
                    ) {
                      throw failure;
                    }
                  },
              }
            );

          const service =
            new ResolveCombatActionService(
              repository,
              new VictoryRandomSource(),
              clock
            );

          await expect(
            service.execute(
              actionInput(fixture)
            )
          ).rejects.toBe(failure);

          const after =
            await readRollbackState(
              fixture
            );

          expect(after).toEqual(before);
          expect(
            after.cooldown_count
          ).toBe("0");
          expect(after.status).toBe(
            "Active"
          );
          expect(after.log_count).toBe(
            "0"
          );
          expect(after.event_count).toBe(
            "0"
          );
        }
        finally {
          await testPool.query(
            `
              UPDATE monsters
              SET cooldown_seconds = $2
              WHERE monster_id = $1
            `,
            [
              monsterRow.monster_id,
              monsterRow.cooldown_seconds,
            ]
          );
        }
      }
    );

    it(
      "rolls back Victory fight-buff consumption",
      async () => {
        const fixture =
          await createFixture(10);

        await testPool.query(
          `
            INSERT INTO character_buffs (
              character_id,
              buff_type,
              buff_source_type,
              value,
              duration_type,
              duration_remaining,
              is_positive,
              applied_at,
              expires_at
            )
            VALUES (
              $1,
              'ExperienceBoost',
              'System',
              4.5,
              'Fights',
              1,
              TRUE,
              $2,
              NULL
            )
          `,
          [
            fixture.characterId,
            new Date(
              observedAt.getTime() -
              60_000
            ),
          ]
        );

        const before =
          await readRollbackState(
            fixture
          );

        expect(
          before.fight_buff_count
        ).toBe("1");

        expect(
          before.fight_buff_duration
        ).toBe("1");

        const failure =
          new Error(
            "Injected failure at victory.fightBuff."
          );

        const repository =
          new PostgresCombatSessionRepository(
            testPool,
            {
              settlementFailureInjector:
                async (point) => {
                  if (
                    point ===
                    "victory.fightBuff"
                  ) {
                    throw failure;
                  }
                },
            }
          );

        const service =
          new ResolveCombatActionService(
            repository,
            new VictoryRandomSource(),
            clock
          );

        await expect(
          service.execute(
            actionInput(fixture)
          )
        ).rejects.toBe(failure);

        const after =
          await readRollbackState(
            fixture
          );

        expect(after).toEqual(before);

        expect(
          after.fight_buff_duration
        ).toBe("1");

        expect(after.status).toBe(
          "Active"
        );

        expect(after.log_count).toBe(
          "0"
        );

        expect(after.event_count).toBe(
          "0"
        );
      }
    );

    it(
      "rolls back conditional Defeat Blessing and fight-buff phases",
      async () => {
        const points:
          CombatSettlementFailurePoint[] = [
            "defeat.blessing",
            "defeat.fightBuff",
          ];

        for (const point of points) {
          const fixture =
            await createFixture();

          await testPool.query(
            `
              UPDATE characters
              SET
                level = 3,
                experience = 220,
                current_health = 5,
                max_health = 240,
                current_mana = 60,
                max_mana = 65,
                current_energy = 90,
                max_energy = 100
              WHERE character_id = $1
            `,
            [
              fixture.characterId,
            ]
          );

          await testPool.query(
            `
              UPDATE combat_sessions
              SET
                character_health = 5,
                character_maximum_health =
                  240
              WHERE combat_session_id = $1
            `,
            [
              fixture.combatSessionId,
            ]
          );

          await testPool.query(
            `
              INSERT INTO character_blessings (
                character_id,
                activated_at
              )
              VALUES ($1, $2)
            `,
            [
              fixture.characterId,
              new Date(
                observedAt.getTime() -
                60_000
              ),
            ]
          );

          await testPool.query(
            `
              INSERT INTO character_buffs (
                character_id,
                buff_type,
                buff_source_type,
                value,
                duration_type,
                duration_remaining,
                is_positive,
                applied_at,
                expires_at
              )
              VALUES (
                $1,
                'GoldBoost',
                'System',
                3.5,
                'Fights',
                1,
                TRUE,
                $2,
                NULL
              )
            `,
            [
              fixture.characterId,
              new Date(
                observedAt.getTime() -
                60_000
              ),
            ]
          );

          const before =
            await readRollbackState(
              fixture
            );

          expect(
            before.blessing_count
          ).toBe("1");

          expect(
            before.fight_buff_count
          ).toBe("1");

          expect(
            before.fight_buff_duration
        ).toBe("1");

          const failure =
            new Error(
              `Injected failure at ${point}.`
            );

          const repository =
            new PostgresCombatSessionRepository(
              testPool,
              {
                settlementFailureInjector:
                  async (currentPoint) => {
                    if (
                      currentPoint === point
                    ) {
                      throw failure;
                    }
                  },
              }
            );

          const service =
            new ResolveCombatActionService(
              repository,
              new DefeatRandomSource(),
              clock
            );

          await expect(
            service.execute(
              actionInput(fixture)
            )
          ).rejects.toBe(failure);

          const after =
            await readRollbackState(
              fixture
            );

          expect(
            after,
            `Rollback mismatch at ${point}`
          ).toEqual(before);

          expect(
            after.blessing_count
          ).toBe("1");

          expect(
            after.fight_buff_duration
        ).toBe("1");

          expect(after.status).toBe(
            "Active"
          );

          expect(after.log_count).toBe(
            "0"
          );

          expect(after.event_count).toBe(
            "0"
          );
        }
      }
    );

    it(
      "rolls back Task Boss progression after Victory failure",
      async () => {
        const fixture =
          await createFixture(10);

        const task =
          await testPool.query<{
            progress_monster_id: string;
            boss_monster_id: string;
          }>(
            `
              SELECT
                task.monster_id
                  AS progress_monster_id,
                boss.monster_id
                  AS boss_monster_id
              FROM monster_tasks AS task
              INNER JOIN bosses AS boss
                ON boss.boss_id =
                  task.boss_id
              WHERE boss.boss_type =
                'TaskBoss'
              ORDER BY
                task.monster_task_id
              LIMIT 1
            `
          );

        const taskRow =
          task.rows[0];

        if (!taskRow) {
          throw new Error(
            "Task Boss rollback fixture was not found."
          );
        }

        await testPool.query(
          `
            UPDATE combat_sessions
            SET monster_id = $2
            WHERE combat_session_id = $1
          `,
          [
            fixture.combatSessionId,
            taskRow.boss_monster_id,
          ]
        );

        await testPool.query(
          `
            INSERT INTO bestiary_statistics (
              character_id,
              monster_id,
              kill_count,
              first_kill_at,
              last_kill_at,
              task_progress,
              task_status,
              created_at,
              updated_at
            )
            VALUES (
              $1,
              $2,
              10,
              $3,
              $3,
              10,
              'UNLOCKED',
              $3,
              $3
            )
            ON CONFLICT (
              character_id,
              monster_id
            )
            DO UPDATE
            SET
              task_progress = 10,
              task_status = 'UNLOCKED',
              updated_at = EXCLUDED.updated_at
          `,
          [
            fixture.characterId,
            taskRow.progress_monster_id,
            new Date(
              observedAt.getTime() -
              60_000
            ),
          ]
        );

        const readTaskState =
          async (): Promise<{
            task_progress: string;
            task_status: string;
          }> => {
            const result =
              await testPool.query<{
                task_progress: string;
                task_status: string;
              }>(
                `
                  SELECT
                    task_progress,
                    task_status
                  FROM bestiary_statistics
                  WHERE character_id = $1
                    AND monster_id = $2
                `,
                [
                  fixture.characterId,
                  taskRow.progress_monster_id,
                ]
              );

            const row = result.rows[0];

            if (!row) {
              throw new Error(
                "Task Boss progress state was not found."
              );
            }

            return row;
          };

        const beforeSession =
          await readRollbackState(
            fixture
          );

        const beforeTask =
          await readTaskState();

        expect(beforeTask).toEqual({
          task_progress: "10",
          task_status: "UNLOCKED",
        });

        const failure =
          new Error(
            "Injected failure at victory.task."
          );

        const repository =
          new PostgresCombatSessionRepository(
            testPool,
            {
              settlementFailureInjector:
                async (point) => {
                  if (
                    point ===
                    "victory.task"
                  ) {
                    throw failure;
                  }
                },
            }
          );

        const service =
          new ResolveCombatActionService(
            repository,
            new VictoryRandomSource(),
            clock
          );

        await expect(
          service.execute(
            actionInput(fixture)
          )
        ).rejects.toBe(failure);

        const afterSession =
          await readRollbackState(
            fixture
          );

        const afterTask =
          await readTaskState();

        expect(afterSession).toEqual(
          beforeSession
        );

        expect(afterTask).toEqual(
          beforeTask
        );

        expect(
          afterTask.task_status
        ).toBe("UNLOCKED");

        expect(afterSession.status).toBe(
          "Active"
        );

        expect(
          afterSession.log_count
        ).toBe("0");

        expect(
          afterSession.event_count
        ).toBe("0");
      }
    );

    it(
      "persists Daily Boss Victory",
      async () => {
        const fixture =
          await createFixture(10);

        const temporaryMonsterIds:
          string[] = [];

        const temporaryBossIds:
          string[] = [];

        const temporaryDefinitionIds:
          string[] = [];

        const createSupportDefinition =
          async (
            tier: number
          ): Promise<{
            daily_boss_definition_id:
              string;
            monster_id: string;
            tier: number;
          }> => {
            const suffix =
              randomUUID().replaceAll(
                "-",
                ""
              );

            const monster =
              await testPool.query<{
                monster_id: string;
              }>(
                `
                  INSERT INTO monsters (
                    monster_family_id,
                    name,
                    description,
                    artwork,
                    monster_type,
                    level,
                    health,
                    attack,
                    defense,
                    spell_power_percent,
                    cooldown_seconds,
                    ability_chance_percent,
                    gold_min,
                    gold_max,
                    loot_level_modifier,
                    power_score,
                    code,
                    energy_cost,
                    experience_reward
                  )
                  SELECT
                    monster_family_id,
                    $1,
                    description,
                    artwork,
                    'DailyBoss',
                    level,
                    health,
                    attack,
                    defense,
                    spell_power_percent,
                    0,
                    ability_chance_percent,
                    gold_min,
                    gold_max,
                    loot_level_modifier,
                    power_score,
                    $2,
                    energy_cost,
                    experience_reward
                  FROM monsters
                  WHERE code =
                    'dev_monster_10'
                  RETURNING monster_id
                `,
                [
                  `P14 Daily Support ${tier} ${suffix}`,
                  `p14_daily_${tier}_${suffix}`,
                ]
              );

            const monsterId =
              monster.rows[0]
                ?.monster_id;

            if (!monsterId) {
              throw new Error(
                "Temporary Daily Boss monster was not created."
              );
            }

            temporaryMonsterIds.push(
              monsterId
            );

            const boss =
              await testPool.query<{
                boss_id: string;
              }>(
                `
                  INSERT INTO bosses (
                    monster_id,
                    boss_type
                  )
                  VALUES (
                    $1,
                    'DailyBoss'
                  )
                  RETURNING boss_id
                `,
                [
                  monsterId,
                ]
              );

            const bossId =
              boss.rows[0]?.boss_id;

            if (!bossId) {
              throw new Error(
                "Temporary Daily Boss record was not created."
              );
            }

            temporaryBossIds.push(
              bossId
            );

            const definition =
              await testPool.query<{
                daily_boss_definition_id:
                  string;
              }>(
                `
                  INSERT INTO
                    daily_boss_definitions (
                      boss_id,
                      tier,
                      recommended_level,
                      attempts_per_day
                    )
                  VALUES (
                    $1,
                    $2,
                    1,
                    3
                  )
                  RETURNING
                    daily_boss_definition_id
                `,
                [
                  bossId,
                  tier,
                ]
              );

            const definitionId =
              definition.rows[0]
                ?.daily_boss_definition_id;

            if (!definitionId) {
              throw new Error(
                "Temporary Daily Boss definition was not created."
              );
            }

            temporaryDefinitionIds.push(
              definitionId
            );

            return {
              daily_boss_definition_id:
                definitionId,
              monster_id: monsterId,
              tier,
            };
          };

        const existingDefinition =
          await testPool.query<{
            daily_boss_definition_id:
              string;
            monster_id: string;
            tier: number;
          }>(
            `
              SELECT
                definition
                  .daily_boss_definition_id,
                boss.monster_id,
                definition.tier
              FROM daily_boss_definitions
                AS definition
              INNER JOIN bosses AS boss
                ON boss.boss_id =
                  definition.boss_id
              WHERE boss.boss_type =
                'DailyBoss'
              ORDER BY
                definition
                  .daily_boss_definition_id
              LIMIT 1
            `
          );

        const target =
          existingDefinition.rows[0];

        if (!target) {
          throw new Error(
            "Seeded Daily Boss definition was not found."
          );
        }

        const tierTwo =
          await createSupportDefinition(
            2
          );

        const tierThree =
          await createSupportDefinition(
            3
          );

        const rotation =
          await testPool.query<{
            daily_boss_rotation_id: string;
          }>(
            `
              INSERT INTO daily_boss_rotation (
                tier_1_boss_id,
                tier_2_boss_id,
                tier_3_boss_id,
                reset_timestamp,
                created_at
              )
              VALUES (
                $1,
                $2,
                $3,
                $4,
                $5
              )
              RETURNING
                daily_boss_rotation_id
            `,
            [
              target
                .daily_boss_definition_id,
              tierTwo
                .daily_boss_definition_id,
              tierThree
                .daily_boss_definition_id,
              new Date(
                observedAt.getTime() +
                60 * 60 * 1000
              ),
              new Date(
                observedAt.getTime() -
                60 * 60 * 1000
              ),
            ]
          );

        const rotationId =
          rotation.rows[0]
            ?.daily_boss_rotation_id;

        if (!rotationId) {
          throw new Error(
            "Daily Boss rollback rotation was not created."
          );
        }

        try {
          await testPool.query(
            `
              UPDATE combat_sessions
              SET monster_id = $2
              WHERE combat_session_id = $1
            `,
            [
              fixture.combatSessionId,
              target.monster_id,
            ]
          );

          await testPool.query(
            `
              INSERT INTO
                character_daily_boss_progress (
                  character_id,
                  daily_boss_definition_id,
                  daily_boss_rotation_id,
                  attempts_used_in_rotation,
                  total_attempts,
                  total_victories,
                  last_attempt_at,
                  last_victory_at,
                  highest_tier_defeated
                )
              VALUES (
                $1,
                $2,
                $3,
                1,
                1,
                0,
                $4,
                NULL,
                NULL
              )
            `,
            [
              fixture.characterId,
              target
                .daily_boss_definition_id,
              rotationId,
              observedAt,
            ]
          );

          const readDailyState =
            async (): Promise<{
              attempts_used_in_rotation:
                number;
              total_attempts: string;
              total_victories: string;
              last_attempt_at:
                Date | null;
              last_victory_at:
                Date | null;
              highest_tier_defeated:
                number | null;
            }> => {
              const result =
                await testPool.query<{
                  attempts_used_in_rotation:
                    number;
                  total_attempts: string;
                  total_victories: string;
                  last_attempt_at:
                    Date | null;
                  last_victory_at:
                    Date | null;
                  highest_tier_defeated:
                    number | null;
                }>(
                  `
                    SELECT
                      attempts_used_in_rotation,
                      total_attempts,
                      total_victories,
                      last_attempt_at,
                      last_victory_at,
                      highest_tier_defeated
                    FROM
                      character_daily_boss_progress
                    WHERE character_id = $1
                      AND
                        daily_boss_definition_id =
                          $2
                      AND
                        daily_boss_rotation_id =
                          $3
                  `,
                  [
                    fixture.characterId,
                    target
                      .daily_boss_definition_id,
                    rotationId,
                  ]
                );

              const row =
                result.rows[0];

              if (!row) {
                throw new Error(
                  "Daily Boss progress state was not found."
                );
              }

              return row;
            };

          const beforeSession =
            await readRollbackState(
              fixture
            );

          const beforeDaily =
            await readDailyState();

          expect(
            beforeDaily.total_victories
          ).toBe("0");

          expect(
            beforeDaily
              .highest_tier_defeated
          ).toBeNull();

          const service =
            createService(
              new VictoryRandomSource()
            );

          const result =
            await service.execute(
              actionInput(fixture)
            );

          expect(result).toMatchObject({
            status: "Victory",
            monsterId:
              target.monster_id,
            settlement: {
              outcome: "Victory",
            },
          });

          const afterSession =
            await readRollbackState(
              fixture
            );

          const afterDaily =
            await readDailyState();

          expect(afterSession.status).toBe(
            "Victory"
          );

          expect(
            afterSession.log_count
          ).toBe("1");

          expect(
            afterSession.event_count
          ).not.toBe("0");

          expect(
            afterDaily
              .attempts_used_in_rotation
          ).toBe(
            beforeDaily
              .attempts_used_in_rotation
          );

          expect(
            afterDaily.total_attempts
          ).toBe(
            beforeDaily.total_attempts
          );

          expect(
            afterDaily.total_victories
          ).toBe(
            (
              BigInt(
                beforeDaily
                  .total_victories
              ) +
              1n
            ).toString()
          );

          expect(
            afterDaily.last_attempt_at
          ).toEqual(
            beforeDaily.last_attempt_at
          );

          expect(
            afterDaily.last_victory_at
          ).toEqual(observedAt);

          expect(
            afterDaily
              .highest_tier_defeated
          ).toBe(target.tier);
        }
        finally {
          await testPool.query(
            `
              DELETE FROM
                character_daily_boss_progress
              WHERE character_id = $1
                AND
                  daily_boss_definition_id =
                    $2
                AND
                  daily_boss_rotation_id =
                    $3
            `,
            [
              fixture.characterId,
              target
                .daily_boss_definition_id,
              rotationId,
            ]
          );

          await testPool.query(
            `
              DELETE FROM
                daily_boss_rotation
              WHERE
                daily_boss_rotation_id =
                  $1
            `,
            [
              rotationId,
            ]
          );

          if (
            temporaryDefinitionIds
              .length > 0
          ) {
            await testPool.query(
              `
                DELETE FROM
                  daily_boss_definitions
                WHERE
                  daily_boss_definition_id =
                    ANY($1::uuid[])
              `,
              [
                temporaryDefinitionIds,
              ]
            );
          }

          if (
            temporaryBossIds.length > 0
          ) {
            await testPool.query(
              `
                DELETE FROM bosses
                WHERE boss_id =
                  ANY($1::uuid[])
              `,
              [
                temporaryBossIds,
              ]
            );
          }

          if (
            temporaryMonsterIds
              .length > 0
          ) {
            await testPool.query(
              `
                DELETE FROM monsters
                WHERE monster_id =
                  ANY($1::uuid[])
              `,
              [
                temporaryMonsterIds,
              ]
            );
          }
        }
      }
    );

    it(
      "rolls back Daily Boss Victory progress",
      async () => {
        const fixture =
          await createFixture(10);

        const temporaryMonsterIds:
          string[] = [];

        const temporaryBossIds:
          string[] = [];

        const temporaryDefinitionIds:
          string[] = [];

        const createSupportDefinition =
          async (
            tier: number
          ): Promise<{
            daily_boss_definition_id:
              string;
            monster_id: string;
            tier: number;
          }> => {
            const suffix =
              randomUUID().replaceAll(
                "-",
                ""
              );

            const monster =
              await testPool.query<{
                monster_id: string;
              }>(
                `
                  INSERT INTO monsters (
                    monster_family_id,
                    name,
                    description,
                    artwork,
                    monster_type,
                    level,
                    health,
                    attack,
                    defense,
                    spell_power_percent,
                    cooldown_seconds,
                    ability_chance_percent,
                    gold_min,
                    gold_max,
                    loot_level_modifier,
                    power_score,
                    code,
                    energy_cost,
                    experience_reward
                  )
                  SELECT
                    monster_family_id,
                    $1,
                    description,
                    artwork,
                    'DailyBoss',
                    level,
                    health,
                    attack,
                    defense,
                    spell_power_percent,
                    0,
                    ability_chance_percent,
                    gold_min,
                    gold_max,
                    loot_level_modifier,
                    power_score,
                    $2,
                    energy_cost,
                    experience_reward
                  FROM monsters
                  WHERE code =
                    'dev_monster_10'
                  RETURNING monster_id
                `,
                [
                  `P14 Daily Support ${tier} ${suffix}`,
                  `p14_daily_${tier}_${suffix}`,
                ]
              );

            const monsterId =
              monster.rows[0]
                ?.monster_id;

            if (!monsterId) {
              throw new Error(
                "Temporary Daily Boss monster was not created."
              );
            }

            temporaryMonsterIds.push(
              monsterId
            );

            const boss =
              await testPool.query<{
                boss_id: string;
              }>(
                `
                  INSERT INTO bosses (
                    monster_id,
                    boss_type
                  )
                  VALUES (
                    $1,
                    'DailyBoss'
                  )
                  RETURNING boss_id
                `,
                [
                  monsterId,
                ]
              );

            const bossId =
              boss.rows[0]?.boss_id;

            if (!bossId) {
              throw new Error(
                "Temporary Daily Boss record was not created."
              );
            }

            temporaryBossIds.push(
              bossId
            );

            const definition =
              await testPool.query<{
                daily_boss_definition_id:
                  string;
              }>(
                `
                  INSERT INTO
                    daily_boss_definitions (
                      boss_id,
                      tier,
                      recommended_level,
                      attempts_per_day
                    )
                  VALUES (
                    $1,
                    $2,
                    1,
                    3
                  )
                  RETURNING
                    daily_boss_definition_id
                `,
                [
                  bossId,
                  tier,
                ]
              );

            const definitionId =
              definition.rows[0]
                ?.daily_boss_definition_id;

            if (!definitionId) {
              throw new Error(
                "Temporary Daily Boss definition was not created."
              );
            }

            temporaryDefinitionIds.push(
              definitionId
            );

            return {
              daily_boss_definition_id:
                definitionId,
              monster_id: monsterId,
              tier,
            };
          };

        const existingDefinition =
          await testPool.query<{
            daily_boss_definition_id:
              string;
            monster_id: string;
            tier: number;
          }>(
            `
              SELECT
                definition
                  .daily_boss_definition_id,
                boss.monster_id,
                definition.tier
              FROM daily_boss_definitions
                AS definition
              INNER JOIN bosses AS boss
                ON boss.boss_id =
                  definition.boss_id
              WHERE boss.boss_type =
                'DailyBoss'
              ORDER BY
                definition
                  .daily_boss_definition_id
              LIMIT 1
            `
          );

        const target =
          existingDefinition.rows[0];

        if (!target) {
          throw new Error(
            "Seeded Daily Boss definition was not found."
          );
        }

        const tierTwo =
          await createSupportDefinition(
            2
          );

        const tierThree =
          await createSupportDefinition(
            3
          );

        const rotation =
          await testPool.query<{
            daily_boss_rotation_id: string;
          }>(
            `
              INSERT INTO daily_boss_rotation (
                tier_1_boss_id,
                tier_2_boss_id,
                tier_3_boss_id,
                reset_timestamp,
                created_at
              )
              VALUES (
                $1,
                $2,
                $3,
                $4,
                $5
              )
              RETURNING
                daily_boss_rotation_id
            `,
            [
              target
                .daily_boss_definition_id,
              tierTwo
                .daily_boss_definition_id,
              tierThree
                .daily_boss_definition_id,
              new Date(
                observedAt.getTime() +
                60 * 60 * 1000
              ),
              new Date(
                observedAt.getTime() -
                60 * 60 * 1000
              ),
            ]
          );

        const rotationId =
          rotation.rows[0]
            ?.daily_boss_rotation_id;

        if (!rotationId) {
          throw new Error(
            "Daily Boss rollback rotation was not created."
          );
        }

        try {
          await testPool.query(
            `
              UPDATE combat_sessions
              SET monster_id = $2
              WHERE combat_session_id = $1
            `,
            [
              fixture.combatSessionId,
              target.monster_id,
            ]
          );

          await testPool.query(
            `
              INSERT INTO
                character_daily_boss_progress (
                  character_id,
                  daily_boss_definition_id,
                  daily_boss_rotation_id,
                  attempts_used_in_rotation,
                  total_attempts,
                  total_victories,
                  last_attempt_at,
                  last_victory_at,
                  highest_tier_defeated
                )
              VALUES (
                $1,
                $2,
                $3,
                1,
                1,
                0,
                $4,
                NULL,
                NULL
              )
            `,
            [
              fixture.characterId,
              target
                .daily_boss_definition_id,
              rotationId,
              observedAt,
            ]
          );

          const readDailyState =
            async (): Promise<{
              attempts_used_in_rotation:
                number;
              total_attempts: string;
              total_victories: string;
              last_attempt_at:
                Date | null;
              last_victory_at:
                Date | null;
              highest_tier_defeated:
                number | null;
            }> => {
              const result =
                await testPool.query<{
                  attempts_used_in_rotation:
                    number;
                  total_attempts: string;
                  total_victories: string;
                  last_attempt_at:
                    Date | null;
                  last_victory_at:
                    Date | null;
                  highest_tier_defeated:
                    number | null;
                }>(
                  `
                    SELECT
                      attempts_used_in_rotation,
                      total_attempts,
                      total_victories,
                      last_attempt_at,
                      last_victory_at,
                      highest_tier_defeated
                    FROM
                      character_daily_boss_progress
                    WHERE character_id = $1
                      AND
                        daily_boss_definition_id =
                          $2
                      AND
                        daily_boss_rotation_id =
                          $3
                  `,
                  [
                    fixture.characterId,
                    target
                      .daily_boss_definition_id,
                    rotationId,
                  ]
                );

              const row =
                result.rows[0];

              if (!row) {
                throw new Error(
                  "Daily Boss progress state was not found."
                );
              }

              return row;
            };

          const beforeSession =
            await readRollbackState(
              fixture
            );

          const beforeDaily =
            await readDailyState();

          expect(
            beforeDaily.total_victories
          ).toBe("0");

          expect(
            beforeDaily
              .highest_tier_defeated
          ).toBeNull();

          const failure =
            new Error(
              "Injected failure at victory.dailyBoss."
            );

          const repository =
            new PostgresCombatSessionRepository(
              testPool,
              {
                settlementFailureInjector:
                  async (point) => {
                    if (
                      point ===
                      "victory.dailyBoss"
                    ) {
                      throw failure;
                    }
                  },
              }
            );

          const service =
            new ResolveCombatActionService(
              repository,
              new VictoryRandomSource(),
              clock
            );

          await expect(
            service.execute(
              actionInput(fixture)
            )
          ).rejects.toBe(failure);

          const afterSession =
            await readRollbackState(
              fixture
            );

          const afterDaily =
            await readDailyState();

          expect(afterSession).toEqual(
            beforeSession
          );

          expect(afterDaily).toEqual(
            beforeDaily
          );

          expect(
            afterDaily.total_victories
          ).toBe("0");

          expect(
            afterDaily
              .last_victory_at
          ).toBeNull();

          expect(afterSession.status).toBe(
            "Active"
          );

          expect(
            afterSession.log_count
          ).toBe("0");

          expect(
            afterSession.event_count
          ).toBe("0");
        }
        finally {
          await testPool.query(
            `
              DELETE FROM
                character_daily_boss_progress
              WHERE character_id = $1
                AND
                  daily_boss_definition_id =
                    $2
                AND
                  daily_boss_rotation_id =
                    $3
            `,
            [
              fixture.characterId,
              target
                .daily_boss_definition_id,
              rotationId,
            ]
          );

          await testPool.query(
            `
              DELETE FROM
                daily_boss_rotation
              WHERE
                daily_boss_rotation_id =
                  $1
            `,
            [
              rotationId,
            ]
          );

          if (
            temporaryDefinitionIds
              .length > 0
          ) {
            await testPool.query(
              `
                DELETE FROM
                  daily_boss_definitions
                WHERE
                  daily_boss_definition_id =
                    ANY($1::uuid[])
              `,
              [
                temporaryDefinitionIds,
              ]
            );
          }

          if (
            temporaryBossIds.length > 0
          ) {
            await testPool.query(
              `
                DELETE FROM bosses
                WHERE boss_id =
                  ANY($1::uuid[])
              `,
              [
                temporaryBossIds,
              ]
            );
          }

          if (
            temporaryMonsterIds
              .length > 0
          ) {
            await testPool.query(
              `
                DELETE FROM monsters
                WHERE monster_id =
                  ANY($1::uuid[])
              `,
              [
                temporaryMonsterIds,
              ]
            );
          }
        }
      }
    );

    it(
      "applies cooldown after Victory",
      async () => {
        const fixture =
          await createFixture(10);

        const monster =
          await testPool.query<{
            monster_id: string;
            cooldown_seconds: number;
          }>(
            `
              SELECT
                monster.monster_id,
                monster.cooldown_seconds
              FROM combat_sessions AS session
              INNER JOIN monsters AS monster
                ON monster.monster_id =
                  session.monster_id
              WHERE session.combat_session_id = $1
            `,
            [
              fixture.combatSessionId,
            ]
          );

        const monsterRow =
          monster.rows[0];

        if (!monsterRow) {
          throw new Error(
            "Cooldown test monster was not found."
          );
        }

        try {
          await testPool.query(
            `
              UPDATE monsters
              SET cooldown_seconds = 30
              WHERE monster_id = $1
            `,
            [
              monsterRow.monster_id,
            ]
          );

          const service =
            createService(
              new VictoryRandomSource()
            );

          const result =
            await service.execute(
              actionInput(fixture)
            );

          expect(result).toMatchObject({
            status: "Victory",
            settlement: {
              outcome: "Victory",
              cooldown: {
                applied: true,
                availableAt: new Date(
                  observedAt.getTime() +
                  30_000
                ),
              },
            },
          });

          const storedCooldown =
            await testPool.query<{
              available_at: Date;
            }>(
              `
                SELECT available_at
                FROM character_cooldowns
                WHERE character_id = $1
                  AND target_id = $2
              `,
              [
                fixture.characterId,
                monsterRow.monster_id,
              ]
            );

          expect(
            storedCooldown.rows
          ).toHaveLength(1);

          expect(
            storedCooldown.rows[0]
              ?.available_at
          ).toEqual(
            new Date(
              observedAt.getTime() +
              30_000
            )
          );
        } finally {
          await testPool.query(
            `
              UPDATE monsters
              SET cooldown_seconds = $2
              WHERE monster_id = $1
            `,
            [
              monsterRow.monster_id,
              monsterRow.cooldown_seconds,
            ]
          );
        }
      }
    );
    it(
      "applies cooldown after Defeat",
      async () => {
        const fixture =
          await createFixture();

        await testPool.query(
          `
            UPDATE characters
            SET current_health = 5
            WHERE character_id = $1
          `,
          [
            fixture.characterId,
          ]
        );

        await testPool.query(
          `
            UPDATE combat_sessions
            SET character_health = 5
            WHERE combat_session_id = $1
          `,
          [
            fixture.combatSessionId,
          ]
        );

        const monster =
          await testPool.query<{
            monster_id: string;
            cooldown_seconds: number;
          }>(
            `
              SELECT
                monster.monster_id,
                monster.cooldown_seconds
              FROM combat_sessions AS session
              INNER JOIN monsters AS monster
                ON monster.monster_id =
                  session.monster_id
              WHERE session.combat_session_id = $1
            `,
            [
              fixture.combatSessionId,
            ]
          );

        const monsterRow =
          monster.rows[0];

        if (!monsterRow) {
          throw new Error(
            "Cooldown test monster was not found."
          );
        }

        try {
          await testPool.query(
            `
              UPDATE monsters
              SET cooldown_seconds = 30
              WHERE monster_id = $1
            `,
            [
              monsterRow.monster_id,
            ]
          );

          const service =
            createService(
              new DefeatRandomSource()
            );

          const result =
            await service.execute(
              actionInput(fixture)
            );

          expect(result).toMatchObject({
            status: "Defeat",
            settlement: {
              outcome: "Defeat",
              cooldown: {
                applied: true,
                availableAt: new Date(
                  observedAt.getTime() +
                  30_000
                ),
              },
            },
          });

          const storedCooldown =
            await testPool.query<{
              available_at: Date;
            }>(
              `
                SELECT available_at
                FROM character_cooldowns
                WHERE character_id = $1
                  AND target_id = $2
              `,
              [
                fixture.characterId,
                monsterRow.monster_id,
              ]
            );

          expect(
            storedCooldown.rows
          ).toHaveLength(1);

          expect(
            storedCooldown.rows[0]
              ?.available_at
          ).toEqual(
            new Date(
              observedAt.getTime() +
              30_000
            )
          );
        } finally {
          await testPool.query(
            `
              UPDATE monsters
              SET cooldown_seconds = $2
              WHERE monster_id = $1
            `,
            [
              monsterRow.monster_id,
              monsterRow.cooldown_seconds,
            ]
          );
        }
      }
    );
    it(
      "rolls back Defeat when cooldown persistence is followed by failure",
      async () => {
        const fixture =
          await createFixture();

        await testPool.query(
          `
            UPDATE characters
            SET current_health = 5
            WHERE character_id = $1
          `,
          [
            fixture.characterId,
          ]
        );

        await testPool.query(
          `
            UPDATE combat_sessions
            SET character_health = 5
            WHERE combat_session_id = $1
          `,
          [
            fixture.combatSessionId,
          ]
        );

        const monster =
          await testPool.query<{
            monster_id: string;
            cooldown_seconds: number;
          }>(
            `
              SELECT
                monster.monster_id,
                monster.cooldown_seconds
              FROM combat_sessions AS session
              INNER JOIN monsters AS monster
                ON monster.monster_id =
                  session.monster_id
              WHERE session.combat_session_id = $1
            `,
            [
              fixture.combatSessionId,
            ]
          );

        const monsterRow =
          monster.rows[0];

        if (!monsterRow) {
          throw new Error(
            "Cooldown rollback monster was not found."
          );
        }

        try {
          await testPool.query(
            `
              UPDATE monsters
              SET cooldown_seconds = 30
              WHERE monster_id = $1
            `,
            [
              monsterRow.monster_id,
            ]
          );

          const before =
            await readRollbackState(
              fixture
            );

          expect(
            before.cooldown_count
          ).toBe("0");

          const failure =
            new Error(
              "Injected failure at defeat.cooldown."
            );

          const repository =
            new PostgresCombatSessionRepository(
              testPool,
              {
                settlementFailureInjector:
                  async (point) => {
                    if (
                      point ===
                      "defeat.cooldown"
                    ) {
                      throw failure;
                    }
                  },
              }
            );

          const service =
            new ResolveCombatActionService(
              repository,
              new DefeatRandomSource(),
              clock
            );

          await expect(
            service.execute(
              actionInput(fixture)
            )
          ).rejects.toBe(failure);

          const after =
            await readRollbackState(
              fixture
            );

          expect(after).toEqual(before);
          expect(
            after.cooldown_count
          ).toBe("0");
          expect(after.status).toBe(
            "Active"
          );
          expect(after.log_count).toBe(
            "0"
          );
          expect(after.event_count).toBe(
            "0"
          );
        } finally {
          await testPool.query(
            `
              UPDATE monsters
              SET cooldown_seconds = $2
              WHERE monster_id = $1
            `,
            [
              monsterRow.monster_id,
              monsterRow.cooldown_seconds,
            ]
          );
        }
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
          energy_cost,
          experience_reward,
          gold_min,
          gold_max
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
          5,
          75,
          11,
          22
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

        expect(result.rewards).toEqual({
          monsterExperienceReward: 75n,
          monsterGoldMinimum: 11n,
          monsterGoldMaximum: 22n,
        });

        const rewardSnapshot =
          await testPool.query<{
            monster_experience_reward: string;
            monster_gold_min: string;
            monster_gold_max: string;
          }>(
            `
              SELECT
                monster_experience_reward,
                monster_gold_min,
                monster_gold_max
              FROM combat_sessions
              WHERE character_id = $1
                AND status = 'Active'
            `,
            [fixture.characterId]
          );

        expect(
          rewardSnapshot.rows[0]
        ).toEqual({
          monster_experience_reward: "75",
          monster_gold_min: "11",
          monster_gold_max: "22",
        });
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
# SOURCE: tests/integration/characters/postgres-equipment.repository.test.ts
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
  PostgresCharacterRepository,
} from "../../../src/modules/characters/infrastructure/postgres-character.repository.js";
import {
  PostgresEquipmentRepository,
} from "../../../src/modules/characters/infrastructure/postgres-equipment.repository.js";
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

const characterRepository =
  new PostgresCharacterRepository(testPool);

const equipmentRepository =
  new PostgresEquipmentRepository(testPool);

const accountIds: string[] = [];
const itemBaseIds: string[] = [];
const itemIds: string[] = [];

type TestItemInput = {
  characterId: string;
  position: number;
  slot:
    | "Weapon"
    | "Shield"
    | "Helmet"
    | "Armor"
    | "Legs"
    | "Boots"
    | "Ring"
    | "Amulet";
  requiredLevel?: number;
  handedness?: "OneHanded" | "TwoHanded" | null;
  health?: number;
  isEquipped?: boolean;
};

async function createInventoryItem(
  input: TestItemInput
): Promise<string> {
  const itemBaseResult = await testPool.query<{
    item_base_id: string;
  }>(
    `
      INSERT INTO item_bases (
        code,
        name,
        description,
        item_level,
        required_level,
        slot,
        weapon_type,
        handedness,
        health
      )
      VALUES (
        $1,
        $2,
        'Equipment integration test item',
        1,
        $3,
        $4,
        $5,
        $6,
        $7
      )
      RETURNING item_base_id
    `,
    [
      `equipment_test_${randomUUID().replaceAll("-", "")}`,
      `Equipment Test ${randomUUID()}`,
      input.requiredLevel ?? 1,
      input.slot,
      input.slot === "Weapon" ? "Sword" : null,
      input.slot === "Weapon"
        ? input.handedness ?? "OneHanded"
        : null,
      input.health ?? 0,
    ]
  );

  const itemBaseId =
    itemBaseResult.rows[0]?.item_base_id;

  if (itemBaseId === undefined) {
    throw new Error("Item base was not created.");
  }

  itemBaseIds.push(itemBaseId);

  const itemResult = await testPool.query<{
    item_id: string;
  }>(
    `
      INSERT INTO items (
        item_base_id,
        item_level,
        required_level,
        rarity,
        item_score
      )
      VALUES ($1, 1, 1, 'Common', 0)
      RETURNING item_id
    `,
    [itemBaseId]
  );

  const itemId = itemResult.rows[0]?.item_id;

  if (itemId === undefined) {
    throw new Error("Item was not created.");
  }

  itemIds.push(itemId);

  const inventoryResult = await testPool.query<{
    inventory_item_id: string;
  }>(
    `
      INSERT INTO inventory_items (
        character_id,
        item_id,
        position,
        is_equipped
      )
      VALUES ($1, $2, $3, $4)
      RETURNING inventory_item_id
    `,
    [
      input.characterId,
      itemId,
      input.position,
      input.isEquipped ?? false,
    ]
  );

  const inventoryItemId =
    inventoryResult.rows[0]?.inventory_item_id;

  if (inventoryItemId === undefined) {
    throw new Error("Inventory item was not created.");
  }

  return inventoryItemId;
}

async function isEquipped(
  inventoryItemId: string
): Promise<boolean> {
  const result = await testPool.query<{
    is_equipped: boolean;
  }>(
    `
      SELECT is_equipped
      FROM inventory_items
      WHERE inventory_item_id = $1
    `,
    [inventoryItemId]
  );

  return result.rows[0]?.is_equipped ?? false;
}

describe("PostgresEquipmentRepository integration", () => {
  beforeAll(async () => {
    await testPool.query("SELECT 1");
  });

  afterEach(async () => {
    while (accountIds.length > 0) {
      const accountId = accountIds.pop();

      if (accountId !== undefined) {
        await deleteTestAccount(
          testPool,
          accountId
        );
      }
    }

    while (itemIds.length > 0) {
      const itemId = itemIds.pop();

      if (itemId !== undefined) {
        await testPool.query(
          "DELETE FROM items WHERE item_id = $1",
          [itemId]
        );
      }
    }

    while (itemBaseIds.length > 0) {
      const itemBaseId = itemBaseIds.pop();

      if (itemBaseId !== undefined) {
        await testPool.query(
          `
            DELETE FROM item_bases
            WHERE item_base_id = $1
          `,
          [itemBaseId]
        );
      }
    }
  });

  afterAll(async () => {
    await testPool.end();
  });

  it("replaces an equipped item in the same slot", async () => {
    const account = await createTestAccount(testPool);
    accountIds.push(account.accountId);

    const character =
      await characterRepository.createCharacterGraph({
        accountId: account.accountId,
        seasonId: null,
        name: `Equip ${randomUUID().slice(0, 8)}`,
        spellLoadoutName: "Default Spells",
        equipmentLoadoutName: "Default Equipment",
      });

    const oldArmor = await createInventoryItem({
      characterId: character.characterId,
      position: 1,
      slot: "Armor",
      health: 50,
      isEquipped: true,
    });

    const newArmor = await createInventoryItem({
      characterId: character.characterId,
      position: 2,
      slot: "Armor",
      health: 100,
    });

    const result = await equipmentRepository.equip({
      accountId: account.accountId,
      characterId: character.characterId,
      inventoryItemId: newArmor,
    });

    expect(await isEquipped(oldArmor)).toBe(false);
    expect(await isEquipped(newArmor)).toBe(true);

    expect(
      result.effectiveStatistics.maximumHealth
    ).toBe(280);

    expect(result.resources.maximumHealth).toBe(280);
  });

  it("unequips an item and hard-clamps Health", async () => {
    const account = await createTestAccount(testPool);
    accountIds.push(account.accountId);

    const character =
      await characterRepository.createCharacterGraph({
        accountId: account.accountId,
        seasonId: null,
        name: `Clamp ${randomUUID().slice(0, 8)}`,
        spellLoadoutName: "Default Spells",
        equipmentLoadoutName: "Default Equipment",
      });

    const armor = await createInventoryItem({
      characterId: character.characterId,
      position: 1,
      slot: "Armor",
      health: 100,
      isEquipped: true,
    });

    await testPool.query(
      `
        UPDATE characters
        SET
          current_health = 280,
          max_health = 280
        WHERE character_id = $1
      `,
      [character.characterId]
    );

    const result = await equipmentRepository.unequip({
      accountId: account.accountId,
      characterId: character.characterId,
      inventoryItemId: armor,
    });

    expect(await isEquipped(armor)).toBe(false);
    expect(result.resources.maximumHealth).toBe(180);
    expect(result.resources.currentHealth).toBe(180);
  });

  it("unequips Shield when equipping a TwoHanded weapon", async () => {
    const account = await createTestAccount(testPool);
    accountIds.push(account.accountId);

    const character =
      await characterRepository.createCharacterGraph({
        accountId: account.accountId,
        seasonId: null,
        name: `TwoHanded ${randomUUID().slice(0, 8)}`,
        spellLoadoutName: "Default Spells",
        equipmentLoadoutName: "Default Equipment",
      });

    const shield = await createInventoryItem({
      characterId: character.characterId,
      position: 1,
      slot: "Shield",
      isEquipped: true,
    });

    const weapon = await createInventoryItem({
      characterId: character.characterId,
      position: 2,
      slot: "Weapon",
      handedness: "TwoHanded",
    });

    await equipmentRepository.equip({
      accountId: account.accountId,
      characterId: character.characterId,
      inventoryItemId: weapon,
    });

    expect(await isEquipped(shield)).toBe(false);
    expect(await isEquipped(weapon)).toBe(true);
  });

  it("unequips a TwoHanded weapon when equipping Shield", async () => {
    const account = await createTestAccount(testPool);
    accountIds.push(account.accountId);

    const character =
      await characterRepository.createCharacterGraph({
        accountId: account.accountId,
        seasonId: null,
        name: `Shield ${randomUUID().slice(0, 8)}`,
        spellLoadoutName: "Default Spells",
        equipmentLoadoutName: "Default Equipment",
      });

    const weapon = await createInventoryItem({
      characterId: character.characterId,
      position: 1,
      slot: "Weapon",
      handedness: "TwoHanded",
      isEquipped: true,
    });

    const shield = await createInventoryItem({
      characterId: character.characterId,
      position: 2,
      slot: "Shield",
    });

    await equipmentRepository.equip({
      accountId: account.accountId,
      characterId: character.characterId,
      inventoryItemId: shield,
    });

    expect(await isEquipped(weapon)).toBe(false);
    expect(await isEquipped(shield)).toBe(true);
  });

  it("rejects an item requiring a higher level without changing equipment", async () => {
    const account = await createTestAccount(testPool);
    accountIds.push(account.accountId);

    const character =
      await characterRepository.createCharacterGraph({
        accountId: account.accountId,
        seasonId: null,
        name: `Level ${randomUUID().slice(0, 8)}`,
        spellLoadoutName: "Default Spells",
        equipmentLoadoutName: "Default Equipment",
      });

    const oldArmor = await createInventoryItem({
      characterId: character.characterId,
      position: 1,
      slot: "Armor",
      isEquipped: true,
    });

    const highLevelArmor = await createInventoryItem({
      characterId: character.characterId,
      position: 2,
      slot: "Armor",
      requiredLevel: 100,
    });

    await expect(
      equipmentRepository.equip({
        accountId: account.accountId,
        characterId: character.characterId,
        inventoryItemId: highLevelArmor,
      })
    ).rejects.toMatchObject({
      code: "EQUIPMENT_LEVEL_REQUIRED",
    });

    expect(await isEquipped(oldArmor)).toBe(true);
    expect(await isEquipped(highLevelArmor)).toBe(false);
  });});


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
            $4::integer, $4::integer, $4::integer,
            $4::bigint, $4::bigint, $4::integer,
            $4::numeric, $4::numeric)
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
          INSERT INTO items (
            item_base_id, item_level, required_level, rarity, item_score
          )
          VALUES ($1, 1, 1, 'Common', 0)
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
          affix_position,
          roll_value
        )
        VALUES
          ($1, $3, 1, 7),
          ($2, $3, 1, 500)
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
import type {
  RandomSource,
} from "../../../src/modules/combat/ports/random-source.js";
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
const createdItemBaseIds: string[] = [];
const createdMaterialIds: string[] = [];
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
        energy_cost,
        experience_reward,
        gold_min,
        gold_max
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
        5,
        75,
        11,
        22
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

class DefeatRandomSource
  implements RandomSource {
  private floatCall = 0;

  public nextFloat(): number {
    this.floatCall += 1;

    return this.floatCall === 1
      ? 0.99
      : 0;
  }

  public nextInt(
    _minimum: number,
    maximum: number
  ): number {
    return maximum;
  }

  public nextBigInt(
    minimum: bigint,
    _maximum: bigint
  ): bigint {
    return minimum;
  }
}

class VictoryRandomSource
  implements RandomSource {
  public nextFloat(): number {
    return 0;
  }

  public nextInt(
    _minimum: number,
    maximum: number
  ): number {
    return maximum;
  }

  public nextBigInt(
    minimum: bigint,
    _maximum: bigint
  ): bigint {
    return minimum;
  }
}

/**
 * Deterministic Victories that always succeed the Equipment and Other Loot
 * probability rolls (both use nextInt(1, 1000) and return the minimum) while
 * rolling the maximum for any other integer range. Bigint rolls use the
 * inclusive minimum, which is a valid edge for weighted selections and
 * quantity ranges.
 */
class LootVictoryRandomSource
  implements RandomSource {
  public nextFloat(): number {
    return 0;
  }

  public nextInt(
    minimum: number,
    maximum: number
  ): number {
    if (minimum === 1 && maximum === 1000) {
      return 1;
    }

    return maximum;
  }

  public nextBigInt(
    minimum: bigint,
    _maximum: bigint
  ): bigint {
    return minimum;
  }
}

async function createLootBearingMonster() {
  const monster =
    await createCombatMonster();

  const suffix =
    randomUUID().replaceAll("-", "");

  // Create a dedicated Item Base for this Monster instead of relying on a
  // non-deterministic `SELECT ... LIMIT 1` over shared seed data. The
  // inserted row is tracked and removed during cleanup, so concurrent test
  // files never observe or depend on each other's loot data.
  const itemBaseResult =
    await testPool.query<{
      item_base_id: string;
    }>(
      `
        INSERT INTO item_bases (
          code,
          name,
          description,
          item_level,
          required_level,
          slot,
          base_item_score
        )
        VALUES ($1, $2, $3, 1, 1, 'Helmet', 1)
        RETURNING item_base_id
      `,
      [
        `loot_http_base_${suffix}`,
        `Loot HTTP Base ${suffix}`,
        "HTTP integration-test loot Item Base.",
      ]
    );

  const itemBaseId =
    itemBaseResult.rows[0]?.item_base_id;

  if (!itemBaseId) {
    throw new Error(
      "Could not create the HTTP loot Item Base."
    );
  }

  createdItemBaseIds.push(itemBaseId);

  await testPool.query(
    `
      INSERT INTO loot_tables (
        monster_id,
        item_base_id,
        selection_weight
      )
      VALUES ($1, $2, 1)
    `,
    [
      monster.monster_id,
      itemBaseId,
    ]
  );

  // Likewise, insert a dedicated Material instead of selecting a shared row.
  const materialResult =
    await testPool.query<{
      material_id: string;
    }>(
      `
        INSERT INTO materials (
          code,
          name,
          description,
          material_level,
          is_lootable
        )
        VALUES ($1, $2, $3, 1, TRUE)
        RETURNING material_id
      `,
      [
        `loot_http_material_${suffix}`,
        `Loot HTTP Material ${suffix}`,
        "HTTP integration-test loot Material.",
      ]
    );

  const materialId =
    materialResult.rows[0]?.material_id;

  if (!materialId) {
    throw new Error(
      "Could not create the HTTP loot Material."
    );
  }

  createdMaterialIds.push(materialId);

  await testPool.query(
    `
      INSERT INTO other_loot_tables (
        monster_id,
        material_id,
        min_quantity,
        max_quantity,
        selection_weight
      )
      VALUES ($1, $2, 1, 3, 1)
    `,
    [
      monster.monster_id,
      materialId,
    ]
  );

  return monster;
}

async function startServer(
  randomSource?: RandomSource
) {
  const server =
    createApplicationServer({
      randomSource,
    });

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

/**
 * Asserts that every listed property is serialized as a string. BigInt
 * amounts (Experience, Gold, Item Score, quantities, statistics) must cross
 * the HTTP boundary as strings, never as lossy numbers.
 */
function expectStringFields(
  record: Record<string, unknown>,
  fieldNames: readonly string[]
): void {
  for (const fieldName of fieldNames) {
    expect(
      typeof record[fieldName],
      `${fieldName} must be serialized as a string`
    ).toBe("string");
  }
}

describe(
  "persistent combat HTTP integration",
  () => {
    beforeAll(async () => {
      await testPool.query("SELECT 1");
    });

    afterEach(async () => {
      // Drain the tracked collections atomically up front. Each collection is
      // snapshotted and cleared before any awaited cleanup runs, so a failing
      // or re-entrant cleanup can never leave stale ids behind for the next
      // test and every id is still processed.
      const servers =
        openedServers.splice(
          0,
          openedServers.length
        );
      const accountIds =
        createdAccountIds.splice(
          0,
          createdAccountIds.length
        );
      const monsterIds =
        createdMonsterIds.splice(
          0,
          createdMonsterIds.length
        );
      const itemBaseIds =
        createdItemBaseIds.splice(
          0,
          createdItemBaseIds.length
        );
      const materialIds =
        createdMaterialIds.splice(
          0,
          createdMaterialIds.length
        );

      // Close every HTTP server independently. A failure closing one server
      // must not prevent closing the others or removing database rows.
      await Promise.allSettled(
        servers.map(async (server) => {
          try {
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
          } catch {
            // Ignore individual close errors so cleanup continues.
          }
        })
      );

      // Accounts own characters and combat sessions; deleting an Account
      // cascades those rows. Each delete runs in isolation.
      await Promise.allSettled(
        accountIds.map(async (accountId) => {
          try {
            await deleteTestAccount(
              testPool,
              accountId
            );
          } catch {
            // Ignore individual delete errors (e.g. foreign-key conflicts)
            // so unrelated records are still cleaned up.
          }
        })
      );

      // Monsters cascade loot_tables, other_loot_tables and any dependent
      // session rows via ON DELETE CASCADE.
      await Promise.allSettled(
        monsterIds.map(async (monsterId) => {
          try {
            await testPool.query(
              `
                DELETE FROM monsters
                WHERE monster_id = $1
              `,
              [monsterId]
            );
          } catch {
            // Ignore individual delete errors so cleanup continues.
          }
        })
      );

      // Remove dedicated loot Item Bases and Materials after the Monsters
      // that reference them have been deleted.
      await Promise.allSettled(
        itemBaseIds.map(async (itemBaseId) => {
          try {
            await testPool.query(
              `
                DELETE FROM item_bases
                WHERE item_base_id = $1
              `,
              [itemBaseId]
            );
          } catch {
            // Ignore individual delete errors so cleanup continues.
          }
        })
      );

      await Promise.allSettled(
        materialIds.map(async (materialId) => {
          try {
            await testPool.query(
              `
                DELETE FROM materials
                WHERE material_id = $1
              `,
              [materialId]
            );
          } catch {
            // Ignore individual delete errors so cleanup continues.
          }
        })
      );
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

    it(
      "returns a terminal Victory settlement with string amounts",
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
                `Http-Victory-${randomUUID()
                  .slice(0, 8)}`,
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
          [
            character.characterId,
          ]
        );

        const monster =
          await createCombatMonster();

        await testPool.query(
          `
            UPDATE monsters
            SET
              health = 1,
              defense = 0,
              attack = 0,
              experience_reward =
                9007199254740993,
              gold_min =
                9007199254740994,
              gold_max =
                9007199254740994
            WHERE monster_id = $1
          `,
          [
            monster.monster_id,
          ]
        );

        const token =
          await createAuthorizationSession(
            account.accountId
          );

        const { baseUrl } =
          await startServer(
            new VictoryRandomSource()
          );

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
              combatSessionId:
                string;
            };
          };

        const actionResponse =
          await fetch(
            `${combatUrl}/actions`,
            jsonRequest(token, {
              expectedTurn: 1,
              action: {
                type:
                  "basic_attack",
              },
            })
          );

        expect(
          actionResponse.status
        ).toBe(200);

        const body =
          await actionResponse.json() as {
            data: {
              status: string;
              settlement: {
                outcome: string;
                experience: {
                  before: string;
                  awarded: string;
                  lost: string;
                  after: string;
                };
                gold: {
                  before: string;
                  baseRolled: string;
                  awarded: string;
                  after: string;
                };
                bestiary: {
                  killCount:
                    string | null;
                };
                statistics: {
                  damageDealt: string;
                  damageTaken: string;
                  highestPhysicalHit:
                    string;
                };
                finalSummary: {
                  combatSessionId:
                    string;
                  outcome: string;
                  startedAt: string;
                  endedAt: string;
                };
              };
            };
          };

        expect(
          body.data.status
        ).toBe("Victory");

        const settlement =
          body.data.settlement;

        // BigInt amounts (Experience, Gold, Bestiary counts) must be
        // serialized as strings and preserve their exact large values.
        expect(settlement).toMatchObject({
          outcome: "Victory",

          experience: {
            before: "0",
            awarded:
              "9007199254740993",
            lost: "0",
            after:
              "9007199254740993",
          },

          gold: {
            before: "0",
            baseRolled:
              "9007199254740994",
            awarded:
              "9007199254740994",
            after:
              "9007199254740994",
          },

          bestiary: {
            killCount: "1",
          },

          finalSummary: {
            combatSessionId:
              startBody.data
                .combatSessionId,
            outcome: "Victory",
          },
        });

        // Explicit string-typed expectations for BigInt-derived fields.
        expectStringFields(
          settlement.experience,
          ["awarded", "after"]
        );
        expectStringFields(
          settlement.gold,
          ["baseRolled", "awarded", "after"]
        );
        expectStringFields(
          settlement.statistics,
          [
            "damageDealt",
            "damageTaken",
            "highestPhysicalHit",
          ]
        );

        expect(
          Number.isNaN(
            Date.parse(
              settlement
                .finalSummary.startedAt
            )
          )
        ).toBe(false);

        expect(
          Number.isNaN(
            Date.parse(
              settlement
                .finalSummary.endedAt
            )
          )
        ).toBe(false);
      }
    );

    it(
      "returns a terminal Defeat settlement with string amounts",
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
                `Http-Defeat-${randomUUID()
                  .slice(0, 8)}`,
              spellLoadoutName:
                "Default Spells",
              equipmentLoadoutName:
                "Default Equipment",
            });

        await testPool.query(
          `
            UPDATE characters
            SET
              experience = 0,
              gold =
                9007199254740994,
              current_health = 1,
              current_energy = 50,
              resources_updated_at =
                NOW()
            WHERE character_id = $1
          `,
          [
            character.characterId,
          ]
        );

        const monster =
          await createCombatMonster();

        await testPool.query(
          `
            UPDATE monsters
            SET
              health = 100,
              attack = 1000,
              defense = 1000,
              experience_reward = 75,
              gold_min = 11,
              gold_max = 22
            WHERE monster_id = $1
          `,
          [
            monster.monster_id,
          ]
        );

        const token =
          await createAuthorizationSession(
            account.accountId
          );

        const { baseUrl } =
          await startServer(
            new DefeatRandomSource()
          );

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
              combatSessionId:
                string;
            };
          };

        const actionResponse =
          await fetch(
            `${combatUrl}/actions`,
            jsonRequest(token, {
              expectedTurn: 1,
              action: {
                type:
                  "basic_attack",
              },
            })
          );

        expect(
          actionResponse.status
        ).toBe(200);

        const body =
          await actionResponse.json() as {
            data: {
              status: string;
              defeatReason:
                string | null;
              loot: unknown;
              settlement: {
                outcome: string;
                experience: {
                  before: string;
                  awarded: string;
                  lost: string;
                  after: string;
                };
                gold: {
                  before: string;
                  baseRolled: string;
                  awarded: string;
                  after: string;
                };
                statistics: {
                  damageDealt: string;
                  damageTaken: string;
                  highestPhysicalHit:
                    string;
                };
                finalSummary: {
                  combatSessionId:
                    string;
                  outcome: string;
                  startedAt: string;
                  endedAt: string;
                };
              };
            };
          };

        expect(
          body.data.status
        ).toBe("Defeat");

        expect(body.data.loot).toBeNull();

        expect(
          body.data.defeatReason
        ).toBe("PlayerHealthDepleted");

        expect(
          body.data.settlement
        ).toMatchObject({
          outcome: "Defeat",

          experience: {
            before: "0",
            awarded: "0",
            lost: "0",
            after: "0",
          },

          gold: {
            before:
              "9007199254740994",
            baseRolled: "0",
            awarded: "0",
            after:
              "9007199254740994",
          },

          finalSummary: {
            combatSessionId:
              startBody.data
                .combatSessionId,
            outcome: "Defeat",
          },
        });

        expect(
          typeof body.data.settlement
            .experience.lost
        ).toBe("string");

        expect(
          typeof body.data.settlement
            .experience.after
        ).toBe("string");

        expect(
          typeof body.data.settlement
            .statistics.damageDealt
        ).toBe("string");

        expect(
          typeof body.data.settlement
            .statistics.damageTaken
        ).toBe("string");

        expect(
          typeof body.data.settlement
            .statistics
            .highestPhysicalHit
        ).toBe("string");

        expect(
          Number.isNaN(
            Date.parse(
              body.data.settlement
                .finalSummary.startedAt
            )
          )
        ).toBe(false);

        expect(
          Number.isNaN(
            Date.parse(
              body.data.settlement
                .finalSummary.endedAt
            )
          )
        ).toBe(false);
      }
    );

    it(
      "returns Loot settlement for terminal Victory",
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
                `Http-Loot-${randomUUID()
                  .slice(0, 8)}`,
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
          [
            character.characterId,
          ]
        );

        const monster =
          await createLootBearingMonster();

        await testPool.query(
          `
            UPDATE monsters
            SET
              health = 1,
              defense = 0,
              attack = 0
            WHERE monster_id = $1
          `,
          [
            monster.monster_id,
          ]
        );

        const token =
          await createAuthorizationSession(
            account.accountId
          );

        const { baseUrl } =
          await startServer(
            new LootVictoryRandomSource()
          );

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

        const actionResponse =
          await fetch(
            `${combatUrl}/actions`,
            jsonRequest(token, {
              expectedTurn: 1,
              action: {
                type:
                  "basic_attack",
              },
            })
          );

        expect(
          actionResponse.status
        ).toBe(200);

        const body =
          await actionResponse.json() as {
            data: {
              status: string;
              loot: {
                regularEquipment: {
                  generated: {
                    itemLevel: number;
                    requiredLevel: number;
                    rarity: string;
                    itemScore: string;
                    affixes: Array<{
                      statType: string;
                      rollValue: string;
                    }>;
                  } | null;
                  persisted: {
                    itemId: string;
                    inventoryPosition: number;
                  } | null;
                  lossReason:
                    "InventoryFull" | null;
                };
                specialEquipment: {
                  generated: unknown | null;
                  persisted: unknown | null;
                  lossReason:
                    "InventoryFull" | null;
                };
                specialRollOutcome: string;
                otherLoot: {
                  kind: string;
                  otherLootTableId: string;
                  quantity: string;
                } | null;
                pity: {
                  eligibleKillCount: number;
                  chancePerMille: number;
                };
              };
            };
          };

        expect(body.data.status).toBe(
          "Victory"
        );

        const loot = body.data.loot;

        expect(loot).not.toBeNull();

        // regularEquipment: generated and persisted, string Item Score.
        expect(
          loot.regularEquipment.generated
        ).not.toBeNull();

        expect(
          loot.regularEquipment.persisted
        ).not.toBeNull();

        expect(
          loot.regularEquipment.lossReason
        ).toBeNull();

        // BigInt-derived amounts are serialized as strings.
        expect(
          typeof loot.regularEquipment
            .generated?.itemScore
        ).toBe("string");

        expect(
          typeof loot.regularEquipment
            .generated?.itemLevel
        ).toBe("number");

        expect(
          typeof loot.regularEquipment
            .persisted?.itemId
        ).toBe("string");

        const affixes =
          loot.regularEquipment
            .generated?.affixes ?? [];

        for (
          const affix of affixes
        ) {
          expect(
            typeof affix.rollValue
          ).toBe("string");
        }

        // specialEquipment: no eligible source for this monster.
        expect(
          loot.specialEquipment.generated
        ).toBeNull();

        expect(
          loot.specialEquipment.persisted
        ).toBeNull();

        expect(
          loot.specialEquipment.lossReason
        ).toBeNull();

        expect([
          "Ineligible",
          "Failed",
          "Generated",
        ]).toContain(
          loot.specialRollOutcome
        );

        expect(
          loot.specialRollOutcome
        ).toBe("Ineligible");

        // otherLoot: present with a string-serialized quantity.
        expect(loot.otherLoot).not.toBeNull();

        expect(
          typeof loot.otherLoot?.quantity
        ).toBe("string");

        expect([
          "Material",
          "Consumable",
        ]).toContain(
          loot.otherLoot?.kind
        );

        // pity: numeric canonical state.
        expect(
          typeof loot.pity
            .eligibleKillCount
        ).toBe("number");

        expect(
          typeof loot.pity
            .chancePerMille
        ).toBe("number");
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
# SOURCE: M7_APPROVED_DECISIONS.md
# ============================================================

```text
# M7 Approved Decisions

## Milestone

M7: Item and Loot Generation

## Status

All decisions D1 through D24 are approved and authoritative for M7 planning and implementation.

## D1: Independent affix slots and duplicates

Each affix slot is rolled independently.

The same `affix_type`, `tier`, and `affix_template_id` may appear multiple times on one item. A Legendary item may therefore receive four copies of Attack Tier 4.

Each occurrence has:

- its own `item_affix_id`,
- its own `roll_value`,
- a stable `affix_position`.

M7 removes the constraint `UNIQUE (item_id, affix_template_id)` and replaces it with uniqueness of the affix position within an item.

## D2: Authoritative Item Base to Affix weight table

M7 introduces a separate table linking Item Bases with Affix Templates.

Each link stores a positive selection weight. The generator selects an affix from the eligible weighted pool configured for the selected Item Base.

A selected affix remains in the pool for subsequent affix slots. Item Base weights are the authoritative source for weighted affix generation.

## D3: Unique and Set Item stat rolls

Unique Items and Set Items do not use normal affixes.

Each specific Unique or Set Item has a fixed set of stat categories. Generation rolls only the values of those predefined stats within their configured inclusive ranges.

Example:

```text
Attack: 1-10
Defense: 2-7
Gold: 3-5
```

Every generated copy contains all configured stat categories, while their values may differ. Unique and Set Items do not create `item_affixes` records.

## D4: Canonical loot Item Level formula

The canonical loot level is:

```text
effectiveLootLevel = monsterLevel + bossBonusLootLevel
minimumItemLevel = max(1, effectiveLootLevel - 10)
maximumItemLevel = effectiveLootLevel + 5
```

Item Level is rolled uniformly and inclusively from this range.

Regular monsters use `bossBonusLootLevel = 0`.

There are no manual Item Level range overrides in loot-table entries. Existing `min_item_level` and `max_item_level` fields must be removed or retired from runtime authority.

## D5: Regular equipment loot flow

Regular equipment loot follows this order:

```text
Equipment roll
-> Item Level roll
-> Slot roll
-> Weighted Item Base selection from the monster pool
-> Rarity roll
-> Affix rolls
-> Item Score calculation
-> Persistence
```

`loot_tables` defines the Item Base pool available to each monster and the selection weight of each entry.

A kill can generate at most one regular Equipment Item. The regular Equipment roll is independent from the Unique/Set roll.

## D6: Missing eligible Item Base for a rolled slot

The slot is initially rolled using canonical slot weights.

If the rolled slot has no eligible Item Base in the monster's current pool, the slot is selected again only from slots that have at least one eligible Item Base. Relative weights of the remaining available slots are preserved.

A completely empty eligible pool is a configuration error. It is not treated as a valid no-item outcome after a successful Equipment roll.

## D7: Item Base qualification and Required Level

`Item Base.item_level` is the minimum Item Level at which that base becomes eligible.

A base may be selected only when:

```text
itemBase.itemLevel <= rolledItemLevel
```

The generated item's Required Level equals its rolled Item Level.

## D8: Full Inventory behavior

All loot rolls are performed normally even when the character's Inventory is full.

If no Inventory position is available:

- the Equipment Item is not persisted,
- the Victory settlement remains successful,
- independent rewards are still granted,
- the response includes the lost generated item,
- the loss reason is `InventoryFull`.

If a Unique/Set Item and a regular Item drop together, persistence priority is:

1. Unique/Set Item,
2. regular Item.

Each persisted Equipment Item occupies one Inventory position.

Unique/Set pity resets only when the generated Unique/Set Item is actually persisted in Inventory. A special item lost because of `InventoryFull` does not reset pity.

## D9: Rarity and affix count

For regular items, rarity controls only the number of affixes:

```text
Common: 0
Magic: 1
Rare: 2
Epic: 3
Legendary: 4
```

Rarity does not improve:

- base statistics,
- affix tiers,
- affix roll values,
- tier eligibility.

Affix-tier eligibility depends only on Item Level.

## D10: Item Score

Item Score is an internal integer measure of the quality of a specific generated item.

It must account for:

- `base_item_score`,
- Item Level,
- the actually rolled item-stat values,
- all actually rolled affixes.

Each statistic type may use its own scoring coefficient.

Item Score is calculated by one pure domain module and persisted as a non-negative `BIGINT`.

Rarity receives no arbitrary score bonus merely for its name. Its effect is indirect through the number of generated affixes.

Unique and Set Items are scored from their actually rolled fixed-stat values and do not use normal affix scoring records.

## D11: Roll values and numeric precision

All configured stat and affix ranges are rolled:

- uniformly,
- inclusively,
- as whole integer values.

For example, a range of `100-200` means that every integer from 100 through 200 has equal probability.

Runtime roll values do not store unnecessary decimal precision. Gold and Experience percentage bonuses are also stored and processed as whole percentage points for generated item rolls.

## D12: Independent reward systems

Victory runs these reward systems independently:

- Gold and Experience settlement from M6,
- regular Equipment roll,
- Other Loot roll,
- Unique/Set roll.

Failure of one roll does not disable the others.

One kill may generate at most:

- one regular Item,
- one Unique or Set Item.

## D13: Regular Equipment and rarity chances

Regular Equipment chance:

```text
Regular monster: 30%
Boss: 80%
```

Regular-monster rarity distribution:

```text
Common: 70%
Magic: 20%
Rare: 8%
Epic: 1.8%
Legendary: 0.2%
```

Boss rarity distribution:

```text
Common: 0%
Magic: 70%
Rare: 20%
Epic: 9%
Legendary: 1%
```

These are the canonical M7 defaults and remain server-authoritative and configurable.

## D14: Other Loot

Other Loot is an independent roll.

Canonical success chances:

```text
Regular monster: 70%
Boss: 90%
```

After success, exactly one eligible entry is selected from the weighted `other_loot_tables` pool. Quantity is rolled uniformly and inclusively from the selected entry's configured range.

M7 supports existing Material and Consumable definitions as Other Loot targets. Rewards are written to the appropriate storage and are independent from Equipment Inventory capacity.

## D15: Independent Unique/Set roll

Unique and Set Items use one shared, independent special-item roll.

This roll:

- does not replace the regular Equipment roll,
- may succeed on the same kill as the regular Equipment roll,
- generates at most one Unique or Set Item per kill.

Set Items are a special category within the same special-item reward system.

## D16: Unique/Set pity

Unique/Set pity is tracked separately for each character.

Canonical values:

```text
Starting chance: 0.1%
Increase: +0.1 percentage point per eligible kill
Maximum chance: 10%
```

A failed special-item roll increases pity.

Pity resets to `0.1%` only after a generated Unique/Set Item is successfully persisted in Inventory.

A successful roll whose item is lost because of `InventoryFull` does not reset pity.

## D17: Unique and Set eligibility

A Unique or Set Item is eligible only when:

- it belongs to the special pool available to the defeated monster or monster family,
- it satisfies boss-exclusive source restrictions,
- its `item_base.item_level` does not exceed the rolled Item Level,
- it fits the current progression range.

Selection among eligible special items is weighted.

Set Items may be associated with monster families.

## D18: Transactional loot settlement

Loot generation is part of the existing Victory settlement transaction.

The same transaction performs:

- all reward rolls,
- pity updates,
- `items` persistence,
- standard affix or fixed-stat roll persistence,
- Inventory assignment,
- Material and Consumable storage updates,
- settlement-response construction.

Defeat does not generate loot.

Unexpected generation or persistence failure rolls back the complete Victory settlement.

## D19: Server authority and RandomSource

The client cannot provide or control:

- random results,
- rarity,
- Item Level,
- Item Base selection,
- affixes,
- rolled stat values,
- Item Score,
- pity success or failure.

All random outcomes use the server-controlled injectable `RandomSource`.

Tests use deterministic RandomSource implementations.

## D20: Inventory locking and deterministic positions

Before persisting item rewards, the Victory transaction locks the character and the relevant Inventory state.

Free positions are assigned deterministically from the lowest available position number.

When two Equipment Items are generated in one settlement, persistence order is:

1. Unique/Set Item,
2. regular Item.

Concurrent transactions cannot assign the same position or exceed `inventory_capacity`.

## D21: Rollback and exactly-once protection

Each accepted terminal combat action can generate loot at most once.

Unexpected failure during generation or persistence rolls back the entire Victory settlement.

`InventoryFull` is an expected business result and does not trigger rollback.

Retries, stale actions, and concurrent requests cannot:

- create duplicate items,
- grant Material or Consumable storage twice,
- update pity twice.

## D22: Settlement response

The terminal Victory response contains complete loot results:

- M6 Experience and Gold results,
- regular Equipment result,
- Other Loot result,
- Unique/Set result,
- persisted items with their complete generated values,
- lost generated items and their loss reasons,
- Material and Consumable quantity changes,
- the current pity state needed by the Developer UI.

There is no separate `claim loot` endpoint.

## D23: Developer UI checkpoint

M7 must deliver a minimal maintained Developer UI that allows a human to:

- create or select a development Character,
- view eligible Monsters,
- start combat,
- submit basic attacks,
- see Victory or Defeat,
- inspect Experience, Gold, and level changes,
- inspect regular Equipment loot,
- inspect Unique/Set and Other Loot,
- see `InventoryFull` warnings.

The Developer UI is an integration surface, not the final production frontend.

M7 cannot be closed until this browser flow has been manually exercised in addition to automated verification.

## D24: One M7 migration and authored-data pipeline

M7 uses one complete migration for the generator foundation.

The migration includes at least:

- removal of the constraint that blocks identical affix templates on one item,
- `affix_position`,
- the authoritative Item Base to Affix weight table,
- conversion of `loot_tables` from individual drop chance to pool-selection weight,
- retirement of manual Item Level range authority,
- persistence for actual Unique and Set fixed-stat rolls,
- required constraints and indexes.

The workbook and importer must support every new authoritative authored-data structure.

The migration must pass on:

- the current development database,
- a newly created empty database.

## Final approval

M7 decisions D1 through D24 were approved as written before implementation planning began.

```

# ============================================================
# SOURCE: M7_SOURCE_AUDIT.md
# ============================================================

```text
# M7 Source Audit

## Milestone

M7: Item and Loot Generation

## Purpose

This document records the repository state verified before M7 implementation, identifies reusable foundations and missing components, defines layer boundaries, and preserves the approved M7 decisions D1-D24 as the authoritative planning contract.

This document does not implement M7.

## Audit basis

The audit used:

- branch and working-tree inspection,
- commit and remote synchronization inspection,
- repository structure inspection,
- source keyword inspection,
- migration inspection,
- authored-data importer inspection,
- existing M4-M6 planning artifacts,
- `M7_APPROVED_DECISIONS.md`.

---

# 1. Verified repository facts

## 1.1 Git state

At the time of inspection:

```text
Branch: m7/item-loot-generation
HEAD: f475675 prepare M7 developer UI integration
Remote: origin/m7/item-loot-generation
Working tree: clean
Ahead/behind: none reported
```

M6 is represented by the preceding completed commits, including:

```text
c273821 align project status after M6
8a83b30 complete M6 victory death and progression
ace0e16 complete M6 documentation
```

## 1.2 Planning artifacts

Before this planning checkpoint, no `M7_*` planning artifacts were present in the repository.

Reusable planning patterns exist for M4-M6, including:

```text
M6_SOURCE_AUDIT.md
M6_VERIFICATION_PLAN.md
M6_IMPLEMENTATION_PLAN.md
M6_MASTER_PROMPT.md
M6_TECHNICAL_DUMP.md
M6_SCHEMA_DATA_DUMP.md
```

The current milestone document is:

```text
documentation/game-design/CURRENT_MILESTONE.md
```

## 1.3 Source structure

The existing backend uses layered modules under:

```text
src/application
src/config
src/database
src/http
src/infrastructure
src/modules/characters
src/modules/combat
src/modules/monsters
src/modules/progression
```

No dedicated runtime loot-generation module was found during the source scan.

## 1.4 Existing combat and settlement foundation

The repository already contains:

- persistent combat sessions,
- terminal Victory and Defeat settlement,
- `resolve-combat-action.service.ts`,
- `applyVictorySettlement(...)`,
- settlement response models,
- transaction and exactly-once protections developed through M6,
- unit, PostgreSQL integration, and HTTP integration tests for combat settlement.

M7 must extend the existing Victory settlement. It must not create a second settlement path.

## 1.5 Existing inventory and equipment foundation

The repository already contains:

- character inventory capacity,
- `inventory_items`,
- equipment loadouts,
- equipment repository and PostgreSQL implementation,
- equipment-related domain errors,
- character-statistics aggregation from equipped Items, Item Bases and affixes.

The current character configuration includes 50 inventory slots.

## 1.6 Existing authored-data pipeline

The repository contains:

```text
scripts/import-game-data.ts
tests/unit/import-game-data.test.ts
game-data/workbooks/development-data.xlsx
```

The importer already provides:

- workbook validation,
- stable identity matching,
- reference resolution,
- schema-driven value conversion,
- transactional import,
- dry-run rollback,
- insert/update summaries.

The importer already supports sheets for:

```text
affix_templates
item_bases
loot_tables
other_loot_tables
unique_templates
set_templates
```

---

# 2. Verified database foundation

Relevant existing migrations include:

```text
008_unique_templates.sql
009_set_templates.sql
017_item_bases.sql
018_affix_templates.sql
019_items.sql
029_inventory_items.sql
030_material_storage.sql
031_consumable_storage.sql
032_equipment_loadouts.sql
033_item_affixes.sql
034_set_bonuses.sql
056_loot_tables.sql
057_other_loot_tables.sql
058_unique_pity_tracking.sql
060_set_progress.sql
082_add_item_handedness.sql
089_victory_death_progression.sql
```

## 2.1 `item_bases`

The table already stores:

- Unique and Set template references,
- Item Level and Required Level fields,
- slot and weapon type,
- base stat values,
- Gold and Experience percentage values,
- `base_item_score`,
- boss-exclusive, Unique and Set flags.

Verified mismatch with M7:

- the historical `required_level` on Item Base cannot remain runtime authority for generated copies because D7 requires generated Required Level to equal rolled Item Level;
- base and percentage fields use decimal numeric types although D11 requires generated roll values to be whole integers;
- Item Base alone does not define the authoritative weighted Affix pool required by D2.

## 2.2 `affix_templates`

The table already stores:

- stat category,
- tier,
- minimum required Item Level,
- configured minimum and maximum roll values.

Verified mismatch with M7:

- configured ranges use decimal numeric columns although D11 requires whole-integer generated values;
- no Item Base association weight exists.

## 2.3 `items`

The table already stores:

- Item Base reference,
- generated Item Level,
- rarity,
- non-negative BIGINT Item Score,
- lock state.

This table is reusable for generated Item identity and shared metadata.

## 2.4 `item_affixes`

The table already stores:

- Item reference,
- Affix Template reference,
- rolled value.

Verified direct conflict with D1:

```sql
UNIQUE (item_id, affix_template_id)
```

This blocks repeated identical affixes. M7 must remove it, add stable `affix_position`, and enforce uniqueness of position within an Item.

## 2.5 `loot_tables`

The table already links Monsters to Item Bases.

Verified fields include:

```text
drop_chance_percent
min_item_level
max_item_level
loot_level_modifier
is_enabled
```

Verified direct conflict with D4, D5 and D24:

- regular-equipment success chance is not an individual entry chance;
- Item Base entries form a weighted pool after the independent Equipment roll;
- manual minimum and maximum Item Level fields cannot remain runtime authority;
- the entry needs positive selection weight semantics.

## 2.6 `other_loot_tables`

The table already supports exactly one target per row:

- Material, or
- Consumable definition.

It also stores quantity ranges and an individual chance field.

Verified M7 change:

- D14 defines one independent system-level success roll followed by selection of exactly one entry from a weighted pool;
- the current individual `drop_chance_percent` semantics must become pool-selection weight semantics.

## 2.7 `unique_pity_tracking`

The table already stores per-character:

- eligible kill count,
- current percentage chance,
- last Unique drop timestamp,
- last Set drop timestamp.

It is a reusable foundation but runtime behavior required by D16 is not implemented.

## 2.8 Missing M7 database structures

The audit did not find:

- authoritative Item Base to Affix weighted links,
- persistence for actual rolled fixed stats of generated Unique and Set Items,
- clearly verified weighted special-item source pools satisfying D17,
- `affix_position`.

---

# 3. Runtime implementation findings

## 3.1 Reusable runtime components

M7 can reuse:

- combat action orchestration,
- Victory transaction boundary,
- character and combat locking patterns,
- inventory and equipment persistence patterns,
- Material and Consumable storage tables,
- settlement response serialization patterns,
- injected testing patterns used by combat and progression,
- importer transaction and validation architecture.

## 3.2 Missing runtime components

The audit did not identify an implemented, authoritative runtime component for:

- independent regular Equipment success roll,
- canonical Item Level calculation and roll,
- canonical weighted slot selection,
- eligible Item Base filtering and weighted selection,
- rarity roll,
- Affix eligibility and weighted repeated selection,
- per-slot Affix value roll,
- Item Score calculation,
- independent Other Loot roll and weighted selection,
- independent Unique/Set roll,
- Unique/Set fixed-stat generation,
- Unique/Set pity mutation,
- InventoryFull loss result,
- Unique/Set-first persistence ordering,
- complete M7 settlement-response construction.

These are planned implementation changes, not existing facts.

---

# 4. Required layer boundaries

## 4.1 Domain

The domain layer must own pure rules and calculations, including:

- Item Level range and uniform inclusive integer selection,
- eligibility filtering,
- weighted selection from already-authorized candidates,
- rarity outcome and Affix count,
- Affix tier eligibility,
- Affix value generation,
- Unique/Set fixed-stat generation,
- Item Score calculation,
- immutable generated-item result models.

The domain layer must not perform SQL, HTTP serialization or transaction control.

## 4.2 Application

The application layer must own orchestration, including:

- independent reward-system execution,
- loading authoritative generation context,
- invoking domain generators in D5 order,
- coordinating regular Item, Other Loot and Unique/Set results,
- enforcing Unique/Set-first persistence priority,
- converting InventoryFull into an expected business result,
- returning complete settlement data.

## 4.3 Infrastructure

The infrastructure layer must own:

- SQL reads of authored pools and configuration,
- character and inventory locking,
- Item, Affix and fixed-stat persistence,
- deterministic lowest-free-position assignment,
- Material and Consumable upserts,
- pity reads and updates,
- transaction participation and rollback.

## 4.4 HTTP

The HTTP layer must own:

- serialization of generated and persisted loot results,
- serialization of lost Items and reasons,
- BIGINT and timestamp representation consistent with existing conventions,
- preservation of authorization and ownership isolation.

It must not perform loot rolls or accept client-authored outcomes.

## 4.5 Authored-data pipeline

The workbook and importer must be the supported authored-data path for every new authoritative M7 structure. Validation must reject invalid references, invalid weights, invalid ranges and invalid identities before partial import.

## 4.6 Developer UI

The Developer UI is an integration surface. It must consume only server-authoritative HTTP results and must not reproduce generation rules in the browser.

---

# 5. Required changes by area

## Database

One M7 migration must cover at least:

- removal of `UNIQUE (item_id, affix_template_id)`,
- addition of `affix_position`,
- addition of `UNIQUE (item_id, affix_position)`,
- creation of authoritative Item Base to Affix weight storage,
- conversion of `loot_tables` to selection-weight semantics,
- retirement of manual Item Level range authority,
- persistence for actual rolled Unique/Set fixed stats,
- required constraints and indexes,
- any special-pool structure proven necessary by D17.

## Domain

Add pure, deterministic generation and scoring logic using injected `RandomSource`.

## Application

Extend Victory settlement with all independent M7 reward systems without changing Defeat loot behavior.

## Infrastructure

Extend the current repository and transaction implementation for locking, generation-context reads and reward persistence.

## HTTP

Extend terminal Victory settlement output according to D22. Do not add a claim-loot endpoint.

## Tests

Add unit, database integration, concurrency, rollback, HTTP, importer, workbook and manual Developer UI coverage. Detailed gates belong to `M7_VERIFICATION_PLAN.md`.

## Importer and workbook

Add every new authoritative table and relationship introduced by the M7 migration, including positive weights and valid integer ranges.

## Developer UI

Provide and manually exercise the complete D23 browser flow before M7 closure.

---

# 6. Facts versus planned changes

## Verified facts

- The M6 Victory settlement pipeline exists.
- Inventory and equipment persistence foundations exist.
- Existing Item, Affix, loot-table, Other Loot and pity tables exist.
- The current Affix uniqueness constraint prevents D1 behavior.
- `item_base_affix_weights` does not exist.
- Current loot-table fields encode obsolete M7 runtime authority.
- The importer already supports multiple relevant authored tables and is extensible.
- No complete runtime M7 generator was found.

## Planned changes

- Exact TypeScript class and file names.
- Exact internal repository interface boundaries.
- Final name of Unique/Set rolled-stat persistence tables.
- Final representation of special-item source pools.
- Final scoring coefficients and their authored-data location.
- Final configuration location for system-level chances and slot/rarity weights.
- Exact Developer UI file structure.

These planned details must be fixed by the implementation plan without reopening D1-D24.

---

# 7. Approved decisions D1-D24

## D1: Independent affix slots and duplicates

Each affix slot is rolled independently.

The same `affix_type`, `tier`, and `affix_template_id` may appear multiple times on one item. A Legendary item may therefore receive four copies of Attack Tier 4.

Each occurrence has:

- its own `item_affix_id`,
- its own `roll_value`,
- a stable `affix_position`.

M7 removes the constraint `UNIQUE (item_id, affix_template_id)` and replaces it with uniqueness of the affix position within an item.

## D2: Authoritative Item Base to Affix weight table

M7 introduces a separate table linking Item Bases with Affix Templates.

Each link stores a positive selection weight. The generator selects an affix from the eligible weighted pool configured for the selected Item Base.

A selected affix remains in the pool for subsequent affix slots. Item Base weights are the authoritative source for weighted affix generation.

## D3: Unique and Set Item stat rolls

Unique Items and Set Items do not use normal affixes.

Each specific Unique or Set Item has a fixed set of stat categories. Generation rolls only the values of those predefined stats within their configured inclusive ranges.

Every generated copy contains all configured stat categories, while their values may differ. Unique and Set Items do not create `item_affixes` records.

## D4: Canonical loot Item Level formula

```text
effectiveLootLevel = monsterLevel + bossBonusLootLevel
minimumItemLevel = max(1, effectiveLootLevel - 10)
maximumItemLevel = effectiveLootLevel + 5
```

Item Level is rolled uniformly and inclusively from this range.

Regular monsters use `bossBonusLootLevel = 0`.

There are no manual Item Level range overrides in loot-table entries. Existing `min_item_level` and `max_item_level` fields must be removed or retired from runtime authority.

## D5: Regular equipment loot flow

```text
Equipment roll
-> Item Level roll
-> Slot roll
-> Weighted Item Base selection from the monster pool
-> Rarity roll
-> Affix rolls
-> Item Score calculation
-> Persistence
```

`loot_tables` defines the Item Base pool available to each monster and the selection weight of each entry.

A kill can generate at most one regular Equipment Item. The regular Equipment roll is independent from the Unique/Set roll.

## D6: Missing eligible Item Base for a rolled slot

The slot is initially rolled using canonical slot weights.

If the rolled slot has no eligible Item Base in the monster's current pool, the slot is selected again only from slots that have at least one eligible Item Base. Relative weights of the remaining available slots are preserved.

A completely empty eligible pool is a configuration error. It is not treated as a valid no-item outcome after a successful Equipment roll.

## D7: Item Base qualification and Required Level

`Item Base.item_level` is the minimum Item Level at which that base becomes eligible.

A base may be selected only when:

```text
itemBase.itemLevel <= rolledItemLevel
```

The generated item's Required Level equals its rolled Item Level.

## D8: Full Inventory behavior

All loot rolls are performed normally even when the character's Inventory is full.

If no Inventory position is available:

- the Equipment Item is not persisted,
- the Victory settlement remains successful,
- independent rewards are still granted,
- the response includes the lost generated item,
- the loss reason is `InventoryFull`.

If a Unique/Set Item and a regular Item drop together, persistence priority is:

1. Unique/Set Item,
2. regular Item.

Each persisted Equipment Item occupies one Inventory position.

Unique/Set pity resets only when the generated Unique/Set Item is actually persisted in Inventory. A special item lost because of `InventoryFull` does not reset pity.

## D9: Rarity and affix count

```text
Common: 0
Magic: 1
Rare: 2
Epic: 3
Legendary: 4
```

Rarity does not improve base statistics, Affix tiers, Affix roll values or tier eligibility. Affix-tier eligibility depends only on Item Level.

## D10: Item Score

Item Score is an internal integer measure of the quality of a specific generated item.

It must account for:

- `base_item_score`,
- Item Level,
- actually rolled item-stat values,
- all actually rolled Affixes.

Each statistic type may use its own scoring coefficient.

Item Score is calculated by one pure domain module and persisted as a non-negative `BIGINT`.

Rarity receives no arbitrary score bonus merely for its name. Unique and Set Items are scored from their actually rolled fixed-stat values and do not use normal Affix scoring records.

## D11: Roll values and numeric precision

All configured stat and Affix ranges are rolled uniformly, inclusively and as whole integer values.

Runtime roll values do not store unnecessary decimal precision. Gold and Experience percentage bonuses are also stored and processed as whole percentage points for generated Item rolls.

## D12: Independent reward systems

Victory runs independently:

- Gold and Experience settlement from M6,
- regular Equipment roll,
- Other Loot roll,
- Unique/Set roll.

Failure of one roll does not disable the others.

One kill may generate at most one regular Item and one Unique or Set Item.

## D13: Regular Equipment and rarity chances

Regular Equipment chance:

```text
Regular monster: 30%
Boss: 80%
```

Regular-monster rarity distribution:

```text
Common: 70%
Magic: 20%
Rare: 8%
Epic: 1.8%
Legendary: 0.2%
```

Boss rarity distribution:

```text
Common: 0%
Magic: 70%
Rare: 20%
Epic: 9%
Legendary: 1%
```

These are canonical M7 defaults and remain server-authoritative and configurable.

## D14: Other Loot

Other Loot is an independent roll.

Canonical success chances:

```text
Regular monster: 70%
Boss: 90%
```

After success, exactly one eligible entry is selected from the weighted `other_loot_tables` pool. Quantity is rolled uniformly and inclusively from the selected entry's configured range.

M7 supports existing Material and Consumable definitions as Other Loot targets. Rewards are written to the appropriate storage and are independent from Equipment Inventory capacity.

## D15: Independent Unique/Set roll

Unique and Set Items use one shared, independent special-item roll.

It does not replace the regular Equipment roll, may succeed on the same kill, and generates at most one Unique or Set Item per kill.

Set Items are a special category within the same special-item reward system.

## D16: Unique/Set pity

Unique/Set pity is tracked separately for each character.

```text
Starting chance: 0.1%
Increase: +0.1 percentage point per eligible kill
Maximum chance: 10%
```

A failed special-item roll increases pity.

Pity resets to `0.1%` only after a generated Unique/Set Item is successfully persisted in Inventory.

A successful roll whose Item is lost because of `InventoryFull` does not reset pity.

## D17: Unique and Set eligibility

A Unique or Set Item is eligible only when:

- it belongs to the special pool available to the defeated Monster or Monster Family,
- it satisfies boss-exclusive source restrictions,
- its `item_base.item_level` does not exceed the rolled Item Level,
- it fits the current progression range.

Selection among eligible special Items is weighted. Set Items may be associated with Monster Families.

## D18: Transactional loot settlement

Loot generation is part of the existing Victory settlement transaction.

The same transaction performs:

- all reward rolls,
- pity updates,
- `items` persistence,
- standard Affix or fixed-stat roll persistence,
- Inventory assignment,
- Material and Consumable storage updates,
- settlement-response construction.

Defeat does not generate loot.

Unexpected generation or persistence failure rolls back the complete Victory settlement.

## D19: Server authority and RandomSource

The client cannot provide or control random results, rarity, Item Level, Item Base selection, Affixes, rolled stat values, Item Score, or pity outcomes.

All random outcomes use server-controlled injectable `RandomSource`. Tests use deterministic implementations.

## D20: Inventory locking and deterministic positions

Before persisting Item rewards, the Victory transaction locks the character and relevant Inventory state.

Free positions are assigned deterministically from the lowest available position number.

When two Equipment Items are generated, persistence order is:

1. Unique/Set Item,
2. regular Item.

Concurrent transactions cannot assign the same position or exceed `inventory_capacity`.

## D21: Rollback and exactly-once protection

Each accepted terminal combat action can generate loot at most once.

Unexpected failure during generation or persistence rolls back the entire Victory settlement.

`InventoryFull` is an expected business result and does not trigger rollback.

Retries, stale actions and concurrent requests cannot create duplicate Items, grant Material or Consumable storage twice, or update pity twice.

## D22: Settlement response

The terminal Victory response contains complete loot results:

- M6 Experience and Gold results,
- regular Equipment result,
- Other Loot result,
- Unique/Set result,
- persisted Items with complete generated values,
- lost generated Items and loss reasons,
- Material and Consumable quantity changes,
- current pity state needed by Developer UI.

There is no separate `claim loot` endpoint.

## D23: Developer UI checkpoint

M7 must deliver a minimal maintained Developer UI that allows a human to:

- create or select a development Character,
- view eligible Monsters,
- start combat,
- submit basic attacks,
- see Victory or Defeat,
- inspect Experience, Gold and level changes,
- inspect regular Equipment loot,
- inspect Unique/Set and Other Loot,
- see `InventoryFull` warnings.

The Developer UI is an integration surface, not the final production frontend.

M7 cannot be closed until this browser flow has been manually exercised in addition to automated verification.

## D24: One M7 migration and authored-data pipeline

M7 uses one complete migration for the generator foundation.

The migration includes at least:

- removal of the constraint blocking identical Affix Templates on one Item,
- `affix_position`,
- the authoritative Item Base to Affix weight table,
- conversion of `loot_tables` from individual drop chance to pool-selection weight,
- retirement of manual Item Level range authority,
- persistence for actual Unique and Set fixed-stat rolls,
- required constraints and indexes.

The workbook and importer must support every new authoritative authored-data structure.

The migration must pass on the current development database and a newly created empty database.

---

# 8. Audit conclusion

The repository provides a viable M7 foundation. M6 settlement, existing inventory/equipment persistence, schema foundations and the generic importer are reusable.

M7 is not a greenfield Item system, but the runtime generation and settlement integration are still missing. The principal verified schema conflicts are the current Affix uniqueness constraint, missing Item Base to Affix weighted links, obsolete loot-table Item Level/chance authority, and missing persistence for actual Unique/Set fixed-stat rolls.

No verified repository fact requires reopening D1-D24. Implementation planning must preserve them exactly.

```

# ============================================================
# SOURCE: M7_VERIFICATION_PLAN.md
# ============================================================

```text
# M7 Verification Plan

## Milestone

M7: Item and Loot Generation

## Purpose

This plan defines the mandatory verification gates for M7. It converts the approved decisions D1-D24 from `M7_SOURCE_AUDIT.md` and `M7_APPROVED_DECISIONS.md` into executable checks.

M7 is complete only when every mandatory gate passes, the required Developer UI flow is manually verified, the planning and implementation documentation matches the delivered behavior, and the repository is committed, pushed and clean.

## Verification principles

- Verify behavior, not only file structure.
- Treat D1-D24 as authoritative.
- Use deterministic unit tests for generation rules, formulas, weighted selection, scoring and result construction.
- All random outcomes must use the server-controlled injectable `RandomSource`.
- Use PostgreSQL integration tests for migrations, constraints, transactions, locks, concurrency, rollback and exactly-once behavior.
- Use authenticated HTTP integration tests for settlement serialization, ownership isolation and server authority.
- Verify regular Equipment, Other Loot, Unique/Set, Gold and Experience as independent reward systems.
- Treat `InventoryFull` as an expected business result, not a transaction failure.
- Verify generated roll values as whole integers and Item Score as non-negative `BIGINT`.
- Defeat must never generate loot or update Unique/Set pity.
- Do not introduce a separate claim-loot endpoint.
- Applied migrations and current database constraints are authoritative over stale generated metadata.
- Preserve all M1-M6 guarantees.

## Required verification commands

The implementation phase must identify and run the repository's canonical scripts for:

```text
PostgreSQL connection
Migration status
Clean-database migration run
Workbook validation
Workbook dry run
Workbook import
TypeScript typecheck
Production build
Unit tests
PostgreSQL integration tests
HTTP integration tests
Full regression suite
Developer UI build and start
Git diff validation
Git working-tree status
```

Do not invent replacement commands when canonical package scripts already exist.

---

## Gate V1: Baseline before implementation

Before modifying M7 runtime behavior, verify:

- branch is `m7/item-loot-generation`,
- branch tracks `origin/m7/item-loot-generation`,
- migrations 001 through 089 are applied,
- pending migrations equal 0,
- PostgreSQL connection passes,
- M6 unit, PostgreSQL integration and HTTP integration tests pass,
- full pre-M7 regression passes,
- typecheck passes,
- production build passes,
- working tree contains only intentional M7 planning artifacts.

Record:

- branch and HEAD,
- applied and pending migration counts,
- test-file and test counts reported by canonical tools,
- build and typecheck results,
- working-tree status.

---

## Gate V2: One complete M7 migration

Create exactly one M7 generator-foundation migration after 089.

Verify that it includes at least:

- removal of `UNIQUE (item_id, affix_template_id)`,
- addition of non-null `affix_position` for valid persisted Affixes,
- uniqueness of `(item_id, affix_position)`,
- a positive and bounded position rule suitable for the maximum four regular Affixes,
- authoritative Item Base to Affix Template weighted links,
- strictly positive selection weights,
- conversion of `loot_tables` from individual drop chance to pool-selection weight,
- retirement of `min_item_level` and `max_item_level` as runtime authority,
- retirement of obsolete per-entry equipment chance authority,
- M7-compatible weighted Other Loot semantics,
- persistence for actual rolled Unique/Set fixed-stat values,
- structures required for weighted special-item eligibility by Monster or Monster Family,
- required foreign keys, unique constraints, checks and indexes,
- integer-compatible generated roll ranges where required by D11.

### Existing-data migration

Verify on the current development database:

- existing Affixes receive deterministic, stable positions,
- no two Affixes on one Item receive the same position,
- existing Item, Inventory and Equipment references remain valid,
- existing loot rows are converted without silent loss,
- invalid legacy data causes a clear migration failure rather than silent repair,
- migration history records exactly one new migration.

### Clean-database migration

Verify:

- migrations 001 through the M7 migration apply on a newly created empty database,
- pending migrations equal 0 afterward,
- all M7 tables and constraints match the intended schema,
- failed migration execution leaves no partial M7 schema,
- migration execution is transactional.

---

## Gate V3: Workbook and importer

Verify the workbook and `scripts/import-game-data.ts` support every new authoritative M7 structure.

Required coverage includes:

- Item Base to Affix weights,
- converted regular loot-table weights,
- converted Other Loot weights,
- Unique/Set fixed-stat definitions and integer ranges,
- weighted special-item source pools,
- any authored Item Score coefficients or generator configuration introduced by the implementation plan.

### Validation rejection cases

Reject:

- missing required worksheet,
- missing required header,
- duplicate authored identity,
- unknown Item Base, Affix, Monster, Monster Family, Material, Consumable, Unique or Set reference,
- zero or negative selection weight,
- decimal value in an integer-only roll range,
- minimum greater than maximum,
- invalid stat category,
- regular Item Base without an eligible Affix pool when authored as affix-capable,
- special Item without its required fixed-stat definition,
- row targeting mutually exclusive sources simultaneously where prohibited.

### Import behavior

Verify:

- validation-only mode performs no database writes,
- dry run performs all mapping and SQL checks then rolls back,
- successful import inserts new rows,
- repeat import updates by stable identity without duplicates,
- failed import rolls back all authored-data changes,
- importer fails clearly when the M7 migration is unavailable,
- workbook content remains sufficient for deterministic integration tests and Developer UI verification.

---

## Gate V4: RandomSource contract and integer rolls

Verify one injectable server-controlled `RandomSource` is used by all M7 random operations.

Test uniform inclusive integer selection for:

- Item Level,
- regular Affix values,
- Unique/Set fixed-stat values,
- Other Loot quantity.

Required cases:

- minimum result,
- maximum result,
- equal minimum and maximum,
- negative or reversed invalid ranges rejected,
- non-integer range rejected,
- RNG value outside its declared contract rejected,
- no use of `Math.random()` or client-provided random values in M7 runtime paths,
- deterministic test sequences reproduce the same complete loot result.

Verify generated roll persistence does not retain unnecessary decimal precision.

---

## Gate V5: Canonical Item Level

Verify pure calculation:

```text
effectiveLootLevel = monsterLevel + bossBonusLootLevel
minimumItemLevel = max(1, effectiveLootLevel - 10)
maximumItemLevel = effectiveLootLevel + 5
```

Required cases:

- regular Monster uses boss bonus 0,
- Boss uses authoritative `bossBonusLootLevel`,
- minimum clamps to 1,
- maximum is inclusive,
- minimum is inclusive,
- all valid intermediate Item Levels can be selected by deterministic RNG,
- invalid monster level or negative boss bonus is rejected by the appropriate boundary,
- loot-table minimum and maximum values cannot override the formula,
- one regular and one special Item generated on the same kill use the intended authoritative Item Level context defined by implementation planning.

---

## Gate V6: Regular Equipment success and canonical order

Verify canonical success chances:

```text
Regular Monster: 30%
Boss: 80%
```

Test boundary outcomes immediately below, at and above the chosen integer probability threshold representation.

For a successful roll, verify observable generation order:

```text
Equipment success
Item Level
slot
eligible weighted Item Base
rarity
Affixes
Item Score
persistence
```

Verify:

- failed Equipment roll creates no regular Item and consumes no later regular-item random draws,
- successful Equipment roll generates exactly one regular Item or raises a configuration error,
- no kill generates more than one regular Item,
- Unique/Set success neither suppresses nor replaces regular Equipment,
- regular Item failure does not disable Gold, Experience, Other Loot or Unique/Set processing,
- Boss classification comes from authoritative server state.

---

## Gate V7: Slot selection and missing-slot fallback

Verify canonical slot weights configured by the server.

Test:

- initial selection across every supported Equipment slot,
- rolled slot with at least one eligible Item Base is preserved,
- rolled slot with no eligible Item Base triggers fallback selection,
- fallback pool contains only slots with at least one eligible Item Base,
- relative weights of remaining slots are preserved,
- ineligible slots consume no fallback probability mass,
- one available slot is selected deterministically,
- completely empty eligible pool raises a configuration error after successful Equipment roll,
- empty pool is not returned as a normal no-item outcome,
- configuration error rolls back the complete Victory settlement.

---

## Gate V8: Item Base qualification and weighted selection

Verify a regular Item Base is eligible only when:

- it belongs to the defeated Monster's `loot_tables` pool,
- the entry is enabled,
- slot matches the selected slot,
- `itemBase.itemLevel <= rolledItemLevel`,
- the Item Base is a regular base rather than a Unique/Set definition,
- selection weight is positive.

Test:

- exact minimum Item Level qualifies,
- one level below does not qualify,
- disabled entry does not qualify,
- entry from another Monster does not qualify,
- weighted boundaries select the expected first and last candidates,
- total-weight arithmetic is deterministic and overflow-safe,
- zero or negative weight is rejected by schema/import validation,
- Required Level returned for the generated copy equals rolled Item Level and is not inherited from stale Item Base authority.

---

## Gate V9: Rarity and Affix count

Verify canonical rarity distributions.

Regular Monster:

```text
Common 70%
Magic 20%
Rare 8%
Epic 1.8%
Legendary 0.2%
```

Boss:

```text
Common 0%
Magic 70%
Rare 20%
Epic 9%
Legendary 1%
```

Verify exact threshold boundaries using the chosen integer probability scale.

Verify Affix counts:

```text
Common 0
Magic 1
Rare 2
Epic 3
Legendary 4
```

Also verify:

- Boss cannot roll Common under canonical defaults,
- rarity adds no direct base-stat bonus,
- rarity adds no direct Affix-tier bonus,
- rarity adds no direct Affix-value bonus,
- rarity adds no arbitrary Item Score bonus,
- only the number of Affix slots changes with rarity.

---

## Gate V10: Affix eligibility and weighted generation

For each regular Affix slot, verify eligibility requires:

- a link in authoritative Item Base to Affix weights,
- positive weight,
- `affix_template.required_item_level <= rolledItemLevel`,
- valid configured integer range.

Verify:

- selection is weighted using Item Base-specific weights,
- no global unlinked Affix can be selected,
- minimum eligible tier boundary works,
- one level below required Item Level excludes the template,
- selected Affix remains in the pool for later slots,
- each slot performs an independent selection,
- roll value is uniform, inclusive and whole,
- each occurrence receives its own generated value,
- an insufficient or empty eligible Affix pool for a non-Common Item is treated as configuration failure rather than silently reducing Affix count,
- failure rolls back the Victory settlement.

---

## Gate V11: Duplicate Affixes and stable positions

Generate Items that contain repeated identical Affixes.

Required case:

```text
Legendary Item
Attack Tier 4
Attack Tier 4
Attack Tier 4
Attack Tier 4
```

Verify:

- all four records persist,
- each has a distinct `item_affix_id`,
- all may share the same `affix_template_id`, Affix type and tier,
- each has its own `roll_value`,
- positions are stable and ordered,
- positions are unique within the Item,
- the same position may be reused by another Item,
- duplicate `(item_id, affix_template_id)` is allowed,
- duplicate `(item_id, affix_position)` is rejected,
- retrieval and HTTP serialization preserve all occurrences and their positions,
- equipped-character statistics aggregate every duplicate occurrence.

---

## Gate V12: Item Score

Test one pure Item Score module.

Verify regular Item scoring includes:

- `base_item_score`,
- rolled Item Level contribution,
- actually rolled item-stat values where applicable,
- every actually rolled Affix value,
- stat-specific coefficients.

Verify Unique/Set scoring includes:

- `base_item_score`,
- Item Level contribution,
- every actually rolled fixed-stat value,
- no normal `item_affixes` contribution.

Required cases:

- Common Item,
- one through four Affixes,
- repeated identical Affixes counted separately,
- same rarity with different rolls produces score differences according to coefficients,
- rarity name alone contributes zero,
- deterministic exact expected scores,
- non-negative BIGINT persistence,
- overflow is rejected before persistence,
- there is only one authoritative runtime scoring implementation.

---

## Gate V13: Other Loot

Verify independent success chances:

```text
Regular Monster: 70%
Boss: 90%
```

After success, verify:

- exactly one enabled eligible entry is selected,
- selection uses weighted `other_loot_tables` semantics,
- Material target writes to Material storage,
- Consumable target writes to Consumable storage,
- exactly one target type exists per entry,
- quantity is uniform and inclusive,
- minimum and maximum quantity boundaries work,
- Inventory capacity does not affect Other Loot,
- no eligible entry after a successful system roll is a configuration error,
- storage upsert is atomic with Victory settlement,
- failure, stale action or retry cannot grant quantity twice,
- Other Loot failure result does not suppress regular Equipment or Unique/Set rolls unless an unexpected error triggers full rollback.

---

## Gate V14: Unique/Set eligibility and weighted selection

Verify a special Item is eligible only when:

- it belongs to an allowed Monster or Monster Family special pool,
- source restrictions are satisfied,
- boss-exclusive Item is not available from an invalid source,
- its Item Base minimum Item Level does not exceed rolled Item Level,
- progression range criteria configured by M7 are satisfied,
- entry is enabled and has positive weight.

Test:

- direct Monster eligibility,
- Monster Family eligibility for Set Items,
- boss-exclusive acceptance and rejection,
- exact Item Level boundary,
- one-level-below rejection,
- weighted first and last candidate boundaries,
- no eligible candidate behavior is explicitly distinguished from a failed roll according to the implementation contract,
- at most one Unique or Set Item is selected per kill,
- Unique and Set share one special-item roll.

---

## Gate V15: Unique/Set fixed-stat generation

Verify Unique and Set Items do not use normal Affixes.

For each generated special Item:

- every configured fixed stat category is present exactly once,
- no unconfigured category is added,
- value is uniform, inclusive and whole,
- equal minimum and maximum produces the fixed value,
- separate copies may receive different values,
- zero configured stat categories is rejected for an authored special Item if the implementation contract requires at least one,
- duplicate fixed-stat category for one template is rejected,
- no `item_affixes` rows are created,
- actual rolled values persist in the M7 fixed-stat persistence structure,
- retrieval and HTTP responses expose complete generated values,
- Item Score uses these actual values.

---

## Gate V16: Unique/Set pity

Verify per-character starting state:

```text
0.1%
```

Verify failed eligible special rolls:

- increase chance by 0.1 percentage point,
- never exceed 10%,
- increment only once per eligible Victory,
- remain isolated per character.

Verify successful and persistence outcomes:

- successful persisted Unique resets chance to 0.1%,
- successful persisted Set resets chance to 0.1%,
- success lost to `InventoryFull` does not reset pity,
- pity state after lost success follows the approved implementation interpretation without contradicting D16,
- unexpected rollback restores prior pity,
- Defeat does not update pity,
- ineligible kill does not update pity,
- duplicate settlement does not update pity twice,
- concurrent terminal requests cannot double-increment or double-reset pity,
- response contains current committed pity state.

---

## Gate V17: Full Inventory and persistence priority

Run all loot rolls normally with zero free Inventory positions.

Verify for each generated Equipment Item:

- Item is fully generated before capacity handling,
- Item and child roll rows are not persisted,
- response includes the complete lost generated Item,
- reason is exactly `InventoryFull`,
- Victory remains successful,
- Gold, Experience and Other Loot still persist,
- `InventoryFull` does not trigger rollback.

Generate regular and Unique/Set Items together.

Verify with:

- zero free positions: both lost, special processed first, pity not reset,
- one free position: Unique/Set persists, regular is lost,
- two free positions: Unique/Set takes lower free position, regular takes next free position,
- more free positions: same deterministic ordering,
- every persisted Equipment Item consumes exactly one position.

---

## Gate V18: Inventory locking and deterministic positions

Verify the Victory transaction locks the character and relevant Inventory state before Item persistence.

Test:

- lowest available position is selected,
- gaps are reused from the lowest number,
- occupied positions are never overwritten,
- capacity boundary permits exactly the last free position,
- no position greater than capacity is assigned,
- concurrent settlements for the same character cannot share a position,
- concurrent settlements cannot exceed capacity,
- waiting transaction observes committed state before assigning positions,
- rollback releases locks and leaves positions unchanged,
- another character's Inventory remains independent.

---

## Gate V19: Transactional Victory settlement

For terminal Victory, verify one transaction includes:

- M6 Gold and Experience settlement,
- regular Equipment roll,
- Other Loot roll,
- Unique/Set roll,
- pity mutation,
- Item persistence,
- Affix or fixed-stat persistence,
- Inventory assignment,
- Material or Consumable storage change,
- complete settlement-response construction,
- final session settlement.

Verify:

- Defeat performs none of the M7 loot mutations,
- generated database rows match the returned response,
- session cannot be terminally committed before loot persistence completes,
- server-authoritative Monster, Boss, pool, Item and Inventory state is used,
- independent failed chance rolls are normal outcomes,
- configuration or persistence errors roll back the whole Victory.

---

## Gate V20: Exactly-once and concurrency

Test two concurrent requests ending the same combat turn.

Required result:

- one request commits,
- the competing request is rejected by existing stale-turn or terminal-session protection,
- one regular Equipment result at most,
- one Unique/Set result at most,
- one Other Loot grant at most,
- one pity mutation,
- no duplicate Item, Affix, fixed-stat or Inventory rows,
- M6 Gold and Experience remain exactly once,
- one committed settlement response.

Also verify:

- retrying an already accepted terminal action performs no value-producing mutation,
- stale requests do not consume RandomSource or update pity,
- concurrent requests for different characters remain independent.

---

## Gate V21: Rollback matrix

Inject an unexpected failure at each important stage:

- load generation context,
- regular Equipment generation,
- regular Item persistence,
- Affix persistence,
- Unique/Set generation,
- fixed-stat persistence,
- Inventory assignment,
- Other Loot storage update,
- pity update,
- Item Score validation,
- settlement-response construction where it participates in the transaction,
- final combat-session update.

After every failure verify:

- combat session remains unsettled according to existing M6 rollback contract,
- terminal action events are rolled back,
- Experience and Gold are unchanged,
- Items are unchanged,
- Affixes and fixed-stat rolls are unchanged,
- Inventory is unchanged,
- Material and Consumable storage is unchanged,
- pity is unchanged,
- M6 progression and statistics mutations are unchanged,
- no partial response is treated as committed.

Control case:

- `InventoryFull` does not trigger this rollback behavior.

---

## Gate V22: Settlement response and HTTP contract

### Continuing action

Verify existing continuing-action response remains compatible and contains no terminal loot settlement.

### Victory

Verify terminal response includes:

- M6 Experience and Gold results,
- regular Equipment outcome,
- Other Loot outcome,
- Unique/Set outcome,
- complete persisted generated Items,
- complete lost generated Items,
- `InventoryFull` loss reasons,
- Material or Consumable quantity changes,
- committed current pity state.

Each generated Item response must expose sufficient data to inspect:

- Item identity when persisted,
- Item Base,
- Item Level,
- Required Level,
- rarity or special category,
- Item Score,
- regular Affixes with positions and values, or special fixed stats,
- persisted versus lost status.

### Defeat

Verify no Equipment, Other Loot or Unique/Set reward is produced and pity is unchanged.

### Serialization and security

Verify:

- BIGINT values follow existing string serialization conventions,
- unknown ownership remains undisclosed,
- client cannot provide random values or generated fields,
- response matches committed database state,
- no separate claim-loot endpoint exists,
- existing combat event ordering remains unchanged.

---

## Gate V23: Developer UI checkpoint

Build and start the maintained Developer UI against the M7 backend.

Manually exercise:

1. create or select a development Character,
2. inspect eligible Monsters,
3. start combat,
4. submit basic attacks until terminal state,
5. observe Victory and Defeat,
6. inspect Experience, Gold and level changes,
7. inspect regular Equipment outcome,
8. inspect Other Loot outcome,
9. inspect Unique/Set outcome and pity state,
10. inspect persisted Item details,
11. force or prepare full Inventory and observe `InventoryFull`,
12. verify the browser remains usable after expected no-drop outcomes.

Record manual evidence:

- date and branch/commit,
- browser flow result,
- at least one Victory,
- at least one Defeat,
- at least one visible regular Item outcome,
- at least one visible Other Loot outcome,
- deterministic or controlled evidence for Unique/Set display,
- at least one `InventoryFull` warning,
- confirmation that values match server response.

M7 cannot close without this gate.

---

## Gate V24: Regression and boundary coverage

Preserve M1-M6 guarantees, including:

- character ownership and isolation,
- effective character statistics,
- Monster discovery and eligibility,
- deterministic pure combat,
- one active fight per character,
- Energy exact-once deduction,
- expected-turn protection,
- persistent combat retrieval,
- Victory and Defeat settlement,
- Experience and Gold exact-once behavior,
- Bestiary, Task Boss, Daily Boss, cooldown, boost, Blessing and statistics behavior,
- final combat-log behavior and retention.

Boundary coverage must include:

- Monster level 1,
- minimum Item Level clamp,
- exact Item Base threshold,
- empty regular pool after successful roll,
- only one available slot,
- Common through Legendary,
- four duplicate Affixes,
- fixed minimum=maximum ranges,
- Item Score zero and largest supported valid value,
- Other Loot quantity boundaries,
- pity start, increment and cap,
- zero, one and two free Inventory positions,
- regular and special Item on the same kill,
- rollback after each persistence stage,
- concurrent terminal requests.

---

## Gate V25: Final repository verification

Before declaring M7 complete, run the complete canonical verification sequence and record exact results.

Required final state:

- PostgreSQL connection passes,
- all migrations through the single M7 migration are applied,
- pending migrations equal 0,
- current development database migration path passes,
- clean-database migration path passes,
- M7 migration schema tests pass,
- workbook validation passes,
- workbook dry run passes and rolls back,
- controlled workbook import passes,
- all M7 unit tests pass,
- all M7 PostgreSQL integration tests pass,
- all M7 HTTP integration tests pass,
- concurrency tests pass,
- rollback matrix passes,
- InventoryFull matrix passes,
- complete M1-M7 regression suite passes,
- TypeScript typecheck passes,
- production build passes,
- Developer UI build passes,
- Developer UI manual gate V23 passes,
- `git diff --check` produces no output,
- documentation matches implemented behavior,
- technical and schema context dumps are current,
- working tree is clean after final commit and push,
- local branch is synchronized with remote.

---

## Decision traceability

```text
D1  -> V2, V10, V11, V22
D2  -> V2, V3, V10
D3  -> V2, V3, V12, V15, V22
D4  -> V2, V5, V8
D5  -> V6, V7, V8, V9, V10, V12
D6  -> V7, V21
D7  -> V5, V8, V22
D8  -> V16, V17, V18, V22
D9  -> V9, V10, V12
D10 -> V12, V15
D11 -> V2, V3, V4, V10, V13, V15
D12 -> V6, V13, V14, V19
D13 -> V6, V9
D14 -> V2, V3, V13, V19, V22
D15 -> V6, V14, V19
D16 -> V14, V16, V17, V20, V22
D17 -> V2, V3, V14
D18 -> V19, V21
D19 -> V4, V22
D20 -> V17, V18, V20
D21 -> V17, V20, V21
D22 -> V22, V23
D23 -> V23, V25
D24 -> V2, V3, V25
```

## Definition of done

M7 is done only when:

- every approved decision D1-D24 is implemented without an unresolved contradiction,
- every mandatory gate V1-V25 passes,
- all random outcomes are server-authoritative and deterministic in tests,
- no generated reward can be granted twice,
- no unexpected failure can leave partial Victory rewards,
- `InventoryFull` preserves Victory and returns complete lost-Item data,
- duplicate identical Affixes work with stable positions,
- Unique/Set pity resets only after successful Inventory persistence,
- one regular and one Unique/Set Item can coexist on one kill,
- Defeat generates no loot,
- workbook and importer cover every authoritative M7 structure,
- Developer UI manual verification is recorded,
- earlier milestone guarantees remain intact,
- documentation and context dumps describe the implemented system,
- the branch is committed, pushed, synchronized and clean.

```

# ============================================================
# SOURCE: M7_IMPLEMENTATION_PLAN.md
# ============================================================

```text
# M7 Implementation Plan

## Milestone

M7: Item and Loot Generation

## Purpose

This plan defines the implementation sequence for M7. It is subordinate to:

- `M7_APPROVED_DECISIONS.md`,
- `M7_SOURCE_AUDIT.md`,
- `M7_VERIFICATION_PLAN.md`.

Approved decisions D1-D24 must not be reopened unless repository evidence proves a direct technical contradiction.

## Execution rules

- Complete phases in order.
- Keep every phase independently reviewable.
- Do not combine migration, domain, settlement and Developer UI work into one uncontrolled change.
- Add or update tests in the same phase as the behavior they verify.
- Use the existing Victory settlement transaction. Do not create a second settlement path.
- Use one M7 migration only.
- Use the server-controlled injectable `RandomSource` for every M7 random outcome.
- Preserve M1-M6 behavior and tests.
- Commit only after the phase verification gate passes.

---

# Phase P1: Baseline and implementation inventory

## Goal

Establish a verified pre-M7 baseline and identify exact files and interfaces that will be extended.

## Work

- Confirm branch `m7/item-loot-generation`.
- Confirm clean starting state except committed planning artifacts.
- Run canonical PostgreSQL, migration, test, typecheck and build commands.
- Record the exact current Victory settlement call chain.
- Record the exact transaction owner and database client flow.
- Record existing `RandomSource` interface and injection pattern.
- Record current combat settlement models and HTTP serializers.
- Record Inventory locking and equipment persistence entry points.
- Record Material and Consumable storage update patterns.
- Record Developer UI location and current start/build commands.

## Deliverables

- Baseline evidence.
- Exact implementation file map for later phases.
- No functional M7 behavior yet.

## Gate

Pass V1 from `M7_VERIFICATION_PLAN.md`.

---

# Phase P2: Final M7 schema design

## Goal

Translate D1-D3, D14, D17 and D24 into one internally consistent schema design before writing migration SQL.

## Required structures

### Item Affixes

Design:

- `affix_position`,
- removal of duplicate-template prohibition,
- uniqueness of position within one Item,
- integer-compatible generated values and constraints.

### Item Base to Affix weights

Design an authoritative table linking:

- Item Base,
- Affix Template,
- positive selection weight,
- optional enabled state only if consistent with existing authored-data conventions.

The identity must prevent duplicate links for the same Item Base and Affix Template.

### Regular loot pools

Convert `loot_tables` to represent:

- Monster,
- Item Base,
- positive selection weight,
- enabled state.

Remove or retire runtime authority of:

- per-entry drop chance,
- manual minimum Item Level,
- manual maximum Item Level,
- obsolete entry-level Item Level modifier.

### Other Loot pools

Convert `other_loot_tables` to represent:

- Monster,
- exactly one Material or Consumable target,
- positive selection weight,
- inclusive integer quantity range,
- enabled state.

### Unique/Set fixed-stat definitions and rolls

Design authored definitions for each special Item:

- stat category,
- inclusive integer minimum,
- inclusive integer maximum,
- one definition per Item and category.

Design generated persistence for:

- generated Item,
- stat category or definition reference,
- actual integer roll value,
- stable position if needed for deterministic retrieval.

Do not use `item_affixes` for Unique/Set Items.

### Special-item source pools

Design weighted eligibility that can represent:

- direct Monster source,
- Monster Family source,
- positive weight,
- enabled state,
- boss-exclusive restrictions without client authority.

### Item Score configuration

Determine the authoritative location of stat-specific scoring coefficients. Prefer a small server-authoritative configuration structure unless authored balancing requires workbook ownership.

## Deliverables

- Final schema contract used by migration, importer and runtime.
- Names, keys, constraints and indexes fixed before implementation.

## Gate

Review against D1-D3, D10-D11, D14, D17 and D24. No migration is written until the structures can represent every approved case.

---

# Phase P3: Migration 090

## Goal

Implement the complete M7 generator foundation in one migration.

## Work

Create:

```text
database/migrations/090_item_loot_generation.sql
```

The migration must:

- make all approved schema changes from P2,
- migrate existing Affix rows to deterministic positions,
- preserve valid existing Item and Inventory references,
- convert or explicitly reject incompatible existing authored loot data,
- add required checks, unique constraints, foreign keys and indexes,
- remain transactional,
- avoid partial schema state on failure.

## Tests

Add focused migration/schema integration tests for:

- duplicate identical Affix Templates allowed,
- duplicate Affix positions rejected,
- invalid Affix positions rejected,
- non-positive weights rejected,
- invalid special fixed-stat ranges rejected,
- invalid mutually exclusive Other Loot targets rejected,
- special-pool source integrity,
- existing development database migration,
- fresh empty database migration 001-090.

## Deliverables

- Migration 090.
- Schema integration tests.
- Updated expected migration count.

## Gate

Pass V2.

---

# Phase P4: Workbook and importer foundation

## Goal

Make the workbook and importer authoritative for every new M7 authored-data structure.

## Workbook work

Update:

```text
game-data/workbooks/development-data.xlsx
```

Add or modify sheets for:

- Item Base to Affix weights,
- regular loot-table selection weights,
- Other Loot selection weights,
- Unique/Set fixed-stat definitions,
- special-item source pools,
- scoring coefficients if P2 assigns workbook authority.

Provide sufficient development data for:

- every regular Equipment slot,
- multiple Item Levels,
- all five rarities through deterministic tests,
- repeated identical Affix selection,
- Material and Consumable Other Loot,
- at least one Unique and one Set Item,
- direct Monster and Monster Family special sources,
- boss-exclusive eligibility,
- Developer UI verification.

## Importer work

Extend `scripts/import-game-data.ts`:

- add table configurations in dependency-safe order,
- add reference resolution,
- add positive-weight validation,
- add whole-integer range validation,
- validate minimum does not exceed maximum,
- validate exclusive target/source combinations,
- preserve validate-only, dry-run and transactional import behavior.

## Tests

Extend importer unit tests for all accepted and rejected M7 cases.

## Deliverables

- Updated workbook.
- Updated importer.
- Importer unit tests.
- Successful validation, dry run and controlled import.

## Gate

Pass V3.

---

# Phase P5: Shared loot domain types and errors

## Goal

Create a stable pure-domain vocabulary before implementing generators.

## Work

Create a dedicated loot domain area under the existing module conventions determined in P1.

Define types for:

- Monster loot context,
- Boss loot context,
- weighted candidate,
- generated regular Item,
- generated Affix occurrence,
- generated special Item,
- generated fixed-stat occurrence,
- Other Loot result,
- persisted Item result,
- lost Item result,
- `InventoryFull`,
- pity state,
- complete loot settlement result.

Define explicit configuration errors for:

- empty eligible regular pool after successful Equipment roll,
- empty eligible fallback slot pool,
- empty eligible Affix pool for required Affix count,
- invalid weight totals,
- invalid integer ranges,
- invalid special-item configuration,
- Item Score overflow.

## Rules

- Domain models contain no SQL rows.
- Domain models contain no HTTP formatting.
- Generated lost Items must be representable without database IDs.
- Regular and special Items must be distinguishable without relying only on rarity text.

## Tests

Add validation and error-model unit tests.

## Gate

Typecheck passes and the models can represent every D1-D24 outcome.

---

# Phase P6: RandomSource utilities and weighted selection

## Goal

Provide one deterministic foundation for every M7 random operation.

## Work

Reuse the repository's existing `RandomSource` contract where possible.

Implement pure helpers for:

- uniform inclusive integer roll,
- percentage success using an integer probability scale,
- weighted candidate selection,
- cumulative boundary handling,
- deterministic invalid-RNG rejection.

Choose one exact integer probability scale capable of representing:

```text
0.1%
0.2%
1.8%
```

without floating-point ambiguity.

## Tests

Cover:

- minimum and maximum boundaries,
- equal integer range,
- first and last weighted candidate,
- zero and negative weight rejection,
- weight-total overflow protection,
- deterministic random sequence consumption,
- no `Math.random()` use in M7 paths.

## Gate

Pass V4 and weighted-selection portions of V8, V10, V13 and V14.

---

# Phase P7: Item Level and regular Equipment success

## Goal

Implement the first segment of canonical regular Equipment generation.

## Work

Implement pure functions for:

- Boss bonus normalization from authoritative context,
- effective loot level,
- minimum and maximum Item Level,
- uniform inclusive Item Level roll,
- regular Monster 30% Equipment chance,
- Boss 80% Equipment chance.

## Tests

Cover:

- level 1 clamp,
- regular Monster bonus 0,
- Boss bonus,
- inclusive endpoints,
- deterministic intermediate values,
- invalid context,
- exact probability boundaries.

## Gate

Pass V5 and the success-roll portion of V6.

---

# Phase P8: Slot and Item Base generation

## Goal

Implement canonical slot selection, fallback and weighted Item Base selection.

## Work

- Define canonical server-authoritative slot weights.
- Filter Monster pool by enabled regular Item Bases and rolled Item Level.
- Perform initial slot roll from canonical weights.
- If unavailable, rebuild the slot pool from only eligible slots while preserving relative weights.
- Raise configuration error when the eligible pool is completely empty.
- Select one Item Base using `loot_tables` weights.
- Set generated Required Level equal to rolled Item Level.

## Tests

Cover:

- every slot,
- available initial slot,
- unavailable initial slot,
- one fallback slot,
- multiple fallback slots with preserved weights,
- completely empty pool,
- exact Item Base Item Level boundary,
- disabled and foreign Monster entries,
- weighted first and last candidates.

## Gate

Pass V7 and V8.

---

# Phase P9: Rarity and Affix generation

## Goal

Complete regular Item generation through independent Affix slots.

## Work

Implement:

- canonical regular Monster rarity distribution,
- canonical Boss rarity distribution,
- rarity-to-Affix-count mapping,
- Item Base-specific eligible Affix filtering,
- independent weighted Affix selection for each slot,
- keeping selected Affix in the pool,
- inclusive whole-integer value rolls,
- stable positions 1 through Affix count.

## Tests

Cover:

- all rarity boundaries,
- Common with zero Affixes,
- Magic through Legendary exact Affix counts,
- Item Level tier eligibility,
- unlinked Affix exclusion,
- repeated identical template across all four slots,
- separate values and positions,
- empty Affix pool configuration failure.

## Gate

Pass V9-V11 except persistence and HTTP portions completed later.

---

# Phase P10: Item Score

## Goal

Implement one pure authoritative Item Score calculator.

## Work

- Fix scoring input model.
- Apply `base_item_score`.
- Apply Item Level contribution.
- Apply stat-specific coefficients to actual rolled values.
- Count every regular Affix occurrence separately.
- Score Unique/Set Items from their actual fixed-stat values.
- Exclude arbitrary rarity-name bonuses.
- Use overflow-safe integer/BigInt arithmetic.

## Tests

Include exact expected examples for:

- Common Item,
- one to four Affixes,
- repeated Affixes,
- different rolls for same rarity,
- Unique Item,
- Set Item,
- zero score,
- maximum valid score,
- overflow rejection.

## Gate

Pass V12.

---

# Phase P11: Complete pure regular Item generator

## Goal

Compose P7-P10 into one pure canonical regular Item generator.

## Work

The generator must execute exactly:

```text
Equipment roll
-> Item Level roll
-> slot roll
-> weighted eligible Item Base
-> rarity
-> Affix slots
-> Item Score
```

Persistence remains outside the pure generator.

## Tests

- deterministic complete generated Item snapshots,
- failed success roll consumes no later regular-item draws,
- exactly one regular Item maximum,
- configuration failures remain explicit,
- no dependency on HTTP or PostgreSQL.

## Gate

Pass all pure portions of V5-V12.

---

# Phase P12: Other Loot generator

## Goal

Implement independent Other Loot generation.

## Work

- Implement regular Monster 70% and Boss 90% success chances.
- Filter enabled entries for the defeated Monster.
- Select exactly one entry using positive weights.
- Roll inclusive integer quantity.
- Return a typed Material or Consumable result.
- Treat successful roll with no eligible pool as configuration error.

## Tests

- success boundaries,
- weighted candidate boundaries,
- Material target,
- Consumable target,
- quantity endpoints,
- equal quantity range,
- empty eligible pool,
- independence from Equipment Inventory.

## Gate

Pass pure portions of V13.

---

# Phase P13: Unique/Set generator

## Goal

Implement the shared independent special-item system.

## Work

- Load per-character pity state.
- Determine whether the defeated source is eligible.
- Execute one shared special-item success roll.
- Filter eligible Unique/Set candidates by Monster or Monster Family source, boss restriction, Item Base Item Level and progression range.
- Select one candidate by weight.
- Generate every configured fixed stat with an inclusive whole-integer roll.
- Calculate Item Score.
- Return one complete generated special Item maximum.
- Create no regular `item_affixes`.

## Tests

- Unique selection,
- Set selection,
- direct Monster source,
- Monster Family source,
- boss-exclusive restrictions,
- Item Level boundaries,
- weighted selection,
- all fixed stats present,
- separate copy values,
- empty or invalid configuration handling,
- no regular Affixes.

## Gate

Pass V14-V15 except persistence and pity mutation portions completed later.

---

# Phase P14: Loot repository contracts

## Goal

Define application-facing persistence and query ports without leaking PostgreSQL details into the domain.

## Contracts

Add ports for:

- loading authoritative loot-generation context,
- loading regular, Other Loot and special pools,
- reading and locking pity state,
- locking character and Inventory state,
- persisting regular Item and Affixes,
- persisting special Item and fixed-stat rolls,
- assigning Inventory position,
- updating Material storage,
- updating Consumable storage,
- updating pity state.

## Rules

- All methods used during settlement must accept or participate in the existing transaction context.
- Generated lost Items must not require persistence calls.
- Ports must support deterministic Unique/Set-first assignment.

## Tests

Update service-level fakes and contract tests.

## Gate

Typecheck and existing M6 service tests pass.

---

# Phase P15: PostgreSQL loot infrastructure

## Goal

Implement the repository contracts against migration 090.

## Work

Implement SQL for:

- authoritative generation-context queries,
- weighted pool queries,
- special Item definitions and source queries,
- pity row initialization/read/update,
- character and Inventory locking,
- deterministic lowest free position,
- Item insert,
- repeated Affix inserts with positions,
- fixed-stat roll inserts,
- Inventory assignment,
- Material and Consumable upserts.

## Tests

PostgreSQL integration coverage for:

- query filtering,
- duplicate Affixes,
- fixed-stat persistence,
- lowest free position,
- full capacity,
- lock behavior,
- character isolation,
- Material and Consumable storage,
- pity isolation,
- rollback.

## Gate

Persistence portions of V11, V13, V15, V16 and V18 pass.

---

# Phase P16: Loot settlement application orchestration

## Goal

Create one application-level orchestration unit for all M7 loot systems inside Victory settlement.

## Required order

Run independent generation systems using server-authoritative context:

- regular Equipment,
- Other Loot,
- Unique/Set.

For persistence:

1. lock character and Inventory,
2. persist Unique/Set Item first if generated and space exists,
3. persist regular Item second if generated and space exists,
4. persist Other Loot storage changes,
5. apply pity state according to actual special-item persistence,
6. construct complete loot settlement result.

## InventoryFull rules

- Generate Items normally before capacity resolution.
- Return complete lost Item data.
- Persist no parent or child rows for a lost Item.
- Do not roll back Victory.
- Do not reset pity for lost special Item.

## Tests

Application service tests for:

- all systems fail their chance roll,
- each system succeeds alone,
- regular and special succeed together,
- Other Loot plus Items,
- zero, one and two free positions,
- Unique/Set-first priority,
- pity failure increment,
- pity persisted-success reset,
- lost-success no reset,
- configuration error propagation.

## Gate

Pass application portions of V13, V16-V19.

---

# Phase P17: Integrate with existing Victory transaction

## Goal

Make M7 part of the current exactly-once Victory settlement without weakening M6.

## Work

- Extend current settlement input with required authoritative Monster/Boss loot context.
- Invoke M7 orchestration only for Victory.
- Keep Defeat loot-free.
- Keep all M6 progression and M7 rewards in the same database transaction.
- Ensure final session settlement remains the final commit-enabling step according to existing M6 design.
- Preserve stale-turn and terminal-session rejection before value-producing M7 work.

## Tests

Extend `resolve-combat-action` unit and integration tests for:

- Victory loot,
- Defeat no loot,
- exactly-once terminal behavior,
- concurrent terminal calls,
- full rollback at every M7 persistence stage,
- M6 rewards unchanged when no M7 drop occurs,
- InventoryFull expected result.

## Gate

Pass V19-V21.

---

# Phase P18: Settlement models and HTTP contract

## Goal

Expose complete M7 results through the existing terminal combat response.

## Work

Extend application and HTTP models for:

- regular Equipment outcome,
- Other Loot outcome,
- Unique/Set outcome,
- persisted generated Items,
- lost generated Items and `InventoryFull`,
- regular Affixes with positions and values,
- special fixed-stat rolls,
- Material/Consumable quantity changes,
- committed pity state.

Preserve:

- existing session and event response,
- BIGINT string serialization,
- timestamp conventions,
- ownership behavior,
- no separate claim endpoint.

## Tests

Add unit and authenticated HTTP integration tests for:

- continuing action,
- Victory without drops,
- every individual reward type,
- simultaneous regular and special Items,
- InventoryFull,
- Defeat,
- client attempts to provide generated fields,
- foreign ownership.

## Gate

Pass V22.

---

# Phase P19: Developer UI backend readiness

## Goal

Ensure the current HTTP surface supports the mandatory browser flow before UI work.

## Work

Verify or minimally extend existing endpoints required to:

- create/select a development Character,
- list eligible Monsters,
- start combat,
- retrieve active combat,
- submit basic attacks,
- inspect terminal settlement.

Do not add production-facing gameplay features outside M7.

## Gate

HTTP integration tests prove that the full D23 flow is possible without direct database manipulation during normal use.

---

# Phase P20: Developer UI implementation

## Goal

Deliver the maintained minimal M7 integration surface.

## UI features

- Character creation or selection.
- Eligible Monster list.
- Start combat control.
- Basic attack control.
- Active combat and terminal-state display.
- Experience, Gold and level changes.
- Regular Equipment details.
- Unique/Set details and pity state.
- Other Loot details.
- Persisted/lost status.
- Clear `InventoryFull` warning.
- Useful loading and server-error states.

## Rules

- UI displays server response only.
- UI does not calculate loot, rarity, Item Score or pity.
- UI remains minimal and maintainable.
- M7 does not attempt the final production frontend.

## Automated checks

- UI typecheck/build.
- Focused component or flow tests where supported by the existing UI stack.

## Manual gate

Execute and record V23.

---

# Phase P21: Rollback and concurrency hardening

## Goal

Prove transaction safety after full integration.

## Work

Add failure injection or controlled repository failures for every V21 stage.

Add concurrent integration tests for:

- same terminal action,
- same character Inventory pressure,
- different characters,
- pity update contention,
- exactly one remaining Inventory position.

## Gate

Pass V18, V20 and V21 completely.

---

# Phase P22: Full regression and boundary matrix

## Goal

Run all M7 behavior and preserve M1-M6 guarantees.

## Work

- Complete all boundary cases from V24.
- Run complete regression suite.
- Fix regressions without weakening approved contracts.
- Confirm database test cleanup leaves no persistent test contamination.
- Confirm deterministic tests do not depend on test order.

## Gate

Pass V24.

---

# Phase P23: Documentation and context alignment

## Goal

Align the repository documentation with implemented M7 behavior.

## Work

Update as required:

- `M7_SOURCE_AUDIT.md` only for explicit implementation-resolution notes without rewriting historical audit facts,
- `M7_VERIFICATION_PLAN.md` only if implementation evidence proves a required clarification,
- database-design Item, Affix, Equipment and Loot documents,
- HTTP/API documentation,
- Developer UI instructions,
- `documentation/game-design/CURRENT_MILESTONE.md`,
- `documentation/game-design/MASTER_PROJECT_PLAN.md` if required by project convention.

Do not mark M7 complete before final verification.

## Gate

Documentation contains no stale per-entry drop-chance authority, manual Item Level range authority, duplicate-Affix prohibition, claim-loot flow or pity-reset-on-lost-item behavior.

---

# Phase P24: Fresh context dumps

## Goal

Generate current handover artifacts after implementation and verification behavior are stable.

## Work

Create or update the M7 context-generation script following the M4-M6 pattern.

Generate:

```text
M7_TECHNICAL_DUMP.md
M7_SCHEMA_DATA_DUMP.md
```

Technical dump must include relevant source, tests, configuration, planning and runtime documentation.

Schema dump must reflect:

- migration 090 applied,
- M7 tables, columns, constraints and indexes,
- authored development data needed for M7 context,
- current migration status.

## Gate

Dumps are fresh, reproducible and contain no stale pre-M7 contracts.

---

# Phase P25: Final verification, commit and push

## Goal

Close M7 only with complete evidence.

## Work

Run V25 in full:

- PostgreSQL connection,
- migration status,
- current and clean database migration paths,
- workbook validation/dry run/import,
- M7 unit/integration/HTTP tests,
- concurrency and rollback tests,
- complete regression,
- typecheck,
- production build,
- Developer UI build,
- manual Developer UI evidence,
- `git diff --check`,
- documentation validation,
- context dump validation.

Then:

- inspect final diff,
- ensure no temporary audit, test or evidence files remain unless intentionally versioned,
- commit M7 implementation and documentation according to the project's checkpoint convention,
- push `m7/item-loot-generation`,
- verify local/remote synchronization,
- verify clean working tree.

## Gate

Pass V25 and the M7 Definition of Done.

---

# Planned implementation order summary

```text
P1  Baseline and file map
P2  Final schema design
P3  Migration 090
P4  Workbook and importer
P5  Domain types and errors
P6  Random and weighted utilities
P7  Item Level and Equipment success
P8  Slot and Item Base selection
P9  Rarity and Affixes
P10 Item Score
P11 Complete regular Item generator
P12 Other Loot generator
P13 Unique/Set generator
P14 Repository contracts
P15 PostgreSQL infrastructure
P16 Loot settlement orchestration
P17 Victory transaction integration
P18 Settlement and HTTP contract
P19 Developer UI backend readiness
P20 Developer UI
P21 Rollback and concurrency hardening
P22 Full regression and boundaries
P23 Documentation alignment
P24 Fresh context dumps
P25 Final verification, commit and push
```

# Decision-to-phase traceability

```text
D1  -> P2, P3, P9, P15, P18
D2  -> P2, P3, P4, P9, P15
D3  -> P2, P3, P4, P10, P13, P15, P18
D4  -> P3, P7, P8
D5  -> P7-P11, P16
D6  -> P8, P17, P21
D7  -> P7, P8, P18
D8  -> P15-P18, P21
D9  -> P9-P11
D10 -> P2, P4, P10
D11 -> P2-P4, P6, P9, P12, P13
D12 -> P11-P13, P16, P17
D13 -> P6, P7, P9
D14 -> P2-P4, P12, P15-P18
D15 -> P13, P16, P17
D16 -> P13, P15-P18, P21
D17 -> P2-P4, P13, P15
D18 -> P16, P17, P21
D19 -> P6-P13, P17, P18
D20 -> P15-P18, P21
D21 -> P17, P21, P22
D22 -> P18-P20
D23 -> P19, P20, P25
D24 -> P2-P4, P24, P25
```

# Implementation completion rule

Do not begin the next phase until the current phase's focused tests pass and its changes are reviewable. Do not declare M7 complete until P1-P25 and V1-V25 are complete, the Developer UI manual checkpoint is recorded, the branch is pushed, and the working tree is clean.

```

# ============================================================
# SOURCE: M7_MASTER_PROMPT.md
# ============================================================

```text
# M7 Master Prompt

## Project

Repository:

```text
C:\Projects\ostatnia-szansa-game
```

Branch:

```text
m7/item-loot-generation
```

Milestone:

```text
M7: Item and Loot Generation
```

## Role

Act as the technical implementation lead for M7.

The user is the gameplay designer and final authority for gameplay decisions. The assistant owns technical planning, implementation sequencing, repository inspection, test strategy, database design details consistent with approved decisions, and copy-paste-ready execution instructions.

Use short, concrete explanations. Do not assume professional programming knowledge. Provide complete PowerShell blocks that can be copied and executed as a whole. Use clear colored `START`, `ETAP` and `WYNIK` headings. Stop only when a real design decision, missing evidence or failed verification requires user input.

## Authoritative planning documents

Read these files before implementation:

```text
M7_APPROVED_DECISIONS.md
M7_SOURCE_AUDIT.md
M7_VERIFICATION_PLAN.md
M7_IMPLEMENTATION_PLAN.md
documentation/game-design/CURRENT_MILESTONE.md
documentation/game-design/MASTER_PROJECT_PLAN.md
```

Also use the fresh M7 technical and schema context dumps once they are generated during the planning checkpoint.

Priority order when documents conflict:

1. Approved decisions D1-D24 in `M7_APPROVED_DECISIONS.md`.
2. Verified repository facts and implemented schema.
3. `M7_VERIFICATION_PLAN.md`.
4. `M7_IMPLEMENTATION_PLAN.md`.
5. Older milestone dumps and historical design documents.

Do not reopen D1-D24 unless direct repository evidence proves a genuine technical contradiction. Do not reinterpret stale documentation as authority over approved M7 decisions.

## Current repository facts

- M6 is complete, verified, committed and pushed.
- The current branch is `m7/item-loot-generation`.
- M6 provides the existing transactional Victory and Defeat settlement.
- M7 must extend the existing Victory transaction rather than create another settlement path.
- Existing foundations include Item Bases, Affix Templates, Items, Inventory Items, Item Affixes, regular loot tables, Other Loot tables, Unique pity tracking, Equipment repositories and character-stat aggregation.
- The generic workbook importer already supports validation, reference resolution, transactional import and dry-run rollback.
- Runtime M7 loot generation is not yet implemented.
- The existing `item_affixes` uniqueness constraint blocks repeated identical templates.
- The authoritative Item Base to Affix weight table does not yet exist.
- Existing regular loot-table Item Level ranges and per-entry chance semantics conflict with M7.
- Actual rolled Unique/Set fixed stats do not yet have M7 persistence.

## Non-negotiable implementation rules

- Follow `M7_IMPLEMENTATION_PLAN.md` phases P1-P25 in order.
- Use one M7 migration only, expected to follow migration 089.
- Add or update focused tests with every implementation phase.
- Do not proceed to the next phase until the current phase gate passes.
- Preserve all M1-M6 regression guarantees.
- Use server-controlled injectable `RandomSource` for every random outcome.
- Never use client-provided random results or generated Item fields.
- Never use `Math.random()` in authoritative M7 runtime paths.
- All roll ranges are uniform, inclusive and whole-integer.
- Avoid unnecessary decimal precision.
- Item Score uses overflow-safe integer or BigInt arithmetic and persists as non-negative `BIGINT`.
- Loot is generated only on Victory.
- Defeat generates no loot and does not mutate Unique/Set pity.
- No separate claim-loot endpoint is allowed.
- `InventoryFull` is an expected result, not an exception and not a rollback condition.
- Unexpected generation, configuration or persistence errors roll back the complete Victory settlement.
- Exactly-once behavior must cover Items, Affixes, fixed stats, Inventory, Other Loot and pity.

## Canonical approved decisions

### D1: Independent Affix slots

Each Affix slot is rolled independently. Identical `affix_type`, tier and `affix_template_id` may occur repeatedly on one Item. Each occurrence has its own ID, roll value and stable position.

Remove:

```text
UNIQUE(item_id, affix_template_id)
```

Require:

```text
affix_position
UNIQUE(item_id, affix_position)
```

### D2: Item Base to Affix weights

Use a separate authoritative table linking Item Bases to Affix Templates with positive selection weights. Selected Affixes remain available for later slots.

### D3: Unique/Set fixed stats

Unique and Set Items do not use normal Affixes. Each specific Item has fixed stat categories, and generation rolls only their values within configured inclusive integer ranges. Persist actual rolls outside `item_affixes`.

### D4: Item Level

```text
effectiveLootLevel = monsterLevel + bossBonusLootLevel
minimumItemLevel = max(1, effectiveLootLevel - 10)
maximumItemLevel = effectiveLootLevel + 5
```

Roll Item Level uniformly and inclusively. Regular Monsters use bonus 0. Manual loot-table Item Level ranges have no runtime authority.

### D5: Regular Equipment flow

```text
Equipment roll
-> Item Level roll
-> slot roll
-> weighted eligible Item Base
-> rarity
-> Affix slots
-> Item Score
-> persistence
```

At most one regular Equipment Item per kill.

### D6: Missing rolled slot

Initially use canonical slot weights. If the rolled slot has no eligible Item Base, reroll only among slots with eligible bases while preserving their relative weights. A completely empty eligible pool is a configuration error.

### D7: Item Base qualification

A base qualifies only when:

```text
itemBase.itemLevel <= rolledItemLevel
```

Generated Required Level equals rolled Item Level.

### D8: Full Inventory

Perform all rolls normally. If no position is free, do not persist the generated Equipment Item, keep Victory successful, grant independent rewards, and return the complete lost Item with reason `InventoryFull`.

Persist special Item before regular Item. Reset pity only when the generated special Item is actually persisted.

### D9: Rarity

```text
Common: 0 Affixes
Magic: 1 Affix
Rare: 2 Affixes
Epic: 3 Affixes
Legendary: 4 Affixes
```

Rarity controls only Affix count.

### D10: Item Score

One pure domain module calculates Item Score from base score, Item Level, actual Item stat values and every actual Affix or fixed-stat roll. Rarity name has no arbitrary score bonus.

### D11: Values and precision

All configured stat and Affix values are rolled uniformly, inclusively and as whole integers. Generated Gold and Experience percentages are whole percentage points.

### D12: Independent reward systems

Run independently:

- M6 Gold and Experience,
- regular Equipment,
- Other Loot,
- Unique/Set.

At most one regular Item and one Unique/Set Item per kill.

### D13: Equipment and rarity chances

```text
Equipment:
Regular Monster 30%
Boss 80%

Regular Monster rarity:
Common 70%
Magic 20%
Rare 8%
Epic 1.8%
Legendary 0.2%

Boss rarity:
Common 0%
Magic 70%
Rare 20%
Epic 9%
Legendary 1%
```

Defaults are server-authoritative and configurable.

### D14: Other Loot

```text
Regular Monster success: 70%
Boss success: 90%
```

After success, select exactly one eligible weighted entry and roll inclusive integer quantity. Support Material and Consumable targets. Equipment Inventory capacity does not affect Other Loot.

### D15: Shared special-item roll

Unique and Set Items use one independent shared roll. It may succeed together with regular Equipment and produces at most one special Item per kill.

### D16: Pity

```text
Start: 0.1%
Increase: +0.1 percentage point per eligible failed kill
Maximum: 10%
```

Reset to 0.1% only after successful special Item persistence. `InventoryFull` loss does not reset pity.

### D17: Special eligibility

Require valid Monster or Monster Family pool, valid boss restriction, Item Base level not above rolled Item Level, and valid progression range. Select eligible Items by weight.

### D18: Transaction

The existing Victory transaction performs all rolls, pity changes, Item and child persistence, Inventory assignment, Other Loot storage updates and settlement-response construction. Unexpected failure rolls back everything.

### D19: Server authority

The client controls none of the generated outcomes. All randomness uses injectable `RandomSource`.

### D20: Inventory locking

Lock character and relevant Inventory state before persistence. Assign the lowest free position. Persist special Item before regular Item. Concurrency cannot reuse a position or exceed capacity.

### D21: Exactly once

One accepted terminal action generates loot at most once. Retries, stale actions and concurrent requests cannot duplicate Items, storage rewards or pity mutation.

### D22: Settlement response

Return M6 rewards, regular Equipment, Other Loot, Unique/Set, persisted Items, lost Items and reasons, storage quantity changes and current pity state. Do not create claim-loot flow.

### D23: Developer UI

Provide a maintained minimal browser flow for Character selection/creation, eligible Monsters, combat, Victory/Defeat, M6 rewards, all M7 reward types and `InventoryFull`. Manual verification is mandatory.

### D24: Authored-data foundation

Use one complete M7 migration. Workbook and importer must support every new authoritative authored-data structure. Migration must pass on current development database and a fresh empty database.

## Required implementation sequence

Use the authoritative details in `M7_IMPLEMENTATION_PLAN.md`. High-level order:

```text
P1  Baseline and file map
P2  Final schema design
P3  Migration 090
P4  Workbook and importer
P5  Domain types and errors
P6  Random and weighted utilities
P7  Item Level and Equipment success
P8  Slot and Item Base selection
P9  Rarity and Affixes
P10 Item Score
P11 Complete regular Item generator
P12 Other Loot generator
P13 Unique/Set generator
P14 Repository contracts
P15 PostgreSQL infrastructure
P16 Loot settlement orchestration
P17 Victory transaction integration
P18 Settlement and HTTP contract
P19 Developer UI backend readiness
P20 Developer UI
P21 Rollback and concurrency hardening
P22 Full regression and boundaries
P23 Documentation alignment
P24 Fresh context dumps
P25 Final verification, commit and push
```

## Verification contract

Use `M7_VERIFICATION_PLAN.md` as the mandatory gate list V1-V25.

Do not declare a phase complete based only on compilation or a narrow test. Run the focused gate for that phase and preserve regression coverage.

Final closure requires:

- migration on current and clean databases,
- workbook validation, dry run and controlled import,
- all M7 unit, PostgreSQL integration and HTTP tests,
- rollback and concurrency matrix,
- complete M1-M7 regression,
- typecheck and production build,
- Developer UI build and manual D23 evidence,
- fresh technical and schema context dumps,
- documentation validation,
- `git diff --check`,
- commit, push, synchronization and clean working tree.

## Collaboration workflow

For every phase:

1. Inspect the exact repository area before changing it.
2. State the phase goal in a few sentences.
3. Give one complete PowerShell block for the next action.
4. Make the block stop on errors with `$ErrorActionPreference = "Stop"`.
5. Avoid interactive commands.
6. Use explicit paths and readable colored headings.
7. Do not combine multiple major phases in one block.
8. Wait for the full output when verification evidence is required.
9. Analyze the output before generating the next block.
10. When output is long, write it to a temporary `.txt` audit file and open it in Notepad.
11. Remove temporary evidence before final repository closure unless intentionally versioned.

When providing code:

- provide a complete copy-paste block,
- do not split one operation across messages,
- do not use placeholder fragments the user must assemble,
- do not require manual edits when PowerShell can safely create or patch the file,
- prefer precise targeted changes over broad rewrites,
- inspect resulting files and `git diff` after changes.

## Stop conditions

Stop and request input only when:

- an approved gameplay decision is genuinely missing,
- repository evidence directly contradicts D1-D24,
- multiple technically valid choices would materially change gameplay or authored-data ownership,
- a verification gate fails and the failure cannot be safely diagnosed from available output,
- a destructive operation would be required without prior inspection.

Do not stop for routine technical choices. Choose the safest maintainable implementation consistent with the repository and explain it briefly.

## First implementation action

Do not start functional M7 implementation until the planning checkpoint is complete.

After planning documentation, fresh dumps, current milestone update, documentation validation, and planning commit/push are complete, begin only with P1:

```text
Baseline and implementation inventory
```

Inspect first. Do not create migration 090 or M7 runtime code during P1.

```

# ============================================================
# SOURCE: documentation/game-design/CURRENT_MILESTONE.md
# ============================================================

```text
## Current Milestone

### Milestone

M7: Item and Loot Generation

### Status

Backend M7 item and loot generation implemented and regression-green. Developer UI
(P20) fully implemented on branch `m7/developer-ui`; typecheck and production build
pass.

M7 is in closure: it is fully implemented and awaiting manual V23 verification
(`developer-ui/V23_MANUAL_EVIDENCE.md`) and merge of `m7/developer-ui`. No further
implementation work remains â€” see the "Developer UI implementation state" section
below.

### Objective

Implement the canonical, server-authoritative Item and loot generation pipeline as part of the existing transactional Victory settlement.

M7 must preserve the M6 settlement, exactly-once, ownership, concurrency and rollback guarantees.

### Approved design authority

All decisions M7-D1 through M7-D24 are approved and authoritative.

Authoritative decision source:

```text
M7_APPROVED_DECISIONS.md
```

Approved decisions must not be reopened unless repository inspection reveals a genuine technical contradiction.

### Planning artifacts

The following M7 planning artifacts have been prepared:

```text
M7_APPROVED_DECISIONS.md
M7_SOURCE_AUDIT.md
M7_VERIFICATION_PLAN.md
M7_IMPLEMENTATION_PLAN.md
M7_MASTER_PROMPT.md
M7_TECHNICAL_DUMP.md
M7_SCHEMA_DATA_DUMP.md
scripts/generate-m7-context.ps1
```

### Verified repository foundation

The repository already provides:

- transactional Victory and Defeat settlement from M6,
- exactly-once terminal combat protection,
- Character Inventory and Equipment foundations,
- Item Bases,
- Affix Templates,
- generated Items,
- Inventory Items,
- Item Affixes,
- regular loot tables,
- Other Loot tables,
- Unique/Set pity tracking foundation,
- Material and Consumable storage,
- workbook validation and transactional import,
- unit, PostgreSQL integration and authenticated HTTP test foundations,
- an existing Developer UI integration foundation.

### Required M7 scope

M7 must implement:

- independent regular Equipment generation,
- canonical Item Level generation,
- canonical slot selection and fallback,
- weighted eligible Item Base selection,
- rarity generation,
- independent Affix-slot generation,
- repeated identical Affixes with stable positions,
- authoritative Item Base to Affix weights,
- Item Score calculation,
- independent Other Loot generation,
- shared Unique/Set generation,
- Unique/Set fixed-stat rolls,
- per-Character Unique/Set pity,
- deterministic Inventory placement,
- `InventoryFull` lost-Item results,
- transactional Victory integration,
- complete settlement response,
- mandatory Developer UI verification.

### Canonical Item Level

```text
effectiveLootLevel = monsterLevel + bossBonusLootLevel
minimumItemLevel = max(1, effectiveLootLevel - 10)
maximumItemLevel = effectiveLootLevel + 5
```

Item Level is rolled uniformly and inclusively.

Regular Monsters use `bossBonusLootLevel = 0`.

An Item Base qualifies only when:

```text
itemBase.itemLevel <= rolledItemLevel
```

The generated Item's Required Level equals its Item Level.

### Regular Equipment flow

```text
Equipment roll
-> Item Level roll
-> slot roll
-> weighted eligible Item Base selection
-> rarity roll
-> Affix rolls
-> Item Score calculation
-> persistence
```

A kill may generate at most one regular Item.

### Rarity and Affix count

```text
Common: 0
Magic: 1
Rare: 2
Epic: 3
Legendary: 4
```

Rarity controls only the number of Affixes.

Each Affix slot is rolled independently. Identical Affix Templates may appear multiple times on one Item, and every occurrence has its own roll value and stable position.

### Independent reward systems

Victory processes independently:

- M6 Experience and Gold,
- regular Equipment,
- Other Loot,
- Unique/Set.

A kill may generate at most:

- one regular Item,
- one Unique or Set Item.

Defeat does not generate loot.

### Inventory behavior

All Item rolls are performed even when Inventory is full.

If no Inventory position is available:

- the generated Equipment Item is not persisted,
- Victory remains successful,
- independent rewards remain granted,
- the complete generated Item is returned as lost,
- the loss reason is `InventoryFull`.

When a Unique/Set Item and a regular Item drop together, persistence priority is:

1. Unique/Set Item,
2. regular Item.

Free Inventory positions are assigned from the lowest available position number.

### Unique/Set pity

```text
Starting chance: 0.1%
Increase: +0.1 percentage point per eligible failed kill
Maximum chance: 10%
```

Pity resets to `0.1%` only after the generated Unique/Set Item is successfully persisted in Inventory.

A special Item lost because of `InventoryFull` does not reset pity.

### Transaction contract

Loot generation belongs to the existing Victory transaction.

The same transaction must perform:

- all reward rolls,
- pity updates,
- Item persistence,
- Affix or fixed-stat persistence,
- Inventory assignment,
- Material and Consumable storage updates,
- settlement-response construction.

Unexpected generation or persistence failure rolls back the complete Victory settlement.

`InventoryFull` is an expected business result and does not trigger rollback.

### Database and authored-data checkpoint

M7 uses one complete migration after migration 089.

The migration must include at least:

- removal of the constraint blocking identical Affix Templates on one Item,
- `affix_position`,
- uniqueness of Affix position within an Item,
- authoritative Item Base to Affix weights,
- weighted regular loot-pool semantics,
- retirement of manual loot-table Item Level range authority,
- M7-compatible weighted Other Loot semantics,
- persistence for actual Unique/Set fixed-stat rolls,
- required special-item source structures,
- required constraints and indexes.

The workbook and importer must support every new authoritative authored-data structure.

The migration must pass on:

- the current development database,
- a newly created empty database.

### Developer UI checkpoint

M7 must provide a maintained minimal browser flow that allows a human to:

- create or select a development Character,
- view eligible Monsters,
- start combat,
- submit basic attacks,
- observe Victory or Defeat,
- inspect Experience, Gold and level changes,
- inspect regular Equipment,
- inspect Other Loot,
- inspect Unique/Set and pity state,
- see `InventoryFull` warnings.

M7 cannot be completed until this flow has been manually exercised in addition to automated verification.

### Implementation sequence

Implementation will follow `M7_IMPLEMENTATION_PLAN.md` phases P1 through P25.

The first implementation phase was:

```text
P1: Baseline and implementation inventory
```

### Developer UI implementation state

Backend M7 phases P1â€“P19 are implemented and committed on `m7/item-loot-generation`.
Developer UI work (P20) is implemented on the separate branch `m7/developer-ui`.

Implemented Developer UI features:

- [x] P20.0 Safety checkpoint (separate `developer-ui/` app, own branch).
- [x] P20.1 HTTP contract inventory (`developer-ui/HTTP_CONTRACT.md`).
- [x] P20.2 Vite + TypeScript foundation, plain CSS, typed API client, connection
      panel, sanitized diagnostics history.
- [x] P20.3 Character list/creation/selection, snapshot with progression and
      resources, manual and optional 10s auto-refresh, `resourcesUpdatedAt`.
- [x] P20.4 Monster discovery/details, eligibility, Energy cost, server
      `availableAt`, approximate presentation-only countdown, 10s server refresh.
- [x] P20.5 Combat start, active-combat recovery, Basic Attack with `expectedTurn`,
      events and current state, Victory/Defeat, stale-turn and terminal handling.
- [x] P20.6 M6 and M7 settlement inspection: Experience, Gold, level, statistics,
      regular Equipment, Other Loot, Unique/Set and pity, Affixes and fixed stats,
      persisted/lost status, `InventoryFull`, raw settlement JSON fallback.
- [x] P20.7 Recovery and diagnostics: Character selected from local storage,
      active-combat recovery after browser refresh, manual session/log reload,
      duplicate-submission blocking, raw diagnostics.
- [x] Backend hook `GET /characters/:characterId/combat/:combatSessionId` and
      local session cache/history for reloading completed sessions.
- [x] HTML sanitization standard (`escapeHtml`) and BIGINT-as-string handling
      documented in `developer-ui/HTTP_CONTRACT.md`.

Latest verified Developer UI state on `m7/developer-ui`:

```text
UI typecheck:      passing (npm run ui:typecheck)
UI build:          passing (npm run ui:build)
Backend typecheck: passing (npm run typecheck)
```

Remaining M7 closure work (implementation complete):

- [x] Full backend regression (`npm test` â€” 84 files / 585 tests), `npm run build`,
      `npm run ui:typecheck`, `npm run ui:build` â€” all green.
- [x] `MASTER_PROJECT_PLAN.md` current-status block synchronized for M7.
- [x] `developer-ui/V23_MANUAL_EVIDENCE.md` template created.
- [ ] Run the manual V23 click-through and fill in
      `developer-ui/V23_MANUAL_EVIDENCE.md`.
- [ ] Merge `m7/developer-ui` after V23 sign-off.
- [ ] Refresh `M7_TECHNICAL_DUMP.md` / `M7_SCHEMA_DATA_DUMP.md` if the schema or
      source snapshot changed during the final verification round.

### Mandatory verification

Verification will follow `M7_VERIFICATION_PLAN.md` gates V1 through V25.

M7 cannot be completed until:

- every approved decision D1-D24 is implemented,
- every mandatory gate V1-V25 passes,
- current-database and clean-database migration paths pass,
- workbook validation, dry run and controlled import pass,
- unit, PostgreSQL integration and HTTP integration tests pass,
- concurrency and rollback matrices pass,
- complete regression passes,
- typecheck and production build pass,
- Developer UI build and manual verification pass,
- technical and schema context dumps are current,
- documentation matches implementation,
- the branch is committed, pushed, synchronized and clean.

### Checkpoint state

Completed:

1. `M7_SOURCE_AUDIT.md`
2. `M7_VERIFICATION_PLAN.md`
3. `M7_IMPLEMENTATION_PLAN.md`
4. `M7_MASTER_PROMPT.md`
5. fresh `M7_TECHNICAL_DUMP.md`
6. fresh `M7_SCHEMA_DATA_DUMP.md`
7. `CURRENT_MILESTONE.md` planning checkpoint
8. backend M7 phases P1â€“P18 (`m7/item-loot-generation`)
9. backend Developer UI readiness P19 (`GET .../combat/:combatSessionId`)
10. Developer UI P20.0â€“P20.7 on `m7/developer-ui`
11. loot HTTP contract and serialization/sanitization documentation
    (`developer-ui/HTTP_CONTRACT.md`)

Current step:

12. Developer UI manual V23 evidence and final P20 verification

Remaining before the Pull Request:

13. focused Developer UI tests (optional)
14. full regression, `git diff --check`
15. update `MASTER_PROJECT_PLAN.md` status
16. commit and push `m7/developer-ui`

### Previous milestone

M6: Victory, Death, and Progression is complete.

Final M6 implementation commit:

```text
8a83b30 complete M6 victory death and progression
```

M7 must not weaken any verified M6 guarantee.

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

Persistent combat sessions, combat HTTP endpoints, authentication, ownership, expected-turn concurrency, Energy deduction, persistent events and logs, rewards, progression, cooldown writes, Bestiary updates, Task Boss progression, spells, consumables, monster abilities, active effects, multiple targets, and escape remain outside M4.

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

Supported defeat reasons:

- `PlayerHealthDepleted`
- `TurnLimitExceeded`


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

---

### Completion log

M5 Persistent Combat API completed and verified.

The next milestone is M6: Victory, Death, and Progression.

---

## M6: VICTORY, DEATH, AND PROGRESSION

#### Status

Completed.

#### Objective

Convert terminal combat results into authoritative Character progression, rewards, penalties, statistics, discovery progress, cooldown state, and final combat summaries. Settlement occurs exactly once inside the same PostgreSQL transaction as the combat-ending action.

#### Implemented scope
- Transactional Victory and Defeat settlement.
- Experience and Gold rewards.
- Canonical Experience curve and efficient level lookup.
- Multiple-level gains and losses.
- Level-dependent resource recalculation.
- Promotion and Blessing death modifiers.
- Blessing consumption after Defeat.
- Character lifetime statistics.
- Bestiary kill progression.
- Task progress and Task Boss transitions.
- Daily Boss attempt consumption at combat start.
- Daily Boss Victory progression.
- Normal Monster and Mini Boss cooldown recording.
- Fight-based boost consumption.
- Compact final combat logs.
- Per-character retention of the ten newest final logs.
- Settlement data in the authenticated combat-action response.
- Exactly-once concurrency and rollback protection.
- Persistent active-combat recovery after reconnecting.

#### Core progression rules

Experience is stored as total lifetime combat Experience.

```text
XP(L) = (50L^3 - 300L^2 + 850L - 600) / 3
```

Level is the highest L whose threshold does not exceed total Experience. Calculations use bigint, final percentage-adjusted values round down, level cannot fall below 1, and Experience cannot fall below 0.

Death Experience loss:
- Normal: 10%
- Promoted: 8%
- Blessed: 6%
- Promoted and Blessed: 4%

Blessing is consumed after every Defeat when active, including when the rounded Experience loss equals 0. Promotion is permanent.

#### Victory settlement

Victory settlement may atomically:
- persist ending-action events,
- grant snapshotted Experience and Gold rewards,
- read current authoritative reward bonuses,
- recalculate level and resources,
- update Character lifetime statistics,
- update Bestiary and ordinary task progress,
- transition a defeated Task Boss to `WAITING_FOR_REUNLOCK`,
- update Daily Boss Victory progress,
- write a standard cooldown for Normal Monsters and Mini Bosses,
- consume fight-based boosts after applying their bonuses,
- preserve active Blessing,
- create one compact final combat log,
- retain only the ten newest final logs,
- write terminal combat-session state last,
- return the committed settlement through HTTP.

M6 does not generate loot. Item and loot generation belongs to M7.

#### Defeat settlement

Defeat settlement may atomically:
- persist ending-action events,
- apply the approved Experience loss,
- recalculate level and resources,
- update death and combat statistics,
- consume active Blessing exactly once,
- write a standard cooldown for Normal Monsters and Mini Bosses,
- consume fight-based boosts,
- create and retain the final combat log,
- write terminal combat-session state last,
- return the committed settlement through HTTP.

Defeat grants no Experience or Gold and does not update Bestiary or Task Boss kill progress.

Health handling:
- `PlayerHealthDepleted` stores Health as 0.
- `TurnLimitExceeded` preserves the remaining Health after turn 100.

#### Combat-session contract

Supported persistent statuses:
- `Active`
- `Victory`
- `Defeat`

Combat cannot be abandoned. Closing the client leaves the session active for retrieval after reconnecting and prevents another fight from starting.

At combat start, the session snapshots Monster Experience, the Gold range, and combat-ready Character and Monster statistics. At settlement, the transaction reads current authoritative reward bonuses. Monster balance changes affect new fights only.

#### Cooldowns and bosses

Normal Monsters receive their configured cooldown after Victory and Defeat. Mini Bosses receive the Monster cooldown plus the additional Boss cooldown. Task Bosses and Daily Bosses do not use the standard cooldown.

Daily Boss attempts are consumed when combat starts. Defeat does not refund an attempt. Victory fields update only after Daily Boss Victory settlement.

#### Logs, exactly-once behavior, and rollback

`combat_session_events` stores the detailed ordered event stream. `combat_logs` stores one compact final summary per completed session. Retention keeps only the ten newest final logs per Character without deleting sessions or incremental events.

The terminal action, events, rewards or penalties, progression changes, statistics, Bestiary and task changes, cooldowns, boosts, Blessing consumption, Daily Boss progress, final log, and terminal session state commit or roll back together. Concurrent requests cannot settle one fight twice.

#### Verification result

M6 completed with:
- PostgreSQL connection passing,
- 89 migrations applied and 0 pending,
- migrations 001 through 089 passing on an empty database,
- 81 public database tables,
- workbook validation passing for 29 worksheets and 248 rows,
- full regression passing with 68 test files and 470 tests,
- focused M6 unit coverage passing with 169 tests,
- PostgreSQL integration passing with 78 tests,
- authenticated HTTP integration passing with 9 tests,
- concurrency and rollback verification passing,
- TypeScript typecheck and production build passing,
- no active `Abandoned` contract remaining.

#### Completion commit

```text
8a83b30 complete M6 victory death and progression
```

#### Definition of done
- Victory rewards and Defeat penalties are applied exactly once.
- Multiple levels can be gained or lost.
- Promotion and Blessing modify death loss correctly.
- Blessing is consumed exactly once after Defeat.
- Failed settlement rolls back the complete terminal action.
- Only the newest ten final combat logs are retained per Character.
- Combat cannot be abandoned.
- Settlement is returned by the authenticated combat-action endpoint.
- M1 through M5 guarantees remain intact.
- All mandatory V1 through V25 gates pass.

## M7: ITEM AND LOOT GENERATION

### Status

Implemented. Awaiting manual V23 Developer UI verification and merge.

The backend M7 item and loot generation pipeline is implemented and
regression-green on `m7/item-loot-generation`. The Developer UI checkpoint (P20)
is implemented on `m7/developer-ui` and passes typecheck and production build.
M7 remains formally open until:

- Gate V23 manual Developer UI verification is recorded in
  `developer-ui/V23_MANUAL_EVIDENCE.md`, and
- the `m7/developer-ui` branch is reviewed and merged.

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

#### Completed milestones
- M1: Character Foundation
- M2: Effective Character Statistics
- M3: Monster Discovery and Eligibility
- M4: Pure Combat Engine
- M5: Persistent Combat API
- M6: Victory, Death, and Progression

#### Milestone in closure
- M7: Item and Loot Generation â€” backend implemented and regression-green;
  Developer UI implemented and passing typecheck/build on `m7/developer-ui`;
  awaiting manual V23 verification (`developer-ui/V23_MANUAL_EVIDENCE.md`) and
  merge.

#### Completed platform foundations
- Database architecture established.
- Production migrations implemented through migration 089.
- Stable authored-content codes and workbook pipeline implemented.
- Transactional game-data importer and dry run verified.
- Character ownership isolation implemented.
- Effective Character Statistics implemented.
- Monster discovery and eligibility implemented.
- Pure deterministic combat engine implemented.
- Persistent authenticated combat API implemented.
- Exactly-once Victory and Defeat settlement implemented.
- Experience, Gold, level, death, Bestiary, Task Boss, Daily Boss, cooldown, boost, Blessing, and final-log settlement implemented.
- Combat concurrency and rollback protection verified.
- Canonical item generator, item-level and rarity selection, affix rolls, and Item Score implemented.
- Regular equipment, Other Loot (materials/consumables), and shared Unique/Set generation implemented.
- Per-character Unique/Set pity with fixed-stat rolls implemented.
- Deterministic inventory placement and `InventoryFull` lost-item results implemented.
- Transactional loot settlement integrated with M6 Victory settlement.
- Developer UI (Vite + TypeScript) integration surface implemented.

#### Current development content
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

#### Current technical state

```text
Database schema: Ready through M7
Database migrations: 89 applied, 0 pending
Character foundation: Implemented
Effective statistics: Implemented
Monster discovery: Implemented
Pure combat engine: Implemented
Persistent combat API: Implemented
Victory and Defeat settlement: Implemented
Experience, Gold, level, and death progression: Implemented
Bestiary and Task progression: Implemented
Daily Boss attempt and Victory progression: Implemented
Final combat logs and retention: Implemented
Authenticated combat routes: Implemented
Combat integration flow: Verified
Item and loot generation: Implemented
Regular equipment / Other Loot / Unique-Set generation: Implemented
Unique/Set pity and fixed-stat rolls: Implemented
InventoryFull lost-item handling: Implemented
Transactional loot settlement: Implemented
Developer UI: Implemented (typecheck + build passing)
Manual V23 Developer UI verification: Pending
Backend test files: 84 passing
Backend tests: 585 passing
Backend typecheck: Passing
Backend production build: Passing
Developer UI typecheck: Passing
Developer UI build: Passing
Current milestone: M7 Item and Loot Generation (closure pending V23 + merge)
```

The M7 loot migration and database table count are tracked in the M7 schema
context dump (`M7_SCHEMA_DATA_DUMP.md`); refresh that dump during the final V23
verification round if the schema changed after the last dump.

#### Current playable backend flow

```text
Create Character
â†’ Discover Eligible Monsters
â†’ Start Authenticated Combat
â†’ Deduct Energy Exactly Once
â†’ Consume Daily Boss Attempt When Applicable
â†’ Snapshot Combat Statistics and Base Rewards
â†’ Persist Combat Session
â†’ Submit Expected-Turn Actions
â†’ Persist State and Ordered Events
â†’ Settle Victory or Defeat Exactly Once
â†’ Apply Experience, Gold, Levels, Death Penalties, and Resources
â†’ Update Statistics, Bestiary, Tasks, Boss Progress, Cooldowns, and Boosts
â†’ Persist Final Combat Summary and Ten-Log Retention
â†’ Generate Regular Equipment, Other Loot, and Unique/Set Independently
â†’ Roll Item Level, Rarity, Affixes, and Item Score
â†’ Assign Deterministic Inventory Positions (or return InventoryFull)
â†’ Persist Loot Transactionally Within the Victory Settlement
â†’ Return Committed Settlement (including loot) Through HTTP
â†’ Retrieve Active or Completed Session and Ordered Events
```

The backend now generates equipment, materials, consumables, uniques, and sets
from combat as part of the M7 Victory settlement. The Developer UI
(`developer-ui/`) exposes the complete Character â†’ Monster â†’ Combat â†’ Settlement
flow for manual verification.

## IMMEDIATE NEXT TASK

Close M7 by completing its remaining formalities:

```text
M7 closure: manual V23 verification + merge
```

Required steps:

1. Run the Developer UI end-to-end flow and record manual Gate V23 evidence in
   `developer-ui/V23_MANUAL_EVIDENCE.md`.
2. Complete the final verification round (`npm test`, `npm run build`,
   `npm run ui:typecheck`, `npm run ui:build`, `git diff --check`).
3. Review and merge `m7/developer-ui` into the M7 backend baseline.
4. Refresh `M7_TECHNICAL_DUMP.md` and `M7_SCHEMA_DATA_DUMP.md` if required.
5. Mark M7 completed and advance `CURRENT_MILESTONE.md` to M8.

M7 preserves every verified M1 through M6 guarantee, including server authority, ownership isolation, one active fight per Character, expected-turn protection, atomic settlement, exactly-once value creation, rollback, reconnect recovery, and separation between pure generation logic and persistence.

### M7 TRANSITION AND DEVELOPER UI POLICY

M6 Victory, Death, and Progression is completed and verified.

The current implementation milestone is:

M7: Item and Loot Generation

M7 must prepare and implement:

- the canonical item generator,
- item-level determination,
- rarity rolls,
- affix-count rules,
- eligible-affix selection,
- affix value rolls,
- Item Score,
- regular equipment rewards,
- other loot rewards,
- transactional persistence,
- deterministic randomness,
- exactly-once integration with M6 settlement,
- rollback and concurrency protection.

From M7 onward, every gameplay milestone must expose its implemented player-facing behavior through a maintained Developer UI before the milestone may be closed.

The Developer UI is an integration surface, not the final visual frontend.

The M7 Developer UI checkpoint must allow a human to:

- select or create a development Character,
- discover eligible Monsters,
- start combat,
- submit basic attacks,
- view Victory or Defeat settlement,
- inspect Experience, Gold, and level changes,
- inspect generated loot.

M8 must extend the Developer UI into the first complete playable vertical slice:

Fight
â†’ Gain Rewards
â†’ Receive Equipment
â†’ Inspect Inventory
â†’ Equip Equipment
â†’ Observe Statistics Change
â†’ Fight Again

The M7 planning package (source audit, gameplay decisions, schema implications,
verification plan, implementation plan, and master prompt) is approved and the
backend plus Developer UI are implemented. The immediate next task is to record
manual V23 evidence and merge `m7/developer-ui`, then advance to M8.

```

# ============================================================
# SOURCE: documentation/database-design/affix-definition.md
# ============================================================

```text
# Affix Design
## Tibia Browser RPG

---

# 1. Overview

Affixes are random modifiers added to normal items.

Affixes provide:

- Item customization
- Item variety
- Long-term item hunting
- Build specialization

Final Item Formula:

Base Item

+

Rarity

+

Affixes

=

Final Item

---

# 2. Affix Types

Only 8 affix types exist.

Available Affixes:

- Attack
- Defense
- Spell Power
- Health
- Mana
- Energy
- Gold %
- Experience %

No other affixes exist.

Examples of excluded affixes:

- Critical Chance
- Critical Damage
- Cooldown Reduction
- Health Regeneration
- Mana Regeneration
- Potion Effectiveness

The affix system is intentionally simple.

---

# 3. Affix Tiers

Each affix contains 5 tiers.

Examples:

Attack Tier 1

Attack Tier 2

Attack Tier 3

Attack Tier 4

Attack Tier 5

---

Defense Tier 1

Defense Tier 2

Defense Tier 3

Defense Tier 4

Defense Tier 5

---

Each Affix Tier is treated as its own database entry.

Example:

Attack Tier 1

Item Level Requirement:

1

Range:

1-5

---

Attack Tier 5

Item Level Requirement:

100

Range:

25-50

---

The exact values are balanced independently.

---

# 4. Affix Level Requirements

Each Affix Tier contains:

- Required Item Level

Example:

Affix:

Attack Tier 3

Required Level:

40

Only items meeting the requirement may roll that tier.

This allows precise progression tuning.

---

# 5. Affix Storage

Every affix consists of:

Affix Template

+

Roll Value

Example:

Affix:

Attack Tier 4

Roll:

73

Stored As:

Template ID:

Attack Tier 4

Roll:

73

This structure simplifies balancing and future adjustments.

---

# 6. Affix Rolling

Each Affix Tier defines:

- Minimum Value
- Maximum Value

Example:

Attack Tier 5

Min:

100

Max:

200

All values inside the range have equal probability.

Examples:

100

101

102

...

200

All values are equally likely.

No weighted roll system exists.

---

# 7. Affix Visibility

Affix Names Are Hidden.

Players do not see:

- Attack Tier 5
- Major Attack
- Grand Defense

Players only see final values.

Examples:

Attack +150

Health +300

Mana +200

Gold +5%

This keeps item tooltips clean and easy to understand.

---

# 8. Affix Weighting

Affixes are weighted.

Weights are assigned per Item Base.

Example:

----------------------------------------------------

Steel Sword

----------------------------------------------------

Attack:

100

Defense:

25

Spell Power:

25

Health:

20

Mana:

5

Energy:

5

Gold:

2

Experience:

2

----------------------------------------------------

Merchant Ring

----------------------------------------------------

Attack:

30

Defense:

30

Spell Power:

30

Health:

30

Mana:

30

Energy:

30

Gold:

150

Experience:

100

Different item bases naturally favor different affixes.

All affixes remain possible.

---

# 9. Duplicate Affixes

Duplicate affixes are fully allowed.

Examples:

Attack +150

Attack +175

Attack +200

Attack +180

Perfectly valid.

No duplicate limits exist.

This allows intentionally specialized items.

Examples:

- Glass Cannon Gear
- Gold Farming Gear
- Experience Farming Gear
- High Mana Gear
- Pure Defense Gear

This is intended behavior.

---

## Duplicate Percentage Affixes

Duplicate percentage affixes affecting the same statistic are combined
additively.

Example:

Gold Affix: +8%
Gold Affix: +5%
Combined Gold Bonus: +13%

Duplicate percentage affixes are never multiplied by one another.

Affix values are passed to the authoritative Effective Character Statistics
calculator without performing a separate final-stat calculation.

# 10. Affix Scaling

Affixes scale with item progression.

However:

Item Bases remain the primary source of power.

Design Goal:

A Level 100 Magic Item

should generally outperform

a Level 1 Legendary Item

even if the Legendary has excellent affixes.

Progression always takes priority over rarity.

Item quality never completely overrides progression.

---

# 11. Rarity Interaction

Rarity only determines Affix Count.

Common:

0 Affixes

Magic:

1 Affix

Rare:

2 Affixes

Epic:

3 Affixes

Legendary:

4 Affixes

Rarity does not grant:

- Better Rolls
- Better Affix Tiers
- Better Affix Quality

Only more affixes.

---

# 12. Unique Items

Unique Items do not use affixes.

Unique Items use:

- Fixed Stat Categories
- Random Rolls Within Ranges

Example:

Rat King's Crown

Attack:

10-20

Defense:

15-30

No affixes may be generated.

---

# 13. Set Items

Set Items do not use affixes.

Set Items use:

- Fixed Stat Categories
- Random Rolls Within Ranges
- Set Bonuses

No affixes may be generated.

---

# 14. Item Score Contribution

Every affix contributes to Item Score.

Each affix type may use its own scoring formula.

Examples:

Attack

Score Formula A

---

Defense

Score Formula B

---

Gold %

Score Formula C

---

Experience %

Score Formula D

This allows accurate internal balancing.

---

# 15. Design Philosophy

Players should become excited by:

- High Item Level
- Strong Item Base
- Legendary Rarity
- Perfect Affix Combination
- Perfect Affix Rolls

The ideal chase item is:

High Level Base

+

Legendary

+

Perfect Affix Combination

+

Near Maximum Rolls

Example:

Dragon Sword

Level 100

Legendary

Attack +200

Attack +180

Attack +175

Attack +190

This type of item represents the true endgame item hunt.
```

# ============================================================
# SOURCE: documentation/database-design/equipment-design.md
# ============================================================

```text
# Equipment Design
## Tibia Browser RPG

---

# 1. Equipment Vision

Equipment is the primary source of character power.

Most character strength comes from:

- Equipment
- Affixes
- Upgrades

rather than:

- Character Level

Character Level primarily unlocks access to content and equipment.

Equipment progression is intended to be the main long-term chase system.

---

# 2. Equipment Sources

Equipment enters the economy through:

- Monster Loot
- Boss Loot
- Gambling
- Trading

Equipment cannot be crafted.

Equipment may be:

- Equipped
- Sold
- Traded
- Upgraded
- Salvaged

---

# 3. Equipment Slots

Characters have 8 equipment slots:

- Amulet
- Helmet
- Weapon
- Armor
- Shield
- Legs
- Boots
- Ring

---

# 3A. Equipped State and Loadouts

InventoryItems.IsEquipped is the only authoritative source of currently equipped items.

Rules:

- IsEquipped = true means that the item is currently equipped.
- IsEquipped = false means that the item is not currently equipped.
- A character may equip no more than one item in each equipment slot.
- The Effective Character Statistics calculator uses only items where IsEquipped = true.
- EquipmentLoadouts are saved equipment presets.
- EquipmentLoadouts do not represent the current equipped state.
- EquipmentLoadouts.IsDefault identifies the default saved preset.
- EquipmentLoadouts.IsDefault does not mean that the loadout is currently equipped.

Applying an Equipment Loadout must occur in one transaction.

The operation must:

1. Validate that every referenced item belongs to the character.
2. Validate that every referenced item matches its assigned equipment slot.
3. Validate weapon and shield compatibility.
4. Mark the character's currently equipped items as not equipped.
5. Mark the items referenced by the selected loadout as equipped.
6. Recalculate Effective Character Statistics.
7. Safely clamp current resources if their effective maximum values decrease.

If any validation or update fails, the entire operation must be rolled back.

Equipment Changes

After every equip, unequip, swap, loadout change, set activation,
or set deactivation:

1. EffectiveCharacterStats must be recalculated.
2. Resource clamping must be executed.
3. Updated values must be persisted.

---

# 4. Item Levels

Every equipment piece has:

- Item Level
- Required Level

Current Rule:

Required Level = Item Level

Examples:

Bronze Sword
Level 5

Steel Sword
Level 20

Dragon Sword
Level 100

Item Level determines:

- Base Stats
- Affix Availability
- Affix Tier Availability
- Upgrade Costs
- Salvage Rewards

---

# 5. Item Generation

Equipment is generated using three stages:

Step 1:
Roll Item Base

â†“

Step 2:
Roll Rarity

â†“

Step 3:
Roll Affixes

Example:

Steel Sword

â†“

Epic

â†“

Attack +42

Attack +38

Defense +18

Every generated item is independent.

---

# 6. Base Item Statistics

Every Item Base contains fixed statistics.

Example:

Steel Sword

Attack: 50

Defense: 0

Spell Power: 0

Base stats never roll randomly.

Randomness comes from:

- Rarity
- Affixes
- Affix Values

Formula:

Base Item
+
Affixes
=
Final Item

---

# 7. Supported Stats

Items may contain:

- Attack
- Defense
- Spell Power
- Health
- Mana
- Energy
- Gold %
- Experience %

Not every item uses every stat.

--

## Equipment Statistic Aggregation

Flat statistics granted by equipped items and their affixes are added to the
corresponding character statistics.

Percentage modifiers affecting the same statistic are combined additively
across all equipped items, item affixes, and active set bonuses.

Example:

Item Gold Bonus: +20%
Set Gold Bonus: +5%
Combined Equipment Gold Bonus: +25%

Equipment percentage modifiers are not multiplied by one another.

The authoritative Effective Character Statistics calculator is responsible
for combining equipment modifiers with modifiers from achievements,
permanent bonuses, buffs, and debuffs.

---

# 8. Weapon Types

## One-Handed

May equip shield.

## Two-Handed

Characteristics:

- Approximately 150% base attack
- Cannot equip shield

Purpose:

Higher offense at the cost of defense.

---

# 9. Equipment Rarities

Available Rarities:

- Common
- Magic
- Rare
- Epic
- Legendary

Rarity does NOT modify:

- Base Stats
- Affix Strength
- Affix Tier

Rarity only controls:

- Affix Count

---

# 10. Affix Counts

Common

0 Affixes

Magic

1 Affix

Rare

2 Affixes

Epic

3 Affixes

Legendary

4 Affixes

---

# 11. Affix Types

Only eight affix families exist:

- Attack
- Defense
- Spell Power
- Health
- Mana
- Energy
- Gold %
- Experience %

No additional affix systems exist.

Examples of excluded affixes:

- Critical Chance
- Critical Damage
- Cooldown Reduction
- Regeneration
- Potion Efficiency

The system is intentionally simple.

---

# 12. Affix Tiers

Each affix uses predefined tiers.

Example:

Attack Tier 1

Level Requirement: 1

Range: 1-5

---

Attack Tier 5

Level Requirement: 100

Range: 25-50

Only eligible tiers may appear on an item.

---

# 13. Affix Rolls

After a tier is selected:

A random roll occurs within the tier range.

Example:

Attack Tier 5

100-200

Possible Roll:

173

Every value inside the range is equally likely.

---

# 14. Affix Visibility

Players never see tier names.

Players only see final values.

Examples:

Attack +150

Defense +90

Gold +8%

Experience +5%

---

# 15. Duplicate Affixes

Duplicate affixes are allowed.

Example:

Legendary Dragon Sword

Attack +200

Attack +185

Attack +191

Attack +174

Valid.

No duplicate restrictions exist.

This allows specialized items.

---

# 16. Affix Weighting

All affixes may appear on all items.

Item Bases use weights to encourage identity.

Example:

Dragon Sword

Attack: 100

Defense: 25

Spell Power: 25

Gold: 5

Experience: 5

---

Merchant Ring

Gold: 150

Experience: 100

Attack: 30

Defense: 30

Spell Power: 30

Items favor certain stats but all are possible.

---

# 17. Item Improvement Systems

Equipment has two independent improvement systems:

1. Rarity Upgrade
2. Affix Reroll

Systems do not interact.

---

# 18. Rarity Upgrades

Progression:

Common

â†“

Magic

â†“

Rare

â†“

Epic

â†“

Legendary

Each successful upgrade grants:

+1 New Affix

Maximum:

Legendary

---

# 19. Upgrade Success Chances

Common â†’ Magic

80%

Magic â†’ Rare

50%

Rare â†’ Epic

25%

Epic â†’ Legendary

10%

All values are configurable.

---

# 20. Upgrade Costs

Upgrades require:

- Gold
- Upgrade Materials

Costs scale based on:

- Item Level
- Current Rarity

Higher rarity = higher cost.

---

# 21. Upgrade Failure

Failed upgrade:

- Item destroyed
- Materials consumed
- Gold consumed

Item is permanently lost.

---

# 22. Protection Stones

Protection Stones may be used before upgrading.

On Failure:

- Upgrade fails
- Item survives

On Success:

- Upgrade succeeds normally

Protection Stone is consumed regardless of result.

Protection protects only one attempt.

---

# 23. Affix Reroll System

Player chooses one affix.

Only selected affix changes.

Example:

Before:

Attack +150
Attack +120
Gold +2%
Mana +40

Selected:

Gold +2%

After:

Attack +150
Attack +120
Gold +8%
Mana +40

All other affixes remain unchanged.

---

# 24. Salvaging

Equipment may be destroyed for materials.

Rewards depend on:

- Item Level
- Item Rarity

Higher rarity items provide better salvage rewards.

Options for unwanted items:

- Equip
- Sell
- Trade
- Salvage

---

# 25. Vendor Sales

Items may be sold to NPC vendors.

Vendor value is based primarily on:

- Item Score

Higher quality items have greater value.

Vendor sales create a guaranteed minimum value for loot.

---

# 26. Trading Rules

All equipment is fully tradable.

There are:

- No Bind on Pickup
- No Bind on Equip
- No Account Bound Items

Players may freely:

- Buy
- Sell
- Trade

at any time.

---

# 27. Boss Exclusive Bases

Certain Item Bases are boss-exclusive.

Examples:

- Rat King's Crown
- Ancient Dragon Armor
- Shadow Lord Ring

These bases enter the economy only through designated bosses.

---

# 28. Unique Items

UUnique Items

Characteristics:
- Fixed Identity
- Fixed Stat Categories
- Random Stat Rolls

Example:

Crown of Thieves

Always rolls:
- Gold %
- Defense

But the actual values are rolled individually on each drop.

Example:

Drop #1
Gold +4%
Defense +10

Drop #2
Gold +8%
Defense +18

---

# 29. Unique Item Rules

Unique Items:

- Do Not Use Affixes
- Do Not Use Rarity System

Power comes from:

- Fixed Identity
- Roll Quality

---

# 30. Set Items

Set Items are predefined equipment pieces.

Characteristics:

- Fixed Identity
- Fixed Rolls
- Set Bonuses

Examples:

Rat Set

- Rat Helm
- Rat Armor
- Rat Ring
- Rat Boots

---

# 31. Set Bonuses

Example:

2 Pieces

+5% Gold

3 Pieces

+10 Attack

4 Pieces

+5% Experience

Only designated set items provide set bonuses.

---

# 32. Item Score

Every item has a hidden Item Score.

Calculated from:

- Item Level
- Base Stats
- Rarity
- Affixes
- Affix Rolls

Uses:

- Vendor Pricing
- Analytics
- Balancing
- Market Monitoring

Item Score is never visible to players.

---

# 33. Best-In-Slot Philosophy

Ultimate endgame gear should generally be:

High Item Level

+

Legendary Rarity

+

Perfect Affixes

+

Near Perfect Rolls

Perfect Legendary items should generally outperform:

- Unique Items
- Set Items

Unique and Set items are intended to be:

- Valuable
- Collectible
- Build Enabling

not mandatory best-in-slot gear.

---

# 34. Equipment Design Philosophy

Equipment progression should create long-term goals.

Players should become excited by:

- High Item Levels
- Rare Drops
- Legendary Items
- Perfect Affix Combinations
- Near Perfect Rolls

Core Item Chase:

Strong Base

â†“

Legendary

â†“

Perfect Affixes

â†“

Perfect Rolls

â†“

Successful Upgrades

â†“

Endgame Item
```

# ============================================================
# SOURCE: documentation/database-design/item-definition.md
# ============================================================

```text
# Item Design
## Tibia Browser RPG

---

# 1. Overview

Item Bases are static equipment definitions.

Generated Items inherit Item Base properties and then receive:

- Rarity
- Affixes
- Affix Rolls

Formula:

Item Base

+

Rarity

+

Affixes

=

Final Item

---

# 2. Identity

## Item Base ID

Unique identifier.

---

## Name

Unique item name.

Examples:

Bronze Sword

Steel Sword

Dragon Sword

Merchant Ring

Explorer Boots

Rat King's Crown

---

## Description

Lore description.

Displayed on:

- Item Tooltip
- Bestiary
- Holy Grail

---

## Artwork

Every Item Base has artwork.

Used in:

- Equipment
- Marketplace
- Inventory
- Holy Grail

---

# 3. Progression

## Item Level

Defines:

- Loot Progression
- Affix Availability
- Upgrade Scaling

---

## Required Level

Stored separately.

Initially:

Required Level = Item Level

Stored separately to allow future balancing.

Example:

Item Level:

50

Required Level:

45

Possible in future.

---

# 4. Item Score

Every Item Base contains:

Base Item Score

Used for:

- Vendor Values
- Analytics
- Balancing

Final Item Score:

Base Score

+

Rarity Score

+

Affix Score

=

Final Item Score

Item Score is not shown to players.

---

# 5. Item Slots

Supported Equipment Slots:

- Weapon
- Helmet
- Armor
- Shield
- Legs
- Boots
- Ring
- Amulet

---

# 6. Weapon Types

Available Weapon Types:

- One-Handed
- Two-Handed

---

## Two-Handed Weapons

Characteristics:

- Approximately 150% normal Attack value
- Cannot equip Shield

Purpose:

- Offensive build choice

---

# 7. Base Statistics

Every item base may use any combination of:

- Attack
- Defense
- Spell Power
- Health
- Mana
- Energy
- Gold %
- Experience %

Most items focus on a small subset of these values.

Examples:

Steel Sword

Attack +50

---

Knight Armor

Defense +40

Health +150

---

Scholar Amulet

Spell Power +20

Mana +100

---

Merchant Ring

Gold +5%

---

# 8. Item Types

Available Item Types:

- Normal Item
- Set Item
- Unique Item

Implemented through flags.

---

## Set Flag

Boolean

If true:

Linked to Set ID

---

## Unique Flag

Boolean

If true:

Linked to Unique ID

No separate item-base system exists.

---

# 9. Drop Accessibility

## Boss Exclusive

Boolean

Examples:

false

true

Boss-exclusive item bases only appear through designated boss encounters.

---

# 10. Rarity Rules

All item bases may roll:

- Common
- Magic
- Rare
- Epic
- Legendary

No base item has rarity restrictions.

---

## Rarity Determines

- Affix Count

Only.

Rarity does not change base item stats.

---

# 11. Affix System

Item Bases use weighted affix generation.

All affixes may appear on all slots.

However:

Each slot has custom affix weights.

Example:

Weapon

Attack:

100

Defense:

25

Spell Power:

50

Gold:

5

Experience:

5

---

Ring

Gold:

100

Experience:

100

Attack:

50

Defense:

50

This preserves item identity while maintaining randomness.

---

# 12. Fixed Base Stats

Base stats are fixed.

Example:

Steel Sword

Attack:

50

Always.

No random base roll exists.

Randomness comes from:

- Rarity
- Affixes
- Affix Rolls

---

# 13. Class Restrictions

None.

Any character may use any item.

The game uses a classless progression system.

---

# 14. Expected Item Volume

Target:

80-100 Base Items

Spread across:

- Weapons
- Helmets
- Armor
- Shields
- Legs
- Boots
- Rings
- Amulets

New items may be added in future expansions.

---

# 15. Unique Items

Unique Items are based on normal item bases.

Additional Properties:

- Unique Flag
- Unique Template
- Fixed Stat Ranges

Example:

Rat King's Crown

Attack:

10-20

Defense:

5-15

Values roll within predefined ranges.

---

## Unique Item Rules

Unique Items do not roll affixes.

Their identity comes from:

- Fixed Stat Categories
- Variable Stat Rolls

Each drop rolls independently.

Players may continue farming for better versions.

---

# 16. Set Items

Set Items are based on normal item bases.

Additional Properties:

- Set Flag
- Set ID
- Set Bonuses

Example:

2 Pieces:

+5% Gold

---

3 Pieces:

+10 Attack

---

4 Pieces:

+5% Experience

---

## Set Item Rules

Set Items do not roll affixes.

Their identity comes from:

- Fixed Stat Categories
- Variable Stat Rolls
- Set Bonuses

---

# 17. Power Philosophy

Normal Items:

Base

+

Rarity

+

Affixes

---

Set Items:

Base

+

Set Bonuses

+

Fixed Stat Rolls

---

Unique Items:

Base

+

Unique Stat Rolls

---

## Ultimate Endgame Goal

Perfect Legendary Items.

Perfect Legendary equipment should generally outperform:

- Unique Items
- Set Items

Uniques and Sets exist as:

- Alternative Progression
- Collection Goals
- Build Options

Rather than Best-In-Slot equipment.

---

# 18. Design Philosophy

Item Bases should have strong identities.

Examples:

Merchant Ring

â†’ Gold-focused

---

Scholar Amulet

â†’ Spell-focused

---

Explorer Boots

â†’ Energy-focused

---

Knight Armor

â†’ Defense-focused

The goal is for players to recognize item bases themselves as valuable, rather than viewing all value as coming exclusively from affixes.
```

# ============================================================
# SOURCE: documentation/database-design/loot-design.md
# ============================================================

```text
# 6. LOOT SYSTEM

## Overview

Every monster kill generates loot through four independent loot systems:

1. Gold Roll
2. Item Roll
3. Other Loot Roll
4. Unique/Set Roll

Each roll is processed independently.

This means a single kill may result in:

- Gold only
- Gold + Materials
- Gold + Item
- Gold + Item + Materials
- Gold + Item + Materials + Unique/Set Item

Maximum possible item drops from a single kill:

- 1 Regular Item
- 1 Unique/Set Item

Maximum:

2 equipment items per kill

---

# Gold Roll

Gold is always rolled.

Every monster has:

- Minimum Gold
- Maximum Gold

Stored directly in the monster database.

Example:

Rat

Gold:

5 - 15

Wolf

Gold:

20 - 40

Dragon

Gold:

500 - 1000

Actual gold reward is rolled randomly within the configured range.

Gold rewards can be increased through active Gold Boosts.

---

# Regular Item Roll

Every monster performs one equipment roll.

Default Monster Chances:

30%:

- Equipment Item

70%:

- No Equipment

If an item is generated:

1. Roll Item Level
2. Roll Equipment Slot
3. Roll Rarity
4. Roll Affixes
5. Create Item

---

## Item Level Roll

Monster Level determines item level range.

Example:

Level 50 Monster

Possible Item Levels:

40 - 55

Every level within the range has equal chance.

Example:

40,41,42,43...55

All equally likely.

---

## Equipment Slot Distribution

Equipment slot chances:

Weapon:

15%

Helmet:

15%

Armor:

15%

Shield:

15%

Legs:

15%

Boots:

15%

Ring:

5%

Amulet:

5%

Total:

100%

---

## Item Rarity Chances

Regular Monster Loot Chances:

Common:

70%

Magic:

20%

Rare:

8%

Epic:

1.8%

Legendary:

0.2%

Legendary items may drop from any monster.

Higher-level monsters provide access to higher-level equipment.

---

# Boss Item Roll

Bosses use improved loot tables.

Boss Equipment Roll:

80%:

- Equipment Item

20%:

- No Equipment

Bosses also use improved rarity chances.

Boss Rarity Chances:

Common:

0%

Magic:

70%

Rare:

20%

Epic:

9%

Legendary:

1%

Bosses additionally increase loot quality through bonus loot levels.

Examples:

Boss Level:

50

Bonus Loot Level:

+10

Loot rolls as:

Level 60 Monster

Bonus Loot Level may vary by boss.

---

# Other Loot Roll

Every monster performs one additional loot roll.

Default Monster Chances:

70%

- Other Loot

30%

- Empty

Other Loot may include:

- Crafting Materials
- Potions
- Temporary Boosts
- Blessings
- Protection Stones

All entries use individual drop tables.

---

## Boss Other Loot Roll

Bosses receive improved chances.

Boss Chances:

90%

- Other Loot

10%

- Empty

Bosses additionally have access to:

- Rare Materials
- Boss Exclusive Materials
- Better quantities
- Higher Blessing Rates
- Higher Protection Stone Rates

---

# Materials

Materials are primarily used for:

- Crafting
- Equipment Upgrades
- Protection Crafting
- Blessing Crafting

Material progression is level-based.

Examples:

Low Levels:

- Iron Ore

Mid Levels:

- Steel Piece

Higher Levels:

- Mithril Fragment

Materials do not use rarity tiers.

Each material exists as its own resource.

Some cosmetic materials are boss-exclusive.

These materials are primarily used for:

- Outfits
- Addons
- Cosmetic Collections

Core progression materials are not boss-exclusive.

Players may obtain progression materials through:

- Gathering
- Loot
- Trading
- Vendors (selected materials)

Examples:

- Dragon Scales
- Ancient Essence
- Rat King's Tooth

# Boss Materials

Certain materials may be exclusive to bosses.

These materials are intended primarily for:

- Outfits
- Addons
- Cosmetic Collections

Examples:

- Dragon Eye
- Ancient Skull
- Royal Crown
- Demon Horn

Boss-exclusive materials are not required for core gameplay progression.

Players must never be forced to kill a specific boss in order to access:

- Potions
- Blessings
- Protection Stones
- Energy Potions
- Core Crafting Progression

Boss-exclusive materials exist primarily to support prestige and collection systems.

---

# Unique & Set Loot System

Unique and Set Items use a completely independent loot roll.

The system includes bad luck protection.

Unique and Set rolls do not affect regular item drops.

Both can occur from the same kill.

---

## Unique Pity System

Every eligible kill increases unique chance.

Starting Chance:

0.1%

After each kill:

+0.1%

Examples:

Kill 1:

0.1%

Kill 2:

0.2%

Kill 10:

1.0%

Kill 50:

5.0%

Kill 100:

10.0%

Maximum Chance:

10%

When a Unique or Set Item drops:

Chance resets back to:

0.1%

---

## Unique Selection

When a unique roll succeeds:

The game selects an eligible unique based on:

- Monster Level
- Boss Level
- Loot Level Range

The dropped unique must fit the current progression range.

---

### Set Items

Set Items are a special category of Unique Items.

Characteristics:
- Fixed Identity
- Fixed Stat Categories
- Random Stat Rolls
- Set Bonuses

Set Items do not use affixes.

Sets may drop from:

- Normal Monsters
- Bosses

Bosses generally have better set drop chances.

Set Item Sources

Set Items are tied to monster families.

Example:

Rat Set:
- Rat
- Plague Rat
- Rat King

Vampire Set:
- Vampire
- Vampire Bride
- Vampire Lord

---

## Unique Item Philosophy

Unique and Set Items are powerful.

However:

Perfectly rolled Legendary items remain the strongest equipment in the game.

Endgame Best-In-Slot gear is expected to come from:

- High Item Level
- Legendary Rarity
- Perfect Affixes
- Perfect Affix Rolls
- Successful Upgrades

Unique and Set Items are intended as valuable alternatives rather than mandatory endgame equipment.

---

# Loot Modifiers

There are no loot quality modifiers.

No statistics such as:

- Magic Find
- Item Find
- Loot Quality %

exist in the game.

Equipment acquisition is intended to remain a grind-based progression system.

---

# Inventory Rules

Default Inventory Size:

50 Slots

Inventory Expansion:

+50 Slots

Maximum Inventory:

100 Slots

Expansion Cost:

1,000,000 Gold

Inventory size only affects equipment and item storage.

---

## Stack Limits

Gold:

- Unlimited

Crafting Materials:

- 999 per stack

Potions:

- 999 per stack

Boosts:

- 999 per stack

Blessings:

- 999 per stack

Protection Stones:

- 999 per stack

Additional stacks are created automatically when possible.

---

# Full Inventory Rules

When inventory is full:

Equipment Items:

- Lost

Gold:

- Still received

Materials:

- Still received if material stack has available space

Consumables:

- Still received if stack capacity allows

The player receives a warning notification when inventory is full.

The player is responsible for maintaining inventory space.

---

# Loot Visibility

Dropped items are fully identified immediately.

Players instantly see:

- Item Name
- Item Slot
- Item Level
- Item Rarity
- Item Statistics

There is no item identification system.

---

# Loot Notifications

There are no global loot announcements.

Examples:

No server-wide messages for:

- Legendary Drops
- Unique Drops
- Set Drops

All loot remains private to the player.

---

# Loot Philosophy

The loot system is designed around four goals:

1. Frequent progression through normal loot.
2. Long-term item hunting through rarity and affixes.
3. Excitement through unique and set item drops.
4. Endless optimization through perfect legendary gear.

The strongest items in the game should remain extremely rare and require significant time, luck, upgrades and trading to obtain.
```

# ============================================================
# SOURCE: database-design/loot/unique-pity-tracking.md
# ============================================================

```text
ENTITY: UniquePityTracking

PRIMARY KEY
-----------
UniquePityTrackingId

FOREIGN KEYS
------------
CharacterId â†’ Characters.CharacterId

UNIQUE CONSTRAINTS
------------------
CharacterId

CARDINALITY
-----------
Characters
â””â”€â”€ UniquePityTracking (1:1)

PURPOSE
-------
Tracks unique/set bad-luck protection.

CORE COLUMNS
------------
UniquePityTrackingId

CharacterId

EligibleKillCount

CurrentChancePercent

LastUniqueDropAt

LastSetDropAt

CreatedAt
UpdatedAt

BUSINESS RULES
--------------
Chance increases after each
eligible kill.

Chance resets after:
- Unique drop
- Set drop

Maximum chance cap controlled
by game configuration.

INDEXES
-------
PK_UniquePityTrackingId

UX_UniquePityTracking_CharacterId
```

# ============================================================
# RELEVANT FILE INVENTORY
# ============================================================

```text
database\migrations\006_consumable_definitions.sql
database\migrations\007_materials.sql
database\migrations\008_unique_templates.sql
database\migrations\009_set_templates.sql
database\migrations\010_monster_families.sql
database\migrations\011_monsters.sql
database\migrations\012_bosses.sql
database\migrations\013_daily_boss_definitions.sql
database\migrations\014_daily_boss_pools.sql
database\migrations\015_daily_boss_rotation.sql
database\migrations\017_item_bases.sql
database\migrations\018_affix_templates.sql
database\migrations\019_items.sql
database\migrations\029_inventory_items.sql
database\migrations\030_material_storage.sql
database\migrations\031_consumable_storage.sql
database\migrations\032_equipment_loadouts.sql
database\migrations\033_item_affixes.sql
database\migrations\034_set_bonuses.sql
database\migrations\037_character_daily_boss_progress.sql
database\migrations\038_monster_tasks.sql
database\migrations\039_monster_abilities.sql
database\migrations\040_monster_ability_weights.sql
database\migrations\042_chest_reward_definitions.sql
database\migrations\051_recipe_materials.sql
database\migrations\056_loot_tables.sql
database\migrations\057_other_loot_tables.sql
database\migrations\058_unique_pity_tracking.sql
database\migrations\060_set_progress.sql
database\migrations\082_add_item_handedness.sql
database\migrations\083_add_monster_energy_cost.sql
database\migrations\085_unique_monster_task_boss.sql
database\migrations\086_daily_boss_rotation_window.sql
database\migrations\087_daily_boss_attempt_rotation.sql
database\migrations\089_victory_death_progression.sql
database\migrations\090_item_loot_generation.sql
database-design\bosses\bosses.md
database-design\bosses\character-daily-boss-progress.md
database-design\bosses\daily-boss-definitions.md
database-design\bosses\daily-boss-pools.md
database-design\bosses\daily-boss-rotation.md
database-design\bosses\monster-tasks.md
database-design\chests\chest-reward-definitions.md
database-design\consumables\consumable-definitions.md
database-design\crafting\recipe-materials.md
database-design\entity-inventory.md
database-design\holy-grail\set-progress.md
database-design\inventory\consumable-storage.md
database-design\inventory\equipment-loadouts.md
database-design\inventory\inventory-items.md
database-design\inventory\material-storage.md
database-design\items\affix-templates.md
database-design\items\item-affixes.md
database-design\items\item-bases.md
database-design\items\items.md
database-design\items\set-bonuses.md
database-design\items\set-templates.md
database-design\items\unique-templates.md
database-design\loot\loot-tables.md
database-design\loot\other-loot-tables.md
database-design\loot\unique-pity-tracking.md
database-design\materials\materials.md
database-design\monsters\monster-abilities.md
database-design\monsters\monster-ability-weights.md
database-design\monsters\monster-families.md
database-design\monsters\monsters.md
documentation\database-design\affix-definition.md
documentation\database-design\consumable-definition.md
documentation\database-design\daily-boss-definition.md
documentation\database-design\equipment-design.md
documentation\database-design\item-definition.md
documentation\database-design\loot-design.md
documentation\database-design\material-definition.md
documentation\database-design\monster-definition.md
documentation\database-design\task-boss-definition.md
game-data\csv\materials.csv
game-data\workbooks\development-data.xlsx
scripts\import-game-data.ts
scripts\import-materials.ts
src\modules\characters\application\equipment.repository.ts
src\modules\characters\infrastructure\postgres-equipment.repository.ts
src\modules\items\application\loot.repository.ts
src\modules\items\application\loot-settlement.service.ts
src\modules\items\domain\complete-regular-item-generator.ts
src\modules\items\domain\item-base-selection.ts
src\modules\items\domain\item-generation.constants.ts
src\modules\items\domain\item-generation.errors.ts
src\modules\items\domain\item-generation.types.ts
src\modules\items\domain\item-generator.ts
src\modules\items\domain\item-loot-level.ts
src\modules\items\domain\item-random.ts
src\modules\items\domain\item-rarity-affix.ts
src\modules\items\domain\item-score.ts
src\modules\items\domain\other-loot-generator.ts
src\modules\items\domain\special-item-generator.ts
src\modules\items\infrastructure\postgres-loot.repository.ts
src\modules\items\infrastructure\postgres-loot-catalog.ts
src\modules\items\infrastructure\postgres-loot-lock.ts
src\modules\items\infrastructure\postgres-loot-persistence.ts
src\modules\items\infrastructure\postgres-loot-transaction.ts
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
src\modules\progression\domain\defeat-settlement.ts
src\modules\progression\domain\victory-rewards.ts
src\modules\progression\domain\victory-settlement.ts
tests\integration\characters\postgres-character-set-bonuses.repository.test.ts
tests\integration\characters\postgres-equipment.repository.test.ts
tests\integration\combat\daily-boss-start.integration.test.ts
tests\integration\http\monster-discovery.http.test.ts
tests\integration\monsters\daily-boss-discovery.repository.test.ts
tests\integration\monsters\postgres-monster-discovery.repository.test.ts
tests\unit\http\monster-http.handler.test.ts
tests\unit\http\monster-http.request.test.ts
tests\unit\import-game-data.test.ts
tests\unit\items\complete-regular-item-generator.test.ts
tests\unit\items\item-base-selection.test.ts
tests\unit\items\item-generator.test.ts
tests\unit\items\item-loot-level.test.ts
tests\unit\items\item-random.test.ts
tests\unit\items\item-rarity-affix.test.ts
tests\unit\items\item-score.test.ts
tests\unit\items\loot-repository-contract.test.ts
tests\unit\items\loot-settlement.service.test.ts
tests\unit\items\other-loot-generator.test.ts
tests\unit\items\postgres-loot.repository.test.ts
tests\unit\items\postgres-loot-catalog.test.ts
tests\unit\items\postgres-loot-lock.test.ts
tests\unit\items\postgres-loot-persistence.test.ts
tests\unit\items\postgres-loot-transaction.test.ts
tests\unit\items\special-item-generator.test.ts
tests\unit\monsters\daily-boss-discovery.service.test.ts
tests\unit\monsters\daily-boss-eligibility.test.ts
tests\unit\monsters\get-monster-details.service.test.ts
tests\unit\monsters\get-monster-list.service.test.ts
tests\unit\monsters\monster-cooldown.test.ts
tests\unit\monsters\monster-eligibility.test.ts
tests\unit\monsters\task-boss-discovery.service.test.ts
tests\unit\progression\defeat-settlement.test.ts
tests\unit\progression\victory-rewards.test.ts
tests\unit\progression\victory-settlement.test.ts
```

# ============================================================
# M7 REFERENCE AUDIT
# ============================================================

```text
database-design/bestiary/bestiary-statistics.md:88:These updates are committed atomically with the rest of Victory settlement.
database-design/bosses/bosses.md:23:ΓööΓöÇΓöÇ LootTables (1:N)
database-design/bosses/bosses.md:39:LootLevelBonus
database-design/bosses/character-daily-boss-progress.md:63:## M6 DAILY BOSS SETTLEMENT
database-design/bosses/character-daily-boss-progress.md:67:A successful Daily Boss Victory settlement:
database-design/buffs/character-buffs.md:130:Fight-based Character buffs are consumed during terminal settlement.
database-design/buffs/character-buffs.md:134:If settlement fails, buff consumption is rolled back with the rest of the transaction.
database-design/characters/character-cooldowns.md:85:A configured monster cooldown is written after terminal settlement for:
database-design/characters/characters.md:161:After a level change, level-dependent maximum Health, Mana, and Energy are recalculated through the canonical progression-domain functions. Current resources are persisted according to the implemented Victory or Defeat settlement rules.
database-design/characters/characters.md:163:A Blessing that modifies the death penalty is consumed in the same Defeat settlement transaction.
database-design/combat/combat-logs.md:158:- Victory and defeat settlement may write final log data within the same transaction as progression changes.
database-design/combat/combat-logs.md:172:- Loot generation.
database-design/combat/combat-logs.md:187:- the final log describes the completed encounter and settlement result.
database-design/combat/combat-logs.md:189:A final log is created in the same transaction as Victory or Defeat settlement.
database-design/combat/combat-session-events.md:287:- loot generation,
database-design/combat/combat-session-events.md:305:- settlement and terminal persistence remain atomic.
database-design/combat/combat-sessions.md:312:- loot generation,
database-design/combat/combat-sessions.md:328:## M6 SETTLEMENT CONTRACT
database-design/combat/combat-sessions.md:330:A combat session is the authoritative snapshot used for combat resolution and terminal settlement.
database-design/combat/combat-sessions.md:342:Combat-ready Character and Monster statistics are snapshotted when combat starts. Monster Experience and Gold reward values used by settlement are also persisted in the session snapshot.
database-design/combat/combat-sessions.md:344:Victory and Defeat settlement execute in the same PostgreSQL transaction as terminal session persistence. Settlement is exactly once: a stale or already-terminal session cannot produce a second reward or penalty.
database-design/consumables/consumable-definitions.md:15:OtherLootTables.ConsumableDefinitionId
database-design/consumables/consumable-definitions.md:22:ΓööΓöÇΓöÇ OtherLootTables (1:N)
database-design/database-blueprint.md:65:# LOOT DOMAIN
database-design/database-blueprint.md:67:LootTables
database-design/database-blueprint.md:68:OtherLootTables
database-design/database-relationships.md:47:ΓööΓöÇΓöÇ LootTables (1:N)
database-design/database-relationships.md:71:Γö£ΓöÇΓöÇ LootTables (1:N)
database-design/database-relationships.md:72:Γö£ΓöÇΓöÇ OtherLootTables (1:N)
database-design/database-relationships.md:84:ΓööΓöÇΓöÇ LootTables (1:N)
database-design/database-relationships.md:93:LOOTTABLES
database-design/database-relationships.md:97:OTHERLOOTTABLES
database-design/database-relationships.md:113:ΓööΓöÇΓöÇ LootTables (1:N)
database-design/entity-inventory.md:81:LOOT DOMAIN
database-design/entity-inventory.md:83:LootTables
database-design/entity-inventory.md:84:OtherLootTables
database-design/items/items.md:38:Rarity
database-design/items/items.md:53:IX_Items_Rarity
database-design/loot/loot-tables.md:1:ENTITY: LootTables
database-design/loot/loot-tables.md:5:LootTableId
database-design/loot/loot-tables.md:16:ΓööΓöÇΓöÇ LootTables (1:N)
database-design/loot/loot-tables.md:19:ΓööΓöÇΓöÇ LootTables (1:N)
database-design/loot/loot-tables.md:23:Defines equipment loot available from monsters and bosses.
database-design/loot/loot-tables.md:27:LootTableId
database-design/loot/loot-tables.md:37:LootLevelModifier
database-design/loot/loot-tables.md:46:PK_LootTableId
database-design/loot/loot-tables.md:48:IX_LootTables_MonsterId
database-design/loot/loot-tables.md:49:IX_LootTables_ItemBaseId
database-design/loot/other-loot-tables.md:1:ENTITY: OtherLootTables
database-design/loot/other-loot-tables.md:5:OtherLootTableId
database-design/loot/other-loot-tables.md:22:ΓööΓöÇΓöÇ OtherLootTables (1:N)
database-design/loot/other-loot-tables.md:25:ΓööΓöÇΓöÇ OtherLootTables (1:N)
database-design/loot/other-loot-tables.md:28:ΓööΓöÇΓöÇ OtherLootTables (1:N)
database-design/loot/other-loot-tables.md:53:OtherLootTableId
database-design/loot/other-loot-tables.md:72:PK_OtherLootTableId
database-design/loot/other-loot-tables.md:74:IX_OtherLootTables_MonsterId
database-design/loot/other-loot-tables.md:75:IX_OtherLootTables_MaterialId
database-design/loot/other-loot-tables.md:76:IX_OtherLootTables_ConsumableDefinitionId
database-design/materials/materials.md:15:OtherLootTables.MaterialId
database-design/materials/materials.md:23:Γö£ΓöÇΓöÇ OtherLootTables (1:N)
database-design/materials/materials.md:49:IsLootable
database-design/materials/materials.md:71:IX_Materials_IsLootable
database-design/materials/materials.md:78:- No material rarity system exists
database-design/monsters/monsters.md:18:LootTables.MonsterId
database-design/monsters/monsters.md:19:OtherLootTables.MonsterId
database-design/monsters/monsters.md:38:Γö£ΓöÇΓöÇ LootTables (1:N)
database-design/monsters/monsters.md:39:Γö£ΓöÇΓöÇ OtherLootTables (1:N)
database-design/monsters/monsters.md:81:LootLevelModifier
database-design/monsters/monsters.md:100:Monster data contains the base Experience reward used by M6 Victory settlement.
database-design/monsters/monsters.md:110:M6 does not generate loot.
database/metadata/table-columns.csv:134:bosses,4,loot_level_bonus,integer,int4,NO,0,,32,0
database/metadata/table-columns.csv:426:inventory_items,1,inventory_item_id,uuid,uuid,NO,gen_random_uuid(),,,
database/metadata/table-columns.csv:427:inventory_items,2,character_id,uuid,uuid,NO,,,,
database/metadata/table-columns.csv:428:inventory_items,3,item_id,uuid,uuid,NO,,,,
database/metadata/table-columns.csv:429:inventory_items,4,position,integer,int4,NO,,,32,0
database/metadata/table-columns.csv:430:inventory_items,5,is_equipped,boolean,bool,NO,false,,,
database/metadata/table-columns.csv:431:inventory_items,6,acquired_at,timestamp with time zone,timestamptz,NO,now(),,,
database/metadata/table-columns.csv:432:item_affixes,1,item_affix_id,uuid,uuid,NO,gen_random_uuid(),,,
database/metadata/table-columns.csv:433:item_affixes,2,item_id,uuid,uuid,NO,,,,
database/metadata/table-columns.csv:434:item_affixes,3,affix_template_id,uuid,uuid,NO,,,,
database/metadata/table-columns.csv:435:item_affixes,4,roll_value,numeric,numeric,NO,,,12,4
database/metadata/table-columns.csv:436:item_affixes,5,created_at,timestamp with time zone,timestamptz,NO,now(),,,
database/metadata/table-columns.csv:437:item_bases,1,item_base_id,uuid,uuid,NO,gen_random_uuid(),,,
database/metadata/table-columns.csv:438:item_bases,2,unique_template_id,uuid,uuid,YES,,,,
database/metadata/table-columns.csv:439:item_bases,3,set_template_id,uuid,uuid,YES,,,,
database/metadata/table-columns.csv:440:item_bases,4,name,character varying,varchar,NO,,100,,
database/metadata/table-columns.csv:441:item_bases,5,description,text,text,NO,,,,
database/metadata/table-columns.csv:442:item_bases,6,artwork,text,text,YES,,,,
database/metadata/table-columns.csv:443:item_bases,7,item_level,integer,int4,NO,,,32,0
database/metadata/table-columns.csv:444:item_bases,8,required_level,integer,int4,NO,1,,32,0
database/metadata/table-columns.csv:445:item_bases,9,slot,character varying,varchar,NO,,20,,
database/metadata/table-columns.csv:446:item_bases,10,weapon_type,character varying,varchar,YES,,32,,
database/metadata/table-columns.csv:447:item_bases,11,attack,numeric,numeric,NO,0,,12,4
database/metadata/table-columns.csv:448:item_bases,12,defense,numeric,numeric,NO,0,,12,4
database/metadata/table-columns.csv:449:item_bases,13,spell_power,numeric,numeric,NO,0,,12,4
database/metadata/table-columns.csv:450:item_bases,14,health,numeric,numeric,NO,0,,12,4
database/metadata/table-columns.csv:451:item_bases,15,mana,numeric,numeric,NO,0,,12,4
database/metadata/table-columns.csv:452:item_bases,16,energy,numeric,numeric,NO,0,,12,4
database/metadata/table-columns.csv:453:item_bases,17,gold_percent,numeric,numeric,NO,0,,8,4
database/metadata/table-columns.csv:454:item_bases,18,experience_percent,numeric,numeric,NO,0,,8,4
database/metadata/table-columns.csv:455:item_bases,19,base_item_score,bigint,int8,NO,0,,64,0
database/metadata/table-columns.csv:456:item_bases,20,is_boss_exclusive,boolean,bool,NO,false,,,
database/metadata/table-columns.csv:457:item_bases,21,is_unique,boolean,bool,NO,false,,,
database/metadata/table-columns.csv:458:item_bases,22,is_set,boolean,bool,NO,false,,,
database/metadata/table-columns.csv:459:item_bases,23,created_at,timestamp with time zone,timestamptz,NO,now(),,,
database/metadata/table-columns.csv:460:item_bases,24,updated_at,timestamp with time zone,timestamptz,NO,now(),,,
database/metadata/table-columns.csv:461:item_bases,25,code,character varying,varchar,NO,,64,,
database/metadata/table-columns.csv:463:items,2,item_base_id,uuid,uuid,NO,,,,
database/metadata/table-columns.csv:465:items,4,rarity,character varying,varchar,NO,,20,,
database/metadata/table-columns.csv:466:items,5,item_score,bigint,int8,NO,0,,64,0
database/metadata/table-columns.csv:478:loot_tables,1,loot_table_id,uuid,uuid,NO,gen_random_uuid(),,,
database/metadata/table-columns.csv:479:loot_tables,2,monster_id,uuid,uuid,NO,,,,
database/metadata/table-columns.csv:480:loot_tables,3,item_base_id,uuid,uuid,NO,,,,
database/metadata/table-columns.csv:481:loot_tables,4,drop_chance_percent,numeric,numeric,NO,,,7,4
database/metadata/table-columns.csv:482:loot_tables,5,min_item_level,integer,int4,NO,,,32,0
database/metadata/table-columns.csv:483:loot_tables,6,max_item_level,integer,int4,NO,,,32,0
database/metadata/table-columns.csv:484:loot_tables,7,loot_level_modifier,integer,int4,NO,0,,32,0
database/metadata/table-columns.csv:485:loot_tables,8,is_enabled,boolean,bool,NO,true,,,
database/metadata/table-columns.csv:486:loot_tables,9,created_at,timestamp with time zone,timestamptz,NO,now(),,,
database/metadata/table-columns.csv:487:loot_tables,10,updated_at,timestamp with time zone,timestamptz,NO,now(),,,
database/metadata/table-columns.csv:528:materials,9,is_lootable,boolean,bool,NO,false,,,
database/metadata/table-columns.csv:573:monsters,16,loot_level_modifier,integer,int4,NO,0,,32,0
database/metadata/table-columns.csv:589:other_loot_tables,1,other_loot_table_id,uuid,uuid,NO,gen_random_uuid(),,,
database/metadata/table-columns.csv:590:other_loot_tables,2,monster_id,uuid,uuid,NO,,,,
database/metadata/table-columns.csv:591:other_loot_tables,3,material_id,uuid,uuid,YES,,,,
database/metadata/table-columns.csv:592:other_loot_tables,4,consumable_definition_id,uuid,uuid,YES,,,,
database/metadata/table-columns.csv:593:other_loot_tables,5,drop_chance_percent,numeric,numeric,NO,,,7,4
database/metadata/table-columns.csv:594:other_loot_tables,6,min_quantity,integer,int4,NO,1,,32,0
database/metadata/table-columns.csv:595:other_loot_tables,7,max_quantity,integer,int4,NO,1,,32,0
database/metadata/table-columns.csv:596:other_loot_tables,8,is_enabled,boolean,bool,NO,true,,,
database/metadata/table-columns.csv:597:other_loot_tables,9,created_at,timestamp with time zone,timestamptz,NO,now(),,,
database/metadata/table-columns.csv:598:other_loot_tables,10,updated_at,timestamp with time zone,timestamptz,NO,now(),,,
database/metadata/table-columns.csv:707:unique_pity_tracking,1,unique_pity_tracking_id,uuid,uuid,NO,gen_random_uuid(),,,
database/metadata/table-columns.csv:708:unique_pity_tracking,2,character_id,uuid,uuid,NO,,,,
database/metadata/table-columns.csv:709:unique_pity_tracking,3,eligible_kill_count,bigint,int8,NO,0,,64,0
database/metadata/table-columns.csv:710:unique_pity_tracking,4,current_chance_percent,numeric,numeric,NO,0,,7,4
database/metadata/table-columns.csv:711:unique_pity_tracking,5,last_unique_drop_at,timestamp with time zone,timestamptz,YES,,,,
database/metadata/table-columns.csv:712:unique_pity_tracking,6,last_set_drop_at,timestamp with time zone,timestamptz,YES,,,,
database/metadata/table-columns.csv:713:unique_pity_tracking,7,created_at,timestamp with time zone,timestamptz,NO,now(),,,
database/metadata/table-columns.csv:714:unique_pity_tracking,8,updated_at,timestamp with time zone,timestamptz,NO,now(),,,
database/metadata/table-constraints.csv:203:bosses,bosses_loot_level_bonus_not_null,CHECK,loot_level_bonus IS NOT NULL
database/metadata/table-constraints.csv:208:bosses,chk_bosses_loot_level_bonus,CHECK,(loot_level_bonus >= 0)
database/metadata/table-constraints.csv:671:inventory_items,chk_inventory_items_position,CHECK,"(""position"" >= 1)"
database/metadata/table-constraints.csv:672:inventory_items,inventory_items_acquired_at_not_null,CHECK,acquired_at IS NOT NULL
database/metadata/table-constraints.csv:673:inventory_items,inventory_items_character_id_not_null,CHECK,character_id IS NOT NULL
database/metadata/table-constraints.csv:674:inventory_items,inventory_items_inventory_item_id_not_null,CHECK,inventory_item_id IS NOT NULL
database/metadata/table-constraints.csv:675:inventory_items,inventory_items_is_equipped_not_null,CHECK,is_equipped IS NOT NULL
database/metadata/table-constraints.csv:676:inventory_items,inventory_items_item_id_not_null,CHECK,item_id IS NOT NULL
database/metadata/table-constraints.csv:677:inventory_items,inventory_items_position_not_null,CHECK,position IS NOT NULL
database/metadata/table-constraints.csv:678:inventory_items,fk_inventory_items_character,FOREIGN KEY,
database/metadata/table-constraints.csv:679:inventory_items,fk_inventory_items_item,FOREIGN KEY,
database/metadata/table-constraints.csv:680:inventory_items,inventory_items_pkey,PRIMARY KEY,
database/metadata/table-constraints.csv:681:inventory_items,ux_inventory_items_character_position,UNIQUE,
database/metadata/table-constraints.csv:682:inventory_items,ux_inventory_items_item_id,UNIQUE,
database/metadata/table-constraints.csv:683:item_affixes,chk_item_affixes_roll_value,CHECK,(roll_value >= (0)::numeric)
database/metadata/table-constraints.csv:684:item_affixes,item_affixes_affix_template_id_not_null,CHECK,affix_template_id IS NOT NULL
database/metadata/table-constraints.csv:685:item_affixes,item_affixes_created_at_not_null,CHECK,created_at IS NOT NULL
database/metadata/table-constraints.csv:686:item_affixes,item_affixes_item_affix_id_not_null,CHECK,item_affix_id IS NOT NULL
database/metadata/table-constraints.csv:687:item_affixes,item_affixes_item_id_not_null,CHECK,item_id IS NOT NULL
database/metadata/table-constraints.csv:688:item_affixes,item_affixes_roll_value_not_null,CHECK,roll_value IS NOT NULL
database/metadata/table-constraints.csv:689:item_affixes,fk_item_affixes_item,FOREIGN KEY,
database/metadata/table-constraints.csv:690:item_affixes,fk_item_affixes_template,FOREIGN KEY,
database/metadata/table-constraints.csv:691:item_affixes,item_affixes_pkey,PRIMARY KEY,
database/metadata/table-constraints.csv:692:item_affixes,ux_item_affixes_item_template,UNIQUE,
database/metadata/table-constraints.csv:693:item_bases,chk_item_bases_code,CHECK,"((code)::text ~ '^[a-z][a-z0-9_]{0,63}$'::text)"
database/metadata/table-constraints.csv:694:item_bases,chk_item_bases_levels,CHECK,((item_level >= 1) AND (required_level >= 1))
database/metadata/table-constraints.csv:695:item_bases,chk_item_bases_slot,CHECK,"((slot)::text = ANY ((ARRAY['Weapon'::character varying, 'Helmet'::character varying, 'Armor'::character varying, 'Shield'::character varying, 'Legs'::character varying, 'Boots'::character varying, 'Ring'::character varying, 'Amulet'::character varying])::text[]))"
database/metadata/table-constraints.csv:696:item_bases,chk_item_bases_stats,CHECK,((attack >= (0)::numeric) AND (defense >= (0)::numeric) AND (spell_power >= (0)::numeric) AND (health >= (0)::numeric) AND (mana >= (0)::numeric) AND (energy >= (0)::numeric) AND (gold_percent >= (0)::numeric) AND (experience_percent >= (0)::numeric) AND (base_item_score >= 0))
database/metadata/table-constraints.csv:697:item_bases,chk_item_bases_template_type,CHECK,(((is_unique = true) AND (unique_template_id IS NOT NULL) AND (is_set = false) AND (set_template_id IS NULL)) OR ((is_set = true) AND (set_template_id IS NOT NULL) AND (is_unique = false) AND (unique_template_id IS NULL)) OR ((is_unique = false) AND (unique_template_id IS NULL) AND (is_set = false) AND (set_template_id IS NULL)))
database/metadata/table-constraints.csv:698:item_bases,chk_item_bases_weapon_type,CHECK,((((slot)::text = 'Weapon'::text) AND (weapon_type IS NOT NULL)) OR (((slot)::text <> 'Weapon'::text) AND (weapon_type IS NULL)))
database/metadata/table-constraints.csv:699:item_bases,item_bases_attack_not_null,CHECK,attack IS NOT NULL
database/metadata/table-constraints.csv:700:item_bases,item_bases_base_item_score_not_null,CHECK,base_item_score IS NOT NULL
database/metadata/table-constraints.csv:701:item_bases,item_bases_code_not_null,CHECK,code IS NOT NULL
database/metadata/table-constraints.csv:702:item_bases,item_bases_created_at_not_null,CHECK,created_at IS NOT NULL
database/metadata/table-constraints.csv:703:item_bases,item_bases_defense_not_null,CHECK,defense IS NOT NULL
database/metadata/table-constraints.csv:704:item_bases,item_bases_description_not_null,CHECK,description IS NOT NULL
database/metadata/table-constraints.csv:705:item_bases,item_bases_energy_not_null,CHECK,energy IS NOT NULL
database/metadata/table-constraints.csv:706:item_bases,item_bases_experience_percent_not_null,CHECK,experience_percent IS NOT NULL
database/metadata/table-constraints.csv:707:item_bases,item_bases_gold_percent_not_null,CHECK,gold_percent IS NOT NULL
database/metadata/table-constraints.csv:708:item_bases,item_bases_health_not_null,CHECK,health IS NOT NULL
database/metadata/table-constraints.csv:709:item_bases,item_bases_is_boss_exclusive_not_null,CHECK,is_boss_exclusive IS NOT NULL
database/metadata/table-constraints.csv:710:item_bases,item_bases_is_set_not_null,CHECK,is_set IS NOT NULL
database/metadata/table-constraints.csv:711:item_bases,item_bases_is_unique_not_null,CHECK,is_unique IS NOT NULL
database/metadata/table-constraints.csv:712:item_bases,item_bases_item_base_id_not_null,CHECK,item_base_id IS NOT NULL
database/metadata/table-constraints.csv:713:item_bases,item_bases_item_level_not_null,CHECK,item_level IS NOT NULL
database/metadata/table-constraints.csv:714:item_bases,item_bases_mana_not_null,CHECK,mana IS NOT NULL
database/metadata/table-constraints.csv:715:item_bases,item_bases_name_not_null,CHECK,name IS NOT NULL
database/metadata/table-constraints.csv:716:item_bases,item_bases_required_level_not_null,CHECK,required_level IS NOT NULL
database/metadata/table-constraints.csv:717:item_bases,item_bases_slot_not_null,CHECK,slot IS NOT NULL
database/metadata/table-constraints.csv:718:item_bases,item_bases_spell_power_not_null,CHECK,spell_power IS NOT NULL
database/metadata/table-constraints.csv:719:item_bases,item_bases_updated_at_not_null,CHECK,updated_at IS NOT NULL
database/metadata/table-constraints.csv:720:item_bases,fk_item_bases_set_template,FOREIGN KEY,
database/metadata/table-constraints.csv:721:item_bases,fk_item_bases_unique_template,FOREIGN KEY,
database/metadata/table-constraints.csv:722:item_bases,item_bases_pkey,PRIMARY KEY,
database/metadata/table-constraints.csv:723:item_bases,ux_item_bases_code,UNIQUE,
database/metadata/table-constraints.csv:724:item_bases,ux_item_bases_name,UNIQUE,
database/metadata/table-constraints.csv:726:items,chk_items_item_score,CHECK,(item_score >= 0)
database/metadata/table-constraints.csv:727:items,chk_items_rarity,CHECK,"((rarity)::text = ANY ((ARRAY['Common'::character varying, 'Magic'::character varying, 'Rare'::character varying, 'Epic'::character varying, 'Legendary'::character varying])::text[]))"
database/metadata/table-constraints.csv:730:items,items_item_base_id_not_null,CHECK,item_base_id IS NOT NULL
database/metadata/table-constraints.csv:733:items,items_item_score_not_null,CHECK,item_score IS NOT NULL
database/metadata/table-constraints.csv:734:items,items_rarity_not_null,CHECK,rarity IS NOT NULL
database/metadata/table-constraints.csv:735:items,fk_items_item_base,FOREIGN KEY,
database/metadata/table-constraints.csv:752:loot_tables,chk_loot_tables_chance,CHECK,((drop_chance_percent > (0)::numeric) AND (drop_chance_percent <= (100)::numeric))
database/metadata/table-constraints.csv:753:loot_tables,chk_loot_tables_levels,CHECK,((min_item_level >= 1) AND (max_item_level >= min_item_level))
database/metadata/table-constraints.csv:754:loot_tables,loot_tables_created_at_not_null,CHECK,created_at IS NOT NULL
database/metadata/table-constraints.csv:755:loot_tables,loot_tables_drop_chance_percent_not_null,CHECK,drop_chance_percent IS NOT NULL
database/metadata/table-constraints.csv:756:loot_tables,loot_tables_is_enabled_not_null,CHECK,is_enabled IS NOT NULL
database/metadata/table-constraints.csv:757:loot_tables,loot_tables_item_base_id_not_null,CHECK,item_base_id IS NOT NULL
database/metadata/table-constraints.csv:758:loot_tables,loot_tables_loot_level_modifier_not_null,CHECK,loot_level_modifier IS NOT NULL
database/metadata/table-constraints.csv:759:loot_tables,loot_tables_loot_table_id_not_null,CHECK,loot_table_id IS NOT NULL
database/metadata/table-constraints.csv:760:loot_tables,loot_tables_max_item_level_not_null,CHECK,max_item_level IS NOT NULL
database/metadata/table-constraints.csv:761:loot_tables,loot_tables_min_item_level_not_null,CHECK,min_item_level IS NOT NULL
database/metadata/table-constraints.csv:762:loot_tables,loot_tables_monster_id_not_null,CHECK,monster_id IS NOT NULL
database/metadata/table-constraints.csv:763:loot_tables,loot_tables_updated_at_not_null,CHECK,updated_at IS NOT NULL
database/metadata/table-constraints.csv:764:loot_tables,fk_loot_tables_item_base,FOREIGN KEY,
database/metadata/table-constraints.csv:765:loot_tables,fk_loot_tables_monster,FOREIGN KEY,
database/metadata/table-constraints.csv:766:loot_tables,loot_tables_pkey,PRIMARY KEY,
database/metadata/table-constraints.csv:767:loot_tables,ux_loot_tables_monster_item,UNIQUE,
database/metadata/table-constraints.csv:815:materials,chk_materials_source,CHECK,((is_gatherable = true) OR (is_lootable = true) OR (vendor_available = true))
database/metadata/table-constraints.csv:823:materials,materials_is_lootable_not_null,CHECK,is_lootable IS NOT NULL
database/metadata/table-constraints.csv:895:monsters,monsters_loot_level_modifier_not_null,CHECK,loot_level_modifier IS NOT NULL
database/metadata/table-constraints.csv:921:other_loot_tables,chk_other_loot_tables_chance,CHECK,((drop_chance_percent > (0)::numeric) AND (drop_chance_percent <= (100)::numeric))
database/metadata/table-constraints.csv:922:other_loot_tables,chk_other_loot_tables_quantity,CHECK,((min_quantity >= 1) AND (max_quantity >= min_quantity))
database/metadata/table-constraints.csv:923:other_loot_tables,chk_other_loot_tables_target,CHECK,((((material_id IS NOT NULL))::integer + ((consumable_definition_id IS NOT NULL))::integer) = 1)
database/metadata/table-constraints.csv:924:other_loot_tables,other_loot_tables_created_at_not_null,CHECK,created_at IS NOT NULL
database/metadata/table-constraints.csv:925:other_loot_tables,other_loot_tables_drop_chance_percent_not_null,CHECK,drop_chance_percent IS NOT NULL
database/metadata/table-constraints.csv:926:other_loot_tables,other_loot_tables_is_enabled_not_null,CHECK,is_enabled IS NOT NULL
database/metadata/table-constraints.csv:927:other_loot_tables,other_loot_tables_max_quantity_not_null,CHECK,max_quantity IS NOT NULL
database/metadata/table-constraints.csv:928:other_loot_tables,other_loot_tables_min_quantity_not_null,CHECK,min_quantity IS NOT NULL
database/metadata/table-constraints.csv:929:other_loot_tables,other_loot_tables_monster_id_not_null,CHECK,monster_id IS NOT NULL
database/metadata/table-constraints.csv:930:other_loot_tables,other_loot_tables_other_loot_table_id_not_null,CHECK,other_loot_table_id IS NOT NULL
database/metadata/table-constraints.csv:931:other_loot_tables,other_loot_tables_updated_at_not_null,CHECK,updated_at IS NOT NULL
database/metadata/table-constraints.csv:932:other_loot_tables,fk_other_loot_tables_consumable,FOREIGN KEY,
database/metadata/table-constraints.csv:933:other_loot_tables,fk_other_loot_tables_material,FOREIGN KEY,
database/metadata/table-constraints.csv:934:other_loot_tables,fk_other_loot_tables_monster,FOREIGN KEY,
database/metadata/table-constraints.csv:935:other_loot_tables,other_loot_tables_pkey,PRIMARY KEY,
database/metadata/table-constraints.csv:1118:unique_pity_tracking,chk_unique_pity_tracking_chance,CHECK,((current_chance_percent >= (0)::numeric) AND (current_chance_percent <= (100)::numeric))
database/metadata/table-constraints.csv:1119:unique_pity_tracking,chk_unique_pity_tracking_kills,CHECK,(eligible_kill_count >= 0)
database/metadata/table-constraints.csv:1120:unique_pity_tracking,unique_pity_tracking_character_id_not_null,CHECK,character_id IS NOT NULL
database/metadata/table-constraints.csv:1121:unique_pity_tracking,unique_pity_tracking_created_at_not_null,CHECK,created_at IS NOT NULL
database/metadata/table-constraints.csv:1122:unique_pity_tracking,unique_pity_tracking_current_chance_percent_not_null,CHECK,current_chance_percent IS NOT NULL
database/metadata/table-constraints.csv:1123:unique_pity_tracking,unique_pity_tracking_eligible_kill_count_not_null,CHECK,eligible_kill_count IS NOT NULL
database/metadata/table-constraints.csv:1124:unique_pity_tracking,unique_pity_tracking_unique_pity_tracking_id_not_null,CHECK,unique_pity_tracking_id IS NOT NULL
database/metadata/table-constraints.csv:1125:unique_pity_tracking,unique_pity_tracking_updated_at_not_null,CHECK,updated_at IS NOT NULL
database/metadata/table-constraints.csv:1126:unique_pity_tracking,fk_unique_pity_tracking_character,FOREIGN KEY,
database/metadata/table-constraints.csv:1127:unique_pity_tracking,unique_pity_tracking_pkey,PRIMARY KEY,
database/metadata/table-constraints.csv:1128:unique_pity_tracking,unique_pity_tracking_character_id_key,UNIQUE,
database/metadata/table-foreign-keys.csv:93:inventory_items,item_id,items,item_id,CASCADE,NO ACTION
database/metadata/table-foreign-keys.csv:94:inventory_items,character_id,characters,character_id,CASCADE,NO ACTION
database/metadata/table-foreign-keys.csv:95:item_affixes,item_id,items,item_id,CASCADE,NO ACTION
database/metadata/table-foreign-keys.csv:96:item_affixes,affix_template_id,affix_templates,affix_template_id,RESTRICT,NO ACTION
database/metadata/table-foreign-keys.csv:97:item_bases,set_template_id,set_templates,set_template_id,RESTRICT,NO ACTION
database/metadata/table-foreign-keys.csv:98:item_bases,unique_template_id,unique_templates,unique_template_id,RESTRICT,NO ACTION
database/metadata/table-foreign-keys.csv:99:items,item_base_id,item_bases,item_base_id,RESTRICT,NO ACTION
database/metadata/table-foreign-keys.csv:101:loot_tables,monster_id,monsters,monster_id,CASCADE,NO ACTION
database/metadata/table-foreign-keys.csv:102:loot_tables,item_base_id,item_bases,item_base_id,RESTRICT,NO ACTION
database/metadata/table-foreign-keys.csv:116:other_loot_tables,monster_id,monsters,monster_id,CASCADE,NO ACTION
database/metadata/table-foreign-keys.csv:117:other_loot_tables,material_id,materials,material_id,RESTRICT,NO ACTION
database/metadata/table-foreign-keys.csv:118:other_loot_tables,consumable_definition_id,consumable_definitions,consumable_definition_id,RESTRICT,NO ACTION
database/metadata/table-foreign-keys.csv:130:unique_pity_tracking,character_id,characters,character_id,CASCADE,NO ACTION
database/migration-audit-dump.txt:339:    is_lootable BOOLEAN NOT NULL DEFAULT FALSE,
database/migration-audit-dump.txt:371:        CHECK (is_gatherable = TRUE OR is_lootable = TRUE OR vendor_available = TRUE)
database/migration-audit-dump.txt:386:CREATE INDEX ix_materials_is_lootable
database/migration-audit-dump.txt:387:    ON materials(is_lootable);
database/migration-audit-dump.txt:520:    loot_level_modifier INTEGER NOT NULL DEFAULT 0,
database/migration-audit-dump.txt:572:    loot_level_bonus INTEGER NOT NULL DEFAULT 0,
database/migration-audit-dump.txt:589:    CONSTRAINT chk_bosses_loot_level_bonus CHECK (loot_level_bonus >= 0),
database/migration-audit-dump.txt:782:FILE: 017_item_bases.sql
database/migration-audit-dump.txt:786:-- 017_item_bases.sql
database/migration-audit-dump.txt:790:CREATE TABLE item_bases (
database/migration-audit-dump.txt:791:    item_base_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
database/migration-audit-dump.txt:815:    base_item_score BIGINT NOT NULL DEFAULT 0,
database/migration-audit-dump.txt:824:    CONSTRAINT fk_item_bases_unique_template
database/migration-audit-dump.txt:829:    CONSTRAINT fk_item_bases_set_template
database/migration-audit-dump.txt:834:    CONSTRAINT ux_item_bases_name UNIQUE (name),
database/migration-audit-dump.txt:836:    CONSTRAINT chk_item_bases_levels
database/migration-audit-dump.txt:839:    CONSTRAINT chk_item_bases_slot
database/migration-audit-dump.txt:842:    CONSTRAINT chk_item_bases_weapon_type
database/migration-audit-dump.txt:849:    CONSTRAINT chk_item_bases_stats
database/migration-audit-dump.txt:854:            AND base_item_score >= 0
database/migration-audit-dump.txt:857:    CONSTRAINT chk_item_bases_template_type
database/migration-audit-dump.txt:867:CREATE INDEX ix_item_bases_item_level
database/migration-audit-dump.txt:868:    ON item_bases(item_level);
database/migration-audit-dump.txt:870:CREATE INDEX ix_item_bases_slot
database/migration-audit-dump.txt:871:    ON item_bases(slot);
database/migration-audit-dump.txt:873:CREATE INDEX ix_item_bases_is_boss_exclusive
database/migration-audit-dump.txt:874:    ON item_bases(is_boss_exclusive);
database/migration-audit-dump.txt:876:CREATE INDEX ix_item_bases_unique_template_id
database/migration-audit-dump.txt:877:    ON item_bases(unique_template_id);
database/migration-audit-dump.txt:879:CREATE INDEX ix_item_bases_set_template_id
database/migration-audit-dump.txt:880:    ON item_bases(set_template_id);
database/migration-audit-dump.txt:934:-- Requires: item_bases
database/migration-audit-dump.txt:939:    item_base_id UUID NOT NULL,
database/migration-audit-dump.txt:942:    rarity VARCHAR(20) NOT NULL,
database/migration-audit-dump.txt:943:    item_score BIGINT NOT NULL DEFAULT 0,
database/migration-audit-dump.txt:948:    CONSTRAINT fk_items_item_base
database/migration-audit-dump.txt:949:        FOREIGN KEY (item_base_id)
database/migration-audit-dump.txt:950:        REFERENCES item_bases(item_base_id)
database/migration-audit-dump.txt:956:    CONSTRAINT chk_items_rarity
database/migration-audit-dump.txt:957:        CHECK (rarity IN ('Common', 'Magic', 'Rare', 'Epic', 'Legendary')),
database/migration-audit-dump.txt:959:    CONSTRAINT chk_items_item_score
database/migration-audit-dump.txt:960:        CHECK (item_score >= 0)
database/migration-audit-dump.txt:963:CREATE INDEX ix_items_item_base_id
database/migration-audit-dump.txt:964:    ON items(item_base_id);
database/migration-audit-dump.txt:969:CREATE INDEX ix_items_rarity
database/migration-audit-dump.txt:970:    ON items(rarity);
database/migration-audit-dump.txt:1527:FILE: 029_inventory_items.sql
database/migration-audit-dump.txt:1531:-- 029_inventory_items.sql
database/migration-audit-dump.txt:1535:CREATE TABLE inventory_items (
database/migration-audit-dump.txt:1543:    CONSTRAINT fk_inventory_items_character
database/migration-audit-dump.txt:1548:    CONSTRAINT fk_inventory_items_item
database/migration-audit-dump.txt:1553:    CONSTRAINT ux_inventory_items_item_id UNIQUE (item_id),
database/migration-audit-dump.txt:1554:    CONSTRAINT ux_inventory_items_character_position UNIQUE (character_id, position),
database/migration-audit-dump.txt:1555:    CONSTRAINT chk_inventory_items_position CHECK (position >= 1)
database/migration-audit-dump.txt:1558:CREATE INDEX ix_inventory_items_character_id
database/migration-audit-dump.txt:1559:    ON inventory_items(character_id);
database/migration-audit-dump.txt:1561:CREATE INDEX ix_inventory_items_is_equipped
database/migration-audit-dump.txt:1562:    ON inventory_items(is_equipped);
database/migration-audit-dump.txt:1673:FILE: 033_item_affixes.sql
database/migration-audit-dump.txt:1677:-- 033_item_affixes.sql
database/migration-audit-dump.txt:1681:CREATE TABLE item_affixes (
database/migration-audit-dump.txt:1682:    item_affix_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
database/migration-audit-dump.txt:1688:    CONSTRAINT fk_item_affixes_item
database/migration-audit-dump.txt:1690:    CONSTRAINT fk_item_affixes_template
database/migration-audit-dump.txt:1692:    CONSTRAINT ux_item_affixes_item_template UNIQUE (item_id, affix_template_id),
database/migration-audit-dump.txt:1693:    CONSTRAINT chk_item_affixes_roll_value CHECK (roll_value >= 0)
database/migration-audit-dump.txt:1696:CREATE INDEX ix_item_affixes_item_id ON item_affixes(item_id);
database/migration-audit-dump.txt:1697:CREATE INDEX ix_item_affixes_template_id ON item_affixes(affix_template_id);
database/migration-audit-dump.txt:2338:FILE: 056_loot_tables.sql
database/migration-audit-dump.txt:2341:-- 056_loot_tables.sql
database/migration-audit-dump.txt:2342:-- Requires: monsters, item_bases
database/migration-audit-dump.txt:2343:CREATE TABLE loot_tables (
database/migration-audit-dump.txt:2344: loot_table_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
database/migration-audit-dump.txt:2346: item_base_id UUID NOT NULL,
database/migration-audit-dump.txt:2350: loot_level_modifier INTEGER NOT NULL DEFAULT 0,
database/migration-audit-dump.txt:2354: CONSTRAINT fk_loot_tables_monster FOREIGN KEY (monster_id) REFERENCES monsters(monster_id) ON DELETE CASCADE,
database/migration-audit-dump.txt:2355: CONSTRAINT fk_loot_tables_item_base FOREIGN KEY (item_base_id) REFERENCES item_bases(item_base_id) ON DELETE RESTRICT,
database/migration-audit-dump.txt:2356: CONSTRAINT ux_loot_tables_monster_item UNIQUE (monster_id,item_base_id),
database/migration-audit-dump.txt:2357: CONSTRAINT chk_loot_tables_chance CHECK (drop_chance_percent > 0 AND drop_chance_percent <= 100),
database/migration-audit-dump.txt:2358: CONSTRAINT chk_loot_tables_levels CHECK (min_item_level >= 1 AND max_item_level >= min_item_level)
database/migration-audit-dump.txt:2360:CREATE INDEX ix_loot_tables_monster_id ON loot_tables(monster_id);
database/migration-audit-dump.txt:2361:CREATE INDEX ix_loot_tables_item_base_id ON loot_tables(item_base_id);
database/migration-audit-dump.txt:2364:FILE: 057_other_loot_tables.sql
database/migration-audit-dump.txt:2367:-- 057_other_loot_tables.sql
database/migration-audit-dump.txt:2369:CREATE TABLE other_loot_tables (
database/migration-audit-dump.txt:2370: other_loot_table_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
database/migration-audit-dump.txt:2380: CONSTRAINT fk_other_loot_tables_monster FOREIGN KEY (monster_id) REFERENCES monsters(monster_id) ON DELETE CASCADE,
database/migration-audit-dump.txt:2381: CONSTRAINT fk_other_loot_tables_material FOREIGN KEY (material_id) REFERENCES materials(material_id) ON DELETE RESTRICT,
database/migration-audit-dump.txt:2382: CONSTRAINT fk_other_loot_tables_consumable FOREIGN KEY (consumable_definition_id) REFERENCES consumable_definitions(consumable_definition_id) ON DELETE RESTRICT,
database/migration-audit-dump.txt:2383: CONSTRAINT chk_other_loot_tables_target CHECK ((material_id IS NOT NULL)::integer + (consumable_definition_id IS NOT NULL)::integer = 1),
database/migration-audit-dump.txt:2384: CONSTRAINT chk_other_loot_tables_chance CHECK (drop_chance_percent > 0 AND drop_chance_percent <= 100),
database/migration-audit-dump.txt:2385: CONSTRAINT chk_other_loot_tables_quantity CHECK (min_quantity >= 1 AND max_quantity >= min_quantity)
database/migration-audit-dump.txt:2387:CREATE INDEX ix_other_loot_tables_monster_id ON other_loot_tables(monster_id);
database/migration-audit-dump.txt:2388:CREATE INDEX ix_other_loot_tables_material_id ON other_loot_tables(material_id);
database/migration-audit-dump.txt:2389:CREATE INDEX ix_other_loot_tables_consumable_id ON other_loot_tables(consumable_definition_id);
database/migration-audit-dump.txt:2392:FILE: 058_unique_pity_tracking.sql
database/migration-audit-dump.txt:2395:-- 058_unique_pity_tracking.sql
database/migration-audit-dump.txt:2397:CREATE TABLE unique_pity_tracking (
database/migration-audit-dump.txt:2398: unique_pity_tracking_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
database/migration-audit-dump.txt:2406: CONSTRAINT fk_unique_pity_tracking_character FOREIGN KEY (character_id) REFERENCES characters(character_id) ON DELETE CASCADE,
database/migration-audit-dump.txt:2407: CONSTRAINT chk_unique_pity_tracking_kills CHECK (eligible_kill_count >= 0),
database/migration-audit-dump.txt:2408: CONSTRAINT chk_unique_pity_tracking_chance CHECK (current_chance_percent >= 0 AND current_chance_percent <= 100)
database/migrations/007_materials.sql:18:    is_lootable BOOLEAN NOT NULL DEFAULT FALSE,
database/migrations/007_materials.sql:50:        CHECK (is_gatherable = TRUE OR is_lootable = TRUE OR vendor_available = TRUE)
database/migrations/007_materials.sql:65:CREATE INDEX ix_materials_is_lootable
database/migrations/007_materials.sql:66:    ON materials(is_lootable);
database/migrations/011_monsters.sql:28:    loot_level_modifier INTEGER NOT NULL DEFAULT 0,
database/migrations/012_bosses.sql:11:    loot_level_bonus INTEGER NOT NULL DEFAULT 0,
database/migrations/012_bosses.sql:28:    CONSTRAINT chk_bosses_loot_level_bonus CHECK (loot_level_bonus >= 0),
database/migrations/017_item_bases.sql:2:-- 017_item_bases.sql
database/migrations/017_item_bases.sql:6:CREATE TABLE item_bases (
database/migrations/017_item_bases.sql:7:    item_base_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
database/migrations/017_item_bases.sql:31:    base_item_score BIGINT NOT NULL DEFAULT 0,
database/migrations/017_item_bases.sql:40:    CONSTRAINT fk_item_bases_unique_template
database/migrations/017_item_bases.sql:45:    CONSTRAINT fk_item_bases_set_template
database/migrations/017_item_bases.sql:50:    CONSTRAINT ux_item_bases_name UNIQUE (name),
database/migrations/017_item_bases.sql:52:    CONSTRAINT chk_item_bases_levels
database/migrations/017_item_bases.sql:55:    CONSTRAINT chk_item_bases_slot
database/migrations/017_item_bases.sql:58:    CONSTRAINT chk_item_bases_weapon_type
database/migrations/017_item_bases.sql:65:    CONSTRAINT chk_item_bases_stats
database/migrations/017_item_bases.sql:70:            AND base_item_score >= 0
database/migrations/017_item_bases.sql:73:    CONSTRAINT chk_item_bases_template_type
database/migrations/017_item_bases.sql:83:CREATE INDEX ix_item_bases_item_level
database/migrations/017_item_bases.sql:84:    ON item_bases(item_level);
database/migrations/017_item_bases.sql:86:CREATE INDEX ix_item_bases_slot
database/migrations/017_item_bases.sql:87:    ON item_bases(slot);
database/migrations/017_item_bases.sql:89:CREATE INDEX ix_item_bases_is_boss_exclusive
database/migrations/017_item_bases.sql:90:    ON item_bases(is_boss_exclusive);
database/migrations/017_item_bases.sql:92:CREATE INDEX ix_item_bases_unique_template_id
database/migrations/017_item_bases.sql:93:    ON item_bases(unique_template_id);
database/migrations/017_item_bases.sql:95:CREATE INDEX ix_item_bases_set_template_id
database/migrations/017_item_bases.sql:96:    ON item_bases(set_template_id);
database/migrations/019_items.sql:3:-- Requires: item_bases
database/migrations/019_items.sql:8:    item_base_id UUID NOT NULL,
database/migrations/019_items.sql:11:    rarity VARCHAR(20) NOT NULL,
database/migrations/019_items.sql:12:    item_score BIGINT NOT NULL DEFAULT 0,
database/migrations/019_items.sql:17:    CONSTRAINT fk_items_item_base
database/migrations/019_items.sql:18:        FOREIGN KEY (item_base_id)
database/migrations/019_items.sql:19:        REFERENCES item_bases(item_base_id)
database/migrations/019_items.sql:25:    CONSTRAINT chk_items_rarity
database/migrations/019_items.sql:26:        CHECK (rarity IN ('Common', 'Magic', 'Rare', 'Epic', 'Legendary')),
database/migrations/019_items.sql:28:    CONSTRAINT chk_items_item_score
database/migrations/019_items.sql:29:        CHECK (item_score >= 0)
database/migrations/019_items.sql:32:CREATE INDEX ix_items_item_base_id
database/migrations/019_items.sql:33:    ON items(item_base_id);
database/migrations/019_items.sql:38:CREATE INDEX ix_items_rarity
database/migrations/019_items.sql:39:    ON items(rarity);
database/migrations/029_inventory_items.sql:2:-- 029_inventory_items.sql
database/migrations/029_inventory_items.sql:6:CREATE TABLE inventory_items (
database/migrations/029_inventory_items.sql:14:    CONSTRAINT fk_inventory_items_character
database/migrations/029_inventory_items.sql:19:    CONSTRAINT fk_inventory_items_item
database/migrations/029_inventory_items.sql:24:    CONSTRAINT ux_inventory_items_item_id UNIQUE (item_id),
database/migrations/029_inventory_items.sql:25:    CONSTRAINT ux_inventory_items_character_position UNIQUE (character_id, position),
database/migrations/029_inventory_items.sql:26:    CONSTRAINT chk_inventory_items_position CHECK (position >= 1)
database/migrations/029_inventory_items.sql:29:CREATE INDEX ix_inventory_items_character_id
database/migrations/029_inventory_items.sql:30:    ON inventory_items(character_id);
database/migrations/029_inventory_items.sql:32:CREATE INDEX ix_inventory_items_is_equipped
database/migrations/029_inventory_items.sql:33:    ON inventory_items(is_equipped);
database/migrations/033_item_affixes.sql:2:-- 033_item_affixes.sql
database/migrations/033_item_affixes.sql:6:CREATE TABLE item_affixes (
database/migrations/033_item_affixes.sql:7:    item_affix_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
database/migrations/033_item_affixes.sql:13:    CONSTRAINT fk_item_affixes_item
database/migrations/033_item_affixes.sql:15:    CONSTRAINT fk_item_affixes_template
database/migrations/033_item_affixes.sql:17:    CONSTRAINT ux_item_affixes_item_template UNIQUE (item_id, affix_template_id),
database/migrations/033_item_affixes.sql:18:    CONSTRAINT chk_item_affixes_roll_value CHECK (roll_value >= 0)
database/migrations/033_item_affixes.sql:21:CREATE INDEX ix_item_affixes_item_id ON item_affixes(item_id);
database/migrations/033_item_affixes.sql:22:CREATE INDEX ix_item_affixes_template_id ON item_affixes(affix_template_id);
database/migrations/056_loot_tables.sql:1:∩╗┐-- 056_loot_tables.sql
database/migrations/056_loot_tables.sql:2:-- Requires: monsters, item_bases
database/migrations/056_loot_tables.sql:3:CREATE TABLE loot_tables (
database/migrations/056_loot_tables.sql:4: loot_table_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
database/migrations/056_loot_tables.sql:6: item_base_id UUID NOT NULL,
database/migrations/056_loot_tables.sql:10: loot_level_modifier INTEGER NOT NULL DEFAULT 0,
database/migrations/056_loot_tables.sql:14: CONSTRAINT fk_loot_tables_monster FOREIGN KEY (monster_id) REFERENCES monsters(monster_id) ON DELETE CASCADE,
database/migrations/056_loot_tables.sql:15: CONSTRAINT fk_loot_tables_item_base FOREIGN KEY (item_base_id) REFERENCES item_bases(item_base_id) ON DELETE RESTRICT,
database/migrations/056_loot_tables.sql:16: CONSTRAINT ux_loot_tables_monster_item UNIQUE (monster_id,item_base_id),
database/migrations/056_loot_tables.sql:17: CONSTRAINT chk_loot_tables_chance CHECK (drop_chance_percent > 0 AND drop_chance_percent <= 100),
database/migrations/056_loot_tables.sql:18: CONSTRAINT chk_loot_tables_levels CHECK (min_item_level >= 1 AND max_item_level >= min_item_level)
database/migrations/056_loot_tables.sql:20:CREATE INDEX ix_loot_tables_monster_id ON loot_tables(monster_id);
database/migrations/056_loot_tables.sql:21:CREATE INDEX ix_loot_tables_item_base_id ON loot_tables(item_base_id);
database/migrations/057_other_loot_tables.sql:1:∩╗┐-- 057_other_loot_tables.sql
database/migrations/057_other_loot_tables.sql:3:CREATE TABLE other_loot_tables (
database/migrations/057_other_loot_tables.sql:4: other_loot_table_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
database/migrations/057_other_loot_tables.sql:14: CONSTRAINT fk_other_loot_tables_monster FOREIGN KEY (monster_id) REFERENCES monsters(monster_id) ON DELETE CASCADE,
database/migrations/057_other_loot_tables.sql:15: CONSTRAINT fk_other_loot_tables_material FOREIGN KEY (material_id) REFERENCES materials(material_id) ON DELETE RESTRICT,
database/migrations/057_other_loot_tables.sql:16: CONSTRAINT fk_other_loot_tables_consumable FOREIGN KEY (consumable_definition_id) REFERENCES consumable_definitions(consumable_definition_id) ON DELETE RESTRICT,
database/migrations/057_other_loot_tables.sql:17: CONSTRAINT chk_other_loot_tables_target CHECK ((material_id IS NOT NULL)::integer + (consumable_definition_id IS NOT NULL)::integer = 1),
database/migrations/057_other_loot_tables.sql:18: CONSTRAINT chk_other_loot_tables_chance CHECK (drop_chance_percent > 0 AND drop_chance_percent <= 100),
database/migrations/057_other_loot_tables.sql:19: CONSTRAINT chk_other_loot_tables_quantity CHECK (min_quantity >= 1 AND max_quantity >= min_quantity)
database/migrations/057_other_loot_tables.sql:21:CREATE INDEX ix_other_loot_tables_monster_id ON other_loot_tables(monster_id);
database/migrations/057_other_loot_tables.sql:22:CREATE INDEX ix_other_loot_tables_material_id ON other_loot_tables(material_id);
database/migrations/057_other_loot_tables.sql:23:CREATE INDEX ix_other_loot_tables_consumable_id ON other_loot_tables(consumable_definition_id);
database/migrations/058_unique_pity_tracking.sql:1:∩╗┐-- 058_unique_pity_tracking.sql
database/migrations/058_unique_pity_tracking.sql:3:CREATE TABLE unique_pity_tracking (
database/migrations/058_unique_pity_tracking.sql:4: unique_pity_tracking_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
database/migrations/058_unique_pity_tracking.sql:12: CONSTRAINT fk_unique_pity_tracking_character FOREIGN KEY (character_id) REFERENCES characters(character_id) ON DELETE CASCADE,
database/migrations/058_unique_pity_tracking.sql:13: CONSTRAINT chk_unique_pity_tracking_kills CHECK (eligible_kill_count >= 0),
database/migrations/058_unique_pity_tracking.sql:14: CONSTRAINT chk_unique_pity_tracking_chance CHECK (current_chance_percent >= 0 AND current_chance_percent <= 100)
database/migrations/079_add_stable_content_codes.sql:357:-- item_bases
database/migrations/079_add_stable_content_codes.sql:360:ALTER TABLE item_bases
database/migrations/079_add_stable_content_codes.sql:365:        item_base_id,
database/migrations/079_add_stable_content_codes.sql:370:    FROM item_bases
database/migrations/079_add_stable_content_codes.sql:372:UPDATE item_bases AS target
database/migrations/079_add_stable_content_codes.sql:376:        THEN '_' || LEFT(target.item_base_id::TEXT, 8)
database/migrations/079_add_stable_content_codes.sql:380:WHERE target.item_base_id = source.item_base_id;
database/migrations/079_add_stable_content_codes.sql:382:ALTER TABLE item_bases
database/migrations/079_add_stable_content_codes.sql:385:ALTER TABLE item_bases
database/migrations/079_add_stable_content_codes.sql:386:    ADD CONSTRAINT ux_item_bases_code UNIQUE (code);
database/migrations/079_add_stable_content_codes.sql:388:ALTER TABLE item_bases
database/migrations/079_add_stable_content_codes.sql:389:    ADD CONSTRAINT chk_item_bases_code
database/migrations/082_add_item_handedness.sql:3:ALTER TABLE item_bases
database/migrations/082_add_item_handedness.sql:6:UPDATE item_bases
database/migrations/082_add_item_handedness.sql:10:ALTER TABLE item_bases
database/migrations/082_add_item_handedness.sql:11:    ADD CONSTRAINT chk_item_bases_handedness_value
database/migrations/082_add_item_handedness.sql:20:    ADD CONSTRAINT chk_item_bases_handedness_slot
database/migrations/090_item_loot_generation.sql:2:-- 090_item_loot_generation.sql
database/migrations/090_item_loot_generation.sql:3:-- M7 Item and Loot Generation schema foundation
database/migrations/090_item_loot_generation.sql:27:        FROM item_bases
database/migrations/090_item_loot_generation.sql:38:            'M7 migration requires integral item_bases statistics.';
database/migrations/090_item_loot_generation.sql:63:        FROM item_affixes
database/migrations/090_item_loot_generation.sql:67:            'M7 migration requires integral item_affixes rolls.';
database/migrations/090_item_loot_generation.sql:72:        FROM item_affixes
database/migrations/090_item_loot_generation.sql:102:-- Regular Items use rarity; Unique/Set Items use NULL.
database/migrations/090_item_loot_generation.sql:106:    DROP CONSTRAINT chk_items_rarity,
database/migrations/090_item_loot_generation.sql:107:    ALTER COLUMN rarity DROP NOT NULL,
database/migrations/090_item_loot_generation.sql:108:    ADD CONSTRAINT chk_items_rarity
database/migrations/090_item_loot_generation.sql:110:            rarity IS NULL
database/migrations/090_item_loot_generation.sql:111:            OR rarity IN ('Common', 'Magic', 'Rare', 'Epic', 'Legendary')
database/migrations/090_item_loot_generation.sql:130:ALTER TABLE item_bases
database/migrations/090_item_loot_generation.sql:131:    DROP CONSTRAINT chk_item_bases_stats;
database/migrations/090_item_loot_generation.sql:133:ALTER TABLE item_bases
database/migrations/090_item_loot_generation.sql:144:ALTER TABLE item_bases
database/migrations/090_item_loot_generation.sql:145:    ADD CONSTRAINT chk_item_bases_stats
database/migrations/090_item_loot_generation.sql:155:            AND base_item_score >= 0
database/migrations/090_item_loot_generation.sql:161:ALTER TABLE item_affixes
database/migrations/090_item_loot_generation.sql:162:    DROP CONSTRAINT ux_item_affixes_item_template,
database/migrations/090_item_loot_generation.sql:163:    DROP CONSTRAINT chk_item_affixes_roll_value,
database/migrations/090_item_loot_generation.sql:164:    ADD COLUMN affix_position SMALLINT;
database/migrations/090_item_loot_generation.sql:168:        item_affix_id,
database/migrations/090_item_loot_generation.sql:171:            ORDER BY created_at, item_affix_id
database/migrations/090_item_loot_generation.sql:173:    FROM item_affixes
database/migrations/090_item_loot_generation.sql:175:UPDATE item_affixes AS target
database/migrations/090_item_loot_generation.sql:176:SET affix_position = source.generated_position::SMALLINT
database/migrations/090_item_loot_generation.sql:178:WHERE target.item_affix_id = source.item_affix_id;
database/migrations/090_item_loot_generation.sql:180:ALTER TABLE item_affixes
database/migrations/090_item_loot_generation.sql:183:    ALTER COLUMN affix_position SET NOT NULL,
database/migrations/090_item_loot_generation.sql:184:    ADD CONSTRAINT ux_item_affixes_item_position
database/migrations/090_item_loot_generation.sql:185:        UNIQUE (item_id, affix_position),
database/migrations/090_item_loot_generation.sql:186:    ADD CONSTRAINT chk_item_affixes_position
database/migrations/090_item_loot_generation.sql:187:        CHECK (affix_position BETWEEN 1 AND 4),
database/migrations/090_item_loot_generation.sql:188:    ADD CONSTRAINT chk_item_affixes_roll_value
database/migrations/090_item_loot_generation.sql:194:CREATE TABLE item_base_affix_weights (
database/migrations/090_item_loot_generation.sql:195:    item_base_affix_weight_id UUID
database/migrations/090_item_loot_generation.sql:198:    item_base_id UUID NOT NULL,
database/migrations/090_item_loot_generation.sql:203:    CONSTRAINT fk_item_base_affix_weights_item_base
database/migrations/090_item_loot_generation.sql:204:        FOREIGN KEY (item_base_id)
database/migrations/090_item_loot_generation.sql:205:        REFERENCES item_bases(item_base_id)
database/migrations/090_item_loot_generation.sql:207:    CONSTRAINT fk_item_base_affix_weights_affix_template
database/migrations/090_item_loot_generation.sql:211:    CONSTRAINT ux_item_base_affix_weights_base_template
database/migrations/090_item_loot_generation.sql:212:        UNIQUE (item_base_id, affix_template_id),
database/migrations/090_item_loot_generation.sql:213:    CONSTRAINT chk_item_base_affix_weights_selection_weight
database/migrations/090_item_loot_generation.sql:217:CREATE INDEX ix_item_base_affix_weights_item_base_id
database/migrations/090_item_loot_generation.sql:218:    ON item_base_affix_weights(item_base_id);
database/migrations/090_item_loot_generation.sql:220:CREATE INDEX ix_item_base_affix_weights_affix_template_id
database/migrations/090_item_loot_generation.sql:221:    ON item_base_affix_weights(affix_template_id);
database/migrations/090_item_loot_generation.sql:226:CREATE TABLE item_base_fixed_stat_ranges (
database/migrations/090_item_loot_generation.sql:227:    item_base_fixed_stat_range_id UUID
database/migrations/090_item_loot_generation.sql:230:    item_base_id UUID NOT NULL,
database/migrations/090_item_loot_generation.sql:237:    CONSTRAINT fk_item_base_fixed_stat_ranges_item_base
database/migrations/090_item_loot_generation.sql:238:        FOREIGN KEY (item_base_id)
database/migrations/090_item_loot_generation.sql:239:        REFERENCES item_bases(item_base_id)
database/migrations/090_item_loot_generation.sql:241:    CONSTRAINT ux_item_base_fixed_stat_ranges_base_position
database/migrations/090_item_loot_generation.sql:242:        UNIQUE (item_base_id, stat_position),
database/migrations/090_item_loot_generation.sql:243:    CONSTRAINT ux_item_base_fixed_stat_ranges_base_type
database/migrations/090_item_loot_generation.sql:244:        UNIQUE (item_base_id, stat_type),
database/migrations/090_item_loot_generation.sql:245:    CONSTRAINT chk_item_base_fixed_stat_ranges_position
database/migrations/090_item_loot_generation.sql:247:    CONSTRAINT chk_item_base_fixed_stat_ranges_type
database/migrations/090_item_loot_generation.sql:260:    CONSTRAINT chk_item_base_fixed_stat_ranges_values
database/migrations/090_item_loot_generation.sql:264:CREATE INDEX ix_item_base_fixed_stat_ranges_item_base_id
database/migrations/090_item_loot_generation.sql:265:    ON item_base_fixed_stat_ranges(item_base_id);
database/migrations/090_item_loot_generation.sql:270:        item_base.item_base_id,
database/migrations/090_item_loot_generation.sql:275:    FROM item_bases AS item_base
database/migrations/090_item_loot_generation.sql:277:        ON template.unique_template_id = item_base.unique_template_id
database/migrations/090_item_loot_generation.sql:304:    WHERE item_base.is_unique = TRUE
database/migrations/090_item_loot_generation.sql:312:        item_base_id,
database/migrations/090_item_loot_generation.sql:314:            PARTITION BY item_base_id
database/migrations/090_item_loot_generation.sql:322:INSERT INTO item_base_fixed_stat_ranges (
database/migrations/090_item_loot_generation.sql:323:    item_base_id,
database/migrations/090_item_loot_generation.sql:330:    item_base_id,
database/migrations/090_item_loot_generation.sql:407:ALTER TABLE loot_tables
database/migrations/090_item_loot_generation.sql:410:UPDATE loot_tables
database/migrations/090_item_loot_generation.sql:413:ALTER TABLE loot_tables
database/migrations/090_item_loot_generation.sql:414:    DROP CONSTRAINT chk_loot_tables_chance,
database/migrations/090_item_loot_generation.sql:415:    DROP CONSTRAINT chk_loot_tables_levels,
database/migrations/090_item_loot_generation.sql:419:    DROP COLUMN loot_level_modifier,
database/migrations/090_item_loot_generation.sql:421:    ADD CONSTRAINT chk_loot_tables_selection_weight
database/migrations/090_item_loot_generation.sql:425:-- Other Loot becomes one weighted pool after the
database/migrations/090_item_loot_generation.sql:426:-- independent Other Loot success roll.
database/migrations/090_item_loot_generation.sql:428:ALTER TABLE other_loot_tables
database/migrations/090_item_loot_generation.sql:431:UPDATE other_loot_tables
database/migrations/090_item_loot_generation.sql:434:ALTER TABLE other_loot_tables
database/migrations/090_item_loot_generation.sql:435:    DROP CONSTRAINT chk_other_loot_tables_chance,
database/migrations/090_item_loot_generation.sql:438:    ADD CONSTRAINT chk_other_loot_tables_selection_weight
database/migrations/090_item_loot_generation.sql:441:CREATE UNIQUE INDEX ux_other_loot_tables_monster_material
database/migrations/090_item_loot_generation.sql:442:    ON other_loot_tables(monster_id, material_id)
database/migrations/090_item_loot_generation.sql:445:CREATE UNIQUE INDEX ux_other_loot_tables_monster_consumable
database/migrations/090_item_loot_generation.sql:446:    ON other_loot_tables(monster_id, consumable_definition_id)
database/migrations/090_item_loot_generation.sql:458:    item_base_id UUID NOT NULL,
database/migrations/090_item_loot_generation.sql:471:    CONSTRAINT fk_special_item_sources_item_base
database/migrations/090_item_loot_generation.sql:472:        FOREIGN KEY (item_base_id)
database/migrations/090_item_loot_generation.sql:473:        REFERENCES item_bases(item_base_id)
database/migrations/090_item_loot_generation.sql:486:    ON special_item_sources(monster_id, item_base_id)
database/migrations/090_item_loot_generation.sql:490:    ON special_item_sources(monster_family_id, item_base_id)
database/migrations/090_item_loot_generation.sql:501:CREATE INDEX ix_special_item_sources_item_base_id
database/migrations/090_item_loot_generation.sql:502:    ON special_item_sources(item_base_id);
database/migrations/090_item_loot_generation.sql:507:CREATE TABLE item_score_coefficients (
database/migrations/090_item_loot_generation.sql:508:    item_score_coefficient_id UUID
database/migrations/090_item_loot_generation.sql:515:    CONSTRAINT ux_item_score_coefficients_component
database/migrations/090_item_loot_generation.sql:517:    CONSTRAINT chk_item_score_coefficients_component
database/migrations/090_item_loot_generation.sql:531:    CONSTRAINT chk_item_score_coefficients_value
database/migrations/090_item_loot_generation.sql:538:ALTER TABLE unique_pity_tracking
database/migrations/090_item_loot_generation.sql:539:    DROP CONSTRAINT chk_unique_pity_tracking_chance,
database/migrations/090_item_loot_generation.sql:540:    DROP CONSTRAINT chk_unique_pity_tracking_kills;
database/migrations/090_item_loot_generation.sql:542:UPDATE unique_pity_tracking
database/migrations/090_item_loot_generation.sql:556:ALTER TABLE unique_pity_tracking
database/migrations/090_item_loot_generation.sql:561:    ADD CONSTRAINT chk_unique_pity_tracking_kills
database/migrations/090_item_loot_generation.sql:563:    ADD CONSTRAINT chk_unique_pity_tracking_chance
database/migrations/090_item_loot_generation.sql:567:    ADD CONSTRAINT chk_unique_pity_tracking_state
database/schema-v1.sql:341:    is_lootable BOOLEAN NOT NULL DEFAULT FALSE,
database/schema-v1.sql:373:        CHECK (is_gatherable = TRUE OR is_lootable = TRUE OR vendor_available = TRUE)
database/schema-v1.sql:388:CREATE INDEX ix_materials_is_lootable
database/schema-v1.sql:389:    ON materials(is_lootable);
database/schema-v1.sql:522:    loot_level_modifier INTEGER NOT NULL DEFAULT 0,
database/schema-v1.sql:574:    loot_level_bonus INTEGER NOT NULL DEFAULT 0,
database/schema-v1.sql:591:    CONSTRAINT chk_bosses_loot_level_bonus CHECK (loot_level_bonus >= 0),
database/schema-v1.sql:784:-- FILE: 017_item_bases.sql
database/schema-v1.sql:788:-- 017_item_bases.sql
database/schema-v1.sql:792:CREATE TABLE item_bases (
database/schema-v1.sql:793:    item_base_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
database/schema-v1.sql:817:    base_item_score BIGINT NOT NULL DEFAULT 0,
database/schema-v1.sql:826:    CONSTRAINT fk_item_bases_unique_template
database/schema-v1.sql:831:    CONSTRAINT fk_item_bases_set_template
database/schema-v1.sql:836:    CONSTRAINT ux_item_bases_name UNIQUE (name),
database/schema-v1.sql:838:    CONSTRAINT chk_item_bases_levels
database/schema-v1.sql:841:    CONSTRAINT chk_item_bases_slot
database/schema-v1.sql:844:    CONSTRAINT chk_item_bases_weapon_type
database/schema-v1.sql:851:    CONSTRAINT chk_item_bases_stats
database/schema-v1.sql:856:            AND base_item_score >= 0
database/schema-v1.sql:859:    CONSTRAINT chk_item_bases_template_type
database/schema-v1.sql:869:CREATE INDEX ix_item_bases_item_level
database/schema-v1.sql:870:    ON item_bases(item_level);
database/schema-v1.sql:872:CREATE INDEX ix_item_bases_slot
database/schema-v1.sql:873:    ON item_bases(slot);
database/schema-v1.sql:875:CREATE INDEX ix_item_bases_is_boss_exclusive
database/schema-v1.sql:876:    ON item_bases(is_boss_exclusive);
database/schema-v1.sql:878:CREATE INDEX ix_item_bases_unique_template_id
database/schema-v1.sql:879:    ON item_bases(unique_template_id);
database/schema-v1.sql:881:CREATE INDEX ix_item_bases_set_template_id
database/schema-v1.sql:882:    ON item_bases(set_template_id);
database/schema-v1.sql:936:-- Requires: item_bases
database/schema-v1.sql:941:    item_base_id UUID NOT NULL,
database/schema-v1.sql:944:    rarity VARCHAR(20) NOT NULL,
database/schema-v1.sql:945:    item_score BIGINT NOT NULL DEFAULT 0,
database/schema-v1.sql:950:    CONSTRAINT fk_items_item_base
database/schema-v1.sql:951:        FOREIGN KEY (item_base_id)
database/schema-v1.sql:952:        REFERENCES item_bases(item_base_id)
database/schema-v1.sql:958:    CONSTRAINT chk_items_rarity
database/schema-v1.sql:959:        CHECK (rarity IN ('Common', 'Magic', 'Rare', 'Epic', 'Legendary')),
database/schema-v1.sql:961:    CONSTRAINT chk_items_item_score
database/schema-v1.sql:962:        CHECK (item_score >= 0)
database/schema-v1.sql:965:CREATE INDEX ix_items_item_base_id
database/schema-v1.sql:966:    ON items(item_base_id);
database/schema-v1.sql:971:CREATE INDEX ix_items_rarity
database/schema-v1.sql:972:    ON items(rarity);
database/schema-v1.sql:1529:-- FILE: 029_inventory_items.sql
database/schema-v1.sql:1533:-- 029_inventory_items.sql
database/schema-v1.sql:1537:CREATE TABLE inventory_items (
database/schema-v1.sql:1545:    CONSTRAINT fk_inventory_items_character
database/schema-v1.sql:1550:    CONSTRAINT fk_inventory_items_item
database/schema-v1.sql:1555:    CONSTRAINT ux_inventory_items_item_id UNIQUE (item_id),
database/schema-v1.sql:1556:    CONSTRAINT ux_inventory_items_character_position UNIQUE (character_id, position),
database/schema-v1.sql:1557:    CONSTRAINT chk_inventory_items_position CHECK (position >= 1)
database/schema-v1.sql:1560:CREATE INDEX ix_inventory_items_character_id
database/schema-v1.sql:1561:    ON inventory_items(character_id);
database/schema-v1.sql:1563:CREATE INDEX ix_inventory_items_is_equipped
database/schema-v1.sql:1564:    ON inventory_items(is_equipped);
database/schema-v1.sql:1675:-- FILE: 033_item_affixes.sql
database/schema-v1.sql:1679:-- 033_item_affixes.sql
database/schema-v1.sql:1683:CREATE TABLE item_affixes (
database/schema-v1.sql:1684:    item_affix_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
database/schema-v1.sql:1690:    CONSTRAINT fk_item_affixes_item
database/schema-v1.sql:1692:    CONSTRAINT fk_item_affixes_template
database/schema-v1.sql:1694:    CONSTRAINT ux_item_affixes_item_template UNIQUE (item_id, affix_template_id),
database/schema-v1.sql:1695:    CONSTRAINT chk_item_affixes_roll_value CHECK (roll_value >= 0)
database/schema-v1.sql:1698:CREATE INDEX ix_item_affixes_item_id ON item_affixes(item_id);
database/schema-v1.sql:1699:CREATE INDEX ix_item_affixes_template_id ON item_affixes(affix_template_id);
database/schema-v1.sql:2340:-- FILE: 056_loot_tables.sql
database/schema-v1.sql:2343:-- 056_loot_tables.sql
database/schema-v1.sql:2344:-- Requires: monsters, item_bases
database/schema-v1.sql:2345:CREATE TABLE loot_tables (
database/schema-v1.sql:2346: loot_table_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
database/schema-v1.sql:2348: item_base_id UUID NOT NULL,
database/schema-v1.sql:2352: loot_level_modifier INTEGER NOT NULL DEFAULT 0,
database/schema-v1.sql:2356: CONSTRAINT fk_loot_tables_monster FOREIGN KEY (monster_id) REFERENCES monsters(monster_id) ON DELETE CASCADE,
database/schema-v1.sql:2357: CONSTRAINT fk_loot_tables_item_base FOREIGN KEY (item_base_id) REFERENCES item_bases(item_base_id) ON DELETE RESTRICT,
database/schema-v1.sql:2358: CONSTRAINT ux_loot_tables_monster_item UNIQUE (monster_id,item_base_id),
database/schema-v1.sql:2359: CONSTRAINT chk_loot_tables_chance CHECK (drop_chance_percent > 0 AND drop_chance_percent <= 100),
database/schema-v1.sql:2360: CONSTRAINT chk_loot_tables_levels CHECK (min_item_level >= 1 AND max_item_level >= min_item_level)
database/schema-v1.sql:2362:CREATE INDEX ix_loot_tables_monster_id ON loot_tables(monster_id);
database/schema-v1.sql:2363:CREATE INDEX ix_loot_tables_item_base_id ON loot_tables(item_base_id);
database/schema-v1.sql:2366:-- FILE: 057_other_loot_tables.sql
database/schema-v1.sql:2369:-- 057_other_loot_tables.sql
database/schema-v1.sql:2371:CREATE TABLE other_loot_tables (
database/schema-v1.sql:2372: other_loot_table_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
database/schema-v1.sql:2382: CONSTRAINT fk_other_loot_tables_monster FOREIGN KEY (monster_id) REFERENCES monsters(monster_id) ON DELETE CASCADE,
database/schema-v1.sql:2383: CONSTRAINT fk_other_loot_tables_material FOREIGN KEY (material_id) REFERENCES materials(material_id) ON DELETE RESTRICT,
database/schema-v1.sql:2384: CONSTRAINT fk_other_loot_tables_consumable FOREIGN KEY (consumable_definition_id) REFERENCES consumable_definitions(consumable_definition_id) ON DELETE RESTRICT,
database/schema-v1.sql:2385: CONSTRAINT chk_other_loot_tables_target CHECK ((material_id IS NOT NULL)::integer + (consumable_definition_id IS NOT NULL)::integer = 1),
database/schema-v1.sql:2386: CONSTRAINT chk_other_loot_tables_chance CHECK (drop_chance_percent > 0 AND drop_chance_percent <= 100),
database/schema-v1.sql:2387: CONSTRAINT chk_other_loot_tables_quantity CHECK (min_quantity >= 1 AND max_quantity >= min_quantity)
database/schema-v1.sql:2389:CREATE INDEX ix_other_loot_tables_monster_id ON other_loot_tables(monster_id);
database/schema-v1.sql:2390:CREATE INDEX ix_other_loot_tables_material_id ON other_loot_tables(material_id);
database/schema-v1.sql:2391:CREATE INDEX ix_other_loot_tables_consumable_id ON other_loot_tables(consumable_definition_id);
database/schema-v1.sql:2394:-- FILE: 058_unique_pity_tracking.sql
database/schema-v1.sql:2397:-- 058_unique_pity_tracking.sql
database/schema-v1.sql:2399:CREATE TABLE unique_pity_tracking (
database/schema-v1.sql:2400: unique_pity_tracking_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
database/schema-v1.sql:2408: CONSTRAINT fk_unique_pity_tracking_character FOREIGN KEY (character_id) REFERENCES characters(character_id) ON DELETE CASCADE,
database/schema-v1.sql:2409: CONSTRAINT chk_unique_pity_tracking_kills CHECK (eligible_kill_count >= 0),
database/schema-v1.sql:2410: CONSTRAINT chk_unique_pity_tracking_chance CHECK (current_chance_percent >= 0 AND current_chance_percent <= 100)
documentation/database-design/GDD.md:6:Players create characters, defeat monsters, collect loot, improve equipment, participate in a player-driven economy, and compete in seasonal ladders.
documentation/database-design/GDD.md:129:Loot
documentation/database-design/GDD.md:153:Rarity determines affix count.
documentation/database-design/GDD.md:173:Players can improve equipment by upgrading rarity.
documentation/database-design/GDD.md:290:Better loot
documentation/database-design/GDD.md:300:Better loot quality
documentation/database-design/GDD.md:330:7. Loot System
documentation/database-design/GDD.md:332:Loot is the primary progression mechanic.
documentation/database-design/GDD.md:342:Loot Philosophy
documentation/database-design/achievement-design.md:17:- Loot
documentation/database-design/affix-definition.md:23:Rarity
documentation/database-design/affix-definition.md:404:Progression always takes priority over rarity.
documentation/database-design/affix-definition.md:410:# 11. Rarity Interaction
documentation/database-design/affix-definition.md:412:Rarity only determines Affix Count.
documentation/database-design/affix-definition.md:434:Rarity does not grant:
documentation/database-design/affix-definition.md:523:- Legendary Rarity
documentation/database-design/bestiary-definition.md:12:- Display loot information
documentation/database-design/bestiary-definition.md:24:- Loot Drops
documentation/database-design/bestiary-definition.md:77:- Loot information
documentation/database-design/bestiary-definition.md:127:## Loot Information
documentation/database-design/bestiary-definition.md:133:- Other Loot
documentation/database-design/bestiary-definition.md:379:- Loot Tables
documentation/database-design/bestiary-definition.md:405:- Loot Drops
documentation/database-design/bestiary-definition.md:506:- Loot
documentation/database-design/buff-system.md:308:- Loot
documentation/database-design/buff-system.md:339:- Loot
documentation/database-design/character-definition.md:644:-> Loot
documentation/database-design/chest-design.md:10:- Loot Hunting
documentation/database-design/chest-design.md:45:Loot
documentation/database-design/chest-design.md:168:Rarity
documentation/database-design/chest-design.md:180:## Equipment Rarity Distribution
documentation/database-design/chest-design.md:182:Hourly Chests use Gambling rarity chances.
documentation/database-design/chest-design.md:311:Rarity Distribution:
documentation/database-design/chest-design.md:590:- Loot Farming
documentation/database-design/chest-design.md:602:- Loot Acquisition
documentation/database-design/combat-design.md:858:- Better Loot Tables
documentation/database-design/consumable-definition.md:772:- Loot
documentation/database-design/consumable-definition.md:773:- Boss Loot
documentation/database-design/crafting-design.md:35:- Loot Hunting
documentation/database-design/crafting-design.md:47:- Monster Loot
documentation/database-design/crafting-design.md:48:- Boss Loot
documentation/database-design/crafting-design.md:182:- Looting
documentation/database-design/crafting-design.md:210:- Monster Loot
documentation/database-design/crafting-design.md:211:- Boss Loot
documentation/database-design/crafting-design.md:570:The game does not use material rarity tiers.
documentation/database-design/crafting-design.md:604:Progression comes from access to better materials rather than rarity classifications.
documentation/database-design/crafting-design.md:625:- Loot
documentation/database-design/crafting-design.md:626:- Boss Loot
documentation/database-design/crafting-design.md:654:- Loot
documentation/database-design/crafting-design.md:655:- Boss Loot
documentation/database-design/crafting-design.md:680:- Loot
documentation/database-design/daily-boss-definition.md:12:- Generate Valuable Loot
documentation/database-design/daily-boss-definition.md:409:- Better Rarity Chances
documentation/database-design/daily-boss-definition.md:410:- Higher Loot Levels
documentation/database-design/daily-boss-definition.md:419:## Enhanced Loot Generation
documentation/database-design/daily-boss-definition.md:426:- Improved Rarity Distribution
documentation/database-design/daily-boss-definition.md:427:- Better Loot Modifiers
documentation/database-design/daily-boss-definition.md:658:- Loot
documentation/database-design/database-architecture.md:69:- Loot
documentation/database-design/database-architecture.md:398:- Rarity
documentation/database-design/economy-design.md:147:- Loot
documentation/database-design/economy-design.md:185:2. Random Rarity
documentation/database-design/economy-design.md:190:- Guaranteed minimum Magic rarity
documentation/database-design/economy-design.md:225:## Gambling Rarity Distribution
documentation/database-design/economy-design.md:255:- Looted
documentation/database-design/economy-design.md:307:- Looted
documentation/database-design/economy-design.md:320:- Loot
documentation/database-design/economy-design.md:381:- Loot
documentation/database-design/economy-design.md:470:- Current Item Rarity
documentation/database-design/economy-design.md:489:- Can be looted
documentation/database-design/economy-design.md:494:- Current Item Rarity
documentation/database-design/economy-design.md:507:- Item Rarity
documentation/database-design/economy-design.md:532:- Rarity
documentation/database-design/equipment-design.md:30:- Monster Loot
documentation/database-design/equipment-design.md:31:- Boss Loot
documentation/database-design/equipment-design.md:144:Roll Rarity
documentation/database-design/equipment-design.md:189:- Rarity
documentation/database-design/equipment-design.md:271:Rarity does NOT modify:
documentation/database-design/equipment-design.md:277:Rarity only controls:
documentation/database-design/equipment-design.md:462:1. Rarity Upgrade
documentation/database-design/equipment-design.md:469:# 18. Rarity Upgrades
documentation/database-design/equipment-design.md:533:- Current Rarity
documentation/database-design/equipment-design.md:535:Higher rarity = higher cost.
documentation/database-design/equipment-design.md:607:- Item Rarity
documentation/database-design/equipment-design.md:609:Higher rarity items provide better salvage rewards.
documentation/database-design/equipment-design.md:630:Vendor sales create a guaranteed minimum value for loot.
documentation/database-design/equipment-design.md:704:- Do Not Use Rarity System
documentation/database-design/equipment-design.md:762:- Rarity
documentation/database-design/equipment-design.md:785:Legendary Rarity
documentation/database-design/gambling-definition.md:22:2. Random Rarity
documentation/database-design/gambling-definition.md:27:- Guaranteed minimum Magic rarity
documentation/database-design/gambling-definition.md:45:Rarity
documentation/database-design/gambling-definition.md:58:- Rarity Generation
documentation/database-design/gambling-definition.md:107:# Rarity Distribution
documentation/database-design/gambling-definition.md:131:# Rarity Rules
documentation/database-design/gambling-definition.md:137:Minimum rarity:
documentation/database-design/gambling-definition.md:141:Maximum rarity:
documentation/database-design/gambling-definition.md:155:- Rarity
documentation/database-design/gambling-definition.md:201:- Monster Loot
documentation/database-design/gambling-definition.md:202:- Boss Loot
documentation/database-design/gathering-design.md:11:- Monster Loot
documentation/database-design/gathering-design.md:12:- Boss Loot
documentation/database-design/gathering-design.md:38:- Loot
documentation/database-design/gathering-design.md:106:- Loot Quality
documentation/database-design/gathering-design.md:285:The system does not use rarity tiers.
documentation/database-design/item-definition.md:12:- Rarity
documentation/database-design/item-definition.md:22:Rarity
documentation/database-design/item-definition.md:93:- Loot Progression
documentation/database-design/item-definition.md:141:Rarity Score
documentation/database-design/item-definition.md:287:# 10. Rarity Rules
documentation/database-design/item-definition.md:297:No base item has rarity restrictions.
documentation/database-design/item-definition.md:301:## Rarity Determines
documentation/database-design/item-definition.md:307:Rarity does not change base item stats.
documentation/database-design/item-definition.md:387:- Rarity
documentation/database-design/item-definition.md:515:Rarity
documentation/database-design/loot-design.md:1:# 6. LOOT SYSTEM
documentation/database-design/loot-design.md:5:Every monster kill generates loot through four independent loot systems:
documentation/database-design/loot-design.md:9:3. Other Loot Roll
documentation/database-design/loot-design.md:88:3. Roll Rarity
documentation/database-design/loot-design.md:158:## Item Rarity Chances
documentation/database-design/loot-design.md:160:Regular Monster Loot Chances:
documentation/database-design/loot-design.md:190:Bosses use improved loot tables.
documentation/database-design/loot-design.md:202:Bosses also use improved rarity chances.
documentation/database-design/loot-design.md:204:Boss Rarity Chances:
documentation/database-design/loot-design.md:226:Bosses additionally increase loot quality through bonus loot levels.
documentation/database-design/loot-design.md:234:Bonus Loot Level:
documentation/database-design/loot-design.md:238:Loot rolls as:
documentation/database-design/loot-design.md:242:Bonus Loot Level may vary by boss.
documentation/database-design/loot-design.md:246:# Other Loot Roll
documentation/database-design/loot-design.md:248:Every monster performs one additional loot roll.
documentation/database-design/loot-design.md:254:- Other Loot
documentation/database-design/loot-design.md:260:Other Loot may include:
documentation/database-design/loot-design.md:272:## Boss Other Loot Roll
documentation/database-design/loot-design.md:280:- Other Loot
documentation/database-design/loot-design.md:321:Materials do not use rarity tiers.
documentation/database-design/loot-design.md:338:- Loot
documentation/database-design/loot-design.md:379:# Unique & Set Loot System
documentation/database-design/loot-design.md:381:Unique and Set Items use a completely independent loot roll.
documentation/database-design/loot-design.md:445:- Loot Level Range
documentation/database-design/loot-design.md:499:- Legendary Rarity
documentation/database-design/loot-design.md:508:# Loot Modifiers
documentation/database-design/loot-design.md:510:There are no loot quality modifiers.
documentation/database-design/loot-design.md:516:- Loot Quality %
documentation/database-design/loot-design.md:602:# Loot Visibility
documentation/database-design/loot-design.md:611:- Item Rarity
documentation/database-design/loot-design.md:618:# Loot Notifications
documentation/database-design/loot-design.md:620:There are no global loot announcements.
documentation/database-design/loot-design.md:630:All loot remains private to the player.
documentation/database-design/loot-design.md:634:# Loot Philosophy
documentation/database-design/loot-design.md:636:The loot system is designed around four goals:
documentation/database-design/loot-design.md:638:1. Frequent progression through normal loot.
documentation/database-design/loot-design.md:639:2. Long-term item hunting through rarity and affixes.
documentation/database-design/marketplace-definition.md:30:- Loot
documentation/database-design/marketplace-definition.md:461:- Rarity
documentation/database-design/marketplace-definition.md:562:Rarity
documentation/database-design/marketplace-definition.md:624:- Loot Systems
documentation/database-design/marketplace-definition.md:639:## Loot Hunters
documentation/database-design/marketplace-definition.md:671:Find Valuable Loot
documentation/database-design/material-definition.md:19:- Monster Loot
documentation/database-design/material-definition.md:20:- Boss Loot
documentation/database-design/material-definition.md:83:- Loot Access
documentation/database-design/material-definition.md:171:- Lootable
documentation/database-design/material-definition.md:183:Lootable:
documentation/database-design/material-definition.md:229:# 7. Loot Requirements
documentation/database-design/material-definition.md:257:Used by Loot Generation.
documentation/database-design/material-definition.md:392:Rarity is primarily determined by:
documentation/database-design/material-definition.md:398:Not by separate rarity tiers.
documentation/database-design/monster-definition.md:109:- Loot Progression
documentation/database-design/monster-definition.md:118:## Loot Level Modifier
documentation/database-design/monster-definition.md:139:Used during loot generation.
documentation/database-design/monster-definition.md:292:# 6. Loot Settings
documentation/database-design/monster-definition.md:327:## Other Loot Chance
documentation/database-design/monster-definition.md:439:- Loot Table
documentation/database-design/monster-definition.md:595:- Loot Drops
documentation/database-design/monster-definition.md:623:- Loot
documentation/database-design/monster-definition.md:747:- Loot
documentation/database-design/npc-definition.md:47:- Loot
documentation/database-design/npc-definition.md:102:This creates a guaranteed minimum value for all loot.
documentation/database-design/npc-definition.md:118:- Rarity
documentation/database-design/npc-definition.md:133:- Looted
documentation/database-design/npc-definition.md:293:- Loot
documentation/database-design/season-design.md:208:- Farming Loot
documentation/database-design/season-design.md:266:- No Bonus Loot
documentation/database-design/task-boss-definition.md:38:- Better Loot
documentation/database-design/task-boss-definition.md:149:- Loot
documentation/database-design/task-boss-definition.md:160:- Better Loot
documentation/database-design/task-boss-definition.md:161:- Better Rarity Chances
documentation/database-design/task-boss-definition.md:162:- Better Loot Levels
documentation/database-design/task-boss-definition.md:171:# Loot Modifiers
documentation/database-design/task-boss-definition.md:283:- Loot Modifiers
documentation/database-design/upgrade-system.md:7:1. Rarity Upgrading
documentation/database-design/upgrade-system.md:14:- Loot
documentation/database-design/upgrade-system.md:23:# Rarity Upgrading
documentation/database-design/upgrade-system.md:27:Rarity Upgrading increases an item's rarity and adds new affixes.
documentation/database-design/upgrade-system.md:73:Legendary is the maximum rarity.
documentation/database-design/upgrade-system.md:75:Further rarity upgrades are not possible.
documentation/database-design/upgrade-system.md:105:Every rarity upgrade requires:
documentation/database-design/upgrade-system.md:113:- Current Rarity
documentation/database-design/upgrade-system.md:115:Higher-level and higher-rarity items require significantly greater investment.
documentation/database-design/upgrade-system.md:121:Failed rarity upgrades result in:
documentation/database-design/upgrade-system.md:161:- Loot
documentation/database-design/upgrade-system.md:162:- Boss Loot
documentation/database-design/upgrade-system.md:246:- Current Item Rarity
documentation/database-design/upgrade-system.md:264:- Current Item Rarity
documentation/database-design/upgrade-system.md:287:- Looted
documentation/database-design/upgrade-system.md:306:Rarity Upgrade
documentation/database-design/upgrade-system.md:335:- Legendary Rarity
documentation/game-design/CURRENT_MILESTONE.md:5:M7: Item and Loot Generation
documentation/game-design/CURRENT_MILESTONE.md:9:Backend M7 item and loot generation implemented and regression-green. Developer UI
documentation/game-design/CURRENT_MILESTONE.md:20:Implement the canonical, server-authoritative Item and loot generation pipeline as part of the existing transactional Victory settlement.
documentation/game-design/CURRENT_MILESTONE.md:22:M7 must preserve the M6 settlement, exactly-once, ownership, concurrency and rollback guarantees.
documentation/game-design/CURRENT_MILESTONE.md:55:- transactional Victory and Defeat settlement from M6,
documentation/game-design/CURRENT_MILESTONE.md:63:- regular loot tables,
documentation/game-design/CURRENT_MILESTONE.md:64:- Other Loot tables,
documentation/game-design/CURRENT_MILESTONE.md:79:- rarity generation,
documentation/game-design/CURRENT_MILESTONE.md:84:- independent Other Loot generation,
documentation/game-design/CURRENT_MILESTONE.md:89:- `InventoryFull` lost-Item results,
documentation/game-design/CURRENT_MILESTONE.md:91:- complete settlement response,
documentation/game-design/CURRENT_MILESTONE.md:97:effectiveLootLevel = monsterLevel + bossBonusLootLevel
documentation/game-design/CURRENT_MILESTONE.md:98:minimumItemLevel = max(1, effectiveLootLevel - 10)
documentation/game-design/CURRENT_MILESTONE.md:99:maximumItemLevel = effectiveLootLevel + 5
documentation/game-design/CURRENT_MILESTONE.md:104:Regular Monsters use `bossBonusLootLevel = 0`.
documentation/game-design/CURRENT_MILESTONE.md:121:-> rarity roll
documentation/game-design/CURRENT_MILESTONE.md:129:### Rarity and Affix count
documentation/game-design/CURRENT_MILESTONE.md:139:Rarity controls only the number of Affixes.
documentation/game-design/CURRENT_MILESTONE.md:149:- Other Loot,
documentation/game-design/CURRENT_MILESTONE.md:157:Defeat does not generate loot.
documentation/game-design/CURRENT_MILESTONE.md:169:- the loss reason is `InventoryFull`.
documentation/game-design/CURRENT_MILESTONE.md:188:A special Item lost because of `InventoryFull` does not reset pity.
documentation/game-design/CURRENT_MILESTONE.md:192:Loot generation belongs to the existing Victory transaction.
documentation/game-design/CURRENT_MILESTONE.md:202:- settlement-response construction.
documentation/game-design/CURRENT_MILESTONE.md:204:Unexpected generation or persistence failure rolls back the complete Victory settlement.
documentation/game-design/CURRENT_MILESTONE.md:206:`InventoryFull` is an expected business result and does not trigger rollback.
documentation/game-design/CURRENT_MILESTONE.md:215:- `affix_position`,
documentation/game-design/CURRENT_MILESTONE.md:218:- weighted regular loot-pool semantics,
documentation/game-design/CURRENT_MILESTONE.md:219:- retirement of manual loot-table Item Level range authority,
documentation/game-design/CURRENT_MILESTONE.md:220:- M7-compatible weighted Other Loot semantics,
documentation/game-design/CURRENT_MILESTONE.md:243:- inspect Other Loot,
documentation/game-design/CURRENT_MILESTONE.md:245:- see `InventoryFull` warnings.
documentation/game-design/CURRENT_MILESTONE.md:261:Backend M7 phases P1ΓÇôP19 are implemented and committed on `m7/item-loot-generation`.
documentation/game-design/CURRENT_MILESTONE.md:276:- [x] P20.6 M6 and M7 settlement inspection: Experience, Gold, level, statistics,
documentation/game-design/CURRENT_MILESTONE.md:277:      regular Equipment, Other Loot, Unique/Set and pity, Affixes and fixed stats,
documentation/game-design/CURRENT_MILESTONE.md:278:      persisted/lost status, `InventoryFull`, raw settlement JSON fallback.
documentation/game-design/CURRENT_MILESTONE.md:337:8. backend M7 phases P1ΓÇôP18 (`m7/item-loot-generation`)
documentation/game-design/CURRENT_MILESTONE.md:340:11. loot HTTP contract and serialization/sanitization documentation
documentation/game-design/MASTER_PROJECT_PLAN.md:740:inventory_items.is_equipped = TRUE
documentation/game-design/MASTER_PROJECT_PLAN.md:995:- `inventory_items`
documentation/game-design/MASTER_PROJECT_PLAN.md:997:- `item_bases`
documentation/game-design/MASTER_PROJECT_PLAN.md:998:- `item_affixes`
documentation/game-design/MASTER_PROJECT_PLAN.md:1151:- loot generation,
documentation/game-design/MASTER_PROJECT_PLAN.md:1152:- item rarity generation,
documentation/game-design/MASTER_PROJECT_PLAN.md:1803:- generate loot,
documentation/game-design/MASTER_PROJECT_PLAN.md:1844:  rng: RandomSource
documentation/game-design/MASTER_PROJECT_PLAN.md:1862:- Injected `RandomSource`.
documentation/game-design/MASTER_PROJECT_PLAN.md:1935:interface RandomSource {
documentation/game-design/MASTER_PROJECT_PLAN.md:2043:`Clock` is not part of the M4 engine interface. M4 receives final combat-ready statistics and requires only state, action, and `RandomSource`.
documentation/game-design/MASTER_PROJECT_PLAN.md:2378:Production combat uses `CryptoRandomSource`.
documentation/game-design/MASTER_PROJECT_PLAN.md:2518:- loot generation,
documentation/game-design/MASTER_PROJECT_PLAN.md:2553:Convert terminal combat results into authoritative Character progression, rewards, penalties, statistics, discovery progress, cooldown state, and final combat summaries. Settlement occurs exactly once inside the same PostgreSQL transaction as the combat-ending action.
documentation/game-design/MASTER_PROJECT_PLAN.md:2556:- Transactional Victory and Defeat settlement.
documentation/game-design/MASTER_PROJECT_PLAN.md:2572:- Settlement data in the authenticated combat-action response.
documentation/game-design/MASTER_PROJECT_PLAN.md:2594:#### Victory settlement
documentation/game-design/MASTER_PROJECT_PLAN.md:2596:Victory settlement may atomically:
documentation/game-design/MASTER_PROJECT_PLAN.md:2611:- return the committed settlement through HTTP.
documentation/game-design/MASTER_PROJECT_PLAN.md:2613:M6 does not generate loot. Item and loot generation belongs to M7.
documentation/game-design/MASTER_PROJECT_PLAN.md:2615:#### Defeat settlement
documentation/game-design/MASTER_PROJECT_PLAN.md:2617:Defeat settlement may atomically:
documentation/game-design/MASTER_PROJECT_PLAN.md:2627:- return the committed settlement through HTTP.
documentation/game-design/MASTER_PROJECT_PLAN.md:2644:At combat start, the session snapshots Monster Experience, the Gold range, and combat-ready Character and Monster statistics. At settlement, the transaction reads current authoritative reward bonuses. Monster balance changes affect new fights only.
documentation/game-design/MASTER_PROJECT_PLAN.md:2650:Daily Boss attempts are consumed when combat starts. Defeat does not refund an attempt. Victory fields update only after Daily Boss Victory settlement.
documentation/game-design/MASTER_PROJECT_PLAN.md:2685:- Failed settlement rolls back the complete terminal action.
documentation/game-design/MASTER_PROJECT_PLAN.md:2688:- Settlement is returned by the authenticated combat-action endpoint.
documentation/game-design/MASTER_PROJECT_PLAN.md:2692:## M7: ITEM AND LOOT GENERATION
documentation/game-design/MASTER_PROJECT_PLAN.md:2698:The backend M7 item and loot generation pipeline is implemented and
documentation/game-design/MASTER_PROJECT_PLAN.md:2699:regression-green on `m7/item-loot-generation`. The Developer UI checkpoint (P20)
documentation/game-design/MASTER_PROJECT_PLAN.md:2712:  forcedRarity,
documentation/game-design/MASTER_PROJECT_PLAN.md:2721:ΓåÆ Determine Rarity
documentation/game-design/MASTER_PROJECT_PLAN.md:2728:### Rarity and affix counts
documentation/game-design/MASTER_PROJECT_PLAN.md:2740:3. Other loot
documentation/game-design/MASTER_PROJECT_PLAN.md:2753:- Rarity produces the correct affix count.
documentation/game-design/MASTER_PROJECT_PLAN.md:2890:- Rarity upgrading
documentation/game-design/MASTER_PROJECT_PLAN.md:3098:- Normal and unique/set loot remain independent.
documentation/game-design/MASTER_PROJECT_PLAN.md:3205:- Loot telemetry
documentation/game-design/MASTER_PROJECT_PLAN.md:3214:- Rarity and affix distribution
documentation/game-design/MASTER_PROJECT_PLAN.md:3285:5. Loot frequency
documentation/game-design/MASTER_PROJECT_PLAN.md:3286:6. Rarity distribution
documentation/game-design/MASTER_PROJECT_PLAN.md:3324:- Loot and equipment work.
documentation/game-design/MASTER_PROJECT_PLAN.md:3355:7. M7 Item and Loot Generation
documentation/game-design/MASTER_PROJECT_PLAN.md:3389:- M7: Item and Loot Generation ΓÇö backend implemented and regression-green;
documentation/game-design/MASTER_PROJECT_PLAN.md:3404:- Exactly-once Victory and Defeat settlement implemented.
documentation/game-design/MASTER_PROJECT_PLAN.md:3405:- Experience, Gold, level, death, Bestiary, Task Boss, Daily Boss, cooldown, boost, Blessing, and final-log settlement implemented.
documentation/game-design/MASTER_PROJECT_PLAN.md:3407:- Canonical item generator, item-level and rarity selection, affix rolls, and Item Score implemented.
documentation/game-design/MASTER_PROJECT_PLAN.md:3408:- Regular equipment, Other Loot (materials/consumables), and shared Unique/Set generation implemented.
documentation/game-design/MASTER_PROJECT_PLAN.md:3410:- Deterministic inventory placement and `InventoryFull` lost-item results implemented.
documentation/game-design/MASTER_PROJECT_PLAN.md:3411:- Transactional loot settlement integrated with M6 Victory settlement.
documentation/game-design/MASTER_PROJECT_PLAN.md:3423:- 10 loot-table records.
documentation/game-design/MASTER_PROJECT_PLAN.md:3438:Victory and Defeat settlement: Implemented
documentation/game-design/MASTER_PROJECT_PLAN.md:3445:Item and loot generation: Implemented
documentation/game-design/MASTER_PROJECT_PLAN.md:3446:Regular equipment / Other Loot / Unique-Set generation: Implemented
documentation/game-design/MASTER_PROJECT_PLAN.md:3448:InventoryFull lost-item handling: Implemented
documentation/game-design/MASTER_PROJECT_PLAN.md:3449:Transactional loot settlement: Implemented
documentation/game-design/MASTER_PROJECT_PLAN.md:3458:Current milestone: M7 Item and Loot Generation (closure pending V23 + merge)
documentation/game-design/MASTER_PROJECT_PLAN.md:3461:The M7 loot migration and database table count are tracked in the M7 schema
documentation/game-design/MASTER_PROJECT_PLAN.md:3481:ΓåÆ Generate Regular Equipment, Other Loot, and Unique/Set Independently
documentation/game-design/MASTER_PROJECT_PLAN.md:3482:ΓåÆ Roll Item Level, Rarity, Affixes, and Item Score
documentation/game-design/MASTER_PROJECT_PLAN.md:3483:ΓåÆ Assign Deterministic Inventory Positions (or return InventoryFull)
documentation/game-design/MASTER_PROJECT_PLAN.md:3484:ΓåÆ Persist Loot Transactionally Within the Victory Settlement
documentation/game-design/MASTER_PROJECT_PLAN.md:3485:ΓåÆ Return Committed Settlement (including loot) Through HTTP
documentation/game-design/MASTER_PROJECT_PLAN.md:3490:from combat as part of the M7 Victory settlement. The Developer UI
documentation/game-design/MASTER_PROJECT_PLAN.md:3491:(`developer-ui/`) exposes the complete Character ΓåÆ Monster ΓåÆ Combat ΓåÆ Settlement
documentation/game-design/MASTER_PROJECT_PLAN.md:3512:M7 preserves every verified M1 through M6 guarantee, including server authority, ownership isolation, one active fight per Character, expected-turn protection, atomic settlement, exactly-once value creation, rollback, reconnect recovery, and separation between pure generation logic and persistence.
documentation/game-design/MASTER_PROJECT_PLAN.md:3520:M7: Item and Loot Generation
documentation/game-design/MASTER_PROJECT_PLAN.md:3526:- rarity rolls,
documentation/game-design/MASTER_PROJECT_PLAN.md:3532:- other loot rewards,
documentation/game-design/MASTER_PROJECT_PLAN.md:3535:- exactly-once integration with M6 settlement,
documentation/game-design/MASTER_PROJECT_PLAN.md:3548:- view Victory or Defeat settlement,
documentation/game-design/MASTER_PROJECT_PLAN.md:3550:- inspect generated loot.
scripts/generate-m4-context.ps1:211:  "RandomSource|Math\.random|randomUUID|rng" `
scripts/generate-m5-context.ps1:223:  "RandomSource|Math\.random|randomUUID|rng" `
scripts/generate-m6-context.ps1:221:[void]$technicalBuilder.AppendLine("# M6 SETTLEMENT REFERENCE AUDIT")
scripts/generate-m6-context.ps1:226:$settlementAudit = git grep -n -i -E "combat_logs|combat_statistics|kill_statistics|bestiary|blessing|promoted|promotion|experience|gold_reward|experience_reward|cooldown|task_status|settle|settlement" -- src tests database documentation database-design
scripts/generate-m6-context.ps1:228:if ($settlementAudit) {
scripts/generate-m6-context.ps1:229:  [void]$technicalBuilder.AppendLine(($settlementAudit -join "`n"))
scripts/generate-m6-context.ps1:232:  [void]$technicalBuilder.AppendLine("No settlement references found.")
scripts/generate-m7-context.ps1:76:  "src/modules/progression/domain/victory-settlement.ts",
scripts/generate-m7-context.ps1:84:  "tests/unit/progression/victory-settlement.test.ts",
scripts/generate-m7-context.ps1:102:  "documentation/database-design/loot-design.md",
scripts/generate-m7-context.ps1:103:  "database-design/loot/unique-pity-tracking.md"
scripts/generate-m7-context.ps1:112:  "database/migrations/017_item_bases.sql",
scripts/generate-m7-context.ps1:116:  "database/migrations/029_inventory_items.sql",
scripts/generate-m7-context.ps1:120:  "database/migrations/033_item_affixes.sql",
scripts/generate-m7-context.ps1:122:  "database/migrations/056_loot_tables.sql",
scripts/generate-m7-context.ps1:123:  "database/migrations/057_other_loot_tables.sql",
scripts/generate-m7-context.ps1:124:  "database/migrations/058_unique_pity_tracking.sql",
scripts/generate-m7-context.ps1:161:  [void]$builder.AppendLine("Fresh source dump for planning M7: Item and Loot Generation.")
scripts/generate-m7-context.ps1:208:      $_.FullName -match "loot|item|affix|inventory|equipment|unique|set|pity|reward|victory|settlement|material|consumable|monster|boss|workbook|import"
scripts/generate-m7-context.ps1:223:  $audit = git grep -n -i -E "loot|item_affix|affix_position|item_base|inventory_items|unique_pity|other_loot|rarity|item_score|InventoryFull|RandomSource|settlement" -- src tests database documentation database-design scripts 2>$null
scripts/generate-m7-context.ps1:250:  [void]$builder.AppendLine("Authoritative pre-implementation schema evidence relevant to M7: Item and Loot Generation.")
scripts/import-game-data.ts:71:    sheet: "item_bases",
scripts/import-game-data.ts:72:    table: "item_bases",
scripts/import-game-data.ts:80:    sheet: "item_base_affix_weights",
scripts/import-game-data.ts:81:    table: "item_base_affix_weights",
scripts/import-game-data.ts:82:    keys: ["item_base_id", "affix_template_id"],
scripts/import-game-data.ts:84:      { workbookColumn: "item_base_code", databaseColumn: "item_base_id", target: "item_bases" }
scripts/import-game-data.ts:88:    sheet: "item_base_fixed_stat_ranges",
scripts/import-game-data.ts:89:    table: "item_base_fixed_stat_ranges",
scripts/import-game-data.ts:90:    keys: ["item_base_id", "stat_position"],
scripts/import-game-data.ts:92:      { workbookColumn: "item_base_code", databaseColumn: "item_base_id", target: "item_bases" }
scripts/import-game-data.ts:95:  { sheet: "item_score_coefficients", table: "item_score_coefficients", keys: ["score_component"] },
scripts/import-game-data.ts:121:    sheet: "loot_tables",
scripts/import-game-data.ts:122:    table: "loot_tables",
scripts/import-game-data.ts:123:    keys: ["monster_id", "item_base_id"],
scripts/import-game-data.ts:126:      { workbookColumn: "item_base_code", databaseColumn: "item_base_id", target: "item_bases" }
scripts/import-game-data.ts:132:    keys: ["monster_id", "monster_family_id", "item_base_id"],
scripts/import-game-data.ts:137:      { workbookColumn: "item_base_code", databaseColumn: "item_base_id", target: "item_bases" }
scripts/import-game-data.ts:150:    sheet: "other_loot_tables",
scripts/import-game-data.ts:151:    table: "other_loot_tables",
scripts/import-game-data.ts:365:  if (config.table === "item_base_affix_weights") {
scripts/import-game-data.ts:366:    return ["item_base_code", "affix_type", "affix_tier"]
scripts/import-game-data.ts:375:const ITEM_SCORE_COMPONENTS = [
scripts/import-game-data.ts:388:  loot_tables: [
scripts/import-game-data.ts:392:    "loot_level_modifier"
scripts/import-game-data.ts:394:  other_loot_tables: ["drop_chance_percent"],
scripts/import-game-data.ts:437:      if (config.table === "other_loot_tables") {
scripts/import-game-data.ts:461:      if (["loot_tables", "other_loot_tables", "item_base_affix_weights", "special_item_sources"].includes(config.table)) {
scripts/import-game-data.ts:468:      if (config.table === "item_score_coefficients") {
scripts/import-game-data.ts:475:      if (config.table === "item_base_fixed_stat_ranges") {
scripts/import-game-data.ts:491:      if (config.table === "item_base_affix_weights") {
scripts/import-game-data.ts:529:  const itemBases = rowsBySheet.get("item_bases") ?? [];
scripts/import-game-data.ts:544:  const affixWeights = rowsBySheet.get("item_base_affix_weights") ?? [];
scripts/import-game-data.ts:545:  const affixPoolCodes = new Set(affixWeights.map((row) => normalizedString(row.item_base_code)));
scripts/import-game-data.ts:547:    if (!affixPoolCodes.has(code)) problems.push(`item_bases: regular Item Base "${code}" has no affix pool.`);
scripts/import-game-data.ts:550:    const code = normalizedString(row.item_base_code);
scripts/import-game-data.ts:552:      problems.push(`item_base_affix_weights row ${index + 2}: special Item Base "${code}" cannot use normal affixes.`);
scripts/import-game-data.ts:556:  const fixedRanges = rowsBySheet.get("item_base_fixed_stat_ranges") ?? [];
scripts/import-game-data.ts:559:    const code = normalizedString(row.item_base_code);
scripts/import-game-data.ts:561:      problems.push(`item_base_fixed_stat_ranges row ${index + 2}: regular Item Base "${code}" cannot use fixed stats.`);
scripts/import-game-data.ts:570:      problems.push(`item_bases: special Item Base "${code}" has no fixed-stat ranges.`);
scripts/import-game-data.ts:578:        problems.push(`item_base_fixed_stat_ranges: Item Base "${code}" must use contiguous stat_position values starting at 1.`);
scripts/import-game-data.ts:585:    const code = normalizedString(row.item_base_code);
scripts/import-game-data.ts:591:    if (!specialSources.some((row) => normalizedString(row.item_base_code) === code)) {
scripts/import-game-data.ts:592:      problems.push(`item_bases: special Item Base "${code}" has no special-item source.`);
scripts/import-game-data.ts:596:  const coefficientRows = rowsBySheet.get("item_score_coefficients") ?? [];
scripts/import-game-data.ts:600:  for (const component of ITEM_SCORE_COMPONENTS) {
scripts/import-game-data.ts:602:      problems.push(`item_score_coefficients: missing component "${component}".`);
scripts/import-game-data.ts:607:    if (!(ITEM_SCORE_COMPONENTS as readonly string[]).includes(component)) {
scripts/import-game-data.ts:608:      problems.push(`item_score_coefficients row ${index + 2}: unknown score_component "${component}".`);
scripts/import-game-data.ts:750:      if (config.table === "item_base_affix_weights" && ["affix_type", "affix_tier"].includes(workbookColumn)) continue;
scripts/import-game-data.ts:757:  if (config.table === "item_base_affix_weights") {
scripts/import-materials.ts:16:  "is_lootable",
scripts/import-materials.ts:36:  isLootable: boolean;
scripts/import-materials.ts:52:  is_lootable: boolean;
scripts/import-materials.ts:212:  const isLootable = parseBoolean(row.is_lootable, rowNumber, "is_lootable");
scripts/import-materials.ts:222:  if (!vendorAvailable && !isGatherable && !isLootable) {
scripts/import-materials.ts:224:      "At least one source must be enabled: vendor_available, is_gatherable, or is_lootable."
scripts/import-materials.ts:242:    isLootable,
scripts/import-materials.ts:350:    existing.is_lootable !== incoming.isLootable ||
scripts/import-materials.ts:373:      is_lootable,
scripts/import-materials.ts:409:              is_lootable,
scripts/import-materials.ts:426:            material.isLootable,
scripts/import-materials.ts:454:            is_lootable = $9,
scripts/import-materials.ts:471:          material.isLootable,
src/app.ts:15:import { CryptoRandomSource } from "./modules/combat/infrastructure/crypto-random-source.js";
src/app.ts:17:import type { RandomSource } from "./modules/combat/ports/random-source.js";
src/app.ts:61:  randomSource?: RandomSource;
src/app.ts:99:  const randomSource =
src/app.ts:100:    dependencies.randomSource ??
src/app.ts:101:    new CryptoRandomSource();
src/app.ts:146:      randomSource,
src/modules/characters/infrastructure/postgres-character-statistics.repository.ts:97:  LEFT JOIN inventory_items ii
src/modules/characters/infrastructure/postgres-character-statistics.repository.ts:104:  LEFT JOIN item_bases ib
src/modules/characters/infrastructure/postgres-character-statistics.repository.ts:105:    ON ib.item_base_id = i.item_base_id
src/modules/characters/infrastructure/postgres-character-statistics.repository.ts:133:    FROM item_affixes ia
src/modules/characters/infrastructure/postgres-character-statistics.repository.ts:175:        FROM inventory_items equipped_inventory
src/modules/characters/infrastructure/postgres-character-statistics.repository.ts:178:        INNER JOIN item_bases equipped_base
src/modules/characters/infrastructure/postgres-character-statistics.repository.ts:179:          ON equipped_base.item_base_id = equipped_item.item_base_id
src/modules/characters/infrastructure/postgres-equipment.repository.ts:109:      FROM inventory_items
src/modules/characters/infrastructure/postgres-equipment.repository.ts:131:        FROM inventory_items ii
src/modules/characters/infrastructure/postgres-equipment.repository.ts:134:        INNER JOIN item_bases ib
src/modules/characters/infrastructure/postgres-equipment.repository.ts:135:          ON ib.item_base_id = i.item_base_id
src/modules/characters/infrastructure/postgres-equipment.repository.ts:161:      UPDATE inventory_items current_inventory
src/modules/characters/infrastructure/postgres-equipment.repository.ts:164:      INNER JOIN item_bases current_base
src/modules/characters/infrastructure/postgres-equipment.repository.ts:165:        ON current_base.item_base_id =
src/modules/characters/infrastructure/postgres-equipment.repository.ts:166:          current_item.item_base_id
src/modules/characters/infrastructure/postgres-equipment.repository.ts:187:        UPDATE inventory_items current_inventory
src/modules/characters/infrastructure/postgres-equipment.repository.ts:190:        INNER JOIN item_bases current_base
src/modules/characters/infrastructure/postgres-equipment.repository.ts:191:          ON current_base.item_base_id =
src/modules/characters/infrastructure/postgres-equipment.repository.ts:192:            current_item.item_base_id
src/modules/characters/infrastructure/postgres-equipment.repository.ts:206:        UPDATE inventory_items current_inventory
src/modules/characters/infrastructure/postgres-equipment.repository.ts:209:        INNER JOIN item_bases current_base
src/modules/characters/infrastructure/postgres-equipment.repository.ts:210:          ON current_base.item_base_id =
src/modules/characters/infrastructure/postgres-equipment.repository.ts:211:            current_item.item_base_id
src/modules/characters/infrastructure/postgres-equipment.repository.ts:359:            UPDATE inventory_items
src/modules/characters/infrastructure/postgres-equipment.repository.ts:402:            UPDATE inventory_items
src/modules/combat/application/combat-session.models.ts:7:  LootSettlementResult,
src/modules/combat/application/combat-session.models.ts:8:} from "../../items/application/loot-settlement.service.js";
src/modules/combat/application/combat-session.models.ts:66:export type CombatSettlementOutcome =
src/modules/combat/application/combat-session.models.ts:70:export type CombatSettlementExperience = {
src/modules/combat/application/combat-session.models.ts:77:export type CombatSettlementGold = {
src/modules/combat/application/combat-session.models.ts:84:export type CombatSettlementLevel = {
src/modules/combat/application/combat-session.models.ts:90:export type CombatSettlementBestiary = {
src/modules/combat/application/combat-session.models.ts:95:export type CombatSettlementTaskBoss = {
src/modules/combat/application/combat-session.models.ts:100:export type CombatSettlementCooldown = {
src/modules/combat/application/combat-session.models.ts:105:export type CombatSettlementDailyBoss = {
src/modules/combat/application/combat-session.models.ts:110:export type CombatSettlementStatistics = {
src/modules/combat/application/combat-session.models.ts:118:  outcome: CombatSettlementOutcome;
src/modules/combat/application/combat-session.models.ts:124:export type CombatSettlement = {
src/modules/combat/application/combat-session.models.ts:125:  outcome: CombatSettlementOutcome;
src/modules/combat/application/combat-session.models.ts:126:  experience: CombatSettlementExperience;
src/modules/combat/application/combat-session.models.ts:127:  gold: CombatSettlementGold;
src/modules/combat/application/combat-session.models.ts:128:  level: CombatSettlementLevel;
src/modules/combat/application/combat-session.models.ts:130:  bestiary: CombatSettlementBestiary;
src/modules/combat/application/combat-session.models.ts:131:  taskBoss: CombatSettlementTaskBoss;
src/modules/combat/application/combat-session.models.ts:132:  cooldown: CombatSettlementCooldown;
src/modules/combat/application/combat-session.models.ts:133:  dailyBoss: CombatSettlementDailyBoss;
src/modules/combat/application/combat-session.models.ts:134:  statistics: CombatSettlementStatistics;
src/modules/combat/application/combat-session.models.ts:140:  settlement: CombatSettlement | null;
src/modules/combat/application/combat-session.models.ts:141:  loot: LootSettlementResult | null;
src/modules/combat/application/combat-session.repository.ts:14:  CombatSettlement,
src/modules/combat/application/combat-session.repository.ts:24:  LootGenerationContext,
src/modules/combat/application/combat-session.repository.ts:25:  LootSettlementTransaction,
src/modules/combat/application/combat-session.repository.ts:26:} from "../../items/application/loot.repository.js";
src/modules/combat/application/combat-session.repository.ts:123:export type CombatSettlementCharacter = {
src/modules/combat/application/combat-session.repository.ts:131:export type CombatSettlementStatistics = {
src/modules/combat/application/combat-session.repository.ts:156:export type CombatSettlementMonster = {
src/modules/combat/application/combat-session.repository.ts:170:  lootLevelBonus: number;
src/modules/combat/application/combat-session.repository.ts:173:export type CombatSettlementTask = {
src/modules/combat/application/combat-session.repository.ts:185:export type CombatSettlementDailyBoss = {
src/modules/combat/application/combat-session.repository.ts:195:export type CombatSettlementFightBuff = {
src/modules/combat/application/combat-session.repository.ts:202:export type CombatSettlementContext = {
src/modules/combat/application/combat-session.repository.ts:203:  character: CombatSettlementCharacter;
src/modules/combat/application/combat-session.repository.ts:206:  statistics: CombatSettlementStatistics;
src/modules/combat/application/combat-session.repository.ts:211:  monster: CombatSettlementMonster;
src/modules/combat/application/combat-session.repository.ts:213:  task: CombatSettlementTask | null;
src/modules/combat/application/combat-session.repository.ts:216:    CombatSettlementDailyBoss | null;
src/modules/combat/application/combat-session.repository.ts:219:    readonly CombatSettlementFightBuff[];
src/modules/combat/application/combat-session.repository.ts:225:export type ApplyVictorySettlementInput = {
src/modules/combat/application/combat-session.repository.ts:226:  context: CombatSettlementContext;
src/modules/combat/application/combat-session.repository.ts:272:export type ApplyDefeatSettlementInput = {
src/modules/combat/application/combat-session.repository.ts:273:  context: CombatSettlementContext;
src/modules/combat/application/combat-session.repository.ts:311:  loadSettlementContext():
src/modules/combat/application/combat-session.repository.ts:312:    Promise<CombatSettlementContext>;
src/modules/combat/application/combat-session.repository.ts:314:  withLootSettlement?<TResult>(
src/modules/combat/application/combat-session.repository.ts:315:    context: LootGenerationContext,
src/modules/combat/application/combat-session.repository.ts:317:      transaction: LootSettlementTransaction
src/modules/combat/application/combat-session.repository.ts:321:  applyVictorySettlement(
src/modules/combat/application/combat-session.repository.ts:322:    input: ApplyVictorySettlementInput
src/modules/combat/application/combat-session.repository.ts:323:  ): Promise<CombatSettlement>;
src/modules/combat/application/combat-session.repository.ts:325:  applyDefeatSettlement(
src/modules/combat/application/combat-session.repository.ts:326:    input: ApplyDefeatSettlementInput
src/modules/combat/application/combat-session.repository.ts:327:  ): Promise<CombatSettlement>;
src/modules/combat/application/get-active-combat.service.ts:33:      settlement: null,
src/modules/combat/application/get-active-combat.service.ts:34:      loot: null,
src/modules/combat/application/get-combat-session.service.ts:31:      settlement: null,
src/modules/combat/application/get-combat-session.service.ts:32:      loot: null,
src/modules/combat/application/resolve-combat-action.service.ts:5:  RandomSource,
src/modules/combat/application/resolve-combat-action.service.ts:8:  planDefeatSettlement,
src/modules/combat/application/resolve-combat-action.service.ts:9:} from "../../progression/domain/defeat-settlement.js";
src/modules/combat/application/resolve-combat-action.service.ts:11:  planVictorySettlement,
src/modules/combat/application/resolve-combat-action.service.ts:12:} from "../../progression/domain/victory-settlement.js";
src/modules/combat/application/resolve-combat-action.service.ts:32:  LootSettlementService,
src/modules/combat/application/resolve-combat-action.service.ts:33:  type LootSettlementResult,
src/modules/combat/application/resolve-combat-action.service.ts:34:} from "../../items/application/loot-settlement.service.js";
src/modules/combat/application/resolve-combat-action.service.ts:36:  LootRepository,
src/modules/combat/application/resolve-combat-action.service.ts:37:} from "../../items/application/loot.repository.js";
src/modules/combat/application/resolve-combat-action.service.ts:43:    private readonly randomSource:
src/modules/combat/application/resolve-combat-action.service.ts:44:      RandomSource,
src/modules/combat/application/resolve-combat-action.service.ts:77:            this.randomSource
src/modules/combat/application/resolve-combat-action.service.ts:80:        let settlement = null;
src/modules/combat/application/resolve-combat-action.service.ts:81:        let loot: LootSettlementResult | null = null;
src/modules/combat/application/resolve-combat-action.service.ts:89:              .loadSettlementContext();
src/modules/combat/application/resolve-combat-action.service.ts:99:            planVictorySettlement(
src/modules/combat/application/resolve-combat-action.service.ts:105:              this.randomSource
src/modules/combat/application/resolve-combat-action.service.ts:108:          settlement =
src/modules/combat/application/resolve-combat-action.service.ts:110:              .applyVictorySettlement({
src/modules/combat/application/resolve-combat-action.service.ts:177:          if (transaction.withLootSettlement === undefined) {
src/modules/combat/application/resolve-combat-action.service.ts:179:              "Combat transaction does not support Loot settlement."
src/modules/combat/application/resolve-combat-action.service.ts:183:          const lootRepository: LootRepository = {
src/modules/combat/application/resolve-combat-action.service.ts:184:            withSettlementTransaction: async (
src/modules/combat/application/resolve-combat-action.service.ts:187:            ) => transaction.withLootSettlement!(
src/modules/combat/application/resolve-combat-action.service.ts:192:          const lootService = new LootSettlementService(
src/modules/combat/application/resolve-combat-action.service.ts:193:            lootRepository,
src/modules/combat/application/resolve-combat-action.service.ts:194:            this.randomSource
src/modules/combat/application/resolve-combat-action.service.ts:196:          loot = await lootService.settle({
src/modules/combat/application/resolve-combat-action.service.ts:201:            bossBonusLootLevel: Number(
src/modules/combat/application/resolve-combat-action.service.ts:202:              victoryContext.monster.lootLevelBonus ?? 0
src/modules/combat/application/resolve-combat-action.service.ts:221:              .loadSettlementContext();
src/modules/combat/application/resolve-combat-action.service.ts:231:            planDefeatSettlement(
src/modules/combat/application/resolve-combat-action.service.ts:239:          settlement =
src/modules/combat/application/resolve-combat-action.service.ts:241:              .applyDefeatSettlement({
src/modules/combat/application/resolve-combat-action.service.ts:357:          settlement,
src/modules/combat/application/resolve-combat-action.service.ts:358:          loot,
src/modules/combat/application/start-combat.service.ts:133:          settlement: null,
src/modules/combat/application/start-combat.service.ts:134:          loot: null,
src/modules/combat/domain/combat-attack.ts:1:import type { RandomSource } from "../ports/random-source.js";
src/modules/combat/domain/combat-attack.ts:45:  randomSource: RandomSource
src/modules/combat/domain/combat-attack.ts:53:  const hitRoll = randomSource.nextFloat();
src/modules/combat/domain/combat-attack.ts:73:  const damage = randomSource.nextInt(
src/modules/combat/domain/combat-engine.ts:1:import type { RandomSource } from "../ports/random-source.js";
src/modules/combat/domain/combat-engine.ts:52:  randomSource: RandomSource
src/modules/combat/domain/combat-engine.ts:67:    randomSource
src/modules/combat/domain/combat-engine.ts:118:    randomSource
src/modules/combat/domain/combat-validation.ts:8:  InvalidRandomSourceError,
src/modules/combat/domain/combat-validation.ts:229:    throw new InvalidRandomSourceError(
src/modules/combat/domain/combat-validation.ts:245:    throw new InvalidRandomSourceError(
src/modules/combat/domain/combat.errors.ts:8:  invalidRandomSource:
src/modules/combat/domain/combat.errors.ts:39:export class InvalidRandomSourceError extends ApplicationError {
src/modules/combat/domain/combat.errors.ts:42:      code: COMBAT_ERROR_CODE.invalidRandomSource,
src/modules/combat/domain/combat.errors.ts:47:    this.name = "InvalidRandomSourceError";
src/modules/combat/infrastructure/crypto-random-source.ts:7:  RandomSource,
src/modules/combat/infrastructure/crypto-random-source.ts:25:export class CryptoRandomSource
src/modules/combat/infrastructure/crypto-random-source.ts:26:  implements RandomSource {
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:44:  type CombatSettlement,
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:51:  ApplyDefeatSettlementInput,
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:52:  ApplyVictorySettlementInput,
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:56:  CombatSettlementContext,
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:79:  LootGenerationContext,
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:80:  LootSettlementTransaction,
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:81:} from "../../items/application/loot.repository.js";
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:83:  createPostgresLootSettlementTransaction,
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:84:} from "../../items/infrastructure/postgres-loot-transaction.js";
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:115:type SettlementCharacterRow = {
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:129:type SettlementUnlockRow = {
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:133:type SettlementBlessingRow = {
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:137:type SettlementStatisticsRow = {
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:162:type SettlementMonsterRow = {
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:172:  loot_level_bonus: number | null;
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:175:type SettlementTaskDefinitionRow = {
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:182:type SettlementTaskProgressRow = {
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:187:type SettlementDailyDefinitionRow = {
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:193:type SettlementDailyProgressRow = {
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:200:type SettlementFightBuffRow = {
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:984:export type CombatSettlementFailurePoint =
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1007:export type CombatSettlementFailureInjector = (
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1008:  point: CombatSettlementFailurePoint
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1012:  settlementFailureInjector?:
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1013:    CombatSettlementFailureInjector;
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1023:    private readonly settlementFailureInjector?:
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1024:      CombatSettlementFailureInjector
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1027:  private async injectSettlementFailure(
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1028:    point: CombatSettlementFailurePoint
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1030:    await this.settlementFailureInjector?.(
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1035:  public async withLootSettlement<TResult>(
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1036:    context: LootGenerationContext,
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1038:      transaction: LootSettlementTransaction
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1046:        "Loot settlement context does not match the locked Combat session."
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1050:    const transaction = await createPostgresLootSettlementTransaction(
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1057:  public async loadSettlementContext():
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1058:  Promise<CombatSettlementContext> {
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1061:        SettlementCharacterRow
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1096:        SettlementUnlockRow
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1117:        SettlementBlessingRow
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1130:        SettlementStatisticsRow
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1185:        SettlementMonsterRow
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1198:            b.loot_level_bonus
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1216:        "Settlement monster was not found."
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1222:        SettlementTaskDefinitionRow
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1250:        "Settlement monster matched multiple Task definitions."
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1258:      SettlementTaskProgressRow | null =
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1264:          SettlementTaskProgressRow
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1288:        SettlementDailyDefinitionRow
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1327:      SettlementDailyProgressRow | null =
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1333:          SettlementDailyProgressRow
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1362:        SettlementFightBuffRow
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1438:                "Settlement boss type is invalid."
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1448:          "settlement.character.level",
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1454:            "settlement.character.experience"
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1459:            "settlement.character.gold"
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1464:            "settlement.character.current_health"
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1468:            "settlement.character.max_health",
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1473:            "settlement.character.current_mana"
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1477:            "settlement.character.max_mana"
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1481:            "settlement.character.current_energy"
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1485:            "settlement.character.max_energy",
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1491:              "settlement.character.resources_updated_at"
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1505:            "settlement.statistics.total_gold_earned"
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1510:            "settlement.statistics.highest_gold_owned"
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1515:            "settlement.statistics.total_monsters_killed"
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1520:            "settlement.statistics.total_bosses_killed"
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1525:            "settlement.statistics.total_daily_bosses_killed"
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1530:            "settlement.statistics.total_deaths"
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1535:            "settlement.statistics.total_damage_dealt"
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1540:            "settlement.statistics.total_damage_taken"
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1545:            "settlement.statistics.highest_physical_hit"
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1560:                "settlement.statistics.strongest_monster_power_score"
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1575:                "settlement.statistics.strongest_boss_power_score"
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1581:            "settlement.statistics.current_no_death_streak"
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1586:            "settlement.statistics.longest_no_death_streak"
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1610:          "settlement.monster.level",
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1616:            "settlement.monster.power_score"
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1621:            "settlement.monster.cooldown_seconds"
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1631:                "settlement.monster.additional_cooldown_seconds"
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1633:        lootLevelBonus:
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1634:          monster.loot_level_bonus === null
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1637:                monster.loot_level_bonus,
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1638:                "settlement.monster.loot_level_bonus"
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1659:                  "settlement.task.required_kills"
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1667:                      "settlement.task.current_progress"
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1687:                "settlement.daily_boss.tier",
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1696:                      "settlement.daily_boss.attempts_used_in_rotation"
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1704:                      "settlement.daily_boss.total_attempts"
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1712:                      "settlement.daily_boss.total_victories"
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1728:              "settlement.fight_buff.value"
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1733:                "settlement.fight_buff.duration_remaining",
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1862:    input: ApplyVictorySettlementInput
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1916:        "Victory character state changed after settlement loading."
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:1922:    input: ApplyVictorySettlementInput
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:2018:        "Victory statistics changed after settlement loading."
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:2024:    input: ApplyVictorySettlementInput
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:2040:        "Victory settlement character does not match the locked session."
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:2049:        "Victory settlement monster does not match the locked session."
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:2109:    await this.injectSettlementFailure(
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:2176:        "Victory settlement could not update character statistics."
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:2180:    await this.injectSettlementFailure(
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:2186:    input: ApplyVictorySettlementInput
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:2294:        "Victory settlement could not update Bestiary statistics."
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:2298:    await this.injectSettlementFailure(
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:2402:      await this.injectSettlementFailure(
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:2456:      await this.injectSettlementFailure(
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:2476:      await this.injectSettlementFailure(
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:2510:        await this.injectSettlementFailure(
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:2574:  public async applyVictorySettlement(
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:2575:    input: ApplyVictorySettlementInput
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:2576:  ): Promise<CombatSettlement> {
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:2582:        "Victory settlement requires a player Victory state."
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:2590:        "Victory settlement cannot contain a defeat reason."
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:2601:        "Victory settlement time is invalid."
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:2611:        "Victory settlement cannot predate combat start."
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:2619:    await this.injectSettlementFailure(
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:2628:    await this.injectSettlementFailure(
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:2794:    await this.injectSettlementFailure(
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:2817:    await this.injectSettlementFailure(
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:2857:    await this.injectSettlementFailure(
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:2939:    input: ApplyDefeatSettlementInput
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:2968:        "Defeat settlement character does not match the locked session."
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:2977:        "Defeat settlement monster does not match the locked session."
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:2986:        "Defeat Blessing result does not match the locked settlement context."
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:3046:    await this.injectSettlementFailure(
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:3093:        "Defeat settlement could not update character statistics."
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:3097:    await this.injectSettlementFailure(
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:3122:      await this.injectSettlementFailure(
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:3156:        await this.injectSettlementFailure(
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:3206:      await this.injectSettlementFailure(
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:3214:  public async applyDefeatSettlement(
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:3215:    input: ApplyDefeatSettlementInput
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:3216:  ): Promise<CombatSettlement> {
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:3222:        "Defeat settlement requires a player Defeat state."
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:3230:        "Defeat settlement requires a defeat reason."
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:3241:        "Defeat settlement time is invalid."
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:3251:        "Defeat settlement cannot predate combat start."
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:3266:        "Defeat settlement could not map the terminal state."
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:3275:    await this.injectSettlementFailure(
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:3449:    await this.injectSettlementFailure(
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:3472:    await this.injectSettlementFailure(
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:3513:    await this.injectSettlementFailure(
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:3739:        "Terminal combat must use settlement persistence."
src/modules/combat/infrastructure/postgres-combat-session.repository.ts:3896:              .settlementFailureInjector
src/modules/combat/ports/random-source.ts:1:export interface RandomSource {
src/modules/items/application/loot-settlement.service.ts:1:import type { RandomSource } from "../../combat/ports/random-source.js";
src/modules/items/application/loot-settlement.service.ts:3:  LootGenerationContext,
src/modules/items/application/loot-settlement.service.ts:4:  LootRepository,
src/modules/items/application/loot-settlement.service.ts:5:  LootSettlementTransaction,
src/modules/items/application/loot-settlement.service.ts:7:} from "./loot.repository.js";
src/modules/items/application/loot-settlement.service.ts:9:import { rollItemLevel } from "../domain/item-loot-level.js";
src/modules/items/application/loot-settlement.service.ts:10:import { generateOtherLoot } from "../domain/other-loot-generator.js";
src/modules/items/application/loot-settlement.service.ts:13:  GeneratedOtherLoot,
src/modules/items/application/loot-settlement.service.ts:16:  ItemLootContext,
src/modules/items/application/loot-settlement.service.ts:21:export type LootLossReason = "InventoryFull";
src/modules/items/application/loot-settlement.service.ts:23:export type EquipmentSettlementResult<TItem> =
src/modules/items/application/loot-settlement.service.ts:26:  | { generated: TItem; persisted: null; lossReason: LootLossReason };
src/modules/items/application/loot-settlement.service.ts:28:export type SettleLootInput = LootGenerationContext & {
src/modules/items/application/loot-settlement.service.ts:30:  bossBonusLootLevel: number;
src/modules/items/application/loot-settlement.service.ts:34:export type LootSettlementResult = {
src/modules/items/application/loot-settlement.service.ts:35:  regularEquipment: EquipmentSettlementResult<GeneratedRegularItem>;
src/modules/items/application/loot-settlement.service.ts:36:  specialEquipment: EquipmentSettlementResult<GeneratedSpecialItem>;
src/modules/items/application/loot-settlement.service.ts:38:  otherLoot: GeneratedOtherLoot | null;
src/modules/items/application/loot-settlement.service.ts:42:type GeneratedSettlement = {
src/modules/items/application/loot-settlement.service.ts:44:  other: GeneratedOtherLoot | null;
src/modules/items/application/loot-settlement.service.ts:48:export type LootSettlementDependencies = {
src/modules/items/application/loot-settlement.service.ts:50:  generateOther: typeof generateOtherLoot;
src/modules/items/application/loot-settlement.service.ts:55:const defaultDependencies: LootSettlementDependencies = {
src/modules/items/application/loot-settlement.service.ts:57:  generateOther: generateOtherLoot,
src/modules/items/application/loot-settlement.service.ts:74:function emptyEquipmentResult<TItem>(): EquipmentSettlementResult<TItem> {
src/modules/items/application/loot-settlement.service.ts:78:async function persistGeneratedLoot(
src/modules/items/application/loot-settlement.service.ts:79:  transaction: LootSettlementTransaction,
src/modules/items/application/loot-settlement.service.ts:80:  generated: GeneratedSettlement
src/modules/items/application/loot-settlement.service.ts:81:): Promise<LootSettlementResult> {
src/modules/items/application/loot-settlement.service.ts:97:        lossReason: "InventoryFull",
src/modules/items/application/loot-settlement.service.ts:121:        lossReason: "InventoryFull",
src/modules/items/application/loot-settlement.service.ts:138:    await transaction.applyOtherLoot({
src/modules/items/application/loot-settlement.service.ts:158:    otherLoot: generated.other,
src/modules/items/application/loot-settlement.service.ts:163:export class LootSettlementService {
src/modules/items/application/loot-settlement.service.ts:165:    private readonly repository: LootRepository,
src/modules/items/application/loot-settlement.service.ts:166:    private readonly randomSource: RandomSource,
src/modules/items/application/loot-settlement.service.ts:167:    private readonly dependencies: LootSettlementDependencies = defaultDependencies
src/modules/items/application/loot-settlement.service.ts:170:  public async settle(input: SettleLootInput): Promise<LootSettlementResult> {
src/modules/items/application/loot-settlement.service.ts:171:    const lootContext: ItemLootContext = {
src/modules/items/application/loot-settlement.service.ts:173:      bossBonusLootLevel: input.bossBonusLootLevel,
src/modules/items/application/loot-settlement.service.ts:176:    const repositoryContext: LootGenerationContext = {
src/modules/items/application/loot-settlement.service.ts:182:    return this.repository.withSettlementTransaction(
src/modules/items/application/loot-settlement.service.ts:188:          context: lootContext,
src/modules/items/application/loot-settlement.service.ts:191:        }, this.randomSource);
src/modules/items/application/loot-settlement.service.ts:195:          candidates: catalog.otherLootCandidates,
src/modules/items/application/loot-settlement.service.ts:196:        }, this.randomSource);
src/modules/items/application/loot-settlement.service.ts:199:          lootContext,
src/modules/items/application/loot-settlement.service.ts:200:          this.randomSource
src/modules/items/application/loot-settlement.service.ts:210:        }, this.randomSource);
src/modules/items/application/loot-settlement.service.ts:212:        return persistGeneratedLoot(transaction, { regular, other, special });
src/modules/items/application/loot.repository.ts:3:  GeneratedOtherLoot,
src/modules/items/application/loot.repository.ts:7:  OtherLootCandidate,
src/modules/items/application/loot.repository.ts:12:export type LootGenerationContext = {
src/modules/items/application/loot.repository.ts:18:export type LootCatalogSnapshot = {
src/modules/items/application/loot.repository.ts:20:  otherLootCandidates: readonly OtherLootCandidate[];
src/modules/items/application/loot.repository.ts:25:export type LockedLootCharacter = {
src/modules/items/application/loot.repository.ts:49:export type ApplyOtherLootInput = {
src/modules/items/application/loot.repository.ts:51:  reward: GeneratedOtherLoot;
src/modules/items/application/loot.repository.ts:59:export interface LootSettlementTransaction {
src/modules/items/application/loot.repository.ts:60:  readonly character: LockedLootCharacter;
src/modules/items/application/loot.repository.ts:63:    context: LootGenerationContext
src/modules/items/application/loot.repository.ts:64:  ): Promise<LootCatalogSnapshot>;
src/modules/items/application/loot.repository.ts:74:  applyOtherLoot(
src/modules/items/application/loot.repository.ts:75:    input: ApplyOtherLootInput
src/modules/items/application/loot.repository.ts:83:export interface LootRepository {
src/modules/items/application/loot.repository.ts:84:  withSettlementTransaction<TResult>(
src/modules/items/application/loot.repository.ts:85:    context: LootGenerationContext,
src/modules/items/application/loot.repository.ts:87:      transaction: LootSettlementTransaction
src/modules/items/domain/complete-regular-item-generator.ts:1:import type { RandomSource } from "../../combat/ports/random-source.js";
src/modules/items/domain/complete-regular-item-generator.ts:7:} from "./item-loot-level.js";
src/modules/items/domain/complete-regular-item-generator.ts:9:  BOSS_RARITY_PROFILE,
src/modules/items/domain/complete-regular-item-generator.ts:10:  REGULAR_MONSTER_RARITY_PROFILE,
src/modules/items/domain/complete-regular-item-generator.ts:11:} from "./item-rarity-affix.js";
src/modules/items/domain/complete-regular-item-generator.ts:19:  randomSource: RandomSource
src/modules/items/domain/complete-regular-item-generator.ts:21:  if (!rollRegularEquipmentSuccess(input.context.isBoss, randomSource)) {
src/modules/items/domain/complete-regular-item-generator.ts:25:  const rolledItemLevel = rollItemLevel(input.context, randomSource);
src/modules/items/domain/complete-regular-item-generator.ts:29:    randomSource
src/modules/items/domain/complete-regular-item-generator.ts:47:      rarityProfile: input.context.isBoss
src/modules/items/domain/complete-regular-item-generator.ts:48:        ? BOSS_RARITY_PROFILE
src/modules/items/domain/complete-regular-item-generator.ts:49:        : REGULAR_MONSTER_RARITY_PROFILE,
src/modules/items/domain/complete-regular-item-generator.ts:53:    randomSource
src/modules/items/domain/item-base-selection.ts:1:import type { RandomSource } from "../../combat/ports/random-source.js";
src/modules/items/domain/item-base-selection.ts:63:  randomSource: RandomSource
src/modules/items/domain/item-base-selection.ts:72:  let selectedSlot = selectWeighted(canonicalSlotPool(), randomSource);
src/modules/items/domain/item-base-selection.ts:74:    selectedSlot = selectWeighted(fallbackSlotPool(eligible), randomSource);
src/modules/items/domain/item-base-selection.ts:86:    itemBase: selectWeighted(slotCandidates, randomSource),
src/modules/items/domain/item-generation.constants.ts:1:export const ITEM_RARITY = {
src/modules/items/domain/item-generation.constants.ts:20:export const ITEM_SCORE_COMPONENT = {
src/modules/items/domain/item-generation.constants.ts:36:export const AFFIX_COUNT_BY_RARITY = {
src/modules/items/domain/item-generation.errors.ts:3:  invalidRandomSource: "ITEM_GENERATION_INVALID_RANDOM_SOURCE",
src/modules/items/domain/item-generation.errors.ts:4:  itemScoreOverflow: "ITEM_SCORE_OVERFLOW",
src/modules/items/domain/item-generation.errors.ts:17:export class ItemGenerationRandomSourceError extends Error {
src/modules/items/domain/item-generation.errors.ts:19:    ITEM_GENERATION_ERROR_CODE.invalidRandomSource;
src/modules/items/domain/item-generation.errors.ts:23:    this.name = "ItemGenerationRandomSourceError";
src/modules/items/domain/item-generation.types.ts:3:  ITEM_RARITY,
src/modules/items/domain/item-generation.types.ts:4:  ITEM_SCORE_COMPONENT,
src/modules/items/domain/item-generation.types.ts:8:export type ItemRarity =
src/modules/items/domain/item-generation.types.ts:9:  (typeof ITEM_RARITY)[keyof typeof ITEM_RARITY];
src/modules/items/domain/item-generation.types.ts:15:  (typeof ITEM_SCORE_COMPONENT)[keyof typeof ITEM_SCORE_COMPONENT];
src/modules/items/domain/item-generation.types.ts:27:export type ItemLootContext = {
src/modules/items/domain/item-generation.types.ts:29:  bossBonusLootLevel: number;
src/modules/items/domain/item-generation.types.ts:34:  effectiveLootLevel: number;
src/modules/items/domain/item-generation.types.ts:63:  context: ItemLootContext;
src/modules/items/domain/item-generation.types.ts:68:export type OtherLootCandidate = {
src/modules/items/domain/item-generation.types.ts:69:  otherLootTableId: string;
src/modules/items/domain/item-generation.types.ts:78:export type GeneratedOtherLoot =
src/modules/items/domain/item-generation.types.ts:81:      otherLootTableId: string;
src/modules/items/domain/item-generation.types.ts:87:      otherLootTableId: string;
src/modules/items/domain/item-generation.types.ts:92:export type GenerateOtherLootInput = {
src/modules/items/domain/item-generation.types.ts:94:  candidates: readonly OtherLootCandidate[];
src/modules/items/domain/item-generation.types.ts:197:  rarityProfile: readonly WeightedEntry<ItemRarity>[];
src/modules/items/domain/item-generation.types.ts:213:  rarity: ItemRarity;
src/modules/items/domain/item-generation.types.ts:224:  rarity: null;
src/modules/items/domain/item-generator.ts:1:import type { RandomSource } from "../../combat/ports/random-source.js";
src/modules/items/domain/item-generator.ts:2:import { AFFIX_COUNT_BY_RARITY } from "./item-generation.constants.js";
src/modules/items/domain/item-generator.ts:5:import { filterEligibleAffixes } from "./item-rarity-affix.js";
src/modules/items/domain/item-generator.ts:52:  randomSource: RandomSource
src/modules/items/domain/item-generator.ts:71:      randomSource
src/modules/items/domain/item-generator.ts:78:  randomSource: RandomSource
src/modules/items/domain/item-generator.ts:116:        randomSource
src/modules/items/domain/item-generator.ts:124:  randomSource: RandomSource
src/modules/items/domain/item-generator.ts:127:  const rarity = selectWeighted(
src/modules/items/domain/item-generator.ts:128:    input.rarityProfile,
src/modules/items/domain/item-generator.ts:129:    randomSource
src/modules/items/domain/item-generator.ts:131:  const affixCount = AFFIX_COUNT_BY_RARITY[rarity];
src/modules/items/domain/item-generator.ts:138:      "Regular Item rarity requires a non-empty eligible affix pool."
src/modules/items/domain/item-generator.ts:144:      randomSource
src/modules/items/domain/item-generator.ts:147:      rollAffix(template, index + 1, randomSource)
src/modules/items/domain/item-generator.ts:155:    rarity,
src/modules/items/domain/item-generator.ts:171:  randomSource: RandomSource
src/modules/items/domain/item-generator.ts:176:    randomSource
src/modules/items/domain/item-generator.ts:183:    rarity: null,
src/modules/items/domain/item-loot-level.ts:1:import type { RandomSource } from "../../combat/ports/random-source.js";
src/modules/items/domain/item-loot-level.ts:9:  ItemGenerationRandomSourceError,
src/modules/items/domain/item-loot-level.ts:13:  ItemLootContext,
src/modules/items/domain/item-loot-level.ts:25:  context: ItemLootContext
src/modules/items/domain/item-loot-level.ts:29:    !Number.isSafeInteger(context.bossBonusLootLevel) ||
src/modules/items/domain/item-loot-level.ts:30:    context.bossBonusLootLevel < 0
src/modules/items/domain/item-loot-level.ts:33:      "Boss bonus loot level must be a non-negative safe integer."
src/modules/items/domain/item-loot-level.ts:36:  if (!context.isBoss && context.bossBonusLootLevel !== 0) {
src/modules/items/domain/item-loot-level.ts:38:      "Regular Monsters must use boss bonus loot level 0."
src/modules/items/domain/item-loot-level.ts:41:  const effectiveLootLevel =
src/modules/items/domain/item-loot-level.ts:42:    context.monsterLevel + context.bossBonusLootLevel;
src/modules/items/domain/item-loot-level.ts:43:  requirePositiveSafeInteger(effectiveLootLevel, "Effective Loot Level");
src/modules/items/domain/item-loot-level.ts:44:  const maximumItemLevel = effectiveLootLevel + 5;
src/modules/items/domain/item-loot-level.ts:51:    effectiveLootLevel,
src/modules/items/domain/item-loot-level.ts:52:    minimumItemLevel: Math.max(1, effectiveLootLevel - 10),
src/modules/items/domain/item-loot-level.ts:58:  context: ItemLootContext,
src/modules/items/domain/item-loot-level.ts:59:  randomSource: RandomSource
src/modules/items/domain/item-loot-level.ts:62:  const result = randomSource.nextInt(
src/modules/items/domain/item-loot-level.ts:71:    throw new ItemGenerationRandomSourceError(
src/modules/items/domain/item-loot-level.ts:80:  randomSource: RandomSource
src/modules/items/domain/item-loot-level.ts:82:  const roll = randomSource.nextInt(1, PROBABILITY_SCALE);
src/modules/items/domain/item-loot-level.ts:84:    throw new ItemGenerationRandomSourceError(
src/modules/items/domain/item-random.ts:1:import type { RandomSource } from "../../combat/ports/random-source.js";
src/modules/items/domain/item-random.ts:4:  ItemGenerationRandomSourceError,
src/modules/items/domain/item-random.ts:19:  randomSource: RandomSource
src/modules/items/domain/item-random.ts:25:  if (randomSource.nextBigInt) {
src/modules/items/domain/item-random.ts:26:    const value = randomSource.nextBigInt(minimum, maximum);
src/modules/items/domain/item-random.ts:28:      throw new ItemGenerationRandomSourceError(
src/modules/items/domain/item-random.ts:41:    throw new ItemGenerationRandomSourceError(
src/modules/items/domain/item-random.ts:42:      "RandomSource without nextBigInt cannot roll this bigint range."
src/modules/items/domain/item-random.ts:46:  const value = randomSource.nextInt(minimumNumber, maximumNumber);
src/modules/items/domain/item-random.ts:48:    throw new ItemGenerationRandomSourceError(
src/modules/items/domain/item-random.ts:57:  randomSource: RandomSource
src/modules/items/domain/item-random.ts:75:  const roll = rollInclusiveBigInt(1n, totalWeight, randomSource);
src/modules/items/domain/item-random.ts:82:  throw new ItemGenerationRandomSourceError(
src/modules/items/domain/item-rarity-affix.ts:1:import type { RandomSource } from "../../combat/ports/random-source.js";
src/modules/items/domain/item-rarity-affix.ts:6:  ItemRarity,
src/modules/items/domain/item-rarity-affix.ts:10:export const REGULAR_MONSTER_RARITY_PROFILE: readonly WeightedEntry<ItemRarity>[] = [
src/modules/items/domain/item-rarity-affix.ts:18:export const BOSS_RARITY_PROFILE: readonly WeightedEntry<ItemRarity>[] = [
src/modules/items/domain/item-rarity-affix.ts:25:export function rollCanonicalRarity(
src/modules/items/domain/item-rarity-affix.ts:27:  randomSource: RandomSource
src/modules/items/domain/item-rarity-affix.ts:28:): ItemRarity {
src/modules/items/domain/item-rarity-affix.ts:30:    isBoss ? BOSS_RARITY_PROFILE : REGULAR_MONSTER_RARITY_PROFILE,
src/modules/items/domain/item-rarity-affix.ts:31:    randomSource
src/modules/items/domain/other-loot-generator.ts:1:import type { RandomSource } from "../../combat/ports/random-source.js";
src/modules/items/domain/other-loot-generator.ts:5:  ItemGenerationRandomSourceError,
src/modules/items/domain/other-loot-generator.ts:9:  GenerateOtherLootInput,
src/modules/items/domain/other-loot-generator.ts:10:  GeneratedOtherLoot,
src/modules/items/domain/other-loot-generator.ts:11:  OtherLootCandidate,
src/modules/items/domain/other-loot-generator.ts:14:const REGULAR_MONSTER_OTHER_LOOT_THRESHOLD = 700;
src/modules/items/domain/other-loot-generator.ts:15:const BOSS_OTHER_LOOT_THRESHOLD = 900;
src/modules/items/domain/other-loot-generator.ts:17:function rollOtherLootSuccess(
src/modules/items/domain/other-loot-generator.ts:19:  randomSource: RandomSource
src/modules/items/domain/other-loot-generator.ts:21:  const roll = randomSource.nextInt(1, PROBABILITY_SCALE);
src/modules/items/domain/other-loot-generator.ts:23:    throw new ItemGenerationRandomSourceError(
src/modules/items/domain/other-loot-generator.ts:24:      "Other Loot probability roll is outside the configured scale."
src/modules/items/domain/other-loot-generator.ts:28:    ? BOSS_OTHER_LOOT_THRESHOLD
src/modules/items/domain/other-loot-generator.ts:29:    : REGULAR_MONSTER_OTHER_LOOT_THRESHOLD);
src/modules/items/domain/other-loot-generator.ts:32:function validateCandidate(candidate: OtherLootCandidate): void {
src/modules/items/domain/other-loot-generator.ts:33:  if (candidate.otherLootTableId.length === 0) {
src/modules/items/domain/other-loot-generator.ts:35:      "Other Loot Table ID cannot be empty."
src/modules/items/domain/other-loot-generator.ts:43:      "Other Loot candidate must target exactly one Material or Consumable."
src/modules/items/domain/other-loot-generator.ts:48:      "Other Loot selection weight must be positive."
src/modules/items/domain/other-loot-generator.ts:56:      "Other Loot requires a positive inclusive quantity range."
src/modules/items/domain/other-loot-generator.ts:61:export function generateOtherLoot(
src/modules/items/domain/other-loot-generator.ts:62:  input: GenerateOtherLootInput,
src/modules/items/domain/other-loot-generator.ts:63:  randomSource: RandomSource
src/modules/items/domain/other-loot-generator.ts:64:): GeneratedOtherLoot | null {
src/modules/items/domain/other-loot-generator.ts:65:  if (!rollOtherLootSuccess(input.isBoss, randomSource)) {
src/modules/items/domain/other-loot-generator.ts:72:      "Other Loot roll succeeded but no eligible entry exists."
src/modules/items/domain/other-loot-generator.ts:82:    randomSource
src/modules/items/domain/other-loot-generator.ts:87:    randomSource
src/modules/items/domain/other-loot-generator.ts:93:      otherLootTableId: selected.otherLootTableId,
src/modules/items/domain/other-loot-generator.ts:100:      "Other Loot candidate has no valid target."
src/modules/items/domain/other-loot-generator.ts:105:    otherLootTableId: selected.otherLootTableId,
src/modules/items/domain/special-item-generator.ts:1:import type { RandomSource } from "../../combat/ports/random-source.js";
src/modules/items/domain/special-item-generator.ts:5:  ItemGenerationRandomSourceError,
src/modules/items/domain/special-item-generator.ts:100:function rollSuccess(chancePerMille: number, randomSource: RandomSource): boolean {
src/modules/items/domain/special-item-generator.ts:101:  const roll = randomSource.nextInt(1, PITY_SCALE);
src/modules/items/domain/special-item-generator.ts:103:    throw new ItemGenerationRandomSourceError(
src/modules/items/domain/special-item-generator.ts:112:  randomSource: RandomSource
src/modules/items/domain/special-item-generator.ts:126:  if (!rollSuccess(currentPity.chancePerMille, randomSource)) {
src/modules/items/domain/special-item-generator.ts:140:    randomSource
src/modules/items/domain/special-item-generator.ts:151:    randomSource
src/modules/items/infrastructure/postgres-loot-catalog.ts:3:  LootCatalogSnapshot,
src/modules/items/infrastructure/postgres-loot-catalog.ts:4:  LootGenerationContext,
src/modules/items/infrastructure/postgres-loot-catalog.ts:5:} from "../application/loot.repository.js";
src/modules/items/infrastructure/postgres-loot-catalog.ts:8:  ITEM_SCORE_COMPONENT,
src/modules/items/infrastructure/postgres-loot-catalog.ts:20:  OtherLootCandidate,
src/modules/items/infrastructure/postgres-loot-catalog.ts:24:export type LootCatalogQueryable = Pick<PoolClient, "query">;
src/modules/items/infrastructure/postgres-loot-catalog.ts:27:  item_base_id: string;
src/modules/items/infrastructure/postgres-loot-catalog.ts:31:  base_item_score: string;
src/modules/items/infrastructure/postgres-loot-catalog.ts:43:  item_base_id: string;
src/modules/items/infrastructure/postgres-loot-catalog.ts:52:type OtherLootRow = {
src/modules/items/infrastructure/postgres-loot-catalog.ts:53:  other_loot_table_id: string;
src/modules/items/infrastructure/postgres-loot-catalog.ts:73:  item_base_id: string;
src/modules/items/infrastructure/postgres-loot-catalog.ts:87:const scoreComponents = new Set<string>(Object.values(ITEM_SCORE_COMPONENT));
src/modules/items/infrastructure/postgres-loot-catalog.ts:137:export async function loadLootCatalog(
src/modules/items/infrastructure/postgres-loot-catalog.ts:138:  client: LootCatalogQueryable,
src/modules/items/infrastructure/postgres-loot-catalog.ts:139:  context: LootGenerationContext
src/modules/items/infrastructure/postgres-loot-catalog.ts:140:): Promise<LootCatalogSnapshot> {
src/modules/items/infrastructure/postgres-loot-catalog.ts:145:    SELECT ib.item_base_id, ib.item_level, ib.slot,
src/modules/items/infrastructure/postgres-loot-catalog.ts:146:      lt.selection_weight, ib.base_item_score,
src/modules/items/infrastructure/postgres-loot-catalog.ts:149:    FROM loot_tables AS lt
src/modules/items/infrastructure/postgres-loot-catalog.ts:150:    INNER JOIN item_bases AS ib ON ib.item_base_id = lt.item_base_id
src/modules/items/infrastructure/postgres-loot-catalog.ts:153:    ORDER BY ib.item_base_id
src/modules/items/infrastructure/postgres-loot-catalog.ts:156:  const regularIds = regularResult.rows.map((row) => row.item_base_id);
src/modules/items/infrastructure/postgres-loot-catalog.ts:160:        SELECT ibaw.item_base_id, at.affix_template_id, at.affix_type,
src/modules/items/infrastructure/postgres-loot-catalog.ts:163:        FROM item_base_affix_weights AS ibaw
src/modules/items/infrastructure/postgres-loot-catalog.ts:166:        WHERE ibaw.item_base_id = ANY($1::uuid[])
src/modules/items/infrastructure/postgres-loot-catalog.ts:167:        ORDER BY ibaw.item_base_id, at.affix_template_id
src/modules/items/infrastructure/postgres-loot-catalog.ts:172:    const entries = affixesByBase.get(row.item_base_id) ?? [];
src/modules/items/infrastructure/postgres-loot-catalog.ts:184:    affixesByBase.set(row.item_base_id, entries);
src/modules/items/infrastructure/postgres-loot-catalog.ts:188:    itemBaseId: requiredId(row.item_base_id, "Item Base ID"),
src/modules/items/infrastructure/postgres-loot-catalog.ts:195:    baseItemScore: bigint(row.base_item_score, 0n, "Base Item Score"),
src/modules/items/infrastructure/postgres-loot-catalog.ts:197:    affixPool: affixesByBase.get(row.item_base_id) ?? [],
src/modules/items/infrastructure/postgres-loot-catalog.ts:200:  const otherResult = await client.query<OtherLootRow>(`
src/modules/items/infrastructure/postgres-loot-catalog.ts:201:    SELECT other_loot_table_id, material_id, consumable_definition_id,
src/modules/items/infrastructure/postgres-loot-catalog.ts:203:    FROM other_loot_tables
src/modules/items/infrastructure/postgres-loot-catalog.ts:205:    ORDER BY other_loot_table_id
src/modules/items/infrastructure/postgres-loot-catalog.ts:207:  const otherLootCandidates: OtherLootCandidate[] = otherResult.rows.map((row) => ({
src/modules/items/infrastructure/postgres-loot-catalog.ts:208:    otherLootTableId: requiredId(row.other_loot_table_id, "Other Loot Table ID"),
src/modules/items/infrastructure/postgres-loot-catalog.ts:211:    minimumQuantity: BigInt(integer(row.min_quantity, 1, "Other Loot minimum quantity")),
src/modules/items/infrastructure/postgres-loot-catalog.ts:212:    maximumQuantity: BigInt(integer(row.max_quantity, 1, "Other Loot maximum quantity")),
src/modules/items/infrastructure/postgres-loot-catalog.ts:213:    selectionWeight: bigint(row.selection_weight, 1n, "Other Loot selection weight"),
src/modules/items/infrastructure/postgres-loot-catalog.ts:220:      ib.item_base_id, ib.item_level, ib.slot, ib.base_item_score,
src/modules/items/infrastructure/postgres-loot-catalog.ts:225:    INNER JOIN item_bases AS ib ON ib.item_base_id = sis.item_base_id
src/modules/items/infrastructure/postgres-loot-catalog.ts:231:  const specialIds = specialResult.rows.map((row) => row.item_base_id);
src/modules/items/infrastructure/postgres-loot-catalog.ts:235:        SELECT item_base_id, stat_position, stat_type, min_value, max_value
src/modules/items/infrastructure/postgres-loot-catalog.ts:236:        FROM item_base_fixed_stat_ranges
src/modules/items/infrastructure/postgres-loot-catalog.ts:237:        WHERE item_base_id = ANY($1::uuid[])
src/modules/items/infrastructure/postgres-loot-catalog.ts:238:        ORDER BY item_base_id, stat_position
src/modules/items/infrastructure/postgres-loot-catalog.ts:242:    const ranges = fixedByBase.get(row.item_base_id) ?? [];
src/modules/items/infrastructure/postgres-loot-catalog.ts:249:    fixedByBase.set(row.item_base_id, ranges);
src/modules/items/infrastructure/postgres-loot-catalog.ts:264:        itemBaseId: requiredId(row.item_base_id, "Special Item Base ID"),
src/modules/items/infrastructure/postgres-loot-catalog.ts:266:        baseItemScore: bigint(row.base_item_score, 0n, "Special Base Item Score"),
src/modules/items/infrastructure/postgres-loot-catalog.ts:269:      fixedStatRanges: fixedByBase.get(row.item_base_id) ?? [],
src/modules/items/infrastructure/postgres-loot-catalog.ts:275:    FROM item_score_coefficients
src/modules/items/infrastructure/postgres-loot-catalog.ts:290:    otherLootCandidates,
src/modules/items/infrastructure/postgres-loot-lock.ts:2:import type { LockedLootCharacter } from "../application/loot.repository.js";
src/modules/items/infrastructure/postgres-loot-lock.ts:4:export type LootLockQueryable = Pick<PoolClient, "query">;
src/modules/items/infrastructure/postgres-loot-lock.ts:39:export async function lockLootCharacterState(
src/modules/items/infrastructure/postgres-loot-lock.ts:40:  client: LootLockQueryable,
src/modules/items/infrastructure/postgres-loot-lock.ts:42:): Promise<LockedLootCharacter> {
src/modules/items/infrastructure/postgres-loot-lock.ts:58:    throw new Error("Active loot character was not found.");
src/modules/items/infrastructure/postgres-loot-lock.ts:63:    FROM inventory_items
src/modules/items/infrastructure/postgres-loot-lock.ts:70:    INSERT INTO unique_pity_tracking (character_id)
src/modules/items/infrastructure/postgres-loot-lock.ts:77:    FROM unique_pity_tracking
src/modules/items/infrastructure/postgres-loot-persistence.ts:3:  ApplyOtherLootInput,
src/modules/items/infrastructure/postgres-loot-persistence.ts:8:} from "../application/loot.repository.js";
src/modules/items/infrastructure/postgres-loot-persistence.ts:10:export type LootPersistenceQueryable = Pick<PoolClient, "query">;
src/modules/items/infrastructure/postgres-loot-persistence.ts:24:  client: LootPersistenceQueryable,
src/modules/items/infrastructure/postgres-loot-persistence.ts:30:    INSERT INTO inventory_items (character_id, item_id, position)
src/modules/items/infrastructure/postgres-loot-persistence.ts:35:export async function persistRegularLootItem(
src/modules/items/infrastructure/postgres-loot-persistence.ts:36:  client: LootPersistenceQueryable,
src/modules/items/infrastructure/postgres-loot-persistence.ts:45:      item_base_id, item_level, required_level, rarity, item_score
src/modules/items/infrastructure/postgres-loot-persistence.ts:52:    input.item.rarity,
src/modules/items/infrastructure/postgres-loot-persistence.ts:60:      INSERT INTO item_affixes (
src/modules/items/infrastructure/postgres-loot-persistence.ts:61:        item_id, affix_template_id, affix_position, roll_value
src/modules/items/infrastructure/postgres-loot-persistence.ts:69:export async function persistSpecialLootItem(
src/modules/items/infrastructure/postgres-loot-persistence.ts:70:  client: LootPersistenceQueryable,
src/modules/items/infrastructure/postgres-loot-persistence.ts:76:  if (input.item.affixes.length !== 0 || input.item.rarity !== null) {
src/modules/items/infrastructure/postgres-loot-persistence.ts:77:    throw new Error("Special Items cannot contain regular rarity or Affixes.");
src/modules/items/infrastructure/postgres-loot-persistence.ts:82:      item_base_id, item_level, required_level, rarity, item_score
src/modules/items/infrastructure/postgres-loot-persistence.ts:105:export async function applyOtherLootReward(
src/modules/items/infrastructure/postgres-loot-persistence.ts:106:  client: LootPersistenceQueryable,
src/modules/items/infrastructure/postgres-loot-persistence.ts:107:  input: ApplyOtherLootInput
src/modules/items/infrastructure/postgres-loot-persistence.ts:110:  if (input.reward.quantity < 1n) throw new Error("Other Loot quantity must be positive.");
src/modules/items/infrastructure/postgres-loot-persistence.ts:133:  client: LootPersistenceQueryable,
src/modules/items/infrastructure/postgres-loot-persistence.ts:146:    UPDATE unique_pity_tracking
src/modules/items/infrastructure/postgres-loot-transaction.ts:3:  ApplyOtherLootInput,
src/modules/items/infrastructure/postgres-loot-transaction.ts:4:  LootGenerationContext,
src/modules/items/infrastructure/postgres-loot-transaction.ts:5:  LootSettlementTransaction,
src/modules/items/infrastructure/postgres-loot-transaction.ts:9:} from "../application/loot.repository.js";
src/modules/items/infrastructure/postgres-loot-transaction.ts:10:import { loadLootCatalog } from "./postgres-loot-catalog.js";
src/modules/items/infrastructure/postgres-loot-transaction.ts:11:import { lockLootCharacterState } from "./postgres-loot-lock.js";
src/modules/items/infrastructure/postgres-loot-transaction.ts:13:  applyOtherLootReward,
src/modules/items/infrastructure/postgres-loot-transaction.ts:14:  persistRegularLootItem,
src/modules/items/infrastructure/postgres-loot-transaction.ts:15:  persistSpecialLootItem,
src/modules/items/infrastructure/postgres-loot-transaction.ts:17:} from "./postgres-loot-persistence.js";
src/modules/items/infrastructure/postgres-loot-transaction.ts:19:export type SharedLootTransactionClient = Pick<PoolClient, "query">;
src/modules/items/infrastructure/postgres-loot-transaction.ts:21:function requireContext(context: LootGenerationContext): void {
src/modules/items/infrastructure/postgres-loot-transaction.ts:36:      "Loot persistence Character ID must match the locked Character."
src/modules/items/infrastructure/postgres-loot-transaction.ts:41:export async function createPostgresLootSettlementTransaction(
src/modules/items/infrastructure/postgres-loot-transaction.ts:42:  client: SharedLootTransactionClient,
src/modules/items/infrastructure/postgres-loot-transaction.ts:43:  context: LootGenerationContext
src/modules/items/infrastructure/postgres-loot-transaction.ts:44:): Promise<LootSettlementTransaction> {
src/modules/items/infrastructure/postgres-loot-transaction.ts:47:  const character = await lockLootCharacterState(
src/modules/items/infrastructure/postgres-loot-transaction.ts:62:          "Loot catalog context must match the settlement transaction."
src/modules/items/infrastructure/postgres-loot-transaction.ts:65:      return loadLootCatalog(client, receivedContext);
src/modules/items/infrastructure/postgres-loot-transaction.ts:70:      return persistRegularLootItem(client, input);
src/modules/items/infrastructure/postgres-loot-transaction.ts:75:      return persistSpecialLootItem(client, input);
src/modules/items/infrastructure/postgres-loot-transaction.ts:78:    applyOtherLoot: async (input: ApplyOtherLootInput) => {
src/modules/items/infrastructure/postgres-loot-transaction.ts:80:      await applyOtherLootReward(client, input);
src/modules/items/infrastructure/postgres-loot.repository.ts:4:  LootGenerationContext,
src/modules/items/infrastructure/postgres-loot.repository.ts:5:  LootRepository,
src/modules/items/infrastructure/postgres-loot.repository.ts:6:  LootSettlementTransaction,
src/modules/items/infrastructure/postgres-loot.repository.ts:7:} from "../application/loot.repository.js";
src/modules/items/infrastructure/postgres-loot.repository.ts:9:  createPostgresLootSettlementTransaction,
src/modules/items/infrastructure/postgres-loot.repository.ts:10:} from "./postgres-loot-transaction.js";
src/modules/items/infrastructure/postgres-loot.repository.ts:12:export type PostgresLootPool = Pick<Pool, "connect">;
src/modules/items/infrastructure/postgres-loot.repository.ts:15:  context: LootGenerationContext
src/modules/items/infrastructure/postgres-loot.repository.ts:26:export class PostgresLootRepository implements LootRepository {
src/modules/items/infrastructure/postgres-loot.repository.ts:28:    private readonly pool: PostgresLootPool
src/modules/items/infrastructure/postgres-loot.repository.ts:31:  public async withSettlementTransaction<TResult>(
src/modules/items/infrastructure/postgres-loot.repository.ts:32:    context: LootGenerationContext,
src/modules/items/infrastructure/postgres-loot.repository.ts:34:      transaction: LootSettlementTransaction
src/modules/items/infrastructure/postgres-loot.repository.ts:43:          await createPostgresLootSettlementTransaction(
src/modules/progression/domain/defeat-settlement.ts:2:  CombatSettlementContext,
src/modules/progression/domain/defeat-settlement.ts:25:export type DefeatSettlementPlan = {
src/modules/progression/domain/defeat-settlement.ts:70:export function planDefeatSettlement(
src/modules/progression/domain/defeat-settlement.ts:71:  context: CombatSettlementContext,
src/modules/progression/domain/defeat-settlement.ts:75:): DefeatSettlementPlan {
src/modules/progression/domain/gold-roll.ts:2:  RandomSource,
src/modules/progression/domain/gold-roll.ts:11:  randomSource: RandomSource
src/modules/progression/domain/gold-roll.ts:34:  if (randomSource.nextBigInt) {
src/modules/progression/domain/gold-roll.ts:36:      randomSource.nextBigInt(
src/modules/progression/domain/gold-roll.ts:60:      "RandomSource without nextBigInt cannot roll this Gold range."
src/modules/progression/domain/gold-roll.ts:71:    randomSource.nextInt(
src/modules/progression/domain/victory-rewards.ts:2:  RandomSource,
src/modules/progression/domain/victory-rewards.ts:48:  randomSource: RandomSource
src/modules/progression/domain/victory-rewards.ts:69:    randomSource.nextInt(
src/modules/progression/domain/victory-rewards.ts:85:  randomSource: RandomSource
src/modules/progression/domain/victory-rewards.ts:101:      randomSource
src/modules/progression/domain/victory-settlement.ts:2:  CombatSettlementContext,
src/modules/progression/domain/victory-settlement.ts:11:  RandomSource,
src/modules/progression/domain/victory-settlement.ts:39:export type VictorySettlementPlan = {
src/modules/progression/domain/victory-settlement.ts:85:export function planVictorySettlement(
src/modules/progression/domain/victory-settlement.ts:87:  context: CombatSettlementContext,
src/modules/progression/domain/victory-settlement.ts:90:  randomSource: RandomSource
src/modules/progression/domain/victory-settlement.ts:91:): VictorySettlementPlan {
src/modules/progression/domain/victory-settlement.ts:97:      "Settlement character does not match combat session."
src/modules/progression/domain/victory-settlement.ts:106:      "Settlement monster does not match combat session."
src/modules/progression/domain/victory-settlement.ts:120:      randomSource
tests/integration/characters/postgres-character-set-bonuses.repository.test.ts:50:        await testPool.query("DELETE FROM item_bases WHERE item_base_id = $1", [id]);
tests/integration/characters/postgres-character-set-bonuses.repository.test.ts:110:      const baseResult = await testPool.query<{ item_base_id: string }>(
tests/integration/characters/postgres-character-set-bonuses.repository.test.ts:112:          INSERT INTO item_bases (
tests/integration/characters/postgres-character-set-bonuses.repository.test.ts:117:          RETURNING item_base_id
tests/integration/characters/postgres-character-set-bonuses.repository.test.ts:122:      const itemBaseId = baseResult.rows[0]?.item_base_id;
tests/integration/characters/postgres-character-set-bonuses.repository.test.ts:129:            item_base_id, item_level, required_level, rarity, item_score
tests/integration/characters/postgres-character-set-bonuses.repository.test.ts:143:          INSERT INTO inventory_items (
tests/integration/characters/postgres-character-statistics.repository.test.ts:66:        await testPool.query("DELETE FROM item_bases WHERE item_base_id = $1", [itemBaseId]);
tests/integration/characters/postgres-character-statistics.repository.test.ts:92:      const result = await testPool.query<{ item_base_id: string }>(
tests/integration/characters/postgres-character-statistics.repository.test.ts:94:          INSERT INTO item_bases (
tests/integration/characters/postgres-character-statistics.repository.test.ts:103:          RETURNING item_base_id
tests/integration/characters/postgres-character-statistics.repository.test.ts:108:      const itemBaseId = result.rows[0]?.item_base_id;
tests/integration/characters/postgres-character-statistics.repository.test.ts:121:            item_base_id, item_level, required_level, rarity, item_score
tests/integration/characters/postgres-character-statistics.repository.test.ts:190:        INSERT INTO item_affixes (
tests/integration/characters/postgres-character-statistics.repository.test.ts:193:          affix_position,
tests/integration/characters/postgres-character-statistics.repository.test.ts:209:        INSERT INTO inventory_items (
tests/integration/characters/postgres-equipment.repository.test.ts:67:    item_base_id: string;
tests/integration/characters/postgres-equipment.repository.test.ts:70:      INSERT INTO item_bases (
tests/integration/characters/postgres-equipment.repository.test.ts:92:      RETURNING item_base_id
tests/integration/characters/postgres-equipment.repository.test.ts:108:    itemBaseResult.rows[0]?.item_base_id;
tests/integration/characters/postgres-equipment.repository.test.ts:121:        item_base_id,
tests/integration/characters/postgres-equipment.repository.test.ts:124:        rarity,
tests/integration/characters/postgres-equipment.repository.test.ts:125:        item_score
tests/integration/characters/postgres-equipment.repository.test.ts:145:      INSERT INTO inventory_items (
tests/integration/characters/postgres-equipment.repository.test.ts:180:      FROM inventory_items
tests/integration/characters/postgres-equipment.repository.test.ts:223:            DELETE FROM item_bases
tests/integration/characters/postgres-equipment.repository.test.ts:224:            WHERE item_base_id = $1
tests/integration/combat/daily-boss-start.integration.test.ts:118:          loot_level_modifier,
tests/integration/combat/daily-boss-start.integration.test.ts:139:          loot_level_modifier,
tests/integration/combat/persistent-combat-schema.test.ts:230:  it("contains the M6 settlement schema", async () => {
tests/integration/combat/resolve-combat-action.integration.test.ts:28:  type CombatSettlementFailurePoint,
tests/integration/combat/resolve-combat-action.integration.test.ts:31:  RandomSource,
tests/integration/combat/resolve-combat-action.integration.test.ts:74:class MissRandomSource
tests/integration/combat/resolve-combat-action.integration.test.ts:75:  implements RandomSource {
tests/integration/combat/resolve-combat-action.integration.test.ts:89:class DefeatRandomSource
tests/integration/combat/resolve-combat-action.integration.test.ts:90:  implements RandomSource {
tests/integration/combat/resolve-combat-action.integration.test.ts:110:class VictoryRandomSource
tests/integration/combat/resolve-combat-action.integration.test.ts:111:  implements RandomSource {
tests/integration/combat/resolve-combat-action.integration.test.ts:133:class BossLootLevelRandomSource
tests/integration/combat/resolve-combat-action.integration.test.ts:134:  implements RandomSource {
tests/integration/combat/resolve-combat-action.integration.test.ts:170:class InvalidLootRandomSource
tests/integration/combat/resolve-combat-action.integration.test.ts:171:  implements RandomSource {
tests/integration/combat/resolve-combat-action.integration.test.ts:431:  randomSource: RandomSource
tests/integration/combat/resolve-combat-action.integration.test.ts:435:    randomSource,
tests/integration/combat/resolve-combat-action.integration.test.ts:483:      "loads authoritative settlement context under transaction locks",
tests/integration/combat/resolve-combat-action.integration.test.ts:500:                  .loadSettlementContext()
tests/integration/combat/resolve-combat-action.integration.test.ts:552:          new MissRandomSource()
tests/integration/combat/resolve-combat-action.integration.test.ts:643:          new MissRandomSource()
tests/integration/combat/resolve-combat-action.integration.test.ts:686:          new VictoryRandomSource()
tests/integration/combat/resolve-combat-action.integration.test.ts:740:      "rolls back Combat settlement when Loot generation fails",
tests/integration/combat/resolve-combat-action.integration.test.ts:751:          new InvalidLootRandomSource()
tests/integration/combat/resolve-combat-action.integration.test.ts:815:          new DefeatRandomSource()
tests/integration/combat/resolve-combat-action.integration.test.ts:835:          settlement: {
tests/integration/combat/resolve-combat-action.integration.test.ts:1115:          new VictoryRandomSource()
tests/integration/combat/resolve-combat-action.integration.test.ts:1124:          result.settlement
tests/integration/combat/resolve-combat-action.integration.test.ts:1454:          new VictoryRandomSource()
tests/integration/combat/resolve-combat-action.integration.test.ts:1592:          new MissRandomSource()
tests/integration/combat/resolve-combat-action.integration.test.ts:1609:        expect(result.settlement).toMatchObject({
tests/integration/combat/resolve-combat-action.integration.test.ts:1689:          new VictoryRandomSource()
tests/integration/combat/resolve-combat-action.integration.test.ts:1703:          settlement: {
tests/integration/combat/resolve-combat-action.integration.test.ts:1733:      "applies the boss loot level bonus to the rolled Item Level",
tests/integration/combat/resolve-combat-action.integration.test.ts:1742:          loot_level_bonus: number;
tests/integration/combat/resolve-combat-action.integration.test.ts:1749:              b.loot_level_bonus
tests/integration/combat/resolve-combat-action.integration.test.ts:1753:            INNER JOIN loot_tables AS lt
tests/integration/combat/resolve-combat-action.integration.test.ts:1766:            "Boss loot level fixture was not found."
tests/integration/combat/resolve-combat-action.integration.test.ts:1782:        const randomSource =
tests/integration/combat/resolve-combat-action.integration.test.ts:1783:          new BossLootLevelRandomSource();
tests/integration/combat/resolve-combat-action.integration.test.ts:1786:          // Boss level 20 with loot level bonus 5 yields the canonical
tests/integration/combat/resolve-combat-action.integration.test.ts:1787:          // Item Level range [15, 30] (effective loot level 25).
tests/integration/combat/resolve-combat-action.integration.test.ts:1800:              SET loot_level_bonus = 5
tests/integration/combat/resolve-combat-action.integration.test.ts:1807:            createService(randomSource);
tests/integration/combat/resolve-combat-action.integration.test.ts:1817:            settlement: {
tests/integration/combat/resolve-combat-action.integration.test.ts:1823:            result.loot === null ||
tests/integration/combat/resolve-combat-action.integration.test.ts:1824:            result.loot.regularEquipment
tests/integration/combat/resolve-combat-action.integration.test.ts:1833:            result.loot.regularEquipment
tests/integration/combat/resolve-combat-action.integration.test.ts:1837:            result.loot.regularEquipment
tests/integration/combat/resolve-combat-action.integration.test.ts:1846:          // Primary assertion: the boss loot level bonus reached the
tests/integration/combat/resolve-combat-action.integration.test.ts:1855:            randomSource.itemLevelRange
tests/integration/combat/resolve-combat-action.integration.test.ts:1899:              SET loot_level_bonus = $2
tests/integration/combat/resolve-combat-action.integration.test.ts:1904:              bossRow.loot_level_bonus,
tests/integration/combat/resolve-combat-action.integration.test.ts:1967:          new DefeatRandomSource()
tests/integration/combat/resolve-combat-action.integration.test.ts:1983:          settlement: {
tests/integration/combat/resolve-combat-action.integration.test.ts:2110:          new VictoryRandomSource()
tests/integration/combat/resolve-combat-action.integration.test.ts:2122:          settlement: {
tests/integration/combat/resolve-combat-action.integration.test.ts:2248:          new VictoryRandomSource()
tests/integration/combat/resolve-combat-action.integration.test.ts:2260:          settlement: {
tests/integration/combat/resolve-combat-action.integration.test.ts:2299:      "rolls back every main Victory settlement phase",
tests/integration/combat/resolve-combat-action.integration.test.ts:2302:          CombatSettlementFailurePoint[] = [
tests/integration/combat/resolve-combat-action.integration.test.ts:2331:                settlementFailureInjector:
tests/integration/combat/resolve-combat-action.integration.test.ts:2345:              new VictoryRandomSource(),
tests/integration/combat/resolve-combat-action.integration.test.ts:2369:      "rolls back every main Defeat settlement phase",
tests/integration/combat/resolve-combat-action.integration.test.ts:2372:          CombatSettlementFailurePoint[] = [
tests/integration/combat/resolve-combat-action.integration.test.ts:2432:                settlementFailureInjector:
tests/integration/combat/resolve-combat-action.integration.test.ts:2446:              new DefeatRandomSource(),
tests/integration/combat/resolve-combat-action.integration.test.ts:2538:                settlementFailureInjector:
tests/integration/combat/resolve-combat-action.integration.test.ts:2553:              new VictoryRandomSource(),
tests/integration/combat/resolve-combat-action.integration.test.ts:2660:              settlementFailureInjector:
tests/integration/combat/resolve-combat-action.integration.test.ts:2675:            new VictoryRandomSource(),
tests/integration/combat/resolve-combat-action.integration.test.ts:2714:          CombatSettlementFailurePoint[] = [
tests/integration/combat/resolve-combat-action.integration.test.ts:2833:                settlementFailureInjector:
tests/integration/combat/resolve-combat-action.integration.test.ts:2847:              new DefeatRandomSource(),
tests/integration/combat/resolve-combat-action.integration.test.ts:3041:              settlementFailureInjector:
tests/integration/combat/resolve-combat-action.integration.test.ts:3056:            new VictoryRandomSource(),
tests/integration/combat/resolve-combat-action.integration.test.ts:3150:                    loot_level_modifier,
tests/integration/combat/resolve-combat-action.integration.test.ts:3171:                    loot_level_modifier,
tests/integration/combat/resolve-combat-action.integration.test.ts:3511:              new VictoryRandomSource()
tests/integration/combat/resolve-combat-action.integration.test.ts:3523:            settlement: {
tests/integration/combat/resolve-combat-action.integration.test.ts:3725:                    loot_level_modifier,
tests/integration/combat/resolve-combat-action.integration.test.ts:3746:                    loot_level_modifier,
tests/integration/combat/resolve-combat-action.integration.test.ts:4093:                settlementFailureInjector:
tests/integration/combat/resolve-combat-action.integration.test.ts:4108:              new VictoryRandomSource(),
tests/integration/combat/resolve-combat-action.integration.test.ts:4290:              new VictoryRandomSource()
tests/integration/combat/resolve-combat-action.integration.test.ts:4300:            settlement: {
tests/integration/combat/resolve-combat-action.integration.test.ts:4427:              new DefeatRandomSource()
tests/integration/combat/resolve-combat-action.integration.test.ts:4437:            settlement: {
tests/integration/combat/resolve-combat-action.integration.test.ts:4580:                settlementFailureInjector:
tests/integration/combat/resolve-combat-action.integration.test.ts:4595:              new DefeatRandomSource(),
tests/integration/combat/resolve-combat-action.integration.test.ts:4645:          new MissRandomSource()
tests/integration/http/combat.http.test.ts:26:  RandomSource,
tests/integration/http/combat.http.test.ts:162:class DefeatRandomSource
tests/integration/http/combat.http.test.ts:163:  implements RandomSource {
tests/integration/http/combat.http.test.ts:189:class VictoryRandomSource
tests/integration/http/combat.http.test.ts:190:  implements RandomSource {
tests/integration/http/combat.http.test.ts:211: * Deterministic Victories that always succeed the Equipment and Other Loot
tests/integration/http/combat.http.test.ts:217:class LootVictoryRandomSource
tests/integration/http/combat.http.test.ts:218:  implements RandomSource {
tests/integration/http/combat.http.test.ts:242:async function createLootBearingMonster() {
tests/integration/http/combat.http.test.ts:252:  // files never observe or depend on each other's loot data.
tests/integration/http/combat.http.test.ts:255:      item_base_id: string;
tests/integration/http/combat.http.test.ts:258:        INSERT INTO item_bases (
tests/integration/http/combat.http.test.ts:265:          base_item_score
tests/integration/http/combat.http.test.ts:268:        RETURNING item_base_id
tests/integration/http/combat.http.test.ts:271:        `loot_http_base_${suffix}`,
tests/integration/http/combat.http.test.ts:272:        `Loot HTTP Base ${suffix}`,
tests/integration/http/combat.http.test.ts:273:        "HTTP integration-test loot Item Base.",
tests/integration/http/combat.http.test.ts:278:    itemBaseResult.rows[0]?.item_base_id;
tests/integration/http/combat.http.test.ts:282:      "Could not create the HTTP loot Item Base."
tests/integration/http/combat.http.test.ts:290:      INSERT INTO loot_tables (
tests/integration/http/combat.http.test.ts:292:        item_base_id,
tests/integration/http/combat.http.test.ts:314:          is_lootable
tests/integration/http/combat.http.test.ts:320:        `loot_http_material_${suffix}`,
tests/integration/http/combat.http.test.ts:321:        `Loot HTTP Material ${suffix}`,
tests/integration/http/combat.http.test.ts:322:        "HTTP integration-test loot Material.",
tests/integration/http/combat.http.test.ts:331:      "Could not create the HTTP loot Material."
tests/integration/http/combat.http.test.ts:339:      INSERT INTO other_loot_tables (
tests/integration/http/combat.http.test.ts:358:  randomSource?: RandomSource
tests/integration/http/combat.http.test.ts:362:      randomSource,
tests/integration/http/combat.http.test.ts:506:      // Monsters cascade loot_tables, other_loot_tables and any dependent
tests/integration/http/combat.http.test.ts:524:      // Remove dedicated loot Item Bases and Materials after the Monsters
tests/integration/http/combat.http.test.ts:531:                DELETE FROM item_bases
tests/integration/http/combat.http.test.ts:532:                WHERE item_base_id = $1
tests/integration/http/combat.http.test.ts:751:      "returns a terminal Victory settlement with string amounts",
tests/integration/http/combat.http.test.ts:821:            new VictoryRandomSource()
tests/integration/http/combat.http.test.ts:868:              settlement: {
tests/integration/http/combat.http.test.ts:907:        const settlement =
tests/integration/http/combat.http.test.ts:908:          body.data.settlement;
tests/integration/http/combat.http.test.ts:912:        expect(settlement).toMatchObject({
tests/integration/http/combat.http.test.ts:948:          settlement.experience,
tests/integration/http/combat.http.test.ts:952:          settlement.gold,
tests/integration/http/combat.http.test.ts:956:          settlement.statistics,
tests/integration/http/combat.http.test.ts:967:              settlement
tests/integration/http/combat.http.test.ts:976:              settlement
tests/integration/http/combat.http.test.ts:985:      "returns a terminal Defeat settlement with string amounts",
tests/integration/http/combat.http.test.ts:1056:            new DefeatRandomSource()
tests/integration/http/combat.http.test.ts:1105:              loot: unknown;
tests/integration/http/combat.http.test.ts:1106:              settlement: {
tests/integration/http/combat.http.test.ts:1141:        expect(body.data.loot).toBeNull();
tests/integration/http/combat.http.test.ts:1148:          body.data.settlement
tests/integration/http/combat.http.test.ts:1177:          typeof body.data.settlement
tests/integration/http/combat.http.test.ts:1182:          typeof body.data.settlement
tests/integration/http/combat.http.test.ts:1187:          typeof body.data.settlement
tests/integration/http/combat.http.test.ts:1192:          typeof body.data.settlement
tests/integration/http/combat.http.test.ts:1197:          typeof body.data.settlement
tests/integration/http/combat.http.test.ts:1205:              body.data.settlement
tests/integration/http/combat.http.test.ts:1214:              body.data.settlement
tests/integration/http/combat.http.test.ts:1223:      "returns Loot settlement for terminal Victory",
tests/integration/http/combat.http.test.ts:1241:                `Http-Loot-${randomUUID()
tests/integration/http/combat.http.test.ts:1264:          await createLootBearingMonster();
tests/integration/http/combat.http.test.ts:1287:            new LootVictoryRandomSource()
tests/integration/http/combat.http.test.ts:1326:              loot: {
tests/integration/http/combat.http.test.ts:1331:                    rarity: string;
tests/integration/http/combat.http.test.ts:1343:                    "InventoryFull" | null;
tests/integration/http/combat.http.test.ts:1349:                    "InventoryFull" | null;
tests/integration/http/combat.http.test.ts:1352:                otherLoot: {
tests/integration/http/combat.http.test.ts:1354:                  otherLootTableId: string;
tests/integration/http/combat.http.test.ts:1369:        const loot = body.data.loot;
tests/integration/http/combat.http.test.ts:1371:        expect(loot).not.toBeNull();
tests/integration/http/combat.http.test.ts:1375:          loot.regularEquipment.generated
tests/integration/http/combat.http.test.ts:1379:          loot.regularEquipment.persisted
tests/integration/http/combat.http.test.ts:1383:          loot.regularEquipment.lossReason
tests/integration/http/combat.http.test.ts:1388:          typeof loot.regularEquipment
tests/integration/http/combat.http.test.ts:1393:          typeof loot.regularEquipment
tests/integration/http/combat.http.test.ts:1398:          typeof loot.regularEquipment
tests/integration/http/combat.http.test.ts:1403:          loot.regularEquipment
tests/integration/http/combat.http.test.ts:1416:          loot.specialEquipment.generated
tests/integration/http/combat.http.test.ts:1420:          loot.specialEquipment.persisted
tests/integration/http/combat.http.test.ts:1424:          loot.specialEquipment.lossReason
tests/integration/http/combat.http.test.ts:1432:          loot.specialRollOutcome
tests/integration/http/combat.http.test.ts:1436:          loot.specialRollOutcome
tests/integration/http/combat.http.test.ts:1439:        // otherLoot: present with a string-serialized quantity.
tests/integration/http/combat.http.test.ts:1440:        expect(loot.otherLoot).not.toBeNull();
tests/integration/http/combat.http.test.ts:1443:          typeof loot.otherLoot?.quantity
tests/integration/http/combat.http.test.ts:1450:          loot.otherLoot?.kind
tests/integration/http/combat.http.test.ts:1455:          typeof loot.pity
tests/integration/http/combat.http.test.ts:1460:          typeof loot.pity
tests/integration/monsters/daily-boss-discovery.repository.test.ts:114:          loot_level_modifier,
tests/integration/monsters/daily-boss-discovery.repository.test.ts:134:          loot_level_modifier,
tests/unit/combat/combat-attack.test.ts:9:  InvalidRandomSourceError,
tests/unit/combat/combat-attack.test.ts:20:  RandomSource,
tests/unit/combat/combat-attack.test.ts:35:function createRandomSource(
tests/unit/combat/combat-attack.test.ts:38:): RandomSource {
tests/unit/combat/combat-attack.test.ts:83:    const randomSource =
tests/unit/combat/combat-attack.test.ts:84:      createRandomSource(0.4, 15);
tests/unit/combat/combat-attack.test.ts:89:      randomSource
tests/unit/combat/combat-attack.test.ts:98:      randomSource.nextInt
tests/unit/combat/combat-attack.test.ts:103:    const randomSource =
tests/unit/combat/combat-attack.test.ts:104:      createRandomSource(0.39999, 15);
tests/unit/combat/combat-attack.test.ts:109:      randomSource
tests/unit/combat/combat-attack.test.ts:119:    const randomSource =
tests/unit/combat/combat-attack.test.ts:120:      createRandomSource(0.04, 0);
tests/unit/combat/combat-attack.test.ts:125:      randomSource
tests/unit/combat/combat-attack.test.ts:135:    const randomSource =
tests/unit/combat/combat-attack.test.ts:136:      createRandomSource(1, 0);
tests/unit/combat/combat-attack.test.ts:142:        randomSource
tests/unit/combat/combat-attack.test.ts:144:    ).toThrow(InvalidRandomSourceError);
tests/unit/combat/combat-attack.test.ts:148:    const randomSource =
tests/unit/combat/combat-attack.test.ts:149:      createRandomSource(0, 21);
tests/unit/combat/combat-attack.test.ts:155:        randomSource
tests/unit/combat/combat-attack.test.ts:157:    ).toThrow(InvalidRandomSourceError);
tests/unit/combat/combat-determinism.test.ts:19:  RandomSource,
tests/unit/combat/combat-determinism.test.ts:22:class SequenceRandomSource implements RandomSource {
tests/unit/combat/combat-determinism.test.ts:89:      new SequenceRandomSource(
tests/unit/combat/combat-determinism.test.ts:98:      new SequenceRandomSource(
tests/unit/combat/combat-determinism.test.ts:111:      new SequenceRandomSource(
tests/unit/combat/combat-determinism.test.ts:140:        new SequenceRandomSource(
tests/unit/combat/combat-determinism.test.ts:156:      new SequenceRandomSource(
tests/unit/combat/combat-determinism.test.ts:172:      new SequenceRandomSource(
tests/unit/combat/combat-determinism.test.ts:181:      new SequenceRandomSource(
tests/unit/combat/combat-engine.test.ts:8:  RandomSource,
tests/unit/combat/combat-engine.test.ts:23:class SequenceRandomSource implements RandomSource {
tests/unit/combat/combat-engine.test.ts:88:    const randomSource =
tests/unit/combat/combat-engine.test.ts:89:      new SequenceRandomSource(
tests/unit/combat/combat-engine.test.ts:97:      randomSource
tests/unit/combat/combat-engine.test.ts:123:    const randomSource =
tests/unit/combat/combat-engine.test.ts:124:      new SequenceRandomSource(
tests/unit/combat/combat-engine.test.ts:132:      randomSource
tests/unit/combat/combat-engine.test.ts:157:    const randomSource =
tests/unit/combat/combat-engine.test.ts:158:      new SequenceRandomSource(
tests/unit/combat/combat-engine.test.ts:166:      randomSource
tests/unit/combat/combat-engine.test.ts:187:    const randomSource =
tests/unit/combat/combat-engine.test.ts:188:      new SequenceRandomSource(
tests/unit/combat/combat-engine.test.ts:196:      randomSource
tests/unit/combat/combat-engine.test.ts:220:    const randomSource =
tests/unit/combat/combat-engine.test.ts:221:      new SequenceRandomSource(
tests/unit/combat/combat-engine.test.ts:229:      randomSource
tests/unit/combat/combat-retrieval.services.test.ts:94:      settlement: null,
tests/unit/combat/combat-retrieval.services.test.ts:95:      loot: null,
tests/unit/combat/combat-retrieval.services.test.ts:136:      settlement: null,
tests/unit/combat/combat-retrieval.services.test.ts:137:      loot: null,
tests/unit/combat/combat-retrieval.services.test.ts:169:      settlement: null,
tests/unit/combat/combat-validation.test.ts:14:  InvalidRandomSourceError,
tests/unit/combat/combat-validation.test.ts:242:    ).toThrow(InvalidRandomSourceError);
tests/unit/combat/combat-validation.test.ts:246:    ).toThrow(InvalidRandomSourceError);
tests/unit/combat/combat-validation.test.ts:262:    ).toThrow(InvalidRandomSourceError);
tests/unit/combat/crypto-random-source.test.ts:9:  CryptoRandomSource,
tests/unit/combat/crypto-random-source.test.ts:12:describe("CryptoRandomSource", () => {
tests/unit/combat/crypto-random-source.test.ts:14:    const randomSource =
tests/unit/combat/crypto-random-source.test.ts:15:      new CryptoRandomSource(
tests/unit/combat/crypto-random-source.test.ts:21:      randomSource.nextFloat()
tests/unit/combat/crypto-random-source.test.ts:26:    const randomSource =
tests/unit/combat/crypto-random-source.test.ts:27:      new CryptoRandomSource(
tests/unit/combat/crypto-random-source.test.ts:33:      randomSource.nextFloat();
tests/unit/combat/crypto-random-source.test.ts:52:    const randomSource =
tests/unit/combat/crypto-random-source.test.ts:53:      new CryptoRandomSource(
tests/unit/combat/crypto-random-source.test.ts:59:      randomSource.nextInt(10, 20)
tests/unit/combat/crypto-random-source.test.ts:66:    const randomSource =
tests/unit/combat/crypto-random-source.test.ts:67:      new CryptoRandomSource(
tests/unit/combat/crypto-random-source.test.ts:73:      randomSource.nextInt(5, 5)
tests/unit/combat/crypto-random-source.test.ts:79:    const randomSource =
tests/unit/combat/crypto-random-source.test.ts:80:      new CryptoRandomSource();
tests/unit/combat/crypto-random-source.test.ts:83:      randomSource.nextInt(
tests/unit/combat/crypto-random-source.test.ts:90:      randomSource.nextInt(20, 10)
tests/unit/combat/crypto-random-source.test.ts:95:    const randomSource =
tests/unit/combat/crypto-random-source.test.ts:96:      new CryptoRandomSource();
tests/unit/combat/crypto-random-source.test.ts:99:      randomSource.nextInt(
tests/unit/combat/crypto-random-source.test.ts:107:    const randomSource =
tests/unit/combat/crypto-random-source.test.ts:108:      new CryptoRandomSource(
tests/unit/combat/crypto-random-source.test.ts:114:      randomSource.nextFloat()
tests/unit/combat/crypto-random-source.test.ts:126:    const randomSource =
tests/unit/combat/crypto-random-source.test.ts:127:      new CryptoRandomSource(
tests/unit/combat/crypto-random-source.test.ts:132:      randomSource.nextBigInt(
tests/unit/combat/crypto-random-source.test.ts:149:    const randomSource =
tests/unit/combat/crypto-random-source.test.ts:150:      new CryptoRandomSource(
tests/unit/combat/crypto-random-source.test.ts:155:      randomSource.nextBigInt(
tests/unit/combat/crypto-random-source.test.ts:167:    const randomSource =
tests/unit/combat/crypto-random-source.test.ts:168:      new CryptoRandomSource();
tests/unit/combat/crypto-random-source.test.ts:171:      randomSource.nextBigInt(
tests/unit/combat/resolve-combat-action.service.test.ts:34:  RandomSource,
tests/unit/combat/resolve-combat-action.service.test.ts:67:  randomSource: RandomSource = {
tests/unit/combat/resolve-combat-action.service.test.ts:77:  const withLootSettlement = vi.fn(async (
tests/unit/combat/resolve-combat-action.service.test.ts:89:      otherLootCandidates: [],
tests/unit/combat/resolve-combat-action.service.test.ts:99:    applyOtherLoot: vi.fn(),
tests/unit/combat/resolve-combat-action.service.test.ts:135:    withLootSettlement,
tests/unit/combat/resolve-combat-action.service.test.ts:136:    loadSettlementContext:
tests/unit/combat/resolve-combat-action.service.test.ts:200:          lootLevelBonus: 0,
tests/unit/combat/resolve-combat-action.service.test.ts:209:    applyVictorySettlement:
tests/unit/combat/resolve-combat-action.service.test.ts:298:    applyDefeatSettlement:
tests/unit/combat/resolve-combat-action.service.test.ts:414:      randomSource,
tests/unit/combat/resolve-combat-action.service.test.ts:421:    randomSource,
tests/unit/combat/resolve-combat-action.service.test.ts:423:    withLootSettlement,
tests/unit/combat/resolve-combat-action.service.test.ts:481:        settlement: null,
tests/unit/combat/resolve-combat-action.service.test.ts:482:        loot: null,
tests/unit/combat/resolve-combat-action.service.test.ts:509:        fixture.randomSource.nextFloat
tests/unit/combat/resolve-combat-action.service.test.ts:555:      expect(fixture.withLootSettlement).toHaveBeenCalledOnce();
tests/unit/combat/resolve-combat-action.service.test.ts:556:      expect(result.loot).toMatchObject({
tests/unit/combat/resolve-combat-action.service.test.ts:558:        otherLoot: null,
tests/unit/combat/resolve-combat-action.service.test.ts:608:        loot: null,
tests/unit/combat/resolve-combat-action.service.test.ts:610:      expect(fixture.withLootSettlement).not.toHaveBeenCalled();
tests/unit/http/combat-http.handler.test.ts:71:    settlement: null,
tests/unit/http/combat-http.handler.test.ts:302:  it("returns settlement null for a continuing action", async () => {
tests/unit/http/combat-http.handler.test.ts:323:          settlement:
tests/unit/http/combat-http.handler.test.ts:329:      body.data.settlement
tests/unit/http/combat-http.handler.test.ts:333:  it("serializes a terminal settlement with bigint amounts", async () => {
tests/unit/http/combat-http.handler.test.ts:358:        settlement: {
tests/unit/http/combat-http.handler.test.ts:446:          settlement: unknown;
tests/unit/http/combat-http.handler.test.ts:451:      body.data.settlement
tests/unit/items/complete-regular-item-generator.test.ts:2:import type { RandomSource } from "../../../src/modules/combat/ports/random-source.js";
tests/unit/items/complete-regular-item-generator.test.ts:11:class TrackingRandomSource implements RandomSource {
tests/unit/items/complete-regular-item-generator.test.ts:87:    const random = new TrackingRandomSource([301], []);
tests/unit/items/complete-regular-item-generator.test.ts:89:      context: { monsterLevel: 20, bossBonusLootLevel: 0, isBoss: false },
tests/unit/items/complete-regular-item-generator.test.ts:99:    const random = new TrackingRandomSource(
tests/unit/items/complete-regular-item-generator.test.ts:104:      context: { monsterLevel: 20, bossBonusLootLevel: 0, isBoss: false },
tests/unit/items/complete-regular-item-generator.test.ts:114:      rarity: "Common",
tests/unit/items/complete-regular-item-generator.test.ts:128:    const random = new TrackingRandomSource(
tests/unit/items/complete-regular-item-generator.test.ts:133:      context: { monsterLevel: 20, bossBonusLootLevel: 5, isBoss: true },
tests/unit/items/complete-regular-item-generator.test.ts:143:      rarity: "Magic",
tests/unit/items/complete-regular-item-generator.test.ts:156:    const random = new TrackingRandomSource([1, 10], []);
tests/unit/items/complete-regular-item-generator.test.ts:158:      context: { monsterLevel: 20, bossBonusLootLevel: 0, isBoss: false },
tests/unit/items/complete-regular-item-generator.test.ts:166:      context: { monsterLevel: 20, bossBonusLootLevel: 0, isBoss: false },
tests/unit/items/complete-regular-item-generator.test.ts:172:      new TrackingRandomSource([300, 10], [1n, 1n, 701n, 1n, 15n])
tests/unit/items/complete-regular-item-generator.test.ts:176:      new TrackingRandomSource([300, 10], [1n, 1n, 701n, 1n, 15n])
tests/unit/items/item-base-selection.test.ts:2:import type { RandomSource } from "../../../src/modules/combat/ports/random-source.js";
tests/unit/items/item-base-selection.test.ts:7:function source(values: bigint[]): RandomSource {
tests/unit/items/item-generator.test.ts:2:import type { RandomSource } from "../../../src/modules/combat/ports/random-source.js";
tests/unit/items/item-generator.test.ts:13:class SequenceRandomSource implements RandomSource {
tests/unit/items/item-generator.test.ts:64:const rarityProfile = [
tests/unit/items/item-generator.test.ts:85:  it("maps Common rarity to zero affixes", () => {
tests/unit/items/item-generator.test.ts:87:      { base, rarityProfile, affixPool: [], coefficients },
tests/unit/items/item-generator.test.ts:88:      new SequenceRandomSource([1n])
tests/unit/items/item-generator.test.ts:92:      rarity: "Common",
tests/unit/items/item-generator.test.ts:101:  it("does not inspect or consume the Affix pool for Common rarity", () => {
tests/unit/items/item-generator.test.ts:116:        rarityProfile,
tests/unit/items/item-generator.test.ts:120:      new SequenceRandomSource([1n])
tests/unit/items/item-generator.test.ts:122:    expect(result.rarity).toBe("Common");
tests/unit/items/item-generator.test.ts:127:  it("maps every rarity to the authoritative affix count", () => {
tests/unit/items/item-generator.test.ts:129:      { rarityRoll: 1n, expected: 0 },
tests/unit/items/item-generator.test.ts:130:      { rarityRoll: 2n, expected: 1 },
tests/unit/items/item-generator.test.ts:131:      { rarityRoll: 3n, expected: 2 },
tests/unit/items/item-generator.test.ts:132:      { rarityRoll: 4n, expected: 3 },
tests/unit/items/item-generator.test.ts:133:      { rarityRoll: 5n, expected: 4 },
tests/unit/items/item-generator.test.ts:136:      const values = [testCase.rarityRoll];
tests/unit/items/item-generator.test.ts:141:        { base, rarityProfile, affixPool: repeatedAttackAffixPool, coefficients },
tests/unit/items/item-generator.test.ts:142:        new SequenceRandomSource(values)
tests/unit/items/item-generator.test.ts:150:      { base, rarityProfile, affixPool: repeatedAttackAffixPool, coefficients },
tests/unit/items/item-generator.test.ts:151:      new SequenceRandomSource([
tests/unit/items/item-generator.test.ts:159:    expect(result.rarity).toBe("Legendary");
tests/unit/items/item-generator.test.ts:191:      { base, rarityProfile, affixPool, coefficients },
tests/unit/items/item-generator.test.ts:192:      new SequenceRandomSource([3n, 1n, 2n])
tests/unit/items/item-generator.test.ts:208:      new SequenceRandomSource([4n, 9n])
tests/unit/items/item-generator.test.ts:212:      rarity: null,
tests/unit/items/item-generator.test.ts:225:    const input = { base, rarityProfile, affixPool: repeatedAttackAffixPool, coefficients };
tests/unit/items/item-generator.test.ts:227:    expect(generateRegularItem(input, new SequenceRandomSource([...sequence])))
tests/unit/items/item-generator.test.ts:228:      .toEqual(generateRegularItem(input, new SequenceRandomSource([...sequence])));
tests/unit/items/item-generator.test.ts:231:  it("rejects a rarity that needs affixes when the pool is empty", () => {
tests/unit/items/item-generator.test.ts:233:      { base, rarityProfile, affixPool: [], coefficients },
tests/unit/items/item-generator.test.ts:234:      new SequenceRandomSource([2n])
tests/unit/items/item-generator.test.ts:238:  it("rejects a rarity when every Affix is above the rolled Item Level", () => {
tests/unit/items/item-generator.test.ts:250:      { base, rarityProfile, affixPool: ineligiblePool, coefficients },
tests/unit/items/item-generator.test.ts:251:      new SequenceRandomSource([2n])
tests/unit/items/item-generator.test.ts:252:    )).toThrow("Regular Item rarity requires a non-empty eligible affix pool.");
tests/unit/items/item-generator.test.ts:258:      new SequenceRandomSource([])
tests/unit/items/item-generator.test.ts:272:      new SequenceRandomSource([])
tests/unit/items/item-generator.test.ts:283:      new SequenceRandomSource([])
tests/unit/items/item-loot-level.test.ts:2:import type { RandomSource } from "../../../src/modules/combat/ports/random-source.js";
tests/unit/items/item-loot-level.test.ts:8:} from "../../../src/modules/items/domain/item-loot-level.js";
tests/unit/items/item-loot-level.test.ts:10:function source(values: number[]): RandomSource {
tests/unit/items/item-loot-level.test.ts:21:describe("item loot level and Equipment chance", () => {
tests/unit/items/item-loot-level.test.ts:25:      bossBonusLootLevel: 0,
tests/unit/items/item-loot-level.test.ts:28:      effectiveLootLevel: 1,
tests/unit/items/item-loot-level.test.ts:34:  it("applies the authoritative Boss loot level bonus", () => {
tests/unit/items/item-loot-level.test.ts:37:      bossBonusLootLevel: 5,
tests/unit/items/item-loot-level.test.ts:40:      effectiveLootLevel: 25,
tests/unit/items/item-loot-level.test.ts:47:    const context = { monsterLevel: 20, bossBonusLootLevel: 0, isBoss: false };
tests/unit/items/item-loot-level.test.ts:66:      bossBonusLootLevel: 0,
tests/unit/items/item-loot-level.test.ts:71:      bossBonusLootLevel: -1,
tests/unit/items/item-loot-level.test.ts:76:      bossBonusLootLevel: 1,
tests/unit/items/item-random.test.ts:2:import type { RandomSource } from "../../../src/modules/combat/ports/random-source.js";
tests/unit/items/item-random.test.ts:5:  ItemGenerationRandomSourceError,
tests/unit/items/item-random.test.ts:12:function randomSource(value: bigint): RandomSource {
tests/unit/items/item-random.test.ts:22:    expect(rollInclusiveBigInt(10n, 20n, randomSource(10n))).toBe(10n);
tests/unit/items/item-random.test.ts:23:    expect(rollInclusiveBigInt(10n, 20n, randomSource(20n))).toBe(20n);
tests/unit/items/item-random.test.ts:27:    const source = randomSource(999n);
tests/unit/items/item-random.test.ts:33:    const source: RandomSource = {
tests/unit/items/item-random.test.ts:41:    expect(() => rollInclusiveBigInt(2n, 1n, randomSource(1n)))
tests/unit/items/item-random.test.ts:43:    expect(() => rollInclusiveBigInt(1n, 2n, randomSource(3n)))
tests/unit/items/item-random.test.ts:44:      .toThrow(ItemGenerationRandomSourceError);
tests/unit/items/item-random.test.ts:52:    expect(selectWeighted(entries, randomSource(1n))).toBe("first");
tests/unit/items/item-random.test.ts:53:    expect(selectWeighted(entries, randomSource(2n))).toBe("first");
tests/unit/items/item-random.test.ts:54:    expect(selectWeighted(entries, randomSource(3n))).toBe("second");
tests/unit/items/item-random.test.ts:55:    expect(selectWeighted(entries, randomSource(5n))).toBe("second");
tests/unit/items/item-random.test.ts:59:    expect(() => selectWeighted([], randomSource(1n)))
tests/unit/items/item-random.test.ts:63:      randomSource(1n)
tests/unit/items/item-rarity-affix.test.ts:2:import type { RandomSource } from "../../../src/modules/combat/ports/random-source.js";
tests/unit/items/item-rarity-affix.test.ts:10:  rollCanonicalRarity,
tests/unit/items/item-rarity-affix.test.ts:11:} from "../../../src/modules/items/domain/item-rarity-affix.js";
tests/unit/items/item-rarity-affix.test.ts:13:function source(value: bigint): RandomSource {
tests/unit/items/item-rarity-affix.test.ts:40:describe("canonical rarity profiles", () => {
tests/unit/items/item-rarity-affix.test.ts:41:  it("covers every regular Monster rarity boundary", () => {
tests/unit/items/item-rarity-affix.test.ts:42:    expect(rollCanonicalRarity(false, source(1n))).toBe("Common");
tests/unit/items/item-rarity-affix.test.ts:43:    expect(rollCanonicalRarity(false, source(700n))).toBe("Common");
tests/unit/items/item-rarity-affix.test.ts:44:    expect(rollCanonicalRarity(false, source(701n))).toBe("Magic");
tests/unit/items/item-rarity-affix.test.ts:45:    expect(rollCanonicalRarity(false, source(900n))).toBe("Magic");
tests/unit/items/item-rarity-affix.test.ts:46:    expect(rollCanonicalRarity(false, source(901n))).toBe("Rare");
tests/unit/items/item-rarity-affix.test.ts:47:    expect(rollCanonicalRarity(false, source(980n))).toBe("Rare");
tests/unit/items/item-rarity-affix.test.ts:48:    expect(rollCanonicalRarity(false, source(981n))).toBe("Epic");
tests/unit/items/item-rarity-affix.test.ts:49:    expect(rollCanonicalRarity(false, source(998n))).toBe("Epic");
tests/unit/items/item-rarity-affix.test.ts:50:    expect(rollCanonicalRarity(false, source(999n))).toBe("Legendary");
tests/unit/items/item-rarity-affix.test.ts:51:    expect(rollCanonicalRarity(false, source(1000n))).toBe("Legendary");
tests/unit/items/item-rarity-affix.test.ts:54:  it("covers every Boss rarity boundary and never returns Common", () => {
tests/unit/items/item-rarity-affix.test.ts:55:    expect(rollCanonicalRarity(true, source(1n))).toBe("Magic");
tests/unit/items/item-rarity-affix.test.ts:56:    expect(rollCanonicalRarity(true, source(700n))).toBe("Magic");
tests/unit/items/item-rarity-affix.test.ts:57:    expect(rollCanonicalRarity(true, source(701n))).toBe("Rare");
tests/unit/items/item-rarity-affix.test.ts:58:    expect(rollCanonicalRarity(true, source(900n))).toBe("Rare");
tests/unit/items/item-rarity-affix.test.ts:59:    expect(rollCanonicalRarity(true, source(901n))).toBe("Epic");
tests/unit/items/item-rarity-affix.test.ts:60:    expect(rollCanonicalRarity(true, source(990n))).toBe("Epic");
tests/unit/items/item-rarity-affix.test.ts:61:    expect(rollCanonicalRarity(true, source(991n))).toBe("Legendary");
tests/unit/items/item-rarity-affix.test.ts:62:    expect(rollCanonicalRarity(true, source(1000n))).toBe("Legendary");
tests/unit/items/item-score.test.ts:62:  it("scores fixed stats without a rarity bonus", () => {
tests/unit/items/loot-repository-contract.test.ts:3:  LootCatalogSnapshot,
tests/unit/items/loot-repository-contract.test.ts:4:  LootGenerationContext,
tests/unit/items/loot-repository-contract.test.ts:5:  LootRepository,
tests/unit/items/loot-repository-contract.test.ts:6:  LootSettlementTransaction,
tests/unit/items/loot-repository-contract.test.ts:7:  LockedLootCharacter,
tests/unit/items/loot-repository-contract.test.ts:8:} from "../../../src/modules/items/application/loot.repository.js";
tests/unit/items/loot-repository-contract.test.ts:10:const context: LootGenerationContext = {
tests/unit/items/loot-repository-contract.test.ts:16:const character: LockedLootCharacter = {
tests/unit/items/loot-repository-contract.test.ts:23:const catalog: LootCatalogSnapshot = {
tests/unit/items/loot-repository-contract.test.ts:25:  otherLootCandidates: [],
tests/unit/items/loot-repository-contract.test.ts:40:describe("LootRepository contract", () => {
tests/unit/items/loot-repository-contract.test.ts:41:  it("executes settlement work through one locked transaction boundary", async () => {
tests/unit/items/loot-repository-contract.test.ts:42:    const transaction: LootSettlementTransaction = {
tests/unit/items/loot-repository-contract.test.ts:47:      applyOtherLoot: vi.fn(),
tests/unit/items/loot-repository-contract.test.ts:50:    const repository: LootRepository = {
tests/unit/items/loot-repository-contract.test.ts:51:      withSettlementTransaction: async (received, operation) => {
tests/unit/items/loot-repository-contract.test.ts:57:    const result = await repository.withSettlementTransaction(
tests/unit/items/loot-repository-contract.test.ts:71:    const transaction: LootSettlementTransaction = {
tests/unit/items/loot-repository-contract.test.ts:82:      applyOtherLoot: vi.fn(async () => {
tests/unit/items/loot-repository-contract.test.ts:98:        rarity: null,
tests/unit/items/loot-repository-contract.test.ts:116:        rarity: "Common",
tests/unit/items/loot-repository-contract.test.ts:122:    await transaction.applyOtherLoot({
tests/unit/items/loot-repository-contract.test.ts:126:        otherLootTableId: "other-1",
tests/unit/items/loot-settlement.service.test.ts:2:import type { RandomSource } from "../../../src/modules/combat/ports/random-source.js";
tests/unit/items/loot-settlement.service.test.ts:4:  LootCatalogSnapshot,
tests/unit/items/loot-settlement.service.test.ts:5:  LootRepository,
tests/unit/items/loot-settlement.service.test.ts:6:  LootSettlementTransaction,
tests/unit/items/loot-settlement.service.test.ts:7:} from "../../../src/modules/items/application/loot.repository.js";
tests/unit/items/loot-settlement.service.test.ts:9:  LootSettlementService,
tests/unit/items/loot-settlement.service.test.ts:10:  type LootSettlementDependencies,
tests/unit/items/loot-settlement.service.test.ts:11:} from "../../../src/modules/items/application/loot-settlement.service.js";
tests/unit/items/loot-settlement.service.test.ts:24:const catalog: LootCatalogSnapshot = {
tests/unit/items/loot-settlement.service.test.ts:25:  regularItemBases: [], otherLootCandidates: [], specialItemCandidates: [],
tests/unit/items/loot-settlement.service.test.ts:30:  rarity: "Common", affixes: [], fixedStats: [], itemScore: 10n,
tests/unit/items/loot-settlement.service.test.ts:34:  rarity: null, affixes: [], fixedStats: [
tests/unit/items/loot-settlement.service.test.ts:38:const randomSource: RandomSource = {
tests/unit/items/loot-settlement.service.test.ts:46:  bossBonusLootLevel: 0, isBoss: false,
tests/unit/items/loot-settlement.service.test.ts:56:  const transaction: LootSettlementTransaction = {
tests/unit/items/loot-settlement.service.test.ts:72:    applyOtherLoot: vi.fn(async () => { calls.push("persist-other"); }),
tests/unit/items/loot-settlement.service.test.ts:77:  const repository: LootRepository = {
tests/unit/items/loot-settlement.service.test.ts:78:    withSettlementTransaction: async (_context, operation) => operation(transaction),
tests/unit/items/loot-settlement.service.test.ts:84:  const dependencies: LootSettlementDependencies = {
tests/unit/items/loot-settlement.service.test.ts:87:      kind: "Material" as const, otherLootTableId: "other",
tests/unit/items/loot-settlement.service.test.ts:94:    service: new LootSettlementService(repository, randomSource, dependencies),
tests/unit/items/loot-settlement.service.test.ts:99:describe("Loot settlement service", () => {
tests/unit/items/loot-settlement.service.test.ts:124:    expect(result.specialEquipment.lossReason).toBe("InventoryFull");
tests/unit/items/loot-settlement.service.test.ts:125:    expect(result.regularEquipment.lossReason).toBe("InventoryFull");
tests/unit/items/loot-settlement.service.test.ts:126:    expect(result.otherLoot?.kind).toBe("Material");
tests/unit/items/loot-settlement.service.test.ts:130:    expect(transaction.applyOtherLoot).toHaveBeenCalledOnce();
tests/unit/items/loot-settlement.service.test.ts:138:    expect(result.regularEquipment.lossReason).toBe("InventoryFull");
tests/unit/items/other-loot-generator.test.ts:2:import type { RandomSource } from "../../../src/modules/combat/ports/random-source.js";
tests/unit/items/other-loot-generator.test.ts:4:import type { OtherLootCandidate } from "../../../src/modules/items/domain/item-generation.types.js";
tests/unit/items/other-loot-generator.test.ts:5:import { generateOtherLoot } from "../../../src/modules/items/domain/other-loot-generator.js";
tests/unit/items/other-loot-generator.test.ts:7:class SequenceRandomSource implements RandomSource {
tests/unit/items/other-loot-generator.test.ts:28:function material(overrides: Partial<OtherLootCandidate> = {}): OtherLootCandidate {
tests/unit/items/other-loot-generator.test.ts:30:    otherLootTableId: "material-entry",
tests/unit/items/other-loot-generator.test.ts:41:function consumable(overrides: Partial<OtherLootCandidate> = {}): OtherLootCandidate {
tests/unit/items/other-loot-generator.test.ts:43:    otherLootTableId: "consumable-entry",
tests/unit/items/other-loot-generator.test.ts:54:describe("Other Loot generator", () => {
tests/unit/items/other-loot-generator.test.ts:56:    expect(generateOtherLoot(
tests/unit/items/other-loot-generator.test.ts:58:      new SequenceRandomSource([701], [])
tests/unit/items/other-loot-generator.test.ts:60:    expect(generateOtherLoot(
tests/unit/items/other-loot-generator.test.ts:62:      new SequenceRandomSource([700], [])
tests/unit/items/other-loot-generator.test.ts:65:      otherLootTableId: "material-entry",
tests/unit/items/other-loot-generator.test.ts:72:    expect(generateOtherLoot(
tests/unit/items/other-loot-generator.test.ts:74:      new SequenceRandomSource([901], [])
tests/unit/items/other-loot-generator.test.ts:76:    expect(generateOtherLoot(
tests/unit/items/other-loot-generator.test.ts:78:      new SequenceRandomSource([900], [])
tests/unit/items/other-loot-generator.test.ts:84:    expect(generateOtherLoot(
tests/unit/items/other-loot-generator.test.ts:86:      new SequenceRandomSource([1], [1n, 2n])
tests/unit/items/other-loot-generator.test.ts:88:    expect(generateOtherLoot(
tests/unit/items/other-loot-generator.test.ts:90:      new SequenceRandomSource([1], [5n, 3n])
tests/unit/items/other-loot-generator.test.ts:95:    expect(generateOtherLoot(
tests/unit/items/other-loot-generator.test.ts:97:      new SequenceRandomSource([1], [5n])
tests/unit/items/other-loot-generator.test.ts:100:      otherLootTableId: "material-entry",
tests/unit/items/other-loot-generator.test.ts:104:    expect(generateOtherLoot(
tests/unit/items/other-loot-generator.test.ts:106:      new SequenceRandomSource([1], [3n])
tests/unit/items/other-loot-generator.test.ts:109:      otherLootTableId: "consumable-entry",
tests/unit/items/other-loot-generator.test.ts:116:    expect(generateOtherLoot(
tests/unit/items/other-loot-generator.test.ts:118:      new SequenceRandomSource([1], [2n])
tests/unit/items/other-loot-generator.test.ts:120:    expect(generateOtherLoot(
tests/unit/items/other-loot-generator.test.ts:122:      new SequenceRandomSource([1], [5n])
tests/unit/items/other-loot-generator.test.ts:127:    const random = new SequenceRandomSource([1], []);
tests/unit/items/other-loot-generator.test.ts:128:    expect(generateOtherLoot(
tests/unit/items/other-loot-generator.test.ts:136:    const random = new SequenceRandomSource([701], [999n]);
tests/unit/items/other-loot-generator.test.ts:137:    expect(generateOtherLoot(
tests/unit/items/other-loot-generator.test.ts:145:    expect(() => generateOtherLoot(
tests/unit/items/other-loot-generator.test.ts:147:      new SequenceRandomSource([1], [])
tests/unit/items/other-loot-generator.test.ts:148:    )).toThrow("Other Loot roll succeeded but no eligible entry exists.");
tests/unit/items/other-loot-generator.test.ts:152:    expect(() => generateOtherLoot(
tests/unit/items/other-loot-generator.test.ts:154:      new SequenceRandomSource([1], [])
tests/unit/items/other-loot-generator.test.ts:156:    expect(() => generateOtherLoot(
tests/unit/items/other-loot-generator.test.ts:158:      new SequenceRandomSource([1], [])
tests/unit/items/other-loot-generator.test.ts:160:    expect(() => generateOtherLoot(
tests/unit/items/other-loot-generator.test.ts:162:      new SequenceRandomSource([1], [])
tests/unit/items/other-loot-generator.test.ts:168:    const first = generateOtherLoot(input, new SequenceRandomSource([1], [2n, 3n]));
tests/unit/items/other-loot-generator.test.ts:169:    const second = generateOtherLoot(input, new SequenceRandomSource([1], [2n, 3n]));
tests/unit/items/postgres-loot-catalog.test.ts:3:import { loadLootCatalog } from "../../../src/modules/items/infrastructure/postgres-loot-catalog.js";
tests/unit/items/postgres-loot-catalog.test.ts:16:  item_base_id: "00000000-0000-0000-0000-000000000001",
tests/unit/items/postgres-loot-catalog.test.ts:20:  base_item_score: "100",
tests/unit/items/postgres-loot-catalog.test.ts:29:describe("PostgreSQL Loot Catalog", () => {
tests/unit/items/postgres-loot-catalog.test.ts:30:  it("maps regular bases, Affixes, Other Loot, special Items and coefficients", async () => {
tests/unit/items/postgres-loot-catalog.test.ts:34:        item_base_id: regular.item_base_id,
tests/unit/items/postgres-loot-catalog.test.ts:40:        other_loot_table_id: "00000000-0000-0000-0000-000000000003",
tests/unit/items/postgres-loot-catalog.test.ts:53:        item_base_id: regular.item_base_id, stat_position: 1,
tests/unit/items/postgres-loot-catalog.test.ts:59:    const catalog = await loadLootCatalog(client as any, {
tests/unit/items/postgres-loot-catalog.test.ts:66:      itemBaseId: regular.item_base_id,
tests/unit/items/postgres-loot-catalog.test.ts:75:    expect(catalog.otherLootCandidates[0]).toMatchObject({
tests/unit/items/postgres-loot-catalog.test.ts:89:    const catalog = await loadLootCatalog(client as any, {
tests/unit/items/postgres-loot-catalog.test.ts:101:    await expect(loadLootCatalog(client as any, {
tests/unit/items/postgres-loot-catalog.test.ts:108:    await expect(loadLootCatalog(client as any, {
tests/unit/items/postgres-loot-lock.test.ts:3:import { lockLootCharacterState, type LootLockQueryable } from "../../../src/modules/items/infrastructure/postgres-loot-lock.js";
tests/unit/items/postgres-loot-lock.test.ts:9:describe("PostgreSQL loot locking", () => {
tests/unit/items/postgres-loot-lock.test.ts:16:    const locked = await lockLootCharacterState({ query } as unknown as LootLockQueryable, "character-1");
tests/unit/items/postgres-loot-lock.test.ts:32:    await expect(lockLootCharacterState({ query } as unknown as LootLockQueryable, "missing"))
tests/unit/items/postgres-loot-lock.test.ts:33:      .rejects.toThrow("Active loot character was not found.");
tests/unit/items/postgres-loot-lock.test.ts:48:      lockLootCharacterState(
tests/unit/items/postgres-loot-lock.test.ts:49:        { query } as unknown as LootLockQueryable,
tests/unit/items/postgres-loot-lock.test.ts:71:      lockLootCharacterState(
tests/unit/items/postgres-loot-lock.test.ts:72:        { query } as unknown as LootLockQueryable,
tests/unit/items/postgres-loot-persistence.test.ts:3:  applyOtherLootReward,
tests/unit/items/postgres-loot-persistence.test.ts:4:  persistRegularLootItem,
tests/unit/items/postgres-loot-persistence.test.ts:5:  persistSpecialLootItem,
tests/unit/items/postgres-loot-persistence.test.ts:7:} from "../../../src/modules/items/infrastructure/postgres-loot-persistence.js";
tests/unit/items/postgres-loot-persistence.test.ts:22:describe("PostgreSQL loot persistence", () => {
tests/unit/items/postgres-loot-persistence.test.ts:25:    const result = await persistRegularLootItem(db as never, {
tests/unit/items/postgres-loot-persistence.test.ts:28:        requiredLevel: 10, rarity: "Rare", itemScore: 50n, fixedStats: [],
tests/unit/items/postgres-loot-persistence.test.ts:38:  it("persists a Special Item with NULL rarity and all fixed stats", async () => {
tests/unit/items/postgres-loot-persistence.test.ts:40:    await persistSpecialLootItem(db as never, {
tests/unit/items/postgres-loot-persistence.test.ts:43:        requiredLevel: 20, rarity: null, itemScore: 200n, affixes: [],
tests/unit/items/postgres-loot-persistence.test.ts:55:    await applyOtherLootReward(db as never, { characterId: "c", reward: {
tests/unit/items/postgres-loot-persistence.test.ts:56:      kind: "Material", otherLootTableId: "o1", materialId: "m1", quantity: 2n } });
tests/unit/items/postgres-loot-persistence.test.ts:57:    await applyOtherLootReward(db as never, { characterId: "c", reward: {
tests/unit/items/postgres-loot-persistence.test.ts:58:      kind: "Consumable", otherLootTableId: "o2", consumableDefinitionId: "x1", quantity: 3n } });
tests/unit/items/postgres-loot-transaction.test.ts:2:import { createPostgresLootSettlementTransaction } from "../../../src/modules/items/infrastructure/postgres-loot-transaction.js";
tests/unit/items/postgres-loot-transaction.test.ts:18:    if (normalized.includes("SELECT position") && normalized.includes("inventory_items")) {
tests/unit/items/postgres-loot-transaction.test.ts:21:    if (normalized.includes("INSERT INTO unique_pity_tracking")) return { rows: [] };
tests/unit/items/postgres-loot-transaction.test.ts:25:    if (normalized.includes("UPDATE unique_pity_tracking")) return { rows: [] };
tests/unit/items/postgres-loot-transaction.test.ts:31:describe("shared PostgreSQL loot transaction", () => {
tests/unit/items/postgres-loot-transaction.test.ts:34:    const transaction = await createPostgresLootSettlementTransaction(
tests/unit/items/postgres-loot-transaction.test.ts:56:    const transaction = await createPostgresLootSettlementTransaction(
tests/unit/items/postgres-loot-transaction.test.ts:69:      "Loot persistence Character ID must match the locked Character."
tests/unit/items/postgres-loot.repository.test.ts:2:import { PostgresLootRepository } from "../../../src/modules/items/infrastructure/postgres-loot.repository.js";
tests/unit/items/postgres-loot.repository.test.ts:29:    if (normalized.includes("SELECT position") && normalized.includes("inventory_items")) {
tests/unit/items/postgres-loot.repository.test.ts:32:    if (normalized.includes("INSERT INTO unique_pity_tracking")) {
tests/unit/items/postgres-loot.repository.test.ts:40:    if (options.failCatalog && normalized.includes("FROM loot_tables")) {
tests/unit/items/postgres-loot.repository.test.ts:43:    if (normalized.includes("FROM loot_tables")) return { rows: [] };
tests/unit/items/postgres-loot.repository.test.ts:44:    if (normalized.includes("FROM other_loot_tables")) return { rows: [] };
tests/unit/items/postgres-loot.repository.test.ts:46:    if (normalized.includes("FROM item_score_coefficients")) {
tests/unit/items/postgres-loot.repository.test.ts:61:    if (normalized.includes("UPDATE unique_pity_tracking")) return { rows: [] };
tests/unit/items/postgres-loot.repository.test.ts:71:describe("PostgresLootRepository", () => {
tests/unit/items/postgres-loot.repository.test.ts:74:    const repository = new PostgresLootRepository(db.pool as never);
tests/unit/items/postgres-loot.repository.test.ts:76:    const result = await repository.withSettlementTransaction(
tests/unit/items/postgres-loot.repository.test.ts:101:  it("rolls back and releases the client when settlement work fails", async () => {
tests/unit/items/postgres-loot.repository.test.ts:103:    const repository = new PostgresLootRepository(db.pool as never);
tests/unit/items/postgres-loot.repository.test.ts:105:    await expect(repository.withSettlementTransaction(
tests/unit/items/postgres-loot.repository.test.ts:117:    const repository = new PostgresLootRepository(db.pool as never);
tests/unit/items/postgres-loot.repository.test.ts:119:    await expect(repository.withSettlementTransaction(
tests/unit/items/postgres-loot.repository.test.ts:126:      "Loot catalog context must match the settlement transaction."
tests/unit/items/postgres-loot.repository.test.ts:133:    const repository = new PostgresLootRepository(db.pool as never);
tests/unit/items/postgres-loot.repository.test.ts:135:    await expect(repository.withSettlementTransaction(
tests/unit/items/postgres-loot.repository.test.ts:142:      "Loot persistence Character ID must match the locked Character."
tests/unit/items/postgres-loot.repository.test.ts:149:    const repository = new PostgresLootRepository(db.pool as never);
tests/unit/items/postgres-loot.repository.test.ts:151:    await expect(repository.withSettlementTransaction(
tests/unit/items/special-item-generator.test.ts:2:import type { RandomSource } from "../../../src/modules/combat/ports/random-source.js";
tests/unit/items/special-item-generator.test.ts:12:class SequenceRandomSource implements RandomSource {
tests/unit/items/special-item-generator.test.ts:71:    const random = new SequenceRandomSource([], []);
tests/unit/items/special-item-generator.test.ts:78:    expect(generateSpecialItemReward(input(), new SequenceRandomSource([2], [])))
tests/unit/items/special-item-generator.test.ts:83:    expect(generateSpecialItemReward(input({ pity: { eligibleKillCount: 99, chancePerMille: 100 } }), new SequenceRandomSource([101], [])))
tests/unit/items/special-item-generator.test.ts:88:    const result = generateSpecialItemReward(input(), new SequenceRandomSource([1], [7n]));
tests/unit/items/special-item-generator.test.ts:104:    const result = generateSpecialItemReward(input({ candidates: [set] }), new SequenceRandomSource([1], [5n]));
tests/unit/items/special-item-generator.test.ts:116:    expect(generateSpecialItemReward(input({ candidates }), new SequenceRandomSource([], []))?.outcome)
tests/unit/items/special-item-generator.test.ts:123:      new SequenceRandomSource([1], [5n])
tests/unit/items/special-item-generator.test.ts:131:    expect(generateSpecialItemReward(input({ candidates: [first, last] }), new SequenceRandomSource([1], [1n, 5n])).selectedCategory).toBe("Unique");
tests/unit/items/special-item-generator.test.ts:132:    expect(generateSpecialItemReward(input({ candidates: [first, last] }), new SequenceRandomSource([1], [5n, 5n])).selectedCategory).toBe("Set");
tests/unit/items/special-item-generator.test.ts:136:    expect(() => generateSpecialItemReward(input({ pity: { eligibleKillCount: 1, chancePerMille: 1 } }), new SequenceRandomSource([], [])))
tests/unit/items/special-item-generator.test.ts:138:    expect(() => generateSpecialItemReward(input({ candidates: [candidate({ monsterFamilyId: "family-1" })] }), new SequenceRandomSource([], [])))
tests/unit/items/special-item-generator.test.ts:143:    const first = generateSpecialItemReward(input(), new SequenceRandomSource([1], [8n]));
tests/unit/items/special-item-generator.test.ts:144:    const second = generateSpecialItemReward(input(), new SequenceRandomSource([1], [8n]));
tests/unit/progression/defeat-settlement.test.ts:8:  CombatSettlementContext,
tests/unit/progression/defeat-settlement.test.ts:18:  planDefeatSettlement,
tests/unit/progression/defeat-settlement.test.ts:19:} from "../../../src/modules/progression/domain/defeat-settlement.js";
tests/unit/progression/defeat-settlement.test.ts:22:CombatSettlementContext {
tests/unit/progression/defeat-settlement.test.ts:81:      lootLevelBonus: 0,
tests/unit/progression/defeat-settlement.test.ts:111:  "M6 Defeat settlement plan",
tests/unit/progression/defeat-settlement.test.ts:117:          planDefeatSettlement(
tests/unit/progression/defeat-settlement.test.ts:164:          planDefeatSettlement(
tests/unit/progression/defeat-settlement.test.ts:201:          planDefeatSettlement(
tests/unit/progression/defeat-settlement.test.ts:221:          planDefeatSettlement(
tests/unit/progression/defeat-settlement.test.ts:243:          planDefeatSettlement(
tests/unit/progression/defeat-settlement.test.ts:259:          planDefeatSettlement(
tests/unit/progression/defeat-settlement.test.ts:281:          planDefeatSettlement(
tests/unit/progression/gold-roll.test.ts:9:  RandomSource,
tests/unit/progression/gold-roll.test.ts:20:    const randomSource: RandomSource = {
tests/unit/progression/gold-roll.test.ts:29:        randomSource
tests/unit/progression/gold-roll.test.ts:34:      randomSource.nextInt
tests/unit/progression/gold-roll.test.ts:39:    const randomSource: RandomSource = {
tests/unit/progression/gold-roll.test.ts:48:        randomSource
tests/unit/progression/gold-roll.test.ts:53:      randomSource.nextInt
tests/unit/progression/gold-roll.test.ts:61:    const randomSource: RandomSource = {
tests/unit/progression/gold-roll.test.ts:75:        randomSource
tests/unit/progression/gold-roll.test.ts:88:    const randomSource: RandomSource = {
tests/unit/progression/gold-roll.test.ts:98:        randomSource
tests/unit/progression/gold-roll.test.ts:101:      "RandomSource without nextBigInt cannot roll this Gold range."
tests/unit/progression/gold-roll.test.ts:106:    const randomSource: RandomSource = {
tests/unit/progression/gold-roll.test.ts:115:        randomSource
tests/unit/progression/gold-roll.test.ts:125:        randomSource
tests/unit/progression/gold-roll.test.ts:131:    const randomSource: RandomSource = {
tests/unit/progression/gold-roll.test.ts:140:        randomSource
tests/unit/progression/victory-rewards.test.ts:13:  RandomSource,
tests/unit/progression/victory-rewards.test.ts:16:function createRandomSource(
tests/unit/progression/victory-rewards.test.ts:18:): RandomSource {
tests/unit/progression/victory-rewards.test.ts:29:    const randomSource =
tests/unit/progression/victory-rewards.test.ts:30:      createRandomSource(10);
tests/unit/progression/victory-rewards.test.ts:36:        randomSource
tests/unit/progression/victory-rewards.test.ts:41:      randomSource.nextInt
tests/unit/progression/victory-rewards.test.ts:50:        createRandomSource(20)
tests/unit/progression/victory-rewards.test.ts:60:        createRandomSource(15)
tests/unit/progression/victory-rewards.test.ts:75:        createRandomSource(15)
tests/unit/progression/victory-rewards.test.ts:99:        createRandomSource(0)
tests/unit/progression/victory-rewards.test.ts:113:        createRandomSource(15)
tests/unit/progression/victory-rewards.test.ts:126:        createRandomSource(0)
tests/unit/progression/victory-rewards.test.ts:138:        createRandomSource(21)
tests/unit/progression/victory-rewards.test.ts:144:    const randomSource =
tests/unit/progression/victory-rewards.test.ts:145:      createRandomSource(12);
tests/unit/progression/victory-rewards.test.ts:155:      randomSource
tests/unit/progression/victory-rewards.test.ts:159:      randomSource.nextInt
tests/unit/progression/victory-settlement.test.ts:13:  CombatSettlementContext,
tests/unit/progression/victory-settlement.test.ts:23:  RandomSource,
tests/unit/progression/victory-settlement.test.ts:26:  planVictorySettlement,
tests/unit/progression/victory-settlement.test.ts:27:} from "../../../src/modules/progression/domain/victory-settlement.js";
tests/unit/progression/victory-settlement.test.ts:65:CombatSettlementContext {
tests/unit/progression/victory-settlement.test.ts:116:      lootLevelBonus: 0,
tests/unit/progression/victory-settlement.test.ts:144:describe("M6 Victory settlement plan", () => {
tests/unit/progression/victory-settlement.test.ts:146:    const randomSource: RandomSource = {
tests/unit/progression/victory-settlement.test.ts:152:      planVictorySettlement(
tests/unit/progression/victory-settlement.test.ts:157:        randomSource
tests/unit/progression/victory-settlement.test.ts:197:      randomSource.nextInt
tests/unit/progression/victory-settlement.test.ts:210:    const randomSource: RandomSource = {
tests/unit/progression/victory-settlement.test.ts:216:      planVictorySettlement(
tests/unit/progression/victory-settlement.test.ts:221:        randomSource
tests/unit/progression/victory-settlement.test.ts:234:      randomSource.nextInt
tests/unit/progression/victory-settlement.test.ts:245:      planVictorySettlement(
tests/unit/progression/victory-settlement.test.ts:256:      "Settlement monster does not match combat session."
tests/unit/progression/victory-settlement.test.ts:267:      planVictorySettlement(
tests/unit/progression/victory-settlement.test.ts:307:      planVictorySettlement(
tests/unit/progression/victory-settlement.test.ts:337:      planVictorySettlement(
tests/unit/progression/victory-settlement.test.ts:378:      planVictorySettlement(
tests/unit/progression/victory-settlement.test.ts:423:      planVictorySettlement(
tests/unit/progression/victory-settlement.test.ts:451:      planVictorySettlement(
tests/unit/progression/victory-settlement.test.ts:473:      planVictorySettlement(
```

