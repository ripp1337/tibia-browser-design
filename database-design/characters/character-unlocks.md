ENTITY: CharacterUnlocks

PRIMARY KEY
-----------
CharacterUnlocksId

FOREIGN KEYS
------------
CharacterId → Characters.CharacterId

UNIQUE CONSTRAINTS
------------------
CharacterId

CARDINALITY
-----------
Characters
└── CharacterUnlocks (1:1)

PURPOSE
-------
Stores permanent character unlocks.

CORE COLUMNS
------------
IsPromoted

SpellSlotsUnlocked

CraftingSlotsUnlocked

InventoryExpansionUnlocked

CreatedAt
UpdatedAt