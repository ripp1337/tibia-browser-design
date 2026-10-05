ENTITY: Spells

PRIMARY KEY
-----------
SpellId

FOREIGN KEYS
------------
None

REFERENCED BY
-------------
CharacterSpells.SpellId
CharacterLoadouts.Spell1Id
CharacterLoadouts.Spell2Id
CharacterLoadouts.Spell3Id

CARDINALITY
-----------
Spells
├── CharacterSpells (1:N)
└── CharacterLoadouts (1:N)

UNIQUE CONSTRAINTS
------------------
Name

PURPOSE
-------
Stores all spell definitions.

CORE COLUMNS
------------
SpellId

Name
Description
Icon

Category
(Damage, DamageOverTime, Healing,
 HealOverTime, ManaDrain, HealthDrain,
 PotionDisable, StatBuff, StatDebuff)

TargetType
(Self, Enemy)

ManaCost

CooldownTurns

BaseValue

DurationTurns

RequiredLevel
GoldCost

CreatedAt
UpdatedAt

INDEXES
-------
PK_SpellId

UX_Spells_Name

IX_Spells_Category
IX_Spells_RequiredLevel