# M5 Master Prompt

We are continuing development of the browser RPG **Ostatnia Szansa**.

Current milestone:

**M5: Persistent Combat API**

## Read first

Read the following files in this order:

1. `M5_CONTEXT_INDEX.md`
2. `M5_IMPLEMENTATION_PLAN.md`
3. `M5_SOURCE_AUDIT.md`
4. `M5_TECHNICAL_DUMP.md`
5. `M5_SCHEMA_DATA_DUMP.md`
6. `documentation/game-design/CURRENT_MILESTONE.md`
7. `documentation/game-design/MASTER_PROJECT_PLAN.md`

Use the source priority defined in `M5_CONTEXT_INDEX.md`.

Do not resolve conflicts silently.

If current code, PostgreSQL schema, passing tests, or approved M5 decisions conflict, identify the conflict before modifying production code.

## Completed milestones

### M1: Character Foundation

M1 delivered:

- account-to-character ownership,
- character creation,
- character listing,
- character snapshots,
- character archiving,
- resource regeneration,
- PostgreSQL transactions,
- authentication,
- HTTP endpoints,
- automated tests.

### M2: Effective Character Statistics

M2 delivered:

- the authoritative effective-statistics calculator,
- equipment statistics,
- item affixes,
- set bonuses,
- achievement bonuses,
- progression boosts,
- resource clamping,
- transactional equipment operations.

### M3: Monster Discovery and Eligibility

M3 delivered:

- authenticated monster discovery,
- stable monster codes,
- character-level eligibility,
- Normal and MiniBoss cooldowns,
- Task Boss lifecycle rules,
- Daily Boss rotation and attempt eligibility,
- Energy-cost preview,
- Bestiary visibility.

### M4: Pure Combat Engine

M4 delivered:

- pure TypeScript combat resolution,
- immutable combat state,
- injected `RandomSource`,
- player and monster basic attacks,
- deterministic hit and damage formulas,
- player-first combat rounds,
- misses,
- successful zero-damage hits,
- immediate victory and defeat handling,
- the 100-turn limit,
- ordered combat events,
- dedicated combat errors,
- explicit no-op effects phase,
- deterministic and immutability tests.

M4 public interface:

```ts
resolveCombatAction(
  state: CombatState,
  action: PlayerAction,
  rng: RandomSource
): CombatResolution
```

Supported action:

```ts
{
  type: "basic_attack"
}
```

M4 must remain independent of PostgreSQL, HTTP, authentication, sessions, repositories, production time, and production randomness.

## M5 objective

Implement authenticated and persistent combat sessions around the M4 combat engine.

M5 must allow a player to:

1. Start combat against an eligible monster.
2. Pay the Energy cost exactly once.
3. Persist a snapshot of combat-ready statistics.
4. Retrieve the active combat session.
5. Submit one action for the expected turn.
6. Persist the resulting state and ordered events atomically.
7. Retrieve a specific active or completed session.
8. Retrieve the ordered combat event log.
9. Continue an active combat after an application restart.

## Approved semantics

All decisions D1-D20 in `M5_SOURCE_AUDIT.md` were explicitly approved.

Do not repeat the approval process unless current code or schema reveals a genuine conflict.

The approved decisions include:

- snapshot player and monster combat statistics at fight start,
- compare `expectedTurn` with the locked session's `current_turn`,
- lock active sessions using `FOR UPDATE`,
- lock the character before combat start,
- prevent duplicate Energy deductions,
- apply resource regeneration before Health and Energy validation,
- allow combat start with any positive Health,
- keep session Health authoritative while combat is active,
- synchronize character Health when combat ends,
- persist action events in `combat_session_events`,
- read logs from ordered session events,
- use server-controlled production randomness based on `node:crypto`,
- map M4 statuses to persistent session statuses,
- store terminal defeat reason,
- distinguish active-session retrieval from retrieval by session ID,
- use stable API error codes,
- return the current session view after start and action operations,
- accept only `monsterCode` from the client when starting combat,
- execute actions against the current active session,
- use a single `Clock` value per operation,
- revalidate monster eligibility inside the start transaction,
- persist terminal state without granting rewards or applying progression consequences.

Treat `M5_SOURCE_AUDIT.md` as authoritative for all M5 semantics.

## Required endpoints

```http
POST /characters/:characterId/combat
GET /characters/:characterId/combat
GET /characters/:characterId/combat/:combatSessionId
POST /characters/:characterId/combat/actions
GET /characters/:characterId/combat/:combatSessionId/log
```

All endpoints require authentication and character ownership.

## Combat-start request

```ts
{
  monsterCode: string;
}
```

The client must not provide:

- player statistics,
- monster statistics,
- Health values,
- Energy cost,
- eligibility results,
- timestamps,
- random values,
- random seeds,
- combat status,
- combat results.

All trusted values must come from the server.

## Combat-action request

```ts
{
  expectedTurn: number;
  action: {
    type: "basic_attack";
  };
}
```

The action applies to the character's current active session.

The request body does not contain `combatSessionId`.

## Persistent combat response

Combat start and combat action should return:

```ts
{
  combatSessionId,
  characterId,
  monsterCode,
  status,
  defeatReason,
  currentTurn,
  player: {
    currentHealth,
    maximumHealth,
    attack,
    defense
  },
  monster: {
    currentHealth,
    maximumHealth,
    attack,
    defense
  },
  startedAt,
  endedAt,
  events
}
```

For start and action operations, `events` contains only events created by the current request.

The complete event history is returned by the log endpoint.

## Required schema direction

M5 requires a tracked migration after migration `087`.

The expected first migration is:

```txt
088_persistent_combat_api.sql
```

The exact filename may be adjusted if a more accurate name is selected.

The migration must extend `combat_sessions` with:

```txt
character_maximum_health
character_attack
character_defense
monster_maximum_health
monster_attack
monster_defense
defeat_reason
```

The migration must also create:

```txt
combat_session_events
```

Required event data:

```txt
combat_session_event_id
combat_session_id
turn_number
event_order
event_type
event_data_json
created_at
```

The migration must enforce:

- current turn between `1` and `100`,
- valid combat snapshots,
- current Health not exceeding snapshot maximum Health,
- valid status and defeat-reason combinations,
- unique event order within a session and turn,
- efficient ordered event retrieval.

Review the exact current schema and migration conventions before writing the migration.

## Fight-start transaction

The approved start flow is:

1. Read one `observedAt` value from `Clock`.
2. Begin a PostgreSQL transaction.
3. Lock the owned active character using `FOR UPDATE`.
4. Reject an existing active combat.
5. Apply resource regeneration.
6. Load the monster by stable code.
7. Revalidate monster eligibility.
8. Require positive character Health.
9. Validate available Energy.
10. Calculate effective character statistics.
11. Load final monster combat statistics.
12. Snapshot all statistics required by M4.
13. Deduct Energy exactly once.
14. Create the active combat session.
15. Commit.
16. Return the persistent session view.

Any failure must roll back:

- regeneration writes,
- Energy deduction,
- session creation.

## Combat-action transaction

The approved action flow is:

1. Read one `observedAt` value from `Clock`.
2. Begin a PostgreSQL transaction.
3. Lock the active combat session using `FOR UPDATE`.
4. Validate account and character ownership.
5. Validate that the session is active.
6. Compare `expectedTurn` with `current_turn`.
7. Reconstruct the M4 `CombatState` from persistent snapshots.
8. Resolve the action through M4 using server-controlled `RandomSource`.
9. Persist the new session state.
10. Persist ordered events.
11. Synchronize character Health if combat becomes terminal.
12. Commit.
13. Return the session view and current-operation events.

A stale `expectedTurn` must not:

- call M4,
- modify Health,
- advance the turn,
- insert events,
- change the persistent session.

## Status mapping

Map M4 statuses to PostgreSQL statuses:

```txt
InProgress     -> Active
PlayerVictory  -> Victory
PlayerDefeat   -> Defeat
```

Allowed defeat reasons:

```txt
PlayerHealthDepleted
TurnLimitExceeded
```

Rules:

- active combat has no defeat reason,
- victory has no defeat reason,
- defeat requires a valid defeat reason,
- terminal combat receives `ended_at`,
- M5 does not produce `Abandoned`.

## Error semantics

Use stable error codes:

```txt
COMBAT_ALREADY_ACTIVE
COMBAT_SESSION_NOT_FOUND
COMBAT_TURN_MISMATCH
COMBAT_ALREADY_ENDED
INSUFFICIENT_ENERGY
CHARACTER_HEALTH_DEPLETED
MONSTER_NOT_ELIGIBLE
```

HTTP mapping:

```txt
COMBAT_ALREADY_ACTIVE       -> 409 Conflict
COMBAT_SESSION_NOT_FOUND    -> 404 Not Found
COMBAT_TURN_MISMATCH        -> 409 Conflict
COMBAT_ALREADY_ENDED        -> 409 Conflict
INSUFFICIENT_ENERGY         -> 409 Conflict
CHARACTER_HEALTH_DEPLETED   -> 409 Conflict
MONSTER_NOT_ELIGIBLE        -> 409 Conflict
```

Do not expose the existence of another account's character or combat session.

## Randomness

Production M5 supplies a `RandomSource` implemented using `node:crypto`.

The implementation must satisfy the M4 contract:

```ts
0 <= nextFloat() < 1
```

```ts
minimum <= nextInt(minimum, maximum) <= maximum
```

Integer bounds are inclusive.

Do not use:

```ts
Math.random()
```

The client must not provide seeds, random values, hit results, damage values, or combat outcomes.

Tests must inject deterministic RNG.

## Time

Use the existing injected `Clock`.

Each operation reads time once:

```ts
const observedAt = clock.now();
```

Use the same `observedAt` value throughout the transaction.

Do not call:

```ts
Date.now()
```

inside M5 application logic.

## Concurrency guarantees

M5 must guarantee:

- one active combat per character,
- concurrent starts cannot create two active sessions,
- concurrent starts cannot deduct Energy twice,
- concurrent actions cannot resolve the same turn twice,
- stale requests are rejected after lock acquisition,
- state and events are committed atomically,
- terminal Health synchronization is atomic,
- failed transactions leave no partial events or state,
- combat remains available after application restart.

## Architectural constraints

Keep responsibilities separated.

### Domain

Contains pure combat rules only.

### Application

Coordinates:

- use cases,
- repositories,
- transactions through abstractions,
- M4 invocation,
- persistent models,
- application errors.

### Infrastructure

Contains:

- PostgreSQL queries,
- row mapping,
- production randomness,
- repository implementation.

### HTTP

Contains:

- authentication,
- route parsing,
- request validation,
- application-service invocation,
- response serialization.

HTTP handlers must not:

- calculate statistics,
- validate monster eligibility directly,
- resolve combat,
- generate randomness,
- execute SQL,
- own transaction logic.

## Out of scope

M5 does not implement:

- Experience rewards,
- Gold rewards,
- loot generation,
- item generation,
- level changes,
- death Experience penalties,
- Blessing consumption,
- monster cooldown writes,
- Bestiary writes,
- kill statistics,
- Task Boss progression,
- boss-attempt result consumption,
- final `combat_logs` summaries and retention,
- player spells,
- monster abilities,
- consumables,
- active combat effects,
- multiple targets,
- escape,
- abandonment.

Do not pull later-milestone functionality into M5.

## Working method

The user prefers concise and copy-paste-ready instructions.

Use this workflow:

1. Inspect exact current files before modifying them.
2. Explain briefly what is being changed.
3. Provide complete PowerShell commands for code operations.
4. For long Markdown files, provide one complete block for manual saving.
5. Make small implementation slices. 
6. Run `npm run typecheck` after each slice.
7. Run the narrowest relevant tests.
8. Run integration tests at transaction checkpoints.
9. Run the full suite before completion.
10. Use coherent commits.

Do not:

- use destructive Git commands,
- use `git add .`,
- silently change approved semantics,
- invent schema behavior,
- leave known problems for later,
- declare M5 complete before full verification.

If a command fails, inspect the current state before issuing another modifying command.

Avoid complex PowerShell search-and-replace commands for long files.

## First task

Do not begin with HTTP handlers or service implementation.

First:

1. Confirm the current branch.
2. Confirm the working tree.
3. Review `M5_SOURCE_AUDIT.md`.
4. Inspect current migration conventions.
5. Inspect the exact `combat_sessions` constraints.
6. Design migration `088`.
7. Verify the design against the M4 `CombatState`.
8. Implement and test the migration.
9. Run migration status and database checks.
10. Commit the schema slice separately.

The first production slice is the persistent combat schema.

## Verification commands

Use:

```powershell
npm run db:migrate:status
npm run db:test
npm run typecheck
npm test
npm run build
git diff --check
git status --short
```

At relevant checkpoints, also verify:

```powershell
Get-ChildItem src\modules\combat -Recurse -File |
  Select-String -Pattern "Math\.random|Date\.now"
```

## Definition of Done

M5 is complete only when:

- the new migration is applied,
- no migrations remain pending,
- combat snapshots persist,
- one active combat is enforced,
- Energy is deducted exactly once,
- failed starts roll back,
- expected turns are enforced,
- concurrent actions cannot duplicate a turn,
- session state persists after every action,
- ordered events persist atomically,
- active and completed sessions can be retrieved,
- logs can be retrieved in deterministic order,
- authentication and ownership are enforced,
- foreign session existence is not disclosed,
- terminal Health synchronizes correctly,
- combat survives application restarts,
- unit tests pass,
- PostgreSQL integration tests pass,
- HTTP integration tests pass,
- concurrency tests pass,
- rollback tests pass,
- the full regression suite passes,
- typecheck passes,
- production build passes,
- documentation is current.

Do not mark M5 as completed before every applicable condition is verified.