ENTITY: HallOfFame

PRIMARY KEY
-----------
HallOfFameId

FOREIGN KEYS
------------
SeasonId
    → Seasons.SeasonId

CharacterId
    → Characters.CharacterId

CARDINALITY
-----------
Seasons
└── HallOfFame (1:N)

Characters
└── HallOfFame (1:N)

UNIQUE CONSTRAINTS
------------------
(SeasonId, RankPosition)

PURPOSE
-------
Stores permanent historical season results.

Acts as the authoritative archive
for competitive seasonal play.

CORE COLUMNS
------------
HallOfFameId

SeasonId
CharacterId

CharacterName

RankPosition

FinalLevel

FinalExperience

AchievementScore

HolyGrailPercent

TotalPlaytimeSeconds

TotalDeaths

RecordedAt

CreatedAt

INDEXES
-------
PK_HallOfFameId

UX_HallOfFame_Season_Rank

IX_HallOfFame_SeasonId

IX_HallOfFame_CharacterId

IX_HallOfFame_RankPosition

BUSINESS RULES
--------------
- Hall of Fame entries are immutable
- Created only after season completion
- Represents final season standings
- Historical data remains available permanently
- Character deletion must not remove Hall of Fame records
- Character name is stored redundantly for historical accuracy