ENTITY: DailyChestProgress

PRIMARY KEY
-----------
DailyChestProgressId

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
└── DailyChestProgress (1:1)

PURPOSE
-------
Tracks daily chest availability.

CORE COLUMNS
------------
DailyChestProgressId

CharacterId

NextAvailableAt

IsAvailable

LastClaimedAt

TotalClaims

CreatedAt
UpdatedAt

BUSINESS RULES
--------------
- Maximum one daily chest available
- Daily chest does not stack
- Timer duration: 24 hours

INDEXES
-------
PK_DailyChestProgressId

UX_DailyChestProgress_CharacterId

IX_DailyChestProgress_NextAvailableAt
IX_DailyChestProgress_IsAvailable