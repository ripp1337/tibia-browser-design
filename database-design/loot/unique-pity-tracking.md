ENTITY: UniquePityTracking

PRIMARY KEY
-----------
UniquePityTrackingId

FOREIGN KEYS
------------
CharacterId → Characters.CharacterId

UNIQUE CONSTRAINTS
------------------
CharacterId

CARDINALITY
-----------
Characters
└── UniquePityTracking (1:1)

PURPOSE
-------
Tracks unique/set bad-luck protection.

CORE COLUMNS
------------
UniquePityTrackingId

CharacterId

EligibleKillCount

CurrentChancePercent

LastUniqueDropAt

LastSetDropAt

CreatedAt
UpdatedAt

BUSINESS RULES
--------------
Chance increases after each
eligible kill.

Chance resets after:
- Unique drop
- Set drop

Maximum chance cap controlled
by game configuration.

INDEXES
-------
PK_UniquePityTrackingId

UX_UniquePityTracking_CharacterId