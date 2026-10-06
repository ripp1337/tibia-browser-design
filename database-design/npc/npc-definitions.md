ENTITY: NpcDefinitions

PRIMARY KEY
-----------
NpcDefinitionId

FOREIGN KEYS
------------
None

CARDINALITY
-----------
NpcDefinitions
└── Referenced by future vendor/healer systems

PURPOSE
-------
Stores all NPC definitions.

Examples:
- Vendor
- Healer
- Blessing Merchant
- Promotion Trainer

CORE COLUMNS
------------
NpcDefinitionId

Name

Description

Artwork

NpcType
(
Vendor,
Healer,
BlessingMerchant,
PromotionTrainer
)

LevelMin
LevelMax

IsActive

CreatedAt
UpdatedAt

INDEXES
-------
PK_NpcDefinitionId

UX_NpcDefinitions_Name

IX_NpcDefinitions_NpcType

IX_NpcDefinitions_IsActive

BUSINESS RULES
--------------
- NPCs are database-driven
- NPC behavior is determined by type
- NPCs may be enabled or disabled
- Future NPC types may be added without schema changes