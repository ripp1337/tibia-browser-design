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

CurrentOwnerCharacterId

IsEquipped
IsLocked

CreatedAt

INDEXES
-------
PK_ItemId

IX_Items_ItemBaseId
IX_Items_ItemLevel
IX_Items_Rarity
IX_Items_CurrentOwnerCharacterId