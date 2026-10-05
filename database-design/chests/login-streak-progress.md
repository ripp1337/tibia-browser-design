ENTITY: LoginStreakProgress

PRIMARY KEY
-----------
LoginStreakProgressId

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
└── LoginStreakProgress (1:1)

PURPOSE
-------
Tracks login streak progression.

CORE COLUMNS
------------
LoginStreakProgressId

CharacterId

CurrentStreak

HighestStreak

LastLoginDate

LastRewardDay

CompletedCycles

CreatedAt
UpdatedAt

BUSINESS RULES
--------------
- Missing a day resets streak
- Maximum streak length: 7
- Day 7 reward resets streak back to Day 1
- Rewards can only be claimed once per streak day

INDEXES
-------
PK_LoginStreakProgressId

UX_LoginStreakProgress_CharacterId

IX_LoginStreakProgress_CurrentStreak
IX_LoginStreakProgress_LastLoginDate