# M3 Technical Dump

Generated: 2026-10-06 22:44:41
Repository root: C:\Projects\ostatnia-szansa-game

## Purpose

Repository audit for M3: Monster Discovery and Eligibility.


============================================================
SOURCE: package.json
============================================================

{
    "name":  "ostatnia-szansa-game",
    "version":  "1.0.0",
    "description":  "",
    "main":  "index.js",
    "scripts":  {
                    "test":  "vitest run",
                    "typecheck":  "tsc --noEmit",
                    "build":  "tsc -p tsconfig.build.json",
                    "db:test":  "tsx scripts/test-database.ts",
                    "db:seed":  "tsx scripts/seed-database.ts",
                    "db:materials:check":  "tsx scripts/import-materials.ts --dry-run",
                    "db:materials:import":  "tsx scripts/import-materials.ts",
                    "game-data:validate":  "tsx scripts/import-game-data.ts --validate-only",
                    "game-data:check":  "tsx scripts/import-game-data.ts --dry-run",
                    "game-data:import":  "tsx scripts/import-game-data.ts",
                    "test:watch":  "vitest",
                    "test:unit":  "vitest run tests/unit",
                    "test:integration":  "vitest run tests/integration",
                    "dev":  "tsx src/server.ts",
                    "start":  "node dist/server.js"
                },
    "repository":  {
                       "type":  "git",
                       "url":  "git+https://github.com/ripp1337/tibia-browser-design.git"
                   },
    "keywords":  [

                 ],
    "author":  "",
    "license":  "ISC",
    "type":  "module",
    "bugs":  {
                 "url":  "https://github.com/ripp1337/tibia-browser-design/issues"
             },
    "homepage":  "https://github.com/ripp1337/tibia-browser-design#readme",
    "dependencies":  {
                         "csv-parse":  "^7.0.3",
                         "dotenv":  "^18.0.5",
                         "exceljs":  "^4.4.0",
                         "jszip":  "^3.10.2",
                         "pg":  "^8.23.1"
                     },
    "devDependencies":  {
                            "@types/node":  "^26.6.4",
                            "@types/pg":  "^8.23.1",
                            "tsx":  "^4.23.15",
                            "typescript":  "^7.0.2",
                            "vitest":  "^5.0.3"
                        }
}


============================================================
SOURCE: tsconfig.json
============================================================

{
    "compilerOptions":  {
                            "target":  "ES2022",
                            "module":  "NodeNext",
                            "moduleResolution":  "NodeNext",
                            "rootDir":  ".",
                            "outDir":  "dist",
                            "strict":  true,
                            "esModuleInterop":  true,
                            "forceConsistentCasingInFileNames":  true,
                            "skipLibCheck":  true,
                            "resolveJsonModule":  true
                        },
    "include":  [
                    "src/**/*.ts",
                    "scripts/**/*.ts",
                    "tests/**/*.ts"
                ]
}


============================================================
SOURCE: tsconfig.build.json
============================================================

{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": [
    "src/**/*.ts"
  ],
  "exclude": [
    "tests",
    "scripts",
    "dist",
    "node_modules"
  ]
}


============================================================
SOURCE: documentation/game-design/CURRENT_MILESTONE.md
============================================================

# Current Milestone

## Milestone

M2: Effective Character Statistics

## Status

Completed.

## Objective

Provide one authoritative and deterministic calculator for effective character statistics, used by the character snapshot and future combat, reward, and equipment operations.

## Effective statistics

- Attack
- Defense
- Spell Power
- Maximum Health
- Maximum Mana
- Maximum Energy
- Gold Bonus
- Experience Bonus

## Implemented sources

- Base character statistics
- Character level progression
- Spell Mastery
- Equipped item base statistics
- Equipped item affixes
- Highest reached set-bonus threshold
- Completed account achievement bonuses
- Active Gold and Experience progression boosts
- Optional combat modifiers supplied by combat context

## Important rules

- `inventory_items.is_equipped` is the authoritative equipment state.
- Unequipped items do not affect statistics.
- Only the highest reached threshold of a set bonus is active.
- Completed achievements affect every character belonging to the account.
- Gold and Experience bonuses are additive percentage points.
- Combat buffs and debuffs are not included in the normal character snapshot.
- Final integer statistics are rounded down.
- Repeated calculations with identical input return identical results.
- The calculator does not mutate its input.
- Current Health, Mana, and Energy are clamped when their effective maximum decreases.

## Architecture

The implementation is divided into:

- Pure domain calculator
- Repository contract for calculation sources
- PostgreSQL implementation of calculation sources
- Application service exposing the central calculation
- Character snapshot integration

Controllers and PostgreSQL repositories do not contain final-statistic formulas.

## Implementation checklist

- [x] Normalize Spell Power representation
- [x] Define effective-statistics types
- [x] Implement deterministic domain calculator
- [x] Implement Health and Mana level progression
- [x] Implement Energy level progression
- [x] Add equipped item base statistics
- [x] Add equipped item affixes
- [x] Add highest reached set-bonus threshold
- [x] Add completed achievement bonuses
- [x] Add active Gold and Experience boosts
- [x] Separate progression boosts from combat modifiers
- [x] Add PostgreSQL calculation-source repository
- [x] Add central calculation application service
- [x] Integrate effective statistics with character snapshot
- [x] Implement resource hard clamp in snapshot flow
- [x] Add deterministic and non-mutation tests
- [x] Add unit and integration coverage for implemented sources
- [x] Implement transactional equip operation
- [x] Implement transactional unequip operation
- [x] Recalculate maxima and clamp resources inside equipment transactions
- [x] Add equip and unequip integration tests
- [x] Complete final M2 verification and documentation closure

## Test coverage

Automated coverage currently includes:

- Base statistics
- Level-based Health and Mana
- Energy progression and cap
- Spell Mastery
- Equipped and unequipped items
- Item affixes
- Set-bonus threshold selection
- Completed and incomplete achievements
- Active and inactive progression boosts
- Snapshot effective statistics
- Resource hard clamp
- Deterministic repeated calculations
- Invalid source values
- Missing characters

## Definition of done

- [x] One central statistics calculator exists
- [x] Every effective statistic has automated coverage
- [x] Equipped item sources affect statistics
- [x] Unequipped items are ignored
- [x] Repeated calculations return identical results
- [x] Character snapshot uses the central calculator
- [x] Current resources are safely clamped
- [x] Progression boosts and combat modifiers are separated
- [x] No separate permanent-character-bonus system exists
- [x] Equipment mutations use the central calculator transactionally
- [x] Equip and unequip behavior is covered by integration tests
- [x] Full type-check, test suite, build, and database verification pass
- [x] Documentation closure is committed

## Remaining work

The remaining functional part of M2 is the equipment mutation flow:

1. Equip an owned valid item.
2. Unequip the currently equipped item.
3. Recalculate effective statistics in the same transaction.
4. Persist new maximum resources.
5. Clamp current resources when maxima decrease.
6. Roll back the entire operation if any step fails.

## Verification commands

```powershell
npm run db:test
npm run typecheck
npm test
npm run build




============================================================
SOURCE: documentation/game-design/MASTER_PROJECT_PLAN.md
============================================================

# OSTATNIA SZANSA: V1 MASTER PROJECT PLAN

## PROJECT OBJECTIVE

Deliver a playable browser-based RPG where the player can:

Create Character
â†’ Fight Monsters
â†’ Gain Experience, Gold, Items, and Materials
â†’ Equip and Improve Items
â†’ Use Spells and Consumables
â†’ Craft Items
â†’ Gather Materials Offline
â†’ Trade Through the Marketplace
â†’ Fight Bosses
â†’ Complete Achievements and Collections
â†’ Participate in Seasonal Competition

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
â†’ Combat
â†’ Rewards
â†’ Equipment
â†’ Increased Power
â†’ Stronger Combat

---

## M1: CHARACTER FOUNDATION

### Objective

Implement character creation and a complete gameplay-ready character snapshot.

### Deliverables

- Account-to-character ownership enforcement
- Maximum three active characters
- Globally unique character names
- Character creation
- Character listing
- Character details
- Character archiving
- Initial progression
- Initial statistics
- Initial unlocks
- Initial equipment loadout
- Online and offline resource regeneration
- Complete character snapshot

### Initial character state

- Level: 1
- Experience: 0
- Gold: 0
- Health: 180 / 180
- Mana: 35 / 35
- Energy: 100 / 100
- Base Attack: 7
- Base Defense: 7
- Base Spell Power: 100%
- Spell Slots: 1
- Inventory Capacity: 50
- Crafting Level: 1
- Crafting Experience: 0
- Gathering Level: 1
- Gathering Experience: 0
- Crafting Slots: 1
- Promotion: false
- Archived: false

### Suggested endpoints

- POST /characters
- GET /characters
- GET /characters/:characterId
- POST /characters/:characterId/archive

### Character creation transaction

1. Validate and lock the account where required.
2. Count active characters.
3. Reject creation if the account has three active characters.
4. Validate the character name.
5. Create the character.
6. Create character statistics.
7. Create character unlock records.
8. Create the initial equipment loadout.
9. Initialize mandatory progression records.
10. Commit the transaction.

### Definition of done

- Character creation is transactional.
- Duplicate names are rejected.
- A fourth active character is rejected.
- Dependent records are initialized.
- Unauthorized accounts cannot access another accountâ€™s character.
- Snapshot includes resources, progression, equipment, storage, and effective statistics.
- Regeneration cannot be applied twice for the same elapsed period.
- Current resources cannot exceed their calculated maximums.
- Unit, integration, authorization, and rollback tests pass.

---

## M2: EFFECTIVE CHARACTER STATISTICS

### Objective

Create one authoritative calculator for final character statistics.

### Required interface

calculateCharacterStats(characterId): EffectiveCharacterStats

### Calculation

Base Character Statistics
+ Equipped Item Base Statistics
+ Item Affixes
+ Set Bonuses
+ Achievement Bonuses
+ Permanent Character Bonuses
+ Active Buffs and Debuffs
= Effective Character Statistics

### Effective statistics

- Attack
- Defense
- Spell Power
- Maximum Health
- Maximum Mana
- Maximum Energy
- Gold Bonus
- Experience Bonus

### Rules

- Controllers must not calculate statistics.
- Combat must use the central calculator.
- Profiles must use the central calculator.
- Equipment comparisons must use the central calculator.
- Equipment changes trigger recalculation.
- Current resources are clamped if maximums decrease.

### Definition of done

- Every statistic has automated tests.
- Equipping and unequipping changes effective statistics correctly.
- Repeated calculations return identical results.
- Current resources are clamped safely.
- No duplicated statistics logic exists.

---

## M3: MONSTER DISCOVERY AND ELIGIBILITY

### Deliverables

- Available-monster list
- Monster details
- Character-level access validation
- Monster cooldown status
- Energy-cost preview
- Monster-type distinction
- Bestiary visibility state
- Stable-code monster loading

### Suggested endpoints

- GET /characters/:characterId/monsters
- GET /characters/:characterId/monsters/:monsterCode

### Access rule

character.level >= monster.level

### Monster types

- Normal
- Mini Boss
- Task Boss
- Daily Boss

### Definition of done

- Eligible monsters are returned.
- Higher-level monsters cannot be started.
- Monsters are loaded by stable code.
- Hidden internal values are not unnecessarily exposed.
- Placeholder monsters require no hardcoded exceptions.
- Cooldowns are character-specific.
- Ownership and eligibility tests pass.

---

## M4: PURE COMBAT ENGINE

### Objective

Implement deterministic combat as a pure TypeScript domain module.

### Required interface

resolveCombatAction(
  state: CombatState,
  action: PlayerAction,
  rng: RandomSource
): CombatResolution

### Initially supported action

PlayerAction:
- type: basic_attack

### Combat flow

Player Action
â†’ Resolve Player Action
â†’ Resolve Active Effects
â†’ Check Monster Death
â†’ Monster Action
â†’ Resolve Monster Action
â†’ Resolve Active Effects
â†’ Check Player Death
â†’ Advance Turn

### Basic attack formula

hitChancePercent =
  clamp((attackerAttack - defenderDefense) * 4, 5, 90)

minimumDamage =
  max(0, attackerAttack - defenderDefense)

maximumDamage =
  max(0, (attackerAttack - defenderDefense) * 2)

### Rules

- Player always acts first.
- Combat has no escape action.
- A successful attack may deal zero damage.
- Player and monster basic attacks use the same formula.
- Combat stops immediately when either combatant reaches zero Health.
- Maximum combat duration is 100 turns.
- Exceeding 100 turns results in player defeat.

### Required abstractions

RandomSource:
- nextFloat()
- nextInt(min, max)

Clock:
- now()

### Definition of done

- Seeded random input produces repeatable combat.
- Player acts first.
- Misses work.
- Minimum and maximum hit chances work.
- Zero damage works.
- Death and victory stop combat immediately.
- The 100-turn defeat works.
- Domain logic does not access HTTP or PostgreSQL.
- Domain logic does not call Math.random() or Date.now().
- Unit tests cover hits, misses, zero damage, victory, defeat, and turn limit.

---

## M5: PERSISTENT COMBAT API

### Suggested endpoints

- POST /characters/:characterId/combat
- GET /characters/:characterId/combat
- POST /characters/:characterId/combat/actions
- GET /characters/:characterId/combat/log

### Fight-start transaction

1. Lock the character.
2. Validate ownership.
3. Reject an existing active combat session.
4. Apply resource regeneration.
5. Validate monster access.
6. Validate monster cooldown.
7. Validate available Energy.
8. Deduct Energy exactly once.
9. Snapshot effective character statistics.
10. Snapshot monster statistics.
11. Create the combat session.
12. Commit.

### Action request

{
  "expectedTurn": 4,
  "action": {
    "type": "basic_attack"
  }
}

### Combat-action transaction

1. Lock the active combat session.
2. Validate character ownership.
3. Validate active status.
4. Validate expectedTurn.
5. Resolve the player action.
6. Resolve active effects.
7. Stop if the monster dies.
8. Resolve the monster action.
9. Resolve active effects.
10. Stop if the player dies.
11. Save combat state.
12. Save combat events.
13. Advance the turn.
14. Commit.

### Definition of done

- Duplicate starts cannot deduct Energy twice.
- Duplicate actions cannot execute a turn twice.
- Stale expectedTurn values are rejected.
- One character cannot have multiple active fights.
- Other accounts cannot submit actions.
- Combat survives application restarts.
- Concurrent-action tests pass.

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
â†’ Determine Item Level
â†’ Determine Rarity
â†’ Determine Affix Count
â†’ Select Eligible Affixes
â†’ Roll Affix Values
â†’ Calculate Item Score
â†’ Persist Item and Affixes

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
â†’ Gain Rewards
â†’ Receive Equipment
â†’ Equip Equipment
â†’ Become Stronger
â†’ Fight Stronger Monster

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
â†’ On Failure: Basic Attack
â†’ On Success: Weighted Ability Selection
â†’ Resolve Through Shared Spell Engine

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

- Common â†’ Magic
- Magic â†’ Rare
- Rare â†’ Epic
- Epic â†’ Legendary
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
â†’ Block Active Gameplay
â†’ Accumulate Completed Minutes
â†’ Stop at Login or 24 Hours
â†’ Generate Pending Results
â†’ Collect Results

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

# CURRENT PROJECT STATUS

## Completed

- Database architecture established
- Database migrations created
- Authored-content tables available
- Stable content codes added
- Development workbook created
- Synthetic development content populated
- Workbook validation implemented
- Transactional game-data importer implemented
- Transactional dry run verified
- Complete content import committed
- Repeat import verified
- Foreign-key relationships verified
- Representative table counts verified

## Current development content

- 29 authored-content worksheets
- 248 authored-content records
- 10 materials
- 10 monsters
- 10 item bases
- 10 spells
- 10 recipes
- 10 monster abilities
- 10 loot-table records
- Supporting definitions for bosses, chests, NPCs, achievements, outfits, sets, uniques, and seasons

## Current position

Database Schema: Ready for Gameplay Implementation
Development Content: Populated
Content Importer: Working
Dry Run: Verified
Repeat Import: Verified
Gameplay Implementation: Not Started
Current Milestone: M1 Character Foundation

---

# IMMEDIATE NEXT TASK

Implement M1 Character Foundation.

The first implementation package must include:

1. Character domain rules
2. Character creation service
3. Character repository interface
4. PostgreSQL character repository
5. Character ownership authorization
6. Maximum active-character validation
7. Globally unique name validation
8. Initial progression initialization
9. Initial statistics initialization
10. Initial unlock initialization
11. Initial loadout initialization
12. Resource regeneration service
13. Character snapshot service
14. Character creation endpoint
15. Character list endpoint
16. Character snapshot endpoint
17. Character archive endpoint
18. Unit tests
19. PostgreSQL integration tests
20. Authorization tests
21. Transaction rollback tests

M1 is complete only when a newly created character can be loaded as a complete gameplay-ready snapshot for use by M2 and M3.


============================================================
SOURCE: database/migrations/010_monster_families.sql
============================================================

-- =====================================================
-- 010_monster_families.sql
-- =====================================================

CREATE TABLE monster_families (
    monster_family_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT ux_monster_families_name UNIQUE (name)
);



============================================================
SOURCE: database/migrations/011_monsters.sql
============================================================

-- =====================================================
-- 011_monsters.sql
-- Requires: monster_families
-- =====================================================

CREATE TABLE monsters (
    monster_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monster_family_id UUID NOT NULL,

    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    artwork TEXT NULL,

    monster_type VARCHAR(20) NOT NULL,
    level INTEGER NOT NULL,

    health BIGINT NOT NULL,
    attack NUMERIC(12, 4) NOT NULL,
    defense NUMERIC(12, 4) NOT NULL,
    spell_power_percent NUMERIC(8, 4) NOT NULL DEFAULT 100.0000,

    cooldown_seconds INTEGER NOT NULL DEFAULT 0,
    ability_chance_percent NUMERIC(7, 4) NOT NULL DEFAULT 0,

    gold_min BIGINT NOT NULL DEFAULT 0,
    gold_max BIGINT NOT NULL DEFAULT 0,

    loot_level_modifier INTEGER NOT NULL DEFAULT 0,
    power_score BIGINT NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_monsters_family
        FOREIGN KEY (monster_family_id)
        REFERENCES monster_families(monster_family_id)
        ON DELETE RESTRICT,

    CONSTRAINT ux_monsters_name UNIQUE (name),

    CONSTRAINT chk_monsters_type
        CHECK (monster_type IN ('Normal', 'MiniBoss', 'TaskBoss', 'DailyBoss')),

    CONSTRAINT chk_monsters_level CHECK (level >= 1),
    CONSTRAINT chk_monsters_health CHECK (health > 0),
    CONSTRAINT chk_monsters_attack CHECK (attack >= 0),
    CONSTRAINT chk_monsters_defense CHECK (defense >= 0),
    CONSTRAINT chk_monsters_spell_power CHECK (spell_power_percent >= 0),
    CONSTRAINT chk_monsters_cooldown CHECK (cooldown_seconds >= 0),
    CONSTRAINT chk_monsters_ability_chance
        CHECK (ability_chance_percent >= 0 AND ability_chance_percent <= 100),
    CONSTRAINT chk_monsters_gold
        CHECK (gold_min >= 0 AND gold_max >= gold_min),
    CONSTRAINT chk_monsters_power_score CHECK (power_score >= 0)
);

CREATE INDEX ix_monsters_family_id
    ON monsters(monster_family_id);

CREATE INDEX ix_monsters_level
    ON monsters(level);

CREATE INDEX ix_monsters_type
    ON monsters(monster_type);



============================================================
SOURCE: database/migrations/012_bosses.sql
============================================================

-- =====================================================
-- 012_bosses.sql
-- Requires: monsters
-- =====================================================

CREATE TABLE bosses (
    boss_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monster_id UUID NOT NULL,

    boss_type VARCHAR(20) NOT NULL,
    loot_level_bonus INTEGER NOT NULL DEFAULT 0,
    unique_modifier NUMERIC(8, 4) NOT NULL DEFAULT 1.0000,
    additional_cooldown_seconds INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_bosses_monster
        FOREIGN KEY (monster_id)
        REFERENCES monsters(monster_id)
        ON DELETE RESTRICT,

    CONSTRAINT ux_bosses_monster_id UNIQUE (monster_id),

    CONSTRAINT chk_bosses_type
        CHECK (boss_type IN ('MiniBoss', 'TaskBoss', 'DailyBoss')),

    CONSTRAINT chk_bosses_loot_level_bonus CHECK (loot_level_bonus >= 0),
    CONSTRAINT chk_bosses_unique_modifier CHECK (unique_modifier >= 0),
    CONSTRAINT chk_bosses_additional_cooldown
        CHECK (additional_cooldown_seconds >= 0)
);

CREATE INDEX ix_bosses_boss_type
    ON bosses(boss_type);



============================================================
SOURCE: database/migrations/013_daily_boss_definitions.sql
============================================================

-- =====================================================
-- 013_daily_boss_definitions.sql
-- Requires: bosses
-- =====================================================

CREATE TABLE daily_boss_definitions (
    daily_boss_definition_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    boss_id UUID NOT NULL,

    tier INTEGER NOT NULL,
    recommended_level INTEGER NOT NULL,
    attempts_per_day INTEGER NOT NULL DEFAULT 1,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_daily_boss_definitions_boss
        FOREIGN KEY (boss_id)
        REFERENCES bosses(boss_id)
        ON DELETE RESTRICT,

    CONSTRAINT ux_daily_boss_definitions_boss_id UNIQUE (boss_id),
    CONSTRAINT chk_daily_boss_definitions_tier CHECK (tier BETWEEN 1 AND 3),
    CONSTRAINT chk_daily_boss_definitions_recommended_level
        CHECK (recommended_level >= 1),
    CONSTRAINT chk_daily_boss_definitions_attempts
        CHECK (attempts_per_day >= 1)
);

CREATE INDEX ix_daily_boss_definitions_tier
    ON daily_boss_definitions(tier);



============================================================
SOURCE: database/migrations/014_daily_boss_pools.sql
============================================================

-- =====================================================
-- 014_daily_boss_pools.sql
-- Requires: daily_boss_definitions
-- =====================================================

CREATE TABLE daily_boss_pools (
    daily_boss_pool_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_boss_definition_id UUID NOT NULL,

    tier INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_daily_boss_pools_definition
        FOREIGN KEY (daily_boss_definition_id)
        REFERENCES daily_boss_definitions(daily_boss_definition_id)
        ON DELETE CASCADE,

    CONSTRAINT ux_daily_boss_pools_tier_definition
        UNIQUE (tier, daily_boss_definition_id),

    CONSTRAINT chk_daily_boss_pools_tier CHECK (tier BETWEEN 1 AND 3)
);

CREATE INDEX ix_daily_boss_pools_tier
    ON daily_boss_pools(tier);

CREATE INDEX ix_daily_boss_pools_definition_id
    ON daily_boss_pools(daily_boss_definition_id);

CREATE INDEX ix_daily_boss_pools_active_tier
    ON daily_boss_pools(tier)
    WHERE is_active = TRUE;



============================================================
SOURCE: database/migrations/015_daily_boss_rotation.sql
============================================================

-- =====================================================
-- 015_daily_boss_rotation.sql
-- Requires: daily_boss_definitions
-- =====================================================

CREATE TABLE daily_boss_rotation (
    daily_boss_rotation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tier_1_boss_id UUID NOT NULL,
    tier_2_boss_id UUID NOT NULL,
    tier_3_boss_id UUID NOT NULL,

    reset_timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_daily_boss_rotation_tier_1
        FOREIGN KEY (tier_1_boss_id)
        REFERENCES daily_boss_definitions(daily_boss_definition_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_daily_boss_rotation_tier_2
        FOREIGN KEY (tier_2_boss_id)
        REFERENCES daily_boss_definitions(daily_boss_definition_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_daily_boss_rotation_tier_3
        FOREIGN KEY (tier_3_boss_id)
        REFERENCES daily_boss_definitions(daily_boss_definition_id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_daily_boss_rotation_distinct
        CHECK (
            tier_1_boss_id <> tier_2_boss_id
            AND tier_1_boss_id <> tier_3_boss_id
            AND tier_2_boss_id <> tier_3_boss_id
        )
);

CREATE INDEX ix_daily_boss_rotation_reset_timestamp
    ON daily_boss_rotation(reset_timestamp);



============================================================
SOURCE: database/migrations/026_character_cooldowns.sql
============================================================

-- =====================================================
-- 026_character_cooldowns.sql
-- Requires: characters, monsters
-- =====================================================

CREATE TABLE character_cooldowns (
    character_cooldown_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL,
    cooldown_type VARCHAR(32) NOT NULL,
    target_id UUID NULL,
    available_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_character_cooldowns_character
        FOREIGN KEY (character_id)
        REFERENCES characters(character_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_character_cooldowns_target
        FOREIGN KEY (target_id)
        REFERENCES monsters(monster_id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_character_cooldowns_type
        CHECK (cooldown_type IN ('Monster', 'NpcHealer')),

    CONSTRAINT chk_character_cooldowns_target
        CHECK (
            (cooldown_type = 'Monster' AND target_id IS NOT NULL)
            OR
            (cooldown_type = 'NpcHealer' AND target_id IS NULL)
        )
);

CREATE UNIQUE INDEX ux_character_cooldowns_monster
    ON character_cooldowns(character_id, target_id)
    WHERE cooldown_type = 'Monster';

CREATE UNIQUE INDEX ux_character_cooldowns_npc_healer
    ON character_cooldowns(character_id)
    WHERE cooldown_type = 'NpcHealer';

CREATE INDEX ix_character_cooldowns_character_id
    ON character_cooldowns(character_id);

CREATE INDEX ix_character_cooldowns_cooldown_type
    ON character_cooldowns(cooldown_type);

CREATE INDEX ix_character_cooldowns_target_id
    ON character_cooldowns(target_id);

CREATE INDEX ix_character_cooldowns_available_at
    ON character_cooldowns(available_at);



============================================================
SOURCE: database/migrations/035_bestiary_entries.sql
============================================================

-- =====================================================
-- 035_bestiary_entries.sql
-- Requires: characters, monsters
-- =====================================================

CREATE TABLE bestiary_entries (
    bestiary_entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL,
    monster_id UUID NOT NULL,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_bestiary_entries_character
        FOREIGN KEY (character_id) REFERENCES characters(character_id) ON DELETE CASCADE,
    CONSTRAINT fk_bestiary_entries_monster
        FOREIGN KEY (monster_id) REFERENCES monsters(monster_id) ON DELETE RESTRICT,
    CONSTRAINT ux_bestiary_entries_character_monster UNIQUE (character_id, monster_id)
);

CREATE INDEX ix_bestiary_entries_character_id ON bestiary_entries(character_id);
CREATE INDEX ix_bestiary_entries_monster_id ON bestiary_entries(monster_id);



============================================================
SOURCE: database/migrations/036_bestiary_statistics.sql
============================================================

-- =====================================================
-- 036_bestiary_statistics.sql
-- Requires: characters, monsters
-- =====================================================

CREATE TABLE bestiary_statistics (
    bestiary_statistics_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL,
    monster_id UUID NOT NULL,
    kill_count BIGINT NOT NULL DEFAULT 1,
    first_kill_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_kill_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    task_progress BIGINT NOT NULL DEFAULT 0,
    task_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_bestiary_statistics_character
        FOREIGN KEY (character_id) REFERENCES characters(character_id) ON DELETE CASCADE,
    CONSTRAINT fk_bestiary_statistics_monster
        FOREIGN KEY (monster_id) REFERENCES monsters(monster_id) ON DELETE RESTRICT,
    CONSTRAINT ux_bestiary_statistics_character_monster UNIQUE (character_id, monster_id),
    CONSTRAINT chk_bestiary_statistics_kill_count CHECK (kill_count >= 1),
    CONSTRAINT chk_bestiary_statistics_task_progress CHECK (task_progress >= 0),
    CONSTRAINT chk_bestiary_statistics_dates CHECK (last_kill_at >= first_kill_at)
);

CREATE INDEX ix_bestiary_statistics_character_id ON bestiary_statistics(character_id);
CREATE INDEX ix_bestiary_statistics_monster_id ON bestiary_statistics(monster_id);
CREATE INDEX ix_bestiary_statistics_kill_count ON bestiary_statistics(kill_count);



============================================================
SOURCE: database/migrations/037_character_daily_boss_progress.sql
============================================================

-- =====================================================
-- 037_character_daily_boss_progress.sql
-- Requires: characters, daily_boss_definitions
-- =====================================================

CREATE TABLE character_daily_boss_progress (
    character_daily_boss_progress_id UUID
        PRIMARY KEY
        DEFAULT gen_random_uuid(),

    character_id UUID NOT NULL,
    daily_boss_definition_id UUID NOT NULL,

    attempts_date DATE NOT NULL DEFAULT CURRENT_DATE,
    attempts_used_today INTEGER NOT NULL DEFAULT 0,

    total_attempts BIGINT NOT NULL DEFAULT 0,
    total_victories BIGINT NOT NULL DEFAULT 0,

    last_attempt_at TIMESTAMPTZ NULL,
    last_victory_at TIMESTAMPTZ NULL,

    highest_tier_defeated INTEGER NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_character_daily_boss_progress_character
        FOREIGN KEY (character_id)
        REFERENCES characters(character_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_character_daily_boss_progress_definition
        FOREIGN KEY (daily_boss_definition_id)
        REFERENCES daily_boss_definitions(daily_boss_definition_id)
        ON DELETE RESTRICT,

    CONSTRAINT ux_character_daily_boss_progress
        UNIQUE (
            character_id,
            daily_boss_definition_id
        ),

    CONSTRAINT chk_character_daily_boss_attempts_today
        CHECK (attempts_used_today >= 0),

    CONSTRAINT chk_character_daily_boss_totals
        CHECK (
            total_attempts >= 0
            AND total_victories >= 0
            AND total_victories <= total_attempts
        ),

    CONSTRAINT chk_character_daily_boss_highest_tier
        CHECK (
            highest_tier_defeated IS NULL
            OR highest_tier_defeated BETWEEN 1 AND 3
        ),

    CONSTRAINT chk_character_daily_boss_last_victory
        CHECK (
            last_victory_at IS NULL
            OR (
                last_attempt_at IS NOT NULL
                AND last_victory_at <= last_attempt_at
            )
        )
);

CREATE INDEX ix_character_daily_boss_progress_character_id
    ON character_daily_boss_progress(character_id);

CREATE INDEX ix_character_daily_boss_progress_definition_id
    ON character_daily_boss_progress(daily_boss_definition_id);

CREATE INDEX ix_character_daily_boss_progress_attempts_date
    ON character_daily_boss_progress(attempts_date);


============================================================
SOURCE: database/migrations/038_monster_tasks.sql
============================================================

-- =====================================================
-- 038_monster_tasks.sql
-- Requires: monsters, bosses
-- =====================================================

CREATE TABLE monster_tasks (
    monster_task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monster_id UUID NOT NULL,
    boss_id UUID NOT NULL,
    required_kills BIGINT NOT NULL,
    reunlock_gold_cost BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_monster_tasks_monster
        FOREIGN KEY (monster_id) REFERENCES monsters(monster_id) ON DELETE RESTRICT,
    CONSTRAINT fk_monster_tasks_boss
        FOREIGN KEY (boss_id) REFERENCES bosses(boss_id) ON DELETE RESTRICT,
    CONSTRAINT ux_monster_tasks_monster_id UNIQUE (monster_id),
    CONSTRAINT chk_monster_tasks_required_kills CHECK (required_kills > 0),
    CONSTRAINT chk_monster_tasks_reunlock_gold_cost CHECK (reunlock_gold_cost >= 0)
);

CREATE INDEX ix_monster_tasks_boss_id ON monster_tasks(boss_id);



============================================================
SOURCE: database/migrations/039_monster_abilities.sql
============================================================

-- =====================================================
-- 039_monster_abilities.sql
-- Requires: monsters, spells
-- =====================================================

CREATE TABLE monster_abilities (
    monster_ability_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monster_id UUID NOT NULL,
    spell_id UUID NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_monster_abilities_monster
        FOREIGN KEY (monster_id) REFERENCES monsters(monster_id) ON DELETE CASCADE,
    CONSTRAINT fk_monster_abilities_spell
        FOREIGN KEY (spell_id) REFERENCES spells(spell_id) ON DELETE RESTRICT,
    CONSTRAINT ux_monster_abilities_monster_spell UNIQUE (monster_id, spell_id)
);

CREATE INDEX ix_monster_abilities_monster_id ON monster_abilities(monster_id);
CREATE INDEX ix_monster_abilities_spell_id ON monster_abilities(spell_id);



============================================================
SOURCE: database/migrations/040_monster_ability_weights.sql
============================================================

-- =====================================================
-- 040_monster_ability_weights.sql
-- Requires: monster_abilities
-- =====================================================

CREATE TABLE monster_ability_weights (
    monster_ability_weight_id UUID
        PRIMARY KEY
        DEFAULT gen_random_uuid(),

    monster_ability_id UUID NOT NULL,

    weight NUMERIC(12, 4) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_monster_ability_weights_ability
        FOREIGN KEY (monster_ability_id)
        REFERENCES monster_abilities(monster_ability_id)
        ON DELETE CASCADE,

    CONSTRAINT chk_monster_ability_weights_weight
        CHECK (weight > 0)
);

CREATE INDEX ix_monster_ability_weights_ability_id
    ON monster_ability_weights(monster_ability_id);


============================================================
SOURCE: database/migrations/046_combat_sessions.sql
============================================================

-- 046_combat_sessions.sql
-- Requires: characters, monsters
CREATE TABLE combat_sessions (
 combat_session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 character_id UUID NOT NULL,
 monster_id UUID NOT NULL,
 status VARCHAR(20) NOT NULL DEFAULT 'Active',
 current_turn INTEGER NOT NULL DEFAULT 1,
 character_health BIGINT NOT NULL,
 character_mana BIGINT NOT NULL,
 monster_health BIGINT NOT NULL,
 started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 ended_at TIMESTAMPTZ NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CONSTRAINT fk_combat_sessions_character FOREIGN KEY (character_id) REFERENCES characters(character_id) ON DELETE CASCADE,
 CONSTRAINT fk_combat_sessions_monster FOREIGN KEY (monster_id) REFERENCES monsters(monster_id) ON DELETE RESTRICT,
 CONSTRAINT chk_combat_sessions_status CHECK (status IN ('Active','Victory','Defeat','Abandoned')),
 CONSTRAINT chk_combat_sessions_turn CHECK (current_turn >= 1),
 CONSTRAINT chk_combat_sessions_resources CHECK (character_health >= 0 AND character_mana >= 0 AND monster_health >= 0),
 CONSTRAINT chk_combat_sessions_end_state CHECK ((status = 'Active' AND ended_at IS NULL) OR (status <> 'Active' AND ended_at IS NOT NULL AND ended_at >= started_at))
);
CREATE UNIQUE INDEX ux_combat_sessions_active_character ON combat_sessions(character_id) WHERE status = 'Active';
CREATE INDEX ix_combat_sessions_character_id ON combat_sessions(character_id);
CREATE INDEX ix_combat_sessions_monster_id ON combat_sessions(monster_id);
CREATE INDEX ix_combat_sessions_status ON combat_sessions(status);



============================================================
SOURCE: database/migrations/079_add_stable_content_codes.sql
============================================================

-- =====================================================
-- 079_add_stable_content_codes.sql
-- Adds immutable, machine-readable codes to authored game definitions.
-- Requires: migrations 001-078
-- =====================================================

-- Codes use lowercase snake_case and are intended to remain immutable.
-- Existing rows are backfilled deterministically from their current names.

CREATE OR REPLACE FUNCTION pg_temp.slugify_content_code(value TEXT)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
AS $$
    SELECT LEFT(
        COALESCE(
            NULLIF(
                TRIM(BOTH '_' FROM REGEXP_REPLACE(
                    LOWER(TRIM(value)),
                    '[^a-z0-9]+',
                    '_',
                    'g'
                )),
                ''
            ),
            'entry'
        ),
        55
    );
$$;

-- -----------------------------------------------------
-- materials
-- -----------------------------------------------------

ALTER TABLE materials
    ADD COLUMN code VARCHAR(64);

WITH generated_codes AS (
    SELECT
        material_id,
        pg_temp.slugify_content_code(name) AS base_code,
        COUNT(*) OVER (
            PARTITION BY pg_temp.slugify_content_code(name)
        ) AS duplicate_count
    FROM materials
)
UPDATE materials AS target
SET code = source.base_code ||
    CASE
        WHEN source.duplicate_count > 1
        THEN '_' || LEFT(target.material_id::TEXT, 8)
        ELSE ''
    END
FROM generated_codes AS source
WHERE target.material_id = source.material_id;

ALTER TABLE materials
    ALTER COLUMN code SET NOT NULL;

ALTER TABLE materials
    ADD CONSTRAINT ux_materials_code UNIQUE (code);

ALTER TABLE materials
    ADD CONSTRAINT chk_materials_code
    CHECK (code ~ '^[a-z][a-z0-9_]{0,63}$');

-- -----------------------------------------------------
-- spells
-- -----------------------------------------------------

ALTER TABLE spells
    ADD COLUMN code VARCHAR(64);

WITH generated_codes AS (
    SELECT
        spell_id,
        pg_temp.slugify_content_code(name) AS base_code,
        COUNT(*) OVER (
            PARTITION BY pg_temp.slugify_content_code(name)
        ) AS duplicate_count
    FROM spells
)
UPDATE spells AS target
SET code = source.base_code ||
    CASE
        WHEN source.duplicate_count > 1
        THEN '_' || LEFT(target.spell_id::TEXT, 8)
        ELSE ''
    END
FROM generated_codes AS source
WHERE target.spell_id = source.spell_id;

ALTER TABLE spells
    ALTER COLUMN code SET NOT NULL;

ALTER TABLE spells
    ADD CONSTRAINT ux_spells_code UNIQUE (code);

ALTER TABLE spells
    ADD CONSTRAINT chk_spells_code
    CHECK (code ~ '^[a-z][a-z0-9_]{0,63}$');

-- -----------------------------------------------------
-- consumable_definitions
-- -----------------------------------------------------

ALTER TABLE consumable_definitions
    ADD COLUMN code VARCHAR(64);

WITH generated_codes AS (
    SELECT
        consumable_definition_id,
        pg_temp.slugify_content_code(name) AS base_code,
        COUNT(*) OVER (
            PARTITION BY pg_temp.slugify_content_code(name)
        ) AS duplicate_count
    FROM consumable_definitions
)
UPDATE consumable_definitions AS target
SET code = source.base_code ||
    CASE
        WHEN source.duplicate_count > 1
        THEN '_' || LEFT(target.consumable_definition_id::TEXT, 8)
        ELSE ''
    END
FROM generated_codes AS source
WHERE target.consumable_definition_id = source.consumable_definition_id;

ALTER TABLE consumable_definitions
    ALTER COLUMN code SET NOT NULL;

ALTER TABLE consumable_definitions
    ADD CONSTRAINT ux_consumable_definitions_code UNIQUE (code);

ALTER TABLE consumable_definitions
    ADD CONSTRAINT chk_consumable_definitions_code
    CHECK (code ~ '^[a-z][a-z0-9_]{0,63}$');

-- -----------------------------------------------------
-- monster_families
-- -----------------------------------------------------

ALTER TABLE monster_families
    ADD COLUMN code VARCHAR(64);

WITH generated_codes AS (
    SELECT
        monster_family_id,
        pg_temp.slugify_content_code(name) AS base_code,
        COUNT(*) OVER (
            PARTITION BY pg_temp.slugify_content_code(name)
        ) AS duplicate_count
    FROM monster_families
)
UPDATE monster_families AS target
SET code = source.base_code ||
    CASE
        WHEN source.duplicate_count > 1
        THEN '_' || LEFT(target.monster_family_id::TEXT, 8)
        ELSE ''
    END
FROM generated_codes AS source
WHERE target.monster_family_id = source.monster_family_id;

ALTER TABLE monster_families
    ALTER COLUMN code SET NOT NULL;

ALTER TABLE monster_families
    ADD CONSTRAINT ux_monster_families_code UNIQUE (code);

ALTER TABLE monster_families
    ADD CONSTRAINT chk_monster_families_code
    CHECK (code ~ '^[a-z][a-z0-9_]{0,63}$');

-- -----------------------------------------------------
-- unique_templates
-- -----------------------------------------------------

ALTER TABLE unique_templates
    ADD COLUMN code VARCHAR(64);

WITH generated_codes AS (
    SELECT
        unique_template_id,
        pg_temp.slugify_content_code(name) AS base_code,
        COUNT(*) OVER (
            PARTITION BY pg_temp.slugify_content_code(name)
        ) AS duplicate_count
    FROM unique_templates
)
UPDATE unique_templates AS target
SET code = source.base_code ||
    CASE
        WHEN source.duplicate_count > 1
        THEN '_' || LEFT(target.unique_template_id::TEXT, 8)
        ELSE ''
    END
FROM generated_codes AS source
WHERE target.unique_template_id = source.unique_template_id;

ALTER TABLE unique_templates
    ALTER COLUMN code SET NOT NULL;

ALTER TABLE unique_templates
    ADD CONSTRAINT ux_unique_templates_code UNIQUE (code);

ALTER TABLE unique_templates
    ADD CONSTRAINT chk_unique_templates_code
    CHECK (code ~ '^[a-z][a-z0-9_]{0,63}$');

-- -----------------------------------------------------
-- set_templates
-- -----------------------------------------------------

ALTER TABLE set_templates
    ADD COLUMN code VARCHAR(64);

WITH generated_codes AS (
    SELECT
        set_template_id,
        pg_temp.slugify_content_code(name) AS base_code,
        COUNT(*) OVER (
            PARTITION BY pg_temp.slugify_content_code(name)
        ) AS duplicate_count
    FROM set_templates
)
UPDATE set_templates AS target
SET code = source.base_code ||
    CASE
        WHEN source.duplicate_count > 1
        THEN '_' || LEFT(target.set_template_id::TEXT, 8)
        ELSE ''
    END
FROM generated_codes AS source
WHERE target.set_template_id = source.set_template_id;

ALTER TABLE set_templates
    ALTER COLUMN code SET NOT NULL;

ALTER TABLE set_templates
    ADD CONSTRAINT ux_set_templates_code UNIQUE (code);

ALTER TABLE set_templates
    ADD CONSTRAINT chk_set_templates_code
    CHECK (code ~ '^[a-z][a-z0-9_]{0,63}$');

-- -----------------------------------------------------
-- npc_definitions
-- -----------------------------------------------------

ALTER TABLE npc_definitions
    ADD COLUMN code VARCHAR(64);

WITH generated_codes AS (
    SELECT
        npc_definition_id,
        pg_temp.slugify_content_code(name) AS base_code,
        COUNT(*) OVER (
            PARTITION BY pg_temp.slugify_content_code(name)
        ) AS duplicate_count
    FROM npc_definitions
)
UPDATE npc_definitions AS target
SET code = source.base_code ||
    CASE
        WHEN source.duplicate_count > 1
        THEN '_' || LEFT(target.npc_definition_id::TEXT, 8)
        ELSE ''
    END
FROM generated_codes AS source
WHERE target.npc_definition_id = source.npc_definition_id;

ALTER TABLE npc_definitions
    ALTER COLUMN code SET NOT NULL;

ALTER TABLE npc_definitions
    ADD CONSTRAINT ux_npc_definitions_code UNIQUE (code);

ALTER TABLE npc_definitions
    ADD CONSTRAINT chk_npc_definitions_code
    CHECK (code ~ '^[a-z][a-z0-9_]{0,63}$');

-- -----------------------------------------------------
-- outfit_definitions
-- -----------------------------------------------------

ALTER TABLE outfit_definitions
    ADD COLUMN code VARCHAR(64);

WITH generated_codes AS (
    SELECT
        outfit_definition_id,
        pg_temp.slugify_content_code(name) AS base_code,
        COUNT(*) OVER (
            PARTITION BY pg_temp.slugify_content_code(name)
        ) AS duplicate_count
    FROM outfit_definitions
)
UPDATE outfit_definitions AS target
SET code = source.base_code ||
    CASE
        WHEN source.duplicate_count > 1
        THEN '_' || LEFT(target.outfit_definition_id::TEXT, 8)
        ELSE ''
    END
FROM generated_codes AS source
WHERE target.outfit_definition_id = source.outfit_definition_id;

ALTER TABLE outfit_definitions
    ALTER COLUMN code SET NOT NULL;

ALTER TABLE outfit_definitions
    ADD CONSTRAINT ux_outfit_definitions_code UNIQUE (code);

ALTER TABLE outfit_definitions
    ADD CONSTRAINT chk_outfit_definitions_code
    CHECK (code ~ '^[a-z][a-z0-9_]{0,63}$');

-- -----------------------------------------------------
-- monsters
-- -----------------------------------------------------

ALTER TABLE monsters
    ADD COLUMN code VARCHAR(64);

WITH generated_codes AS (
    SELECT
        monster_id,
        pg_temp.slugify_content_code(name) AS base_code,
        COUNT(*) OVER (
            PARTITION BY pg_temp.slugify_content_code(name)
        ) AS duplicate_count
    FROM monsters
)
UPDATE monsters AS target
SET code = source.base_code ||
    CASE
        WHEN source.duplicate_count > 1
        THEN '_' || LEFT(target.monster_id::TEXT, 8)
        ELSE ''
    END
FROM generated_codes AS source
WHERE target.monster_id = source.monster_id;

ALTER TABLE monsters
    ALTER COLUMN code SET NOT NULL;

ALTER TABLE monsters
    ADD CONSTRAINT ux_monsters_code UNIQUE (code);

ALTER TABLE monsters
    ADD CONSTRAINT chk_monsters_code
    CHECK (code ~ '^[a-z][a-z0-9_]{0,63}$');

-- -----------------------------------------------------
-- item_bases
-- -----------------------------------------------------

ALTER TABLE item_bases
    ADD COLUMN code VARCHAR(64);

WITH generated_codes AS (
    SELECT
        item_base_id,
        pg_temp.slugify_content_code(name) AS base_code,
        COUNT(*) OVER (
            PARTITION BY pg_temp.slugify_content_code(name)
        ) AS duplicate_count
    FROM item_bases
)
UPDATE item_bases AS target
SET code = source.base_code ||
    CASE
        WHEN source.duplicate_count > 1
        THEN '_' || LEFT(target.item_base_id::TEXT, 8)
        ELSE ''
    END
FROM generated_codes AS source
WHERE target.item_base_id = source.item_base_id;

ALTER TABLE item_bases
    ALTER COLUMN code SET NOT NULL;

ALTER TABLE item_bases
    ADD CONSTRAINT ux_item_bases_code UNIQUE (code);

ALTER TABLE item_bases
    ADD CONSTRAINT chk_item_bases_code
    CHECK (code ~ '^[a-z][a-z0-9_]{0,63}$');

-- -----------------------------------------------------
-- recipes
-- -----------------------------------------------------

ALTER TABLE recipes
    ADD COLUMN code VARCHAR(64);

WITH generated_codes AS (
    SELECT
        recipe_id,
        pg_temp.slugify_content_code(name) AS base_code,
        COUNT(*) OVER (
            PARTITION BY pg_temp.slugify_content_code(name)
        ) AS duplicate_count
    FROM recipes
)
UPDATE recipes AS target
SET code = source.base_code ||
    CASE
        WHEN source.duplicate_count > 1
        THEN '_' || LEFT(target.recipe_id::TEXT, 8)
        ELSE ''
    END
FROM generated_codes AS source
WHERE target.recipe_id = source.recipe_id;

ALTER TABLE recipes
    ALTER COLUMN code SET NOT NULL;

ALTER TABLE recipes
    ADD CONSTRAINT ux_recipes_code UNIQUE (code);

ALTER TABLE recipes
    ADD CONSTRAINT chk_recipes_code
    CHECK (code ~ '^[a-z][a-z0-9_]{0,63}$');

-- Display names remain user-facing and may continue to have their existing
-- uniqueness constraints. Application logic, CSV imports, and relationships
-- should use code as the permanent content identity.



============================================================
SOURCE: src/app.ts
============================================================

import {
  createServer,
  type Server,
} from "node:http";

import { SystemClock } from "./infrastructure/clock/system-clock.js";
import { databasePool } from "./database/pool.js";
import { PostgresAuthenticationProvider } from "./http/postgres-authentication.provider.js";
import { ArchiveCharacterService } from "./modules/characters/application/archive-character.service.js";
import { CreateCharacterService } from "./modules/characters/application/create-character.service.js";
import { CalculateCharacterStatsService } from "./modules/characters/application/calculate-character-stats.service.js";
import { GetCharacterSnapshotService } from "./modules/characters/application/get-character-snapshot.service.js";
import { ListCharactersService } from "./modules/characters/application/list-characters.service.js";
import { PostgresCharacterRepository } from "./modules/characters/infrastructure/postgres-character.repository.js";
import { PostgresCharacterStatisticsRepository } from "./modules/characters/infrastructure/postgres-character-statistics.repository.js";
import { createCharacterHttpHandler } from "./modules/characters/http/character-http.handler.js";

export function createApplicationServer(): Server {
  const characterRepository =
    new PostgresCharacterRepository(databasePool);

  const characterStatisticsRepository =
    new PostgresCharacterStatisticsRepository(
      databasePool
    );

  const calculateCharacterStatsService =
    new CalculateCharacterStatsService(
      characterStatisticsRepository
    );

  const authenticationProvider =
    new PostgresAuthenticationProvider(databasePool);

  const clock = new SystemClock();

  const createCharacterService =
    new CreateCharacterService(characterRepository);

  const listCharactersService =
    new ListCharactersService(characterRepository);

  const getCharacterSnapshotService =
    new GetCharacterSnapshotService(
      characterRepository,
      calculateCharacterStatsService,
      clock
    );

  const archiveCharacterService =
    new ArchiveCharacterService(characterRepository);

  const characterHandler = createCharacterHttpHandler({
    authenticationProvider,
    createCharacterService,
    listCharactersService,
    getCharacterSnapshotService,
    archiveCharacterService,
  });

  return createServer((request, response) => {
    void characterHandler(request, response);
  });
}



============================================================
SOURCE: src/modules/characters/domain/character.types.ts
============================================================

import { CHARACTER_STATUS } from "./character.constants.js";

export type CharacterStatus =
  (typeof CHARACTER_STATUS)[keyof typeof CHARACTER_STATUS];

export type CharacterId = string;
export type AccountId = string;
export type SeasonId = string;

export type CharacterName = {
  display: string;
  normalized: string;
};

export type CharacterResources = {
  currentHealth: number;
  maximumHealth: number;

  currentMana: number;
  maximumMana: number;

  currentEnergy: number;
  maximumEnergy: number;

  resourcesUpdatedAt: Date;
};

export type ResourceRegenerationRates = {
  healthPerMinute: number;
  manaPerMinute: number;
  energyPerMinute: number;
};

export type CharacterBaseStatistics = {
  attack: number;
  defense: number;
  spellPower: number;
};

export type CharacterProgression = {
  level: number;
  experience: bigint;
  gold: bigint;

  craftingLevel: number;
  craftingExperience: bigint;

  gatheringLevel: number;
  gatheringExperience: bigint;
};

export type CharacterUnlocks = {
  spellSlots: number;
  craftingSlots: number;
  inventorySlots: number;
  promoted: boolean;
};

export type CharacterSummary = {
  characterId: CharacterId;
  accountId: AccountId;
  seasonId: SeasonId | null;

  name: string;
  status: CharacterStatus;

  level: number;
  experience: bigint;

  createdAt: Date;
  updatedAt: Date;
};

export type CharacterSnapshot = {
  characterId: CharacterId;
  accountId: AccountId;
  seasonId: SeasonId | null;

  name: string;
  status: CharacterStatus;

  progression: CharacterProgression;
  resources: CharacterResources;
  baseStatistics: CharacterBaseStatistics;
  unlocks: CharacterUnlocks;

  createdAt: Date;
  updatedAt: Date;
};

export type ResourceRegenerationResult = {
  resources: CharacterResources;

  elapsedWholeMinutes: number;

  restoredHealth: number;
  restoredMana: number;
  restoredEnergy: number;

  needsPersistence: boolean;
};


============================================================
SOURCE: src/modules/characters/domain/character.errors.ts
============================================================

import { ApplicationError } from "../../../application/errors/application-error.js";

export const CHARACTER_ERROR_CODE = {
  invalidName: "CHARACTER_NAME_INVALID",
  nameTaken: "CHARACTER_NAME_TAKEN",
  limitReached: "CHARACTER_LIMIT_REACHED",
  notFound: "CHARACTER_NOT_FOUND",
  accessDenied: "CHARACTER_ACCESS_DENIED",
  alreadyArchived: "CHARACTER_ALREADY_ARCHIVED",
  invalidResourceState: "CHARACTER_RESOURCE_STATE_INVALID",
  inventoryItemNotFound: "INVENTORY_ITEM_NOT_FOUND",
  equipmentLevelRequired: "EQUIPMENT_LEVEL_REQUIRED",
  equipmentAlreadyEquipped: "EQUIPMENT_ALREADY_EQUIPPED",
  equipmentNotEquipped: "EQUIPMENT_NOT_EQUIPPED",
} as const;

export type CharacterErrorCode =
  (typeof CHARACTER_ERROR_CODE)[keyof typeof CHARACTER_ERROR_CODE];

export class CharacterNameInvalidError extends ApplicationError {
  public constructor(reason: string) {
    super({
      code: CHARACTER_ERROR_CODE.invalidName,
      message: "Character name is invalid.",
      statusCode: 400,
      details: {
        reason,
      },
    });

    this.name = "CharacterNameInvalidError";
  }
}

export class CharacterNameTakenError extends ApplicationError {
  public constructor() {
    super({
      code: CHARACTER_ERROR_CODE.nameTaken,
      message: "Character name is already taken.",
      statusCode: 409,
    });

    this.name = "CharacterNameTakenError";
  }
}

export class CharacterLimitReachedError extends ApplicationError {
  public constructor(maximumActiveCharacters: number) {
    super({
      code: CHARACTER_ERROR_CODE.limitReached,
      message: "Active character limit has been reached.",
      statusCode: 409,
      details: {
        maximumActiveCharacters,
      },
    });

    this.name = "CharacterLimitReachedError";
  }
}

export class CharacterNotFoundError extends ApplicationError {
  public constructor() {
    super({
      code: CHARACTER_ERROR_CODE.notFound,
      message: "Character was not found.",
      statusCode: 404,
    });

    this.name = "CharacterNotFoundError";
  }
}

export class CharacterAccessDeniedError extends ApplicationError {
  public constructor() {
    super({
      code: CHARACTER_ERROR_CODE.accessDenied,
      message: "Character access was denied.",
      statusCode: 403,
    });

    this.name = "CharacterAccessDeniedError";
  }
}

export class CharacterAlreadyArchivedError extends ApplicationError {
  public constructor() {
    super({
      code: CHARACTER_ERROR_CODE.alreadyArchived,
      message: "Character is already archived.",
      statusCode: 409,
    });

    this.name = "CharacterAlreadyArchivedError";
  }
}

export class CharacterResourceStateInvalidError extends ApplicationError {
  public constructor(reason: string) {
    super({
      code: CHARACTER_ERROR_CODE.invalidResourceState,
      message: "Character resource state is invalid.",
      statusCode: 500,
      details: {
        reason,
      },
    });

    this.name = "CharacterResourceStateInvalidError";
  }
}
export class InventoryItemNotFoundError extends ApplicationError {
  public constructor() {
    super({
      code: CHARACTER_ERROR_CODE.inventoryItemNotFound,
      message: "Inventory item was not found.",
      statusCode: 404,
    });

    this.name = "InventoryItemNotFoundError";
  }
}

export class EquipmentLevelRequiredError extends ApplicationError {
  public constructor(
    requiredLevel: number,
    characterLevel: number
  ) {
    super({
      code: CHARACTER_ERROR_CODE.equipmentLevelRequired,
      message: "Character level is too low to equip this item.",
      statusCode: 409,
      details: {
        requiredLevel,
        characterLevel,
      },
    });

    this.name = "EquipmentLevelRequiredError";
  }
}

export class EquipmentAlreadyEquippedError extends ApplicationError {
  public constructor() {
    super({
      code: CHARACTER_ERROR_CODE.equipmentAlreadyEquipped,
      message: "Inventory item is already equipped.",
      statusCode: 409,
    });

    this.name = "EquipmentAlreadyEquippedError";
  }
}

export class EquipmentNotEquippedError extends ApplicationError {
  public constructor() {
    super({
      code: CHARACTER_ERROR_CODE.equipmentNotEquipped,
      message: "Inventory item is not equipped.",
      statusCode: 409,
    });

    this.name = "EquipmentNotEquippedError";
  }
}



============================================================
SOURCE: src/modules/characters/application/character.repository.ts
============================================================

import type {
  AccountId,
  CharacterId,
  CharacterResources,
  CharacterSnapshot,
  CharacterSummary,
  SeasonId,
} from "../domain/character.types.js";

export type CreateCharacterGraphInput = {
  accountId: AccountId;
  seasonId: SeasonId | null;
  name: string;
  spellLoadoutName: string;
  equipmentLoadoutName: string;
};

export type FindCharacterSnapshotInput = {
  accountId: AccountId;
  characterId: CharacterId;
};

export type ArchiveCharacterInput = {
  accountId: AccountId;
  characterId: CharacterId;
};

export type UpdateCharacterResourcesInput = {
  accountId: AccountId;
  characterId: CharacterId;
  resources: CharacterResources;
};

export interface CharacterRepository {
  createCharacterGraph(
    input: CreateCharacterGraphInput
  ): Promise<CharacterSnapshot>;

  listByAccount(
    accountId: AccountId
  ): Promise<readonly CharacterSummary[]>;

  findSnapshotById(
    input: FindCharacterSnapshotInput
  ): Promise<CharacterSnapshot | null>;

  archive(
    input: ArchiveCharacterInput
  ): Promise<CharacterSummary | null>;

  updateResources(
    input: UpdateCharacterResourcesInput
  ): Promise<boolean>;
}


============================================================
SOURCE: src/modules/characters/infrastructure/postgres-character.repository.ts
============================================================

import type {
  Pool,
  PoolClient,
  QueryResult,
  QueryResultRow,
} from "pg";

import type {
  ArchiveCharacterInput,
  CharacterRepository,
  CreateCharacterGraphInput,
  FindCharacterSnapshotInput,
  UpdateCharacterResourcesInput,
} from "../application/character.repository.js";
import {
  CHARACTER_LIMITS,
  CHARACTER_STATUS,
} from "../domain/character.constants.js";
import {
  CharacterAccessDeniedError,
  CharacterLimitReachedError,
  CharacterNameTakenError,
} from "../domain/character.errors.js";
import type {
  AccountId,
  CharacterSnapshot,
  CharacterSummary,
} from "../domain/character.types.js";
import { withTransaction } from "../../../infrastructure/database/transaction.js";
import {
  mapCharacterSnapshotRow,
  mapCharacterSummaryRow,
  type PostgreSqlCharacterSnapshotRow,
  type PostgreSqlCharacterSummaryRow,
} from "./postgres-character.mapper.js";

type PostgreSqlError = {
  code?: string;
  constraint?: string;
};

type Queryable = {
  query<Row extends QueryResultRow>(
    queryText: string,
    values?: unknown[]
  ): Promise<QueryResult<Row>>;
};

type CharacterIdRow = {
  character_id: string;
};

type CountRow = {
  active_character_count: string;
};

const SUMMARY_COLUMNS = `
  character_id,
  account_id,
  season_id,
  name,
  status,
  level,
  experience,
  created_at,
  updated_at
`;

const SNAPSHOT_QUERY = `
  SELECT
    c.character_id,
    c.account_id,
    c.season_id,
    c.name,
    c.status,

    c.level,
    c.experience,
    c.gold,

    c.current_health,
    c.max_health,

    c.current_mana,
    c.max_mana,

    c.current_energy,
    c.max_energy,

    c.crafting_level,
    c.crafting_xp,

    c.gathering_level,
    c.gathering_xp,

    c.resources_updated_at,

    u.is_promoted,
    u.spell_slots_unlocked,
    u.crafting_slots_unlocked,
    u.inventory_slots,

    m.current_spell_power,

    c.created_at,
    c.updated_at
  FROM characters AS c
  INNER JOIN character_unlocks AS u
    ON u.character_id = c.character_id
  INNER JOIN character_spell_mastery AS m
    ON m.character_id = c.character_id
  WHERE c.account_id = $1
    AND c.character_id = $2
`;

function isPostgreSqlError(error: unknown): error is PostgreSqlError {
  return typeof error === "object" && error !== null;
}

function isCharacterNameUniquenessError(error: unknown): boolean {
  if (!isPostgreSqlError(error) || error.code !== "23505") {
    return false;
  }

  return (
    error.constraint === "ux_characters_name" ||
    error.constraint === "ux_characters_normalized_name"
  );
}

async function findSnapshot(
  queryable: Queryable,
  accountId: string,
  characterId: string
): Promise<CharacterSnapshot | null> {
  const result =
    await queryable.query<PostgreSqlCharacterSnapshotRow>(
      SNAPSHOT_QUERY,
      [accountId, characterId]
    );

  const row = result.rows[0];

  return row ? mapCharacterSnapshotRow(row) : null;
}

export class PostgresCharacterRepository
  implements CharacterRepository
{
  public constructor(private readonly pool: Pool) {}

  public async createCharacterGraph(
    input: CreateCharacterGraphInput
  ): Promise<CharacterSnapshot> {
    try {
      return await withTransaction(
        this.pool,
        async (client: PoolClient) => {
          await this.lockAccount(client, input.accountId);

          const activeCharacterCount =
            await this.countActiveCharacters(
              client,
              input.accountId
            );

          if (
            activeCharacterCount >=
            CHARACTER_LIMITS.maximumActiveCharactersPerAccount
          ) {
            throw new CharacterLimitReachedError(
              CHARACTER_LIMITS.maximumActiveCharactersPerAccount
            );
          }

          const characterResult =
            await client.query<CharacterIdRow>(
              `
                INSERT INTO characters (
                  account_id,
                  season_id,
                  name
                )
                VALUES ($1, $2, $3)
                RETURNING character_id
              `,
              [
                input.accountId,
                input.seasonId,
                input.name,
              ]
            );

          const characterRow = characterResult.rows[0];

          if (!characterRow) {
            throw new Error(
              "Character insert did not return character_id."
            );
          }

          const characterId = characterRow.character_id;

          await client.query(
            `
              INSERT INTO character_statistics (
                character_id
              )
              VALUES ($1)
            `,
            [characterId]
          );

          await client.query(
            `
              INSERT INTO character_unlocks (
                character_id
              )
              VALUES ($1)
            `,
            [characterId]
          );

          await client.query(
            `
              INSERT INTO character_spell_mastery (
                character_id
              )
              VALUES ($1)
            `,
            [characterId]
          );

          await client.query(
            `
              INSERT INTO character_loadouts (
                character_id,
                name,
                is_default
              )
              VALUES ($1, $2, TRUE)
            `,
            [
              characterId,
              input.spellLoadoutName,
            ]
          );

          await client.query(
            `
              INSERT INTO equipment_loadouts (
                character_id,
                name,
                is_default
              )
              VALUES ($1, $2, TRUE)
            `,
            [
              characterId,
              input.equipmentLoadoutName,
            ]
          );

          const snapshot = await findSnapshot(
            client,
            input.accountId,
            characterId
          );

          if (!snapshot) {
            throw new Error(
              "Created character snapshot could not be loaded."
            );
          }

          return snapshot;
        }
      );
    } catch (error: unknown) {
      if (isCharacterNameUniquenessError(error)) {
        throw new CharacterNameTakenError();
      }

      throw error;
    }
  }

  public async listByAccount(
    accountId: AccountId
  ): Promise<readonly CharacterSummary[]> {
    const result =
      await this.pool.query<PostgreSqlCharacterSummaryRow>(
        `
          SELECT
            ${SUMMARY_COLUMNS}
          FROM characters
          WHERE account_id = $1
          ORDER BY
            CASE
              WHEN status = $2 THEN 0
              ELSE 1
            END,
            created_at ASC,
            character_id ASC
        `,
        [
          accountId,
          CHARACTER_STATUS.active,
        ]
      );

    return result.rows.map(mapCharacterSummaryRow);
  }

  public async findSnapshotById(
    input: FindCharacterSnapshotInput
  ): Promise<CharacterSnapshot | null> {
    return findSnapshot(
      this.pool,
      input.accountId,
      input.characterId
    );
  }

  public async archive(
    input: ArchiveCharacterInput
  ): Promise<CharacterSummary | null> {
    const result =
      await this.pool.query<PostgreSqlCharacterSummaryRow>(
        `
          UPDATE characters
          SET
            status = $3,
            updated_at = now()
          WHERE account_id = $1
            AND character_id = $2
            AND status = $4
          RETURNING
            ${SUMMARY_COLUMNS}
        `,
        [
          input.accountId,
          input.characterId,
          CHARACTER_STATUS.archived,
          CHARACTER_STATUS.active,
        ]
      );

    const row = result.rows[0];

    return row ? mapCharacterSummaryRow(row) : null;
  }

  public async updateResources(
    input: UpdateCharacterResourcesInput
  ): Promise<boolean> {
    const result = await this.pool.query(
      `
        UPDATE characters
        SET
          current_health = $3,
          max_health = $4,
          current_mana = $5,
          max_mana = $6,
          current_energy = $7,
          max_energy = $8,
          resources_updated_at = $9,
          updated_at = now()
        WHERE account_id = $1
          AND character_id = $2
      `,
      [
        input.accountId,
        input.characterId,
        input.resources.currentHealth,
        input.resources.maximumHealth,
        input.resources.currentMana,
        input.resources.maximumMana,
        input.resources.currentEnergy,
        input.resources.maximumEnergy,
        input.resources.resourcesUpdatedAt,
      ]
    );

    return result.rowCount === 1;
  }

  private async lockAccount(
    client: PoolClient,
    accountId: AccountId
  ): Promise<void> {
    const result = await client.query(
      `
        SELECT account_id
        FROM accounts
        WHERE account_id = $1
          AND status = 'Active'
        FOR UPDATE
      `,
      [accountId]
    );

    if (result.rowCount !== 1) {
      throw new CharacterAccessDeniedError();
    }
  }

  private async countActiveCharacters(
    client: PoolClient,
    accountId: AccountId
  ): Promise<number> {
    const result = await client.query<CountRow>(
      `
        SELECT COUNT(*)::text AS active_character_count
        FROM characters
        WHERE account_id = $1
          AND status = $2
      `,
      [
        accountId,
        CHARACTER_STATUS.active,
      ]
    );

    const row = result.rows[0];

    if (!row) {
      throw new Error(
        "Active character count query returned no row."
      );
    }

    const count = Number(row.active_character_count);

    if (!Number.isSafeInteger(count) || count < 0) {
      throw new Error(
        "Active character count is invalid."
      );
    }

    return count;
  }
}


============================================================
SOURCE: src/modules/characters/http/character-http.handler.ts
============================================================

import type {
  IncomingMessage,
  ServerResponse,
} from "node:http";

import type {
  ArchiveCharacterService,
} from "../application/archive-character.service.js";
import type {
  CreateCharacterService,
} from "../application/create-character.service.js";
import type {
  GetCharacterSnapshotService,
} from "../application/get-character-snapshot.service.js";
import type {
  ListCharactersService,
} from "../application/list-characters.service.js";
import {
  requireAuthentication,
  type AuthenticationProvider,
} from "../../../http/http-auth.js";
import {
  mapErrorToHttpResponse,
} from "../../../http/http-error.js";
import {
  readJsonBody,
  sendJson,
} from "../../../http/http-json.js";
import {
  InvalidHttpRequestError,
  parseCharacterId,
  parseCreateCharacterHttpRequest,
} from "./character-http.request.js";

export type CharacterHttpHandlerDependencies = {
  authenticationProvider: AuthenticationProvider;
  createCharacterService: CreateCharacterService;
  listCharactersService: ListCharactersService;
  getCharacterSnapshotService:
    GetCharacterSnapshotService;
  archiveCharacterService: ArchiveCharacterService;
};

function getPathname(request: IncomingMessage): string {
  const requestUrl = new URL(
    request.url ?? "/",
    "http://localhost"
  );

  return requestUrl.pathname;
}

function getCharacterRouteId(
  pathname: string,
  suffix = ""
): string | null {
  const escapedSuffix = suffix.replace(
    /[.*+?^${}()|[\]\\]/gu,
    "\\$&"
  );

  const pattern = new RegExp(
    `^/characters/([^/]+)${escapedSuffix}$`,
    "u"
  );

  const match = pattern.exec(pathname);

  if (!match) {
    return null;
  }

  try {
    return parseCharacterId(
      decodeURIComponent(match[1] ?? "")
    );
  } catch (error: unknown) {
    if (error instanceof InvalidHttpRequestError) {
      throw error;
    }

    throw new InvalidHttpRequestError(
      "characterId contains invalid encoding."
    );
  }
}

export function createCharacterHttpHandler(
  dependencies: CharacterHttpHandlerDependencies
): (
  request: IncomingMessage,
  response: ServerResponse
) => Promise<void> {
  return async (
    request: IncomingMessage,
    response: ServerResponse
  ): Promise<void> => {
    try {
      const pathname = getPathname(request);
      const method = request.method ?? "GET";

      if (
        method === "POST" &&
        pathname === "/characters"
      ) {
        const authentication =
          await requireAuthentication(
            request,
            dependencies.authenticationProvider
          );

        const body = await readJsonBody(request);

        const parsedRequest =
          parseCreateCharacterHttpRequest(body);

        const character =
          await dependencies.createCharacterService.execute({
            accountId: authentication.accountId,
            seasonId: parsedRequest.seasonId,
            name: parsedRequest.name,
          });

        sendJson(response, 201, {
          data: character,
        });

        return;
      }

      if (
        method === "GET" &&
        pathname === "/characters"
      ) {
        const authentication =
          await requireAuthentication(
            request,
            dependencies.authenticationProvider
          );

        const characters =
          await dependencies.listCharactersService.execute({
            accountId: authentication.accountId,
          });

        sendJson(response, 200, {
          data: characters,
        });

        return;
      }

      const snapshotCharacterId =
        getCharacterRouteId(pathname);

      if (
        method === "GET" &&
        snapshotCharacterId !== null
      ) {
        const authentication =
          await requireAuthentication(
            request,
            dependencies.authenticationProvider
          );

        const character =
          await dependencies.getCharacterSnapshotService.execute({
            accountId: authentication.accountId,
            characterId: snapshotCharacterId,
          });

        sendJson(response, 200, {
          data: character,
        });

        return;
      }

      const archiveCharacterId =
        getCharacterRouteId(pathname, "/archive");

      if (
        method === "POST" &&
        archiveCharacterId !== null
      ) {
        const authentication =
          await requireAuthentication(
            request,
            dependencies.authenticationProvider
          );

        const character =
          await dependencies.archiveCharacterService.execute({
            accountId: authentication.accountId,
            characterId: archiveCharacterId,
          });

        sendJson(response, 200, {
          data: character,
        });

        return;
      }

      sendJson(response, 404, {
        error: {
          code: "ROUTE_NOT_FOUND",
          message: "Route was not found.",
        },
      });
    } catch (error: unknown) {
      const mappedError = mapErrorToHttpResponse(error);

      sendJson(
        response,
        mappedError.statusCode,
        mappedError.body
      );
    }
  };
}


============================================================
SOURCE: tests/helpers/test-account.ts
============================================================

import { randomUUID } from "node:crypto";

import type { Pool, PoolClient } from "pg";

export type TestAccount = {
  accountId: string;
  username: string;
};

type AccountRow = {
  account_id: string;
  username: string;
};

type Queryable = Pick<Pool, "query"> | PoolClient;

export async function createTestAccount(
  queryable: Queryable
): Promise<TestAccount> {
  const suffix = randomUUID().replaceAll("-", "");
  const username = `test_${suffix}`.slice(0, 32);

  const result = await queryable.query<AccountRow>(
    `
      INSERT INTO accounts (
        username,
        password_hash
      )
      VALUES ($1, $2)
      RETURNING
        account_id,
        username
    `,
    [
      username,
      "integration-test-password-hash",
    ]
  );

  const account = result.rows[0];

  if (!account) {
    throw new Error(
      "Test account insert did not return an account."
    );
  }

  return {
    accountId: account.account_id,
    username: account.username,
  };
}

export async function deleteTestAccount(
  queryable: Queryable,
  accountId: string
): Promise<void> {
  await queryable.query(
    `
      DELETE FROM characters
      WHERE account_id = $1
    `,
    [accountId]
  );

  await queryable.query(
    `
      DELETE FROM accounts
      WHERE account_id = $1
    `,
    [accountId]
  );
}


============================================================
SOURCE: tests/unit/http/character-http.handler.test.ts
============================================================

import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type { AuthenticationProvider } from "../../../src/http/http-auth.js";
import type { ArchiveCharacterService } from "../../../src/modules/characters/application/archive-character.service.js";
import type { CreateCharacterService } from "../../../src/modules/characters/application/create-character.service.js";
import type { GetCharacterSnapshotService } from "../../../src/modules/characters/application/get-character-snapshot.service.js";
import type { ListCharactersService } from "../../../src/modules/characters/application/list-characters.service.js";
import {
  createCharacterHttpHandler,
  type CharacterHttpHandlerDependencies,
} from "../../../src/modules/characters/http/character-http.handler.js";
import type {
  CharacterSnapshot,
  CharacterSummary,
} from "../../../src/modules/characters/domain/character.types.js";

const openedServers: ReturnType<typeof createServer>[] = [];

function createSummary(): CharacterSummary {
  const now = new Date("2026-10-06T12:00:00.000Z");

  return {
    characterId: "character-1",
    accountId: "account-1",
    seasonId: null,
    name: "HTTP Hero",
    status: "IsActive",
    level: 1,
    experience: 0n,
    createdAt: now,
    updatedAt: now,
  };
}

function createSnapshot(): CharacterSnapshot {
  const now = new Date("2026-10-06T12:00:00.000Z");

  return {
    characterId: "character-1",
    accountId: "account-1",
    seasonId: null,
    name: "HTTP Hero",
    status: "IsActive",

    progression: {
      level: 1,
      experience: 0n,
      gold: 0n,
      craftingLevel: 1,
      craftingExperience: 0n,
      gatheringLevel: 1,
      gatheringExperience: 0n,
    },

    resources: {
      currentHealth: 180,
      maximumHealth: 180,
      currentMana: 35,
      maximumMana: 35,
      currentEnergy: 100,
      maximumEnergy: 100,
      resourcesUpdatedAt: now,
    },

    baseStatistics: {
      attack: 7,
      defense: 7,
      spellPower: 100,
    },

    unlocks: {
      promoted: false,
      spellSlots: 1,
      craftingSlots: 1,
      inventorySlots: 50,
    },

    createdAt: now,
    updatedAt: now,
  };
}

function createDependencies(): {
  dependencies: CharacterHttpHandlerDependencies;
  authenticationProvider: AuthenticationProvider;
  createCharacterExecute: ReturnType<typeof vi.fn>;
  listCharactersExecute: ReturnType<typeof vi.fn>;
  getSnapshotExecute: ReturnType<typeof vi.fn>;
  archiveCharacterExecute: ReturnType<typeof vi.fn>;
} {
  const authenticationProvider: AuthenticationProvider = {
    authenticate: vi.fn().mockResolvedValue({
      accountId: "account-1",
    }),
  };

  const createCharacterExecute = vi.fn().mockResolvedValue(
    createSnapshot()
  );

  const listCharactersExecute = vi.fn().mockResolvedValue([
    createSummary(),
  ]);

  const getSnapshotExecute = vi.fn().mockResolvedValue(
    createSnapshot()
  );

  const archiveCharacterExecute = vi.fn().mockResolvedValue({
    ...createSummary(),
    status: "Archived",
  });

  return {
    authenticationProvider,
    createCharacterExecute,
    listCharactersExecute,
    getSnapshotExecute,
    archiveCharacterExecute,

    dependencies: {
      authenticationProvider,

      createCharacterService: {
        execute: createCharacterExecute,
      } as unknown as CreateCharacterService,

      listCharactersService: {
        execute: listCharactersExecute,
      } as unknown as ListCharactersService,

      getCharacterSnapshotService: {
        execute: getSnapshotExecute,
      } as unknown as GetCharacterSnapshotService,

      archiveCharacterService: {
        execute: archiveCharacterExecute,
      } as unknown as ArchiveCharacterService,
    },
  };
}

async function requestHandler(
  dependencies: CharacterHttpHandlerDependencies,
  path: string,
  init?: RequestInit
): Promise<Response> {
  const handler = createCharacterHttpHandler(dependencies);

  const server = createServer((request, response) => {
    void handler(request, response);
  });

  openedServers.push(server);

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);

    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });

  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("Test HTTP server has no TCP address.");
  }

  const port = (address as AddressInfo).port;

  return fetch(
    `http://127.0.0.1:${port}${path}`,
    init
  );
}

afterEach(async () => {
  vi.restoreAllMocks();

  while (openedServers.length > 0) {
    const server = openedServers.pop();

    if (server?.listening) {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    }
  }
});

describe("character HTTP handler", () => {
  it("creates a character", async () => {
    const setup = createDependencies();

    const response = await requestHandler(
      setup.dependencies,
      "/characters",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: "HTTP Hero",
          seasonId: null,
        }),
      }
    );

    expect(response.status).toBe(201);

    expect(await response.json()).toMatchObject({
      data: {
        characterId: "character-1",
        name: "HTTP Hero",
        progression: {
          experience: "0",
        },
      },
    });

    expect(
      setup.createCharacterExecute
    ).toHaveBeenCalledWith({
      accountId: "account-1",
      name: "HTTP Hero",
      seasonId: null,
    });
  });

  it("lists characters", async () => {
    const setup = createDependencies();

    const response = await requestHandler(
      setup.dependencies,
      "/characters"
    );

    expect(response.status).toBe(200);

    expect(await response.json()).toEqual({
      data: [
        expect.objectContaining({
          characterId: "character-1",
          experience: "0",
        }),
      ],
    });

    expect(
      setup.listCharactersExecute
    ).toHaveBeenCalledWith({
      accountId: "account-1",
    });
  });

  it("returns a character snapshot", async () => {
    const setup = createDependencies();

    const response = await requestHandler(
      setup.dependencies,
      "/characters/character-1"
    );

    expect(response.status).toBe(200);

    expect(await response.json()).toMatchObject({
      data: {
        characterId: "character-1",
        name: "HTTP Hero",
      },
    });

    expect(
      setup.getSnapshotExecute
    ).toHaveBeenCalledWith({
      accountId: "account-1",
      characterId: "character-1",
    });
  });

  it("archives a character", async () => {
    const setup = createDependencies();

    const response = await requestHandler(
      setup.dependencies,
      "/characters/character-1/archive",
      {
        method: "POST",
      }
    );

    expect(response.status).toBe(200);

    expect(await response.json()).toMatchObject({
      data: {
        characterId: "character-1",
        status: "Archived",
      },
    });

    expect(
      setup.archiveCharacterExecute
    ).toHaveBeenCalledWith({
      accountId: "account-1",
      characterId: "character-1",
    });
  });

  it("returns status 401 when authentication is missing", async () => {
    const setup = createDependencies();

    vi.mocked(
      setup.authenticationProvider.authenticate
    ).mockResolvedValue(null);

    const response = await requestHandler(
      setup.dependencies,
      "/characters"
    );

    expect(response.status).toBe(401);

    expect(await response.json()).toEqual({
      error: {
        code: "AUTHENTICATION_REQUIRED",
        message: "Authentication is required.",
      },
    });
  });

  it("returns status 400 for malformed JSON", async () => {
    const setup = createDependencies();

    const response = await requestHandler(
      setup.dependencies,
      "/characters",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: '{"name":',
      }
    );

    expect(response.status).toBe(400);

    expect(await response.json()).toMatchObject({
      error: {
        code: "INVALID_JSON_BODY",
      },
    });

    expect(
      setup.createCharacterExecute
    ).not.toHaveBeenCalled();
  });

  it("returns status 404 for an unknown route", async () => {
    const setup = createDependencies();

    const response = await requestHandler(
      setup.dependencies,
      "/unknown"
    );

    expect(response.status).toBe(404);

    expect(await response.json()).toEqual({
      error: {
        code: "ROUTE_NOT_FOUND",
        message: "Route was not found.",
      },
    });
  });
});


============================================================
SOURCE: tests/integration/characters/postgres-character.repository.test.ts
============================================================

import { Pool } from "pg";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import { env } from "../../../src/config/env.js";
import { PostgresCharacterRepository } from "../../../src/modules/characters/infrastructure/postgres-character.repository.js";
import {
  createTestAccount,
  deleteTestAccount,
  type TestAccount,
} from "../../helpers/test-account.js";

const testPool = new Pool({
  host: env.database.host,
  port: env.database.port,
  database: env.database.name,
  user: env.database.user,
  password: env.database.password,
  max: 2,
  idleTimeoutMillis: 5_000,
  connectionTimeoutMillis: 5_000,
});

const repository = new PostgresCharacterRepository(testPool);

const createdAccountIds: string[] = [];

async function createTrackedTestAccount(): Promise<TestAccount> {
  const account = await createTestAccount(testPool);

  createdAccountIds.push(account.accountId);

  return account;
}

describe("PostgresCharacterRepository", () => {
  beforeAll(async () => {
    await testPool.query("SELECT 1");
  });

  afterEach(async () => {
    while (createdAccountIds.length > 0) {
      const accountId = createdAccountIds.pop();

      if (accountId) {
        await deleteTestAccount(testPool, accountId);
      }
    }
  });

  afterAll(async () => {
    await testPool.end();
  });
  it("creates a complete character graph", async () => {
    const account = await createTrackedTestAccount();

    const snapshot = await repository.createCharacterGraph({
      accountId: account.accountId,
      seasonId: null,
      name: "Integration Hero",
      spellLoadoutName: "Default Spells",
      equipmentLoadoutName: "Default Equipment",
    });

    expect(snapshot.accountId).toBe(account.accountId);
    expect(snapshot.name).toBe("Integration Hero");
    expect(snapshot.status).toBe("IsActive");

    expect(snapshot.progression).toEqual({
      level: 1,
      experience: 0n,
      gold: 0n,
      craftingLevel: 1,
      craftingExperience: 0n,
      gatheringLevel: 1,
      gatheringExperience: 0n,
    });

    expect(snapshot.resources).toMatchObject({
      currentHealth: 180,
      maximumHealth: 180,
      currentMana: 35,
      maximumMana: 35,
      currentEnergy: 100,
      maximumEnergy: 100,
    });

    expect(snapshot.unlocks).toEqual({
      promoted: false,
      spellSlots: 1,
      craftingSlots: 1,
      inventorySlots: 50,
    });

    expect(snapshot.baseStatistics).toEqual({
      attack: 7,
      defense: 7,
      spellPower: 100,
    });

    const graphCounts = await testPool.query<{
      statistics_count: string;
      unlocks_count: string;
      mastery_count: string;
      spell_loadouts_count: string;
      equipment_loadouts_count: string;
    }>(
      `
        SELECT
          (
            SELECT COUNT(*)::text
            FROM character_statistics
            WHERE character_id = $1
          ) AS statistics_count,
          (
            SELECT COUNT(*)::text
            FROM character_unlocks
            WHERE character_id = $1
          ) AS unlocks_count,
          (
            SELECT COUNT(*)::text
            FROM character_spell_mastery
            WHERE character_id = $1
          ) AS mastery_count,
          (
            SELECT COUNT(*)::text
            FROM character_loadouts
            WHERE character_id = $1
              AND is_default = TRUE
          ) AS spell_loadouts_count,
          (
            SELECT COUNT(*)::text
            FROM equipment_loadouts
            WHERE character_id = $1
              AND is_default = TRUE
          ) AS equipment_loadouts_count
      `,
      [snapshot.characterId]
    );

    expect(graphCounts.rows[0]).toEqual({
      statistics_count: "1",
      unlocks_count: "1",
      mastery_count: "1",
      spell_loadouts_count: "1",
      equipment_loadouts_count: "1",
    });
  });
  it("lists, loads, updates and archives a character", async () => {
    const account = await createTrackedTestAccount();

    const created = await repository.createCharacterGraph({
      accountId: account.accountId,
      seasonId: null,
      name: "Repository Hero",
      spellLoadoutName: "Default Spells",
      equipmentLoadoutName: "Default Equipment",
    });

    const listed = await repository.listByAccount(
      account.accountId
    );

    expect(listed).toHaveLength(1);
    expect(listed[0]?.characterId).toBe(
      created.characterId
    );

    const loaded = await repository.findSnapshotById({
      accountId: account.accountId,
      characterId: created.characterId,
    });

    expect(loaded?.characterId).toBe(
      created.characterId
    );

    const resourcesUpdatedAt = new Date(
      "2026-10-06T12:00:00.000Z"
    );

    const updated = await repository.updateResources({
      accountId: account.accountId,
      characterId: created.characterId,
      resources: {
        currentHealth: 120,
        maximumHealth: 180,
        currentMana: 25,
        maximumMana: 35,
        currentEnergy: 80,
        maximumEnergy: 100,
        resourcesUpdatedAt,
      },
    });

    expect(updated).toBe(true);

    const afterUpdate = await repository.findSnapshotById({
      accountId: account.accountId,
      characterId: created.characterId,
    });

    expect(afterUpdate?.resources).toEqual({
      currentHealth: 120,
      maximumHealth: 180,
      currentMana: 25,
      maximumMana: 35,
      currentEnergy: 80,
      maximumEnergy: 100,
      resourcesUpdatedAt,
    });

    const archived = await repository.archive({
      accountId: account.accountId,
      characterId: created.characterId,
    });

    expect(archived?.status).toBe("Archived");

    const afterArchive = await repository.findSnapshotById({
      accountId: account.accountId,
      characterId: created.characterId,
    });

    expect(afterArchive?.status).toBe("Archived");
  });

  it("rejects a fourth active character", async () => {
    const account = await createTrackedTestAccount();

    for (const name of [
      "Limit Hero One",
      "Limit Hero Two",
      "Limit Hero Three",
    ]) {
      await repository.createCharacterGraph({
        accountId: account.accountId,
        seasonId: null,
        name,
        spellLoadoutName: "Default Spells",
        equipmentLoadoutName: "Default Equipment",
      });
    }

    await expect(
      repository.createCharacterGraph({
        accountId: account.accountId,
        seasonId: null,
        name: "Limit Hero Four",
        spellLoadoutName: "Default Spells",
        equipmentLoadoutName: "Default Equipment",
      })
    ).rejects.toMatchObject({
      code: "CHARACTER_LIMIT_REACHED",
    });

    const characters = await repository.listByAccount(
      account.accountId
    );

    expect(characters).toHaveLength(3);
  });

  it("rejects a duplicate normalized character name", async () => {
    const firstAccount = await createTrackedTestAccount();
    const secondAccount = await createTrackedTestAccount();

    await repository.createCharacterGraph({
      accountId: firstAccount.accountId,
      seasonId: null,
      name: "Normalized Hero",
      spellLoadoutName: "Default Spells",
      equipmentLoadoutName: "Default Equipment",
    });

    await expect(
      repository.createCharacterGraph({
        accountId: secondAccount.accountId,
        seasonId: null,
        name: "  normalized hero  ",
        spellLoadoutName: "Default Spells",
        equipmentLoadoutName: "Default Equipment",
      })
    ).rejects.toMatchObject({
      code: "CHARACTER_NAME_TAKEN",
    });

    const secondAccountCharacters =
      await repository.listByAccount(
        secondAccount.accountId
      );

    expect(secondAccountCharacters).toHaveLength(0);
  });

  it("prevents access through another account", async () => {
    const owner = await createTrackedTestAccount();
    const stranger = await createTrackedTestAccount();

    const character = await repository.createCharacterGraph({
      accountId: owner.accountId,
      seasonId: null,
      name: "Private Hero",
      spellLoadoutName: "Default Spells",
      equipmentLoadoutName: "Default Equipment",
    });

    const foreignSnapshot =
      await repository.findSnapshotById({
        accountId: stranger.accountId,
        characterId: character.characterId,
      });

    expect(foreignSnapshot).toBeNull();

    const foreignArchive = await repository.archive({
      accountId: stranger.accountId,
      characterId: character.characterId,
    });

    expect(foreignArchive).toBeNull();

    const foreignUpdate =
      await repository.updateResources({
        accountId: stranger.accountId,
        characterId: character.characterId,
        resources: {
          currentHealth: 1,
          maximumHealth: 180,
          currentMana: 1,
          maximumMana: 35,
          currentEnergy: 1,
          maximumEnergy: 100,
          resourcesUpdatedAt: new Date(
            "2026-10-06T12:00:00.000Z"
          ),
        },
      });

    expect(foreignUpdate).toBe(false);

    const ownerSnapshot =
      await repository.findSnapshotById({
        accountId: owner.accountId,
        characterId: character.characterId,
      });

    expect(ownerSnapshot?.status).toBe("IsActive");
    expect(ownerSnapshot?.resources.currentHealth).toBe(180);
    expect(ownerSnapshot?.resources.currentMana).toBe(35);
    expect(ownerSnapshot?.resources.currentEnergy).toBe(100);
  });

  it("rolls back the entire graph when a dependent insert fails", async () => {
    const account = await createTrackedTestAccount();

    const maximumLengthResult = await testPool.query<{
      character_maximum_length: number | null;
    }>(
      `
        SELECT character_maximum_length
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'character_loadouts'
          AND column_name = 'name'
      `
    );

    const maximumLength =
      maximumLengthResult.rows[0]?.character_maximum_length;

    if (
      maximumLength === null ||
      maximumLength === undefined
    ) {
      throw new Error(
        "character_loadouts.name must have a maximum length for this rollback test."
      );
    }

    const invalidLoadoutName = "X".repeat(
      maximumLength + 1
    );

    await expect(
      repository.createCharacterGraph({
        accountId: account.accountId,
        seasonId: null,
        name: "Rollback Hero",
        spellLoadoutName: invalidLoadoutName,
        equipmentLoadoutName: "Default Equipment",
      })
    ).rejects.toBeDefined();

    const graphCounts = await testPool.query<{
      characters_count: string;
      statistics_count: string;
      unlocks_count: string;
      mastery_count: string;
      spell_loadouts_count: string;
      equipment_loadouts_count: string;
    }>(
      `
        SELECT
          (
            SELECT COUNT(*)::text
            FROM characters
            WHERE account_id = $1
          ) AS characters_count,
          (
            SELECT COUNT(*)::text
            FROM character_statistics AS s
            INNER JOIN characters AS c
              ON c.character_id = s.character_id
            WHERE c.account_id = $1
          ) AS statistics_count,
          (
            SELECT COUNT(*)::text
            FROM character_unlocks AS u
            INNER JOIN characters AS c
              ON c.character_id = u.character_id
            WHERE c.account_id = $1
          ) AS unlocks_count,
          (
            SELECT COUNT(*)::text
            FROM character_spell_mastery AS m
            INNER JOIN characters AS c
              ON c.character_id = m.character_id
            WHERE c.account_id = $1
          ) AS mastery_count,
          (
            SELECT COUNT(*)::text
            FROM character_loadouts AS l
            INNER JOIN characters AS c
              ON c.character_id = l.character_id
            WHERE c.account_id = $1
          ) AS spell_loadouts_count,
          (
            SELECT COUNT(*)::text
            FROM equipment_loadouts AS e
            INNER JOIN characters AS c
              ON c.character_id = e.character_id
            WHERE c.account_id = $1
          ) AS equipment_loadouts_count
      `,
      [account.accountId]
    );

    expect(graphCounts.rows[0]).toEqual({
      characters_count: "0",
      statistics_count: "0",
      unlocks_count: "0",
      mastery_count: "0",
      spell_loadouts_count: "0",
      equipment_loadouts_count: "0",
    });
  });

  it("frees an active-character slot after archiving", async () => {
    const account = await createTrackedTestAccount();

    const first = await repository.createCharacterGraph({
      accountId: account.accountId,
      seasonId: null,
      name: "Archive Slot One",
      spellLoadoutName: "Default Spells",
      equipmentLoadoutName: "Default Equipment",
    });

    await repository.createCharacterGraph({
      accountId: account.accountId,
      seasonId: null,
      name: "Archive Slot Two",
      spellLoadoutName: "Default Spells",
      equipmentLoadoutName: "Default Equipment",
    });

    await repository.createCharacterGraph({
      accountId: account.accountId,
      seasonId: null,
      name: "Archive Slot Three",
      spellLoadoutName: "Default Spells",
      equipmentLoadoutName: "Default Equipment",
    });

    const archived = await repository.archive({
      accountId: account.accountId,
      characterId: first.characterId,
    });

    expect(archived?.status).toBe("Archived");

    const replacement =
      await repository.createCharacterGraph({
        accountId: account.accountId,
        seasonId: null,
        name: "Archive Slot Four",
        spellLoadoutName: "Default Spells",
        equipmentLoadoutName: "Default Equipment",
      });

    expect(replacement.status).toBe("IsActive");

    const characters = await repository.listByAccount(
      account.accountId
    );

    const activeCharacters = characters.filter(
      (character) => character.status === "IsActive"
    );

    const archivedCharacters = characters.filter(
      (character) => character.status === "Archived"
    );

    expect(activeCharacters).toHaveLength(3);
    expect(archivedCharacters).toHaveLength(1);
  });
});

