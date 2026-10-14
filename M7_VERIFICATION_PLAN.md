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
