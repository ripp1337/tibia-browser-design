ENTITY: OutfitDefinitions

PRIMARY KEY
-----------
OutfitDefinitionId

FOREIGN KEYS
------------
None

REFERENCED BY
-------------
AddonDefinitions.OutfitDefinitionId
AccountOutfits.OutfitDefinitionId

CARDINALITY
-----------
OutfitDefinitions
├── AddonDefinitions (1:N)
└── AccountOutfits (1:N)

UNIQUE CONSTRAINTS
------------------
Name

PURPOSE
-------
Stores outfit definitions.

CORE COLUMNS
------------
OutfitDefinitionId

Name
Description
Artwork

Category

DisplayOrder

CreatedAt
UpdatedAt

INDEXES
-------
PK_OutfitDefinitionId

UX_OutfitDefinitions_Name

IX_OutfitDefinitions_DisplayOrder

BUSINESS RULES
--------------
- Cosmetic only
- Account-wide progression
- Permanent unlocks
- No gameplay bonuses