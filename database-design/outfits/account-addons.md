ENTITY: AccountAddons

PRIMARY KEY
-----------
AccountAddonId

FOREIGN KEYS
------------
AccountId
    → Accounts.AccountId

AddonDefinitionId
    → AddonDefinitions.AddonDefinitionId

CARDINALITY
-----------
Accounts
└── AccountAddons (1:N)

AddonDefinitions
└── AccountAddons (1:N)

UNIQUE CONSTRAINTS
------------------
(AccountId, AddonDefinitionId)

PURPOSE
-------
Tracks unlocked outfit addons.

CORE COLUMNS
------------
AccountAddonId

AccountId
AddonDefinitionId

UnlockedAt

CreatedAt

INDEXES
-------
PK_AccountAddonId

UX_AccountAddons

IX_AccountAddons_AccountId
IX_AccountAddons_AddonDefinitionId

BUSINESS RULES
--------------
- Account-wide
- Permanent unlock
- Requires associated outfit
- Not affected by seasons
- Not affected by character deletion
- Cosmetic only