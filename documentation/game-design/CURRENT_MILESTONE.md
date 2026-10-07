# Current Milestone

## Milestone

M3: Monster Discovery and Eligibility

## Status

Completed.

## Objective

Provide authenticated, read-only monster discovery for an owned character.

## Implemented scope

- Monster list endpoint.
- Monster details endpoint loaded by stable monster code.
- Character ownership enforcement.
- Character-level eligibility.
- Character-specific Bestiary visibility.
- Energy-cost preview.
- Support for Normal, MiniBoss, TaskBoss and DailyBoss.
- Deterministic cooldown calculation using Clock.
- Task Boss lifecycle eligibility.
- Daily Boss rotation and attempt eligibility.
- Stable public application models.
- PostgreSQL row validation.
- Authenticated HTTP integration.

## Endpoints

- GET /characters/:characterId/monsters
- GET /characters/:characterId/monsters/:monsterCode

## Eligibility rules

### Normal

- Character level requirement.
- Independent character-and-monster cooldown.

### MiniBoss

- Character level requirement.
- Independent character-and-monster cooldown.

### TaskBoss

- Character level requirement.
- Task status must be UNLOCKED.
- ACTIVE returns TASK_PROGRESS_INCOMPLETE.
- WAITING_FOR_REUNLOCK returns TASK_REUNLOCK_REQUIRED.
- Ordinary monster cooldown does not affect Task Boss eligibility.

Each Task Boss has exactly one monster task.
A specific source monster unlocks a specific Task Boss.
Family-based task aggregation is outside M3.

### DailyBoss

- Character level requirement.
- Boss must belong to the active rotation.
- Character must have attempts remaining.
- Ordinary monster cooldown does not affect Daily Boss eligibility.
- Attempts are tracked per rotation.

## Daily Boss rotation

- Reset hour is configurable in UTC through DAILY_BOSS_RESET_HOUR_UTC.
- A rotation is active when created_at <= observedAt and reset_timestamp > observedAt.
- Multiple active rotations are treated as a configuration error.
- Each rotation contains one definition for tiers 1, 2 and 3.

## Eligibility reasons

- LEVEL_TOO_LOW
- COOLDOWN_ACTIVE
- TASK_PROGRESS_INCOMPLETE
- TASK_REUNLOCK_REQUIRED
- DAILY_BOSS_UNAVAILABLE
- DAILY_ATTEMPTS_EXHAUSTED

## Database changes

- Added tracked migration runner and schema_migrations.
- Added unique Task Boss assignment constraint.
- Added Daily Boss rotation window constraint.
- Changed Daily Boss attempts to be tracked per rotation.
- Added configurable Daily Boss reset hour.

## Out of scope

M3 does not:

- start combat,
- deduct Energy,
- create combat sessions,
- grant rewards,
- write cooldowns,
- update Bestiary,
- update kill statistics,
- mutate Task Boss progress,
- generate or mutate Daily Boss rotations.

## Verification

Verified on 2026-10-07:

- 87 migrations applied.
- 0 pending migrations.
- PostgreSQL connection successful.
- 79 database tables detected.
- TypeScript typecheck passed.
- 42 test files passed.
- 226 tests passed.
- Production build passed.
- Git working tree clean.

## Completion log

M3 Monster Discovery and Eligibility completed and verified.
