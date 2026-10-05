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