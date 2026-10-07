# M4 Implementation Plan

## Milestone

M4: Pure Combat Engine

## Status

Preparation in progress. Implementation starts only after blocking decisions in `M4_SOURCE_AUDIT.md` are approved.

## Objective

Implement deterministic turn-based combat as a pure TypeScript domain module processing one player action at a time.

## Scope

- `CombatState`, combatants, actions, outcomes, events and validation
- injected `RandomSource`
- `basic_attack`
- hit chance and damage range
- player-first round flow
- monster basic response
- terminal victory and defeat
- 100-turn limit
- immutable state transitions
- deterministic unit tests

## Out of scope

- HTTP and authentication
- PostgreSQL and repositories
- persistent combat sessions and logs
- Energy deduction
- rewards, loot and progression
- spells and consumables
- monster abilities
- multiple targets
- Bestiary, cooldown and boss-progress writes

## Proposed layout

```text
src/modules/combat/domain/
  combat.types.ts
  combat.errors.ts
  combat-validation.ts
  combat-attack.ts
  combat-engine.ts
src/modules/combat/ports/
  random-source.ts
tests/unit/combat/
  combat-attack.test.ts
  combat-engine.test.ts
  combat-validation.test.ts
  sequence-random-source.ts
```

## Phase 1: Audit and decisions

Confirm RNG bounds, hit mapping, integer invariants, round semantics, initial turn, turn-100 boundary, terminal-state representation, resolution/events, effects placeholder, Clock usage and invalid-state behavior.

Exit: no blocking `UNRESOLVED` decision remains.

## Phase 2: RandomSource and primitives

Define `nextFloat()` and inclusive/exclusive semantics for `nextInt(minimum, maximum)`. Add deterministic test implementation and validation of faulty RNG outputs.

## Phase 3: Combat state

Define immutable combatants, Health, Attack, Defense, turn, status, active effects, player action, events and resolution. Add invariant tests.

## Phase 4: Pure attack calculations

Implement clamp, hit chance, damage range, hit roll, damage roll and Health reduction.

Test minimum and maximum clamps, hit/miss boundaries, zero damage, both damage endpoints and no negative Health.

## Phase 5: Combat engine

1. Validate state and action.
2. Resolve player attack.
3. Resolve the approved effect phase.
4. End immediately on monster death.
5. Resolve monster basic attack.
6. Resolve the approved effect phase.
7. End immediately on player death.
8. Apply approved turn-limit semantics.
9. Advance turn only when combat continues.
10. Return new state and ordered events.

## Phase 6: Determinism and immutability

Test repeatability, stable event ordering, different valid sequences, deep input non-mutation, and absence of direct randomness/time access.

## Phase 7: Full verification

```powershell
npm run db:migrate:status
npm run db:test
npm run typecheck
npm test
npm run build
git status --short
```

## Suggested commits

```text
approve M4 combat semantics
add M4 combat domain contracts
add deterministic attack calculations
implement basic combat action resolution
add combat terminal state handling
complete M4 combat engine tests
complete M4 documentation
```

## Definition of Done

- explicit validated combat contracts
- injected deterministic RNG
- basic attack for player and monster
- correct 5-90 hit clamp
- correct damage range and zero-damage hits
- immediate terminal handling
- approved turn-limit behavior
- immutable input
- deterministic ordered events
- no HTTP/PostgreSQL/direct random/direct time dependency
- full tests, typecheck, build, DB checks and documentation pass

### Completion verification

Verified on 2026-10-07:
- All D1-D20 decisions approved.
- TypeScript typecheck passed.
- 3 M4 test files passed.
- 26 M4 tests passed.
- 45 total test files passed.
- 252 total tests passed.
- Production build passed.
- Branch pushed to origin/m4/pure-combat-engine.
