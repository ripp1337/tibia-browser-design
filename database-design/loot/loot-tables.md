ENTITY: LootTables

PRIMARY KEY
-----------
LootTableId

FOREIGN KEYS
------------
MonsterId → Monsters.MonsterId

ItemBaseId → ItemBases.ItemBaseId

CARDINALITY
-----------
Monsters
└── LootTables (1:N)

ItemBases
└── LootTables (1:N)

PURPOSE
-------
Defines equipment loot available from monsters and bosses.

CORE COLUMNS
------------
LootTableId

MonsterId
ItemBaseId

DropChancePercent

MinItemLevel
MaxItemLevel

LootLevelModifier

IsEnabled

CreatedAt
UpdatedAt

INDEXES
-------
PK_LootTableId

IX_LootTables_MonsterId
IX_LootTables_ItemBaseId