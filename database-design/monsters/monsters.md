ENTITY: Monsters

PRIMARY KEY
-----------
MonsterId

FOREIGN KEYS
------------
MonsterFamilyId
    → MonsterFamilies.MonsterFamilyId

### REFERENCED BY

Bosses.MonsterId

MonsterAbilities.MonsterId

LootTables.MonsterId
OtherLootTables.MonsterId

CombatSessions.MonsterId
CombatLogs.MonsterId

BestiaryEntries.MonsterId
BestiaryStatistics.MonsterId

MonsterTasks.MonsterId

CharacterCooldowns.TargetId

CARDINALITY
-----------
MonsterFamilies
└── Monsters (1:N)

Monsters
├── MonsterAbilities (1:N)
├── LootTables (1:N)
├── OtherLootTables (1:N)
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

spellPower

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