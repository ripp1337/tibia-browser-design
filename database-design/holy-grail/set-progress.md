ENTITY: SetProgress

PRIMARY KEY
-----------
SetProgressId

FOREIGN KEYS
------------
AccountId
    → Accounts.AccountId

SetTemplateId
    → SetTemplates.SetTemplateId

CARDINALITY
-----------
Accounts
└── SetProgress (1:N)

SetTemplates
└── SetProgress (1:N)

UNIQUE CONSTRAINTS
------------------
(AccountId, SetTemplateId)

PURPOSE
-------
Tracks completion progress for
equipment sets.

Examples:

Rat Set
2 / 4

Vampire Set
3 / 5

Dragon Set
4 / 4

CORE COLUMNS
------------
SetProgressId

AccountId

SetTemplateId

PiecesDiscovered

TotalPiecesRequired

IsCompleted

CompletedAt

CreatedAt
UpdatedAt

BUSINESS RULES
--------------
Progress is account-wide.

Progress never resets.

Completion does not require
currently owning the items.

Only discovering them once.

INDEXES
-------
PK_SetProgressId

UX_SetProgress_Account_Set

IX_SetProgress_AccountId

IX_SetProgress_SetTemplateId

IX_SetProgress_IsCompleted