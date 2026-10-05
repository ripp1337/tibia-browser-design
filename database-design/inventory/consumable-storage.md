ENTITY: ConsumableStorage

PRIMARY KEY
-----------
ConsumableStorageId

FOREIGN KEYS
------------
CharacterId → Characters.CharacterId
ConsumableDefinitionId
    → ConsumableDefinitions.ConsumableDefinitionId

UNIQUE CONSTRAINTS
------------------
(CharacterId, ConsumableDefinitionId)

CARDINALITY
-----------
Characters
└── ConsumableStorage (1:N)

ConsumableDefinitions
└── ConsumableStorage (1:N)

PURPOSE
-------
Stores consumable quantities.

CORE COLUMNS
------------
ConsumableStorageId

CharacterId
ConsumableDefinitionId

Quantity

UpdatedAt

INDEXES
-------
PK_ConsumableStorageId

UX_ConsumableStorage_Character_Consumable

IX_ConsumableStorage_CharacterId
IX_ConsumableStorage_ConsumableDefinitionId