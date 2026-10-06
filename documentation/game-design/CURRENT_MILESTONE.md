# Current Milestone

## Milestone

M1: Character Foundation

## Status

Completed.

## Objective

Deliver a production-ready character foundation supporting authenticated character creation, listing, snapshot retrieval, deterministic resource regeneration, and archiving.

## Scope

- Shared application errors, clock abstraction, and PostgreSQL transactions
- Character domain constants, types, validation, and resource regeneration
- Repository contract, PostgreSQL mapper, and transactional persistence
- Character application services
- JSON HTTP utilities, request parsing, error mapping, and authentication
- Four authenticated character routes
- Node.js HTTP server bootstrap and production build
- Unit, integration, authorization, rollback, and manual smoke tests

## Out of scope

- Registration, login, password verification, token creation, refresh, and logout
- Character deletion, restoration, renaming, and selection state
- Combat, inventory, equipment changes, spells, crafting, gathering, and achievements
- Frontend, deployment automation, rate limiting, and HTTPS termination

## Design decisions

### Architecture

The feature is divided into Domain, Application, Infrastructure, and HTTP layers. Domain logic does not depend on PostgreSQL or HTTP. Application services use the `CharacterRepository` contract. PostgreSQL queries and mapping remain in infrastructure.

### Transactions

Character creation is atomic. One transaction creates the character, statistics, unlocks, spell mastery, default spell loadout, and default equipment loadout. Any failure rolls back the entire graph. The account row is locked with `FOR UPDATE` before checking the active-character limit.

### Ownership

Repository operations are scoped by both `account_id` and `character_id`. The HTTP API never accepts an account identifier from the request. The authenticated session is the only source of `accountId`.

### Authentication

The API accepts `Authorization: Bearer <session-token>`. Raw tokens are hashed with SHA-256 before lookup. Missing, malformed, unknown, expired, or revoked sessions are rejected, as are sessions for non-active accounts. Successful authentication updates `last_activity_at`.

### Numeric and JSON mapping

PostgreSQL `bigint` progression values map to JavaScript `bigint`. Resource values map to JavaScript `number` after safe-integer validation. HTTP JSON serializes `bigint` values as decimal strings.

### Resource regeneration

Regeneration uses complete elapsed minutes, never exceeds maxima, preserves partial-minute progress, and cannot apply the same interval twice. Archived characters do not regenerate. Defaults: Health 0/min, Mana 0/min, Energy 1/min.

### HTTP and build

The API uses built-in `node:http`, consistent JSON responses, a 16,384-byte body limit, and generic unexpected-error responses. Production compilation uses `tsconfig.build.json` and includes only `src/`; tests are excluded from `dist/`.

## Database tables involved

- `accounts`
- `account_sessions`
- `characters`
- `character_statistics`
- `character_unlocks`
- `character_spell_mastery`
- `character_loadouts`
- `equipment_loadouts`

Referenced tables include `seasons`, `spells`, `items`, `monsters`, and `bosses`.

## API contracts

All routes require authentication.

- `POST /characters`: create a character, returns `201 Created`
- `GET /characters`: list characters for the authenticated account, returns `200 OK`
- `GET /characters/:characterId`: return an account-scoped snapshot, returns `200 OK`
- `POST /characters/:characterId/archive`: archive an active owned character, returns `200 OK`

Standard errors include:

- `400 INVALID_JSON_BODY`
- `400 INVALID_HTTP_REQUEST`
- `400 CHARACTER_NAME_INVALID`
- `401 AUTHENTICATION_REQUIRED`
- `403 CHARACTER_ACCESS_DENIED`
- `404 CHARACTER_NOT_FOUND`
- `404 ROUTE_NOT_FOUND`
- `409 CHARACTER_NAME_TAKEN`
- `409 CHARACTER_LIMIT_REACHED`
- `409 CHARACTER_ALREADY_ARCHIVED`
- `413 REQUEST_BODY_TOO_LARGE`
- `500 INTERNAL_SERVER_ERROR`

## Domain rules

- Maximum three active characters per account
- Archived characters do not consume active slots
- Character creation requires an active account and is atomic
- Names are globally unique after normalization
- Names contain 3-24 characters and support Unicode letters, single spaces, apostrophes, and hyphens
- Leading/trailing whitespace is removed and repeated spaces are collapsed
- Digits, underscores, and invalid separator placement are rejected
- Initial values: Level 1, XP 0, Gold 0, Health 180, Mana 35, Energy 100, Attack 7, Defense 7, Spell Power 100%, crafting and gathering level 1, one spell slot, one crafting slot, 50 inventory slots, not promoted
- Only active owned characters can be archived
- Archiving frees an active slot

## Implementation checklist

- [x] Shared application and transaction foundation
- [x] Character domain rules and validation
- [x] Deterministic resource regeneration
- [x] Repository contract and PostgreSQL persistence
- [x] Transactional character graph creation
- [x] Create, list, snapshot, and archive services
- [x] HTTP JSON utilities and error mapping
- [x] PostgreSQL session authentication
- [x] Four authenticated character routes
- [x] Server bootstrap and production build
- [x] Unit, integration, authorization, and rollback tests
- [x] Manual API smoke test
- [x] Final documentation commit

## File completion order

1. Foundation and migration
2. Character domain
3. Repository contract and PostgreSQL persistence
4. Application services
5. HTTP utilities, authentication, and routing
6. Application composition and server bootstrap
7. Unit and integration tests
8. Documentation closure

## Test matrix

| Area | Unit | Integration | Manual |
|---|---:|---:|---:|
| Application errors and transactions | Yes | Yes | No |
| Character validation and regeneration | Yes | No | No |
| PostgreSQL mapping and repository | Yes | Yes | No |
| Limits, normalized names, ownership, rollback | No | Yes | No |
| Application services | Yes | No | No |
| HTTP JSON, errors, requests, and routing | Yes | No | Yes |
| Session hashing and authentication | Yes | Yes | Yes |
| Production build | No | No | Yes |

## Definition of done

- [x] Domain rules and initial values defined
- [x] Ownership and three-active-character limit enforced
- [x] Transactional creation and rollback verified
- [x] Create, list, snapshot, regeneration, and archive implemented
- [x] Authenticated HTTP API implemented
- [x] Unit and integration suites pass
- [x] Type-check and production build pass
- [x] PostgreSQL connectivity verified
- [x] Authored game data validated
- [x] Manual 401 and 404 smoke tests pass
- [x] Documentation committed

## Open questions

- Final Health and Mana regeneration rates
- Registration, login, refresh, logout, and forced revocation flows
- Rate limiting and HTTPS/reverse-proxy configuration
- Character renaming, restoration, and selection rules
- Frontend integration and deployment configuration

## Completion log

### Foundation completion log

| Date | Change | Evidence |
|---|---|---|
| 2026-10-06 | Added migration 080 | `resources_updated_at` and normalized-name index verified |
| 2026-10-06 | Added Vitest | TypeScript smoke test passed |
| 2026-10-06 | Verified PostgreSQL | Connected successfully; 78 tables detected |
| 2026-10-06 | Verified authored content | 29 worksheets and 248 rows validated |

### Implementation completion log

| Commit | Change |
|---|---|
| `3721e29` | Prepare character foundation schema and test infrastructure |
| `398e47b` | Add shared application and transaction foundation |
| `653e59b` | Add character domain rules and resource regeneration |
| `c531a3d` | Add PostgreSQL character persistence |
| `aa8cba8` | Add character application services |
| `b6da8c3` | Add authenticated character HTTP API |

### Verification summary

- TypeScript type-check passed
- Production build passed
- PostgreSQL connectivity passed with 78 tables detected
- Authored content validation passed for 29 worksheets and 248 rows
- Unit, integration, authorization, and rollback tests passed
- Manual unauthenticated request returned HTTP 401
- Manual unknown-route request returned HTTP 404
