# Combat Logs

## ENTITY

`CombatLogs`

## PRIMARY KEY

`CombatLogId`

## FOREIGN KEYS

`CharacterId`
→ `Characters.CharacterId'

`MonsterId`
→ `Monsters.MonsterId`

`CombatSessionId`
→ `CombatSessions.CombatSessionId`

## CARDINALITY

```text
Characters
└── CombatLogs (1:N)

Monsters
└── CombatLogs (1:N)

CombatSessions
└── CombatLogs (1:1)
```

## PURPOSE

Reserved for final whole-combat summaries and recent combat history.

Planned uses include:

- fight analysis,
- death review,
- boss review,
- recent combat history,
- compact summaries of completed encounters.

`CombatLogs` is not the source of incremental combat events implemented in M5.

## CORE COLUMNS

### Identity

- `CombatLogId`
- `CombatSessionId`
- `CharacterId`
- `MonsterId`

### Result

`CombatResult`

Supported values:

- `Victory`
- `Defeat`

### Summary

- `TurnCount`
- `StartedAt`
- `EndedAt`
- `CombatDataJson`
- `CreatedAt`

## INDEXES

- Primary-key index on `CombatLogId`.
- Character lookup index.
- Monster lookup index.
- Creation-time lookup index.

## RELATIONSHIP WITH COMBAT SESSION EVENTS

M5 stores incremental, per-action combat events in:

`CombatSessionEvents`

These events include:

- resolved turn number,
- event order within the turn,
- event type,
- complete event payload,
- creation timestamp.

The M5 combat-log endpoint reads from `CombatSessionEvents`, not from `CombatLogs`.

Implemented endpoint:

```http
GET /characters/:characterId/combat/:combatSessionId/log
```

The endpoint:

- requires authentication,
- validates character ownership,
- validates that the session belongs to the selected character,
- does not disclose foreign session existence,
- returns events ordered by turn number and event order.

## SEPARATION OF RESPONSIBILITIES

### CombatSessionEvents

Stores the authoritative incremental event stream generated after every accepted combat action.

Used by M5 for:

- atomic event persistence,
- deterministic event ordering,
- combat-log retrieval through HTTP,
- reconstruction of action-by-action combat history.

### CombatLogs

Reserved for later final summaries of completed combat.

Planned uses include:

- recent-combat history,
- compact fight summaries,
- death review,
- boss review,
- final replay or diagnostic data.

The two entities are not interchangeable.

## M5 IMPLEMENTATION STATUS

M5 does not create, update, retain, or delete records in `CombatLogs`.

Victory does not create a `CombatLogs` record in M5.

Defeat does not create a `CombatLogs` record in M5.

M5 persists incremental events exclusively in `CombatSessionEvents`.

## PLANNED BUSINESS RULES

The following rules describe future behavior and are not implemented in M5:

- A completed combat may create one final `CombatLogs` record.
- Final combat logs are immutable.
- A character may retain a maximum of ten final combat logs.
- The oldest final logs may be removed when the retention limit is exceeded.
- `CombatDataJson` may store a final summary or replay representation.
- Victory and defeat settlement may write final log data within the same transaction as progression changes.

The precise implementation belongs to M6: Victory, Death, and Progression, or a later approved milestone.

## NOT IMPLEMENTED IN M5

- Final combat-summary creation.
- Automatic log creation after victory.
- Automatic log creation after defeat.
- Retention of the newest ten final logs.
- Automatic removal of old logs.
- Final replay generation.
- Victory rewards.
- Experience or Gold changes.
- Loot generation.
- Death penalties.
- Blessing consumption.
- Monster cooldown recording.
- Bestiary progression.
- Monster kill statistics.
- Task Boss progression.