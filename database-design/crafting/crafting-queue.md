ENTITY: CraftingQueue

PRIMARY KEY
-----------
CraftingQueueId

FOREIGN KEYS
------------
CharacterId → Characters.CharacterId
RecipeId → Recipes.RecipeId

CARDINALITY
-----------
Characters
└── CraftingQueue (1:N)

Recipes
└── CraftingQueue (1:N)

PURPOSE
-------
Stores active and pending crafts.

CORE COLUMNS
------------
CraftingQueueId

CharacterId
RecipeId

Quantity

Status
(Pending, Active, Completed, Cancelled)

StartedAt
CompletesAt

CraftingSlot

CreatedAt

BUSINESS RULES
--------------
Maximum total queued crafting time:
24 hours

Maximum crafting slots:
3

INDEXES
-------
PK_CraftingQueueId

IX_CraftingQueue_CharacterId
IX_CraftingQueue_Status
IX_CraftingQueue_CompletesAt