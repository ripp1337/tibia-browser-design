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
