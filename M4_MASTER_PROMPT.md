# M4 Master Prompt

We are continuing the browser RPG "Ostatnia Szansa".

Current milestone: **M4: Pure Combat Engine**.

## Read first

1. `M4_CONTEXT_INDEX.md`
2. `M4_IMPLEMENTATION_PLAN.md`
3. `M4_SOURCE_AUDIT.md`
4. `M4_TECHNICAL_DUMP.md`
5. `M4_SCHEMA_DATA_DUMP.md`
6. `documentation/game-design/CURRENT_MILESTONE.md`
7. `documentation/game-design/MASTER_PROJECT_PLAN.md`

Use the source priority from `M4_CONTEXT_INDEX.md`. Do not resolve conflicts silently.

## Completed context

M1 delivered character foundation, ownership, snapshots, regeneration, PostgreSQL transactions, authentication, HTTP, and tests.

M2 delivered authoritative effective statistics, progression, equipment and affixes, set bonuses, achievements, boosts, resource clamping, and transactional equipment operations.

M3 delivered authenticated monster discovery, stable monster codes, ownership isolation, level eligibility, Normal and MiniBoss cooldowns, Task Boss lifecycle, Daily Boss rotations and attempts, Energy preview, Bestiary visibility, HTTP endpoints, and tracked migrations.

M3 verification: 87 migrations applied, 0 pending, 79 tables, 42 test files and 226 tests passed, typecheck passed, build passed.

## M4 objective

Implement deterministic combat as a pure TypeScript domain module.

```ts
resolveCombatAction(
  state: CombatState,
  action: PlayerAction,
  rng: RandomSource
): CombatResolution
```

Initial action:

```ts
{ type: "basic_attack" }
```

## Confirmed formulas

```text
hitChancePercent = clamp((attackerAttack - defenderDefense) * 4, 5, 90)
minimumDamage = max(0, attackerAttack - defenderDefense)
maximumDamage = max(0, (attackerAttack - defenderDefense) * 2)
```

## Confirmed rules

- Player acts first.
- No escape action.
- A successful hit may deal zero damage.
- Player and monster use the same basic-attack formula.
- Combat stops immediately when either combatant reaches zero Health.
- Maximum duration is 100 turns.
- Exceeding the limit causes player defeat.
- Seeded random input must be repeatable.
- Domain code must not access HTTP, PostgreSQL, `Math.random()`, or `Date.now()`.

## Boundary

M4 does not persist sessions or logs, deduct persistent Energy, grant rewards, update progression, write cooldowns, update Bestiary, mutate boss progress, or expose HTTP.

## Working method

The user prefers concise, explicit, copy-paste-ready instructions. Use complete PowerShell blocks and whole files. After each component run `npm run typecheck` and the narrowest test. Use full verification at checkpoints. Do not use destructive Git commands or `git add .`.

## First task

Do not implement immediately.

1. Review `M4_SOURCE_AUDIT.md` against current dumps and code.
2. List conflicts and unresolved decisions in plain language.
3. Recommend one precise option for each decision.
4. Wait for explicit approval.
5. Update the audit with approved semantics.
6. Only then propose the first implementation slice.
