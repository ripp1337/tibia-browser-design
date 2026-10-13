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

## M6 VICTORY PROGRESSION

A Victory records the monster kill and updates Bestiary timestamps and counters transactionally.

When the defeated monster is the progress monster for an active task:

- task progress increases by one,
- progress is capped at the task's required kill count,
- reaching the required count changes the task status to `UNLOCKED`.

These updates are committed atomically with the rest of Victory settlement.
