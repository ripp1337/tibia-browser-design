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
