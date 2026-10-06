ENTITY: Materials

PRIMARY KEY
-----------
MaterialId

FOREIGN KEYS
------------
None

REFERENCED BY
-------------
MaterialStorage.MaterialId
RecipeMaterials.MaterialId
OtherLootTables.MaterialId
GatheringResults.MaterialId

CARDINALITY
-----------
Materials
├── MaterialStorage (1:N)
├── RecipeMaterials (1:N)
├── OtherLootTables (1:N)
└── GatheringResults (1:N)

UNIQUE CONSTRAINTS
------------------
Name

PURPOSE
-------
Stores all crafting materials.

CORE COLUMNS
------------
MaterialId

Name
Description
Artwork

MaterialLevel

VendorAvailable

VendorPrice

IsGatherable
IsLootable
IsCraftingIngredient

RequiredGatheringLevel

MinimumMonsterLevel

MaxStackSize

CreatedAt
UpdatedAt

INDEXES
-------
PK_MaterialId

UX_Materials_Name

IX_Materials_MaterialLevel
IX_Materials_RequiredGatheringLevel
IX_Materials_MinimumMonsterLevel
IX_Materials_IsGatherable
IX_Materials_IsLootable

BUSINESS RULES
--------------
- Maximum stack size: 999
- Materials do not use inventory slots
- All materials are tradable
- No material rarity system exists
- Every material should be usable in at least one recipe