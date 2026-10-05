ENTITY: AchievementProgress

PRIMARY KEY
-----------
AchievementProgressId

FOREIGN KEYS
------------
AccountId → Accounts.AccountId

AchievementId
    → Achievements.AchievementId

CARDINALITY
-----------
Accounts
└── AchievementProgress (1:N)

Achievements
└── AchievementProgress (1:N)

UNIQUE CONSTRAINTS
------------------
(AccountId, AchievementId)

PURPOSE
-------
Tracks achievement progression
for an account.

CORE COLUMNS
------------
AchievementProgressId

AccountId
AchievementId

CurrentValue

IsCompleted

CompletedAt

CreatedAt
UpdatedAt

INDEXES
-------
PK_AchievementProgressId

UX_AchievementProgress_Account_Achievement

IX_AchievementProgress_AccountId
IX_AchievementProgress_AchievementId
IX_AchievementProgress_IsCompleted

BUSINESS RULES
--------------
- Progress is account-wide
- Progress never resets
- Completion is permanent
- Hidden achievements become visible after completion