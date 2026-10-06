ENTITY: InventoryItems

PRIMARY KEY
-----------
InventoryItemId

FOREIGN KEYS
------------
CharacterId → Characters.CharacterId
ItemId → Items.ItemId

UNIQUE CONSTRAINTS
------------------
ItemId

CARDINALITY
-----------
Characters
└── InventoryItems (1:N)

Items
└── InventoryItems (1:1)

PURPOSE
-------

Stores ownership and inventory placement
for character-owned equipment items.

CORE COLUMNS
------------
InventoryItemId

CharacterId
ItemId

Position

IsEquipped

AcquiredAt

INDEXES
-------
PK_InventoryItemId

UX_InventoryItems_ItemId

IX_InventoryItems_CharacterId
IX_InventoryItems_IsEquipped