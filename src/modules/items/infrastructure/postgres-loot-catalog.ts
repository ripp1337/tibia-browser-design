import type { PoolClient } from "pg";
import type {
  LootCatalogSnapshot,
  LootGenerationContext,
} from "../application/loot.repository.js";
import {
  EQUIPMENT_SLOT,
  ITEM_SCORE_COMPONENT,
  ITEM_STAT_TYPE,
} from "../domain/item-generation.constants.js";
import type {
  AffixGenerationTemplate,
  CompleteRegularItemBaseCandidate,
  EquipmentSlot,
  FixedStatGenerationRange,
  ItemScoreCoefficients,
  ItemScoreComponent,
  ItemStatType,
  ItemStatValues,
  OtherLootCandidate,
  SpecialItemCandidate,
} from "../domain/item-generation.types.js";

export type LootCatalogQueryable = Pick<PoolClient, "query">;

type RegularBaseRow = {
  item_base_id: string;
  item_level: number;
  slot: string;
  selection_weight: string;
  base_item_score: string;
  attack: string;
  defense: string;
  spell_power: string;
  health: string;
  mana: string;
  energy: string;
  gold_percent: number;
  experience_percent: number;
};

type AffixRow = {
  item_base_id: string;
  affix_template_id: string;
  affix_type: string;
  required_item_level: number;
  min_value: string;
  max_value: string;
  selection_weight: string;
};

type OtherLootRow = {
  other_loot_table_id: string;
  material_id: string | null;
  consumable_definition_id: string | null;
  min_quantity: number;
  max_quantity: number;
  selection_weight: string;
  is_enabled: boolean;
};

type SpecialBaseRow = RegularBaseRow & {
  special_item_source_id: string;
  monster_id: string | null;
  monster_family_id: string | null;
  is_unique: boolean;
  is_set: boolean;
  is_boss_exclusive: boolean;
  is_enabled: boolean;
};

type FixedStatRow = {
  item_base_id: string;
  stat_position: number;
  stat_type: string;
  min_value: string;
  max_value: string;
};

type CoefficientRow = {
  score_component: string;
  coefficient: string;
};

const equipmentSlots = new Set<string>(Object.values(EQUIPMENT_SLOT));
const statTypes = new Set<string>(Object.values(ITEM_STAT_TYPE));
const scoreComponents = new Set<string>(Object.values(ITEM_SCORE_COMPONENT));

function requiredId(value: string, field: string): string {
  if (value.length === 0) throw new Error(`${field} cannot be empty.`);
  return value;
}

function integer(value: string | number, minimum: number, field: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum) {
    throw new Error(`${field} must be a safe integer greater than or equal to ${minimum}.`);
  }
  return parsed;
}

function bigint(value: string | number, minimum: bigint, field: string): bigint {
  let parsed: bigint;
  try { parsed = BigInt(value); } catch { throw new Error(`${field} must be an integer.`); }
  if (parsed < minimum) throw new Error(`${field} must be at least ${minimum}.`);
  return parsed;
}

function slot(value: string): EquipmentSlot {
  if (!equipmentSlots.has(value)) throw new Error(`Unsupported Equipment Slot: ${value}.`);
  return value as EquipmentSlot;
}

function statType(value: string): ItemStatType {
  if (!statTypes.has(value)) throw new Error(`Unsupported Item Stat Type: ${value}.`);
  return value as ItemStatType;
}

function scoreComponent(value: string): ItemScoreComponent {
  if (!scoreComponents.has(value)) throw new Error(`Unsupported Item Score component: ${value}.`);
  return value as ItemScoreComponent;
}

function baseStats(row: RegularBaseRow): ItemStatValues {
  return {
    Attack: bigint(row.attack, 0n, "attack"),
    Defense: bigint(row.defense, 0n, "defense"),
    SpellPower: bigint(row.spell_power, 0n, "spell_power"),
    Health: bigint(row.health, 0n, "health"),
    Mana: bigint(row.mana, 0n, "mana"),
    Energy: bigint(row.energy, 0n, "energy"),
    GoldPercent: BigInt(integer(row.gold_percent, 0, "gold_percent")),
    ExperiencePercent: BigInt(integer(row.experience_percent, 0, "experience_percent")),
  };
}

export async function loadLootCatalog(
  client: LootCatalogQueryable,
  context: LootGenerationContext
): Promise<LootCatalogSnapshot> {
  requiredId(context.characterId, "Character ID");
  requiredId(context.monsterId, "Monster ID");

  const regularResult = await client.query<RegularBaseRow>(`
    SELECT ib.item_base_id, ib.item_level, ib.slot,
      lt.selection_weight, ib.base_item_score,
      ib.attack, ib.defense, ib.spell_power, ib.health,
      ib.mana, ib.energy, ib.gold_percent, ib.experience_percent
    FROM loot_tables AS lt
    INNER JOIN item_bases AS ib ON ib.item_base_id = lt.item_base_id
    WHERE lt.monster_id = $1 AND lt.is_enabled = TRUE
      AND ib.is_unique = FALSE AND ib.is_set = FALSE
    ORDER BY ib.item_base_id
  `, [context.monsterId]);

  const regularIds = regularResult.rows.map((row) => row.item_base_id);
  const affixResult = regularIds.length === 0
    ? { rows: [] as AffixRow[] }
    : await client.query<AffixRow>(`
        SELECT ibaw.item_base_id, at.affix_template_id, at.affix_type,
          at.required_item_level, at.min_value, at.max_value,
          ibaw.selection_weight
        FROM item_base_affix_weights AS ibaw
        INNER JOIN affix_templates AS at
          ON at.affix_template_id = ibaw.affix_template_id
        WHERE ibaw.item_base_id = ANY($1::uuid[])
        ORDER BY ibaw.item_base_id, at.affix_template_id
      `, [regularIds]);

  const affixesByBase = new Map<string, Array<{ value: AffixGenerationTemplate; selectionWeight: bigint }>>();
  for (const row of affixResult.rows) {
    const entries = affixesByBase.get(row.item_base_id) ?? [];
    entries.push({
      value: {
        affixTemplateId: requiredId(row.affix_template_id, "Affix Template ID"),
        statType: statType(row.affix_type),
        minimumValue: bigint(row.min_value, 0n, "Affix minimum value"),
        maximumValue: bigint(row.max_value, 0n, "Affix maximum value"),
        requiredItemLevel: integer(row.required_item_level, 1, "Affix required Item Level"),
        isEnabled: true,
      },
      selectionWeight: bigint(row.selection_weight, 1n, "Affix selection weight"),
    });
    affixesByBase.set(row.item_base_id, entries);
  }

  const regularItemBases: CompleteRegularItemBaseCandidate[] = regularResult.rows.map((row) => ({
    itemBaseId: requiredId(row.item_base_id, "Item Base ID"),
    itemLevel: integer(row.item_level, 1, "Item Base Item Level"),
    slot: slot(row.slot),
    selectionWeight: bigint(row.selection_weight, 1n, "Item Base selection weight"),
    isEnabled: true,
    isUnique: false,
    isSet: false,
    baseItemScore: bigint(row.base_item_score, 0n, "Base Item Score"),
    baseStats: baseStats(row),
    affixPool: affixesByBase.get(row.item_base_id) ?? [],
  }));

  const otherResult = await client.query<OtherLootRow>(`
    SELECT other_loot_table_id, material_id, consumable_definition_id,
      min_quantity, max_quantity, selection_weight, is_enabled
    FROM other_loot_tables
    WHERE monster_id = $1 AND is_enabled = TRUE
    ORDER BY other_loot_table_id
  `, [context.monsterId]);
  const otherLootCandidates: OtherLootCandidate[] = otherResult.rows.map((row) => ({
    otherLootTableId: requiredId(row.other_loot_table_id, "Other Loot Table ID"),
    materialId: row.material_id,
    consumableDefinitionId: row.consumable_definition_id,
    minimumQuantity: BigInt(integer(row.min_quantity, 1, "Other Loot minimum quantity")),
    maximumQuantity: BigInt(integer(row.max_quantity, 1, "Other Loot maximum quantity")),
    selectionWeight: bigint(row.selection_weight, 1n, "Other Loot selection weight"),
    isEnabled: row.is_enabled,
  }));

  const specialResult = await client.query<SpecialBaseRow>(`
    SELECT sis.special_item_source_id, sis.monster_id,
      sis.monster_family_id, sis.selection_weight, sis.is_enabled,
      ib.item_base_id, ib.item_level, ib.slot, ib.base_item_score,
      ib.attack, ib.defense, ib.spell_power, ib.health,
      ib.mana, ib.energy, ib.gold_percent, ib.experience_percent,
      ib.is_unique, ib.is_set, ib.is_boss_exclusive
    FROM special_item_sources AS sis
    INNER JOIN item_bases AS ib ON ib.item_base_id = sis.item_base_id
    WHERE sis.is_enabled = TRUE
      AND (sis.monster_id = $1 OR sis.monster_family_id = $2)
    ORDER BY sis.special_item_source_id
  `, [context.monsterId, context.monsterFamilyId]);

  const specialIds = specialResult.rows.map((row) => row.item_base_id);
  const fixedResult = specialIds.length === 0
    ? { rows: [] as FixedStatRow[] }
    : await client.query<FixedStatRow>(`
        SELECT item_base_id, stat_position, stat_type, min_value, max_value
        FROM item_base_fixed_stat_ranges
        WHERE item_base_id = ANY($1::uuid[])
        ORDER BY item_base_id, stat_position
      `, [specialIds]);
  const fixedByBase = new Map<string, FixedStatGenerationRange[]>();
  for (const row of fixedResult.rows) {
    const ranges = fixedByBase.get(row.item_base_id) ?? [];
    ranges.push({
      statPosition: integer(row.stat_position, 1, "Fixed stat position"),
      statType: statType(row.stat_type),
      minimumValue: bigint(row.min_value, 0n, "Fixed stat minimum value"),
      maximumValue: bigint(row.max_value, 0n, "Fixed stat maximum value"),
    });
    fixedByBase.set(row.item_base_id, ranges);
  }

  const specialItemCandidates: SpecialItemCandidate[] = specialResult.rows.map((row) => {
    if (row.is_unique === row.is_set) throw new Error("Special Item Base must be exactly Unique or Set.");
    return {
      specialItemSourceId: requiredId(row.special_item_source_id, "Special Item Source ID"),
      monsterId: row.monster_id,
      monsterFamilyId: row.monster_family_id,
      selectionWeight: bigint(row.selection_weight, 1n, "Special Item selection weight"),
      isEnabled: row.is_enabled,
      category: row.is_unique ? "Unique" : "Set",
      isBossExclusive: row.is_boss_exclusive,
      progressionEligible: true,
      base: {
        itemBaseId: requiredId(row.item_base_id, "Special Item Base ID"),
        itemLevel: integer(row.item_level, 1, "Special Item Base Item Level"),
        baseItemScore: bigint(row.base_item_score, 0n, "Special Base Item Score"),
        baseStats: baseStats(row),
      },
      fixedStatRanges: fixedByBase.get(row.item_base_id) ?? [],
    };
  });

  const coefficientResult = await client.query<CoefficientRow>(`
    SELECT score_component, coefficient
    FROM item_score_coefficients
    ORDER BY score_component
  `);
  const coefficients = {} as ItemScoreCoefficients;
  for (const row of coefficientResult.rows) {
    const component = scoreComponent(row.score_component);
    if (component in coefficients) throw new Error(`Duplicate Item Score component: ${component}.`);
    coefficients[component] = bigint(row.coefficient, 0n, "Item Score coefficient");
  }
  for (const component of scoreComponents) {
    if (!(component in coefficients)) throw new Error(`Missing Item Score component: ${component}.`);
  }

  return {
    regularItemBases,
    otherLootCandidates,
    specialItemCandidates,
    itemScoreCoefficients: coefficients,
  };
}