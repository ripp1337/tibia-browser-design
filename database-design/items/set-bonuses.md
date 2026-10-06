ENTITY: SetBonuses

PRIMARY KEY
-----------
SetBonusId

FOREIGN KEYS
------------
SetTemplateId → SetTemplates.SetTemplateId

CARDINALITY
-----------
SetTemplates
└── SetBonuses (1:N)

PURPOSE
-------
Stores bonuses granted by set completion.

CORE COLUMNS
------------
SetBonusId

SetTemplateId

RequiredPieces

BonusType
(Attack, Defense, SpellPower,
 GoldPercent, ExperiencePercent, Health, Mana)

BonusValue

CreatedAt

INDEXES
-------
PK_SetBonusId

IX_SetBonuses_SetTemplateId

## BUSINESS RULES

- A set bonus becomes active when the required number of set pieces is equipped.
- Flat set bonuses are added to the corresponding flat statistic.
- Percentage set bonuses are percentage-point modifiers.
- Percentage set bonuses affecting the same statistic are combined additively with modifiers from all other sources.
- Set bonuses do not calculate or store final character statistics.