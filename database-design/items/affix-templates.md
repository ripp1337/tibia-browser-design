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

## BUSINESS RULES

- Attack, Defense, SpellPower, Health, Mana, and Energy values are flat modifiers.
- GoldPercent and ExperiencePercent values are percentage-point modifiers.
- Percentage-point modifiers affecting the same statistic are combined additively.
- Affix templates do not perform final-stat calculations.
- Final aggregation and rounding belong to the authoritative Effective Character Statistics calculator.