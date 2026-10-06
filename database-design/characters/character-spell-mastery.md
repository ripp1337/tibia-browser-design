ENTITY: CharacterSpellMastery

PRIMARY KEY
-----------
CharacterSpellMasteryId

FOREIGN KEYS
------------
CharacterId → Characters.CharacterId

UNIQUE CONSTRAINTS
------------------
CharacterId

CARDINALITY
-----------
Characters
└── CharacterSpellMastery (1:1)

PURPOSE
-------
Stores global spell mastery progression for a character.

CORE COLUMNS
------------
CharacterSpellMasteryId
CharacterId

MasteryLevel
MasteryExperience

CurrentspellPower

CreatedAt
UpdatedAt

INDEXES
-------
PK_CharacterSpellMasteryId

UX_CharacterSpellMastery_CharacterId
`