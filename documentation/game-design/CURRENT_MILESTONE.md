## Current Milestone

### Milestone

M7: Item and Loot Generation

### Status

Planning checkpoint in progress.

Functional M7 implementation has not started.

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

The first implementation phase is:

```text
P1: Baseline and implementation inventory
```

P1 must not create migration 090 or functional M7 runtime code.

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

### Planning checkpoint state

Completed:

1. `M7_SOURCE_AUDIT.md`
2. `M7_VERIFICATION_PLAN.md`
3. `M7_IMPLEMENTATION_PLAN.md`
4. `M7_MASTER_PROMPT.md`
5. fresh `M7_TECHNICAL_DUMP.md`
6. fresh `M7_SCHEMA_DATA_DUMP.md`

Current step:

7. update `CURRENT_MILESTONE.md`

Remaining before implementation:

8. validate planning documentation
9. commit and push planning documentation

### Previous milestone

M6: Victory, Death, and Progression is complete.

Final M6 implementation commit:

```text
8a83b30 complete M6 victory death and progression
```

M7 must not weaken any verified M6 guarantee.
