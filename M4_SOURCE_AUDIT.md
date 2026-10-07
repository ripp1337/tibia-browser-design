# M4 Source Audit

## Purpose

Separate confirmed M4 requirements from decisions that must be approved before production implementation.

## Confirmed requirements

- Pure TypeScript combat domain.
- `resolveCombatAction(state, action, rng): CombatResolution`.
- Initial player action: `basic_attack`.
- Player acts first.
- No escape action.
- A successful hit may deal zero damage.
- Player and monster use the same basic-attack formula.
- Combat ends immediately when either combatant reaches zero Health.
- Maximum duration: 100 turns.
- Exceeding the limit causes player defeat.
- Seeded input must be repeatable.
- No HTTP, PostgreSQL, `Math.random()` or `Date.now()` in the domain.

## Confirmed formulas

```text
hitChancePercent = clamp((attack - defense) * 4, 5, 90)
minimumDamage = max(0, attack - defense)
maximumDamage = max(0, (attack - defense) * 2)
```

## Current repository facts

- `Clock` exists.
- Production `RandomSource` does not yet exist.
- Existing `randomUUID` calls create test identities, not combat outcomes.
- Effective character statistics already produce final player combat statistics.
- Monster definitions store combat statistics.
- Combat persistence tables exist, but M4 must not depend on them.
- No production combat domain module exists.

## Proposed decisions requiring approval

Each item starts as `APPROVED`. In the new conversation, accept or replace the proposal, then change the status to `APPROVED`.

### D1: `nextFloat()` range

Proposal: `0 <= value < 1`.

Status: `APPROVED`

### D2: `nextInt(min, max)` bounds

Proposal: both bounds inclusive, so minimum and maximum damage are reachable.

Status: `APPROVED`

### D3: hit roll

Proposal:

```text
roll = rng.nextFloat() * 100
hit when roll < hitChancePercent
```

A roll equal to the hit chance misses.

Status: `APPROVED`

### D4: numeric invariants

Proposal: current Health, maximum Health, Attack, Defense and turn are safe integers. Maximum Health is positive. Other combat statistics are non-negative.

Status: `APPROVED`

### D5: meaning of a turn

Proposal: one turn is a complete round starting with the player action and including a monster response if the monster survives.

Status: `APPROVED`

### D6: initial turn

Proposal: `turn = 1` means the first round is about to resolve.

Status: `APPROVED`

### D7: 100-turn boundary

Proposal: turn 100 resolves normally. If neither combatant dies during turn 100, combat ends in player defeat caused by the turn limit.

Status: `APPROVED`

### D8: terminal turn advancement

Proposal: do not advance to a new turn after combat becomes terminal. Preserve the number of the round in which combat ended.

Status: `APPROVED`

### D9: combat status

Proposal:

```ts
type CombatStatus =
  | "InProgress"
  | "PlayerVictory"
  | "PlayerDefeat";
```

For defeat, store `PlayerHealthDepleted` or `TurnLimitExceeded` as a separate reason.

Status: `APPROVED`

### D10: resolution shape

Proposal: return a new `state` plus ordered readonly `events`.

Status: `APPROVED`

### D11: event model

Proposal: one `AttackResolved` event contains actor, target, hit and damage. A separate `CombatEnded` event records the terminal result. `TurnAdvanced` is emitted only when combat continues.

Status: `APPROVED`

### D12: zero-damage hit

Proposal: distinguish `{ hit: true, damage: 0 }` from `{ hit: false, damage: 0 }`.

Status: `APPROVED`

### D13: active effects

Proposal: initial state contains an empty readonly effect list and the effect phase is an explicit no-op extension point. Do not invent duration, stacking, damage-over-time or healing rules.

Status: `APPROVED`

### D14: Clock

Proposal: do not inject or use Clock in the initial combat engine. Turns are logical, and no approved rule requires wall-clock time.

Status: `APPROVED`

### D15: mutation

Proposal: do not mutate state, action or nested arrays. Return new objects and readonly events.

Status: `APPROVED`

### D16: invalid input

Proposal: throw dedicated combat domain errors for invalid state, terminal-state actions and invalid RNG output.

Status: `APPROVED`

### D17: Health clamping

Proposal: damage cannot reduce current Health below zero.

Status: `APPROVED`

### D18: monster action

Proposal: the monster always uses `basic_attack` in initial M4. Ability selection remains future scope.

Status: `APPROVED`

### D19: player statistics input

Proposal: M4 receives final combat-ready player Health, Attack and Defense. It does not calculate equipment, progression or bonuses.

Status: `APPROVED`

### D20: monster statistics input

Proposal: M4 receives final combat-ready monster Health, Attack and Defense. It does not query or map database definitions.

Status: `APPROVED`

## Future, non-blocking topics

- spells and Mana
- spell cooldowns
- consumables
- buffs and debuffs
- damage/healing over time
- monster abilities and weighted selection
- critical hits and damage types
- multiple targets
- rewards and loot
- persistence and reconnection
- idempotent action requests

## Approval procedure

1. Review D1-D20.
2. Accept or replace each proposal.
3. Change every blocking status to `APPROVED`.
4. Record modified rules in this file.
5. Commit approved semantics separately.
6. Begin implementation with RandomSource, primitive types, validation and pure attack calculations.
