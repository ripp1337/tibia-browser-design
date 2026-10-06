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

BUSINESS RULES
--------------
- IsEquipped is the only authoritative source of the character's currently equipped items
- IsEquipped = true means that the item is currently equipped
- IsEquipped = false means that the item is not currently equipped
- The Effective Character Statistics calculator uses only items where IsEquipped = true
- A character may have no more than one equipped item in each equipment slot
- An equipped item must belong to the character
- An equipped item must satisfy its Required Level
- Equipping a two-handed weapon requires the Shield slot to be empty
- Equipping, unequipping, and applying an Equipment Loadout must occur in a transaction
- If an equipment operation fails, all changes to IsEquipped must be rolled back
- EquipmentLoadouts are saved presets and are not authoritative for the current equipped state