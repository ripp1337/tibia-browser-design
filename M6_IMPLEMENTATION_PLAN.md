# M6 Implementation Plan

## Milestone

M6: Victory, Death, and Progression

## Purpose

This plan defines the implementation order for M6. It translates the approved decisions D1-D25 and verification gates V1-V25 into small, reviewable, testable checkpoints.

The plan assumes the repository starts from completed M5 on branch `m6/victory-death-progression` with migrations through 088 applied.

## Authoritative planning documents

Implementation must follow:

1. `M6_SOURCE_AUDIT.md`
2. `M6_VERIFICATION_PLAN.md`
3. Current compiling code
4. Applied PostgreSQL migrations
5. Passing tests

If implementation reveals a conflict with an approved decision, stop and resolve the decision before continuing.

## Delivery rules

- Implement one checkpoint at a time.
- Keep each checkpoint independently testable.
- Do not combine unrelated schema, domain, importer, HTTP, and documentation work in one large change.
- Run focused tests after every checkpoint.
- Run typecheck regularly.
- Run the full regression suite at milestone boundaries.
- Commit only after the checkpoint is verified.
- Never weaken M1-M5 ownership, transaction, concurrency, randomness, or persistence guarantees.
- Do not implement loot, combat abandonment, or other explicitly excluded systems.

## Target architecture

M6 should add the following responsibilities without moving formulas into infrastructure:

```text
Pure progression domain
  -> Experience curve
  -> Level lookup
  -> Reward calculation
  -> Death loss
  -> Resource adjustment
  -> Combat-event aggregation

Settlement application layer
  -> Victory settlement contract
  -> Defeat settlement contract
  -> Settlement response model

PostgreSQL transaction layer
  -> Locks
  -> Authoritative reads
  -> Atomic writes
  -> Exactly-once protection
  -> Final log and retention

Existing combat action flow
  -> Detect terminal transition
  -> Execute settlement
  -> Write terminal session state last
  -> Return committed settlement
```

## Phase 0: Planning checkpoint

### Objective

Store the approved planning context before modifying implementation.

### Files

- `M6_SOURCE_AUDIT.md`
- `M6_VERIFICATION_PLAN.md`
- `M6_IMPLEMENTATION_PLAN.md`
- later: `M6_MASTER_PROMPT.md`

### Verification

- all D1-D25 decisions are present,
- all V1-V25 gates are present,
- implementation phases map to the approved scope,
- `git diff --check` passes.

### Suggested commit

```text
plan M6 implementation
```

## Phase 1: Establish the M6 baseline

### Objective

Prove that failures introduced later belong to M6 rather than the existing M5 baseline.

### Tasks

1. Confirm branch `m6/victory-death-progression`.
2. Confirm 88 applied migrations and 0 pending migrations.
3. Run PostgreSQL connection check.
4. Run the current test suite.
5. Run typecheck.
6. Run production build.
7. Record exact baseline counts and results.

### Exit criteria

- M5 baseline passes unchanged.
- Working tree contains only intentional M6 planning files.

### Verification mapping

- V1
- V24

## Phase 2: Add migration 089

### Objective

Create the complete schema foundation required by M6 before application code depends on it.

### New file

```text
database/migrations/089_victory_death_progression.sql
```

### Schema changes

#### Monsters

Add:

```text
experience_reward BIGINT NOT NULL DEFAULT 0
```

Add a non-negative constraint.

#### Combat sessions

Add:

```text
settled_at TIMESTAMPTZ NULL
monster_experience_reward BIGINT NOT NULL DEFAULT 0
monster_gold_min BIGINT NOT NULL DEFAULT 0
monster_gold_max BIGINT NOT NULL DEFAULT 0
```

Add reward-snapshot constraints.

Replace status and end-state constraints so only these states are valid:

```text
Active
Victory
Defeat
```

Enforce:

```text
Active  -> ended_at NULL, settled_at NULL, defeat_reason NULL
Victory -> ended_at set, settled_at set, defeat_reason NULL
Defeat  -> ended_at set, settled_at set, defeat_reason set
```

Remove `Abandoned` from the schema contract.

#### Character blessings

Create `character_blessings` with:

- UUID primary key,
- character foreign key,
- `activated_at`,
- `created_at`,
- one active Blessing per character,
- cascade on character deletion.

#### Character statistics

Add:

```text
current_no_death_streak BIGINT NOT NULL DEFAULT 0
```

Add a non-negative constraint.

#### Combat logs

Add an index supporting per-character newest-ten retention:

```text
character_id, created_at DESC, combat_log_id DESC
```

Preserve unique `combat_session_id`.

### Tests

Add or extend persistent schema integration tests for every new column, table, index, and constraint.

Test valid and invalid combat-session state combinations directly against PostgreSQL.

### Exit criteria

- migration applies after 088,
- migration status reports 89 applied and 0 pending,
- clean-database migration test passes,
- schema integration tests pass,
- typecheck passes.

### Verification mapping

- V2
- V21
- V23

### Suggested commit

```text
add M6 progression settlement schema
```

## Phase 3: Extend the monster data pipeline

### Objective

Make the database authoritative for fixed monster Experience rewards.

### Tasks

1. Add required `experience_reward` to the authoritative monster workbook or source.
2. Update the workbook header/schema definition.
3. Update row parsing and validation.
4. Require a non-negative integer within PostgreSQL `BIGINT`.
5. Update normalized import models.
6. Update PostgreSQL monster UPSERT.
7. Update dry-run reporting.
8. Update importer unit and integration tests.
9. Add explicit non-zero development rewards.
10. Document approved technical exceptions if any monster may use zero.

### Important rules

- Never derive Experience from monster level.
- Repeat import updates by stable monster `code`.
- Validation failure must prevent partial import.
- Migration 089 must exist before the importer writes the field.

### Exit criteria

- workbook validation passes,
- dry run passes without mutation,
- controlled import writes rewards,
- repeat import is stable,
- negative, blank, malformed, and overflowing values are rejected,
- PostgreSQL contains expected development rewards.

### Verification mapping

- V3
- V23

### Suggested commit

```text
add monster experience rewards to game data
```

## Phase 4: Extend monster and combat-start contracts

### Objective

Carry monster reward values from PostgreSQL into immutable combat-session snapshots.

### Tasks

Update relevant:

- monster row types,
- monster mapper,
- monster domain/application models,
- combat-start repository query,
- combat-start transaction model,
- combat-session insert,
- persistent combat-session mapper,
- fixtures and tests.

At combat start, persist:

```text
monster_experience_reward
monster_gold_min
monster_gold_max
```

### Tests

Verify:

- snapshots match the monster row at start,
- client input cannot provide reward values,
- changing monster balance later does not change the active session,
- a new session receives new balance values,
- failed start stores no snapshots,
- concurrent starts still create one session and deduct Energy once.

### Exit criteria

- start flow persists all reward snapshots,
- existing combat retrieval continues working,
- focused combat-start tests pass,
- M5 start regression tests pass,
- typecheck passes.

### Verification mapping

- V3
- V6
- V24

### Suggested commit

```text
snapshot monster rewards at combat start
```

## Phase 5: Implement the pure progression domain

### Objective

Implement all deterministic formulas independently from PostgreSQL and HTTP.

### Suggested modules

Use repository naming conventions, but keep responsibilities separate. Expected concepts include:

```text
experience progression
reward calculation
death penalty
level resource adjustment
combat statistics aggregation
```

### Experience curve

Implement exact `bigint` threshold calculation:

```text
XP(L) = (50L^3 - 300L^2 + 850L - 600) / 3
```

Implement efficient level lookup from total Experience.

Recommended approach:

1. Validate non-negative Experience.
2. Find an upper level bound by exponential growth.
3. Use binary search for the highest reachable level.
4. Reject unsupported overflow.

### Reward calculation

Implement deterministic final reward calculation using base `bigint` value and non-negative percentage points.

Do not convert large integral values to unsafe JavaScript numbers.

Define and test one precise representation for fractional percentage modifiers so rounding is deterministic.

### Death loss

Implement:

```text
10% normal
8% promoted
6% blessed
4% promoted and blessed
```

Round Experience loss down.

### Resource adjustment

Implement approved level-gain and level-loss behavior while reusing existing canonical Health, Mana, and Energy calculations.

### Event aggregation

Aggregate authoritative combat events into:

- damage dealt,
- damage taken,
- highest physical hit.

### Tests

Add exhaustive unit coverage for:

- all Experience anchors,
- threshold boundaries,
- large values,
- multiple level gains,
- multiple level losses,
- reward rounding,
- overflow,
- four death modifiers,
- Health/Mana/Energy adjustments,
- event aggregation,
- misses and zero-damage hits.

### Exit criteria

- pure functions have no SQL, time, HTTP, or implicit randomness dependencies,
- all focused unit tests pass,
- typecheck passes.

### Verification mapping

- V4
- V5
- V8
- V9
- V10
- V12

### Suggested commit

```text
add M6 progression domain rules
```

## Phase 6: Define settlement contracts

### Objective

Introduce clear application-level contracts before implementing the large PostgreSQL transaction.

### Tasks

Define models for:

- settlement result,
- Experience summary,
- Gold summary,
- level summary,
- Blessing consumption,
- Bestiary result,
- Task Boss result,
- cooldown result,
- Daily Boss result,
- final combat summary.

Extend action results with:

```text
settlement: null | CombatSettlement
```

Define transaction operations required by terminal settlement without exposing SQL details to the service.

### Design rules

- all persisted integral values use `bigint` internally,
- HTTP serialization remains separate,
- continuing actions return `settlement: null`,
- terminal actions return committed settlement data,
- the settlement contract must support Victory and Defeat without loot fields.

### Tests

Update unit fakes and contract tests before PostgreSQL implementation.

### Exit criteria

- contracts compile,
- continuing M5 action behavior remains unchanged except for `settlement: null`,
- unit tests pass,
- typecheck passes.

### Verification mapping

- V7
- V8
- V22

### Suggested commit

```text
add combat settlement contracts
```

## Phase 7: Implement authoritative settlement reads and lock order

### Objective

Prepare the transaction to load every authoritative settlement input safely.

### Lock order

Use the approved order:

1. `combat_sessions`
2. `characters`
3. `character_unlocks`
4. `character_blessings`
5. `character_statistics`
6. Daily Boss or Task Boss progress
7. fight-based buffs
8. remaining settlement records

### Required reads

Load inside the transaction:

- locked active session,
- locked character progression and resources,
- Promotion state,
- active Blessing state,
- current effective Gold and Experience bonuses,
- monster type, power score, and cooldown metadata,
- boss metadata,
- Daily Boss definition, tier, rotation, and progress where relevant,
- Task Boss relationships and progress where relevant,
- all events for statistics aggregation,
- active fight-based buffs.

### Tests

Add integration tests confirming:

- records are loaded for the owned character and session,
- foreign records remain inaccessible,
- missing required state fails without mutation,
- lock order supports concurrent terminal requests without duplication.

### Exit criteria

- terminal transaction inputs are complete,
- no progression formula exists in SQL infrastructure,
- focused integration tests pass.

### Verification mapping

- V19
- V20
- V24

### Suggested commit

```text
add transactional settlement loading
```

## Phase 8: Implement Victory settlement persistence

### Objective

Atomically apply every approved Victory consequence.

### Required sequence inside the transaction

1. Resolve ending combat action through the existing pure combat engine.
2. Persist ending-action events.
3. Aggregate complete combat statistics.
4. Roll base Gold from session snapshot.
5. Calculate final Experience and Gold using current bonuses.
6. Calculate new total Experience and level.
7. Calculate stored resource changes.
8. Update character Experience, level, Gold, and resources.
9. Update lifetime statistics and no-death streak.
10. Insert or update Bestiary state.
11. Update ordinary Task Boss progress or defeated Task Boss status.
12. Update Daily Boss victory progress if applicable.
13. Write standard cooldown for Normal Monster or Mini Boss.
14. Consume fight-based boost uses after applying their bonuses.
15. Preserve active Blessing.
16. Insert final `combat_logs` summary.
17. Prune old final logs to newest ten.
18. Write terminal session state and `settled_at` together.
19. Return committed settlement summary.

### Important exclusions

Do not:

- generate loot,
- create equipment,
- consume Blessing,
- write standard cooldown for Task Boss or Daily Boss,
- fabricate spell, Mana-spend, or healing statistics.

### Tests

Add focused unit and PostgreSQL integration tests for:

- simple Victory,
- multiple-level Victory,
- Gold minimum and maximum,
- percentage bonuses,
- zero rewards,
- resource changes,
- statistics,
- Bestiary first and repeated kill,
- Task Boss transitions,
- cooldown rules,
- fight-based boosts,
- Daily Boss victory,
- final log and retention.

### Exit criteria

- complete Victory settlement passes focused integration tests,
- every write occurs once,
- response matches committed data,
- typecheck passes.

### Verification mapping

- V7
- V10-V18
- V22

### Suggested commit

```text
implement transactional victory settlement
```

## Phase 9: Implement Defeat settlement persistence

### Objective

Atomically apply every approved Defeat consequence.

### Required sequence

1. Persist ending-action events.
2. Aggregate combat statistics.
3. Determine Promotion and Blessing modifiers.
4. Calculate Experience loss.
5. Calculate new level and maximum resources.
6. Apply Health rule by defeat reason.
7. Clamp Mana and Energy without restoration.
8. Update character Experience, level, and resources.
9. Increment death and damage statistics.
10. Reset current no-death streak.
11. Consume active Blessing exactly once.
12. Write standard cooldown for Normal Monster or Mini Boss.
13. Consume fight-based boost uses.
14. Do not mutate Bestiary or Task Boss kill progress.
15. Do not grant Gold or Experience rewards.
16. Preserve Daily Boss attempt consumption and do not update victories.
17. Insert and retain final combat log.
18. Write terminal session state and `settled_at` together.
19. Return committed settlement summary.

### Defeat reason rules

```text
PlayerHealthDepleted -> current Health 0
TurnLimitExceeded    -> preserve remaining Health
```

### Tests

Cover:

- both defeat reasons,
- four Promotion/Blessing combinations,
- zero rounded loss,
- multiple-level loss,
- level 1 floor,
- Blessing consumption,
- Promotion preservation,
- cooldown after Defeat,
- boost consumption,
- no Bestiary mutation,
- no rewards,
- final log.

### Exit criteria

- complete Defeat settlement passes focused integration tests,
- no duplicated penalty or consumption path exists,
- typecheck passes.

### Verification mapping

- V8
- V9
- V10-V12
- V15
- V17-V18
- V22

### Suggested commit

```text
implement transactional defeat settlement
```

## Phase 10: Integrate settlement with action resolution

### Objective

Make terminal settlement part of the existing action transaction without weakening expected-turn protection.

### Tasks

1. Keep continuing action behavior unchanged.
2. Detect transition from active to terminal state.
3. Run the appropriate settlement before final session update.
4. Set terminal status, `ended_at`, and `settled_at` together as the last logical write.
5. Return `settlement: null` for continuing combat.
6. Return committed settlement for terminal combat.
7. Reject actions against already terminal sessions.

### Concurrency tests

Run two requests ending the same turn and prove:

- one succeeds,
- one fails through stale-turn or terminal protection,
- every value-producing side effect occurs once.

### Exit criteria

- continuing combat regression tests pass,
- Victory integration passes through the public service,
- Defeat integration passes through the public service,
- exactly-once concurrency tests pass.

### Verification mapping

- V2
- V7-V9
- V19
- V22

### Suggested commit

```text
connect settlement to terminal combat actions
```

## Phase 11: Add Daily Boss attempt consumption to combat start

### Objective

Consume Daily Boss attempts exactly once when combat starts.

### Tasks

Inside the existing combat-start transaction:

1. Identify Daily Boss and authoritative current rotation.
2. Lock the relevant progress record.
3. Validate the current attempt limit.
4. Increment `attempts_used_in_rotation`.
5. Increment `total_attempts`.
6. Set `last_attempt_at` from the same `Clock` timestamp.
7. Deduct Energy.
8. Snapshot combat and rewards.
9. Create the session.
10. Commit all changes together.

### Tests

Cover:

- allowed attempt,
- exhausted attempts,
- first progress row,
- existing progress row,
- failed combat start rollback,
- concurrent final available attempt,
- one active session protection,
- exact-once Energy deduction,
- unchanged Normal Monster, Mini Boss, and Task Boss start flows.

### Exit criteria

- Daily Boss attempts are exact-once,
- failed starts consume nothing,
- M5 start guarantees remain intact.

### Verification mapping

- V6
- V16
- V19
- V20

### Suggested commit

```text
consume Daily Boss attempts at combat start
```

## Phase 12: Implement final-log retention robustness

### Objective

Prove that final logs remain useful, compact, and bounded without affecting detailed events.

### Tasks

1. Finalize `combat_data_json` version and shape.
2. Store authoritative before/after progression amounts.
3. Store reward snapshots and applied bonus percentages.
4. Store Bestiary, Task Boss, Daily Boss, Blessing, and cooldown outcomes.
5. Retain the ten newest final logs per character.
6. Preserve sessions and events when old final logs are removed.

### Tests

Cover:

- one log per session,
- log 1 through 10,
- insertion of log 11,
- deterministic tie-breaking,
- per-character isolation,
- retention rollback,
- final-log deletion without session/event deletion,
- summary consistency with committed state.

### Exit criteria

- all V18 tests pass,
- compact summaries do not duplicate the entire event stream,
- unique session protection remains active.

### Verification mapping

- V13
- V18
- V19
- V20

### Suggested commit

```text
complete final combat log retention
```

## Phase 13: Complete HTTP settlement response

### Objective

Expose committed M6 results through the existing authenticated action endpoint.

### Tasks

Update response mapping for:

```text
settlement: null | settlement summary
```

Serialize all `bigint` amounts as strings.

Return cooldown timestamp or null according to monster type.

Preserve:

- authentication,
- character ownership,
- hidden foreign-session existence,
- existing event ordering,
- existing session response fields.

### HTTP tests

Cover:

- continuing action,
- Victory,
- Player Health defeat,
- turn-limit defeat,
- multi-level gain,
- Experience loss,
- Blessing consumption,
- cooldown nullability,
- string serialization,
- foreign ownership,
- client attempts to submit settlement fields.

### Exit criteria

- authenticated HTTP flow returns committed settlement,
- no separate reward claim exists,
- all M5 HTTP regressions pass.

### Verification mapping

- V22
- V24

### Suggested commit

```text
expose M6 combat settlement response
```

## Phase 14: Rollback and failure-injection coverage

### Objective

Prove that terminal action and all settlement effects form one indivisible transaction.

### Failure points

Inject failures around:

- character update,
- statistics update,
- Bestiary update,
- Task Boss update,
- Daily Boss victory update,
- cooldown write,
- boost consumption,
- Blessing deletion,
- final-log insertion,
- retention deletion,
- terminal session update.

### Required assertion after failure

Everything remains as before the terminal request:

- session active,
- no ending timestamp,
- no settlement timestamp,
- no ending-action events,
- no rewards or penalties,
- no level/resource changes,
- no statistics changes,
- no Blessing consumption,
- no boost consumption,
- no Bestiary or task changes,
- no cooldown changes,
- no final-log changes.

### Exit criteria

- every important write path has rollback evidence,
- no partial terminal state can be produced.

### Verification mapping

- V20
- V21

### Suggested commit

```text
verify M6 settlement rollback safety
```

## Phase 15: Remove combat abandonment everywhere

### Objective

Make “combat cannot be interrupted” consistent across schema, code, tests, and documentation.

### Tasks

Remove `Abandoned` from:

- application constants and models,
- mappers,
- validation,
- tests,
- documentation,
- generated examples.

Verify reconnect behavior:

- active session survives application restart,
- active-session endpoint returns it,
- starting a second fight is rejected,
- no action or endpoint abandons it.

### Exit criteria

- repository search finds no active contract treating `Abandoned` as valid or planned gameplay,
- historical migration text may remain only where unavoidable and clearly historical,
- all reconnect and active-session tests pass.

### Verification mapping

- V21
- V24

### Suggested commit

```text
remove combat abandonment contract
```

## Phase 16: Full M6 integration matrix

### Objective

Run end-to-end PostgreSQL scenarios covering all monster and result categories.

### Required matrix

```text
Normal Monster + Victory
Normal Monster + Defeat by Health
Normal Monster + Defeat by turn limit
Mini Boss + Victory
Mini Boss + Defeat
Task progress monster + Victory
Task Boss + Victory
Task Boss + Defeat
Daily Boss + Victory
Daily Boss + Defeat
Promoted + Defeat
Blessed + Defeat
Promoted and Blessed + Defeat
Fight boost + Victory
Fight boost + Defeat
Multi-level Victory
Multi-level Defeat
```

Each scenario must validate all relevant state changes, non-changes, log content, and exactly-once behavior.

### Exit criteria

- complete category/result matrix passes,
- no scenario relies on client-authored values,
- no standard cooldown leaks into Task Boss or Daily Boss flows.

### Verification mapping

- V7-V19
- V23

### Suggested commit

```text
complete M6 settlement integration coverage
```

## Phase 17: Documentation update

### Objective

Make current documentation describe implemented M6 behavior rather than pre-M6 plans.

### Required updates

- `documentation/game-design/CURRENT_MILESTONE.md`
- `documentation/game-design/MASTER_PROJECT_PLAN.md`
- combat-session documentation
- combat-log documentation
- character progression documentation
- monster definition documentation
- Bestiary and Task Boss documentation
- Daily Boss documentation
- Blessing documentation
- data-import or workbook documentation

### Required corrections

Document:

- M6 excludes loot,
- Experience reward lives in monster data,
- canonical Experience curve,
- exact death percentages,
- level/resource handling,
- exactly-once settlement,
- no combat abandonment,
- cooldown after Victory and Defeat,
- Task Boss and Daily Boss cooldown exclusions,
- Daily Boss attempt timing,
- fight-based boost consumption,
- final logs versus event logs,
- ten-log retention,
- reward snapshot timing,
- character bonus timing.

### Exit criteria

- documentation matches implementation,
- no stale M6 conflict remains,
- current milestone records verified test results only after final verification.

### Verification mapping

- V21
- V25

### Suggested commit

```text
complete M6 documentation
```

## Phase 18: Final verification

### Objective

Execute every mandatory gate and record exact evidence.

### Required final checks

1. PostgreSQL connection.
2. Migration status: 89 applied, 0 pending.
3. Clean-database migrations.
4. Workbook validation.
5. Import dry run.
6. Import integration tests.
7. M6 unit tests.
8. M6 PostgreSQL integration tests.
9. M6 HTTP integration tests.
10. Concurrency tests.
11. Rollback tests.
12. Full regression suite.
13. TypeScript typecheck.
14. Production build.
15. `git diff --check`.
16. Search for stale active `Abandoned` contract.
17. Review final migration and documentation diff.
18. Confirm expected Git status.

### Completion evidence

Record:

- migration count,
- table count if the repository uses it as a checkpoint,
- passing test-file count,
- passing test count,
- typecheck result,
- build result,
- PostgreSQL result,
- authenticated HTTP flow result,
- concurrency result,
- rollback result.

### Exit criteria

Every V1-V25 gate passes.

### Suggested commit

```text
complete M6 victory death and progression
```

## Recommended implementation order summary

```text
P0  Planning checkpoint
P1  Baseline verification
P2  Migration 089
P3  Monster Experience data pipeline
P4  Reward snapshots at combat start
P5  Pure progression domain
P6  Settlement contracts
P7  Transactional settlement loading
P8  Victory settlement
P9  Defeat settlement
P10 Terminal action integration
P11 Daily Boss attempt consumption
P12 Final-log retention
P13 HTTP settlement response
P14 Rollback coverage
P15 Remove abandonment contract
P16 Full integration matrix
P17 Documentation
P18 Final verification
```

## Traceability to decisions

```text
D1  -> P8, P12, P17
D2  -> P7-P10, P14
D3  -> P5, P8, P9
D4  -> P2-P4
D5  -> P5
D6  -> P5, P8, P9
D7  -> P5, P9
D8  -> P2, P7, P9
D9  -> P5, P8
D10 -> P2, P5, P8, P9
D11 -> P8, P9, P16
D12 -> P8, P9, P16
D13 -> P8, P9, P12
D14 -> P8, P9, P11
D15 -> P7-P9
D16 -> P6, P10, P13
D17 -> P2
D18 -> P5-P10
D19 -> P3
D20 -> P5, P9
D21 -> P7, P10, P14
D22 -> P8-P10
D23 -> P2, P15, P17
D24 -> P2, P4
D25 -> P7-P9
```

## Traceability to verification gates

```text
P1  -> V1, V24
P2  -> V2, V21, V23
P3  -> V3
P4  -> V6
P5  -> V4, V5, V8-V12
P6  -> V22
P7  -> V19, V20
P8  -> V7, V10-V18
P9  -> V8-V18
P10 -> V19, V22
P11 -> V16
P12 -> V18
P13 -> V22, V24
P14 -> V20
P15 -> V21
P16 -> V7-V19, V23
P17 -> V21, V25
P18 -> V25
```

## Stop conditions

Stop implementation and resolve the issue before continuing if:

- an approved decision conflicts with the current schema in a way not covered by migration 089,
- the monster data source cannot safely add `experience_reward`,
- a percentage calculation would require unsafe numeric conversion,
- the existing action transaction cannot keep settlement atomic,
- a terminal session can be written before settlement completes,
- concurrency tests reveal duplicate value creation,
- rollback leaves any partial side effect,
- removing `Abandoned` breaks an undocumented supported workflow,
- the implementation would require loot or another explicitly excluded M7+ feature.

## Definition of implementation readiness

Implementation is ready to begin when:

- `M6_SOURCE_AUDIT.md` exists,
- `M6_VERIFICATION_PLAN.md` exists,
- `M6_IMPLEMENTATION_PLAN.md` exists,
- `M6_MASTER_PROMPT.md` exists,
- all planning files agree on D1-D25,
- baseline verification passes,
- the working tree is committed and clean,
- a fresh implementation chat receives all required context files.
