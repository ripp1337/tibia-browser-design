ENTITY: Characters

PRIMARY KEY
-----------
CharacterId

FOREIGN KEYS
------------
AccountId         → Accounts.AccountId
SeasonId          → Seasons.SeasonId

### REFERENCED BY

CharacterStatistics.CharacterId
CharacterUnlocks.CharacterId
CharacterLoadouts.CharacterId
CharacterSpellMastery.CharacterId
CharacterSpells.CharacterId

CharacterCooldowns.CharacterId

InventoryItems.CharacterId
MaterialStorage.CharacterId
ConsumableStorage.CharacterId
EquipmentLoadouts.CharacterId

CharacterBuffs.CharacterId

CombatSessions.CharacterId
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