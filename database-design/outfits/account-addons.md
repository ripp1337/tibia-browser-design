ENTITY: AccountOutfits

PRIMARY KEY
-----------
AccountOutfitId

FOREIGN KEYS
------------
AccountId
    → Accounts.AccountId

OutfitDefinitionId
    → OutfitDefinitions.OutfitDefinitionId

CARDINALITY
-----------
Accounts
└── AccountOutfits (1:N)

OutfitDefinitions
└── AccountOutfits (1:N)

UNIQUE CONSTRAINTS
------------------
(AccountId, OutfitDefinitionId)

PURPOSE
-------
Tracks unlocked outfits.

CORE COLUMNS
------------
AccountOutfitId

AccountId
OutfitDefinitionId

UnlockedAt

CreatedAt

INDEXES
-------
PK_AccountOutfitId

UX_AccountOutfits

IX_AccountOutfits_AccountId
IX_AccountOutfits_OutfitDefinitionId

BUSINESS RULES
--------------
- Account-wide
- Permanent unlock
- Not affected by seasons
- Not affected by character deletion