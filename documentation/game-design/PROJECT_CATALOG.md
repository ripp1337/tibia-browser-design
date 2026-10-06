# Project Catalog

## Purpose

This catalog records the main files and directories used by the M1 Character Foundation milestone.

## Catalog

| File path | Purpose | Public exports | Dependencies | Database tables used | Status | Milestone owner | Notes |
|---|---|---|---|---|---|---|---|
| `package.json` | Defines project metadata, scripts, and dependencies | npm scripts | Node.js, npm | None | Complete | M1 Character Foundation | Includes development, build, test, database, and game-data scripts |
| `tsconfig.json` | TypeScript configuration for source, scripts, and tests | None | TypeScript | None | Complete | M1 Character Foundation | Uses strict mode, ES2022, and NodeNext modules |
| `tsconfig.build.json` | Production TypeScript build configuration | None | `tsconfig.json` | None | Complete | M1 Character Foundation | Compiles only `src/` into `dist/` and excludes tests and scripts |
| `src/application/errors/application-error.ts` | Shared structured application error | `ApplicationError` | None | None | Complete | M1 Character Foundation | Carries error code, message, HTTP status, details, and cause |
| `src/application/ports/clock.ts` | Clock abstraction for deterministic application behavior | `Clock` | None | None | Complete | M1 Character Foundation | Used by resource regeneration services |
| `src/infrastructure/clock/system-clock.ts` | Production clock implementation | `SystemClock` | `Clock` | None | Complete | M1 Character Foundation | Returns current system time |
| `src/infrastructure/database/transaction.ts` | Reusable PostgreSQL transaction wrapper | `withTransaction` | `pg` | Any transactional operation | Complete | M1 Character Foundation | Handles begin, commit, rollback, release, and rollback failures |
| `src/config/env.ts` | Loads and validates environment configuration | `env` | `dotenv` | None | Complete | Foundation | Validates PostgreSQL connection settings |
| `src/database/pool.ts` | Shared PostgreSQL connection pool | `databasePool` | `pg`, `env` | All PostgreSQL tables | Complete | Foundation | Production pool with error logging |
| `src/modules/characters/domain/character.constants.ts` | Character statuses, limits, initial values, and default regeneration | Character constants | None | None | Complete | M1 Character Foundation | Authoritative character defaults |
| `src/modules/characters/domain/character.errors.ts` | Character-specific application errors | Character error classes and codes | `ApplicationError` | None | Complete | M1 Character Foundation | Stable codes for API and application use |
| `src/modules/characters/domain/character.types.ts` | Character domain contracts | Character IDs, summaries, snapshots, resources, progression, unlocks | Character constants | None | Complete | M1 Character Foundation | Shared domain types |
| `src/modules/characters/domain/character-name.ts` | Character-name normalization and validation | Name normalization and parsing functions | Character constants and errors | None | Complete | M1 Character Foundation | Supports Unicode letters, spaces, apostrophes, and hyphens |
| `src/modules/characters/domain/resource-regeneration.ts` | Deterministic resource regeneration | `regenerateCharacterResources` | Character types and errors | None | Complete | M1 Character Foundation | Uses complete minutes and preserves partial-minute progress |
| `src/modules/characters/application/character.repository.ts` | Persistence contract for the character module | `CharacterRepository` and operation inputs | Character domain types | Character persistence tables | Complete | M1 Character Foundation | Keeps application services independent from PostgreSQL |
| `src/modules/characters/application/create-character.service.ts` | Validates and creates a complete character graph | `CreateCharacterService` | Character repository and name parser | Character persistence tables through repository | Complete | M1 Character Foundation | Supplies default loadout names |
| `src/modules/characters/application/list-characters.service.ts` | Lists characters for an account | `ListCharactersService` | Character repository | `characters` through repository | Complete | M1 Character Foundation | Account-scoped |
| `src/modules/characters/application/get-character-snapshot.service.ts` | Loads snapshots and regenerates active-character resources | `GetCharacterSnapshotService` | Repository, clock, regeneration | `characters`, unlocks, mastery | Complete | M1 Character Foundation | Archived characters are read-only and do not regenerate |
| `src/modules/characters/application/archive-character.service.ts` | Archives an owned active character | `ArchiveCharacterService` | Character repository | `characters` | Complete | M1 Character Foundation | Returns not found when archiving is unavailable |
| `src/modules/characters/infrastructure/postgres-character.mapper.ts` | Maps PostgreSQL rows into domain objects | Row types and mapping functions | Character domain | None directly | Complete | M1 Character Foundation | Validates bigint, safe integers, dates, and spell power |
| `src/modules/characters/infrastructure/postgres-character.repository.ts` | PostgreSQL implementation of character persistence | `PostgresCharacterRepository` | `pg`, transaction helper, mapper | `accounts`, `characters`, `character_statistics`, `character_unlocks`, `character_spell_mastery`, `character_loadouts`, `equipment_loadouts` | Complete | M1 Character Foundation | Enforces atomic creation, ownership, limits, uniqueness, archive, and resource updates |
| `src/http/http-json.ts` | JSON parsing and serialization for Node HTTP | JSON errors, `readJsonBody`, `sendJson`, `stringifyJson` | `node:http` | None | Complete | M1 Character Foundation | Body limit is 16,384 bytes; bigint serializes as decimal strings |
| `src/http/http-error.ts` | Maps application and HTTP errors to safe responses | `mapErrorToHttpResponse` | Application errors and HTTP JSON errors | None | Complete | M1 Character Foundation | Unexpected errors do not expose internal details |
| `src/http/http-auth.ts` | HTTP authentication contract and required-authentication guard | Authentication types, provider interface, guard, 401 error | `ApplicationError`, `node:http` | None | Complete | M1 Character Foundation | Account ID comes only from authentication context |
| `src/http/postgres-authentication.provider.ts` | Validates Bearer sessions against PostgreSQL | `PostgresAuthenticationProvider`, `hashSessionToken` | `node:crypto`, `pg` | `account_sessions`, `accounts` | Complete | M1 Character Foundation | Uses SHA-256 token hashes; rejects expired, revoked, and inactive sessions |
| `src/modules/characters/http/character-http.request.ts` | Parses and validates character HTTP inputs | Request parser, character ID parser, invalid-request error | Character types and application errors | None | Complete | M1 Character Foundation | Leaves name validation to the domain |
| `src/modules/characters/http/character-http.handler.ts` | Routes authenticated character HTTP requests | `createCharacterHttpHandler` | HTTP utilities and character services | Through services and repositories | Complete | M1 Character Foundation | Implements four character routes |
| `src/app.ts` | Composes production dependencies and creates the HTTP server | `createApplicationServer` | Pool, authentication provider, repository, services, handler | Character and session tables | Complete | M1 Character Foundation | Composition root |
| `src/server.ts` | Starts and gracefully stops the HTTP server | None | `createApplicationServer`, `databasePool` | None directly | Complete | M1 Character Foundation | Supports `HOST` and `PORT`; defaults to `0.0.0.0:3000` |
| `scripts/` | Database and game-data operational scripts | Script entry points | `tsx`, PostgreSQL, ExcelJS | Various | Existing | Foundation | Includes database test, seed, and game-data validation/import workflows |
| `database/migrations/` | Ordered PostgreSQL schema migrations | SQL schema | PostgreSQL | All application tables | Complete for M1 | M1 Character Foundation | Migration 080 adds character runtime support |
| `tests/unit/` | Fast deterministic unit tests | Vitest suites | Vitest | Mocked where applicable | Complete | M1 Character Foundation | Covers domain, services, HTTP, authentication, mapping, clock, and transactions |
| `tests/integration/characters/` | Real PostgreSQL character persistence tests | Vitest suites | PostgreSQL, repository, helpers | Character graph tables and accounts | Complete | M1 Character Foundation | Covers limits, ownership, uniqueness, rollback, archive, list, snapshot, and resources |
| `tests/integration/http/` | Real PostgreSQL session authentication tests | Vitest suites | PostgreSQL, authentication provider | `accounts`, `account_sessions` | Complete | M1 Character Foundation | Covers valid, expired, revoked, inactive, and unknown sessions |
| `tests/helpers/test-account.ts` | Creates and removes isolated test accounts | Test account helpers | `pg` | `accounts`, `characters` | Complete | M1 Character Foundation | Used by integration tests |

## Existing routes

| Method | Route | Authentication | Purpose | Status |
|---|---|---|---|---|
| `POST` | `/characters` | Required | Create a complete character graph | Complete |
| `GET` | `/characters` | Required | List characters owned by the authenticated account | Complete |
| `GET` | `/characters/:characterId` | Required | Get an owned character snapshot and regenerate active resources | Complete |
| `POST` | `/characters/:characterId/archive` | Required | Archive an owned active character | Complete |

## Existing server bootstrap

- Entry point: `src/server.ts`
- Composition root: `src/app.ts`
- Development command: `npm run dev`
- Production build: `npm run build`
- Production start: `npm start`
- Default address: `0.0.0.0:3000`
- Graceful shutdown: `SIGINT` and `SIGTERM`

## Database pool

- File: `src/database/pool.ts`
- Export: `databasePool`
- Driver: `pg`
- Configuration source: `src/config/env.ts`
- Maximum pool size: 10
- Idle timeout: 30 seconds
- Connection timeout: 5 seconds

## Authentication middleware

There is no framework middleware. Authentication is implemented through:

- `AuthenticationProvider`
- `requireAuthentication`
- `PostgresAuthenticationProvider`

Every character route authenticates before calling an application service. Raw tokens are never queried directly; SHA-256 hashes are compared with `account_sessions.session_token_hash`.

## Error handling

- Domain and application failures use `ApplicationError`.
- HTTP errors are mapped by `mapErrorToHttpResponse`.
- Known failures retain stable codes and status values.
- Unexpected failures return `500 INTERNAL_SERVER_ERROR` without internal details.
- JSON parsing and body-size failures have dedicated errors.

## Configuration

Required database environment variables:

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`

Optional server environment variables:

- `HOST`, default `0.0.0.0`
- `PORT`, default `3000`

## Test setup

- Test runner: Vitest
- `npm run typecheck`: TypeScript validation
- `npm run test:unit`: unit suite
- `npm run test:integration`: PostgreSQL integration suite
- `npm test`: complete test suite
- `npm run db:test`: PostgreSQL connectivity and table count
- `npm run game-data:validate`: authored workbook validation
- `npm run build`: production-only TypeScript build

## Milestone status

M1 Character Foundation is complete.
