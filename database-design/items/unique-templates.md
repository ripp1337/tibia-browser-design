ENTITY: UniqueTemplates

PRIMARY KEY
-----------
UniqueTemplateId

REFERENCED BY
-------------
ItemBases.UniqueTemplateId
HolyGrailEntries.UniqueTemplateId

CARDINALITY
-----------
UniqueTemplates
└── ItemBases (1:N)

PURPOSE
-------
Stores unique item definitions.

CORE COLUMNS
------------
UniqueTemplateId

Name
Description

MinAttack
MaxAttack

MinDefense
MaxDefense

MinSpellPower
MaxSpellPower

MinHealth
MaxHealth

MinMana
MaxMana

MinEnergy
MaxEnergy

CreatedAt
UpdatedAt

INDEXES
-------
PK_UniqueTemplateId

UX_UniqueTemplates_Name