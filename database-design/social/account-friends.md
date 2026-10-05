ENTITY: AccountFriends

PRIMARY KEY
-----------
AccountFriendId

FOREIGN KEYS
------------
AccountId
    → Accounts.AccountId

FriendAccountId
    → Accounts.AccountId

UNIQUE CONSTRAINTS
------------------
(AccountId, FriendAccountId)

CARDINALITY
-----------
Accounts
└── AccountFriends (1:N)

PURPOSE
-------
Stores accepted friendships.

BUSINESS RULES
--------------
- Friends are account-wide
- Maximum 20 friends
- Friendships survive seasons
- Friendships survive character deletion
- Friendships survive character archiving

CORE COLUMNS
------------
AccountFriendId

AccountId
FriendAccountId

CreatedAt

INDEXES
-------
PK_AccountFriendId

UX_AccountFriends

IX_AccountFriends_AccountId
IX_AccountFriends_FriendAccountId