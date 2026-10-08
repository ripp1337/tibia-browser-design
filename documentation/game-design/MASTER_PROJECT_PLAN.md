# OSTATNIA SZANSA: V1 MASTER PROJECT PLAN

## PROJECT OBJECTIVE

Deliver a playable browser-based RPG where the player can:

Create Character
→ Fight Monsters
→ Gain Experience, Gold, Items, and Materials
→ Equip and Improve Items
→ Use Spells and Consumables
→ Craft Items
→ Gather Materials Offline
→ Trade Through the Marketplace
→ Fight Bosses
→ Complete Achievements and Collections
→ Participate in Seasonal Competition

The game has three primary progression pillars:

1. Combat
2. Economy
3. Crafting and Gathering

Real content creation and balancing are postponed until the associated gameplay systems are implemented and testable.

---

## PROJECT RULES

1. Build complete vertical slices rather than isolated systems.
2. Every milestone must produce a working and testable result.
3. Keep domain logic separate from HTTP controllers and PostgreSQL repositories.
4. The server is authoritative for combat, rewards, costs, ownership, time, and randomness.
5. The client must never generate rewards, random outcomes, timestamps, or final statistics.
6. Randomness must be injectable and reproducible in tests.
7. Time must be injectable and reproducible in tests.
8. Multi-record operations must use database transactions.
9. Duplicate requests must not duplicate actions, rewards, costs, or resources.
10. Use stable content codes when referring to authored content.
11. Treat `dev_*` definitions as development fixtures, not final content.
12. Do not perform production balancing before the associated system exists.
13. Later milestones may depend on earlier milestones, never the reverse.
14. A milestone is incomplete until its automated tests pass.
15. Runtime records must survive application restarts.
16. Account-wide and character-specific progression must remain separate.
17. Seasonal and non-ladder economies must remain isolated.
18. Important resource creation and destruction must be measurable.

---

## OWNERSHIP MODEL

### Account-wide systems

- Achievements
- Achievement Score
- Holy Grail
- Outfit unlocks
- Addon unlocks
- Friend relationships
- Account punishments
- Account administration history

### Character-specific systems

- Level
- Experience
- Gold
- Health
- Mana
- Energy
- Equipment
- Inventory
- Materials
- Consumables
- Spell ownership
- Spell loadout
- Spell Mastery
- Crafting progression
- Gathering progression
- Combat statistics
- Monster kill statistics
- Bestiary
- Active buffs
- Permanent character upgrades
- Marketplace listings
- Seasonal progression

### Character rules

- Maximum three active characters per account.
- Character names are globally unique.
- Characters progress independently.
- Gold, items, materials, consumables, and progression are not shared directly.
- Archived characters are view-only.
- Archived characters free an active character slot.
- Archiving never deletes progression.

---

# GOAL 1: CORE PLAYABLE LOOP

Prove the fundamental loop:

Character
→ Combat
→ Rewards
→ Equipment
→ Increased Power
→ Stronger Combat

---

## M1: CHARACTER FOUNDATION

### Status

Completed.

### Objective

Deliver a production-ready character foundation supporting authenticated character creation, character listing, gameplay-ready snapshot retrieval, deterministic resource regeneration, and character archiving.

### Implemented scope

- Shared application-error foundation.
- Injectable `Clock` abstraction.
- PostgreSQL transaction helper.
- Character domain constants and types.
- Character-name normalization and validation.
- Deterministic resource regeneration.
- Character repository contract.
- PostgreSQL character persistence and mapping.
- Transactional creation of the complete character graph.
- Character creation service.
- Character listing service.
- Character snapshot service.
- Character archiving service.
- HTTP JSON utilities.
- HTTP request parsing and error mapping.
- PostgreSQL-backed session authentication.
- Four authenticated character endpoints.
- Node.js HTTP server bootstrap.
- Production TypeScript build.
- Unit, integration, authorization, rollback, and manual smoke tests.

### Architecture

The character feature is separated into:

- Domain,
- Application,
- Infrastructure,
- HTTP.

Domain logic does not depend on PostgreSQL or HTTP.

Application services depend on the `CharacterRepository` contract.

PostgreSQL queries and database mapping remain in the infrastructure layer.

HTTP handlers authenticate requests, parse input, invoke application services, and map application errors to stable JSON responses.

### Initial character state

A newly created character starts with:

- Level: `1`
- Experience: `0`
- Gold: `0`
- Health: `180 / 180`
- Mana: `35 / 35`
- Energy: `100 / 100`
- Base Attack: `7`
- Base Defense: `7`
- Base Spell Power: `100%`
- Spell Slots: `1`
- Inventory Capacity: `50`
- Crafting Level: `1`
- Crafting Experience: `0`
- Gathering Level: `1`
- Gathering Experience: `0`
- Crafting Slots: `1`
- Promotion: `false`
- Archived: `false`

### Character-name rules

Character names:

- are globally unique after normalization,
- contain from `3` through `24` characters,
- support Unicode letters,
- may contain single spaces,
- may contain apostrophes,
- may contain hyphens,
- have leading and trailing whitespace removed,
- have repeated spaces collapsed.

Character names reject:

- digits,
- underscores,
- invalid separator placement,
- duplicate normalized names.

### Character creation transaction

Character creation is atomic.

The transaction:

1. Locks the account row using `FOR UPDATE`.
2. Validates that the account is active.
3. Counts active characters.
4. Rejects creation when the account already has three active characters.
5. Normalizes and validates the character name.
6. Creates the character.
7. Creates character statistics.
8. Creates character unlock records.
9. Creates character spell-mastery state.
10. Creates the default spell loadout.
11. Creates the default equipment loadout.
12. Initializes mandatory progression data.
13. Commits the complete character graph.

If any operation fails, the entire transaction is rolled back.

### Character limit and archiving

- An account may have a maximum of three active characters.
- Archived characters do not consume active character slots.
- Only active characters owned by the authenticated account may be archived.
- Archiving does not delete character progression.
- Archiving frees one active character slot.
- An already archived character cannot be archived again through the active-character operation.

### Ownership isolation

Repository operations are scoped by:

- `account_id`,
- `character_id`.

The HTTP API does not accept an account ID from the client.

The authenticated session is the only source of `accountId`.

A user cannot retrieve, modify, or archive another account’s character.

### Authentication

The character API accepts:

```http
Authorization: Bearer <session-token>
```

Raw session tokens are hashed with SHA-256 before database lookup.

Authentication rejects:

- missing authorization,
- malformed authorization,
- unknown sessions,
- expired sessions,
- revoked sessions,
- sessions belonging to non-active accounts.

Successful authentication updates `last_activity_at`.

Registration, login, token creation, token refresh, logout, and password verification remain outside M1.

### Resource regeneration

Resource regeneration is deterministic and uses an injected `Clock`.

Rules:

- only complete elapsed minutes are applied,
- resources never exceed their maximum values,
- partial-minute progress is preserved,
- the same elapsed interval cannot be applied twice,
- archived characters do not regenerate.

M1 regeneration defaults:

- Health: `0` per minute,
- Mana: `0` per minute,
- Energy: `1` per minute.

The `resources_updated_at` timestamp records the authoritative regeneration checkpoint.

### Numeric and JSON mapping

PostgreSQL progression values stored as `bigint` map to JavaScript `bigint`.

Resource values map to JavaScript `number` after safe-integer validation.

HTTP JSON serializes JavaScript `bigint` values as decimal strings.

### Implemented endpoints

```http
POST /characters
GET /characters
GET /characters/:characterId
POST /characters/:characterId/archive
```

All endpoints require authentication.

#### Create character

```http
POST /characters
```

Creates the complete character graph and returns:

```http
201 Created
```

#### List characters

```http
GET /characters
```

Returns characters belonging to the authenticated account.

#### Get character snapshot

```http
GET /characters/:characterId
```

Returns an account-scoped gameplay snapshot.

The snapshot includes the character’s persistent resources and progression data required by the implemented foundation.

Effective Character Statistics were integrated later in M2.

#### Archive character

```http
POST /characters/:characterId/archive
```

Archives an active character owned by the authenticated account.

### HTTP behavior

The API uses the built-in `node:http` server.

HTTP infrastructure provides:

- consistent JSON responses,
- JSON request parsing,
- a maximum request-body size of `16,384` bytes,
- stable application-error responses,
- generic responses for unexpected internal errors.

Production compilation uses `tsconfig.build.json`.

Only production source files are included in `dist`; tests are excluded.

### Stable errors

M1 includes stable errors such as:

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

### Database tables involved

Primary M1 tables include:

- `accounts`
- `account_sessions`
- `characters`
- `character_statistics`
- `character_unlocks`
- `character_spell_mastery`
- `character_loadouts`
- `equipment_loadouts`

Referenced tables include:

- `seasons`
- `spells`
- `items`
- `monsters`
- `bosses`

### Schema support

M1 used the existing character-related schema and added:

```text
080_character_foundation_support.sql
```

The migration added foundation support including:

- the resource-regeneration checkpoint,
- normalized-name support required by character-name uniqueness.

The M1 database verification detected `78` tables at completion.

Later milestones added further migrations and tables.

### Implemented files

```text
src/modules/characters/
├── application/
│   ├── archive-character.service.ts
│   ├── character.repository.ts
│   ├── create-character.service.ts
│   ├── get-character-snapshot.service.ts
│   └── list-characters.service.ts
├── domain/
│   ├── character.constants.ts
│   ├── character.errors.ts
│   ├── character.types.ts
│   ├── character-name.ts
│   └── resource-regeneration.ts
├── http/
│   ├── character-http.handler.ts
│   └── character-http.request.ts
└── infrastructure/
    ├── postgres-character.mapper.ts
    └── postgres-character.repository.ts
```

Shared M1 infrastructure also includes:

- application errors,
- PostgreSQL transaction handling,
- system clock,
- HTTP authentication,
- HTTP JSON handling,
- HTTP error mapping,
- application composition,
- server bootstrap.

Files related to effective statistics and equipment repositories were added or expanded in M2 and are documented under M2 rather than M1.

### Verification

M1 completion verified:

- transactional character creation,
- complete graph rollback,
- active-character limit enforcement,
- normalized global name uniqueness,
- account ownership isolation,
- character creation,
- character listing,
- character snapshot retrieval,
- deterministic resource regeneration,
- character archiving,
- PostgreSQL session authentication,
- HTTP request parsing,
- HTTP error mapping,
- authenticated character routes,
- production TypeScript compilation,
- manual unauthenticated-request behavior,
- manual unknown-route behavior.

Verification results recorded at M1 completion:

- TypeScript typecheck passed.
- Production build passed.
- PostgreSQL connectivity passed.
- `78` database tables were detected.
- Authored-content validation passed for `29` worksheets and `248` rows.
- Unit tests passed.
- Integration tests passed.
- Authorization tests passed.
- Transaction rollback tests passed.
- Manual unauthenticated request returned HTTP `401`.
- Manual unknown route returned HTTP `404`.

### Completion commits

```text
3721e29  Prepare character foundation schema and test infrastructure
398e47b  Add shared application and transaction foundation
653e59b  Add character domain rules and resource regeneration
c531a3d  Add PostgreSQL character persistence
aa8cba8  Add character application services
b6da8c3  Add authenticated character HTTP API
5f06d5f  Complete M1 character foundation milestone
```

### Definition of done

- [x] Character domain rules and initial values defined.
- [x] Character-name normalization and validation implemented.
- [x] Maximum of three active characters enforced.
- [x] Archived characters excluded from the active-character limit.
- [x] Account ownership isolation enforced.
- [x] Character creation implemented transactionally.
- [x] Complete character-graph rollback verified.
- [x] Character listing implemented.
- [x] Character snapshot retrieval implemented.
- [x] Deterministic resource regeneration implemented.
- [x] Resource maxima enforced.
- [x] Character archiving implemented.
- [x] PostgreSQL session authentication implemented.
- [x] Four authenticated HTTP endpoints implemented.
- [x] Unit and integration tests passed.
- [x] Authorization and rollback tests passed.
- [x] TypeScript typecheck passed.
- [x] Production build passed.
- [x] PostgreSQL connectivity verified.
- [x] Manual HTTP smoke tests passed.
- [x] M1 documentation completed.

### Out of scope

The following remained outside M1:

- registration,
- login,
- password verification,
- session-token creation,
- token refresh,
- logout,
- character deletion,
- character restoration,
- character renaming,
- character selection state,
- authoritative Effective Character Statistics,
- combat,
- monster discovery,
- inventory operations,
- equipment changes,
- spells,
- crafting,
- gathering,
- achievements,
- frontend implementation,
- deployment automation,
- rate limiting,
- HTTPS termination.

### Completion log

M1 Character Foundation completed and verified.

M2 continues the character module with the authoritative Effective Character Statistics system.

---

## M2: EFFECTIVE CHARACTER STATISTICS

### Status

Completed.

### Objective

Provide one authoritative and deterministic calculator for effective character statistics.

The calculator is used by character snapshots, equipment operations, combat preparation, and future reward or progression systems.

### Implemented scope

- Normalized Spell Power representation.
- Pure effective-statistics domain calculator.
- Character-level Health and Mana progression.
- Character-level Energy progression.
- Spell Mastery contribution.
- Equipped item base statistics.
- Equipped item affixes.
- Set bonuses.
- Completed account achievement bonuses.
- Active Gold and Experience progression boosts.
- Optional combat-context modifiers.
- PostgreSQL calculation-source repository.
- Central statistics application service.
- Character snapshot integration.
- Resource maximum synchronization.
- Current-resource hard clamping.
- Transactional equipment operations.
- Equipment ownership and level validation.
- Equipment-slot replacement.
- Two-handed weapon and Shield conflict handling.
- Unit and PostgreSQL integration coverage.

### Central application service

The authoritative application entry point is:

```ts
CalculateCharacterStatsService.execute({
  characterId
})
```

The application service:

1. Loads authoritative calculation sources from the repository.
2. Rejects a missing character.
3. Passes the sources to the pure domain calculator.
4. Returns the final effective statistics.

### Effective statistics

The calculator returns:

```ts
type EffectiveCharacterStatistics = {
  attack: number;
  defense: number;
  spellPower: number;
  maximumHealth: number;
  maximumMana: number;
  maximumEnergy: number;
  goldBonusPercent: number;
  experienceBonusPercent: number;
};
```

### Calculation sources

Implemented sources:

- base character statistics,
- character level,
- Spell Mastery Power,
- equipped item base statistics,
- equipped item affixes,
- highest reached set-bonus threshold,
- completed account achievement bonuses,
- active Gold progression boosts,
- active Experience progression boosts,
- optional combat-context modifiers.

There is no separate permanent-character-bonus source in M2.

An experimental permanent-bonus implementation was added and then reverted during development.

### Calculation model

```text
Base Character Statistics
+ Character Level Progression
+ Spell Mastery Power
+ Equipped Item Base Statistics
+ Equipped Item Affixes
+ Active Set Bonuses
+ Completed Achievement Bonuses
+ Active Progression Boosts
+ Optional Combat Modifiers
= Effective Character Statistics
```

### Base statistics

At level `1`, without external modifiers:

```text
Attack:             7
Defense:            7
Spell Power:        100
Maximum Health:     180
Maximum Mana:       35
Maximum Energy:     100
Gold Bonus:         0%
Experience Bonus:   0%
```

### Level progression

Character level affects maximum resources.

Health and Mana progression begins from level `2`.

Maximum Energy follows level thresholds and is capped.

Verified Energy values include:

```text
Level 1:    100
Level 19:   100
Level 20:   110
Level 30:   115
Level 40:   120
Level 100:  150
Level 150:  175
Level 200:  200
Level 201:  200
```

Character level must be a positive safe integer.

### Spell Power

Spell Power uses one normalized numeric representation.

Migration `081_effective_character_statistics.sql` renamed:

```text
current_spell_power_percent
```

to:

```text
current_spell_power
```

The migration also replaced the previous check constraint with a constraint requiring non-negative Spell Power.

Spell Mastery Power contributes directly to effective Spell Power.

Negative Spell Mastery Power is rejected.

### Equipment statistics

Only inventory items where:

```sql
inventory_items.is_equipped = TRUE
```

contribute to effective statistics.

Unequipped items are ignored.

Equipment contributions include:

- Attack,
- Defense,
- Spell Power,
- maximum Health,
- maximum Mana,
- maximum Energy,
- Gold Bonus percentage points,
- Experience Bonus percentage points.

### Item affixes

Affix roll values from equipped items contribute to the matching statistic.

Affixes attached to unequipped items are ignored.

Item-base statistics and affix statistics are added together before the final calculation.

### Set bonuses

Set bonuses are calculated from equipped set pieces.

When several thresholds exist for the same set and bonus type, only the highest reached threshold is applied.

Example:

```text
2 pieces: +10 Attack
4 pieces: +20 Attack
```

With four equipped pieces, the result is:

```text
+20 Attack
```

The lower threshold is not added again.

### Achievement bonuses

Only completed achievements contribute bonuses.

Incomplete achievements are ignored.

Achievement bonuses are account-wide and affect each character belonging to that account.

Implemented achievement contributions include:

- Attack,
- Defense,
- Gold Bonus percentage points,
- Experience Bonus percentage points.

### Progression boosts

M2 supports active progression boosts for:

- Gold Bonus,
- Experience Bonus.

Valid progression boosts may use permanent, time-based, or fight-based duration data according to their stored definition.

Expired boosts are ignored.

Combat-turn buffs and debuffs are not included in a normal out-of-combat character snapshot.

### Combat modifiers

The pure calculator accepts optional combat-context modifiers for:

- Attack,
- Defense,
- Spell Power.

Combat modifiers are kept separate from persistent progression boosts.

M2 does not load active combat effects into the normal character snapshot.

Combat modifiers are supplied explicitly by a combat context when required.

Final combat statistics cannot fall below `0`.

This minimum applies to:

- Attack,
- Defense,
- Spell Power.

### Percentage bonuses

Gold and Experience bonuses are additive percentage points.

Example:

```text
Equipment Gold Bonus:      20
Achievement Gold Bonus:     5
Progression Gold Bonus:    15
Final Gold Bonus:          40
```

The calculator does not multiply individual percentage sources.

### Numeric rules

- Character level must be a positive safe integer.
- Spell Mastery Power must be non-negative.
- Persistent calculation sources must contain finite, non-negative numeric values.
- Invalid database values are rejected.
- Final integer combat and resource statistics are rounded down.
- Attack cannot be lower than `0`.
- Defense cannot be lower than `0`.
- Spell Power cannot be lower than `0`.
- Gold and Experience bonuses are returned as additive percentage points.

### Determinism and immutability

The domain calculator is deterministic.

Repeated calculations with identical input return identical output.

The calculator does not mutate its input.

Final-statistic formulas do not depend on:

- PostgreSQL,
- HTTP,
- system time,
- randomness.

### Architecture

The implementation is separated into:

- pure domain calculation,
- calculation-source repository contract,
- PostgreSQL calculation-source repository,
- central application service,
- character snapshot integration,
- transactional equipment repository.

Final-statistic formulas exist only in the domain calculator.

Controllers do not calculate statistics.

PostgreSQL repositories load and aggregate authoritative source data but do not own final-statistic formulas.

### Character snapshot integration

The character snapshot uses `CalculateCharacterStatsService`.

The snapshot returns effective statistics together with persistent character data.

The snapshot flow:

1. Loads the owned character snapshot.
2. Calculates current effective statistics.
3. Replaces stored resource maximums with effective maximums.
4. Clamps current resources if a maximum decreased.
5. Applies deterministic resource regeneration for active characters.
6. Persists resource changes when required.
7. Returns the updated snapshot with effective statistics.

Archived characters receive effective statistics but do not regenerate resources.

### Resource synchronization

Effective maximums control:

- maximum Health,
- maximum Mana,
- maximum Energy.

When an effective maximum decreases, the current value is hard-clamped:

```text
currentHealth <= maximumHealth
currentMana   <= maximumMana
currentEnergy <= maximumEnergy
```

Clamping is persisted even when no complete regeneration minute has elapsed.

### Equipment operations

M2 introduced transactional equipment operations through `PostgresEquipmentRepository`.

Implemented operations:

- equip an owned inventory item,
- unequip an equipped inventory item.

Each operation:

1. Begins a PostgreSQL transaction.
2. Locks the owned active character.
3. Locks the selected inventory item.
4. Validates item ownership.
5. Validates the character level requirement.
6. Applies equipment-slot rules.
7. Updates equipped-state records.
8. Recalculates effective statistics.
9. Persists new maximum resources.
10. Hard-clamps current resources if required.
11. Commits the transaction.
12. Returns updated equipment state, effective statistics, and resources.

Any failure rolls back the whole operation.

### Equipment-slot rules

- Equipping an item replaces the currently equipped item in the same slot.
- Equipping a two-handed weapon automatically unequips the Shield.
- Equipping a Shield automatically unequips an equipped two-handed weapon.
- Item level requirements are validated before equipment state changes.
- An invalid equipment operation does not alter the currently equipped items.
- Resource maxima and current-resource clamps are persisted in the same transaction as the equipment change.

### Item handedness

Migration `082_add_item_handedness.sql` added explicit item handedness required by equipment conflict handling.

Supported weapon-handedness behavior includes:

- one-handed weapons,
- two-handed weapons,
- two-handed weapon and Shield mutual exclusion.

### Stable equipment errors

M2 added equipment-specific application errors, including rejection of items whose required level exceeds the character level.

Verified error code:

```text
EQUIPMENT_LEVEL_REQUIRED
```

Invalid operations leave equipment and resources unchanged.

### Database tables involved

Primary calculation sources include:

- `characters`
- `character_spell_mastery`
- `inventory_items`
- `items`
- `item_bases`
- `item_affixes`
- `affix_templates`
- `set_templates`
- `set_bonuses`
- `achievements`
- `achievement_progress`
- `character_buffs`

### Implemented files

```text
src/modules/characters/
├── application/
│   ├── calculate-character-stats.service.ts
│   ├── character-statistics.repository.ts
│   ├── equipment.repository.ts
│   └── get-character-snapshot.service.ts
├── domain/
│   └── effective-character-statistics.ts
└── infrastructure/
    ├── postgres-character-statistics.repository.ts
    └── postgres-equipment.repository.ts
```

M2 also updated:

- character constants,
- character errors,
- character types,
- character snapshot composition,
- application dependency composition,
- PostgreSQL character mapping,
- database-design documentation.

### Schema changes

M2 added:

```text
081_effective_character_statistics.sql
082_add_item_handedness.sql
```

Migration `081`:

- normalized the Spell Power column name,
- enforced non-negative Spell Power.

Migration `082`:

- added item handedness,
- enabled authoritative two-handed weapon and Shield conflict handling.

### Test coverage

Automated coverage includes:

- level `1` base statistics,
- Health and Mana level progression,
- Energy progression thresholds,
- Energy cap,
- Spell Mastery Power,
- equipped item statistics,
- ignored unequipped items,
- equipped item affixes,
- ignored affixes from unequipped items,
- highest reached set-bonus threshold,
- completed achievements,
- ignored incomplete achievements,
- active Gold progression boosts,
- active Experience progression boosts,
- ignored combat buffs outside combat,
- ignored expired buffs,
- optional combat modifiers,
- zero minimum for combat statistics,
- additive Gold and Experience percentage points,
- deterministic repeated calculations,
- input immutability,
- invalid character level,
- invalid Spell Mastery Power,
- invalid persistent numeric sources,
- missing characters,
- character snapshot integration,
- resource hard clamping,
- transactional equip operations,
- transactional unequip operations,
- same-slot replacement,
- two-handed weapon and Shield conflicts,
- equipment level rejection,
- rollback-safe equipment behavior.

### Completion commits

```text
d54fa19  Normalize spell power model for M2
3500fad  Add M2 effective character statistics foundation
96dd873  Implement effective character statistics
2c4ff41  Add achievement bonuses to effective statistics
70a4c75  Add active buffs to effective statistics
4fac0c3  Add permanent bonuses to effective statistics
5d4e219  Revert permanent bonuses from effective statistics
17a90fc  Integrate effective statistics with character snapshot
ba11478  Separate progression boosts from combat modifiers
03d8c5c  Finalize effective statistics behavior
bfd1efb  Update current milestone for M2
0082bd4  Add item handedness for equipment conflicts
4a762c2  Add equipment mutation contract and errors
e1b1b7f  Implement transactional equipment repository
342ea37  Add transactional equip and unequip operations
4637546  Complete M2 effective character statistics
```

### Definition of done

- [x] One central effective-statistics calculator exists.
- [x] All eight effective statistics are implemented.
- [x] Character level progression is included.
- [x] Spell Mastery Power is included.
- [x] Equipped item base statistics are included.
- [x] Equipped item affixes are included.
- [x] Unequipped items are ignored.
- [x] Highest reached set-bonus thresholds are applied.
- [x] Completed achievement bonuses are included.
- [x] Incomplete achievements are ignored.
- [x] Active Gold and Experience boosts are included.
- [x] Combat modifiers are separated from progression boosts.
- [x] Combat statistics cannot fall below zero.
- [x] Calculations are deterministic.
- [x] Calculator input is not mutated.
- [x] Character snapshots use the central calculator.
- [x] Effective resource maxima are synchronized.
- [x] Current resources are hard-clamped safely.
- [x] Equip operations are transactional.
- [x] Unequip operations are transactional.
- [x] Same-slot replacement is implemented.
- [x] Two-handed weapon and Shield conflicts are implemented.
- [x] Equipment level requirements are enforced.
- [x] Failed equipment operations preserve previous state.
- [x] Unit tests pass.
- [x] PostgreSQL integration tests pass.
- [x] TypeScript typecheck passes.
- [x] Production build passes.
- [x] Database verification passes.
- [x] M2 documentation is completed.

### Out of scope

The following remained outside M2:

- HTTP inventory endpoints,
- HTTP equipment endpoints,
- inventory capacity operations,
- item generation,
- loot generation,
- item rarity generation,
- affix generation,
- item upgrading,
- item rerolling,
- item salvaging,
- marketplace operations,
- final combat calculations,
- persistent combat sessions,
- spells and spell effects,
- combat consumables,
- victory rewards,
- Experience awards,
- Gold awards,
- death penalties.

The equipment repository implemented the transactional mutation foundation required by later inventory and equipment APIs, but M2 did not expose those operations through HTTP.

### Completion log

M2 Effective Character Statistics completed and verified.

M3 uses the completed character foundation and effective-statistics architecture while implementing Monster Discovery and Eligibility.

---

## M3: MONSTER DISCOVERY AND ELIGIBILITY

### Status

Completed.

### Objective

Provide authenticated, read-only monster discovery and eligibility evaluation for a character owned by the authenticated account.

M3 allows the client to discover monsters, inspect public monster details, preview Energy costs, and understand whether a monster can currently be fought.

### Implemented scope

- Authenticated monster-list endpoint.
- Authenticated monster-details endpoint.
- Character ownership enforcement.
- Stable monster-code lookup.
- Character-level eligibility.
- Energy-cost preview.
- Monster-type distinction.
- Character-specific cooldown calculation.
- Character-specific Bestiary visibility.
- Normal Monster eligibility.
- Mini Boss eligibility.
- Task Boss lifecycle eligibility.
- Daily Boss rotation eligibility.
- Daily Boss attempt eligibility.
- Deterministic time handling through `Clock`.
- PostgreSQL discovery repository.
- PostgreSQL row validation and mapping.
- Stable public application models.
- HTTP request parsing and error mapping.
- Unit, PostgreSQL integration, and HTTP integration tests.
- Tracked database migration runner.

### Implemented endpoints

```http
GET /characters/:characterId/monsters
GET /characters/:characterId/monsters/:monsterCode
```

Both endpoints require authentication.

Both endpoints validate that the selected character belongs to the authenticated account.

### Monster list

```http
GET /characters/:characterId/monsters
```

Returns discovery entries for monsters visible to the owned character.

The list may include monsters that are currently unavailable.

Each entry contains public discovery information, including:

- stable monster code,
- display name,
- monster type,
- monster level,
- Energy cost,
- eligibility state,
- ineligibility reason when applicable,
- cooldown state when applicable,
- Bestiary visibility state.

Higher-level monsters may remain visible but are reported as unavailable.

### Monster details

```http
GET /characters/:characterId/monsters/:monsterCode
```

Loads a monster by its stable public code.

The endpoint:

- validates character ownership,
- rejects an unknown monster code,
- returns public monster details,
- includes the current eligibility result,
- includes Energy-cost preview,
- does not expose unnecessary internal database identifiers.

### Stable monster codes

Public monster lookup uses:

```text
monsterCode
```

Internal database IDs are not used as public monster identifiers.

Stable codes allow authored monster definitions to be referenced without coupling clients to PostgreSQL UUIDs.

### Basic level requirement

The basic level rule is:

```text
character.level >= monster.level
```

When the character level is lower than the monster level:

```text
eligible = false
reason = LEVEL_TOO_LOW
```

The monster may still appear in discovery results.

### Supported monster types

M3 supports:

- `Normal`
- `MiniBoss`
- `TaskBoss`
- `DailyBoss`

Eligibility rules depend on the monster type.

### Eligibility result

Discovery returns a stable eligibility result containing:

- whether the monster is currently eligible,
- the specific reason when it is unavailable.

Implemented ineligibility reasons:

- `LEVEL_TOO_LOW`
- `COOLDOWN_ACTIVE`
- `TASK_PROGRESS_INCOMPLETE`
- `TASK_REUNLOCK_REQUIRED`
- `DAILY_BOSS_UNAVAILABLE`
- `DAILY_ATTEMPTS_EXHAUSTED`

### Normal Monster eligibility

A Normal Monster requires:

- the character level requirement to be satisfied,
- no active character-and-monster cooldown.

Cooldowns are specific to:

- one character,
- one monster.

A cooldown belonging to another character does not affect eligibility.

### Mini Boss eligibility

A Mini Boss requires:

- the character level requirement to be satisfied,
- no active character-and-monster cooldown.

Mini Boss cooldown eligibility uses the same deterministic cooldown model as Normal Monsters.

### Cooldown model

Cooldown state is calculated from:

- the authoritative cooldown timestamp,
- the current time supplied through `Clock`.

The eligibility layer does not call `Date.now()` directly.

When a cooldown is active:

```text
eligible = false
reason = COOLDOWN_ACTIVE
```

When the cooldown expires, the monster becomes eligible if all other rules pass.

M3 reads cooldown state but does not create or update cooldown records.

### Task Boss eligibility

A Task Boss requires:

- the character level requirement to be satisfied,
- a matching monster task,
- the required Task Boss lifecycle state.

Task statuses:

- `ACTIVE`
- `UNLOCKED`
- `WAITING_FOR_REUNLOCK`

Eligibility behavior:

```text
ACTIVE
→ TASK_PROGRESS_INCOMPLETE

UNLOCKED
→ eligible

WAITING_FOR_REUNLOCK
→ TASK_REUNLOCK_REQUIRED
```

An ordinary monster cooldown does not affect Task Boss eligibility.

### Task Boss assignment

Each Task Boss has exactly one associated monster task.

A specific source monster unlocks a specific Task Boss.

Family-wide task aggregation is not implemented in M3.

Migration `085_unique_monster_task_boss.sql` enforces unique Task Boss assignment.

### Task-status schema

M3 replaced the earlier Boolean task-unlock representation with an explicit lifecycle status.

Migration:

```text
084_task_status_refactor.sql
```

The explicit status allows discovery to distinguish:

- unfinished task progress,
- unlocked Task Boss access,
- the need to pay or satisfy a re-unlock condition.

### Daily Boss eligibility

A Daily Boss requires:

- the character level requirement to be satisfied,
- membership in the currently active rotation,
- at least one remaining attempt for the character in that rotation.

An ordinary monster cooldown does not affect Daily Boss eligibility.

If the boss is outside the active rotation:

```text
eligible = false
reason = DAILY_BOSS_UNAVAILABLE
```

If the character has exhausted attempts:

```text
eligible = false
reason = DAILY_ATTEMPTS_EXHAUSTED
```

### Daily Boss rotation

Daily Boss eligibility is based on an explicit rotation window.

A rotation is active when:

```text
created_at <= observedAt
AND reset_timestamp > observedAt
```

The reset hour is configured in UTC through:

```text
DAILY_BOSS_RESET_HOUR_UTC
```

The active rotation contains one Daily Boss definition for each supported tier:

- Tier 1,
- Tier 2,
- Tier 3.

Multiple active rotations are treated as invalid configuration rather than silently selecting one.

### Daily Boss attempts

Attempts are character-specific and rotation-specific.

Migration:

```text
087_daily_boss_attempt_rotation.sql
```

M3 changed Daily Boss attempt tracking from date-based identity to rotation-based identity.

A character’s attempts in one rotation do not affect another rotation.

M3 reads attempt state but does not consume attempts.

### Bestiary visibility

Discovery includes character-specific Bestiary visibility.

Bestiary state is loaded for the selected character.

One character’s Bestiary visibility does not affect another character.

M3 reads Bestiary state but does not create or update Bestiary records.

### Energy-cost preview

Every discovery result exposes the authoritative Energy cost required to start combat with that monster.

Migration:

```text
083_add_monster_energy_cost.sql
```

The client may display the Energy cost before combat begins.

M3 does not:

- validate the character’s current Energy balance for combat start,
- deduct Energy,
- reserve Energy.

Energy validation and deduction belong to M5 combat start.

### Server authority

The server controls:

- character ownership,
- character level,
- monster level,
- monster type,
- stable monster code,
- Energy cost,
- cooldown timestamps,
- Task Boss state,
- Daily Boss rotation,
- Daily Boss attempts,
- Bestiary visibility,
- observed time.

The client cannot author or override eligibility results.

### Architecture

The monster discovery feature is separated into:

- Domain,
- Application,
- Infrastructure,
- HTTP.

#### Domain

Contains:

- monster types,
- eligibility rules,
- cooldown calculation,
- stable eligibility reasons,
- domain errors.

#### Application

Contains:

- monster-list service,
- monster-details service,
- public discovery models,
- discovery repository contract,
- Task Boss eligibility coordination,
- Daily Boss eligibility coordination.

#### Infrastructure

Contains:

- PostgreSQL discovery queries,
- row models,
- row validation,
- PostgreSQL-to-domain mapping,
- character-specific discovery data loading.

#### HTTP

Contains:

- authenticated route handling,
- path parsing,
- application-service invocation,
- JSON response serialization,
- stable error mapping.

HTTP handlers do not:

- execute SQL,
- calculate cooldowns,
- evaluate eligibility rules directly,
- mutate discovery data.

### Implemented module structure

```text
src/modules/monsters/
├── application/
│   ├── get-monster-details.service.ts
│   ├── get-monster-list.service.ts
│   ├── monster-discovery.models.ts
│   └── monster-discovery.repository.ts
├── domain/
│   ├── monster-cooldown.ts
│   ├── monster-eligibility.ts
│   ├── monster.errors.ts
│   └── monster.types.ts
├── http/
│   ├── monster-http.handler.ts
│   └── monster-http.request.ts
└── infrastructure/
    ├── postgres-monster-discovery.repository.ts
    └── postgres-monster.mapper.ts
```

### Database changes

M3 added migrations:

```text
083_add_monster_energy_cost.sql
084_task_status_refactor.sql
085_unique_monster_task_boss.sql
086_daily_boss_rotation_window.sql
087_daily_boss_attempt_rotation.sql
```

These migrations:

- added authoritative monster Energy costs,
- replaced the Boolean Task Boss unlock state with lifecycle status,
- enforced one task assignment per Task Boss,
- enforced Daily Boss rotation windows,
- changed Daily Boss attempt tracking to rotation-based identity.

### Migration runner

M3 introduced a tracked database migration runner.

The runner:

- applies unapplied migrations in order,
- records applied migrations in `schema_migrations`,
- reports migration status,
- allows verification that no migrations remain pending.

At M3 completion:

```text
87 migrations applied
0 migrations pending
```

### Test coverage

Automated coverage includes:

- character-level eligibility,
- higher-level monster ineligibility,
- Normal Monster eligibility,
- Mini Boss eligibility,
- deterministic cooldown calculation,
- active cooldown rejection,
- expired cooldown handling,
- stable-code loading,
- missing-monster handling,
- character ownership isolation,
- public monster-list models,
- public monster-details models,
- PostgreSQL row mapping,
- PostgreSQL row validation,
- character-specific Bestiary visibility,
- Energy-cost preview,
- Task Boss `ACTIVE` state,
- Task Boss `UNLOCKED` state,
- Task Boss `WAITING_FOR_REUNLOCK` state,
- Task Boss cooldown exclusion,
- unique Task Boss assignment,
- Daily Boss active-rotation discovery,
- Daily Boss unavailable outside the active rotation,
- Daily Boss remaining attempts,
- exhausted Daily Boss attempts,
- per-rotation attempt isolation,
- overlapping rotation rejection,
- authenticated list endpoint,
- authenticated details endpoint,
- unauthenticated request rejection.

### M3 test files

```text
tests/integration/http/
└── monster-discovery.http.test.ts

tests/integration/monsters/
├── daily-boss-discovery.repository.test.ts
└── postgres-monster-discovery.repository.test.ts

tests/unit/monsters/
├── daily-boss-discovery.service.test.ts
├── daily-boss-eligibility.test.ts
├── get-monster-details.service.test.ts
├── get-monster-list.service.test.ts
├── monster-cooldown.test.ts
├── monster-eligibility.test.ts
└── task-boss-discovery.service.test.ts
```

Additional HTTP unit coverage exists for monster request parsing and handlers.

### Completion commits

```text
3f84ece  Replace task_unlocked with task_status
30ea6d8  Add monster Energy costs and task-status lifecycle
637240d  Finalize M3 monster discovery preparation
03136a6  Finalize M3 monster discovery preparation
01760e5  Add M3 monster discovery domain contract
9c50aea  Refine M3 monster discovery repository contract
2df79a4  Add monster details service
d65ccfd  Add monster list service
3d63450  Add monster eligibility domain logic
39ee38e  Add monster cooldown domain model
10c8413  Prepare M3 infrastructure layer
b269f2c  Add monster PostgreSQL row models
214c274  Add monster Energy-cost mapping
8cc5551  Add monster discovery repository skeleton
ebd0457  Add monster PostgreSQL mapper
fbe3d4f  Add character-specific monster discovery queries
eca0c02  Test monster discovery repository integration
b1dad30  Add deterministic monster cooldown logic
f3513e1  Implement monster discovery eligibility services
4a4f7aa  Test monster discovery application services
667865e  Add Task Boss eligibility rules
20ea9f8  Enforce one task per Task Boss
f2bf096  Add tracked database migration runner
c2ad486  Define Task Boss unlock semantics
858f4a8  Test Task Boss discovery lifecycle
f2964f2  Implement Task Boss discovery eligibility
f5b06b7  Add configurable Daily Boss reset hour
500039f  Track Daily Boss attempts by rotation
e1f1c6c  Define eligibility rules by monster type
539b557  Add Daily Boss application eligibility
dbebb42  Connect Daily Boss rotation to monster discovery
5e1cada  Test Daily Boss rotation discovery
2629101  Add monster discovery HTTP handler
f8b6b63  Connect monster discovery routes
849b58f  Update database table count after migration tracking
35804ba  Test monster discovery HTTP endpoints
e66e8d0  Complete M3 documentation
```

### Definition of done

- [x] Authenticated monster-list endpoint implemented.
- [x] Authenticated monster-details endpoint implemented.
- [x] Character ownership enforced.
- [x] Monsters loaded by stable code.
- [x] Higher-level monsters reported as unavailable.
- [x] Energy costs exposed as read-only preview data.
- [x] Normal Monster eligibility implemented.
- [x] Mini Boss eligibility implemented.
- [x] Character-specific cooldown state implemented.
- [x] Cooldown calculation uses injected time.
- [x] Character-specific Bestiary visibility implemented.
- [x] Task Boss lifecycle eligibility implemented.
- [x] Task Boss assignment uniqueness enforced.
- [x] Daily Boss active-rotation eligibility implemented.
- [x] Daily Boss attempt eligibility implemented.
- [x] Daily Boss attempts tracked per rotation.
- [x] Overlapping active rotations rejected.
- [x] Public application models hide unnecessary internal data.
- [x] PostgreSQL rows validated before mapping.
- [x] Unit tests passed.
- [x] PostgreSQL integration tests passed.
- [x] HTTP integration tests passed.
- [x] TypeScript typecheck passed.
- [x] Production build passed.
- [x] Migration status verified.
- [x] M3 documentation completed.

### Verification

M3 was verified on `2026-10-07`.

Final M3 results:

- `87` migrations applied.
- `0` migrations pending.
- PostgreSQL connection passed.
- `79` database tables detected.
- TypeScript typecheck passed.
- `42` test files passed.
- `226` tests passed.
- Production build passed.
- Git working tree was clean.

### Out of scope

M3 does not:

- start combat,
- deduct Energy,
- create combat sessions,
- resolve combat actions,
- grant rewards,
- generate loot,
- write monster cooldowns,
- update Bestiary,
- update kill statistics,
- mutate Task Boss progress,
- consume Daily Boss attempts,
- generate Daily Boss rotations,
- mutate Daily Boss rotations.

Discovery is read-only.

Combat start and Energy deduction belong to M5.

Victory, defeat, cooldown recording, Bestiary progression, kill statistics, and Task Boss progression belong to M6 or later milestones.

### Completion log

M3 Monster Discovery and Eligibility completed and verified.

M4 uses the completed discovery and eligibility layer as the foundation for the pure deterministic combat engine.

---

## M4: PURE COMBAT ENGINE

### Status

Completed.

### Objective

Implement deterministic turn-based combat as a pure TypeScript domain module processing one player action at a time.

The engine returns a new immutable combat state together with an ordered list of domain events.

### Public domain interface

```ts
resolveCombatAction(
  state: CombatState,
  action: PlayerAction,
  rng: RandomSource
): CombatResolution
```

### Supported player action

```ts
{
  type: "basic_attack"
}
```

Spells, consumables, escape, and other player actions remain outside M4.

### Implemented scope

- Pure TypeScript combat domain.
- Immutable combat-state transitions.
- Injected `RandomSource`.
- Player and monster `basic_attack`.
- Shared attack resolution.
- Player-first round flow.
- Hit-chance and damage-range calculation.
- Misses and successful zero-damage hits.
- Immediate victory and defeat handling.
- Maximum duration of 100 complete rounds.
- Ordered combat events.
- Dedicated combat-domain errors.
- Combat-state and RNG-output validation.
- Explicit no-op extension point for future active effects.
- Deterministic and immutability tests.

### Combat flow

One turn represents one complete combat round:

```text
Resolve Player Basic Attack
→ Stop if Monster Health reaches 0
→ Resolve Monster Basic Attack
→ Stop if Player Health reaches 0
→ Apply Turn-Limit Rule
→ Advance Turn if Combat Continues
```

Rules:

1. The player always acts first.
2. The monster does not act after being killed by the player.
3. Combat ends immediately when either combatant reaches zero Health.
4. The turn advances only while combat remains in progress.
5. Terminal combat preserves the number of the round in which it ended.

### Basic attack formulas

```text
hitChancePercent =
  clamp((attackerAttack - defenderDefense) * 4, 5, 90)

minimumDamage =
  max(0, attackerAttack - defenderDefense)

maximumDamage =
  max(0, (attackerAttack - defenderDefense) * 2)
```

Player and monster basic attacks use the same formulas.

### Hit and damage resolution

A hit occurs when:

```text
rng.nextFloat() * 100 < hitChancePercent
```

Hit chance is clamped to the inclusive range from `5%` through `90%`.

When an attack hits, damage is selected from the inclusive range:

```text
minimumDamage <= damage <= maximumDamage
```

A successful hit may deal zero damage. A miss and a successful zero-damage hit remain distinct outcomes.

Health cannot fall below `0`.

### Randomness contract

```ts
interface RandomSource {
  nextFloat(): number;

  nextInt(
    minimum: number,
    maximum: number
  ): number;
}
```

Rules:

- `nextFloat()` must return `0 <= value < 1`.
- `nextInt(minimum, maximum)` uses inclusive bounds.
- Returned integers must remain within the requested range.
- Invalid RNG output causes a dedicated domain error.
- Tests inject controlled random sources.
- M4 does not call `Math.random()`.

### Combat-state validation

- Current Health, maximum Health, Attack, Defense, and turn must be safe integers.
- Maximum Health must be positive.
- Current Health, Attack, and Defense must be non-negative.
- Current Health cannot exceed maximum Health.
- Initial combat turn is `1`.
- Terminal combat cannot resolve another action.
- Invalid state is rejected rather than repaired.

### Immutability and determinism

The engine does not mutate the input state, submitted action, or active-effects collection.

Equivalent state, action, and RNG input produce equivalent results.

### Combat outcomes

Statuses:

```text
InProgress
PlayerVictory
PlayerDefeat
```

Defeat reasons:

```text
PlayerHealthDepleted
TurnLimitExceeded
```

Victory and in-progress combat have no defeat reason. Player defeat requires a valid reason.

### Turn limit

Turn `100` resolves normally:

1. The player attacks.
2. Player victory wins immediately if the monster reaches zero Health.
3. Otherwise, the monster attacks.
4. Health-depletion defeat wins precedence if the player reaches zero Health.
5. If both survive, combat ends in `PlayerDefeat` with `TurnLimitExceeded`.

The engine never begins turn `101`.

### Combat events

Supported ordered events:

```text
AttackResolved
CombatEnded
TurnAdvanced
```

A continuing round emits:

```text
Player AttackResolved
Monster AttackResolved
TurnAdvanced
```

A terminal round emits attack events followed by `CombatEnded`. `TurnAdvanced` is emitted only when combat remains in progress.

### Active-effects extension point

Combat state contains an active-effects collection, but M4 does not implement buffs, debuffs, damage over time, healing over time, effect duration, stacking, or refreshing. The collection remains empty in M4.

### Architectural boundary

M4 does not:

- expose HTTP endpoints,
- access PostgreSQL,
- use repositories,
- authenticate accounts,
- persist sessions, events, or logs,
- deduct Energy,
- calculate effective statistics,
- validate monster discovery eligibility,
- grant rewards or progression,
- write cooldowns, Bestiary, kill, or Task Boss progress,
- read system time,
- call `Math.random()`,
- call `Date.now()`.

`Clock` is not part of the M4 engine interface. M4 receives final combat-ready statistics and requires only state, action, and `RandomSource`.

### Implemented files

```text
src/modules/combat/
├── domain/
│   ├── combat-attack.ts
│   ├── combat-effects.ts
│   ├── combat-engine.ts
│   ├── combat-validation.ts
│   ├── combat.constants.ts
│   ├── combat.errors.ts
│   └── combat.types.ts
└── ports/
    └── random-source.ts
```

M4 contains no application, HTTP, infrastructure, or repository layer.

### Tests

```text
tests/unit/combat/
├── combat-attack.test.ts
├── combat-determinism.test.ts
├── combat-engine.test.ts
└── combat-validation.test.ts
```

Coverage includes hits, misses, hit-chance bounds, minimum and maximum damage, zero damage, shared formulas, player-first ordering, victory, defeat, turn advancement, terminal-state rejection, turn `100`, deterministic output, immutability, state validation, RNG validation, ordered events, and the empty-effects extension point.

### Verification

Verified on `2026-10-07`:

- TypeScript typecheck passed.
- `4` M4 test files passed.
- `41` M4 tests passed.
- `46` total test files passed.
- `267` total tests passed.
- Production build passed.
- No regressions were detected in M1 through M3.
- No `Math.random()` or `Date.now()` usage was found in the M4 combat module.
- The M4 branch was synchronized with `origin/m4/pure-combat-engine`.

### Completion commits

```text
554df74  Approve M4 combat semantics
1d90a4c  Add M4 combat domain contracts
48008ab  Remove duplicate combat random source contract
9e435e4  Add M4 combat validation
b493752  Add M4 basic attack resolution
871e446  Add M4 combat round resolution
85f8da6  Complete M4 documentation
3dfe03a  Complete M4 pure combat engine
```

### Definition of done

- [x] Pure TypeScript combat module implemented.
- [x] Public `resolveCombatAction` interface implemented.
- [x] Player and monster basic attacks implemented through shared logic.
- [x] Player-first flow implemented.
- [x] Hit and damage formulas implemented.
- [x] Misses and successful zero-damage hits implemented.
- [x] Immediate victory and defeat implemented.
- [x] Complete turn-100 handling implemented.
- [x] Ordered events implemented.
- [x] State and RNG validation implemented.
- [x] Immutable deterministic transitions verified.
- [x] Domain remains independent from HTTP, PostgreSQL, repositories, and time.
- [x] M4 tests, regression suite, typecheck, and build passed.
- [x] M4 documentation completed.

### Out of scope

Persistent combat sessions, combat HTTP endpoints, authentication, ownership, expected-turn concurrency, Energy deduction, persistent events and logs, rewards, progression, cooldown writes, Bestiary updates, Task Boss progression, spells, consumables, monster abilities, active effects, multiple targets, escape, and abandonment remain outside M4.

### Completion log

M4 Pure Combat Engine completed and verified.

M5 connects the pure engine to authenticated HTTP endpoints and persistent PostgreSQL sessions.

---

## M5: PERSISTENT COMBAT API

### Status

Completed.

### Objective

Connect the pure M4 combat engine to authenticated HTTP endpoints and persistent PostgreSQL combat sessions.

### Implemented endpoints

```http
POST /characters/:characterId/combat
GET /characters/:characterId/combat
GET /characters/:characterId/combat/:combatSessionId
POST /characters/:characterId/combat/actions
GET /characters/:characterId/combat/:combatSessionId/log
```

All endpoints require authentication and character ownership.

Specific-session and event-log retrieval also validate that the combat session belongs to the selected character.

Foreign characters and sessions are not disclosed.

### Start-combat request

```json
{
  "monsterCode": "stable_monster_code"
}
```

### Fight-start transaction

1. Read one authoritative timestamp from `Clock`.
2. Begin a PostgreSQL transaction.
3. Lock the owned active character using `FOR UPDATE`.
4. Reject an existing active combat session.
5. Apply authoritative resource regeneration.
6. Load the monster by stable code.
7. Revalidate monster eligibility.
8. Require positive Character Health.
9. Validate available Energy.
10. Calculate authoritative effective character statistics.
11. Deduct Energy exactly once.
12. Persist updated character resources.
13. Snapshot character combat-ready statistics.
14. Snapshot monster combat-ready statistics.
15. Create the active combat session.
16. Commit the transaction.
17. Return the current session view.

Any failure rolls back:

- resource regeneration writes,
- Energy deduction,
- combat-session creation.

Concurrent combat-start requests cannot:

- create multiple active sessions,
- deduct Energy more than once.

### Action request

```json
{
  "expectedTurn": 4,
  "action": {
    "type": "basic_attack"
  }
}
```

Action-request rules:

- `expectedTurn` must be a positive safe integer.
- `action` must be a JSON object.
- `action` may contain only `type`.
- M5 supports only `basic_attack`.
- The client does not provide a combat-session ID.
- The action endpoint resolves the character’s current active session.
- The client cannot provide statistics, damage, hit results, random values, timestamps, events, or final outcomes.

### Combat-action transaction

1. Read one authoritative timestamp from `Clock`.
2. Begin a PostgreSQL transaction.
3. Lock the owned active combat session using `FOR UPDATE`.
4. Validate account and character ownership.
5. Compare `expectedTurn` with the locked session turn.
6. Reconstruct the pure M4 combat state from persistent snapshots.
7. Resolve the action through the M4 combat engine.
8. Use server-controlled cryptographic randomness.
9. Update the persistent combat-session state.
10. Persist generated events in domain order.
11. Synchronize terminal Character Health when required.
12. Commit the transaction.
13. Return the current session view and current-operation events.

A stale action does not:

- resolve combat,
- modify Health,
- advance the turn,
- change session status,
- create combat events.

Concurrent requests cannot resolve the same turn twice.

### Persistent combat state

Migration:

```text
088_persistent_combat_api.sql
```

Persistent combat sessions store:

- current status,
- current turn,
- current Character Health,
- current Character Mana,
- current Monster Health,
- defeat reason,
- start and end timestamps,
- character maximum Health snapshot,
- character Attack snapshot,
- character Defense snapshot,
- monster maximum Health snapshot,
- monster Attack snapshot,
- monster Defense snapshot.

Supported persistent statuses:

- `Active`
- `Victory`
- `Defeat`
- `Abandoned`

Supported defeat reasons:

- `PlayerHealthDepleted`
- `TurnLimitExceeded`

M5 does not create new abandoned sessions, but historical abandoned sessions remain retrievable.

The database enforces:

- valid turn values from `1` through `100`,
- valid status and defeat-reason combinations,
- valid terminal timestamps,
- non-negative Health and statistics,
- one active combat session per character.

Persistent sessions survive application restarts.

Active combat does not recalculate equipment, progression, or effective statistics after the session starts.

### Combat-session events

Incremental combat events are stored in:

```text
combat_session_events
```

Each event stores:

- combat-session ID,
- resolved turn number,
- event order within the turn,
- event type,
- complete event payload as JSONB,
- creation timestamp.

Supported M4 event types include:

- `AttackResolved`
- `CombatEnded`
- `TurnAdvanced`

The session update and all generated events are persisted atomically.

A rejected or stale action creates no events.

Events are retrieved in deterministic order:

```sql
ORDER BY
  turn_number ASC,
  event_order ASC
```

The combination below is unique:

```text
combat_session_id
turn_number
event_order
```

### Active-combat retrieval

```http
GET /characters/:characterId/combat
```

Returns only the character’s active combat session.

If no active session exists, the API returns:

```text
COMBAT_SESSION_NOT_FOUND
```

### Specific-session retrieval

```http
GET /characters/:characterId/combat/:combatSessionId
```

Returns an owned active or completed session.

The endpoint validates:

- authenticated account ownership,
- character ownership,
- session-to-character ownership.

Foreign and unavailable sessions return the same not-found response.

### Event-log retrieval

```http
GET /characters/:characterId/combat/:combatSessionId/log
```

Returns the complete ordered event stream from `combat_session_events`.

The M5 endpoint does not read from the older `combat_logs` table.

`combat_logs` remains reserved for final whole-combat summaries and recent-history retention in M6 or a later milestone.

### Server authority

Production combat uses `CryptoRandomSource`.

Application time is supplied through `Clock`.

The server controls:

- combat statistics,
- resource regeneration,
- Energy cost,
- timestamps,
- random values,
- hit results,
- damage,
- event data,
- combat outcomes.

The pure M4 combat engine remains independent from:

- HTTP,
- PostgreSQL,
- system time,
- cryptographic APIs,
- repositories.

### Definition of done

- Persistent combat migration is applied.
- No combat migration remains pending.
- Combat-ready statistics are snapshotted.
- Combat sessions survive application restarts.
- Only one active combat may exist per character.
- Duplicate starts cannot deduct Energy twice.
- Failed starts roll back all changes.
- Duplicate actions cannot execute one turn twice.
- Stale `expectedTurn` values are rejected.
- Session state persists after every accepted action.
- Ordered events persist atomically with session updates.
- Terminal status and defeat reason persist correctly.
- Terminal Character Health synchronizes atomically.
- Active combat Health remains isolated in the session.
- Active combat can be retrieved.
- Owned active or completed sessions can be retrieved.
- Ordered session-event logs can be retrieved.
- Authentication is required.
- Character ownership is enforced.
- Session-to-character ownership is enforced.
- Foreign sessions are not disclosed.
- Production randomness is controlled by the server.
- Client input cannot author combat outcomes.
- Unit tests pass.
- PostgreSQL integration tests pass.
- HTTP integration tests pass.
- Rollback tests pass.
- Concurrent-start tests pass.
- Concurrent-action tests pass.
- Full regression suite passes.
- TypeScript typecheck passes.
- Production build passes.

### Verification result

M5 was completed with:

- 88 applied database migrations,
- 0 pending migrations,
- 80 database tables,
- 60 passing test files,
- 361 passing tests,
- passing TypeScript typecheck,
- passing production build,
- passing PostgreSQL connection test,
- passing transactional rollback tests,
- passing concurrency tests,
- passing authenticated five-endpoint HTTP flow.

### Implemented files

```text
src/modules/combat/
├── application/
│   ├── combat-session.errors.ts
│   ├── combat-session.models.ts
│   ├── combat-session.repository.ts
│   ├── get-active-combat.service.ts
│   ├── get-combat-log.service.ts
│   ├── get-combat-session.service.ts
│   ├── resolve-combat-action.service.ts
│   └── start-combat.service.ts
├── http/
│   ├── combat-http.handler.ts
│   └── combat-http.request.ts
└── infrastructure/
    ├── crypto-random-source.ts
    ├── postgres-combat-session.repository.ts
    └── postgres-combat.mapper.ts
```

### M5 tests

M5 added dedicated unit, PostgreSQL integration, concurrency, rollback, retrieval, schema, and authenticated HTTP flow coverage.

Confirmed M5 test files include:

```text
tests/integration/combat/
├── combat-retrieval.integration.test.ts
├── persistent-combat-schema.test.ts
├── resolve-combat-action.integration.test.ts
└── start-combat.integration.test.ts

tests/integration/http/
└── combat.http.test.ts
```

Unit coverage includes combat-session errors, retrieval services, request validation, HTTP handlers, cryptographic randomness, PostgreSQL mapping and repository behavior, combat start, and action resolution.

### Completion commits

```text
886a4b1  Prepare M5 implementation context
ceed2e4  Add M5 persistent combat schema
e4c3466  Add persistent combat contracts and adapters
263b3ca  Add transactional combat start infrastructure
2db8ec3  Implement transactional combat start
de9ae2f  Implement transactional combat actions
adb6ca5  Add persistent combat retrieval
5b0f2dc  Add authenticated combat HTTP handler
f2236f0  Connect persistent combat routes
de9b527  Test persistent combat HTTP flow
2fec50c  Stabilize combat integration fixtures
331a28a  Complete M5 documentation
```

### Out of scope

The following remain outside M5:

- victory rewards,
- Experience awards,
- Gold awards,
- loot generation,
- death penalties,
- promotion death modifiers,
- Blessing death modifiers and consumption,
- final summaries in `combat_logs`,
- recent final-log retention,
- monster cooldown writes,
- Bestiary progression,
- monster kill statistics,
- Task Boss progression,
- player spells,
- combat consumables,
- monster abilities,
- active buffs and debuffs,
- damage and healing over time,
- escape,
- combat abandonment.

---

### Completion log

M5 Persistent Combat API completed and verified.

The next milestone is M6: Victory, Death, and Progression.

---

## M6: VICTORY, DEATH, AND PROGRESSION

### Deliverables

- Victory resolution
- Experience awards
- Gold awards
- Character-level calculation
- Level-up resource increases
- Death Experience loss
- Promotion modifier
- Blessing modifier
- Combat statistics
- Monster kill statistics
- Recent combat logs
- Monster cooldown recording
- Bestiary updates
- Task progress updates

### Victory transaction

1. Complete combat.
2. Grant Experience.
3. Recalculate level.
4. Apply level rewards.
5. Grant Gold.
6. Generate loot.
7. Update lifetime statistics.
8. Update monster kill count.
9. Update Bestiary.
10. Update task-boss progress.
11. Record monster cooldown.
12. Save combat log.
13. Commit everything.

### Death penalties

- Normal: 10%
- Promoted: 8%
- Blessed: 6%
- Promoted and Blessed: 4%

### Definition of done

- Victory rewards are granted exactly once.
- Multiple levels can be gained.
- Death can reduce one or more levels.
- Promotion and Blessing modify death loss correctly.
- Blessing is consumed exactly once.
- Failed reward generation rolls back the complete victory.
- Only the newest ten combat logs are retained.
- Victory and death tests pass.

---

## M7: ITEM AND LOOT GENERATION

### Canonical item generator

generateItem({
  itemBase,
  itemLevel,
  forcedRarity,
  source,
  rng
}): GeneratedItem

### Item generation pipeline

Select Item Base
→ Determine Item Level
→ Determine Rarity
→ Determine Affix Count
→ Select Eligible Affixes
→ Roll Affix Values
→ Calculate Item Score
→ Persist Item and Affixes

### Rarity and affix counts

- Common: 0
- Magic: 1
- Rare: 2
- Epic: 3
- Legendary: 4

### Independent combat reward rolls

1. Gold
2. Regular equipment
3. Other loot
4. Unique or set item

### Rules

- Duplicate affixes are allowed.
- Affixes must satisfy item-level requirements.
- Rolls must remain inside configured ranges.
- Combat, bosses, gambling, chests, milestones, and administration reuse the same generator.

### Definition of done

- Items use database definitions.
- Rarity produces the correct affix count.
- Only eligible affixes are selected.
- Duplicate affixes work.
- Rolls remain within configured ranges.
- Inventory-full behavior works.
- Gold is granted even when equipment inventory is full.
- Materials and consumables use separate storage.
- Generation is deterministic under a seed.

---

## M8: INVENTORY AND EQUIPMENT

### Suggested endpoints

- GET /characters/:characterId/inventory
- GET /characters/:characterId/equipment
- POST /characters/:characterId/equipment/equip
- POST /characters/:characterId/equipment/unequip

### Rules

- Character must own the item.
- Character must meet its required level.
- Item slot must match the destination.
- Market-locked items cannot be equipped.
- Equipped items cannot be listed or salvaged.
- Two-handed weapons prevent shield use.
- Equipment changes trigger stat recalculation.

### Definition of done

- Dropped items appear in inventory.
- Owned items can be equipped.
- Foreign items cannot be equipped.
- Invalid slots are rejected.
- Two-handed restrictions work.
- Statistics update immediately.
- Inventory capacity is enforced.
- Ownership and concurrency tests pass.

### First playable release

Fight
→ Gain Rewards
→ Receive Equipment
→ Equip Equipment
→ Become Stronger
→ Fight Stronger Monster

---

# GOAL 2: COMBAT DEPTH

## M9: PLAYER SPELLS

### Deliverables

- Spell purchase
- Level and Gold requirements
- Permanent ownership
- One to three spell slots
- Loadout management
- Mana costs
- Cooldowns
- Direct damage
- Healing
- Damage over time
- Healing over time
- Buffs and debuffs
- Mana drain
- Health drain
- Potion disable

### Definition of done

- Duplicate spell slots are rejected.
- Insufficient Mana rejects casting.
- Cooldowns work.
- Spell Power scaling works.
- Effects expire correctly.
- Repeated effects refresh rather than stack.
- Tests cover every supported category.

---

## M10: MONSTER ABILITIES

### Flow

Roll Ability Chance
→ On Failure: Basic Attack
→ On Success: Weighted Ability Selection
→ Resolve Through Shared Spell Engine

### Definition of done

- Monsters reuse the player spell resolver.
- Weighted selection is deterministic.
- Disabled abilities are ignored.
- Monster Spell Power applies correctly.
- Basic-attack fallback works.
- Monsters cannot use consumables.

---

## M11: COMBAT CONSUMABLES

### Deliverables

- Health Potion slot
- Mana Potion slot
- Pre-combat potion loadout
- Carried quantities
- Fixed and percentage restoration
- Potion cooldowns
- Potion-disable effects
- Turn consumption
- Storage deduction

### Definition of done

- Potion use consumes one turn.
- Storage is deducted exactly once.
- Duplicate requests cannot apply a potion twice.
- Potion-disable variants work.
- Restoration is clamped.
- Energy Potions cannot be used in combat.

---

# GOAL 3: COMPLETE ACTIVE PROGRESSION

## M12: ITEM IMPROVEMENT AND DISPOSAL

### Deliverables

- Rarity upgrading
- Upgrade costs
- Upgrade success chances
- Item destruction
- Protection Stones
- Single-affix rerolling
- Salvaging
- NPC selling
- Item Score
- Vendor valuation

### Upgrade rules

- Common → Magic
- Magic → Rare
- Rare → Epic
- Epic → Legendary
- Legendary is final.
- Success adds one affix.
- Unprotected failure destroys the item.
- Protected failure preserves the item.
- Costs and Protection Stone are consumed regardless of outcome.

### Definition of done

- Costs are server-validated.
- Success adds one valid affix.
- Failure consumes costs.
- Equipped and locked items are protected from accidental operations.
- Every operation is transactional.

---

## M13: CHARACTER ECONOMY AND PERMANENT UPGRADES

### Deliverables

- Spell-slot purchasing
- Promotion
- Inventory expansion
- Crafting-slot purchasing
- NPC healing
- Blessing purchase and activation
- Material vendor
- Consumable vendor
- Equipment vendor
- Gambling

### Definition of done

- Gold cannot become negative.
- Permanent upgrades cannot be purchased twice.
- Gambling uses the canonical item generator.
- NPC cooldowns survive restarts.
- Gold creation and destruction are tracked.

---

# GOAL 4: OFFLINE PROGRESSION

## M14: GATHERING

### Flow

Start Gathering
→ Block Active Gameplay
→ Accumulate Completed Minutes
→ Stop at Login or 24 Hours
→ Generate Pending Results
→ Collect Results

### Rules

- Gathering is offline-only.
- One gathering slot exists.
- Maximum duration is 24 hours.
- Partial minutes are ignored.
- Material eligibility depends on Gathering Level.
- Results remain pending until collection.
- Logging in stops gathering.

### Definition of done

- Active gameplay is blocked during gathering.
- Elapsed time cannot be claimed twice.
- Eligibility is enforced.
- Collection is transactional.
- Time is injectable in tests.

---

## M15: CRAFTING

### Deliverables

- Recipe list and details
- Eligibility
- Resource validation
- Quantity selection
- One to three crafting slots
- Maximum 24-hour queue time
- Timestamp-based completion
- Cancellation
- Full refund
- Manual collection
- Crafting Experience and levels
- Crafting history

### Definition of done

- Crafting always succeeds.
- Resources are consumed exactly once.
- Queue capacity is enforced.
- Speed bonuses apply.
- Completion survives restarts.
- Cancellation cannot duplicate refunds.
- Collection cannot duplicate output.

---

# GOAL 5: RETENTION AND ENCOUNTERS

## M16: CHESTS AND LOGIN STREAKS

### Order

1. Hourly Chest
2. Daily Chest
3. Seven-day login streak
4. Additional Daily Chest rewards

### Definition of done

- Claims are transactional.
- Rewards cannot be claimed twice.
- Hourly and Daily timing remain separate.
- Equipment uses the canonical generator.
- Streak reset and rollover work.

---

## M17: BOSS SYSTEMS

### Deliverables

- Mini-boss cooldowns
- Task-boss progress
- Task-boss unlocks
- Task-boss attempts
- Gold re-unlock
- Daily-boss pools
- Daily rotation
- Daily attempts
- Global reset
- Boss reward modifiers

### Definition of done

- Bosses reuse standard combat.
- Failure and victory consume attempts.
- Daily rotation is global.
- Attempts are character-specific.
- Reset is idempotent.
- Duplicate requests cannot recover attempts.

---

## M18: BESTIARY AND ACHIEVEMENTS

### Deliverables

- First-kill Bestiary unlock
- Kill count
- First and last kill dates
- Completion percentage
- Task progress
- Automatic achievements
- Automatic rewards
- Hidden achievements
- Achievement Score
- Account-wide achievement ownership

### Definition of done

- Bestiary is character-specific.
- Achievements are account-wide.
- Progress and rewards are idempotent.
- Archiving does not remove account progress.
- Achievement bonuses feed the statistics calculator.

---

## M19: UNIQUES, SETS, AND HOLY GRAIL

### Deliverables

- Independent unique/set roll
- Pity counter
- Pity increase, maximum, and reset
- Unique and set selection
- Random fixed-stat rolls
- Equipped set bonuses
- Account-wide Holy Grail
- Set-completion progress
- Collection achievements

### Definition of done

- Normal and unique/set loot remain independent.
- Pity is persisted.
- Discovery is permanent.
- Discovery cannot be duplicated.
- Set bonuses activate and deactivate correctly.
- Seasonal changes do not reset Holy Grail.

---

# GOAL 6: PLAYER ECONOMY AND LONG-TERM STRUCTURE

## M20: MARKETPLACE AND MAIL

### Deliverables

- Equipment listings
- Material and consumable stack listings
- Listing fees and durations
- Expiration
- Purchases
- Partial purchases
- Search
- Realm separation
- Anonymous transactions
- Mail delivery
- Attachments
- Recent price history

### Definition of done

- Listed assets are escrowed.
- Equipped items cannot be listed.
- Sellers cannot buy their own listings.
- Concurrent buyers cannot buy the same asset.
- Purchases are transactional.
- Attachments cannot be collected twice.
- Seasonal and non-ladder economies cannot interact.

---

## M21: SEASONS AND LEADERBOARDS

### Deliverables

- Active season
- Seasonal characters
- Experience leaderboard
- Hardcore leaderboard
- Final rankings
- Hall of Fame
- Season closure
- Non-ladder transfer
- Character archival
- Economy separation

### Definition of done

- Seasonal and non-ladder economies are isolated.
- Ranking is deterministic.
- Season closure is idempotent.
- Progress transfers without loss.
- Account-wide progress remains unchanged.
- Hall of Fame becomes immutable.

---

## M22: SOCIAL AND COSMETIC SYSTEMS

### Deliverables

- Friend requests
- Friendship management
- Friend limit
- Online status
- Last seen
- Private messages
- Message limits
- Outfits
- Addons
- Account-wide unlocks
- Cosmetic components

### Definition of done

- Friendships are account-based.
- Duplicate relationships are prevented.
- Limits are enforced.
- Cosmetics survive seasonal changes.
- Cosmetics provide no gameplay statistics.

---

# GOAL 7: LAUNCH READINESS

## M23: ADMINISTRATION AND OBSERVABILITY

### Deliverables

- Structured logging
- Error correlation
- Health checks
- Audit records
- Admin actions
- Announcements
- Bans and mutes
- Economy telemetry
- Combat telemetry
- Loot telemetry
- Crafting telemetry
- Marketplace telemetry
- Backup and restore verification

### Required telemetry

- Gold created and destroyed
- Items generated and destroyed
- Rarity and affix distribution
- Combat wins and defeats
- Deaths
- Combat duration
- Energy spent
- Materials generated and consumed
- Consumables generated and consumed
- Crafting activity
- Marketplace activity
- Upgrade outcomes

---

## M24: SECURITY AND EXPLOIT RESISTANCE

### Deliverables

- Ownership review
- Authorization review
- Transaction review
- Idempotency review
- Input validation
- Rate limits
- Session security
- Concurrency tests
- Economy-abuse tests
- Clock-manipulation tests
- Cross-character isolation tests
- Cross-realm isolation tests

### Required guarantees

- Client cannot author rewards.
- Client cannot submit random outcomes.
- Client cannot provide trusted timestamps.
- Client cannot provide final calculated statistics.
- Duplicate requests cannot duplicate value.
- Concurrent operations preserve balances and ownership.
- Character assets remain isolated.
- Realm assets remain isolated.
- Negative balances are impossible.

---

## M25: REAL CONTENT AND BALANCING

### Content workstreams

- Monsters and families
- Item bases
- Affix tiers
- Spells
- Materials
- Recipes
- Consumables
- Boss pools
- Unique items
- Set items and bonuses
- Achievements
- Chest rewards
- NPCs
- Outfits and Addons
- Artwork
- Descriptions and lore

### Balancing order

1. Combat survivability
2. Monster progression
3. Experience progression
4. Item-base progression
5. Loot frequency
6. Rarity distribution
7. Affix requirements and ranges
8. Material income
9. Crafting costs
10. Gold generation
11. Gold sinks
12. Upgrade costs and odds
13. Boss difficulty
14. Boss rewards
15. Chest rewards
16. Gathering progression
17. Crafting progression
18. Marketplace fees
19. Seasonal progression speed

### Definition of done

- No material exists without a use.
- Every recipe has obtainable inputs.
- Every level band has viable monsters and equipment.
- Every spell and consumable has a clear purpose.
- Core materials are not boss-exclusive.
- Gold sources and sinks are measurable.
- Placeholder content is removed or disabled.
- Progression simulations and complete playtests pass.

---

## M26: RELEASE CANDIDATE

### Exit criteria

- Accounts work.
- Characters work.
- Ownership isolation works.
- Combat works.
- Victory and death work.
- Experience and levels work.
- Loot and equipment work.
- Spells and abilities work.
- Consumables work.
- Item improvement works.
- Vendors and gambling work.
- Gathering and crafting work.
- Chests and bosses work.
- Bestiary and achievements work.
- Holy Grail works.
- Marketplace and mail work.
- Seasons and leaderboards work.
- Social and cosmetic systems work.
- Administration works.
- Production migrations work on a clean database.
- Production content import works.
- Backups can be restored.
- Critical automated tests pass.
- No known duplication exploit remains.
- No known cross-character asset leak remains.
- No known cross-realm asset leak remains.

---

# IMPLEMENTATION ORDER

1. M1 Character Foundation
2. M2 Effective Character Statistics
3. M3 Monster Discovery and Eligibility
4. M4 Pure Combat Engine
5. M5 Persistent Combat API
6. M6 Victory, Death, and Progression
7. M7 Item and Loot Generation
8. M8 Inventory and Equipment
9. M9 Player Spells
10. M10 Monster Abilities
11. M11 Combat Consumables
12. M12 Item Improvement and Disposal
13. M13 Character Economy and Permanent Upgrades
14. M14 Gathering
15. M15 Crafting
16. M16 Chests and Login Streaks
17. M17 Boss Systems
18. M18 Bestiary and Achievements
19. M19 Uniques, Sets, and Holy Grail
20. M20 Marketplace and Mail
21. M21 Seasons and Leaderboards
22. M22 Social and Cosmetic Systems
23. M23 Administration and Observability
24. M24 Security and Exploit Resistance
25. M25 Real Content and Balancing
26. M26 Release Candidate

---

## CURRENT PROJECT STATUS

### Completed milestones

- M1: Character Foundation
- M2: Effective Character Statistics
- M3: Monster Discovery and Eligibility
- M4: Pure Combat Engine
- M5: Persistent Combat API

### Completed platform foundations

- Database architecture established.
- Production migrations implemented through migration `088`.
- Authored-content tables available.
- Stable content codes added.
- Development workbook created.
- Synthetic development content populated.
- Workbook validation implemented.
- Transactional game-data importer implemented.
- Transactional dry run verified.
- Complete content import committed.
- Repeat import verified.
- Foreign-key relationships verified.
- Character ownership isolation implemented.
- Effective Character Statistics calculator implemented.
- Monster discovery and eligibility implemented.
- Pure deterministic combat engine implemented.
- Persistent combat sessions implemented.
- Authenticated combat HTTP API implemented.
- Combat concurrency and rollback protection verified.

### Current development content

- 29 authored-content worksheets.
- 248 authored-content records.
- 10 materials.
- 10 monsters.
- 10 item bases.
- 10 spells.
- 10 recipes.
- 10 monster abilities.
- 10 loot-table records.
- Supporting definitions for bosses, chests, NPCs, achievements, outfits, sets, uniques, and seasons.

Development definitions remain synthetic fixtures rather than final production content.

### Current technical state

```text
Database schema: Ready through M5
Database migrations: 88 applied, 0 pending
Database tables: 80
Character foundation: Implemented
Effective statistics: Implemented
Monster discovery: Implemented
Pure combat engine: Implemented
Persistent combat API: Implemented
Authenticated combat routes: Implemented
Combat integration flow: Verified
Test files: 60 passing
Tests: 361 passing
TypeScript typecheck: Passing
Production build: Passing
Current milestone: M6 Victory, Death, and Progression
```

### Current playable backend flow

```text
Create Character
→ Discover Eligible Monsters
→ Start Authenticated Combat
→ Deduct Energy Exactly Once
→ Persist Combat Session
→ Submit Expected-Turn Actions
→ Persist State and Ordered Events
→ Retrieve Active or Completed Session
→ Retrieve Ordered Combat Event Log
```

The backend does not yet settle victory rewards, death penalties, Experience, Gold, loot, cooldowns, Bestiary progress, kill statistics, or Task Boss progress.

## IMMEDIATE NEXT TASK

Prepare and approve the M6 implementation context for:

```text
M6: Victory, Death, and Progression
```

The M6 discovery and planning package must inspect and resolve:

- victory settlement,
- defeat settlement,
- Experience awards,
- Gold awards,
- level recalculation,
- multiple level gains,
- level-up resource changes,
- death Experience loss,
- multiple level losses,
- promotion death modifiers,
- Blessing state and consumption,
- exactly-once reward settlement,
- combat statistics,
- monster kill statistics,
- Bestiary updates,
- Task Boss progression,
- monster cooldown recording,
- final `combat_logs` summaries,
- recent-log retention,
- rollback behavior,
- concurrency behavior,
- interaction with future M7 item and loot generation.

M6 must preserve the existing M5 guarantees:

- one active combat per character,
- expected-turn concurrency control,
- atomic combat state and event persistence,
- ownership isolation,
- server-controlled randomness and time,
- no client-authored rewards or outcomes,
- persistent sessions recoverable after application restarts.

Do not begin M6 implementation until its source audit, approved decisions, schema implications, implementation plan, and master prompt are complete.