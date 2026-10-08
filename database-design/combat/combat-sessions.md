# Combat Sessions

## ENTITY

`CombatSessions`

## PRIMARY KEY

`CombatSessionId`

## FOREIGN KEYS

`CharacterId`
→ `Characters.CharacterId`

`MonsterId`
→ `Monsters.MonsterId`

## CARDINALITY

```text
Characters
└── CombatSessions (1:N)

Monsters
└── CombatSessions (1:N)

CombatSessions
├── CombatEffects (1:N)
├── CombatSpellCooldowns (1:N)
├── CombatSessionEvents (1:N)
└── CombatLogs (1:1, reserved for a later milestone)
```

## REFERENCED BY

- `CombatEffects.CombatSessionId`
- `CombatSpellCooldowns.CombatSessionId`
- `CombatSessionEvents.CombatSessionId`
- `CombatLogs.CombatSessionId`

## PURPOSE

Stores active, completed, defeated, and abandoned combat encounters.

Acts as the authoritative server-side persistent combat state.

The session stores all combat-ready statistics required to reconstruct the pure combat-domain state. Active combat does not recalculate equipment, progression, or effective statistics after the session has started.

## CORE COLUMNS

### Identity

- `CombatSessionId`
- `CharacterId`
- `MonsterId`

### Status

`Status`

Supported values:

- `Active`
- `Victory`
- `Defeat`
- `Abandoned`

`DefeatReason`

Supported values:

- `PlayerHealthDepleted`
- `TurnLimitExceeded`

### Turn state

- `CurrentTurn`

### Current combat resources

- `CharacterHealth`
- `CharacterMana`
- `MonsterHealth`

### Character statistic snapshot

- `CharacterMaximumHealth`
- `CharacterAttack`
- `CharacterDefense`

### Monster statistic snapshot

- `MonsterMaximumHealth`
- `MonsterAttack`
- `MonsterDefense`

### Timestamps

- `StartedAt`
- `EndedAt`
- `CreatedAt`
- `UpdatedAt`

## STATUS RULES

### Active

- `DefeatReason` must be null.
- `EndedAt` must be null.
- Character Health must be greater than zero.
- Monster Health must be greater than zero.
- The session may accept another combat action.

### Victory

- `DefeatReason` must be null.
- `EndedAt` is required.
- Character Health must be greater than zero.
- Monster Health must equal zero.
- The session cannot accept another combat action.

### Defeat

- `DefeatReason` is required.
- `EndedAt` is required.
- The session cannot accept another combat action.
- `PlayerHealthDepleted` requires Character Health to equal zero.
- `TurnLimitExceeded` requires both combatants to remain alive on turn `100`.

### Abandoned

- `EndedAt` is required.
- The session cannot accept another combat action.
- M5 does not create new abandoned sessions.
- Historical abandoned sessions remain retrievable.

## TURN RULES

- The initial turn is `1`.
- Valid turn values are from `1` through `100`.
- Turn `100` resolves normally.
- Terminal combat does not advance to another turn.
- `ExpectedTurn` from an action request is compared with the locked `CurrentTurn`.
- A stale action is rejected without changing combat state or creating events.

## RESOURCE RULES

- Character Health cannot be negative.
- Character Mana cannot be negative.
- Monster Health cannot be negative.
- Current Health cannot exceed snapshotted maximum Health.
- Active-combat Health remains isolated in the combat session.
- Character Health stored in `Characters` is synchronized when combat becomes terminal and synchronization is required.
- M5 snapshots Character Mana but does not yet implement spell actions or in-combat Mana consumption.

## STATISTIC SNAPSHOT RULES

Character combat-ready statistics are calculated authoritatively when combat starts.

The character snapshot contains:

- maximum Health,
- Attack,
- Defense.

The monster snapshot contains:

- maximum Health,
- Attack,
- Defense.

Snapshot values remain unchanged throughout the session.

Equipment, progression, character bonuses, and monster definitions are not recalculated during an active fight.

## INDEXES AND CONSTRAINTS

- Primary-key index on `CombatSessionId`.
- Character lookup index.
- Monster lookup index.
- Status lookup index.
- Partial unique index allowing only one active combat session per character.
- Valid turn constraint.
- Valid status and defeat-reason constraints.
- Non-negative resource and statistic constraints.
- Status, Health, defeat reason, and ending timestamp must form a valid persistent combat state.

## COMBAT-START TRANSACTION

Combat start:

1. Locks the owned active character using `FOR UPDATE`.
2. Rejects an existing active combat.
3. Applies authoritative resource regeneration.
4. Loads the monster by stable code.
5. Revalidates monster eligibility.
6. Requires positive Character Health.
7. Validates available Energy.
8. Calculates authoritative effective character statistics.
9. Deducts Energy exactly once.
10. Persists updated character resources.
11. Creates the active session with combat-ready snapshots.
12. Commits the transaction.

Any failure rolls back the complete operation.

Concurrent start requests cannot:

- create multiple active sessions,
- deduct Energy more than once.

## COMBAT-ACTION TRANSACTION

Combat action:

1. Locks the owned active session using `FOR UPDATE`.
2. Validates account and character ownership.
3. Compares `ExpectedTurn` with the locked turn.
4. Reconstructs the pure combat-domain state.
5. Resolves the action using server-controlled randomness.
6. Updates the persistent session state.
7. Inserts ordered combat-session events.
8. Synchronizes terminal Character Health when required.
9. Commits the transaction.

The session update and event inserts are atomic.

Concurrent action requests cannot resolve the same turn twice.

## EVENT RELATIONSHIP

Incremental combat events are stored in:

`CombatSessionEvents`

Each event stores:

- Combat Session ID,
- resolved turn number,
- event order within the turn,
- event type,
- complete event data,
- creation timestamp.

Events are retrieved in deterministic order:

1. turn number,
2. event order.

M5 does not use `CombatLogs` for incremental action events.

## OWNERSHIP AND RETRIEVAL

Combat-session access requires:

- an authenticated account,
- a character owned by that account,
- a session belonging to that character.

Foreign characters and sessions are not disclosed.

Supported retrieval endpoints:

```http
GET /characters/:characterId/combat
GET /characters/:characterId/combat/:combatSessionId
GET /characters/:characterId/combat/:combatSessionId/log
```

The active-combat endpoint returns only an `Active` session.

The specific-session endpoint may return an owned active or completed session.

The log endpoint returns ordered records from `CombatSessionEvents`.

## BUSINESS RULES

- Only one active combat session may exist per character.
- The server is authoritative.
- Combat state is never trusted from the client.
- Clients cannot provide combat statistics, damage, results, timestamps, or random values.
- Energy is deducted exactly once when combat starts.
- Combat-ready statistics are snapshotted when combat starts.
- Session state persists after every accepted action.
- Session state and generated events are persisted atomically.
- Stale actions do not modify state or create events.
- Completed sessions are read-only.
- Persistent sessions survive application restarts.
- Foreign session existence is not disclosed.
- Victory does not create a `CombatLog` entry in M5.
- Defeat does not create a `CombatLog` entry in M5.
- Final records in `CombatLogs` remain reserved for M6 or a later milestone.

## M5 IMPLEMENTATION STATUS

Implemented in M5:

- persistent combat sessions,
- combat-ready statistic snapshots,
- transactional combat start,
- transactional combat actions,
- one active session per character,
- exact-once Energy deduction,
- expected-turn validation,
- stale-action rejection,
- concurrent-request protection,
- persistent ordered events,
- active-session retrieval,
- historical-session retrieval,
- authenticated HTTP endpoints,
- ownership isolation,
- server-controlled cryptographic randomness.

Not implemented in M5:

- victory rewards,
- Experience rewards,
- Gold rewards,
- loot generation,
- death penalties,
- Blessing consumption,
- final summaries in `CombatLogs`,
- recent-log retention,
- monster cooldown writes,
- Bestiary progression,
- monster kill statistics,
- Task Boss progression,
- player spells,
- combat consumables,
- monster abilities,
- active buffs and debuffs,
- damage or healing over time,
- escape,
- combat abandonment.