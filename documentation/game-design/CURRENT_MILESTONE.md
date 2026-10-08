# Current Milestone

## Milestone

M5: Persistent Combat API

## Status

Completed.

## Objective

Connect the pure M4 combat engine to authenticated HTTP endpoints and persistent PostgreSQL combat sessions.

## Implemented scope

- Persistent combat-session schema.
- Combat-ready player and monster statistic snapshots.
- Persistent current Health and turn state.
- Persistent terminal status and defeat reason.
- Ordered combat-session events.
- Transactional combat start.
- Transactional combat-action resolution.
- Active combat retrieval.
- Specific combat-session retrieval.
- Ordered combat-log retrieval.
- Authenticated combat HTTP API.
- Character and session ownership isolation.
- Server-controlled cryptographic randomness.
- Application-controlled time through `Clock`.
- Rollback and concurrency protection.
- Full unit, PostgreSQL integration, HTTP integration, and regression coverage.

## HTTP API

Implemented endpoints:

```http
POST /characters/:characterId/combat
GET /characters/:characterId/combat
GET /characters/:characterId/combat/:combatSessionId
POST /characters/:characterId/combat/actions
GET /characters/:characterId/combat/:combatSessionId/log
```

All combat endpoints require authentication.

All operations validate that the character belongs to the authenticated account.

Specific session and log endpoints also validate that the session belongs to the selected character.

Foreign characters and sessions are not disclosed.

## Start-combat request

```json
{
  "monsterCode": "stable_monster_code"
}
```

Combat start:

1. Reads one timestamp from `Clock`.
2. Opens a PostgreSQL transaction.
3. Locks the owned active character with `FOR UPDATE`.
4. Rejects an existing active combat.
5. Applies authoritative resource regeneration.
6. Loads the monster by stable code.
7. Revalidates monster eligibility.
8. Requires positive character Health.
9. Validates available Energy.
10. Calculates authoritative effective character statistics.
11. Deducts Energy exactly once.
12. Persists updated character resources.
13. Creates the active combat session with combat-ready snapshots.
14. Commits the transaction.
15. Returns the current session view.

Any failure rolls back the whole transaction.

Concurrent combat-start requests cannot create multiple active sessions or deduct Energy more than once.

## Combat-action request

```json
{
  "expectedTurn": 1,
  "action": {
    "type": "basic_attack"
  }
}
```

Rules:

- `expectedTurn` must be a positive safe integer.
- The action must be a JSON object.
- The action may contain only `type`.
- M5 currently supports only `basic_attack`.
- Clients cannot submit random values, combat results, statistics, timestamps, or damage.
- The action endpoint resolves the character's current active session.

Combat action:

1. Reads one timestamp from `Clock`.
2. Opens a PostgreSQL transaction.
3. Locks the owned active session with `FOR UPDATE`.
4. Compares `expectedTurn` with the locked session turn.
5. Reconstructs the M4 combat state from persistent snapshots.
6. Resolves the action through the pure M4 engine.
7. Uses server-controlled cryptographic randomness.
8. Persists the resulting session state.
9. Persists ordered combat events.
10. Synchronizes terminal character Health when required.
11. Commits the transaction.
12. Returns the current session view and current-operation events.

A stale action does not resolve combat or modify persistent state.

Concurrent requests cannot resolve the same turn twice.

## Persistence

Migration:

```txt
088_persistent_combat_api.sql
```

The migration:

- strengthens persistent combat-state constraints,
- adds combat-ready statistic snapshots,
- supports persistent defeat reasons,
- enforces valid turn values,
- creates `combat_session_events`,
- preserves one active combat per character,
- supports deterministic event ordering.

Persistent combat sessions survive application restarts.

The database stores all combat statistics required to reconstruct the M4 combat state without recalculating equipment or progression during an active fight.

## Combat-session events

Each persisted event stores:

- combat-session ID,
- resolved turn,
- event order within the turn,
- event type,
- complete event data as JSONB,
- creation timestamp.

Event logs are returned in deterministic order:

1. turn number,
2. event order.

The M5 log endpoint reads from `combat_session_events`.

The older `combat_logs` table remains outside the incremental M5 action flow.

## Retrieval

### Active combat

```http
GET /characters/:characterId/combat
```

Returns only the character's active combat session.

If no active session exists, the API returns:

```txt
COMBAT_SESSION_NOT_FOUND
```

### Specific session

```http
GET /characters/:characterId/combat/:combatSessionId
```

Returns an owned active or completed combat session.

Foreign or unavailable sessions return the same not-found response.

### Combat log

```http
GET /characters/:characterId/combat/:combatSessionId/log
```

Returns the complete ordered persistent event log for an owned session.

## Randomness and time

Production combat uses:

```ts
CryptoRandomSource
```

It implements:

```ts
interface RandomSource {
  nextFloat(): number;

  nextInt(
    minimum: number,
    maximum: number
  ): number;
}
```

Production combat does not use `Math.random()`.

Application services receive time through `Clock`.

The pure M4 combat engine remains independent from PostgreSQL, HTTP, system time, and cryptographic APIs.

## Error handling

Stable application errors cover:

- missing or foreign characters,
- missing or foreign combat sessions,
- an existing active combat,
- stale expected turns,
- insufficient Energy,
- depleted character Health,
- ineligible monsters,
- invalid persistent combat state,
- malformed HTTP requests,
- unsupported actions,
- authentication failure.

HTTP errors use the existing application error mapper.

## Concurrency guarantees

M5 guarantees:

- one active combat per character,
- one Energy deduction per successful combat start,
- concurrent starts cannot create duplicate sessions,
- concurrent actions cannot resolve the same turn twice,
- stale actions are rejected after lock acquisition,
- session updates and event inserts are atomic,
- terminal Health synchronization is atomic,
- failed transactions roll back all related changes.

## Implemented module structure

```txt
src/modules/combat/
+-- application/
|   +-- combat-session.errors.ts
|   +-- combat-session.models.ts
|   +-- combat-session.repository.ts
|   +-- get-active-combat.service.ts
|   +-- get-combat-log.service.ts
|   +-- get-combat-session.service.ts
|   +-- resolve-combat-action.service.ts
|   +-- start-combat.service.ts
+-- domain/
|   +-- combat-attack.ts
|   +-- combat-effects.ts
|   +-- combat-engine.ts
|   +-- combat-validation.ts
|   +-- combat.constants.ts
|   +-- combat.errors.ts
|   +-- combat.types.ts
+-- http/
|   +-- combat-http.handler.ts
|   +-- combat-http.request.ts
+-- infrastructure/
|   +-- crypto-random-source.ts
|   +-- postgres-combat.mapper.ts
|   +-- postgres-combat-session.repository.ts
+-- ports/
    +-- random-source.ts
```

## Verification

Verified during M5 completion:

- PostgreSQL connection passed.
- Database contains 80 tables.
- 88 migrations are applied.
- 0 migrations are pending.
- TypeScript typecheck passed.
- Production build passed.
- 60 test files passed.
- 361 tests passed.
- Combat unit tests passed.
- PostgreSQL integration tests passed.
- HTTP integration tests passed.
- Transaction rollback tests passed.
- Concurrent combat-start tests passed.
- Concurrent combat-action tests passed.
- Full five-endpoint authenticated combat flow passed.
- Full regression suite passed.
- No whitespace errors were detected.
- The M5 branch was pushed and synchronized with `origin/m5/persistent-combat-api`.

## Out of scope

The following remain outside M5:

- victory rewards,
- Experience rewards,
- Gold rewards,
- loot generation,
- death penalties,
- blessing consumption,
- monster kill statistics,
- Bestiary progression,
- Task Boss progression,
- monster cooldown writes,
- final combat summaries in `combat_logs`,
- player spells,
- combat consumables,
- monster abilities,
- buffs and debuffs,
- damage and healing over time,
- multiple targets,
- escape,
- combat abandonment.

## Completion log

M5 Persistent Combat API completed and verified.

The next milestone is M6: Victory, Death, and Progression.