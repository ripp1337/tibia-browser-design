ENTITY: CraftingHistory

PRIMARY KEY
-----------
CraftingHistoryId

FOREIGN KEYS
------------
CharacterId → Characters.CharacterId
RecipeId → Recipes.RecipeId

CARDINALITY
-----------
Characters
└── CraftingHistory (1:N)

Recipes
└── CraftingHistory (1:N)

PURPOSE
-------
Stores completed crafting records.

CORE COLUMNS
------------
CraftingHistoryId

CharacterId
RecipeId

QuantityCrafted

CraftingXpEarned

CompletedAt

CreatedAt

INDEXES
-------
PK_CraftingHistoryId

IX_CraftingHistory_CharacterId
IX_CraftingHistory_RecipeId
IX_CraftingHistory_CompletedAt