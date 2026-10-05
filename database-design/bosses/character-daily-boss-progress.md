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