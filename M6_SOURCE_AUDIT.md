# M6 Source Audit

## Milestone

M6: Victory, Death, and Progression

## Audit status

Planning audit completed after M5.

This document records the authoritative implementation decisions for M6, the verified starting state, required schema and application changes, scope boundaries, conflicts found in existing documentation, and the principal implementation risks.

## Authoritative source order

When sources disagree, use this priority:

1. Approved M6 decisions in this document.
2. Current compiling application code.
3. Applied PostgreSQL migrations and current database constraints.
4. Passing automated tests.
5. `documentation/game-design/CURRENT_MILESTONE.md`.
6. `documentation/game-design/MASTER_PROJECT_PLAN.md`.
7. Historical and descriptive database-design documents.
8. Generated metadata CSV files.

Generated metadata CSV files are supporting evidence only. They may describe an earlier schema state and must not override later migrations.

## Verified starting point

M6 starts from the completed M5 Persistent Combat API.

Verified repository and database state at M6 audit start:

- branch: `m6/victory-death-progression`,
- source-context checkpoint: `3380c69 prepare M6 source context`,
- 88 applied migrations,
- 0 pending migrations,
- persistent combat sessions,
- transactional combat start,
- transactional combat-action resolution,
- expected-turn concurrency protection,
- one active combat session per character,
- server-controlled combat randomness,
- application-controlled time through `Clock`,
- persistent ordered `combat_session_events`,
- authenticated combat HTTP endpoints,
- character and session ownership isolation.

M5 deliberately did not implement:

- victory rewards,
- Experience awards,
- Gold awards,
- death penalties,
- Promotion death modifiers,
- Blessing death modifiers or consumption,
- final summaries in `combat_logs`,
- recent final-log retention,
- monster cooldown writes,
- Bestiary progression,
- monster kill statistics,
- Task Boss progression,
- Daily Boss attempt consumption,
- loot generation.

## Current schema evidence

### Characters

`characters` already stores:

- `level`,
- `experience`,
- `gold`,
- current and maximum Health,
- current and maximum Mana,
- current and maximum Energy.

Experience and Gold use PostgreSQL `BIGINT` and must remain non-negative.

### Promotion

`character_unlocks.is_promoted` is the authoritative permanent Promotion state.

### Character statistics

`character_statistics` already stores most M6 lifetime counters:

- total Gold earned,
- highest Gold owned,
- total monsters killed,
- total bosses killed,
- total Daily Bosses killed,
- total deaths,
- total damage dealt,
- total damage taken,
- total healing done,
- total Mana spent,
- highest physical hit,
- highest spell hit,
- strongest monster killed,
- strongest boss killed,
- longest no-death streak.

The schema does not store the current no-death streak.

### Monsters and bosses

`monsters` already stores:

- `gold_min`,
- `gold_max`,
- `cooldown_seconds`,
- `power_score`,
- `energy_cost`,
- combat statistics and classification.

It does not yet store a combat Experience reward.

`bosses` stores `additional_cooldown_seconds` and identifies Mini Boss, Task Boss, and Daily Boss records.

### Bestiary and Task Boss progress

`bestiary_entries` provides character-specific first-kill discovery.

`bestiary_statistics` provides per-character, per-monster:

- kill count,
- first-kill timestamp,
- last-kill timestamp,
- Task Boss progress,
- Task Boss status.

The current status model is:

- `ACTIVE`,
- `UNLOCKED`,
- `WAITING_FOR_REUNLOCK`.

Later migration `084_task_status_refactor.sql` is authoritative over older metadata that still mentions `task_unlocked`.

`monster_tasks.monster_id` identifies the ordinary monster that builds progress. `monster_tasks.boss_id` identifies the Task Boss unlocked by that progress.

### Cooldowns

`character_cooldowns` stores character-specific monster cooldowns with a unique record per character and monster.

The current eligibility implementation applies standard cooldowns to:

- Normal Monsters,
- Mini Bosses.

It ignores standard cooldowns for:

- Task Bosses,
- Daily Bosses.

### Daily Boss progress

The current, post-migration Daily Boss progress model uses rotation-scoped attempts, including:

- `attempts_used_in_rotation`,
- `total_attempts`,
- `total_victories`,
- `last_attempt_at`,
- `last_victory_at`,
- `highest_tier_defeated`,
- `daily_boss_rotation_id`.

Migration `087_daily_boss_attempt_rotation.sql` is authoritative over older metadata that still mentions `attempts_date` and `attempts_used_today`.

### Combat sessions and events

`combat_sessions` stores active and terminal combat state, combat-ready snapshots, ending time, and defeat reason.

`combat_session_events` stores the authoritative ordered per-action event stream.

Current persistent statuses include `Active`, `Victory`, `Defeat`, and `Abandoned`. M6 will remove `Abandoned` because interrupted or abandoned combat is not part of the game design.

### Final combat logs

`combat_logs` is reserved for one compact final summary per completed session.

Its current schema already enforces unique `combat_session_id`, creating a one-to-one relationship between a completed session and its final log.

`combat_logs` is not interchangeable with `combat_session_events`.

### Buffs

`character_buffs` supports positive `GoldBoost` and `ExperienceBoost` records, including fight-based durations through:

- `duration_type = 'Fights'`,
- `duration_remaining`.

The table does not support active Blessing state and should not be extended to represent Blessing.

## Approved decisions

### D1: Loot remains outside M6

M6 does not generate equipment, materials, consumables, or other loot.

Loot generation belongs to M7. M6 settlement must remain successful without item generation and must expose a clean future extension point.

### D2: Settlement occurs inside the combat-ending transaction

When an accepted action changes a session from `Active` to `Victory` or `Defeat`, the same transaction performs the complete settlement.

There is no separate claim-rewards endpoint.

The transaction protects settlement with:

- a locked combat session,
- a locked character,
- a new `settled_at` marker,
- unique `combat_logs.combat_session_id`.

Any settlement failure rolls back the terminal action, its events, and all settlement effects.

### D3: Experience is total lifetime combat Experience

`characters.experience` stores total Experience, not progress within the current level.

Level is derived deterministically from total Experience.

A single victory may grant multiple levels. A death may remove multiple levels.

Minimum values:

- Experience: `0`,
- level: `1`.

Final Experience and Gold rewards are rounded down after all percentage modifiers are applied.

### D4: Monster Experience reward comes from the database

Each monster has one fixed `experience_reward` stored in `monsters`.

Experience is not inferred from monster level and is not hard-coded in application logic.

Gold remains a random integer from the inclusive `gold_min..gold_max` range.

### D5: Canonical Experience curve

Total Experience required for level `L` is:

```text
XP(L) = (50L^3 - 300L^2 + 850L - 600) / 3
```

Rules:

- `L >= 1`,
- calculations use `bigint`,
- no maximum level,
- level is the highest `L` where `XP(L) <= totalExperience`,
- level lookup must be efficient and must not iterate from level 1 for large values,
- overflow beyond PostgreSQL `BIGINT` is rejected.

Verified anchors:

```text
Level 1   ->          0 XP
Level 2   ->        100 XP
Level 3   ->        200 XP
Level 8   ->      4,200 XP
Level 20  ->     98,800 XP
Level 40  ->    917,800 XP
Level 50  ->  1,847,300 XP
Level 100 -> 15,694,800 XP
```

### D6: Level changes recalculate maximum resources

Canonical level-based resources remain:

```text
Maximum Health = 180 + (level - 1) * 30
Maximum Mana   = 35 + (level - 1) * 15
```

Maximum Energy uses the existing threshold function and remains capped at 200.

After level gain:

- recalculate maximum Health, Mana, and Energy,
- add the maximum Health increase to current Health,
- add the maximum Mana increase to current Mana,
- do not restore Energy,
- clamp Energy to the new maximum,
- do not fully heal the character.

After level loss:

- recalculate all maximum resources,
- do not restore resources,
- clamp current Mana and Energy to their new maxima,
- apply the D20 Health rule according to defeat reason.

### D7: Death Experience loss

Death loss is based on total Experience before the loss:

```text
Normal                 10%
Promoted                8%
Blessed                 6%
Promoted and Blessed    4%
```

Calculation:

```text
experienceLost = floor(totalExperience * lossPercent / 100)
newExperience  = totalExperience - experienceLost
newLevel       = levelFromExperience(newExperience)
```

Blessing is consumed on every defeat, even when the rounded Experience loss is zero.

Both `PlayerHealthDepleted` and `TurnLimitExceeded` use the same death-loss rules.

### D8: Active Blessing uses its own table

M6 creates `character_blessings`.

Absence of a record means no active Blessing. One record means one active Blessing.

There may be at most one active Blessing per character.

Defeat deletes the record inside settlement. Victory does not consume it.

Blessing purchase, storage, and activation endpoints remain outside M6 and belong to M13.

### D9: Victory rewards

Base Experience comes from the session snapshot of `monster_experience_reward`.

Base Gold is rolled with server-controlled `RandomSource` from the inclusive session snapshot range.

Final rewards:

```text
finalExperience = floor(baseExperience * (100 + experienceBonusPercent) / 100)
finalGold       = floor(baseGold * (100 + goldBonusPercent) / 100)
```

Bonuses are additive percentage points.

Victory grants Experience and Gold exactly once. Defeat grants neither.

Zero-value rewards are valid.

### D10: Character statistics

Victory updates:

- total monster kills,
- boss kills where applicable,
- Daily Boss kills where applicable,
- total Gold earned,
- highest Gold owned,
- strongest monster killed by `power_score`,
- strongest boss killed by `power_score`,
- total damage dealt,
- total damage taken,
- highest physical hit,
- current and longest no-death streak.

Defeat updates:

- total deaths,
- total damage dealt,
- total damage taken,
- highest physical hit,
- resets current no-death streak.

M6 does not update healing, Mana spent, or highest spell hit because M5 currently supports only basic attacks.

Migration `089` adds `current_no_death_streak BIGINT NOT NULL DEFAULT 0`.

### D11: Bestiary and Task Boss progress

Victory:

- creates a first-kill `bestiary_entries` row when missing,
- creates or updates `bestiary_statistics`,
- increments `kill_count`,
- preserves `first_kill_at`,
- updates `last_kill_at`.

For an ordinary monster configured in `monster_tasks`:

- increment progress only while status is `ACTIVE`,
- cap progress at `required_kills`,
- change status to `UNLOCKED` at the threshold.

For a defeated Task Boss:

- find the task through `monster_tasks.boss_id`,
- change the related status from `UNLOCKED` to `WAITING_FOR_REUNLOCK`.

Defeat does not change Bestiary or Task Boss progress.

Paid re-unlock remains outside M6.

### D12: Cooldown follows every completed attempt

Normal Monster and Mini Boss cooldowns start after both Victory and Defeat.

Normal Monster:

```text
availableAt = settlementTime + monsters.cooldown_seconds
```

Mini Boss:

```text
availableAt = settlementTime
            + monsters.cooldown_seconds
            + bosses.additional_cooldown_seconds
```

Rules:

- use the same authoritative settlement time,
- UPSERT the character-and-monster cooldown,
- do not store a zero-duration cooldown,
- Task Bosses do not use standard cooldowns,
- Daily Bosses do not use standard cooldowns,
- rollback settlement also rolls back cooldown changes.

### D13: Final combat log and retention

Every Victory and Defeat creates exactly one `combat_logs` row.

`combat_data_json` contains a compact final summary, including:

- result and defeat reason,
- ending resources,
- turn count,
- damage summary,
- base and final rewards,
- level before and after,
- Experience lost,
- Blessing consumption,
- Bestiary and Task Boss changes,
- cooldown result.

Detailed turns remain in `combat_session_events`.

After insertion, keep only the newest ten final logs for the character, ordered by:

1. `created_at DESC`,
2. `combat_log_id DESC`.

Deleting an old final log does not delete its combat session or event stream.

### D14: Daily Boss attempts

Daily Boss attempt use occurs at combat start, not settlement.

The start transaction:

- increments `attempts_used_in_rotation`,
- increments `total_attempts`,
- sets `last_attempt_at`,
- validates the authoritative rotation and attempt limit,
- rolls back attempt use when combat start fails.

The result never refunds an attempt.

Victory settlement:

- increments `total_victories`,
- sets `last_victory_at`,
- updates `highest_tier_defeated` when applicable.

Defeat does not modify victory fields.

### D15: Fight-based boosts

Every completed Victory or Defeat consumes one use of every active buff where `duration_type = 'Fights'`.

Reward bonuses are calculated before counters are decremented.

When `duration_remaining` becomes zero, delete the buff row.

Permanent and time-based buffs are not decremented.

Blessing does not use this mechanism.

### D16: Settlement in the action response

`POST /characters/:characterId/combat/actions` returns:

- `settlement: null` while combat remains active,
- a settlement summary when the action ends combat.

PostgreSQL `BIGINT` values are serialized as strings.

The response includes the committed result of the same transaction. There is no separate claim request and no new final-log history endpoint in M6.

### D17: One M6 migration

Create:

```text
database/migrations/089_victory_death_progression.sql
```

It must:

- add `monsters.experience_reward`,
- add combat settlement fields and reward snapshots,
- create `character_blessings`,
- add `character_statistics.current_no_death_streak`,
- add the recent-log retention index,
- replace combat-session constraints to remove `Abandoned`,
- preserve unique `combat_logs.combat_session_id`.

Existing monsters receive temporary `experience_reward = 0`. Real values arrive through the controlled data import.

### D18: Code responsibility boundaries

M6 uses pure domain functions for:

- Experience thresholds,
- level lookup,
- victory rewards,
- death loss,
- resource changes after level changes,
- combat-statistics aggregation.

A settlement service coordinates Victory and Defeat.

PostgreSQL infrastructure owns locks and atomic persistence.

The pure domain layer must not depend on SQL, system time, or implicit randomness.

### D19: Experience reward in monster source data

The monster workbook or equivalent source receives required `experience_reward`.

Validation requires:

- present value,
- integer value,
- non-negative value,
- PostgreSQL `BIGINT` range.

Repeat import updates the value by stable monster `code`.

The importer must not derive Experience from monster level.

Production validation rejects zero Experience for real combat monsters unless a record is explicitly marked as a technical exception by the approved data workflow.

### D20: Health after defeat

`PlayerHealthDepleted` stores character Health as `0`.

`TurnLimitExceeded` preserves the actual remaining Health after turn 100.

Both defeat reasons:

- apply death Experience loss,
- consume Blessing when active,
- consume fight-based boosts,
- increase total deaths,
- create cooldown where applicable,
- create a final combat log.

### D21: Transaction locks and exactly-once behavior

Use a consistent lock order:

1. `combat_sessions`,
2. `characters`,
3. `character_unlocks`,
4. `character_blessings`,
5. `character_statistics`,
6. Daily Boss or Task Boss progress,
7. fight-based buffs,
8. remaining settlement writes.

All terminal action events and settlement effects commit or roll back together.

Concurrency tests must prove that two requests cannot settle the same combat twice.

### D22: Terminal state is written last

For a terminal action:

1. lock and validate the active session,
2. resolve the action,
3. write ending-action events,
4. perform every settlement effect,
5. write final session state and `settled_at` together,
6. commit.

The database must never persist a terminal session without completed settlement.

### D23: Combat cannot be abandoned

Supported persistent statuses become:

- `Active`,
- `Victory`,
- `Defeat`.

Remove `Abandoned` from schema constraints, application models, mappers, tests, and documentation.

Closing the client does not end combat. The persistent active session is resumed after reconnecting.

Every started combat must reach Victory or Defeat.

### D24: Base rewards are snapshotted at combat start

Add session snapshots:

- `monster_experience_reward`,
- `monster_gold_min`,
- `monster_gold_max`.

Settlement uses these snapshots, not the current monster row.

Balance changes therefore affect new fights only.

Gold is rolled during successful settlement, not at combat start.

### D25: Character reward bonuses are read at settlement

Do not snapshot Gold or Experience bonus percentages.

At settlement, read the current authoritative:

- equipment bonuses,
- achievement bonuses,
- active progression boosts.

Record the percentages used in the final combat summary.

## Required migration shape

Migration `089_victory_death_progression.sql` should include, at minimum:

```sql
BEGIN;

ALTER TABLE monsters
    ADD COLUMN experience_reward BIGINT NOT NULL DEFAULT 0,
    ADD CONSTRAINT chk_monsters_experience_reward
        CHECK (experience_reward >= 0);

ALTER TABLE combat_sessions
    ADD COLUMN settled_at TIMESTAMPTZ NULL,
    ADD COLUMN monster_experience_reward BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN monster_gold_min BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN monster_gold_max BIGINT NOT NULL DEFAULT 0;

ALTER TABLE combat_sessions
    ADD CONSTRAINT chk_combat_sessions_reward_snapshot
        CHECK (
            monster_experience_reward >= 0
            AND monster_gold_min >= 0
            AND monster_gold_max >= monster_gold_min
        );

CREATE TABLE character_blessings (
    character_blessing_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL,
    activated_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_character_blessings_character
        FOREIGN KEY (character_id)
        REFERENCES characters(character_id)
        ON DELETE CASCADE,
    CONSTRAINT ux_character_blessings_character
        UNIQUE (character_id)
);

ALTER TABLE character_statistics
    ADD COLUMN current_no_death_streak BIGINT NOT NULL DEFAULT 0,
    ADD CONSTRAINT chk_character_statistics_current_no_death_streak
        CHECK (current_no_death_streak >= 0);

CREATE INDEX ix_combat_logs_character_recent
    ON combat_logs (
        character_id,
        created_at DESC,
        combat_log_id DESC
    );

COMMIT;
```

The real migration must also replace the current combat-session status and end-state constraints so that:

```text
Active  -> ended_at IS NULL     and settled_at IS NULL
Victory -> ended_at IS NOT NULL and settled_at IS NOT NULL
Defeat  -> ended_at IS NOT NULL and settled_at IS NOT NULL
```

The migration must remove `Abandoned` from allowed statuses.

Do not copy the illustrative SQL blindly. Constraint names and existing constraint replacement must be verified against the current database and follow the repository's migration conventions.

## Required application changes

### Combat application contracts

Extend persistent session models with:

- `settledAt`,
- reward snapshots,
- settlement result returned after a terminal action.

Extend the action transaction contract so the terminal path can execute settlement before the final session update.

### Combat repository

The PostgreSQL implementation must:

- lock the session,
- lock the character,
- load Promotion and Blessing state,
- load current reward bonuses,
- load monster and boss settlement metadata,
- aggregate session events for combat statistics,
- update the character and statistics,
- update Bestiary and Task Boss progress,
- update Daily Boss victory progress,
- write standard cooldown where applicable,
- consume fight-based boosts,
- consume Blessing on defeat,
- create the final combat log,
- enforce ten-log retention,
- write terminal session state with `settled_at` last.

Avoid turning `postgres-combat-session.repository.ts` into the owner of progression formulas. SQL infrastructure may coordinate persistence, but formulas belong in pure domain modules.

### Progression domain

Add pure domain modules covering:

- Experience threshold calculation,
- level lookup from total Experience,
- percentage reward calculation,
- death-loss percentage selection,
- death-loss calculation,
- level-change resource adjustment,
- combat-event statistics aggregation.

### Monster domain and mapping

Add `experienceReward` anywhere reward-bearing monster data is represented.

Update:

- database row types,
- PostgreSQL selects,
- mappers,
- domain/application models,
- combat-start snapshot creation,
- fixtures and tests.

### Daily Boss start flow

Combat start must lock and consume Daily Boss attempt progress inside the existing start transaction.

This is an extension of M5 start behavior and must preserve exact-once Energy deduction and one-active-session protection.

### HTTP response

Terminal action responses expose a settlement summary.

Continuing action responses expose `settlement: null`.

All `bigint` values must use the existing string serialization approach.

## Required data-pipeline changes

Locate the authoritative monster-data source and update the complete pipeline:

- workbook column,
- workbook reader,
- schema/header validation,
- per-cell validation,
- normalized import model,
- PostgreSQL UPSERT,
- dry-run output,
- importer tests,
- synthetic development data,
- documentation describing the monster column.

Do not infer final production values during implementation.

Development fixtures need explicit, modest non-zero rewards so M6 integration tests can verify progression.

## Required documentation corrections

Update documentation to reflect:

- M6 excludes loot generation,
- Experience comes from `monsters.experience_reward`,
- the canonical Experience curve,
- combat cannot be abandoned,
- cooldown applies after Victory and Defeat,
- Task Boss and Daily Boss do not use standard cooldowns,
- final summaries use `combat_logs`,
- incremental events remain in `combat_session_events`,
- active Blessing uses `character_blessings`,
- base rewards are snapshotted at combat start,
- bonus percentages are read at settlement,
- Daily Boss attempts are consumed at combat start.

Remove wording that presents combat abandonment as planned gameplay.

## Conflicts and stale evidence found

### Loot scope conflict

The high-level M6 transaction list mentions loot generation, while M7 owns Item and Loot Generation.

Resolution: D1. M6 excludes loot.

### Abandoned status conflict

The current schema permits `Abandoned`, and old planning text lists abandonment as future scope.

Resolution: corrected D23. Combat cannot be abandoned, and migration `089` removes the status.

### Cooldown result conflict

Some descriptive wording says defeating a monster starts cooldown, but the approved gameplay rule is that any completed attempt starts cooldown.

Resolution: corrected D12. Victory and Defeat both start standard cooldown where applicable.

### Stale metadata CSV

Generated metadata contains pre-migration fields, including `task_unlocked`, `attempts_date`, and `attempts_used_today`.

Resolution: migrations `084` and `087` are authoritative. Metadata must not drive implementation decisions until regenerated.

### Blessing storage gap

Design documents require one active Blessing consumed on death, but the current schema has no authoritative active-Blessing record.

Resolution: D8 and D17 create `character_blessings`.

### Current streak storage gap

`longest_no_death_streak` exists, but current streak does not.

Resolution: D10 and D17 add `current_no_death_streak`.

### Exactly-once settlement gap

Unique final logs protect only log duplication. They do not independently protect Experience, Gold, statistics, Blessing, Bestiary, Task progress, or cooldown updates.

Resolution: D2, D17, D21, and D22 add `settled_at`, locks, fixed ordering, and one atomic transaction.

## Explicitly outside M6

- item generation,
- material generation,
- consumable drops,
- equipment inventory handling,
- player spells,
- monster abilities,
- combat consumables,
- active combat effects beyond existing placeholders,
- healing statistics from unsupported mechanics,
- Mana-spend statistics from unsupported mechanics,
- spell-hit statistics,
- Blessing purchase and activation endpoints,
- Promotion purchase,
- paid Task Boss re-unlock,
- escape,
- combat abandonment,
- final-log history endpoint,
- production reward balancing beyond adding explicit source values.

## Principal implementation risks

### Transaction size and repository complexity

M6 touches many tables in one transaction. Keep formulas outside infrastructure and split persistence into focused private operations or adapters without weakening atomicity.

### Deadlocks

Multiple settlement paths must use the approved lock order. Integration tests should exercise concurrent terminal actions and Daily Boss starts.

### Numeric overflow

Experience and Gold use PostgreSQL `BIGINT`. TypeScript logic must use `bigint` for integral progression and balance values and reject overflow before persistence.

### Mixed numeric reward percentages

Percentage modifiers are numeric values and may contain fractions. Apply them deterministically, round only the final reward down, and test fractional values.

### Stale generated metadata

Do not design SQL from old metadata CSV snapshots. Verify current schema through ordered migrations and integration tests.

### Event aggregation

Damage statistics must be derived from authoritative server-generated events. Do not trust client values or reconstruct damage from ending Health alone.

### Retention concurrency

Final-log insertion and pruning happen while the character is locked. Tests must prove the result remains exactly ten newest logs after concurrent attempts.

### Reward snapshot compatibility

Existing sessions predate reward snapshots. The migration defaults them to zero. M6 tests should either finish only newly started sessions or explicitly define how legacy active sessions are handled in development data.

### Data import ordering

Migration `089` must run before importing `experience_reward`. The importer must fail clearly when code and schema versions do not match.

## Verification expectations

M6 is not complete until tests prove at least:

- migration `089` applies on a clean database,
- no pending migrations remain,
- Experience thresholds reproduce all approved anchors,
- multiple level gains work,
- multiple level losses work,
- final rounding is deterministic,
- base Experience is loaded from the monster source and snapshotted,
- Gold rolling uses inclusive bounds,
- Victory rewards are granted once,
- Defeat rewards are zero,
- all four death percentages work,
- Blessing is consumed exactly once,
- Promotion remains permanent,
- Health and Mana changes follow D6 and D20,
- both defeat reasons are covered,
- character statistics are correct,
- current and longest no-death streaks are correct,
- first-kill Bestiary unlock works,
- repeated kill counting works,
- Task Boss unlock and post-kill state work,
- Normal Monster and Mini Boss cooldowns work after Victory and Defeat,
- Task Boss and Daily Boss avoid standard cooldowns,
- Daily Boss attempts are consumed once at start,
- Daily Boss victory statistics update only on Victory,
- fight-based boosts affect the final Victory and are consumed after any completed fight,
- final logs are one per session,
- only ten newest final logs remain,
- incremental events remain intact,
- a failed settlement rolls back the terminal action and all side effects,
- concurrent terminal requests settle once,
- combat cannot become `Abandoned`,
- reconnect continues the active session,
- HTTP returns the approved settlement shape,
- typecheck, build, unit tests, integration tests, HTTP tests, and full regression suite pass.

## Audit conclusion

The repository has strong M1-M5 foundations for M6, including deterministic combat, persistent sessions, transaction boundaries, ownership checks, server-controlled randomness, character progression storage, monster reward ranges, Bestiary tables, Task Boss state, cooldown storage, lifetime statistics, Daily Boss progress, and final-log storage.

The main M6 work is not inventing a new combat system. It is adding an exactly-once settlement layer that atomically converts an already-determined terminal combat result into progression, penalties, statistics, discovery, task state, cooldown state, boost consumption, Daily Boss state, and a compact final log.

Implementation may begin only from the approved decisions recorded here and the subsequent M6 verification, traceability, and implementation plans.
