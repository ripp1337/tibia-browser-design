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
