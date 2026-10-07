# M5 Context Index

## Purpose

This package prepares a new Copilot conversation for M5: Persistent Combat API without repeating the analysis of M1-M4.

M5 connects the pure M4 combat engine to authenticated HTTP endpoints, PostgreSQL transactions, persistent combat sessions, server-controlled randomness, and ordered combat events.

## Files and reading order

1. `M5_MASTER_PROMPT.md`
2. `M5_CONTEXT_INDEX.md`
3. `M5_IMPLEMENTATION_PLAN.md`
4. `M5_SOURCE_AUDIT.md`
5. `M5_TECHNICAL_DUMP.md`
6. `M5_SCHEMA_DATA_DUMP.md`
7. `documentation/game-design/CURRENT_MILESTONE.md`
8. `documentation/game-design/MASTER_PROJECT_PLAN.md`

## File roles

### M5_MASTER_PROMPT.md

Startup instructions for a new Copilot conversation.

Defines the milestone objective, working method, architectural boundaries, and first task.

### M5_CONTEXT_INDEX.md

Explains the context package, source priority, architectural boundary, and startup procedure.

### M5_IMPLEMENTATION_PLAN.md

Defines implementation phases, verification checkpoints, suggested commits, and the M5 Definition of Done.

### M5_SOURCE_AUDIT.md

Contains confirmed repository facts and the explicitly approved D1-D20 semantics.

The approved decisions are authoritative for M5 implementation.

### M5_TECHNICAL_DUMP.md

Contains a current source-code snapshot relevant to persistent combat.

It includes:

- M4 combat domain code,
- M4 combat tests,
- character statistics,
- character resources,
- monster eligibility,
- authentication,
- HTTP patterns,
- transaction handling,
- application composition.

### M5_SCHEMA_DATA_DUMP.md

Contains current PostgreSQL schema evidence relevant to M5.

It includes:

- combat sessions,
- combat effects,
- combat cooldowns,
- combat logs,
- character resources,
- monster statistics,
- Energy cost,
- current constraints and indexes,
- migration status.

### CURRENT_MILESTONE.md

Describes the completed M4 Pure Combat Engine.

### MASTER_PROJECT_PLAN.md

Contains the original M5 requirements and its relationship to later milestones.

## Source priority

When sources conflict, use the following priority:

1. Current compiling production code.
2. Current PostgreSQL schema.
3. Passing automated tests.
4. Approved decisions in `M5_SOURCE_AUDIT.md`.
5. `documentation/game-design/CURRENT_MILESTONE.md`.
6. `documentation/game-design/MASTER_PROJECT_PLAN.md`.
7. Historical milestone dumps and older design notes.

Do not resolve conflicts silently.

Document every newly discovered conflict and stop implementation if it changes an approved M5 rule.

## Completed foundation

### M1: Character Foundation

M1 delivered:

- character ownership,
- character creation,
- character snapshots,
- resource regeneration,
- authentication,
- PostgreSQL transactions,
- HTTP endpoints,
- automated tests.

### M2: Effective Character Statistics

M2 delivered:

- the authoritative effective-statistics calculator,
- equipment statistics,
- affixes,
- set bonuses,
- achievement bonuses,
- progression boosts,
- resource clamping,
- transactional equipment operations.

### M3: Monster Discovery and Eligibility

M3 delivered:

- authenticated monster discovery,
- stable monster codes,
- level eligibility,
- character-specific cooldowns,
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
- player-first turn resolution,
- victory and defeat handling,
- the 100-turn limit,
- ordered combat events,
- explicit effects phase,
- combat validation,
- deterministic and immutability tests.

## M5 objective

Implement a persistent and authenticated combat API around M4.

The API must:

- start combat transactionally,
- deduct Energy exactly once,
- snapshot player and monster combat statistics,
- maintain one active combat session per character,
- persist combat state after every action,
- persist ordered combat events,
- reject stale or duplicate actions,
- survive application restarts,
- expose active combat and combat logs,
- preserve ownership isolation.

## Architectural boundary

### M4 remains pure

M4 must not depend on:

- PostgreSQL,
- HTTP,
- authentication,
- repositories,
- environment configuration,
- `Clock`,
- production randomness,
- combat-session identifiers.

M5 adapts persistent records into the M4 `CombatState` and maps the resulting state and events back to PostgreSQL.

### M5 may use

- PostgreSQL,
- repositories,
- transactions,
- authenticated HTTP,
- `Clock`,
- server-controlled `RandomSource`,
- character statistics,
- monster eligibility,
- persistent sessions and events.

### M5 does not implement

- Experience rewards,
- Gold rewards,
- loot generation,
- death Experience penalties,
- level changes,
- Blessing consumption,
- Bestiary writes,
- kill statistics,
- monster cooldown writes,
- Task Boss progression,
- player spells,
- monster abilities,
- consumables,
- active combat effects,
- final combat-log retention.

## Approved M5 semantics

All decisions D1-D20 in `M5_SOURCE_AUDIT.md` are approved.

Important approved rules include:

- combat-ready statistics are snapshotted at fight start,
- `expectedTurn` is compared with the locked session turn,
- active sessions are locked with `FOR UPDATE`,
- duplicate starts cannot deduct Energy twice,
- regeneration occurs before Health and Energy validation,
- combat may start with any positive Health,
- session Health is authoritative during combat,
- terminal Health is synchronized to the character,
- events are stored in `combat_session_events`,
- production randomness uses `node:crypto`,
- application time uses the injected `Clock`,
- monster eligibility is revalidated in the start transaction,
- M5 persists terminal state without granting rewards or applying progression consequences.

## Required schema direction

M5 requires a tracked migration after migration `087`.

The migration must:

- add character and monster combat snapshots to `combat_sessions`,
- add `defeat_reason`,
- strengthen turn and terminal-state constraints,
- create `combat_session_events`,
- preserve one active combat per character,
- support deterministic event ordering.

The exact migration must follow the approved rules in `M5_SOURCE_AUDIT.md`.

## Working method

- Inspect exact current files before modifying them.
- Treat approved D1-D20 decisions as implementation requirements.
- Do not silently invent missing behavior.
- Use complete PowerShell commands for code operations.
- For long Markdown documents, provide one complete copy-paste block for manual saving.
- Keep implementation slices small.
- Run `npm run typecheck` after each slice.
- Run the narrowest relevant test after each component.
- Run integration and concurrency tests at transactional checkpoints.
- Run the full test suite before completion.
- Use coherent commits.
- Do not use destructive Git commands.
- Do not use `git add .`.
- Do not expose trusted statistics, randomness, or timestamps to client control.

## Recommended implementation order

1. Commit the approved M5 context package.
2. Add the M5 schema migration.
3. Add persistent combat contracts and error types.
4. Add production `RandomSource`.
5. Add combat-session repository contracts.
6. Implement transactional combat start.
7. Implement transactional combat action resolution.
8. Implement session and event retrieval.
9. Add authenticated HTTP request parsing and handlers.
10. Connect routes in the application composition root.
11. Add PostgreSQL integration tests.
12. Add concurrency and rollback tests.
13. Run full verification.
14. Complete M5 documentation.

## Verification commands

```powershell
npm run db:migrate:status
npm run db:test
npm run typecheck
npm test
npm run build
git diff --check
git status --short
```

M5 is not complete until database, typecheck, tests, build, concurrency guarantees, and documentation all pass.

## New conversation startup

Run:

```powershell
git branch --show-current
git status --short
git log --oneline --decorate --max-count=10
npm run db:migrate:status
npm run db:test
npm run typecheck
```

Attach all M5 context files and paste `M5_MASTER_PROMPT.md`.

The new conversation must read `M5_SOURCE_AUDIT.md` before proposing implementation.

Do not repeat D1-D20 approval unless a current-code or schema conflict is discovered.

## Context regeneration

Regenerate the technical and schema dumps with:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/generate-m5-context.ps1
```

After regeneration, verify that the technical dump includes:

- `combat-effects.ts`,
- `combat-determinism.test.ts`,
- all M4 combat files,
- all current M4 tests,
- transaction infrastructure,
- character statistics,
- monster eligibility,
- current HTTP and authentication patterns.

## Current position

- M4 is complete.
- The M5 branch exists.
- D1-D20 are approved.
- Technical and schema dumps are generated.
- Production implementation has not started.
- The first production slice should be the tracked M5 schema migration.