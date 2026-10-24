## Current Milestone

### Milestone

M7: Item and Loot Generation

### Status

Backend M7 item and loot generation implemented and regression-green. Developer UI
(P20) fully implemented on branch `m7/developer-ui`; typecheck and production build
pass.

M7 is in closure: it is fully implemented and awaiting manual V23 verification
(`developer-ui/V23_MANUAL_EVIDENCE.md`) and merge of `m7/developer-ui`. No further
implementation work remains — see the "Developer UI implementation state" section
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

Backend M7 phases P1–P19 are implemented and committed on `m7/item-loot-generation`.
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

- [x] Full backend regression (`npm test` — 84 files / 585 tests), `npm run build`,
      `npm run ui:typecheck`, `npm run ui:build` — all green.
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
8. backend M7 phases P1–P18 (`m7/item-loot-generation`)
9. backend Developer UI readiness P19 (`GET .../combat/:combatSessionId`)
10. Developer UI P20.0–P20.7 on `m7/developer-ui`
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
