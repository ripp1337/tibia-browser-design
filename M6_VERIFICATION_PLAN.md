# M6 Verification Plan

## Milestone

M6: Victory, Death, and Progression

## Purpose

This plan defines the mandatory verification gates for M6. It converts the approved decisions D1-D25 from `M6_SOURCE_AUDIT.md` into executable checks.

M6 is complete only when every mandatory gate passes and the repository is clean.

## Verification principles

- Verify behavior, not only implementation structure.
- Prefer deterministic unit tests for formulas and state transitions.
- Use PostgreSQL integration tests for transactions, locks, constraints, rollback, retention, and exactly-once guarantees.
- Use authenticated HTTP tests for the public response contract and ownership isolation.
- Never trust client-provided rewards, timestamps, statistics, outcomes, or random values.
- Use injected `Clock` and `RandomSource` in tests.
- Use `bigint` for Experience, Gold, reward snapshots, progression counters, and streaks.
- Treat applied migrations and current database constraints as authoritative over stale generated metadata.
- A terminal action and its settlement must commit or roll back as one operation.

## Required verification commands

The final implementation must identify and run the repository's existing canonical scripts for:

```text
PostgreSQL connection
Migration status
TypeScript typecheck
Production build
Unit tests
PostgreSQL integration tests
HTTP integration tests
Full regression suite
Git diff validation
Git working-tree status
```

Do not invent replacement commands when canonical package scripts already exist.

## Gate V1: Baseline before implementation

Before modifying M6 application behavior, verify:

- the branch is `m6/victory-death-progression`,
- migrations 001 through 088 are applied,
- pending migrations equal 0,
- the M5 test suite passes,
- typecheck passes,
- production build passes,
- PostgreSQL connection passes,
- the working tree contains only intentional M6 planning files.

Evidence to record:

- branch name,
- migration count,
- pending migration count,
- test-file count,
- test count,
- build result,
- typecheck result.

## Gate V2: Migration 089

Create and verify:

```text
database/migrations/089_victory_death_progression.sql
```

### Required schema changes

Verify that migration 089:

- adds `monsters.experience_reward BIGINT NOT NULL DEFAULT 0`,
- rejects negative `experience_reward`,
- adds `combat_sessions.settled_at`,
- adds `combat_sessions.monster_experience_reward`,
- adds `combat_sessions.monster_gold_min`,
- adds `combat_sessions.monster_gold_max`,
- rejects negative reward snapshots,
- rejects `monster_gold_max < monster_gold_min`,
- creates `character_blessings`,
- enforces one active Blessing per character,
- cascades Blessing deletion when its character is deleted,
- adds `character_statistics.current_no_death_streak`,
- rejects a negative current streak,
- adds the recent-combat-log index,
- preserves unique `combat_logs.combat_session_id`,
- removes `Abandoned` from valid combat-session statuses,
- enforces the approved `ended_at` and `settled_at` relationship.

### Migration-state matrix

Verify database constraints for:

```text
Active:
  ended_at = NULL
  settled_at = NULL

Victory:
  ended_at != NULL
  settled_at != NULL
  defeat_reason = NULL

Defeat:
  ended_at != NULL
  settled_at != NULL
  defeat_reason != NULL
```

Reject:

- terminal session without settlement,
- active session with settlement,
- `Abandoned`,
- Victory with defeat reason,
- Defeat without defeat reason.

### Migration execution

Verify:

- migration 089 applies successfully after 088,
- migration status reports 89 applied migrations,
- pending migrations equal 0,
- a clean database can apply all migrations from 001 through 089,
- migration 089 is transactional,
- failed migration execution does not leave a partial schema.

## Gate V3: Monster Experience data pipeline

Verify the complete authoritative monster-data pipeline.

### Source validation

The monster source must contain required `experience_reward`.

Reject:

- missing header,
- blank value,
- non-integer value,
- negative value,
- value above PostgreSQL `BIGINT`,
- malformed numeric text.

Accept:

- zero only for an explicitly approved technical exception,
- positive `BIGINT`-range integers for combat monsters.

### Import behavior

Verify:

- initial import writes `experience_reward`,
- repeat import updates by stable monster `code`,
- import does not derive Experience from monster level,
- dry run reports the field without mutating data,
- failed validation performs no partial import,
- the importer fails clearly when migration 089 is unavailable,
- development monsters receive explicit non-zero values suitable for tests.

### Application mapping

Verify `experienceReward` through:

- PostgreSQL row type,
- monster mapper,
- repository result,
- domain/application model,
- combat-start reward snapshot,
- relevant API or internal view where applicable.

## Gate V4: Canonical Experience curve

Test the pure Experience threshold function.

Required anchors:

```text
XP(1)   = 0
XP(2)   = 100
XP(3)   = 200
XP(8)   = 4,200
XP(20)  = 98,800
XP(40)  = 917,800
XP(50)  = 1,847,300
XP(100) = 15,694,800
```

Verify:

- every accepted level is an integer `>= 1`,
- thresholds are exact `bigint` values,
- thresholds increase monotonically,
- level lookup returns the highest reached level,
- exact thresholds produce the new level,
- one Experience below a threshold produces the previous level,
- zero Experience returns level 1,
- very large valid Experience is handled efficiently,
- lookup does not iterate from level 1 for every level,
- values exceeding supported PostgreSQL `BIGINT` are rejected,
- invalid level and Experience inputs are rejected.

## Gate V5: Reward calculation

Test pure reward calculations independently from PostgreSQL.

### Experience reward

Verify:

```text
finalExperience = floor(
  baseExperience * (100 + experienceBonusPercent) / 100
)
```

### Gold reward

Verify:

```text
finalGold = floor(
  baseGold * (100 + goldBonusPercent) / 100
)
```

Test:

- zero base reward,
- zero bonus,
- integer bonus,
- fractional bonus,
- multiple additive bonus sources,
- final rounding down only once,
- maximum valid `BIGINT` boundary,
- overflow rejection,
- negative base or bonus rejection where prohibited.

### Gold randomness

Verify:

- inclusive minimum,
- inclusive maximum,
- equal minimum and maximum,
- server-controlled `RandomSource`,
- invalid RNG output rejection,
- no Gold roll on Defeat,
- exactly one Gold roll during successful Victory settlement.

## Gate V6: Reward snapshots at combat start

Verify that a newly created combat session stores:

- `monster_experience_reward`,
- `monster_gold_min`,
- `monster_gold_max`.

Test:

- snapshots equal the monster values at start,
- client input cannot override snapshots,
- later monster-data changes do not change an active session,
- a later new session receives updated monster values,
- failed combat start stores no session or snapshots,
- concurrent combat starts create one session and deduct Energy once,
- Daily Boss attempt consumption and reward snapshots commit together.

## Gate V7: Victory settlement

For a terminal Victory action, verify atomically:

- ending action events are stored once,
- base Experience comes from the session snapshot,
- base Gold uses the session snapshot range,
- current reward bonuses are loaded at settlement,
- final Experience is awarded once,
- final Gold is awarded once,
- level is recalculated from total Experience,
- multiple levels may be gained,
- maximum resources are recalculated,
- current Health gains the maximum-Health increase,
- current Mana gains the maximum-Mana increase,
- Energy is not restored,
- Energy is clamped to its new maximum,
- character statistics are updated,
- Bestiary is updated,
- Task Boss progress is updated where applicable,
- standard cooldown is written where applicable,
- fight-based boosts are consumed,
- Blessing is not consumed,
- Daily Boss victory progress is updated where applicable,
- one final combat log is written,
- retention runs,
- session status and `settled_at` are written last,
- the returned settlement matches committed state.

## Gate V8: Defeat settlement

Test both defeat reasons:

```text
PlayerHealthDepleted
TurnLimitExceeded
```

For each, verify:

- no Experience reward,
- no Gold reward,
- death Experience loss is applied once,
- level is recalculated,
- multiple levels may be lost,
- Experience never drops below 0,
- level never drops below 1,
- maximum resources are recalculated,
- current Mana and Energy are clamped but not restored,
- total deaths increases,
- current no-death streak resets,
- Bestiary and Task Boss kill progress do not change,
- standard cooldown is written where applicable,
- fight-based boosts are consumed,
- one final combat log is written,
- session is settled exactly once.

Additional Health checks:

- `PlayerHealthDepleted` persists Health 0,
- `TurnLimitExceeded` preserves actual remaining Health.

## Gate V9: Death modifiers and Blessing

Verify all four combinations:

```text
Not promoted, not blessed -> 10%
Promoted, not blessed     -> 8%
Not promoted, blessed     -> 6%
Promoted and blessed      -> 4%
```

For every case, verify:

- loss is based on Experience before death,
- loss is rounded down,
- level follows remaining Experience,
- Promotion is not consumed or changed,
- active Blessing is deleted exactly once after Defeat,
- Blessing remains after Victory,
- Blessing is consumed even when rounded loss is 0,
- concurrent terminal calls cannot consume one Blessing twice,
- rollback restores the Blessing record.

## Gate V10: Resource changes after level change

### Level gain

Verify cumulative changes across one and multiple levels:

- maximum Health,
- maximum Mana,
- maximum Energy,
- current Health increase,
- current Mana increase,
- unchanged current Energy except clamping,
- no full heal.

Reference example:

```text
Before:
Level 1
Health 40/180
Mana 10/35

After Level 2:
Health 70/210
Mana 25/50
```

### Level loss

Verify:

- maximum values decrease correctly,
- current Mana and Energy are clamped,
- resources are not restored,
- Health follows the approved defeat-reason rule,
- effective-statistic calculations remain consistent with stored level and maxima.

## Gate V11: Character lifetime statistics

### Victory

Verify:

- `total_monsters_killed += 1`,
- `total_bosses_killed += 1` for Mini Boss, Task Boss, and Daily Boss,
- `total_daily_bosses_killed += 1` only for Daily Boss,
- `total_gold_earned += finalGold`,
- `highest_gold_owned` uses the post-reward balance,
- strongest monster uses `power_score`,
- strongest boss uses `power_score`,
- total damage dealt and taken use authoritative events,
- highest physical hit uses authoritative events,
- current no-death streak increases,
- longest no-death streak updates only when exceeded.

### Defeat

Verify:

- `total_deaths += 1`,
- damage statistics still update,
- current no-death streak resets to 0,
- kill and Gold-earned counters do not increase.

### Unsupported future statistics

Verify M6 does not fabricate changes to:

- total healing done,
- total Mana spent,
- highest spell hit.

## Gate V12: Combat event aggregation

Use server-generated `combat_session_events` to verify:

- player attack damage contributes to damage dealt,
- monster attack damage contributes to damage taken,
- misses contribute zero damage,
- successful zero-damage hits remain distinguishable from misses,
- highest physical hit is correct,
- all turns are included,
- ending-action events are included exactly once,
- client values cannot affect aggregation,
- malformed persisted event data fails settlement and rolls back.

## Gate V13: Bestiary

### First Victory

Verify:

- one `bestiary_entries` row is inserted,
- one `bestiary_statistics` row is inserted,
- `kill_count = 1`,
- `first_kill_at = settlementTime`,
- `last_kill_at = settlementTime`.

### Repeat Victory

Verify:

- no duplicate Bestiary entry,
- no duplicate statistics row,
- kill count increments,
- first-kill timestamp remains unchanged,
- last-kill timestamp updates.

### Defeat

Verify no Bestiary mutation.

### Character isolation

Verify one character's kills never unlock or modify another character's Bestiary.

## Gate V14: Task Boss progression

### Ordinary task monster Victory

When status is `ACTIVE`:

- increment `task_progress`,
- cap at `required_kills`,
- set `UNLOCKED` when threshold is reached.

When status is `UNLOCKED` or `WAITING_FOR_REUNLOCK`:

- do not increase progress.

### Ordinary task monster Defeat

Verify no task-progress mutation.

### Task Boss Victory

Verify lookup through `monster_tasks.boss_id` and transition:

```text
UNLOCKED -> WAITING_FOR_REUNLOCK
```

### Task Boss Defeat

Verify status remains `UNLOCKED` so the unlocked attempt is not consumed by failure unless a later approved design explicitly changes this rule.

### Isolation and concurrency

Verify:

- unrelated tasks are unchanged,
- another character's task is unchanged,
- duplicate settlement cannot increment progress twice,
- threshold concurrency cannot over-increment or produce invalid status.

## Gate V15: Standard monster cooldown

### Normal Monster

After Victory and Defeat:

```text
availableAt = settlementTime + cooldown_seconds
```

### Mini Boss

After Victory and Defeat:

```text
availableAt = settlementTime
            + cooldown_seconds
            + additional_cooldown_seconds
```

Verify:

- UPSERT creates a missing cooldown,
- UPSERT replaces an existing cooldown,
- zero total duration stores no cooldown,
- authoritative `Clock` is used,
- rollback removes the cooldown change,
- Task Boss stores no standard cooldown,
- Daily Boss stores no standard cooldown,
- character isolation remains intact.

## Gate V16: Daily Boss attempts and victories

### Combat start

Verify atomically:

- authoritative current rotation is selected,
- attempt limit is checked,
- `attempts_used_in_rotation += 1`,
- `total_attempts += 1`,
- `last_attempt_at` is set from `Clock`,
- Energy is deducted once,
- the combat session is created once,
- failed start rolls all changes back,
- concurrent starts cannot exceed the limit or consume one available attempt twice.

### Settlement

Victory:

- `total_victories += 1`,
- `last_victory_at` updates,
- `highest_tier_defeated` increases only when the tier is higher.

Defeat:

- does not update victory fields,
- does not refund the attempt.

Neither result creates a standard monster cooldown.

## Gate V17: Fight-based boosts

For active `GoldBoost` and `ExperienceBoost` with `duration_type = 'Fights'`, verify:

- Victory uses the bonus before decrementing it,
- Defeat grants no reward but still decrements it,
- every completed fight consumes exactly one use,
- multiple active fight-based buffs are each decremented once,
- counter greater than 1 remains with decremented value,
- counter reaching 0 deletes the row,
- Permanent buffs remain unchanged,
- time-based buffs remain unchanged,
- duplicate settlement does not decrement twice,
- rollback restores original counters.

## Gate V18: Final combat logs

For every Victory and Defeat, verify:

- exactly one `combat_logs` row,
- correct session, character, and monster IDs,
- correct result,
- correct turn count,
- correct start and end timestamps,
- valid compact `combat_data_json`,
- summary agrees with committed character and progression state,
- duplicate insertion is rejected by unique session ID,
- detailed events remain in `combat_session_events`.

### Retention

Verify:

- records 1 through 10 are retained,
- inserting record 11 deletes exactly the oldest final log,
- tie-breaking uses `combat_log_id DESC` after `created_at DESC`,
- retention is per character,
- another character's logs are untouched,
- deleting the final log does not delete its session,
- deleting the final log does not delete session events,
- rollback restores both insertion and pruning.

## Gate V19: Exactly-once settlement and concurrency

Test two concurrent requests ending the same turn.

Required result:

- one request succeeds,
- one request is rejected through existing stale-turn or terminal-session protection,
- one Experience award,
- one Gold award,
- one death loss where relevant,
- one Blessing consumption,
- one boost decrement,
- one statistics update,
- one Bestiary update,
- one Task Boss update,
- one cooldown update,
- one Daily Boss victory update,
- one final log,
- one `settled_at` value.

Also verify direct attempts to settle an already settled session perform no value-producing mutation.

## Gate V20: Transaction rollback

Inject a failure at each important terminal stage, including:

- reward calculation or validation,
- character update,
- statistics update,
- Bestiary update,
- Task Boss update,
- Daily Boss victory update,
- cooldown write,
- fight-based boost consumption,
- Blessing deletion,
- final-log insertion,
- retention pruning,
- final session update.

After every injected failure, verify:

- session remains `Active`,
- `ended_at` remains null,
- `settled_at` remains null,
- terminal action events are absent,
- Experience and Gold are unchanged,
- level and resources are unchanged,
- statistics are unchanged,
- Blessing is unchanged,
- boosts are unchanged,
- Bestiary is unchanged,
- Task Boss state is unchanged,
- Daily Boss victory state is unchanged,
- cooldown is unchanged,
- final logs are unchanged.

## Gate V21: No combat abandonment

Verify across schema, domain, persistence, HTTP, and documentation:

- `Abandoned` is not an allowed database status,
- no application status constant exposes `Abandoned`,
- mapper rejects unknown or stale `Abandoned`,
- no endpoint or action abandons combat,
- closing and reconnecting does not change active session state,
- active-session retrieval returns the unfinished fight,
- a character with an active fight cannot start another fight,
- old tests and documentation no longer present abandonment as supported or planned gameplay.

## Gate V22: Settlement response contract

### Continuing action

Verify:

```json
{
  "settlement": null
}
```

alongside the existing session and event response.

### Victory

Verify settlement contains at least:

- result,
- Experience before, base reward, final reward, lost, and after,
- Gold before, base reward, final reward, and after,
- level before and after,
- Blessing consumed flag,
- Bestiary unlock result,
- Task Boss progress result where applicable,
- cooldown timestamp where applicable.

### Defeat

Verify:

- base and final rewards are zero,
- Experience lost is populated,
- level before and after are correct,
- Blessing consumption is correct,
- cooldown is returned where applicable.

### Serialization and security

Verify:

- all `bigint` values are strings,
- timestamps use the existing HTTP date format,
- Task Boss and Daily Boss cooldown is null,
- response matches committed database state,
- foreign ownership remains undisclosed,
- client cannot request or alter settlement fields,
- existing event ordering remains unchanged.

## Gate V23: Legacy and boundary data

Verify handling of records created before migration 089:

- existing monsters receive Experience reward 0 until controlled import,
- existing sessions receive valid zero reward snapshots,
- no invalid constraint state is created,
- development handling of pre-M6 active sessions is explicitly tested,
- new sessions after import receive real rewards.

Boundary tests must include:

- zero Experience reward,
- Gold range 0..0,
- maximum valid reward snapshot,
- level 1 death,
- zero rounded death loss,
- large multiple-level gain,
- large multiple-level loss,
- turn 100 Victory,
- turn 100 Defeat,
- zero-duration cooldown,
- exactly ten existing final logs,
- no existing statistics row if test fixtures permit that state,
- first Bestiary kill and existing Bestiary kill.

## Gate V24: Regression coverage

Run and preserve all earlier guarantees:

- M1 character ownership and foundation,
- M2 effective character statistics,
- M3 discovery and eligibility,
- M4 pure deterministic combat,
- M5 persistent combat start, action, retrieval, concurrency, rollback, and HTTP behavior.

M6 changes must not weaken:

- ownership isolation,
- one active fight per character,
- Energy exact-once deduction,
- expected-turn protection,
- server authority,
- event ordering,
- deterministic pure combat transitions,
- persistent restart continuity.

## Gate V25: Final repository verification

Before declaring M6 complete, run the complete verification sequence and record exact results.

Required final state:

- PostgreSQL connection passes,
- 89 migrations applied,
- 0 pending migrations,
- migration 089 schema tests pass,
- importer validation and import tests pass,
- all M6 unit tests pass,
- all M6 PostgreSQL integration tests pass,
- all M6 HTTP integration tests pass,
- all concurrency tests pass,
- all rollback tests pass,
- complete regression suite passes,
- TypeScript typecheck passes,
- production build passes,
- `git diff --check` produces no output,
- generated dumps and documentation contain no stale `Abandoned` contract,
- Git working tree is clean after the completion commit and push.

## Decision traceability

```text
D1  -> V7, V18, V24
D2  -> V7, V8, V19, V20
D3  -> V4, V7, V8, V10
D4  -> V3, V5, V6
D5  -> V4, V7, V8
D6  -> V10
D7  -> V8, V9
D8  -> V2, V9
D9  -> V5, V7
D10 -> V11, V12
D11 -> V13, V14
D12 -> V15
D13 -> V18
D14 -> V16
D15 -> V17
D16 -> V22
D17 -> V2
D18 -> V4, V5, V10, V12, V24
D19 -> V3
D20 -> V8, V10
D21 -> V19, V20
D22 -> V2, V7, V8, V20
D23 -> V21
D24 -> V6
D25 -> V5, V7, V17
```

## Definition of done

M6 is done only when:

- every approved decision D1-D25 is implemented,
- every mandatory gate V1-V25 passes,
- no known duplication path exists,
- no terminal session can exist without completed settlement,
- no completed fight can be settled twice,
- no client-authored reward or outcome is trusted,
- all earlier milestone guarantees remain intact,
- documentation describes the implemented behavior,
- final verification evidence is recorded,
- the branch is committed, pushed, and clean.
