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