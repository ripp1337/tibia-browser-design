ENTITY: PrivateMessages

PRIMARY KEY
-----------
PrivateMessageId

FOREIGN KEYS
------------
SenderAccountId
    → Accounts.AccountId

RecipientAccountId
    → Accounts.AccountId

CARDINALITY
-----------
Accounts
└── PrivateMessages (1:N)

PURPOSE
-------
Stores player-to-player messages.

BUSINESS RULES
--------------
- Account-based, not character-based
- Maximum stored messages configurable
- No attachments in V1

CORE COLUMNS
------------
PrivateMessageId

SenderAccountId
RecipientAccountId

Subject

MessageBody

IsRead

SentAt

ReadAt

CreatedAt

INDEXES
-------
PK_PrivateMessageId

IX_PrivateMessages_SenderAccountId

IX_PrivateMessages_RecipientAccountId

IX_PrivateMessages_IsRead

IX_PrivateMessages_SentAt