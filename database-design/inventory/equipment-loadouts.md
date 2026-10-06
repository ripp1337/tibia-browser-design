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

EquipmentLoadouts are saved presets and do not represent the character's current equipped state.

InventoryItems.IsEquipped is the only authoritative source of currently equipped items.

IsDefault identifies the default saved preset.

IsDefault does not mean that the loadout is currently equipped.

The Effective Character Statistics calculator must not read currently equipped items directly from EquipmentLoadouts.

Applying a loadout must update InventoryItems.IsEquipped in one transaction.

Before applying a loadout, all referenced items must:
- Belong to the character
- Match their assigned equipment slots
- Satisfy their Required Level
- Satisfy weapon and shield compatibility rules

Applying a loadout must:
- Mark the character's currently equipped items as not equipped
- Mark the items referenced by the selected loadout as equipped
- Recalculate Effective Character Statistics
- Safely clamp current resources if effective maximum values decrease

If any validation or update fails, the entire operation must be rolled back.

INDEXES
-------
PK_EquipmentLoadoutId

IX_EquipmentLoadouts_CharacterId