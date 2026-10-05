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