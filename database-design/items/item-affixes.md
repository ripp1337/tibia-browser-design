ENTITY: ItemAffixes

PRIMARY KEY
-----------
ItemAffixId

FOREIGN KEYS
------------
ItemId → Items.ItemId
AffixTemplateId → AffixTemplates.AffixTemplateId

CARDINALITY
-----------
Items
└── ItemAffixes (1:N)

AffixTemplates
└── ItemAffixes (1:N)

PURPOSE
-------
Stores affixes rolled on item instances.

CORE COLUMNS
------------
ItemAffixId

ItemId
AffixTemplateId

RollValue

CreatedAt

INDEXES
-------
PK_ItemAffixId

IX_ItemAffixes_ItemId
IX_ItemAffixes_AffixTemplateId

BUSINESS RULE:
Unique items cannot have affixes.
Set items cannot have affixes.
Only non-set, non-unique items generate ItemAffix records.