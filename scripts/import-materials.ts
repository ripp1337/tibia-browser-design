import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";
import type { PoolClient } from "pg";
import { databasePool } from "../src/database/pool.js";

const EXPECTED_HEADERS = [
  "name",
  "description",
  "artwork",
  "material_level",
  "vendor_available",
  "vendor_price",
  "is_gatherable",
  "is_lootable",
  "is_crafting_ingredient",
  "required_gathering_level",
  "minimum_monster_level",
  "max_stack_size",
  "code"
] as const;

type ExpectedHeader = (typeof EXPECTED_HEADERS)[number];
type CsvRow = Record<ExpectedHeader, string>;

interface MaterialInput {
  code: string;
  name: string;
  description: string;
  artwork: string | null;
  materialLevel: number;
  vendorAvailable: boolean;
  vendorPrice: number | null;
  isGatherable: boolean;
  isLootable: boolean;
  isCraftingIngredient: boolean;
  requiredGatheringLevel: number;
  minimumMonsterLevel: number | null;
  maxStackSize: number;
}

interface ExistingMaterial {
  code: string;
  name: string;
  description: string;
  artwork: string | null;
  material_level: number;
  vendor_available: boolean;
  vendor_price: string | null;
  is_gatherable: boolean;
  is_lootable: boolean;
  is_crafting_ingredient: boolean;
  required_gathering_level: number;
  minimum_monster_level: number | null;
  max_stack_size: number;
}

interface ImportSummary {
  inserted: number;
  updated: number;
  unchanged: number;
  total: number;
  dryRun: boolean;
}

class ValidationError extends Error {
  constructor(public readonly problems: string[]) {
    super(`Materials CSV validation failed with ${problems.length} problem(s).`);
    this.name = "ValidationError";
  }
}

function parseArguments(): { dryRun: boolean; csvPath: string } {
  const args = process.argv.slice(2);
  let dryRun = false;
  let csvPath = "game-data/csv/materials.csv";

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === "--dry-run") {
      dryRun = true;
      continue;
    }

    if (argument === "--file") {
      const value = args[index + 1];
      if (!value) {
        throw new Error("--file requires a path.");
      }
      csvPath = value;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${argument}`);
  }

  return { dryRun, csvPath };
}

function parseBoolean(value: string, rowNumber: number, column: string): boolean {
  const normalized = value.trim().toLowerCase();

  if (normalized === "true") return true;
  if (normalized === "false") return false;

  throw new Error(`${column} must be TRUE or FALSE, received "${value}".`);
}

function parseInteger(
  value: string,
  rowNumber: number,
  column: string,
  options: { nullable?: boolean; min?: number; max?: number } = {}
): number | null {
  const normalized = value.trim();

  if (normalized === "") {
    if (options.nullable) return null;
    throw new Error(`${column} is required.`);
  }

  if (!/^-?\d+$/.test(normalized)) {
    throw new Error(`${column} must be an integer, received "${value}".`);
  }

  const parsed = Number(normalized);

  if (!Number.isSafeInteger(parsed)) {
    throw new Error(`${column} is outside the safe integer range.`);
  }

  if (options.min !== undefined && parsed < options.min) {
    throw new Error(`${column} must be at least ${options.min}.`);
  }

  if (options.max !== undefined && parsed > options.max) {
    throw new Error(`${column} must be at most ${options.max}.`);
  }

  return parsed;
}

function requireText(value: string, column: string, maxLength?: number): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${column} is required.`);
  }

  if (maxLength !== undefined && normalized.length > maxLength) {
    throw new Error(`${column} must not exceed ${maxLength} characters.`);
  }

  return normalized;
}

function optionalText(value: string): string | null {
  const normalized = value.trim();
  return normalized === "" ? null : normalized;
}

function validateHeaders(actualHeaders: string[]): void {
  const expected = new Set<string>(EXPECTED_HEADERS);
  const actual = new Set(actualHeaders);
  const missing = EXPECTED_HEADERS.filter((header) => !actual.has(header));
  const unexpected = actualHeaders.filter((header) => !expected.has(header));
  const repeated = actualHeaders.filter(
    (header, index) => actualHeaders.indexOf(header) !== index
  );
  const problems: string[] = [];

  if (missing.length > 0) problems.push(`Missing headers: ${missing.join(", ")}`);
  if (unexpected.length > 0) {
    problems.push(`Unexpected headers: ${unexpected.join(", ")}`);
  }
  if (repeated.length > 0) {
    problems.push(`Duplicate headers: ${[...new Set(repeated)].join(", ")}`);
  }

  if (problems.length > 0) throw new ValidationError(problems);
}

function parseAndValidateMaterial(
  row: CsvRow,
  rowNumber: number
): MaterialInput {
  const code = requireText(row.code, "code", 64);

  if (!/^[a-z][a-z0-9_]{0,63}$/.test(code)) {
    throw new Error(
      "code must start with a lowercase letter and contain only lowercase letters, numbers, and underscores."
    );
  }

  const vendorAvailable = parseBoolean(
    row.vendor_available,
    rowNumber,
    "vendor_available"
  );
  const vendorPrice = parseInteger(row.vendor_price, rowNumber, "vendor_price", {
    nullable: true,
    min: 0
  });
  const isGatherable = parseBoolean(
    row.is_gatherable,
    rowNumber,
    "is_gatherable"
  );
  const isLootable = parseBoolean(row.is_lootable, rowNumber, "is_lootable");

  if (vendorAvailable && vendorPrice === null) {
    throw new Error("vendor_price is required when vendor_available is TRUE.");
  }

  if (!vendorAvailable && vendorPrice !== null) {
    throw new Error("vendor_price must be empty when vendor_available is FALSE.");
  }

  if (!vendorAvailable && !isGatherable && !isLootable) {
    throw new Error(
      "At least one source must be enabled: vendor_available, is_gatherable, or is_lootable."
    );
  }

  return {
    code,
    name: requireText(row.name, "name", 100),
    description: requireText(row.description, "description"),
    artwork: optionalText(row.artwork),
    materialLevel: parseInteger(
      row.material_level,
      rowNumber,
      "material_level",
      { min: 1 }
    ) as number,
    vendorAvailable,
    vendorPrice,
    isGatherable,
    isLootable,
    isCraftingIngredient: parseBoolean(
      row.is_crafting_ingredient,
      rowNumber,
      "is_crafting_ingredient"
    ),
    requiredGatheringLevel: parseInteger(
      row.required_gathering_level,
      rowNumber,
      "required_gathering_level",
      { min: 1 }
    ) as number,
    minimumMonsterLevel: parseInteger(
      row.minimum_monster_level,
      rowNumber,
      "minimum_monster_level",
      { nullable: true, min: 1 }
    ),
    maxStackSize: parseInteger(
      row.max_stack_size,
      rowNumber,
      "max_stack_size",
      { min: 1, max: 999 }
    ) as number
  };
}

async function loadMaterials(csvPath: string): Promise<MaterialInput[]> {
  const source = await readFile(csvPath, "utf8");
  let headers: string[] = [];
  let rawRows: CsvRow[];

  try {
    rawRows = parse(source, {
      bom: true,
      columns: (header: string[]) => {
        headers = header.map((value) => value.trim());
        return headers;
      },
      skip_empty_lines: true,
      trim: false,
      relax_column_count: false
    }) as CsvRow[];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new ValidationError([`CSV parsing error: ${message}`]);
  }

  validateHeaders(headers);

  if (rawRows.length === 0) {
    throw new ValidationError(["The CSV contains no material rows."]);
  }

  const problems: string[] = [];
  const materials: MaterialInput[] = [];
  const codes = new Map<string, number>();
  const names = new Map<string, number>();

  rawRows.forEach((rawRow, index) => {
    const rowNumber = index + 2;

    try {
      const material = parseAndValidateMaterial(rawRow, rowNumber);
      const normalizedName = material.name.toLowerCase();
      const previousCodeRow = codes.get(material.code);
      const previousNameRow = names.get(normalizedName);

      if (previousCodeRow !== undefined) {
        problems.push(
          `Row ${rowNumber}: duplicate code "${material.code}"; first used on row ${previousCodeRow}.`
        );
      } else {
        codes.set(material.code, rowNumber);
      }

      if (previousNameRow !== undefined) {
        problems.push(
          `Row ${rowNumber}: duplicate name "${material.name}"; first used on row ${previousNameRow}.`
        );
      } else {
        names.set(normalizedName, rowNumber);
      }

      materials.push(material);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      problems.push(`Row ${rowNumber}: ${message}`);
    }
  });

  if (problems.length > 0) throw new ValidationError(problems);
  return materials;
}

function materialChanged(
  existing: ExistingMaterial,
  incoming: MaterialInput
): boolean {
  return (
    existing.name !== incoming.name ||
    existing.description !== incoming.description ||
    existing.artwork !== incoming.artwork ||
    existing.material_level !== incoming.materialLevel ||
    existing.vendor_available !== incoming.vendorAvailable ||
    (existing.vendor_price === null ? null : Number(existing.vendor_price)) !==
      incoming.vendorPrice ||
    existing.is_gatherable !== incoming.isGatherable ||
    existing.is_lootable !== incoming.isLootable ||
    existing.is_crafting_ingredient !== incoming.isCraftingIngredient ||
    existing.required_gathering_level !== incoming.requiredGatheringLevel ||
    existing.minimum_monster_level !== incoming.minimumMonsterLevel ||
    existing.max_stack_size !== incoming.maxStackSize
  );
}

async function importMaterials(
  client: PoolClient,
  materials: MaterialInput[],
  dryRun: boolean
): Promise<ImportSummary> {
  const existingResult = await client.query<ExistingMaterial>(`
    SELECT
      code,
      name,
      description,
      artwork,
      material_level,
      vendor_available,
      vendor_price,
      is_gatherable,
      is_lootable,
      is_crafting_ingredient,
      required_gathering_level,
      minimum_monster_level,
      max_stack_size
    FROM materials
    FOR UPDATE;
  `);
  const existingByCode = new Map(
    existingResult.rows.map((row) => [row.code, row] as const)
  );
  const summary: ImportSummary = {
    inserted: 0,
    updated: 0,
    unchanged: 0,
    total: materials.length,
    dryRun
  };

  for (const material of materials) {
    const existing = existingByCode.get(material.code);

    if (!existing) {
      summary.inserted += 1;

      await client.query(
          `
            INSERT INTO materials (
              code,
              name,
              description,
              artwork,
              material_level,
              vendor_available,
              vendor_price,
              is_gatherable,
              is_lootable,
              is_crafting_ingredient,
              required_gathering_level,
              minimum_monster_level,
              max_stack_size
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);
          `,
          [
            material.code,
            material.name,
            material.description,
            material.artwork,
            material.materialLevel,
            material.vendorAvailable,
            material.vendorPrice,
            material.isGatherable,
            material.isLootable,
            material.isCraftingIngredient,
            material.requiredGatheringLevel,
            material.minimumMonsterLevel,
            material.maxStackSize
          ]
        );
      continue;
    }

    if (!materialChanged(existing, material)) {
      summary.unchanged += 1;
      continue;
    }

    summary.updated += 1;

    await client.query(
        `
          UPDATE materials
          SET
            name = $2,
            description = $3,
            artwork = $4,
            material_level = $5,
            vendor_available = $6,
            vendor_price = $7,
            is_gatherable = $8,
            is_lootable = $9,
            is_crafting_ingredient = $10,
            required_gathering_level = $11,
            minimum_monster_level = $12,
            max_stack_size = $13,
            updated_at = NOW()
          WHERE code = $1;
        `,
        [
          material.code,
          material.name,
          material.description,
          material.artwork,
          material.materialLevel,
          material.vendorAvailable,
          material.vendorPrice,
          material.isGatherable,
          material.isLootable,
          material.isCraftingIngredient,
          material.requiredGatheringLevel,
          material.minimumMonsterLevel,
          material.maxStackSize
        ]
      );
  }

  return summary;
}

function printSummary(summary: ImportSummary, csvPath: string): void {
  console.log("");
  console.log(summary.dryRun ? "Materials dry run completed." : "Materials import completed.");
  console.log(`File: ${csvPath}`);
  console.log(`Inserted: ${summary.inserted}`);
  console.log(`Updated: ${summary.updated}`);
  console.log(`Unchanged: ${summary.unchanged}`);
  console.log(`Total: ${summary.total}`);
}

async function main(): Promise<void> {
  const { dryRun, csvPath: requestedPath } = parseArguments();
  const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
  const projectRoot = path.resolve(scriptDirectory, "..");
  const csvPath = path.resolve(projectRoot, requestedPath);
  const materials = await loadMaterials(csvPath);
  const client = await databasePool.connect();

  try {
    await client.query("BEGIN");
    const summary = await importMaterials(client, materials, dryRun);

    if (dryRun) {
      await client.query("ROLLBACK");
    } else {
      await client.query("COMMIT");
    }

    printSummary(summary, path.relative(projectRoot, csvPath));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await databasePool.end();
  }
}

main().catch((error: unknown) => {
  console.error("Materials import failed.");

  if (error instanceof ValidationError) {
    for (const problem of error.problems) {
      console.error(`- ${problem}`);
    }
  } else if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }

  process.exitCode = 1;
});
