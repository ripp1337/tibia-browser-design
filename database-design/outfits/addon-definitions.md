ENTITY: AddonDefinitions

PRIMARY KEY
-----------
AddonDefinitionId

FOREIGN KEYS
------------
OutfitDefinitionId
    → OutfitDefinitions.OutfitDefinitionId

REFERENCED BY
-------------
AccountAddons.AddonDefinitionId

CARDINALITY
-----------
OutfitDefinitions
└── AddonDefinitions (1:N)

AddonDefinitions
└── AccountAddons (1:N)

PURPOSE
-------
Stores addon definitions for outfits.

CORE COLUMNS
------------
AddonDefinitionId

OutfitDefinitionId

Name
Description
Artwork

DisplayOrder

CreatedAt
UpdatedAt

INDEXES
-------
PK_AddonDefinitionId

IX_AddonDefinitions_OutfitDefinitionId
IX_AddonDefinitions_DisplayOrder

BUSINESS RULES
--------------
- Addons belong to exactly one outfit
- Cosmetic only