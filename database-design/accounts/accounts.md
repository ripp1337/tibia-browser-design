ENTITY: Accounts

PRIMARY KEY
-----------
AccountId

FOREIGN KEYS
------------
None

REFERENCED BY
-------------
Characters.AccountId
AccountAchievements.AccountId
AchievementProgress.AccountId
AccountHolyGrail.AccountId
AccountFriends.AccountId
FriendRequests.SenderAccountId
FriendRequests.RecipientAccountId
AccountOutfits.AccountId
AccountAddons.AccountId
PrivateMessages.SenderAccountId
PrivateMessages.RecipientAccountId
AdminActions.AccountId
Punishments.AccountId

UNIQUE CONSTRAINTS
------------------
Username
Email (nullable, unique when present)

CARDINALITY
-----------
Accounts
├─ Characters (1:N)
├─ AchievementProgress (1:N)
├─ AccountAchievements (1:N)
├─ AccountHolyGrail (1:N)
├─ AccountFriends (1:N)
├─ FriendRequests (1:N)
├─ AccountOutfits (1:N)
├─ AccountAddons (1:N)
├─ PrivateMessages (1:N)
├─ AdminActions (1:N)
└─ Punishments (1:N)

RECOMMENDED MINIMUM COLUMNS
---------------------------
AccountId (PK)
Username
Email
PasswordHash
CreatedAt
LastLoginAt
Status
IsBanned