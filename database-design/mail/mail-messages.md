ENTITY: MailMessages

PRIMARY KEY
-----------
MailMessageId

FOREIGN KEYS
------------
CharacterId
    → Characters.CharacterId

CARDINALITY
-----------
Characters
└── MailMessages (1:N)

MailMessages
└── MailAttachments (1:N)

PURPOSE
-------
Stores mailbox messages used for:
- marketplace sales
- marketplace purchases
- system rewards
- admin messages
- season rewards
- achievement rewards
- crafting rewards

CORE COLUMNS
------------
MailMessageId

CharacterId

Subject

Body

MessageType
(
  MarketplaceSale,
  MarketplacePurchase,
  AchievementReward,
  DailyBossReward,
  SeasonReward,
  CraftingReward,
  AdminMessage,
  SystemMessage
)

IsRead

HasAttachments

ExpiresAt

CreatedAt

ReadAt

INDEXES
-------
PK_MailMessageId

IX_MailMessages_CharacterId

IX_MailMessages_IsRead

IX_MailMessages_MessageType

IX_MailMessages_ExpiresAt

BUSINESS RULES
--------------
- Mail acts as a delivery mechanism
- Mail may contain multiple attachments
- Expired mail is removed automatically
- Marketplace transactions generate mail
- Reward delivery uses mail
- Read state is tracked per message
`