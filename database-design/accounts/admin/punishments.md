ENTITY: Punishments

PRIMARY KEY
-----------
PunishmentId

FOREIGN KEYS
------------
AccountId
    → Accounts.AccountId

CARDINALITY
-----------
Accounts
└── Punishments (1:N)

PURPOSE
-------
Stores account penalties.

Examples:
- Warning
- Mute
- Temporary Ban
- Permanent Ban

CORE COLUMNS
------------
PunishmentId

AccountId

PunishmentType
(
  Warning,
  Mute,
  TemporaryBan,
  PermanentBan
)

Reason

IssuedBy

IssuedAt

ExpiresAt

IsActive

RemovedAt

CreatedAt

INDEXES
-------
PK_PunishmentId

IX_Punishments_AccountId
IX_Punishments_PunishmentType
IX_Punishments_IsActive
IX_Punishments_ExpiresAt

BUSINESS RULES
--------------
- History is preserved permanently
- Expired punishments remain for audit
- Permanent bans have no expiration date