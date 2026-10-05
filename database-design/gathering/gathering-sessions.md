ENTITY: GatheringSessions

PRIMARY KEY
-----------
GatheringSessionId

FOREIGN KEYS
------------
CharacterId → Characters.CharacterId

REFERENCED BY
-------------
GatheringResults.GatheringSessionId

CARDINALITY
-----------
Characters
└── GatheringSessions (1:N)

GatheringSessions
└── GatheringResults (1:N)

PURPOSE
-------
Stores gathering runs started by characters.

CORE COLUMNS
------------
GatheringSessionId

CharacterId

StartedAt
EndedAt

Status
(Active, Completed, Cancelled)

GatheringLevelAtStart

TotalMinutesGathered

ExperienceEarned

ResultsCollected

CreatedAt
UpdatedAt

BUSINESS RULES
--------------
- Only one active gathering session per character
- Maximum duration: 24 hours
- Logging in ends active gathering
- Offline-only activity

INDEXES
-------
PK_GatheringSessionId

IX_GatheringSessions_CharacterId
IX_GatheringSessions_Status
IX_GatheringSessions_StartedAt