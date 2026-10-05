ENTITY: Seasons

PRIMARY KEY
-----------
SeasonId

FOREIGN KEYS
------------
None

REFERENCED BY
-------------
Characters.SeasonId
SeasonRankings.SeasonId
HallOfFame.SeasonId

UNIQUE CONSTRAINTS
------------------
SeasonNumber

CARDINALITY
-----------
Seasons
├── Characters (1:N)
├── SeasonRankings (1:N)
└── HallOfFame (1:N)

RECOMMENDED CORE COLUMNS
------------------------
SeasonId

SeasonNumber

Name
(e.g. "Season 1")

StartDate
EndDate

Status
(Upcoming / Active / Ended)

CreatedAt

OPTIONAL COLUMNS
----------------
IsCurrent

WinnerCharacterId
(FK to Characters after season ends)

INDEXES
-------
PK_SeasonId

UX_SeasonNumber

IX_Seasons_Status
IX_Seasons_StartDate
IX_Seasons_EndDate

BUSINESS RULES
--------------
- Only one season can be Active at a time.
- Characters belong to exactly one Season.
- Season rankings are scoped to a single Season.
- HallOfFame records are immutable historical snapshots.
- Non-Ladder does not need a Season record.