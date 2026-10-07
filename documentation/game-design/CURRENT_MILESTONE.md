# Current Milestone

## Milestone

M4: Pure Combat Engine

## Status

Completed.

## Objective

Implement deterministic turn-based combat as a pure TypeScript domain module processing one player action at a time.

## Implemented scope

- Pure TypeScript combat domain.
- Immutable combat state transitions.
- Injected `RandomSource`.
- Player `basic_attack`.
- Monster `basic_attack`.
- Shared attack resolution for player and monster.
- Player-first round flow.
- Hit chance calculation.
- Damage range calculation.
- Misses.
- Successful zero-damage hits.
- Immediate victory and defeat handling.
- Maximum duration of 100 complete rounds.
- Ordered combat events.
- Dedicated combat domain errors.
- Validation of combat state and RNG output.
- Placeholder for future active combat effects.
- Deterministic unit tests.

## Public domain interface

```ts
resolveCombatAction(
  state: CombatState,
  action: PlayerAction,
  rng: RandomSource
): CombatResolution
```

Initially supported action:

```ts
{
  type: "basic_attack"
}
```

## Combat flow

One turn represents one complete round:

1. Resolve the player basic attack.
2. Stop immediately if the monster reaches zero Health.
3. Resolve the monster basic attack.
4. Stop immediately if the player reaches zero Health.
5. Apply the turn-limit rule.
6. Advance the turn if combat continues.

The player always acts first.

The monster does not act after being killed by the player.

## Basic attack formulas

```txt
hitChancePercent =
  clamp((attack - defense) * 4, 5, 90)

minimumDamage =
  max(0, attack - defense)

maximumDamage =
  max(0, (attack - defense) * 2)
```

Player and monster basic attacks use the same formulas.

## Randomness contract

```ts
interface RandomSource {
  nextFloat(): number;

  nextInt(
    minimum: number,
    maximum: number
  ): number;
}
```

Rules:

- `nextFloat()` returns a value greater than or equal to `0` and less than `1`.
- `nextInt(minimum, maximum)` uses inclusive minimum and maximum bounds.
- A hit occurs when `nextFloat() * 100` is lower than the calculated hit chance.
- Invalid RNG output causes a dedicated domain error.
- Combat domain code does not call `Math.random()`.

## Combat state rules

- `currentHealth`, `maximumHealth`, `attack`, `defense`, and `turn` are safe integers.
- `maximumHealth` must be positive.
- `currentHealth`, `attack`, and `defense` must be non-negative.
- `currentHealth` cannot exceed `maximumHealth`.
- Initial combat turn is `1`.
- Health cannot fall below `0`.
- Combat cannot resolve another action after reaching a terminal state.
- Input state is never mutated.

## Combat outcomes

Combat status:

- `InProgress`
- `PlayerVictory`
- `PlayerDefeat`

Player defeat reasons:

- `PlayerHealthDepleted`
- `TurnLimitExceeded`

A successful hit may deal zero damage.

The following outcomes remain distinct:

```ts
{
  hit: false,
  damage: 0
}
```

```ts
{
  hit: true,
  damage: 0
}
```

## Turn limit

Turn `100` resolves normally.

If the player kills the monster during turn `100`, combat ends in player victory.

If the monster kills the player during turn `100`, combat ends in player defeat caused by depleted Health.

If both combatants survive turn `100`, combat ends in player defeat caused by the turn limit.

Terminal combat does not advance to another turn. The final state preserves the number of the round in which combat ended.

## Combat events

The engine returns a new state and an ordered readonly event list.

Supported events:

- `AttackResolved`
- `CombatEnded`
- `TurnAdvanced`

`AttackResolved` records:

- actor,
- target,
- whether the attack hit,
- damage dealt.

`CombatEnded` records:

- final combat status,
- defeat reason when applicable.

`TurnAdvanced` is emitted only when combat remains in progress.

## Active effects

Combat state contains an active-effects collection as an extension point for future milestones.

M4 does not implement:

- buffs,
- debuffs,
- damage over time,
- healing over time,
- effect duration,
- effect stacking.

The effects collection remains empty in the initial combat engine.

## Error handling

Dedicated domain errors cover:

- invalid combat state,
- actions submitted after combat has ended,
- invalid RNG output.

The combat engine rejects invalid input instead of repairing or normalizing it.

## Architectural boundary

M4 does not:

- expose HTTP endpoints,
- access PostgreSQL,
- use repositories,
- persist combat sessions,
- persist combat events or logs,
- deduct Energy,
- grant rewards,
- grant Experience or Gold,
- generate loot,
- update progression,
- update monster cooldowns,
- update Bestiary,
- update kill statistics,
- update Task Boss progress,
- use monster abilities,
- use spells or consumables,
- call `Math.random()`,
- call `Date.now()`.

Combat receives final combat-ready player and monster statistics. It does not calculate equipment, progression, bonuses, or database definitions.

## Implemented files

```txt
src/modules/combat/
+-- domain/
¦   +-- combat-attack.ts
¦   +-- combat-effects.ts
¦   +-- combat-engine.ts
¦   +-- combat-validation.ts
¦   +-- combat.constants.ts
¦   +-- combat.errors.ts
¦   +-- combat.types.ts
+-- ports/
    +-- random-source.ts
```

Tests:

```txt
tests/unit/combat/
+-- combat-attack.test.ts
+-- combat-engine.test.ts
+-- combat-validation.test.ts
```

## Verification

Verified on 2026-10-07:

- TypeScript typecheck passed.
- 4 M4 test files passed.
- 41 M4 tests passed.
- 46 total test files passed.
- 267 total tests passed.
- Production build passed.
- No regressions were detected in M1-M3 tests.
- M4 branch was pushed and synchronized with `origin/m4/pure-combat-engine`.

## Out of scope

The following remain for later milestones:

- persistent combat sessions,
- combat API endpoints,
- expected-turn concurrency control,
- Energy deduction,
- persistent combat logs,
- victory rewards,
- death penalties,
- Experience and Gold rewards,
- loot generation,
- cooldown writes,
- Bestiary updates,
- kill statistics,
- Task Boss progression,
- player spells,
- combat consumables,
- monster abilities,
- buffs and debuffs,
- damage and healing over time,
- multiple targets.

## Completion log

M4 Pure Combat Engine completed and verified.

The next milestone is M5: Persistent Combat API.
