

====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\accounts\accounts.md
====================================================

ENTITY: Accounts

PRIMARY KEY
-----------
AccountId

FOREIGN KEYS
------------
None

REFERENCED BY
-------------
Characters.AccountId
AccountAchievements.AccountId
AchievementProgress.AccountId
AccountHolyGrail.AccountId
AccountFriends.AccountId
FriendRequests.SenderAccountId
FriendRequests.RecipientAccountId
AccountOutfits.AccountId
AccountAddons.AccountId
PrivateMessages.SenderAccountId
PrivateMessages.RecipientAccountId
AdminActions.AccountId
Punishments.AccountId

UNIQUE CONSTRAINTS
------------------
Username
Email (nullable, unique when present)

CARDINALITY
-----------
Accounts
├─ Characters (1:N)
├─ AchievementProgress (1:N)
├─ AccountAchievements (1:N)
├─ AccountHolyGrail (1:N)
├─ AccountFriends (1:N)
├─ FriendRequests (1:N)
├─ AccountOutfits (1:N)
├─ AccountAddons (1:N)
├─ PrivateMessages (1:N)
├─ AdminActions (1:N)
└─ Punishments (1:N)

RECOMMENDED MINIMUM COLUMNS
---------------------------
AccountId (PK)
Username
Email
PasswordHash
CreatedAt
LastLoginAt
Status
IsBanned


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\achievements\achievement-progress.md
====================================================

ENTITY: AchievementProgress

PRIMARY KEY
-----------
AchievementProgressId

FOREIGN KEYS
------------
AccountId → Accounts.AccountId

AchievementId
    → Achievements.AchievementId

CARDINALITY
-----------
Accounts
└── AchievementProgress (1:N)

Achievements
└── AchievementProgress (1:N)

UNIQUE CONSTRAINTS
------------------
(AccountId, AchievementId)

PURPOSE
-------
Tracks achievement progression
for an account.

CORE COLUMNS
------------
AchievementProgressId

AccountId
AchievementId

CurrentValue

IsCompleted

CompletedAt

CreatedAt
UpdatedAt

INDEXES
-------
PK_AchievementProgressId

UX_AchievementProgress_Account_Achievement

IX_AchievementProgress_AccountId
IX_AchievementProgress_AchievementId
IX_AchievementProgress_IsCompleted

BUSINESS RULES
--------------
- Progress is account-wide
- Progress never resets
- Completion is permanent
- Hidden achievements become visible after completion


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\achievements\achievements.md
====================================================

ENTITY: Achievements

PRIMARY KEY
-----------
AchievementId

FOREIGN KEYS
------------
None

REFERENCED BY
-------------
AchievementProgress.AchievementId

CARDINALITY
-----------
Achievements
└── AchievementProgress (1:N)

UNIQUE CONSTRAINTS
------------------
Code
Name

PURPOSE
-------
Stores achievement definitions.

Examples:
- Kill 100 Monsters
- Reach Level 20
- Defeat 100 Daily Bosses
- Complete Vampire Set

CORE COLUMNS
------------
AchievementId

Code

Name
Description

Category
(
  Combat,
  Boss,
  DailyBoss,
  Level,
  Gold,
  Crafting,
  Gathering,
  Death,
  Hardcore,
  Unique,
  Set,
  HolyGrail
)

Points

ObjectiveType

RequiredValue

IsHidden

RewardAttack
RewardDefense
RewardGoldPercent
RewardExperiencePercent

CreatedAt
UpdatedAt

INDEXES
-------
PK_AchievementId

UX_Achievements_Code
UX_Achievements_Name

IX_Achievements_Category

BUSINESS RULES
--------------
- Achievements are account-wide
- Achievements never reset
- Achievements are auto-claimed
- Achievement Score = sum of earned points


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\admin\admin-actions.md
====================================================

ENTITY: AdminActions

PRIMARY KEY
-----------
AdminActionId

FOREIGN KEYS
------------
AccountId
    → Accounts.AccountId
    (nullable)

CARDINALITY
-----------
Accounts
└── AdminActions (1:N)

PURPOSE
-------
Audit log of administrative actions.

Examples:
- Give Gold
- Give Item
- Ban Account
- Mute Account
- Reset Progress
- Send Mail

CORE COLUMNS
------------
AdminActionId

AdminUser

ActionType

AccountId

TargetEntityType
TargetEntityId

Reason

ActionData

CreatedAt

INDEXES
-------
PK_AdminActionId

IX_AdminActions_AccountId
IX_AdminActions_ActionType
IX_AdminActions_CreatedAt

BUSINESS RULES
--------------
- Never deleted
- Immutable audit log
- Used for moderation review


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\admin\announcements.md
====================================================

ENTITY: Announcements

PRIMARY KEY
-----------
AnnouncementId

FOREIGN KEYS
------------
None

PURPOSE
-------
Stores global game announcements.

Examples:
- Maintenance
- New Season
- Patch Notes
- Event Notice

CORE COLUMNS
------------
AnnouncementId

Title

Content

Priority
(
  Low,
  Normal,
  High,
  Critical
)

IsActive

PublishedAt

ExpiresAt

CreatedAt
UpdatedAt

INDEXES
-------
PK_AnnouncementId

IX_Announcements_IsActive
IX_Announcements_PublishedAt
IX_Announcements_ExpiresAt


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\admin\punishments.md
====================================================

ENTITY: Punishments

PRIMARY KEY
-----------
PunishmentId

FOREIGN KEYS
------------
AccountId
    → Accounts.AccountId

CARDINALITY
-----------
Accounts
└── Punishments (1:N)

PURPOSE
-------
Stores account penalties.

Examples:
- Warning
- Mute
- Temporary Ban
- Permanent Ban

CORE COLUMNS
------------
PunishmentId

AccountId

PunishmentType
(
  Warning,
  Mute,
  TemporaryBan,
  PermanentBan
)

Reason

IssuedBy

IssuedAt

ExpiresAt

IsActive

RemovedAt

CreatedAt

INDEXES
-------
PK_PunishmentId

IX_Punishments_AccountId
IX_Punishments_PunishmentType
IX_Punishments_IsActive
IX_Punishments_ExpiresAt

BUSINESS RULES
--------------
- History is preserved permanently
- Expired punishments remain for audit
- Permanent bans have no expiration date


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\bestiary\bestiary-entries.md
====================================================

ENTITY: BestiaryEntries

PRIMARY KEY
-----------
BestiaryEntryId

FOREIGN KEYS
------------
CharacterId
    → Characters.CharacterId

MonsterId
    → Monsters.MonsterId

CARDINALITY
-----------
Characters
└── BestiaryEntries (1:N)

Monsters
└── BestiaryEntries (1:N)

UNIQUE CONSTRAINTS
------------------
(CharacterId, MonsterId)

PURPOSE
-------
Tracks which monsters have been discovered
by a character.

BUSINESS RULES
--------------
- First kill unlocks the entry
- Unlock is permanent
- Bestiary is character-specific
- One entry per monster per character

CORE COLUMNS
------------
BestiaryEntryId

CharacterId
MonsterId

UnlockedAt

CreatedAt

INDEXES
-------
PK_BestiaryEntryId

UX_BestiaryEntries_Character_Monster

IX_BestiaryEntries_CharacterId
IX_BestiaryEntries_MonsterId


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\bestiary\bestiary-statistics.md
====================================================

ENTITY: BestiaryStatistics

PRIMARY KEY
-----------
BestiaryStatisticsId

FOREIGN KEYS
------------
CharacterId
    → Characters.CharacterId

MonsterId
    → Monsters.MonsterId

CARDINALITY
-----------
Characters
└── BestiaryStatistics (1:N)

Monsters
└── BestiaryStatistics (1:N)

UNIQUE CONSTRAINTS
------------------
(CharacterId, MonsterId)

PURPOSE
-------
Stores detailed monster tracking data
for the Bestiary.

BUSINESS RULES
--------------
- Statistics are character-specific
- Statistics never reset
- Updated after each monster kill

CORE COLUMNS
------------
BestiaryStatisticsId

CharacterId
MonsterId

KillCount

FirstKillAt
LastKillAt

TaskProgress

TaskUnlocked

CreatedAt
UpdatedAt

INDEXES
-------
PK_BestiaryStatisticsId

UX_BestiaryStatistics_Character_Monster

IX_BestiaryStatistics_CharacterId
IX_BestiaryStatistics_MonsterId
IX_BestiaryStatistics_KillCount


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\bosses\bosses.md
====================================================



====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\bosses\character-daily-boss-progress.md
====================================================

ENTITY: CharacterDailyBossProgress

PRIMARY KEY
-----------
CharacterDailyBossProgressId

FOREIGN KEYS
------------
CharacterId
    → Characters.CharacterId

DailyBossDefinitionId
    → DailyBossDefinitions.DailyBossDefinitionId

UNIQUE CONSTRAINTS
------------------
(CharacterId, DailyBossDefinitionId)

CARDINALITY
-----------
Characters
└── CharacterDailyBossProgress (1:N)

DailyBossDefinitions
└── CharacterDailyBossProgress (1:N)

PURPOSE
-------
Tracks daily boss participation and
lifetime statistics.

CORE COLUMNS
------------
CharacterDailyBossProgressId

CharacterId
DailyBossDefinitionId

AttemptsUsedToday

TotalAttempts

TotalVictories

LastAttemptAt

LastVictoryAt

HighestTierDefeated

CreatedAt
UpdatedAt

INDEXES
-------
PK_CharacterDailyBossProgressId

UX_CharacterDailyBossProgress

IX_CharacterDailyBossProgress_CharacterId
IX_CharacterDailyBossProgress_DailyBossDefinitionId


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\bosses\daily-boss-definitions.md
====================================================

ENTITY: DailyBossDefinitions

PRIMARY KEY
-----------
DailyBossDefinitionId

FOREIGN KEYS
------------
BossId → Bosses.BossId

UNIQUE CONSTRAINTS
------------------
BossId

CARDINALITY
-----------
Bosses
└── DailyBossDefinitions (1:1)

DailyBossDefinitions
├── DailyBossPools (1:N)
└── CharacterDailyBossProgress (1:N)

PURPOSE
-------
Stores daily boss specific metadata.

CORE COLUMNS
------------
DailyBossDefinitionId

BossId

Tier
(1,2,3)

RecommendedLevel

AttemptsPerDay

CreatedAt
UpdatedAt

INDEXES
-------
PK_DailyBossDefinitionId

UX_DailyBossDefinitions_BossId

IX_DailyBossDefinitions_Tier


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\bosses\daily-boss-pools.md
====================================================

ENTITY: DailyBossPools

PRIMARY KEY
-----------
DailyBossPoolId

FOREIGN KEYS
------------
DailyBossDefinitionId
    → DailyBossDefinitions.DailyBossDefinitionId

CARDINALITY
-----------
DailyBossDefinitions
└── DailyBossPools (1:N)

PURPOSE
-------
Stores which bosses belong to each
daily boss tier pool.

CORE COLUMNS
------------
DailyBossPoolId

Tier

DailyBossDefinitionId

IsActive

CreatedAt

INDEXES
-------
PK_DailyBossPoolId

IX_DailyBossPools_Tier
IX_DailyBossPools_DailyBossDefinitionId


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\bosses\daily-boss-rotation.md
====================================================

ENTITY: DailyBossRotation

PRIMARY KEY
-----------
DailyBossRotationId

FOREIGN KEYS
------------
Tier1BossId
    → DailyBossDefinitions.DailyBossDefinitionId

Tier2BossId
    → DailyBossDefinitions.DailyBossDefinitionId

Tier3BossId
    → DailyBossDefinitions.DailyBossDefinitionId

CARDINALITY
-----------
DailyBossRotation
└── Current Daily Selection

PURPOSE
-------
Stores the currently active
global daily boss rotation.

CORE COLUMNS
------------
DailyBossRotationId

Tier1BossId
Tier2BossId
Tier3BossId

ResetTimestamp

CreatedAt

INDEXES
-------
PK_DailyBossRotationId

IX_DailyBossRotation_ResetTimestamp


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\bosses\monster-tasks.md
====================================================

ENTITY: MonsterTasks

PRIMARY KEY
-----------
MonsterTaskId

FOREIGN KEYS
------------
MonsterId → Monsters.MonsterId
BossId → Bosses.BossId

UNIQUE CONSTRAINTS
------------------
MonsterId

CARDINALITY
-----------
Monsters
└── MonsterTasks (1:N)

Bosses
└── MonsterTasks (1:N)

PURPOSE
-------
Stores task boss unlocking requirements.

CORE COLUMNS
------------
MonsterTaskId

MonsterId
BossId

RequiredKills

ReunlockGoldCost

CreatedAt
UpdatedAt

INDEXES
-------
PK_MonsterTaskId

UX_MonsterTasks_MonsterId

IX_MonsterTasks_BossId


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\buffs\character-buffs.md
====================================================

ENTITY: CharacterBuffs

PRIMARY KEY
-----------
CharacterBuffId

FOREIGN KEYS
------------
CharacterId
    → Characters.CharacterId

ConsumableDefinitionId
    → ConsumableDefinitions.ConsumableDefinitionId
    (nullable)

SpellId
    → Spells.SpellId
    (nullable)

CARDINALITY
-----------
Characters
└── CharacterBuffs (1:N)

ConsumableDefinitions
└── CharacterBuffs (1:N)

Spells
└── CharacterBuffs (1:N)

PURPOSE
-------
Stores all active buffs and debuffs.

Examples:
- Gold Boost
- Experience Boost
- Attack Buff
- Defense Buff
- Spell Power Buff
- Damage Over Time
- Heal Over Time
- Mana Drain
- Potion Disable

BUSINESS RULES
--------------
A buff may originate from:
- Consumable
- Spell
- System Effect

Exactly one source should exist.

Effects of the same type do not stack.
Instead they refresh duration.

CORE COLUMNS
------------
CharacterBuffId

CharacterId

BuffType
(
  GoldBoost,
  ExperienceBoost,
  AttackBuff,
  DefenseBuff,
  SpellPowerBuff,
  DamageOverTime,
  HealOverTime,
  ManaDrain,
  HealthDrain,
  PotionDisable
)

BuffSourceType
(
  Consumable,
  Spell,
  System
)

ConsumableDefinitionId
SpellId

Value

DurationType
(
  Turns,
  Fights,
  Permanent
)

DurationRemaining

IsPositive

AppliedAt

ExpiresAt

CreatedAt
UpdatedAt

INDEXES
-------
PK_CharacterBuffId

IX_CharacterBuffs_CharacterId

IX_CharacterBuffs_BuffType

IX_CharacterBuffs_ExpiresAt

IX_CharacterBuffs_IsPositive


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\characters\character-loadouts.md
====================================================

ENTITY: CharacterLoadouts

PRIMARY KEY
-----------
CharacterLoadoutId

FOREIGN KEYS
------------
CharacterId → Characters.CharacterId

CARDINALITY
-----------
Characters
└── CharacterLoadouts (1:N)

PURPOSE
-------
Stores saved combat loadouts.

CORE COLUMNS
------------
CharacterLoadoutId
CharacterId

Name

Spell1Id
Spell2Id
Spell3Id

IsDefault

CreatedAt
UpdatedAt

BUSINESS RULES
--------------
Maximum 3 loadouts per character.

Same spell cannot occupy multiple slots
within a loadout.

INDEXES
-------
PK_CharacterLoadoutId

IX_CharacterLoadouts_CharacterId


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\characters\character-monster-kills.md
====================================================

ENTITY: CharacterMonsterKills

PRIMARY KEY
-----------
CharacterMonsterKillId

FOREIGN KEYS
------------
CharacterId → Characters.CharacterId
MonsterId → Monsters.MonsterId

UNIQUE CONSTRAINTS
------------------
(CharacterId, MonsterId)

CARDINALITY
-----------
Characters
└── CharacterMonsterKills (1:N)

Monsters
└── CharacterMonsterKills (1:N)

PURPOSE
-------
Stores lifetime kill counts per monster.

CORE COLUMNS
------------
CharacterMonsterKillId

CharacterId
MonsterId

KillCount

FirstKillAt
LastKillAt

INDEXES
-------
PK_CharacterMonsterKillId

UX_CharacterMonsterKills_CharacterId_MonsterId

IX_CharacterMonsterKills_CharacterId
IX_CharacterMonsterKills_MonsterId


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\characters\characters.md
====================================================

ENTITY: Characters

PRIMARY KEY
-----------
CharacterId

FOREIGN KEYS
------------
AccountId         → Accounts.AccountId
SeasonId          → Seasons.SeasonId

REFERENCED BY
-------------
CharacterStatistics.CharacterId
CharacterMonsterKills.CharacterId
CharacterUnlocks.CharacterId
CharacterLoadouts.CharacterId
CharacterSpellMastery.CharacterId

CharacterSpells.CharacterId
InventoryItems.CharacterId
MaterialStorage.CharacterId
ConsumableStorage.CharacterId
EquipmentLoadouts.CharacterId

CharacterBuffs.CharacterId

CombatLogs.CharacterId

CraftingQueue.CharacterId
CraftingHistory.CharacterId

GatheringSessions.CharacterId

AuctionListings.CharacterId

MailMessages.CharacterId

BestiaryEntries.CharacterId
BestiaryStatistics.CharacterId

CharacterDailyBossProgress.CharacterId

HourlyChestProgress.CharacterId
DailyChestProgress.CharacterId
LoginStreakProgress.CharacterId

SeasonRankings.CharacterId
HallOfFame.CharacterId

UNIQUE CONSTRAINTS
------------------
Name

OPTIONAL UNIQUE CONSTRAINTS
---------------------------
(AccountId, CharacterSlot)
  if you store slot numbers 1-3

CARDINALITY
-----------
Accounts
└── Characters (1:N)

Seasons
└── Characters (1:N)

Characters
├── CharacterStatistics (1:1)
├── CharacterUnlocks (1:1)
├── CharacterSpellMastery (1:1)
├── HourlyChestProgress (1:1)
├── DailyChestProgress (1:1)
├── LoginStreakProgress (1:1)
├── CharacterSpells (1:N)
├── CharacterMonsterKills (1:N)
├── CharacterLoadouts (1:N)
├── InventoryItems (1:N)
├── MaterialStorage (1:N)
├── ConsumableStorage (1:N)
├── EquipmentLoadouts (1:N)
├── CharacterBuffs (1:N)
├── CombatLogs (1:N)
├── CraftingQueue (1:N)
├── CraftingHistory (1:N)
├── GatheringSessions (1:N)
├── AuctionListings (1:N)
├── MailMessages (1:N)
├── BestiaryEntries (1:N)
├── BestiaryStatistics (1:N)
└── CharacterDailyBossProgress (1:N)

RECOMMENDED CORE COLUMNS
------------------------
CharacterId
AccountId
SeasonId

Name

Level
Experience
Gold

CurrentHealth
CurrentMana
CurrentEnergy

MaxHealth
MaxMana
MaxEnergy

CraftingLevel
CraftingXP

GatheringLevel
GatheringXP

PromotionUnlocked

CreatedAt
LastActiveAt

Status
(IsActive / Archived)

INDEXES
-------
PK_CharacterId

IX_Characters_AccountId
IX_Characters_SeasonId
IX_Characters_Level
IX_Characters_Experience

UX_Characters_Name


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\characters\character-spell-mastery.md
====================================================

ENTITY: CharacterSpellMastery

PRIMARY KEY
-----------
CharacterSpellMasteryId

FOREIGN KEYS
------------
CharacterId → Characters.CharacterId

UNIQUE CONSTRAINTS
------------------
CharacterId

CARDINALITY
-----------
Characters
└── CharacterSpellMastery (1:1)

PURPOSE
-------
Stores global spell mastery progression for a character.

CORE COLUMNS
------------
CharacterSpellMasteryId
CharacterId

MasteryLevel
MasteryExperience

CurrentSpellPowerPercent

CreatedAt
UpdatedAt

INDEXES
-------
PK_CharacterSpellMasteryId

UX_CharacterSpellMastery_CharacterId
`


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\characters\character-spells.md
====================================================

ENTITY: CharacterSpells

PRIMARY KEY
-----------
CharacterSpellId

FOREIGN KEYS
------------
CharacterId → Characters.CharacterId
SpellId → Spells.SpellId

UNIQUE CONSTRAINTS
------------------
(CharacterId, SpellId)

CARDINALITY
-----------
Characters
└── CharacterSpells (1:N)

Spells
└── CharacterSpells (1:N)

PURPOSE
-------
Stores permanently unlocked spells.

CORE COLUMNS
------------
CharacterSpellId
CharacterId
SpellId

UnlockedAt

INDEXES
-------
PK_CharacterSpellId

UX_CharacterSpells_CharacterId_SpellId

IX_CharacterSpells_CharacterId
IX_CharacterSpells_SpellId


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\characters\character-statistics.md
====================================================

ENTITY: CharacterStatistics

PRIMARY KEY
-----------
CharacterStatisticsId

FOREIGN KEYS
------------
CharacterId → Characters.CharacterId

UNIQUE CONSTRAINTS
------------------
CharacterId

CARDINALITY
-----------
Characters
└── CharacterStatistics (1:1)

PURPOSE
-------
Stores lifetime statistics.

CORE COLUMNS
------------
TotalPlaytimeSeconds

TotalGoldEarned
TotalGoldSpent
HighestGoldOwned

TotalMonstersKilled
TotalBossesKilled
TotalDailyBossesKilled

TotalDeaths

TotalDamageDealt
TotalDamageTaken
TotalHealingDone
TotalManaSpent

HighestPhysicalHit
HighestSpellHit

StrongestMonsterKilledId
StrongestBossKilledId

LongestNoDeathStreak

CreatedAt
UpdatedAt


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\characters\character-unlocks.md
====================================================

ENTITY: CharacterUnlocks

PRIMARY KEY
-----------
CharacterUnlocksId

FOREIGN KEYS
------------
CharacterId → Characters.CharacterId

UNIQUE CONSTRAINTS
------------------
CharacterId

CARDINALITY
-----------
Characters
└── CharacterUnlocks (1:1)

PURPOSE
-------
Stores permanent character unlocks.

CORE COLUMNS
------------
IsPromoted

SpellSlotsUnlocked

CraftingSlotsUnlocked

InventoryExpansionUnlocked

CreatedAt
UpdatedAt


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\chests\daily-chest-progress.md
====================================================

ENTITY: DailyChestProgress

PRIMARY KEY
-----------
DailyChestProgressId

FOREIGN KEYS
------------
CharacterId
    → Characters.CharacterId

UNIQUE CONSTRAINTS
------------------
CharacterId

CARDINALITY
-----------
Characters
└── DailyChestProgress (1:1)

PURPOSE
-------
Tracks daily chest availability.

CORE COLUMNS
------------
DailyChestProgressId

CharacterId

NextAvailableAt

IsAvailable

LastClaimedAt

TotalClaims

CreatedAt
UpdatedAt

BUSINESS RULES
--------------
- Maximum one daily chest available
- Daily chest does not stack
- Timer duration: 24 hours

INDEXES
-------
PK_DailyChestProgressId

UX_DailyChestProgress_CharacterId

IX_DailyChestProgress_NextAvailableAt
IX_DailyChestProgress_IsAvailable


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\chests\hourly-chest-progress.md
====================================================

ENTITY: HourlyChestProgress

PRIMARY KEY
-----------
HourlyChestProgressId

FOREIGN KEYS
------------
CharacterId
    → Characters.CharacterId

UNIQUE CONSTRAINTS
------------------
CharacterId

CARDINALITY
-----------
Characters
└── HourlyChestProgress (1:1)

PURPOSE
-------
Tracks hourly chest availability.

CORE COLUMNS
------------
HourlyChestProgressId

CharacterId

NextAvailableAt

IsAvailable

LastClaimedAt

TotalClaims

CreatedAt
UpdatedAt

BUSINESS RULES
--------------
- Maximum one hourly chest available
- Claim starts next timer
- Timer duration: 60 minutes

INDEXES
-------
PK_HourlyChestProgressId

UX_HourlyChestProgress_CharacterId

IX_HourlyChestProgress_NextAvailableAt
IX_HourlyChestProgress_IsAvailable


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\chests\login-streak-progress.md
====================================================

ENTITY: LoginStreakProgress

PRIMARY KEY
-----------
LoginStreakProgressId

FOREIGN KEYS
------------
CharacterId
    → Characters.CharacterId

UNIQUE CONSTRAINTS
------------------
CharacterId

CARDINALITY
-----------
Characters
└── LoginStreakProgress (1:1)

PURPOSE
-------
Tracks login streak progression.

CORE COLUMNS
------------
LoginStreakProgressId

CharacterId

CurrentStreak

HighestStreak

LastLoginDate

LastRewardDay

CompletedCycles

CreatedAt
UpdatedAt

BUSINESS RULES
--------------
- Missing a day resets streak
- Maximum streak length: 7
- Day 7 reward resets streak back to Day 1
- Rewards can only be claimed once per streak day

INDEXES
-------
PK_LoginStreakProgressId

UX_LoginStreakProgress_CharacterId

IX_LoginStreakProgress_CurrentStreak
IX_LoginStreakProgress_LastLoginDate


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\consumables\consumable-definitions.md
====================================================

ENTITY: ConsumableDefinitions

PRIMARY KEY
-----------
ConsumableDefinitionId

FOREIGN KEYS
------------
None

REFERENCED BY
-------------
ConsumableStorage.ConsumableDefinitionId
Recipes.ConsumableDefinitionId
OtherLootTables.ConsumableDefinitionId

CARDINALITY
-----------
ConsumableDefinitions
├── ConsumableStorage (1:N)
├── Recipes (1:N)
└── OtherLootTables (1:N)

UNIQUE CONSTRAINTS
------------------
Name

PURPOSE
-------
Stores all consumable definitions.

Examples:
- Health Potions
- Mana Potions
- Energy Potions
- Gold Boosts
- Experience Boosts
- Blessings
- Protection Stones

CORE COLUMNS
------------
ConsumableDefinitionId

Name
Description
Artwork

Category
(
  HealthPotion,
  ManaPotion,
  EnergyPotion,
  GoldBoost,
  ExperienceBoost,
  Blessing,
  ProtectionStone
)

Tier
(
  Small,
  Medium,
  Large,
  Grand,
  Ultimate,
  None
)

EffectType
(
  RestoreHealth,
  RestoreMana,
  RestoreEnergy,
  GoldBonus,
  ExperienceBonus,
  Blessing,
  UpgradeProtection
)

EffectValue

DurationType
(
  Instant,
  Fights,
  Passive
)

DurationValue

PotionCooldownTurns

MaxStackSize

IsTradable

CreatedAt
UpdatedAt

INDEXES
-------
PK_ConsumableDefinitionId

UX_ConsumableDefinitions_Name

IX_ConsumableDefinitions_Category
IX_ConsumableDefinitions_EffectType

BUSINESS RULES
--------------
- Maximum stack size: 999
- All consumables are tradable
- Blessings are manually activated
- Protection Stones are consumed on upgrade attempt
- Gold/Experience boosts do not stack with same category
- Boosts are fight-based, not time-based
- Energy Potions cannot exceed max energy
- Health/Mana Potions cannot overheal/overrestore


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\crafting\crafting-history.md
====================================================

ENTITY: CraftingHistory

PRIMARY KEY
-----------
CraftingHistoryId

FOREIGN KEYS
------------
CharacterId → Characters.CharacterId
RecipeId → Recipes.RecipeId

CARDINALITY
-----------
Characters
└── CraftingHistory (1:N)

Recipes
└── CraftingHistory (1:N)

PURPOSE
-------
Stores completed crafting records.

CORE COLUMNS
------------
CraftingHistoryId

CharacterId
RecipeId

QuantityCrafted

CraftingXpEarned

CompletedAt

CreatedAt

INDEXES
-------
PK_CraftingHistoryId

IX_CraftingHistory_CharacterId
IX_CraftingHistory_RecipeId
IX_CraftingHistory_CompletedAt


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\crafting\crafting-queue.md
====================================================

ENTITY: CraftingQueue

PRIMARY KEY
-----------
CraftingQueueId

FOREIGN KEYS
------------
CharacterId → Characters.CharacterId
RecipeId → Recipes.RecipeId

CARDINALITY
-----------
Characters
└── CraftingQueue (1:N)

Recipes
└── CraftingQueue (1:N)

PURPOSE
-------
Stores active and pending crafts.

CORE COLUMNS
------------
CraftingQueueId

CharacterId
RecipeId

Quantity

Status
(Pending, Active, Completed, Cancelled)

StartedAt
CompletesAt

CraftingSlot

CreatedAt

BUSINESS RULES
--------------
Maximum total queued crafting time:
24 hours

Maximum crafting slots:
3

INDEXES
-------
PK_CraftingQueueId

IX_CraftingQueue_CharacterId
IX_CraftingQueue_Status
IX_CraftingQueue_CompletesAt


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\crafting\recipe-materials.md
====================================================



====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\crafting\recipes.md
====================================================



====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\database-blueprint.md
====================================================

# ACCOUNT DOMAIN

Accounts
AccountAchievements
AccountAchievementProgress
AccountHolyGrail
AccountFriends
FriendRequests
AccountOutfits
AccountAddons

# CHARACTER DOMAIN

Characters
CharacterStatistics
CharacterMonsterKills
CharacterUnlocks
CharacterLoadouts
CharacterSpellLoadouts
CharacterCooldowns

# SPELL DOMAIN

Spells
CharacterSpells
CharacterSpellMastery

# ITEM DOMAIN

ItemBases
Items
AffixTemplates
ItemAffixes
UniqueTemplates
SetTemplates
SetBonuses

# INVENTORY DOMAIN

InventoryItems
MaterialStorage
ConsumableStorage
EquipmentLoadouts

# MONSTER DOMAIN

MonsterFamilies
Monsters
MonsterAbilities
MonsterAbilityWeights

# BOSS DOMAIN

Bosses
MonsterTasks

DailyBossDefinitions
DailyBossPools
DailyBossRotation
CharacterDailyBossProgress

# COMBAT DOMAIN

CombatLogs
CombatLogTurns
CombatEffects

# LOOT DOMAIN

LootTables
OtherLootTables
UniquePityTracking

# BESTIARY DOMAIN

BestiaryEntries
BestiaryStatistics

# MATERIAL DOMAIN

Materials

# RECIPE DOMAIN

Recipes
RecipeMaterials

# CRAFTING DOMAIN

CraftingQueue
CraftingJobs
CraftingHistory

# GATHERING DOMAIN

GatheringSessions
GatheringResults

# CONSUMABLE DOMAIN

ConsumableDefinitions

# BUFF DOMAIN

CharacterBuffs

# MARKETPLACE DOMAIN

AuctionListings
AuctionHistory

# MAIL DOMAIN

MailMessages
MailAttachments

# NPC DOMAIN

NpcDefinitions

# CHEST DOMAIN

HourlyChestProgress
DailyChestProgress
LoginStreakProgress

# ACHIEVEMENT DOMAIN

Achievements
AchievementProgress

# HOLY GRAIL DOMAIN

HolyGrailEntries
SetProgress

# SEASON DOMAIN

Seasons
SeasonRankings
HallOfFame

# SOCIAL DOMAIN

PrivateMessages

# OUTFIT DOMAIN

OutfitDefinitions
AddonDefinitions

# ADMIN DOMAIN

AdminActions
Announcements
Punishments


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\database-relationships.md
====================================================

ACCOUNTS
├── Characters (1:N)
├── AccountAchievements (1:N)
├── AccountHolyGrail (1:N)
├── AccountFriends (1:N)
├── FriendRequests (1:N)
├── AccountOutfits (1:N)
└── AccountAddons (1:N)

SEASONS
├── Characters (1:N)
├── SeasonRankings (1:N)
└── HallOfFame (1:N)

CHARACTERS
├── CharacterStatistics (1:1)
├── CharacterUnlocks (1:1)
├── CharacterSpellMastery (1:1)
├── CharacterSpells (1:N)
├── CharacterMonsterKills (1:N)
├── CharacterLoadouts (1:N)
├── EquipmentLoadouts (1:N)
├── InventoryItems (1:N)
├── MaterialStorage (1:N)
├── ConsumableStorage (1:N)
├── CharacterBuffs (1:N)
├── CombatLogs (1:N)
├── GatheringSessions (1:N)
├── CraftingQueue (1:N)
├── CraftingHistory (1:N)
├── AuctionListings (1:N)
├── MailMessages (1:N)
├── BestiaryEntries (1:N)
├── BestiaryStatistics (1:N)
├── CharacterDailyBossProgress (1:N)
├── AchievementProgress (1:N)
├── HolyGrailEntries (1:N)
├── SetProgress (1:N)
├── HourlyChestProgress (1:1)
├── DailyChestProgress (1:1)
└── LoginStreakProgress (1:1)

SPELLS
└── CharacterSpells (1:N)

ITEMBASES
├── Items (1:N)
└── LootTables (1:N)

ITEMS
├── InventoryItems (1:1)
├── ItemAffixes (1:N)
├── UniqueTemplates (N:1, optional)
└── SetTemplates (N:1, optional)

AFFIXTEMPLATES
└── ItemAffixes (1:N)

SETTEMPLATES
├── SetBonuses (1:N)
├── SetProgress (1:N)
└── HolyGrailEntries (1:N)

UNIQUETEMPLATES
└── HolyGrailEntries (1:N)

MONSTERFAMILIES
└── Monsters (1:N)

MONSTERS
├── MonsterAbilities (1:N)
├── LootTables (1:N)
├── OtherLootTables (1:N)
├── MonsterTasks (1:N)
├── BestiaryEntries (1:N)
├── BestiaryStatistics (1:N)
└── CharacterMonsterKills (1:N)

MONSTERABILITIES
└── MonsterAbilityWeights (1:N)

BOSSES
├── MonsterTasks (0:N)
├── DailyBossDefinitions (0:N)
└── LootTables (1:N)

DAILYBOSSDEFINITIONS
├── DailyBossPools (N:1)
└── CharacterDailyBossProgress (1:N)

DAILYBOSSROTATION
└── DailyBossPools (1:N)

LOOTTABLES
├── Monsters (N:1)
└── Bosses (N:1)

OTHERLOOTTABLES
└── Monsters (N:1)

RECIPES
├── RecipeMaterials (1:N)
├── CraftingQueue (1:N)
└── CraftingHistory (1:N)

MATERIALS
├── RecipeMaterials (1:N)
├── MaterialStorage (1:N)
└── GatheringResults (1:N)

CONSUMABLEDEFINITIONS
├── ConsumableStorage (1:N)
├── Recipes (1:N)
└── LootTables (1:N)

GATHERINGSESSIONS
└── GatheringResults (1:N)

COMBATLOGS
├── CombatLogTurns (1:N)
└── CombatEffects (1:N)

ACHIEVEMENTS
├── AchievementProgress (1:N)
└── AccountAchievements (1:N)

OUTFITDEFINITIONS
├── AccountOutfits (1:N)
└── AddonDefinitions (1:N)

ADDONDEFINITIONS
└── AccountAddons (1:N)

AUCTIONLISTINGS
└── AuctionHistory (1:N)

MAILMESSAGES
└── MailAttachments (1:N)

ANNOUNCEMENTS
└── Accounts (N:M, read tracking later if needed)


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\entity-inventory.md
====================================================

ACCOUNT DOMAIN

Accounts
AccountAchievements
AchievementProgress
AccountHolyGrail
AccountFriends
FriendRequests
AccountOutfits
AccountAddons

────────────────────────────────────

CHARACTER DOMAIN

Characters
CharacterStatistics
CharacterMonsterKills
CharacterUnlocks
CharacterLoadouts
CharacterSpellMastery

────────────────────────────────────

SPELL DOMAIN

Spells
CharacterSpells

────────────────────────────────────

ITEM DOMAIN

ItemBases
Items
AffixTemplates
ItemAffixes
UniqueTemplates
SetTemplates
SetBonuses

────────────────────────────────────

INVENTORY DOMAIN

InventoryItems
MaterialStorage
ConsumableStorage
EquipmentLoadouts

────────────────────────────────────

MONSTER DOMAIN

MonsterFamilies
Monsters
MonsterAbilities
MonsterAbilityWeights

────────────────────────────────────

BOSS DOMAIN

Bosses
MonsterTasks

DailyBossDefinitions
DailyBossPools
DailyBossRotation
CharacterDailyBossProgress

────────────────────────────────────

COMBAT DOMAIN

CombatLogs
CombatLogTurns
CombatEffects

────────────────────────────────────

LOOT DOMAIN

LootTables
OtherLootTables
UniquePityTracking

────────────────────────────────────

BESTIARY DOMAIN

BestiaryEntries
BestiaryStatistics

────────────────────────────────────

MATERIAL DOMAIN

Materials

────────────────────────────────────

RECIPE DOMAIN

Recipes
RecipeMaterials

────────────────────────────────────

CRAFTING DOMAIN

CraftingQueue
CraftingHistory

────────────────────────────────────

GATHERING DOMAIN

GatheringSessions
GatheringResults

────────────────────────────────────

CONSUMABLE DOMAIN

ConsumableDefinitions

────────────────────────────────────

BUFF DOMAIN

CharacterBuffs

────────────────────────────────────

MARKETPLACE DOMAIN

AuctionListings
AuctionHistory

────────────────────────────────────

MAIL DOMAIN

MailMessages
MailAttachments

────────────────────────────────────

CHEST DOMAIN

HourlyChestProgress
DailyChestProgress
LoginStreakProgress

────────────────────────────────────

ACHIEVEMENT DOMAIN

Achievements

────────────────────────────────────

HOLY GRAIL DOMAIN

HolyGrailEntries
SetProgress

────────────────────────────────────

SEASON DOMAIN

Seasons
SeasonRankings
HallOfFame

────────────────────────────────────

SOCIAL DOMAIN

PrivateMessages

────────────────────────────────────

OUTFIT DOMAIN

OutfitDefinitions
AddonDefinitions

────────────────────────────────────

ADMIN DOMAIN

AdminActions
Announcements
Punishments


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\gathering\gathering-results.md
====================================================

ENTITY: GatheringResults

PRIMARY KEY
-----------
GatheringResultId

FOREIGN KEYS
------------
GatheringSessionId
    → GatheringSessions.GatheringSessionId

MaterialId
    → Materials.MaterialId

CARDINALITY
-----------
GatheringSessions
└── GatheringResults (1:N)

Materials
└── GatheringResults (1:N)

PURPOSE
-------
Stores materials generated during a gathering session.

CORE COLUMNS
------------
GatheringResultId

GatheringSessionId

MaterialId

Quantity

SuccessfulRolls

CreatedAt

BUSINESS RULES
--------------
- One session may generate many materials
- Results are awarded when player collects rewards
- Results are stored separately from MaterialStorage

INDEXES
-------
PK_GatheringResultId

IX_GatheringResults_GatheringSessionId
IX_GatheringResults_MaterialId

UNIQUE CONSTRAINTS
------------------
(GatheringSessionId, MaterialId)


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\gathering\gathering-sessions.md
====================================================

ENTITY: GatheringSessions

PRIMARY KEY
-----------
GatheringSessionId

FOREIGN KEYS
------------
CharacterId → Characters.CharacterId

REFERENCED BY
-------------
GatheringResults.GatheringSessionId

CARDINALITY
-----------
Characters
└── GatheringSessions (1:N)

GatheringSessions
└── GatheringResults (1:N)

PURPOSE
-------
Stores gathering runs started by characters.

CORE COLUMNS
------------
GatheringSessionId

CharacterId

StartedAt
EndedAt

Status
(Active, Completed, Cancelled)

GatheringLevelAtStart

TotalMinutesGathered

ExperienceEarned

ResultsCollected

CreatedAt
UpdatedAt

BUSINESS RULES
--------------
- Only one active gathering session per character
- Maximum duration: 24 hours
- Logging in ends active gathering
- Offline-only activity

INDEXES
-------
PK_GatheringSessionId

IX_GatheringSessions_CharacterId
IX_GatheringSessions_Status
IX_GatheringSessions_StartedAt


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\holy-grail\holy-grail-entries.md
====================================================

ENTITY: HolyGrailEntries

PRIMARY KEY
-----------
HolyGrailEntryId

FOREIGN KEYS
------------
AccountId → Accounts.AccountId

UniqueTemplateId
    → UniqueTemplates.UniqueTemplateId
    (nullable)

SetTemplateId
    → SetTemplates.SetTemplateId
    (nullable)

CARDINALITY
-----------
Accounts
└── HolyGrailEntries (1:N)

UniqueTemplates
└── HolyGrailEntries (1:N)

SetTemplates
└── HolyGrailEntries (1:N)

UNIQUE CONSTRAINTS
------------------
(AccountId, UniqueTemplateId)

(AccountId, SetTemplateId)

PURPOSE
-------
Tracks discovered Uniques and Sets.

BUSINESS RULES
--------------
Exactly one of:

UniqueTemplateId
or
SetTemplateId

must be populated.

Discovery is permanent.

Progress remains after:
- selling
- trading
- salvaging
- deleting a character

CORE COLUMNS
------------
HolyGrailEntryId

AccountId

UniqueTemplateId
SetTemplateId

FoundByCharacterId

FoundSeasonId

FirstFoundAt

CreatedAt

INDEXES
-------
PK_HolyGrailEntryId

IX_HolyGrailEntries_AccountId

IX_HolyGrailEntries_UniqueTemplateId

IX_HolyGrailEntries_SetTemplateId


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\holy-grail\set-progress.md
====================================================

ENTITY: SetProgress

PRIMARY KEY
-----------
SetProgressId

FOREIGN KEYS
------------
AccountId
    → Accounts.AccountId

SetTemplateId
    → SetTemplates.SetTemplateId

CARDINALITY
-----------
Accounts
└── SetProgress (1:N)

SetTemplates
└── SetProgress (1:N)

UNIQUE CONSTRAINTS
------------------
(AccountId, SetTemplateId)

PURPOSE
-------
Tracks completion progress for
equipment sets.

Examples:

Rat Set
2 / 4

Vampire Set
3 / 5

Dragon Set
4 / 4

CORE COLUMNS
------------
SetProgressId

AccountId

SetTemplateId

PiecesDiscovered

TotalPiecesRequired

IsCompleted

CompletedAt

CreatedAt
UpdatedAt

BUSINESS RULES
--------------
Progress is account-wide.

Progress never resets.

Completion does not require
currently owning the items.

Only discovering them once.

INDEXES
-------
PK_SetProgressId

UX_SetProgress_Account_Set

IX_SetProgress_AccountId

IX_SetProgress_SetTemplateId

IX_SetProgress_IsCompleted


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\inventory\consumable-storage.md
====================================================

ENTITY: ConsumableStorage

PRIMARY KEY
-----------
ConsumableStorageId

FOREIGN KEYS
------------
CharacterId → Characters.CharacterId
ConsumableDefinitionId
    → ConsumableDefinitions.ConsumableDefinitionId

UNIQUE CONSTRAINTS
------------------
(CharacterId, ConsumableDefinitionId)

CARDINALITY
-----------
Characters
└── ConsumableStorage (1:N)

ConsumableDefinitions
└── ConsumableStorage (1:N)

PURPOSE
-------
Stores consumable quantities.

CORE COLUMNS
------------
ConsumableStorageId

CharacterId
ConsumableDefinitionId

Quantity

UpdatedAt

INDEXES
-------
PK_ConsumableStorageId

UX_ConsumableStorage_Character_Consumable

IX_ConsumableStorage_CharacterId
IX_ConsumableStorage_ConsumableDefinitionId


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\inventory\equipment-loadouts.md
====================================================

ENTITY: EquipmentLoadouts

PRIMARY KEY
-----------
EquipmentLoadoutId

FOREIGN KEYS
------------
CharacterId → Characters.CharacterId

WeaponItemId → Items.ItemId
HelmetItemId → Items.ItemId
ArmorItemId → Items.ItemId
ShieldItemId → Items.ItemId
LegsItemId → Items.ItemId
BootsItemId → Items.ItemId
RingItemId → Items.ItemId
AmuletItemId → Items.ItemId

CARDINALITY
-----------
Characters
└── EquipmentLoadouts (1:N)

PURPOSE
-------
Stores saved equipment presets.

CORE COLUMNS
------------
EquipmentLoadoutId

CharacterId

Name

WeaponItemId
HelmetItemId
ArmorItemId
ShieldItemId
LegsItemId
BootsItemId
RingItemId
AmuletItemId

IsDefault

CreatedAt
UpdatedAt

BUSINESS RULES
--------------
Maximum 3 loadouts per character.

All referenced items must belong
to the same character.

INDEXES
-------
PK_EquipmentLoadoutId

IX_EquipmentLoadouts_CharacterId


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\inventory\inventory-items.md
====================================================

ENTITY: InventoryItems

PRIMARY KEY
-----------
InventoryItemId

FOREIGN KEYS
------------
CharacterId → Characters.CharacterId
ItemId → Items.ItemId

UNIQUE CONSTRAINTS
------------------
ItemId

CARDINALITY
-----------
Characters
└── InventoryItems (1:N)

Items
└── InventoryItems (1:1)

PURPOSE
-------
Stores ownership of equipment items.

CORE COLUMNS
------------
InventoryItemId

CharacterId
ItemId

Position

IsEquipped

AcquiredAt

INDEXES
-------
PK_InventoryItemId

UX_InventoryItems_ItemId

IX_InventoryItems_CharacterId
IX_InventoryItems_IsEquipped


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\inventory\material-storage.md
====================================================

ENTITY: MaterialStorage

PRIMARY KEY
-----------
MaterialStorageId

FOREIGN KEYS
------------
CharacterId → Characters.CharacterId
MaterialId → Materials.MaterialId

UNIQUE CONSTRAINTS
------------------
(CharacterId, MaterialId)

CARDINALITY
-----------
Characters
└── MaterialStorage (1:N)

Materials
└── MaterialStorage (1:N)

PURPOSE
-------
Stores quantities of materials owned.

CORE COLUMNS
------------
MaterialStorageId

CharacterId
MaterialId

Quantity

UpdatedAt

INDEXES
-------
PK_MaterialStorageId

UX_MaterialStorage_Character_Material

IX_MaterialStorage_CharacterId
IX_MaterialStorage_MaterialId


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\items\affix-templates.md
====================================================

ENTITY: AffixTemplates

PRIMARY KEY
-----------
AffixTemplateId

REFERENCED BY
-------------
ItemAffixes.AffixTemplateId

CARDINALITY
-----------
AffixTemplates
└── ItemAffixes (1:N)

PURPOSE
-------
Stores affix definitions and tiers.

CORE COLUMNS
------------
AffixTemplateId

AffixType
(Attack, Defense, SpellPower, Health, Mana,
 Energy, GoldPercent, ExperiencePercent)

Tier

RequiredItemLevel

MinValue
MaxValue

CreatedAt
UpdatedAt

INDEXES
-------
PK_AffixTemplateId

IX_AffixTemplates_AffixType
IX_AffixTemplates_RequiredItemLevel


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\items\item-affixes.md
====================================================

ENTITY: ItemAffixes

PRIMARY KEY
-----------
ItemAffixId

FOREIGN KEYS
------------
ItemId → Items.ItemId
AffixTemplateId → AffixTemplates.AffixTemplateId

CARDINALITY
-----------
Items
└── ItemAffixes (1:N)

AffixTemplates
└── ItemAffixes (1:N)

PURPOSE
-------
Stores affixes rolled on item instances.

CORE COLUMNS
------------
ItemAffixId

ItemId
AffixTemplateId

RollValue

CreatedAt

INDEXES
-------
PK_ItemAffixId

IX_ItemAffixes_ItemId
IX_ItemAffixes_AffixTemplateId


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\items\item-bases.md
====================================================

ENTITY: ItemBases

PRIMARY KEY
-----------
ItemBaseId

FOREIGN KEYS
------------
UniqueTemplateId → UniqueTemplates.UniqueTemplateId (nullable)
SetTemplateId → SetTemplates.SetTemplateId (nullable)

REFERENCED BY
-------------
Items.ItemBaseId

CARDINALITY
-----------
ItemBases
└── Items (1:N)

UNIQUE CONSTRAINTS
------------------
Name

PURPOSE
-------
Stores all static equipment templates.

CORE COLUMNS
------------
ItemBaseId

Name
Description
Artwork

ItemLevel
RequiredLevel

Slot
(Weapon, Helmet, Armor, Shield, Legs, Boots, Ring, Amulet)

WeaponType
(Nullable)

Attack
Defense
SpellPower
Health
Mana
Energy
GoldPercent
ExperiencePercent

BaseItemScore

IsBossExclusive
IsUnique
IsSet

CreatedAt
UpdatedAt

INDEXES
-------
PK_ItemBaseId

UX_ItemBases_Name

IX_ItemBases_ItemLevel
IX_ItemBases_Slot
IX_ItemBases_IsBossExclusive


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\items\items.md
====================================================

ENTITY: Items

PRIMARY KEY
-----------
ItemId

FOREIGN KEYS
------------
ItemBaseId → ItemBases.ItemBaseId

REFERENCED BY
-------------
InventoryItems.ItemId
ItemAffixes.ItemId
AuctionListings.ItemId
MailAttachments.ItemId

CARDINALITY
-----------
ItemBases
└── Items (1:N)

Items
└── ItemAffixes (1:N)

PURPOSE
-------
Stores generated equipment instances.

CORE COLUMNS
------------
ItemId

ItemBaseId

ItemLevel

Rarity
(Common, Magic, Rare, Epic, Legendary)

ItemScore

CurrentOwnerCharacterId

IsEquipped
IsLocked

CreatedAt

INDEXES
-------
PK_ItemId

IX_Items_ItemBaseId
IX_Items_ItemLevel
IX_Items_Rarity
IX_Items_CurrentOwnerCharacterId


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\items\set-bonuses.md
====================================================

ENTITY: SetBonuses

PRIMARY KEY
-----------
SetBonusId

FOREIGN KEYS
------------
SetTemplateId → SetTemplates.SetTemplateId

CARDINALITY
-----------
SetTemplates
└── SetBonuses (1:N)

PURPOSE
-------
Stores bonuses granted by set completion.

CORE COLUMNS
------------
SetBonusId

SetTemplateId

RequiredPieces

BonusType
(Attack, Defense, SpellPower,
 GoldPercent, ExperiencePercent, Health, Mana)

BonusValue

CreatedAt

INDEXES
-------
PK_SetBonusId

IX_SetBonuses_SetTemplateId


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\items\set-templates.md
====================================================

ENTITY: SetTemplates

PRIMARY KEY
-----------
SetTemplateId

REFERENCED BY
-------------
ItemBases.SetTemplateId
SetBonuses.SetTemplateId
SetProgress.SetTemplateId

CARDINALITY
-----------
SetTemplates
├── ItemBases (1:N)
└── SetBonuses (1:N)

PURPOSE
-------
Stores equipment set definitions.

CORE COLUMNS
------------
SetTemplateId

Name
Description

RequiredPieces

CreatedAt
UpdatedAt

INDEXES
-------
PK_SetTemplateId

UX_SetTemplates_Name


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\items\unique-templates.md
====================================================

ENTITY: UniqueTemplates

PRIMARY KEY
-----------
UniqueTemplateId

REFERENCED BY
-------------
ItemBases.UniqueTemplateId
HolyGrailEntries.UniqueTemplateId

CARDINALITY
-----------
UniqueTemplates
└── ItemBases (1:N)

PURPOSE
-------
Stores unique item definitions.

CORE COLUMNS
------------
UniqueTemplateId

Name
Description

MinAttack
MaxAttack

MinDefense
MaxDefense

MinSpellPower
MaxSpellPower

MinHealth
MaxHealth

MinMana
MaxMana

MinEnergy
MaxEnergy

CreatedAt
UpdatedAt

INDEXES
-------
PK_UniqueTemplateId

UX_UniqueTemplates_Name


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\loot\loot-tables.md
====================================================

ENTITY: LootTables

PRIMARY KEY
-----------
LootTableId

FOREIGN KEYS
------------
MonsterId → Monsters.MonsterId

ItemBaseId → ItemBases.ItemBaseId

CARDINALITY
-----------
Monsters
└── LootTables (1:N)

ItemBases
└── LootTables (1:N)

PURPOSE
-------
Defines equipment loot available from monsters and bosses.

CORE COLUMNS
------------
LootTableId

MonsterId
ItemBaseId

DropChancePercent

MinItemLevel
MaxItemLevel

LootLevelModifier

IsEnabled

CreatedAt
UpdatedAt

INDEXES
-------
PK_LootTableId

IX_LootTables_MonsterId
IX_LootTables_ItemBaseId


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\loot\other-loot-tables.md
====================================================

ENTITY: OtherLootTables

PRIMARY KEY
-----------
OtherLootTableId

FOREIGN KEYS
------------
MonsterId → Monsters.MonsterId

MaterialId
    → Materials.MaterialId
    (nullable)

ConsumableDefinitionId
    → ConsumableDefinitions.ConsumableDefinitionId
    (nullable)

CARDINALITY
-----------
Monsters
└── OtherLootTables (1:N)

Materials
└── OtherLootTables (1:N)

ConsumableDefinitions
└── OtherLootTables (1:N)

PURPOSE
-------
Defines non-equipment drops.

Examples:
- Materials
- Potions
- Blessings
- Protection Stones
- Boosts

BUSINESS RULES
--------------
Exactly one of:

MaterialId
or
ConsumableDefinitionId

must be populated.

CORE COLUMNS
------------
OtherLootTableId

MonsterId

MaterialId
ConsumableDefinitionId

DropChancePercent

MinQuantity
MaxQuantity

IsEnabled

CreatedAt
UpdatedAt

INDEXES
-------
PK_OtherLootTableId

IX_OtherLootTables_MonsterId
IX_OtherLootTables_MaterialId
IX_OtherLootTables_ConsumableDefinitionId


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\loot\unique-pity-tracking.md
====================================================

ENTITY: UniquePityTracking

PRIMARY KEY
-----------
UniquePityTrackingId

FOREIGN KEYS
------------
CharacterId → Characters.CharacterId

UNIQUE CONSTRAINTS
------------------
CharacterId

CARDINALITY
-----------
Characters
└── UniquePityTracking (1:1)

PURPOSE
-------
Tracks unique/set bad-luck protection.

CORE COLUMNS
------------
UniquePityTrackingId

CharacterId

EligibleKillCount

CurrentChancePercent

LastUniqueDropAt

LastSetDropAt

CreatedAt
UpdatedAt

BUSINESS RULES
--------------
Chance increases after each
eligible kill.

Chance resets after:
- Unique drop
- Set drop

Maximum chance cap controlled
by game configuration.

INDEXES
-------
PK_UniquePityTrackingId

UX_UniquePityTracking_CharacterId


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\mail\mail-attachments.md
====================================================

ENTITY: MailAttachments

PRIMARY KEY
-----------
MailAttachmentId

FOREIGN KEYS
------------
MailMessageId
    → MailMessages.MailMessageId

ItemId
    → Items.ItemId
    (nullable)

MaterialId
    → Materials.MaterialId
    (nullable)

ConsumableDefinitionId
    → ConsumableDefinitions.ConsumableDefinitionId
    (nullable)

CARDINALITY
-----------
MailMessages
└── MailAttachments (1:N)

Items
└── MailAttachments (1:N)

Materials
└── MailAttachments (1:N)

ConsumableDefinitions
└── MailAttachments (1:N)

PURPOSE
-------
Stores all rewards and assets attached
to mailbox messages.

Examples:
- Item rewards
- Marketplace purchases
- Marketplace sales
- Gold rewards
- Materials
- Consumables
- Achievement rewards
- Season rewards

BUSINESS RULES
--------------
Exactly one attachment type should exist:

- Gold
- Item
- Material
- Consumable

Attachments remain until:
- Collected by player
- Mail expires
- Admin removes them

CORE COLUMNS
------------
MailAttachmentId

MailMessageId

AttachmentType
(
  Gold,
  Item,
  Material,
  Consumable
)

GoldAmount

ItemId

MaterialId
MaterialQuantity

ConsumableDefinitionId
ConsumableQuantity

IsCollected

CollectedAt

CreatedAt

INDEXES
-------
PK_MailAttachmentId

IX_MailAttachments_MailMessageId

IX_MailAttachments_IsCollected

IX_MailAttachments_ItemId

IX_MailAttachments_MaterialId

IX_MailAttachments_ConsumableDefinitionId

BUSINESS RULES
--------------
- Mail can have multiple attachments
- Attachments can be claimed individually
- Claiming transfers assets to inventory/storage
- Gold is delivered directly to character balance
- Collected attachments cannot be reclaimed


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\mail\mail-messages.md
====================================================

ENTITY: MailAttachments

PRIMARY KEY
-----------
MailAttachmentId

FOREIGN KEYS
------------
MailMessageId
    → MailMessages.MailMessageId

ItemId
    → Items.ItemId
    (nullable)

MaterialId
    → Materials.MaterialId
    (nullable)

ConsumableDefinitionId
    → ConsumableDefinitions.ConsumableDefinitionId
    (nullable)

CARDINALITY
-----------
MailMessages
└── MailAttachments (1:N)

PURPOSE
-------
Stores rewards and assets attached
to mailbox messages.

BUSINESS RULES
--------------
Exactly one attachment type should exist:

- Gold
- Item
- Material
- Consumable

CORE COLUMNS
------------
MailAttachmentId

MailMessageId

AttachmentType
(
  Gold,
  Item,
  Material,
  Consumable
)

GoldAmount

ItemId

MaterialId
MaterialQuantity

ConsumableDefinitionId
ConsumableQuantity

IsCollected

CollectedAt

CreatedAt

INDEXES
-------
PK_MailAttachmentId

IX_MailAttachments_MailMessageId
IX_MailAttachments_IsCollected

IX_MailAttachments_ItemId
IX_MailAttachments_MaterialId
IX_MailAttachments_ConsumableDefinitionId


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\mail\mail-templates.md
====================================================

ENTITY: MailTemplates

PRIMARY KEY
-----------
MailTemplateId

PURPOSE
-------
Reusable system mail templates.

Examples
--------
MarketplaceSale
MarketplacePurchase
DailyBossReward
AchievementReward
SeasonReward

CORE COLUMNS
------------
MailTemplateId

Code

SubjectTemplate

BodyTemplate

CreatedAt
UpdatedAt


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\marketplace\auction-history.md
====================================================

ENTITY: AuctionHistory

PRIMARY KEY
-----------
AuctionHistoryId

FOREIGN KEYS
------------
AuctionListingId
    → AuctionListings.AuctionListingId

SellerCharacterId
    → Characters.CharacterId

BuyerCharacterId
    → Characters.CharacterId

ItemId
    → Items.ItemId
    (nullable)

MaterialId
    → Materials.MaterialId
    (nullable)

ConsumableDefinitionId
    → ConsumableDefinitions.ConsumableDefinitionId
    (nullable)

CARDINALITY
-----------
AuctionListings
└── AuctionHistory (1:N)

Characters
└── AuctionHistory (1:N)

PURPOSE
-------
Stores completed marketplace transactions.

BUSINESS RULES
--------------
Records are immutable.

Used for:
- price history
- market analytics
- last 20 sales display

CORE COLUMNS
------------
AuctionHistoryId

AuctionListingId

SellerCharacterId
BuyerCharacterId

ItemId
MaterialId
ConsumableDefinitionId

Quantity

UnitPrice

TotalPrice

SoldAt

CreatedAt

INDEXES
-------
PK_AuctionHistoryId

IX_AuctionHistory_SellerCharacterId

IX_AuctionHistory_BuyerCharacterId

IX_AuctionHistory_SoldAt

IX_AuctionHistory_ItemId

IX_AuctionHistory_MaterialId

IX_AuctionHistory_ConsumableDefinitionId


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\marketplace\auction-listings.md
====================================================

ENTITY: AuctionListings

PRIMARY KEY
-----------
AuctionListingId

FOREIGN KEYS
------------
CharacterId
    → Characters.CharacterId

ItemId
    → Items.ItemId
    (nullable)

MaterialId
    → Materials.MaterialId
    (nullable)

ConsumableDefinitionId
    → ConsumableDefinitions.ConsumableDefinitionId
    (nullable)

CARDINALITY
-----------
Characters
└── AuctionListings (1:N)

Items
└── AuctionListings (1:N)

Materials
└── AuctionListings (1:N)

ConsumableDefinitions
└── AuctionListings (1:N)

REFERENCED BY
-------------
AuctionHistory.AuctionListingId

UNIQUE CONSTRAINTS
------------------
None

PURPOSE
-------
Stores active marketplace listings.

BUSINESS RULES
--------------
Exactly one of:

- ItemId
- MaterialId
- ConsumableDefinitionId

must be populated.

Maximum active listings:
10 per character

Maximum duration:
24 hours

CORE COLUMNS
------------
AuctionListingId

CharacterId

ItemId
MaterialId
ConsumableDefinitionId

Quantity

UnitPrice

ListingFeePaid

Status
(
 Active,
 Sold,
 Expired,
 Cancelled
)

ExpiresAt

CreatedAt
UpdatedAt

INDEXES
-------
PK_AuctionListingId

IX_AuctionListings_CharacterId

IX_AuctionListings_Status

IX_AuctionListings_ExpiresAt

IX_AuctionListings_ItemId

IX_AuctionListings_MaterialId

IX_AuctionListings_ConsumableDefinitionId


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\materials\materials.md
====================================================



====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\monsters\monster-abilities.md
====================================================

ENTITY: MonsterAbilities

PRIMARY KEY
-----------
MonsterAbilityId

FOREIGN KEYS
------------
MonsterId → Monsters.MonsterId
SpellId → Spells.SpellId

REFERENCED BY
-------------
MonsterAbilityWeights.MonsterAbilityId

CARDINALITY
-----------
Monsters
└── MonsterAbilities (1:N)

MonsterAbilities
└── MonsterAbilityWeights (1:N)

PURPOSE
-------
Assigns abilities to monsters.

CORE COLUMNS
------------
MonsterAbilityId

MonsterId
SpellId

IsEnabled

CreatedAt

INDEXES
-------
PK_MonsterAbilityId

IX_MonsterAbilities_MonsterId
IX_MonsterAbilities_SpellId


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\monsters\monster-ability-weights.md
====================================================

ENTITY: MonsterAbilityWeights

PRIMARY KEY
-----------
MonsterAbilityWeightId

FOREIGN KEYS
------------
MonsterAbilityId
    → MonsterAbilities.MonsterAbilityId

CARDINALITY
-----------
MonsterAbilities
└── MonsterAbilityWeights (1:N)

PURPOSE
-------
Stores weighted random selection data
for monster abilities.

CORE COLUMNS
------------
MonsterAbilityWeightId

MonsterAbilityId

Weight

CreatedAt

INDEXES
-------
PK_MonsterAbilityWeightId

IX_MonsterAbilityWeights_MonsterAbilityId


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\monsters\monster-families.md
====================================================

ENTITY: MonsterFamilies

PRIMARY KEY
-----------
MonsterFamilyId

FOREIGN KEYS
------------
None

REFERENCED BY
-------------
Monsters.MonsterFamilyId

CARDINALITY
-----------
MonsterFamilies
└── Monsters (1:N)

UNIQUE CONSTRAINTS
------------------
Name

PURPOSE
-------
Stores monster family definitions.

CORE COLUMNS
------------
MonsterFamilyId

Name
Description

CreatedAt
UpdatedAt

INDEXES
-------
PK_MonsterFamilyId

UX_MonsterFamilies_Name


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\monsters\monsters.md
====================================================

ENTITY: Monsters

PRIMARY KEY
-----------
MonsterId

FOREIGN KEYS
------------
MonsterFamilyId
    → MonsterFamilies.MonsterFamilyId

REFERENCED BY
-------------
MonsterAbilities.MonsterId
LootTables.MonsterId
OtherLootTables.MonsterId
CharacterMonsterKills.MonsterId
BestiaryEntries.MonsterId
BestiaryStatistics.MonsterId
MonsterTasks.MonsterId

CARDINALITY
-----------
MonsterFamilies
└── Monsters (1:N)

Monsters
├── MonsterAbilities (1:N)
├── LootTables (1:N)
├── OtherLootTables (1:N)
├── CharacterMonsterKills (1:N)
├── BestiaryEntries (1:N)
├── BestiaryStatistics (1:N)
└── MonsterTasks (1:N)

UNIQUE CONSTRAINTS
------------------
Name

PURPOSE
-------
Stores all monster, mini boss,
task boss and daily boss records.

CORE COLUMNS
------------
MonsterId

MonsterFamilyId

Name
Description
Artwork

MonsterType
(Normal, MiniBoss, TaskBoss, DailyBoss)

Level

Health
Attack
Defense

SpellPowerPercent

CooldownSeconds

AbilityChancePercent

GoldMin
GoldMax

LootLevelModifier

PowerScore

CreatedAt
UpdatedAt

INDEXES
-------
PK_MonsterId

UX_Monsters_Name

IX_Monsters_FamilyId
IX_Monsters_Level
IX_Monsters_Type


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\outfits\account-addons.md
====================================================

ENTITY: AccountOutfits

PRIMARY KEY
-----------
AccountOutfitId

FOREIGN KEYS
------------
AccountId
    → Accounts.AccountId

OutfitDefinitionId
    → OutfitDefinitions.OutfitDefinitionId

CARDINALITY
-----------
Accounts
└── AccountOutfits (1:N)

OutfitDefinitions
└── AccountOutfits (1:N)

UNIQUE CONSTRAINTS
------------------
(AccountId, OutfitDefinitionId)

PURPOSE
-------
Tracks unlocked outfits.

CORE COLUMNS
------------
AccountOutfitId

AccountId
OutfitDefinitionId

UnlockedAt

CreatedAt

INDEXES
-------
PK_AccountOutfitId

UX_AccountOutfits

IX_AccountOutfits_AccountId
IX_AccountOutfits_OutfitDefinitionId

BUSINESS RULES
--------------
- Account-wide
- Permanent unlock
- Not affected by seasons
- Not affected by character deletion


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\outfits\account-outfits.md
====================================================

ENTITY: AccountOutfits

PRIMARY KEY
-----------
AccountOutfitId

FOREIGN KEYS
------------
AccountId
    → Accounts.AccountId

OutfitDefinitionId
    → OutfitDefinitions.OutfitDefinitionId

CARDINALITY
-----------
Accounts
└── AccountOutfits (1:N)

OutfitDefinitions
└── AccountOutfits (1:N)

UNIQUE CONSTRAINTS
------------------
(AccountId, OutfitDefinitionId)

PURPOSE
-------
Tracks unlocked outfits.

CORE COLUMNS
------------
AccountOutfitId

AccountId
OutfitDefinitionId

UnlockedAt

CreatedAt

INDEXES
-------
PK_AccountOutfitId

UX_AccountOutfits

IX_AccountOutfits_AccountId
IX_AccountOutfits_OutfitDefinitionId

BUSINESS RULES
--------------
- Account-wide
- Permanent unlock
- Not affected by seasons
- Not affected by character deletion


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\outfits\addon-definitions.md
====================================================

ENTITY: AddonDefinitions

PRIMARY KEY
-----------
AddonDefinitionId

FOREIGN KEYS
------------
OutfitDefinitionId
    → OutfitDefinitions.OutfitDefinitionId

REFERENCED BY
-------------
AccountAddons.AddonDefinitionId

CARDINALITY
-----------
OutfitDefinitions
└── AddonDefinitions (1:N)

AddonDefinitions
└── AccountAddons (1:N)

PURPOSE
-------
Stores addon definitions for outfits.

CORE COLUMNS
------------
AddonDefinitionId

OutfitDefinitionId

Name
Description
Artwork

DisplayOrder

CreatedAt
UpdatedAt

INDEXES
-------
PK_AddonDefinitionId

IX_AddonDefinitions_OutfitDefinitionId
IX_AddonDefinitions_DisplayOrder

BUSINESS RULES
--------------
- Addons belong to exactly one outfit
- Cosmetic only


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\outfits\outfit-definitions.md
====================================================

ENTITY: OutfitDefinitions

PRIMARY KEY
-----------
OutfitDefinitionId

FOREIGN KEYS
------------
None

REFERENCED BY
-------------
AddonDefinitions.OutfitDefinitionId
AccountOutfits.OutfitDefinitionId

CARDINALITY
-----------
OutfitDefinitions
├── AddonDefinitions (1:N)
└── AccountOutfits (1:N)

UNIQUE CONSTRAINTS
------------------
Name

PURPOSE
-------
Stores outfit definitions.

CORE COLUMNS
------------
OutfitDefinitionId

Name
Description
Artwork

Category

DisplayOrder

CreatedAt
UpdatedAt

INDEXES
-------
PK_OutfitDefinitionId

UX_OutfitDefinitions_Name

IX_OutfitDefinitions_DisplayOrder

BUSINESS RULES
--------------
- Cosmetic only
- Account-wide progression
- Permanent unlocks
- No gameplay bonuses


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\seasons\seasons.md
====================================================

ENTITY: Seasons

PRIMARY KEY
-----------
SeasonId

FOREIGN KEYS
------------
None

REFERENCED BY
-------------
Characters.SeasonId
SeasonRankings.SeasonId
HallOfFame.SeasonId

UNIQUE CONSTRAINTS
------------------
SeasonNumber

CARDINALITY
-----------
Seasons
├── Characters (1:N)
├── SeasonRankings (1:N)
└── HallOfFame (1:N)

RECOMMENDED CORE COLUMNS
------------------------
SeasonId

SeasonNumber

Name
(e.g. "Season 1")

StartDate
EndDate

Status
(Upcoming / Active / Ended)

CreatedAt

OPTIONAL COLUMNS
----------------
IsCurrent

WinnerCharacterId
(FK to Characters after season ends)

INDEXES
-------
PK_SeasonId

UX_SeasonNumber

IX_Seasons_Status
IX_Seasons_StartDate
IX_Seasons_EndDate

BUSINESS RULES
--------------
- Only one season can be Active at a time.
- Characters belong to exactly one Season.
- Season rankings are scoped to a single Season.
- HallOfFame records are immutable historical snapshots.
- Non-Ladder does not need a Season record.


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\social\account-friends.md
====================================================

ENTITY: AccountFriends

PRIMARY KEY
-----------
AccountFriendId

FOREIGN KEYS
------------
AccountId
    → Accounts.AccountId

FriendAccountId
    → Accounts.AccountId

UNIQUE CONSTRAINTS
------------------
(AccountId, FriendAccountId)

CARDINALITY
-----------
Accounts
└── AccountFriends (1:N)

PURPOSE
-------
Stores accepted friendships.

BUSINESS RULES
--------------
- Friends are account-wide
- Maximum 20 friends
- Friendships survive seasons
- Friendships survive character deletion
- Friendships survive character archiving

CORE COLUMNS
------------
AccountFriendId

AccountId
FriendAccountId

CreatedAt

INDEXES
-------
PK_AccountFriendId

UX_AccountFriends

IX_AccountFriends_AccountId
IX_AccountFriends_FriendAccountId


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\social\friend-requests.md
====================================================

ENTITY: FriendRequests

PRIMARY KEY
-----------
FriendRequestId

FOREIGN KEYS
------------
SenderAccountId
    → Accounts.AccountId

RecipientAccountId
    → Accounts.AccountId

CARDINALITY
-----------
Accounts
└── FriendRequests (1:N)

PURPOSE
-------
Stores pending and historical
friend requests.

CORE COLUMNS
------------
FriendRequestId

SenderAccountId
RecipientAccountId

Status
(
 Pending,
 Accepted,
 Rejected,
 Cancelled
)

SentAt

RespondedAt

CreatedAt

INDEXES
-------
PK_FriendRequestId

IX_FriendRequests_SenderAccountId
IX_FriendRequests_RecipientAccountId
IX_FriendRequests_Status


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\social\private-messages.md
====================================================

ENTITY: PrivateMessages

PRIMARY KEY
-----------
PrivateMessageId

FOREIGN KEYS
------------
SenderAccountId
    → Accounts.AccountId

RecipientAccountId
    → Accounts.AccountId

CARDINALITY
-----------
Accounts
└── PrivateMessages (1:N)

PURPOSE
-------
Stores player-to-player messages.

BUSINESS RULES
--------------
- Account-based, not character-based
- Maximum stored messages configurable
- No attachments in V1

CORE COLUMNS
------------
PrivateMessageId

SenderAccountId
RecipientAccountId

Subject

MessageBody

IsRead

SentAt

ReadAt

CreatedAt

INDEXES
-------
PK_PrivateMessageId

IX_PrivateMessages_SenderAccountId

IX_PrivateMessages_RecipientAccountId

IX_PrivateMessages_IsRead

IX_PrivateMessages_SentAt


====================================================
FILE: C:\Projects\ostatnia-szansa-game\database-design\spells\spells.md
====================================================

ENTITY: Spells

PRIMARY KEY
-----------
SpellId

FOREIGN KEYS
------------
None

REFERENCED BY
-------------
CharacterSpells.SpellId
CharacterLoadouts.Spell1Id
CharacterLoadouts.Spell2Id
CharacterLoadouts.Spell3Id

CARDINALITY
-----------
Spells
├── CharacterSpells (1:N)
└── CharacterLoadouts (1:N)

UNIQUE CONSTRAINTS
------------------
Name

PURPOSE
-------
Stores all spell definitions.

CORE COLUMNS
------------
SpellId

Name
Description
Icon

Category
(Damage, DamageOverTime, Healing,
 HealOverTime, ManaDrain, HealthDrain,
 PotionDisable, StatBuff, StatDebuff)

TargetType
(Self, Enemy)

ManaCost

CooldownTurns

BaseValue

DurationTurns

RequiredLevel
GoldCost

CreatedAt
UpdatedAt

INDEXES
-------
PK_SpellId

UX_Spells_Name

IX_Spells_Category
IX_Spells_RequiredLevel
