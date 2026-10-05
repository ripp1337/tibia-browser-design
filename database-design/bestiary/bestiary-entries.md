ENTITY: BestiaryEntries

PRIMARY KEY
-----------
BestiaryEntryId

FOREIGN KEYS
------------
CharacterId
    → Characters.CharacterId

MonsterId
    → Monsters.MonsterId

CARDINALITY
-----------
Characters
└── BestiaryEntries (1:N)

Monsters
└── BestiaryEntries (1:N)

UNIQUE CONSTRAINTS
------------------
(CharacterId, MonsterId)

PURPOSE
-------
Tracks which monsters have been discovered
by a character.

BUSINESS RULES
--------------
- First kill unlocks the entry
- Unlock is permanent
- Bestiary is character-specific
- One entry per monster per character

CORE COLUMNS
------------
BestiaryEntryId

CharacterId
MonsterId

UnlockedAt

CreatedAt

INDEXES
-------
PK_BestiaryEntryId

UX_BestiaryEntries_Character_Monster

IX_BestiaryEntries_CharacterId
IX_BestiaryEntries_MonsterId