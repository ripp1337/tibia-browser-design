ENTITY: CharacterStatistics

PRIMARY KEY
-----------
CharacterStatisticsId

FOREIGN KEYS
------------
CharacterId → Characters.CharacterId

UNIQUE CONSTRAINTS
------------------
CharacterId

CARDINALITY
-----------
Characters
└── CharacterStatistics (1:1)

PURPOSE
-------
Stores lifetime statistics.

CORE COLUMNS
------------
TotalPlaytimeSeconds

TotalGoldEarned
TotalGoldSpent
HighestGoldOwned

TotalMonstersKilled
TotalBossesKilled
TotalDailyBossesKilled

TotalDeaths

TotalDamageDealt
TotalDamageTaken
TotalHealingDone
TotalManaSpent

HighestPhysicalHit
HighestSpellHit

StrongestMonsterKilledId
StrongestBossKilledId

LongestNoDeathStreak

CreatedAt
UpdatedAt

Effective Statistics Recalculation

Any modification affecting effective statistics
must trigger statistics recalculation.

If effective maximum resources decrease,
resource clamping is executed before saving.
`