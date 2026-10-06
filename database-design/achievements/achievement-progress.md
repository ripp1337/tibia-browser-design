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
- Completed achievement rewards apply to every character belonging to the account
- Completed achievement rewards also apply to characters created after completion
- Only records with IsCompleted = true activate achievement rewards
- Achievement rewards are resolved dynamically through the character owner's AccountId
- Achievement reward values are read from the related Achievements record
- Achievement rewards are not copied into AchievementProgress or character records
- Creating, archiving, or deleting a character does not duplicate or remove AchievementProgress