ENTITY: MailAttachments

PRIMARY KEY
-----------
MailAttachmentId

FOREIGN KEYS
------------
MailMessageId
    → MailMessages.MailMessageId

ItemId
    → Items.ItemId
    (nullable)

MaterialId
    → Materials.MaterialId
    (nullable)

ConsumableDefinitionId
    → ConsumableDefinitions.ConsumableDefinitionId
    (nullable)

CARDINALITY
-----------
MailMessages
└── MailAttachments (1:N)

Items
└── MailAttachments (1:N)

Materials
└── MailAttachments (1:N)

ConsumableDefinitions
└── MailAttachments (1:N)

PURPOSE
-------
Stores all rewards and assets attached
to mailbox messages.

Examples:
- Item rewards
- Marketplace purchases
- Marketplace sales
- Gold rewards
- Materials
- Consumables
- Achievement rewards
- Season rewards

BUSINESS RULES
--------------
Exactly one attachment type should exist:

- Gold
- Item
- Material
- Consumable

Attachments remain until:
- Collected by player
- Mail expires
- Admin removes them

CORE COLUMNS
------------
MailAttachmentId

MailMessageId

AttachmentType
(
  Gold,
  Item,
  Material,
  Consumable
)

GoldAmount

ItemId

MaterialId
MaterialQuantity

ConsumableDefinitionId
ConsumableQuantity

IsCollected

CollectedAt

CreatedAt

INDEXES
-------
PK_MailAttachmentId

IX_MailAttachments_MailMessageId

IX_MailAttachments_IsCollected

IX_MailAttachments_ItemId

IX_MailAttachments_MaterialId

IX_MailAttachments_ConsumableDefinitionId

BUSINESS RULES
--------------
- Mail can have multiple attachments
- Attachments can be claimed individually
- Claiming transfers assets to inventory/storage
- Gold is delivered directly to character balance
- Collected attachments cannot be reclaimed