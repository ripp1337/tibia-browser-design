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
