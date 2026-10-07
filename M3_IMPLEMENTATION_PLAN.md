# M3 Implementation Plan

## Milestone

M3: Monster Discovery and Eligibility

## Status

Completed and fully verified.

## Objective

Implement a read-only monster discovery system for an authenticated character.

M3 must support:

- monster list,
- monster details,
- stable monster codes,
- character-level eligibility,
- character-specific cooldown status,
- Energy-cost preview,
- monster-type distinction,
- Bestiary visibility state,
- ownership isolation.

## Endpoints

- GET /characters/:characterId/monsters
- GET /characters/:characterId/monsters/:monsterCode

## Out of scope

M3 does not:

- start combat,
- deduct Energy,
- create combat sessions,
- grant rewards,
- record cooldowns,
- update Bestiary,
- update kill statistics,
- modify task-boss progress,
- perform daily-boss rotation mutations.

These belong to later milestones.

## Access rule

A monster satisfies the basic level requirement when:

character.level >= monster.level

Higher-level monsters may be visible in discovery results, but must not be reported as startable.

All monsters may be visible in discovery results.
 
Visibility does not imply eligibility.
 
A monster may be visible while unavailable for combat.

## Monster types

The public contract must distinguish:

- Normal
- Mini Boss
- Task Boss
- Daily Boss

The authoritative source of monster type must be confirmed from the current schema. Do not infer type from monster names or codes.

Normal
- CharacterLevel >= MonsterLevel

MiniBoss
- CharacterLevel >= MonsterLevel
- Cooldown inactive

TaskBoss
- CharacterLevel >= MonsterLevel
- TaskStatus = UNLOCKED

DailyBoss
- CharacterLevel >= MonsterLevel
- Daily boss available
- Attempts available

## Task boss lifecycle

Task Status Lifecycle

ACTIVE
- progress accumulates

UNLOCKED
- boss available

WAITING_FOR_REUNLOCK
- boss defeated
- progress does not accumulate
- fee required before a new cycle begins

Transitions:

ACTIVE
-> UNLOCKED

UNLOCKED
-> WAITING_FOR_REUNLOCK

WAITING_FOR_REUNLOCK
-> ACTIVE

## Public list contract

The final structure must be confirmed after the schema audit.

Expected fields:

- code
- name
- level
- monsterType
- energyCost
- eligibility
- cooldown
- bestiaryVisibility

Do not expose raw database rows or unnecessary balancing values.

## Public details contract

Expected fields:

- all public list fields,
- description,
- artwork when available,
- public combat preview fields,
- family information when required.

The final field list must be based on authoritative schema sources.

## Eligibility model

Expected structure:

- isEligible
- reasons

Authoritative reasons:
- LEVEL_TOO_LOW
- COOLDOWN_ACTIVE
- TASK_PROGRESS_INCOMPLETE
- TASK_REUNLOCK_REQUIRED
- DAILY_BOSS_UNAVAILABLE
- DAILY_ATTEMPTS_EXHAUSTED

These reason codes are the canonical M3 eligibility reasons.

## Cooldown model

Cooldown state must be:

- character-specific,
- calculated using the Clock abstraction,
- deterministic for a fixed time,
- based on persisted database state,
- read-only during M3.

The API must not trust a timestamp supplied by the client.

## Bestiary visibility

Bestiary visibility is character-specific.

Bestiary visibility is determined by the existence
of a bestiary entry for the character.

A monster becomes visible in the Bestiary after the
first combat interaction with that monster.

Monster Discovery and Bestiary are independent systems.
- existence of a Bestiary entry,
- kill count,
- first-kill timestamp,
- a dedicated visibility field,
- another persisted rule.

Do not infer this silently.

## Architecture

### Domain

Contains:

- MonsterCode type,
- MonsterType type,
- eligibility model,
- cooldown model,
- pure level-access calculation,
- enum and invariant validation.

Domain code must not import PostgreSQL or HTTP.

### Application

Contains:

- MonsterDiscoveryRepository contract,
- ListAvailableMonstersService,
- GetMonsterDetailsService,
- public application models.

Application services calculate eligibility and normalize cooldown state.

### Infrastructure

Contains:

- PostgreSQL repository,
- database row validation,
- stable-code lookup,
- ownership-scoped queries,
- joins for cooldown and Bestiary state.

Infrastructure must not return HTTP response objects.

### HTTP

Contains:

- route matching,
- request validation,
- authentication,
- application service calls,
- response serialization,
- existing error mapping.

HTTP handlers must not calculate eligibility.

## Implementation phases

### Phase 1: Source audit

1. Read M3_TECHNICAL_DUMP.md.
2. Read M3_SCHEMA_DATA_DUMP.md.
3. Build a field-source map.
4. Identify the authoritative monster-type source.
5. Identify the authoritative Energy-cost source.
6. Identify cooldown ownership and monster linkage.
7. Identify Bestiary visibility semantics.
8. Identify missing constraints or indexes.
9. Record every conflict before coding.

Exit condition:

Every public field has an authoritative source or is explicitly marked as a schema gap.

### Phase 2: Domain foundation

1. Add MonsterCode.
2. Add MonsterType.
3. Add eligibility types.
4. Add cooldown types.
5. Implement pure level eligibility.
6. Add boundary tests.

Required tests:

- equal character and monster level,
- character below monster level,
- character above monster level,
- invalid level input if applicable.

### Phase 3: Repository contract

1. Define list input with accountId and characterId.
2. Define details input with accountId, characterId, and monsterCode.
3. Define repository records independent of PostgreSQL rows.
4. Include data required for eligibility, cooldown, type, and Bestiary visibility.
5. Define not-found and access-denied behavior.

### Phase 4: PostgreSQL repository

1. Verify character ownership.
2. Read character level.
3. Load enabled monster definitions.
4. Load details by stable monster code.
5. Resolve monster type.
6. Resolve Energy cost.
7. Join character-specific cooldown state.
8. Join character-specific Bestiary state.
9. Validate numeric and enum values.
10. Avoid special cases for placeholder content.

Required integration tests:

- owned character,
- foreign character,
- unknown character,
- stable monster code,
- unknown monster code,
- character-specific cooldown,
- character-specific Bestiary visibility.

### Phase 5: Application services

Create:

- ListAvailableMonstersService
- GetMonsterDetailsService

Responsibilities:

- call repository,
- calculate level eligibility,
- calculate active cooldown using Clock,
- combine eligibility reasons,
- produce stable public models.

Required unit tests:

- level boundary,
- active cooldown,
- expired cooldown,
- fixed Clock determinism,
- public mapping,
- hidden fields omitted.

### Phase 6: HTTP integration

Implement:

- GET /characters/:characterId/monsters
- GET /characters/:characterId/monsters/:monsterCode

Requirements:

- authentication required,
- accountId from authenticated session,
- parameter validation,
- stable JSON,
- existing response helpers,
- existing error conventions.

Required HTTP tests:

- missing authentication,
- valid list request,
- valid details request,
- unknown monster code,
- foreign character,
- malformed route,
- expected response shape.

### Phase 7: Full verification

Run:

- npm run db:test
- npm run typecheck
- npm test
- npm run build

Fix only failures caused by M3 changes.

### Phase 8: Documentation closure

1. Update CURRENT_MILESTONE.md.
2. Mark verified checklist items.
3. Record test evidence.
4. Commit documentation closure.
5. Remove temporary dumps when no longer required.

## Suggested Git checkpoints

1. add M3 monster discovery domain contract
2. add PostgreSQL monster discovery repository
3. implement monster discovery services
4. add authenticated monster discovery endpoints
5. complete M3 monster discovery tests
6. complete M3 documentation

## Working method

For every implementation step:

1. Inspect the exact source fragment.
2. Make one small change.
3. Use a copy-paste-ready PowerShell block.
4. Run typecheck.
5. Run the narrowest relevant test.
6. Fix only current failures.
7. Run the full suite at checkpoints.
8. Create one coherent commit.

Do not create downloadable generator scripts when a direct console command is sufficient.

## Definition of done

- Eligible monsters are returned.
- Higher-level monsters are not considered startable.
- Details are loaded by stable monster code.
- Monster types are represented correctly.
- Energy cost is previewed from authoritative data.
- Cooldown state is character-specific.
- Bestiary visibility is character-specific.
- Foreign-account character access is rejected.
- Hidden internal values are not unnecessarily exposed.
- Placeholder monsters use ordinary data-driven rules.
- Domain eligibility is deterministic.
- Unit tests pass.
- Integration tests pass.
- HTTP tests pass.
- Typecheck passes.
- PostgreSQL connectivity check passes.
- Production build passes.
- Documentation is updated and committed.


### Completion evidence

Completed on 2026-10-07.

- 87 migrations applied.
- 0 pending migrations.
- PostgreSQL connectivity verified.
- 79 database tables detected.
- Typecheck passed.
- 42 test files passed.
- 226 tests passed.
- Production build passed.
- Authenticated monster list and details endpoints verified.
