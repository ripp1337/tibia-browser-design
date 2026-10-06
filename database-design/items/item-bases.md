ENTITY: ItemBases

PRIMARY KEY
-----------
ItemBaseId

FOREIGN KEYS
------------
UniqueTemplateId → UniqueTemplates.UniqueTemplateId (nullable)
SetTemplateId → SetTemplates.SetTemplateId (nullable)

REFERENCED BY
-------------
Items.ItemBaseId

CARDINALITY
-----------
ItemBases
└── Items (1:N)

UNIQUE CONSTRAINTS
------------------
Name

PURPOSE
-------
Stores all static equipment templates.

CORE COLUMNS
------------
ItemBaseId

Name
Description
Artwork

ItemLevel
RequiredLevel

Slot
(Weapon, Helmet, Armor, Shield, Legs, Boots, Ring, Amulet)

WeaponType
(Nullable)

Attack
Defense
SpellPower
Health
Mana
Energy
GoldPercent
ExperiencePercent

BaseItemScore

IsBossExclusive
IsUnique
IsSet

CreatedAt
UpdatedAt

INDEXES
-------
PK_ItemBaseId

UX_ItemBases_Name

IX_ItemBases_ItemLevel
IX_ItemBases_Slot
IX_ItemBases_IsBossExclusive

## BUSINESS RULES

- Attack, Defense, SpellPower, Health, Mana, and Energy are flat modifiers.
- GoldPercent and ExperiencePercent are percentage-point modifiers.
- Percentage-point modifiers are combined additively with modifiers from all other sources.
- Item base statistics are inputs to the authoritative Effective Character Statistics calculator.