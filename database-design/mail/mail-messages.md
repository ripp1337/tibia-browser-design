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

PURPOSE
-------
Stores rewards and assets attached
to mailbox messages.

BUSINESS RULES
--------------
Exactly one attachment type should exist:

- Gold
- Item
- Material
- Consumable

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