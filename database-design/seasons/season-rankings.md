ENTITY: SeasonRankings

PRIMARY KEY
-----------
SeasonRankingId

FOREIGN KEYS
------------
SeasonId
    → Seasons.SeasonId

CharacterId
    → Characters.CharacterId

CARDINALITY
-----------
Seasons
└── SeasonRankings (1:N)

Characters
└── SeasonRankings (1:N)

UNIQUE CONSTRAINTS
------------------
(SeasonId, CharacterId)

PURPOSE
-------
Stores seasonal leaderboard snapshots.

Used for:
- Experience rankings
- Ladder rankings
- Hardcore rankings
- Historical season results

CORE COLUMNS
------------
SeasonRankingId

SeasonId
CharacterId

RankingType
(
Experience,
Hardcore
)

RankPosition

CharacterLevel

CharacterExperience

TotalDeaths

CapturedAt

CreatedAt

INDEXES
-------
PK_SeasonRankingId

UX_SeasonRankings_Season_Character

IX_SeasonRankings_SeasonId

IX_SeasonRankings_RankingType

IX_SeasonRankings_RankPosition

BUSINESS RULES
--------------
- Rankings belong to a single season
- Rankings may be recalculated periodically
- Final season rankings are preserved permanently
- Rankings are character-based
- Historical ranking records are immutable after season completion