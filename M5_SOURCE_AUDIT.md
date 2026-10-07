# M5 Source Audit

## Purpose

Record the approved semantics and architectural decisions for M5: Persistent Combat API before production implementation begins.

## Milestone objective

Connect the pure M4 combat engine to authenticated HTTP endpoints and persistent PostgreSQL combat sessions.

M5 processes one player action at a time and persists the resulting combat state and ordered events atomically.

## Confirmed requirements

- Persistent combat sessions.
- Authenticated and character-owned combat endpoints.
- Fight-start transaction.
- Combat-action transaction.
- One active combat session per character.
- Energy deducted exactly once when combat starts.
- Effective character statistics snapshotted when combat starts.
- Monster statistics snapshotted when combat starts.
- Persistent combat state survives application restarts.
- Action requests contain `expectedTurn`.
- Duplicate or concurrent actions cannot resolve the same turn twice.
- Combat events are persisted in deterministic order.
- M4 remains a pure TypeScript domain module.
- M5 supplies server-controlled randomness and time.
- Client input is never trusted for statistics, resources, timestamps, or random outcomes.

## Existing repository facts

- M4 provides `resolveCombatAction(state, action, rng)`.
- M4 supports `basic_attack`.
- M4 returns an immutable state and ordered combat events.
- M4 does not access HTTP, PostgreSQL, direct randomness, or wall-clock time.
- `Clock` and `SystemClock` already exist.
- `withTransaction` already provides PostgreSQL transaction handling.
- The effective character statistics calculator already exists.
- Monster discovery and eligibility rules already exist.
- `combat_sessions` already stores current turn and current Health.
- `combat_sessions` does not currently store combat-stat snapshots.
- `combat_sessions` has a partial unique index allowing only one active session per character.
- `combat_logs` represents a final whole-combat log and is not suitable for incremental per-action events.
- PostgreSQL currently has 87 applied migrations and 0 pending migrations.

## Approved decisions

### D1: Combat statistics snapshot

Status: APPROVED

When combat starts, persist all statistics required to reconstruct the M4 `CombatState`.

Character snapshot:

- `character_maximum_health`
- `character_attack`
- `character_defense`

Monster snapshot:

- `monster_maximum_health`
- `monster_attack`
- `monster_defense`

Current Health remains stored separately in:

- `character_health`
- `monster_health`

The running combat must not change when equipment, bonuses, character progression, or monster definitions change after the session starts.

M5 does not snapshot Maximum Mana, Spell Power, rewards, loot, cooldowns, or Energy because M4 does not use them during action resolution.

### D2: Expected-turn validation

Status: APPROVED

Combat action requests contain:

```ts
{
  expectedTurn: number;
  action: {
    type: "basic_attack";
  };
}
```

The server compares `expectedTurn` with the locked session's `current_turn`.

A mismatch rejects the action without resolving combat or changing persistent state.

No separate `expected_turn` database column is required.

### D3: Transactional session locking

Status: APPROVED

Combat actions lock the active combat session using `SELECT ... FOR UPDATE`.

Only after obtaining the lock does the server:

1. Validate ownership.
2. Validate active status.
3. Compare `expectedTurn` with `current_turn`.
4. Resolve the action through M4.
5. Persist the new session state.
6. Persist ordered events.
7. Commit the transaction.

A concurrent request waits for the lock and then observes the updated turn, causing its stale `expectedTurn` to be rejected.

### D4: Idempotent combat start

Status: APPROVED

Combat start locks the character row using `SELECT ... FOR UPDATE`.

Inside the same transaction, the server checks for an existing active combat session before deducting Energy or creating a new session.

The existing partial unique index on active combat sessions remains an additional database-level safeguard.

Duplicate or concurrent start requests must not:

- create multiple active sessions,
- deduct Energy more than once.

### D5: Energy deduction

Status: APPROVED

Energy is deducted exactly once during the fight-start transaction.

The order is:

1. Lock the character.
2. Apply resource regeneration.
3. Validate monster eligibility.
4. Validate available Energy.
5. Deduct `monster.energy_cost`.
6. Create the combat session.
7. Commit.

If any step fails, the whole transaction is rolled back.

Combat actions do not consume Energy.

Victory and defeat do not refund Energy.

An Energy cost of `0` is valid.

### D6: Resource regeneration before combat

Status: APPROVED

Resource regeneration is calculated and applied after locking the character and before checking Health and Energy.

The regenerated state is used for combat-start validation.

A character that gains sufficient Energy through regeneration may start combat.

If combat start fails later in the transaction, the regeneration write is rolled back with the rest of the transaction.

### D7: Health required to start combat

Status: APPROVED

After regeneration, combat may start when:

```ts
currentHealth > 0
```

Full Health is not required.

If `currentHealth === 0`, combat start is rejected without deducting Energy or creating a session.

### D8: Character Health synchronization

Status: APPROVED

While combat is active, `combat_sessions.character_health` is the authoritative Health value for that combat.

After each action, the session Health is updated.

The character record is synchronized when combat becomes terminal:

- victory writes the remaining session Health to `characters.current_health`,
- defeat writes `0` to `characters.current_health`.

The synchronization occurs in the same transaction as the final combat action.

### D9: Persistent combat events

Status: APPROVED

Add a new table named:

```txt
combat_session_events
```

Each event record stores:

- combat session ID,
- resolved turn number,
- event order within that turn,
- event type,
- complete event data as JSONB,
- creation timestamp.

Session state and events produced by one action are persisted atomically.

Either the state and all events are committed, or none of them are committed.

The existing `combat_logs` table remains reserved for later final-combat summaries.

### D10: Combat log endpoint source

Status: APPROVED

The M5 combat log endpoint reads from `combat_session_events`.

Events are ordered by:

1. resolved turn number,
2. event order within the turn.

The endpoint supports active and completed sessions.

Every request validates that:

- the character belongs to the authenticated account,
- the combat session belongs to that character.

M5 does not create final records in `combat_logs`.

### D11: Production randomness

Status: APPROVED

M5 provides M4 with a server-controlled `RandomSource` implemented using `node:crypto`.

Rules:

- the client does not provide a seed,
- the client does not provide random rolls,
- the client does not provide combat outcomes,
- RNG state is not stored in `combat_sessions`,
- resolved state and events are persisted immediately,
- tests use deterministic injected random sources.

A rolled-back transaction leaves no persistent state or events.

### D12: Persistent session status

Status: APPROVED

Map M4 statuses to database statuses:

```txt
InProgress     -> Active
PlayerVictory  -> Victory
PlayerDefeat   -> Defeat
```

When combat ends, persist:

- final status,
- final Health values,
- final turn number,
- `ended_at`,
- final-round events.

Add a nullable `defeat_reason` column to `combat_sessions`.

Allowed defeat reasons:

```txt
PlayerHealthDepleted
TurnLimitExceeded
```

Rules:

- `Active` requires `defeat_reason = NULL`,
- `Victory` requires `defeat_reason = NULL`,
- `Defeat` requires a valid defeat reason.

The existing `Abandoned` status remains in the schema but is not produced by M5.

### D13: Active and completed session retrieval

Status: APPROVED

The active-combat endpoint is:

```http
GET /characters/:characterId/combat
```

It returns only the character's active combat session.

If no active session exists, return:

```txt
COMBAT_SESSION_NOT_FOUND
```

A specific active or completed session is retrieved through:

```http
GET /characters/:characterId/combat/:combatSessionId
```

A specific session log is retrieved through:

```http
GET /characters/:characterId/combat/:combatSessionId/log
```

All endpoints enforce account ownership and session-to-character ownership.

### D14: API error semantics

Status: APPROVED

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

The API must not reveal whether another account's combat session exists.

Unauthorized or foreign session access is represented as an unavailable session.

### D15: Combat operation response

Status: APPROVED

Combat start and combat action responses contain the current persistent session view:

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

For start and action operations, `events` contains only events generated by the current request.

The full event history is available through the dedicated log endpoint.

### D16: Combat-start request input

Status: APPROVED

The combat-start request contains only:

```ts
{
  monsterCode: string;
}
```

The client does not provide:

- character statistics,
- monster statistics,
- Energy cost,
- initial Health,
- eligibility state,
- timestamps,
- random results.

All trusted values are loaded and validated by the server.

### D17: Active-session action endpoint

Status: APPROVED

Combat actions use:

```http
POST /characters/:characterId/combat/actions
```

The request body contains:

```ts
{
  expectedTurn: number;
  action: {
    type: "basic_attack";
  };
}
```

The body does not contain `combatSessionId`.

The operation always targets the character's current active session.

If no active session exists, return `COMBAT_SESSION_NOT_FOUND`.

### D18: Application time

Status: APPROVED

M5 uses the existing injected `Clock`.

Each operation reads time once:

```ts
const observedAt = clock.now();
```

The same `observedAt` value is used throughout the transaction for:

- resource regeneration,
- session start time,
- session end time,
- event creation time when assigned explicitly,
- eligibility rules that depend on time.

M5 application and domain code do not call `Date.now()` directly.

### D19: Monster eligibility at combat start

Status: APPROVED

Combat start revalidates all monster-access rules inside the transaction:

- character level,
- Normal and MiniBoss cooldown,
- Task Boss lifecycle state,
- Daily Boss active rotation,
- Daily Boss remaining attempts.

The server does not trust a previous read from the monster-discovery endpoints.

If eligibility fails:

- no session is created,
- no Energy is deducted,
- transactional regeneration writes are rolled back,
- the API returns `MONSTER_NOT_ELIGIBLE`.

### D20: Terminal combat scope

Status: APPROVED

M5 persists terminal combat state but does not apply combat consequences beyond Health synchronization.

M5 persists:

- `Victory` or `Defeat`,
- defeat reason,
- final Health values,
- final turn number,
- `ended_at`,
- final-round events,
- final character Health.

M5 does not implement:

- Experience rewards,
- Gold rewards,
- loot generation,
- level changes,
- death Experience penalties,
- Blessing consumption,
- monster cooldown writes,
- Bestiary updates,
- kill statistics,
- Task Boss progression,
- final `combat_logs` retention,
- boss-attempt consumption caused by the result.

These remain later-milestone responsibilities.

## Required schema changes

M5 requires a new tracked migration after migration `087`.

The migration must:

1. Extend `combat_sessions` with:
   - character maximum Health snapshot,
   - character Attack snapshot,
   - character Defense snapshot,
   - monster maximum Health snapshot,
   - monster Attack snapshot,
   - monster Defense snapshot,
   - nullable defeat reason.

2. Strengthen session constraints:
   - current turn is between `1` and `100`,
   - snapshot statistics are valid,
   - status and defeat reason are consistent.

3. Create `combat_session_events` with:
   - primary key,
   - combat session foreign key,
   - turn number,
   - order within turn,
   - event type,
   - JSONB event data,
   - creation timestamp,
   - unique ordering constraint per session and turn,
   - lookup index for ordered log retrieval.

## Planned endpoints

```http
POST /characters/:characterId/combat
GET /characters/:characterId/combat
GET /characters/:characterId/combat/:combatSessionId
POST /characters/:characterId/combat/actions
GET /characters/:characterId/combat/:combatSessionId/log
```

All endpoints require authentication and character ownership.

## Transaction boundaries

### Fight start

1. Read `observedAt` from `Clock`.
2. Begin transaction.
3. Lock the owned character.
4. Reject an existing active session.
5. Apply resource regeneration.
6. Load and validate the monster by stable code.
7. Revalidate monster eligibility.
8. Validate positive character Health.
9. Validate available Energy.
10. Calculate effective character statistics.
11. Snapshot player and monster combat statistics.
12. Deduct Energy exactly once.
13. Create the active combat session.
14. Commit.

### Combat action

1. Read `observedAt` from `Clock`.
2. Begin transaction.
3. Lock the active session.
4. Validate account and character ownership.
5. Validate active status.
6. Validate `expectedTurn`.
7. Reconstruct the M4 `CombatState` from snapshots and current Health.
8. Resolve the action using server-controlled `RandomSource`.
9. Persist the new session state.
10. Persist ordered events.
11. Synchronize character Health if combat becomes terminal.
12. Commit.

## Concurrency guarantees

M5 must guarantee:

- one active combat per character,
- Energy cannot be deducted twice by concurrent starts,
- one turn cannot be resolved twice,
- stale `expectedTurn` requests are rejected,
- session state and events remain atomic,
- terminal Health synchronization is atomic,
- combat remains recoverable after application restart.

## Out of scope

M5 does not implement:

- spells,
- consumables,
- active combat effects,
- monster abilities,
- rewards,
- loot,
- Experience or Gold changes,
- death penalties,
- cooldown writes,
- Bestiary writes,
- kill statistics,
- Task Boss progression,
- final combat-log retention,
- multiple targets,
- escape or abandonment actions.

## Approval result

All blocking decisions D1-D20 were reviewed and explicitly approved.

Implementation may begin only from the semantics recorded in this document.

Any newly discovered conflict must be documented and approved before implementation continues.