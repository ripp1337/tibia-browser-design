ENTITY: Bosses

PRIMARY KEY
-----------
BossId

FOREIGN KEYS
------------
MonsterId → Monsters.MonsterId

UNIQUE CONSTRAINTS
------------------
MonsterId

CARDINALITY
-----------
Monsters
└── Bosses (1:1)

Bosses
├── MonsterTasks (1:N)
├── DailyBossDefinitions (1:N)
└── LootTables (1:N)

PURPOSE
-------
Stores boss-specific settings that extend
the base monster definition.

CORE COLUMNS
------------
BossId

MonsterId

BossType
(MiniBoss, TaskBoss, DailyBoss)

LootLevelBonus

UniqueModifier

AdditionalCooldownSeconds

CreatedAt
UpdatedAt

INDEXES
-------
PK_BossId

UX_Bosses_MonsterId

IX_Bosses_BossType