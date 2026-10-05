ENTITY: EquipmentLoadouts

PRIMARY KEY
-----------
EquipmentLoadoutId

FOREIGN KEYS
------------
CharacterId → Characters.CharacterId

WeaponItemId → Items.ItemId
HelmetItemId → Items.ItemId
ArmorItemId → Items.ItemId
ShieldItemId → Items.ItemId
LegsItemId → Items.ItemId
BootsItemId → Items.ItemId
RingItemId → Items.ItemId
AmuletItemId → Items.ItemId

CARDINALITY
-----------
Characters
└── EquipmentLoadouts (1:N)

PURPOSE
-------
Stores saved equipment presets.

CORE COLUMNS
------------
EquipmentLoadoutId

CharacterId

Name

WeaponItemId
HelmetItemId
ArmorItemId
ShieldItemId
LegsItemId
BootsItemId
RingItemId
AmuletItemId

IsDefault

CreatedAt
UpdatedAt

BUSINESS RULES
--------------
Maximum 3 loadouts per character.

All referenced items must belong
to the same character.

INDEXES
-------
PK_EquipmentLoadoutId

IX_EquipmentLoadouts_CharacterId