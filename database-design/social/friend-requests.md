ENTITY: FriendRequests

PRIMARY KEY
-----------
FriendRequestId

FOREIGN KEYS
------------
SenderAccountId
    → Accounts.AccountId

RecipientAccountId
    → Accounts.AccountId

CARDINALITY
-----------
Accounts
└── FriendRequests (1:N)

PURPOSE
-------
Stores pending and historical
friend requests.

CORE COLUMNS
------------
FriendRequestId

SenderAccountId
RecipientAccountId

Status
(
 Pending,
 Accepted,
 Rejected,
 Cancelled
)

SentAt

RespondedAt

CreatedAt

INDEXES
-------
PK_FriendRequestId

IX_FriendRequests_SenderAccountId
IX_FriendRequests_RecipientAccountId
IX_FriendRequests_Status