ENTITY: HolyGrailEntries

PRIMARY KEY
-----------
HolyGrailEntryId

FOREIGN KEYS
------------
AccountId → Accounts.AccountId

UniqueTemplateId
    → UniqueTemplates.UniqueTemplateId
    (nullable)

SetTemplateId
    → SetTemplates.SetTemplateId
    (nullable)

CARDINALITY
-----------
Accounts
└── HolyGrailEntries (1:N)

UniqueTemplates
└── HolyGrailEntries (1:N)

SetTemplates
└── HolyGrailEntries (1:N)

UNIQUE CONSTRAINTS
------------------
(AccountId, UniqueTemplateId)

(AccountId, SetTemplateId)

PURPOSE
-------
Tracks discovered Uniques and Sets.

BUSINESS RULES
--------------
Exactly one of:

UniqueTemplateId
or
SetTemplateId

must be populated.

Discovery is permanent.

Progress remains after:
- selling
- trading
- salvaging
- deleting a character

CORE COLUMNS
------------
HolyGrailEntryId

AccountId

UniqueTemplateId
SetTemplateId

FoundByCharacterId

FoundSeasonId

FirstFoundAt

CreatedAt

INDEXES
-------
PK_HolyGrailEntryId

IX_HolyGrailEntries_AccountId

IX_HolyGrailEntries_UniqueTemplateId

IX_HolyGrailEntries_SetTemplateId