ENTITY: HourlyChestProgress

PRIMARY KEY
-----------
HourlyChestProgressId

FOREIGN KEYS
------------
CharacterId
    → Characters.CharacterId

UNIQUE CONSTRAINTS
------------------
CharacterId

CARDINALITY
-----------
Characters
└── HourlyChestProgress (1:1)

PURPOSE
-------
Tracks hourly chest availability.

CORE COLUMNS
------------
HourlyChestProgressId

CharacterId

NextAvailableAt

IsAvailable

LastClaimedAt

TotalClaims

CreatedAt
UpdatedAt

BUSINESS RULES
--------------
- Maximum one hourly chest available
- Claim starts next timer
- Timer duration: 60 minutes

INDEXES
-------
PK_HourlyChestProgressId

UX_HourlyChestProgress_CharacterId

IX_HourlyChestProgress_NextAvailableAt
IX_HourlyChestProgress_IsAvailable