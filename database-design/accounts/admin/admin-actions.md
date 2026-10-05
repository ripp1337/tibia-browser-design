ENTITY: AdminActions

PRIMARY KEY
-----------
AdminActionId

FOREIGN KEYS
------------
AccountId
    → Accounts.AccountId
    (nullable)

CARDINALITY
-----------
Accounts
└── AdminActions (1:N)

PURPOSE
-------
Audit log of administrative actions.

Examples:
- Give Gold
- Give Item
- Ban Account
- Mute Account
- Reset Progress
- Send Mail

CORE COLUMNS
------------
AdminActionId

AdminUser

ActionType

AccountId

TargetEntityType
TargetEntityId

Reason

ActionData

CreatedAt

INDEXES
-------
PK_AdminActionId

IX_AdminActions_AccountId
IX_AdminActions_ActionType
IX_AdminActions_CreatedAt

BUSINESS RULES
--------------
- Never deleted
- Immutable audit log
- Used for moderation review