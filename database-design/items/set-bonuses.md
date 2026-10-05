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