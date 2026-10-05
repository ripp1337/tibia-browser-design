ENTITY: AffixTemplates

PRIMARY KEY
-----------
AffixTemplateId

REFERENCED BY
-------------
ItemAffixes.AffixTemplateId

CARDINALITY
-----------
AffixTemplates
└── ItemAffixes (1:N)

PURPOSE
-------
Stores affix definitions and tiers.

CORE COLUMNS
------------
AffixTemplateId

AffixType
(Attack, Defense, SpellPower, Health, Mana,
 Energy, GoldPercent, ExperiencePercent)

Tier

RequiredItemLevel

MinValue
MaxValue

CreatedAt
UpdatedAt

INDEXES
-------
PK_AffixTemplateId

IX_AffixTemplates_AffixType
IX_AffixTemplates_RequiredItemLevel