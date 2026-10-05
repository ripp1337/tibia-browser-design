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