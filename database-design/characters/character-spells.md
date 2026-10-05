ENTITY: CharacterSpells

PRIMARY KEY
-----------
CharacterSpellId

FOREIGN KEYS
------------
CharacterId → Characters.CharacterId
SpellId → Spells.SpellId

UNIQUE CONSTRAINTS
------------------
(CharacterId, SpellId)

CARDINALITY
-----------
Characters
└── CharacterSpells (1:N)

Spells
└── CharacterSpells (1:N)

PURPOSE
-------
Stores permanently unlocked spells.

CORE COLUMNS
------------
CharacterSpellId
CharacterId
SpellId

UnlockedAt

INDEXES
-------
PK_CharacterSpellId

UX_CharacterSpells_CharacterId_SpellId

IX_CharacterSpells_CharacterId
IX_CharacterSpells_SpellId