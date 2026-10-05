ENTITY: OtherLootTables

PRIMARY KEY
-----------
OtherLootTableId

FOREIGN KEYS
------------
MonsterId → Monsters.MonsterId

MaterialId
    → Materials.MaterialId
    (nullable)

ConsumableDefinitionId
    → ConsumableDefinitions.ConsumableDefinitionId
    (nullable)

CARDINALITY
-----------
Monsters
└── OtherLootTables (1:N)

Materials
└── OtherLootTables (1:N)

ConsumableDefinitions
└── OtherLootTables (1:N)

PURPOSE
-------
Defines non-equipment drops.

Examples:
- Materials
- Potions
- Blessings
- Protection Stones
- Boosts

BUSINESS RULES
--------------
Exactly one of:

MaterialId
or
ConsumableDefinitionId

must be populated.

CORE COLUMNS
------------
OtherLootTableId

MonsterId

MaterialId
ConsumableDefinitionId

DropChancePercent

MinQuantity
MaxQuantity

IsEnabled

CreatedAt
UpdatedAt

INDEXES
-------
PK_OtherLootTableId

IX_OtherLootTables_MonsterId
IX_OtherLootTables_MaterialId
IX_OtherLootTables_ConsumableDefinitionId