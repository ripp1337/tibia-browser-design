ENTITY: CharacterLoadouts

PRIMARY KEY
-----------
CharacterLoadoutId

FOREIGN KEYS
------------
CharacterId → Characters.CharacterId

CARDINALITY
-----------
Characters
└── CharacterLoadouts (1:N)

PURPOSE
-------
Stores saved combat loadouts.

CORE COLUMNS
------------
CharacterLoadoutId
CharacterId

Name

Spell1Id
Spell2Id
Spell3Id

IsDefault

CreatedAt
UpdatedAt

BUSINESS RULES
--------------
Maximum 3 loadouts per character.

Same spell cannot occupy multiple slots
within a loadout.

INDEXES
-------
PK_CharacterLoadoutId

IX_CharacterLoadouts_CharacterId