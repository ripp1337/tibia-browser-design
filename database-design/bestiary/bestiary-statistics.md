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
Stores lifetime monster tracking data
for Bestiary and progression systems.

Acts as the authoritative source for:
- Kill Count
- First Kill
- Last Kill
- Task Progress
- Bestiary Statistics

BUSINESS RULES
--------------
- Statistics are character-specific
- Statistics never reset
- Updated after each monster kill
- First kill automatically creates record
- One record per character/monster pair

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