# M7 Approved Decisions

## Milestone

M7: Item and Loot Generation

## Status

All decisions D1 through D24 are approved and authoritative for M7 planning and implementation.

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

Example:

```text
Attack: 1-10
Defense: 2-7
Gold: 3-5
```

Every generated copy contains all configured stat categories, while their values may differ. Unique and Set Items do not create `item_affixes` records.

## D4: Canonical loot Item Level formula

The canonical loot level is:

```text
effectiveLootLevel = monsterLevel + bossBonusLootLevel
minimumItemLevel = max(1, effectiveLootLevel - 10)
maximumItemLevel = effectiveLootLevel + 5
```

Item Level is rolled uniformly and inclusively from this range.

Regular monsters use `bossBonusLootLevel = 0`.

There are no manual Item Level range overrides in loot-table entries. Existing `min_item_level` and `max_item_level` fields must be removed or retired from runtime authority.

## D5: Regular equipment loot flow

Regular equipment loot follows this order:

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

For regular items, rarity controls only the number of affixes:

```text
Common: 0
Magic: 1
Rare: 2
Epic: 3
Legendary: 4
```

Rarity does not improve:

- base statistics,
- affix tiers,
- affix roll values,
- tier eligibility.

Affix-tier eligibility depends only on Item Level.

## D10: Item Score

Item Score is an internal integer measure of the quality of a specific generated item.

It must account for:

- `base_item_score`,
- Item Level,
- the actually rolled item-stat values,
- all actually rolled affixes.

Each statistic type may use its own scoring coefficient.

Item Score is calculated by one pure domain module and persisted as a non-negative `BIGINT`.

Rarity receives no arbitrary score bonus merely for its name. Its effect is indirect through the number of generated affixes.

Unique and Set Items are scored from their actually rolled fixed-stat values and do not use normal affix scoring records.

## D11: Roll values and numeric precision

All configured stat and affix ranges are rolled:

- uniformly,
- inclusively,
- as whole integer values.

For example, a range of `100-200` means that every integer from 100 through 200 has equal probability.

Runtime roll values do not store unnecessary decimal precision. Gold and Experience percentage bonuses are also stored and processed as whole percentage points for generated item rolls.

## D12: Independent reward systems

Victory runs these reward systems independently:

- Gold and Experience settlement from M6,
- regular Equipment roll,
- Other Loot roll,
- Unique/Set roll.

Failure of one roll does not disable the others.

One kill may generate at most:

- one regular Item,
- one Unique or Set Item.

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

These are the canonical M7 defaults and remain server-authoritative and configurable.

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

This roll:

- does not replace the regular Equipment roll,
- may succeed on the same kill as the regular Equipment roll,
- generates at most one Unique or Set Item per kill.

Set Items are a special category within the same special-item reward system.

## D16: Unique/Set pity

Unique/Set pity is tracked separately for each character.

Canonical values:

```text
Starting chance: 0.1%
Increase: +0.1 percentage point per eligible kill
Maximum chance: 10%
```

A failed special-item roll increases pity.

Pity resets to `0.1%` only after a generated Unique/Set Item is successfully persisted in Inventory.

A successful roll whose item is lost because of `InventoryFull` does not reset pity.

## D17: Unique and Set eligibility

A Unique or Set Item is eligible only when:

- it belongs to the special pool available to the defeated monster or monster family,
- it satisfies boss-exclusive source restrictions,
- its `item_base.item_level` does not exceed the rolled Item Level,
- it fits the current progression range.

Selection among eligible special items is weighted.

Set Items may be associated with monster families.

## D18: Transactional loot settlement

Loot generation is part of the existing Victory settlement transaction.

The same transaction performs:

- all reward rolls,
- pity updates,
- `items` persistence,
- standard affix or fixed-stat roll persistence,
- Inventory assignment,
- Material and Consumable storage updates,
- settlement-response construction.

Defeat does not generate loot.

Unexpected generation or persistence failure rolls back the complete Victory settlement.

## D19: Server authority and RandomSource

The client cannot provide or control:

- random results,
- rarity,
- Item Level,
- Item Base selection,
- affixes,
- rolled stat values,
- Item Score,
- pity success or failure.

All random outcomes use the server-controlled injectable `RandomSource`.

Tests use deterministic RandomSource implementations.

## D20: Inventory locking and deterministic positions

Before persisting item rewards, the Victory transaction locks the character and the relevant Inventory state.

Free positions are assigned deterministically from the lowest available position number.

When two Equipment Items are generated in one settlement, persistence order is:

1. Unique/Set Item,
2. regular Item.

Concurrent transactions cannot assign the same position or exceed `inventory_capacity`.

## D21: Rollback and exactly-once protection

Each accepted terminal combat action can generate loot at most once.

Unexpected failure during generation or persistence rolls back the entire Victory settlement.

`InventoryFull` is an expected business result and does not trigger rollback.

Retries, stale actions, and concurrent requests cannot:

- create duplicate items,
- grant Material or Consumable storage twice,
- update pity twice.

## D22: Settlement response

The terminal Victory response contains complete loot results:

- M6 Experience and Gold results,
- regular Equipment result,
- Other Loot result,
- Unique/Set result,
- persisted items with their complete generated values,
- lost generated items and their loss reasons,
- Material and Consumable quantity changes,
- the current pity state needed by the Developer UI.

There is no separate `claim loot` endpoint.

## D23: Developer UI checkpoint

M7 must deliver a minimal maintained Developer UI that allows a human to:

- create or select a development Character,
- view eligible Monsters,
- start combat,
- submit basic attacks,
- see Victory or Defeat,
- inspect Experience, Gold, and level changes,
- inspect regular Equipment loot,
- inspect Unique/Set and Other Loot,
- see `InventoryFull` warnings.

The Developer UI is an integration surface, not the final production frontend.

M7 cannot be closed until this browser flow has been manually exercised in addition to automated verification.

## D24: One M7 migration and authored-data pipeline

M7 uses one complete migration for the generator foundation.

The migration includes at least:

- removal of the constraint that blocks identical affix templates on one item,
- `affix_position`,
- the authoritative Item Base to Affix weight table,
- conversion of `loot_tables` from individual drop chance to pool-selection weight,
- retirement of manual Item Level range authority,
- persistence for actual Unique and Set fixed-stat rolls,
- required constraints and indexes.

The workbook and importer must support every new authoritative authored-data structure.

The migration must pass on:

- the current development database,
- a newly created empty database.

## Final approval

M7 decisions D1 through D24 were approved as written before implementation planning began.
