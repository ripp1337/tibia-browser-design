ENTITY: RecipeMaterials

PRIMARY KEY
-----------
RecipeMaterialId

FOREIGN KEYS
------------
RecipeId → Recipes.RecipeId
MaterialId → Materials.MaterialId

CARDINALITY
-----------
Recipes
└── RecipeMaterials (1:N)

Materials
└── RecipeMaterials (1:N)

PURPOSE
-------
Stores material requirements for recipes.

CORE COLUMNS
------------
RecipeMaterialId

RecipeId
MaterialId

RequiredQuantity

CreatedAt

INDEXES
-------
PK_RecipeMaterialId

IX_RecipeMaterials_RecipeId
IX_RecipeMaterials_MaterialId

UNIQUE CONSTRAINTS
------------------
(RecipeId, MaterialId)