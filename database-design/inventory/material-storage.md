ENTITY: MaterialStorage

PRIMARY KEY
-----------
MaterialStorageId

FOREIGN KEYS
------------
CharacterId → Characters.CharacterId
MaterialId → Materials.MaterialId

UNIQUE CONSTRAINTS
------------------
(CharacterId, MaterialId)

CARDINALITY
-----------
Characters
└── MaterialStorage (1:N)

Materials
└── MaterialStorage (1:N)

PURPOSE
-------
Stores quantities of materials owned.

CORE COLUMNS
------------
MaterialStorageId

CharacterId
MaterialId

Quantity

UpdatedAt

INDEXES
-------
PK_MaterialStorageId

UX_MaterialStorage_Character_Material

IX_MaterialStorage_CharacterId
IX_MaterialStorage_MaterialId