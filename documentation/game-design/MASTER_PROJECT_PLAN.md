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
- Unauthorized accounts cannot access another account’s character.
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
→ Resolve Player Action
→ Resolve Active Effects
→ Check Monster Death
→ Monster Action
→ Resolve Monster Action
→ Resolve Active Effects
→ Check Player Death
→ Advance Turn

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