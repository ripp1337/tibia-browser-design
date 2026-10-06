ENTITY: Recipes

PRIMARY KEY
-----------
RecipeId

FOREIGN KEYS
------------
ConsumableDefinitionId
    → ConsumableDefinitions.ConsumableDefinitionId

REFERENCED BY
-------------
RecipeMaterials.RecipeId
CraftingQueue.RecipeId
CraftingHistory.RecipeId

CARDINALITY
-----------
Recipes
├── RecipeMaterials (1:N)
├── CraftingQueue (1:N)
└── CraftingHistory (1:N)

PURPOSE
-------
Stores all crafting recipes.

UNIQUE CONSTRAINTS
------------------
Name

CORE COLUMNS
------------
RecipeId

Name
Description

Category
(Potion, Blessing, Upgrade, Boost)

ConsumableDefinitionId

RequiredCraftingLevel
RequiredCharacterLevel

GoldCost

CraftingTimeSeconds

CraftingXpReward

OutputQuantity

IsEnabled

CreatedAt
UpdatedAt

INDEXES
-------
PK_RecipeId

UX_Recipes_Name

IX_Recipes_Category
IX_Recipes_RequiredCraftingLevel