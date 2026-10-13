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

## M6 DAILY BOSS SETTLEMENT

The attempt is consumed when Daily Boss combat starts, not when it ends.

A successful Daily Boss Victory settlement:

- increments `TotalVictories`,
- writes `LastVictoryAt`,
- raises `HighestTierDefeated` when the defeated tier is higher.

Defeat does not record a Daily Boss Victory.

Daily Boss progression is scoped to the Character, Daily Boss definition, and active rotation. Daily Boss encounters do not receive the Normal Monster or Mini Boss cooldown.
