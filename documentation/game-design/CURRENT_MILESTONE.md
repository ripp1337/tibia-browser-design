# Current Milestone

## Milestone

M2: Effective Character Statistics

## Status

Completed.

## Objective

Provide one authoritative and deterministic calculator for effective character statistics, used by the character snapshot and future combat, reward, and equipment operations.

## Effective statistics

- Attack
- Defense
- Spell Power
- Maximum Health
- Maximum Mana
- Maximum Energy
- Gold Bonus
- Experience Bonus

## Implemented sources

- Base character statistics
- Character level progression
- Spell Mastery
- Equipped item base statistics
- Equipped item affixes
- Highest reached set-bonus threshold
- Completed account achievement bonuses
- Active Gold and Experience progression boosts
- Optional combat modifiers supplied by combat context

## Important rules

- `inventory_items.is_equipped` is the authoritative equipment state.
- Unequipped items do not affect statistics.
- Only the highest reached threshold of a set bonus is active.
- Completed achievements affect every character belonging to the account.
- Gold and Experience bonuses are additive percentage points.
- Combat buffs and debuffs are not included in the normal character snapshot.
- Final integer statistics are rounded down.
- Repeated calculations with identical input return identical results.
- The calculator does not mutate its input.
- Current Health, Mana, and Energy are clamped when their effective maximum decreases.

## Architecture

The implementation is divided into:

- Pure domain calculator
- Repository contract for calculation sources
- PostgreSQL implementation of calculation sources
- Application service exposing the central calculation
- Character snapshot integration

Controllers and PostgreSQL repositories do not contain final-statistic formulas.

## Implementation checklist

- [x] Normalize Spell Power representation
- [x] Define effective-statistics types
- [x] Implement deterministic domain calculator
- [x] Implement Health and Mana level progression
- [x] Implement Energy level progression
- [x] Add equipped item base statistics
- [x] Add equipped item affixes
- [x] Add highest reached set-bonus threshold
- [x] Add completed achievement bonuses
- [x] Add active Gold and Experience boosts
- [x] Separate progression boosts from combat modifiers
- [x] Add PostgreSQL calculation-source repository
- [x] Add central calculation application service
- [x] Integrate effective statistics with character snapshot
- [x] Implement resource hard clamp in snapshot flow
- [x] Add deterministic and non-mutation tests
- [x] Add unit and integration coverage for implemented sources
- [x] Implement transactional equip operation
- [x] Implement transactional unequip operation
- [x] Recalculate maxima and clamp resources inside equipment transactions
- [x] Add equip and unequip integration tests
- [x] Complete final M2 verification and documentation closure

## Test coverage

Automated coverage currently includes:

- Base statistics
- Level-based Health and Mana
- Energy progression and cap
- Spell Mastery
- Equipped and unequipped items
- Item affixes
- Set-bonus threshold selection
- Completed and incomplete achievements
- Active and inactive progression boosts
- Snapshot effective statistics
- Resource hard clamp
- Deterministic repeated calculations
- Invalid source values
- Missing characters

## Definition of done

- [x] One central statistics calculator exists
- [x] Every effective statistic has automated coverage
- [x] Equipped item sources affect statistics
- [x] Unequipped items are ignored
- [x] Repeated calculations return identical results
- [x] Character snapshot uses the central calculator
- [x] Current resources are safely clamped
- [x] Progression boosts and combat modifiers are separated
- [x] No separate permanent-character-bonus system exists
- [x] Equipment mutations use the central calculator transactionally
- [x] Equip and unequip behavior is covered by integration tests
- [x] Full type-check, test suite, build, and database verification pass
- [x] Documentation closure is committed

## Remaining work

The remaining functional part of M2 is the equipment mutation flow:

1. Equip an owned valid item.
2. Unequip the currently equipped item.
3. Recalculate effective statistics in the same transaction.
4. Persist new maximum resources.
5. Clamp current resources when maxima decrease.
6. Roll back the entire operation if any step fails.

## Verification commands

```powershell
npm run db:test
npm run typecheck
npm test
npm run build

