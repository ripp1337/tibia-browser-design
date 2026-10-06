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

InventorySlots

50 = default
100 = expanded

CreatedAt
UpdatedAt