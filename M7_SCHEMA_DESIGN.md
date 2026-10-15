# M7 Final Schema Design

## Status

Final technical design for Phase P2. This document defines the target schema for migration 090. It does not create or apply the migration.

## Authority

1. `M7_APPROVED_DECISIONS.md`, D1-D24.
2. Verified PostgreSQL schema through migration 089.
3. `M7_SOURCE_AUDIT.md`.
4. This P2 technical design.

## Core design rules

- One migration: `090_item_loot_generation.sql`.
- Existing identifiers and stable content codes remain authoritative.
- Authored ranges, weights and generated rolls use whole integers.
- All selection weights are positive `BIGINT` values.
- Generated Item Score remains non-negative `BIGINT`.
- Regular, Other Loot and special-item pools remain separate.
- Unique and Set Items use fixed-stat definitions and generated fixed-stat rows, never `item_affixes`.

# 1. Existing table changes

## 1.1 `item_affixes`

Remove:

```sql
UNIQUE (item_id, affix_template_id)
```

Add:

```text
affix_position SMALLINT NOT NULL
roll_value BIGINT NOT NULL
UNIQUE (item_id, affix_position)
CHECK (affix_position BETWEEN 1 AND 4)
CHECK (roll_value >= 0)
```

Keep indexes on `item_id` and `affix_template_id`.

Existing rows receive deterministic positions with `ROW_NUMBER()` partitioned by `item_id`, ordered by `created_at`, then `item_affix_id`.

## 1.2 `affix_templates`

Convert:

```text
min_value NUMERIC(12,4) -> BIGINT
max_value NUMERIC(12,4) -> BIGINT
```

Retain:

```text
required_item_level INTEGER
UNIQUE (affix_type, tier)
```

Constraints:

```text
required_item_level >= 1
tier >= 1
min_value >= 0
max_value >= min_value
```

Migration must reject non-integral existing values before conversion. It must not silently round authored data.

## 1.3 `items`

Add:

```text
required_level INTEGER NOT NULL
```

Backfill existing rows from `item_level`.

Constraints:

```text
required_level >= 1
required_level = item_level
```

The generated Item row becomes the runtime authority for Required Level. Equipment queries must read `items.required_level`, not `item_bases.required_level`.

`item_bases.required_level` remains temporarily as legacy authored metadata for compatibility, but it has no authority over generated Items. Removal may occur in a later migration after all non-M7 consumers are migrated.

## 1.4 `item_bases`

Convert these fixed base-stat columns to `BIGINT`:

```text
attack
defense
spell_power
health
mana
energy
```

Convert these percentage columns to whole-point `INTEGER`:

```text
gold_percent
experience_percent
```

Retain:

```text
item_level
required_level
base_item_score
is_boss_exclusive
is_unique
is_set
unique_template_id
set_template_id
```

`item_level` remains the minimum qualification level for the base.

Migration must reject non-integral existing stat values before conversion.

## 1.5 `loot_tables`

Retain table identity and foreign keys.

Remove:

```text
drop_chance_percent
min_item_level
max_item_level
loot_level_modifier
```

Add:

```text
selection_weight BIGINT NOT NULL
```

Constraints:

```text
selection_weight > 0
UNIQUE (monster_id, item_base_id)
```

This table becomes only the regular Item Base pool for a Monster. Equipment success chance and Item Level are not stored per entry.

Existing `drop_chance_percent` values are migrated to exact relative integer weights by multiplying by 10,000 before conversion. Example: `1.2500` becomes `12500`. This preserves relative proportions and does not reinterpret an old percentage as a new absolute probability.

## 1.6 `other_loot_tables`

Remove:

```text
drop_chance_percent
```

Add:

```text
selection_weight BIGINT NOT NULL
```

Retain:

```text
monster_id
material_id
consumable_definition_id
min_quantity
max_quantity
is_enabled
```

Constraints:

```text
selection_weight > 0
exactly one target is non-null
min_quantity >= 1
max_quantity >= min_quantity
```

Add partial uniqueness:

```text
UNIQUE (monster_id, material_id) WHERE material_id IS NOT NULL
UNIQUE (monster_id, consumable_definition_id)
  WHERE consumable_definition_id IS NOT NULL
```

Existing chance values are converted to relative weights using the same multiply-by-10,000 rule.

## 1.7 `unique_pity_tracking`

Backfill zero or null-equivalent starting state to:

```text
eligible_kill_count = 0
current_chance_percent = 0.1
```

Change defaults and constraints:

```text
eligible_kill_count BIGINT NOT NULL DEFAULT 0
current_chance_percent NUMERIC(4,1) NOT NULL DEFAULT 0.1
CHECK (eligible_kill_count BETWEEN 0 AND 99)
CHECK (current_chance_percent BETWEEN 0.1 AND 10.0)
CHECK (
  current_chance_percent = LEAST(
    10.0,
    0.1 + eligible_kill_count * 0.1
  )
)
```

Reset state is `(0, 0.1)`. Each eligible failed roll increments the kill count by one, capped at 99. A persisted special Item resets both fields. `InventoryFull` does not reset them.

# 2. New authored-data tables

## 2.1 `item_base_affix_weights`

Purpose: authoritative weighted eligible Affix pool per regular Item Base.

```text
item_base_affix_weight_id UUID PRIMARY KEY
item_base_id UUID NOT NULL
 affix_template_id UUID NOT NULL
selection_weight BIGINT NOT NULL
created_at TIMESTAMPTZ NOT NULL
updated_at TIMESTAMPTZ NOT NULL
```

Constraints and behavior:

```text
FOREIGN KEY item_base_id -> item_bases ON DELETE CASCADE
FOREIGN KEY affix_template_id -> affix_templates ON DELETE RESTRICT
UNIQUE (item_base_id, affix_template_id)
CHECK (selection_weight > 0)
```

Indexes:

```text
(item_base_id)
(affix_template_id)
```

Importer validation must reject links to Unique or Set Item Bases.

## 2.2 `item_base_fixed_stat_ranges`

Purpose: fixed stat categories and authored roll ranges for each specific Unique or Set Item Base.

```text
item_base_fixed_stat_range_id UUID PRIMARY KEY
item_base_id UUID NOT NULL
stat_position SMALLINT NOT NULL
stat_type VARCHAR(32) NOT NULL
min_value BIGINT NOT NULL
max_value BIGINT NOT NULL
created_at TIMESTAMPTZ NOT NULL
updated_at TIMESTAMPTZ NOT NULL
```

Allowed `stat_type` values:

```text
Attack
Defense
SpellPower
Health
Mana
Energy
GoldPercent
ExperiencePercent
```

Constraints:

```text
FOREIGN KEY item_base_id -> item_bases ON DELETE CASCADE
UNIQUE (item_base_id, stat_position)
UNIQUE (item_base_id, stat_type)
CHECK (stat_position >= 1)
CHECK (min_value >= 0)
CHECK (max_value >= min_value)
```

Importer validation must enforce:

- only Unique or Set Item Bases may have rows,
- every Unique or Set Item Base has at least one row,
- regular Item Bases have no rows,
- positions are consecutive starting at 1.

The old fixed-stat columns on `unique_templates` are migrated into this table for every linked Unique Item Base when at least one value in the range is non-zero. After conversion, those old range columns are dropped from `unique_templates`. `unique_templates` remains an identity and collection template.

Set Item ranges are authored through the new workbook sheet.

## 2.3 `special_item_sources`

Purpose: weighted special-item pools sourced by either a specific Monster or a Monster Family.

```text
special_item_source_id UUID PRIMARY KEY
monster_id UUID NULL
monster_family_id UUID NULL
item_base_id UUID NOT NULL
selection_weight BIGINT NOT NULL
is_enabled BOOLEAN NOT NULL DEFAULT TRUE
created_at TIMESTAMPTZ NOT NULL
updated_at TIMESTAMPTZ NOT NULL
```

Constraints:

```text
FOREIGN KEY monster_id -> monsters ON DELETE CASCADE
FOREIGN KEY monster_family_id -> monster_families ON DELETE CASCADE
FOREIGN KEY item_base_id -> item_bases ON DELETE RESTRICT
CHECK (exactly one of monster_id, monster_family_id is non-null)
CHECK (selection_weight > 0)
```

Partial uniqueness:

```text
UNIQUE (monster_id, item_base_id) WHERE monster_id IS NOT NULL
UNIQUE (monster_family_id, item_base_id)
  WHERE monster_family_id IS NOT NULL
```

Indexes:

```text
(monster_id) WHERE is_enabled
(monster_family_id) WHERE is_enabled
(item_base_id)
```

Importer validation must enforce that `item_base_id` identifies a Unique or Set Item Base.

A specific Monster source and a Family source may both expose the same Item Base. Runtime loading must deduplicate eligible Item Bases before weighted selection. The more specific Monster row overrides the Family row for that Item Base.

## 2.4 `item_score_coefficients`

Purpose: authoritative integer scoring coefficients.

```text
item_score_coefficient_id UUID PRIMARY KEY
score_component VARCHAR(32) NOT NULL
coefficient BIGINT NOT NULL
created_at TIMESTAMPTZ NOT NULL
updated_at TIMESTAMPTZ NOT NULL
```

Allowed `score_component` values:

```text
ItemLevel
Attack
Defense
SpellPower
Health
Mana
Energy
GoldPercent
ExperiencePercent
```

Constraints:

```text
UNIQUE (score_component)
CHECK (coefficient >= 0)
```

All nine components must exist exactly once after controlled import. `base_item_score` is added directly and does not need a coefficient.

# 3. New generated-data table

## 3.1 `item_fixed_stats`

Purpose: actual generated fixed-stat rolls for Unique and Set Item copies.

```text
item_fixed_stat_id UUID PRIMARY KEY
item_id UUID NOT NULL
stat_position SMALLINT NOT NULL
stat_type VARCHAR(32) NOT NULL
roll_value BIGINT NOT NULL
created_at TIMESTAMPTZ NOT NULL
```

Constraints:

```text
FOREIGN KEY item_id -> items ON DELETE CASCADE
UNIQUE (item_id, stat_position)
UNIQUE (item_id, stat_type)
CHECK (stat_position >= 1)
CHECK (roll_value >= 0)
```

Indexes:

```text
(item_id)
(stat_type)
```

Application and integration tests must enforce:

- regular Items have `item_affixes` and no `item_fixed_stats`,
- Unique/Set Items have `item_fixed_stats` and no `item_affixes`,
- every configured fixed stat produces exactly one generated row.

# 4. Runtime configuration not stored in authored pool tables

The following canonical defaults belong in a typed server configuration module, not in per-Monster pool entries:

- regular Equipment success: 30%,
- Boss Equipment success: 80%,
- Other Loot success: 70%,
- Boss Other Loot success: 90%,
- regular and Boss rarity distributions,
- canonical slot weights,
- pity start, increment and cap.

Percentages should be represented as integer basis points in runtime configuration to avoid floating-point authority.

# 5. Required Level authority

The final authority chain is:

```text
Item Base item_level
-> minimum eligibility threshold

Generated Item item_level
-> actual rolled Item Level

Generated Item required_level
-> equal to generated Item item_level
```

Equipment validation must join and read `items.required_level`.

# 6. Existing-data conversion rules

Migration 090 must execute in one transaction and fail rather than round invalid authored values.

Order:

1. Assert all numeric fields being converted contain whole numbers.
2. Add nullable target columns needed for backfill.
3. Backfill deterministic `affix_position` values.
4. Backfill `items.required_level = items.item_level`.
5. Create new tables and constraints.
6. Convert old loot chances to relative integer weights.
7. Convert Unique fixed-stat ranges into Item Base fixed-stat rows.
8. Backfill pity start state.
9. Remove obsolete constraints and columns.
10. Make new columns non-null.
11. Add final constraints and indexes.
12. Drop obsolete Unique range columns only after successful conversion.

No existing generated Item, Inventory assignment, Item Affix, storage quantity or pity owner may be deleted during conversion.

# 7. Workbook and importer contract

Migration 090 requires workbook support for these sheets:

```text
item_base_affix_weights
item_base_fixed_stat_ranges
special_item_sources
item_score_coefficients
```

Existing sheets change:

```text
loot_tables:
  remove drop_chance_percent
  remove min_item_level
  remove max_item_level
  remove loot_level_modifier
  add selection_weight

other_loot_tables:
  remove drop_chance_percent
  add selection_weight

affix_templates:
  min_value and max_value must be whole integers

item_bases:
  base and percentage statistics must be whole integers
```

Importer ordering must ensure all referenced definition tables are imported before relationship tables.

# 8. P2 verification gate

P2 is complete when this design is checked against D1-D24 and every required migration element has an explicit target table, column, constraint, conversion rule and importer owner.

P2 does not create migration 090. Migration creation begins in P3.
