ENTITY: Items

PRIMARY KEY
-----------
ItemId

FOREIGN KEYS
------------
ItemBaseId → ItemBases.ItemBaseId

REFERENCED BY
-------------
InventoryItems.ItemId
ItemAffixes.ItemId
AuctionListings.ItemId
MailAttachments.ItemId

CARDINALITY
-----------
ItemBases
└── Items (1:N)

Items
└── ItemAffixes (1:N)

PURPOSE
-------
Stores generated equipment instances.

CORE COLUMNS
------------
ItemId

ItemBaseId

ItemLevel

Rarity
(Common, Magic, Rare, Epic, Legendary)

ItemScore

IsLocked

CreatedAt

INDEXES
-------
PK_ItemId

IX_Items_ItemBaseId
IX_Items_ItemLevel
IX_Items_Rarity

BUSINESS RULE:
Unique items cannot have affixes.
Set items cannot have affixes.
Only non-set, non-unique items generate ItemAffix records.