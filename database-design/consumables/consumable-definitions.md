ENTITY: ConsumableDefinitions

PRIMARY KEY
-----------
ConsumableDefinitionId

FOREIGN KEYS
------------
None

REFERENCED BY
-------------
ConsumableStorage.ConsumableDefinitionId
Recipes.ConsumableDefinitionId
OtherLootTables.ConsumableDefinitionId

CARDINALITY
-----------
ConsumableDefinitions
├── ConsumableStorage (1:N)
├── Recipes (1:N)
└── OtherLootTables (1:N)

UNIQUE CONSTRAINTS
------------------
Name

PURPOSE
-------
Stores all consumable definitions.

Examples:
- Health Potions
- Mana Potions
- Energy Potions
- Gold Boosts
- Experience Boosts
- Blessings
- Protection Stones

CORE COLUMNS
------------
ConsumableDefinitionId

Name
Description
Artwork

Category
(
  HealthPotion,
  ManaPotion,
  EnergyPotion,
  GoldBoost,
  ExperienceBoost,
  Blessing,
  ProtectionStone
)

Tier
(
  Small,
  Medium,
  Large,
  Grand,
  Ultimate,
  None
)

EffectType
(
  RestoreHealth,
  RestoreMana,
  RestoreEnergy,
  GoldBonus,
  ExperienceBonus,
  Blessing,
  UpgradeProtection
)

EffectValue

DurationType
(
  Instant,
  Fights,
  Passive
)

DurationValue

PotionCooldownTurns

MaxStackSize

IsTradable

CreatedAt
UpdatedAt

INDEXES
-------
PK_ConsumableDefinitionId

UX_ConsumableDefinitions_Name

IX_ConsumableDefinitions_Category
IX_ConsumableDefinitions_EffectType

BUSINESS RULES
--------------
- Maximum stack size: 999
- All consumables are tradable
- Blessings are manually activated
- Protection Stones are consumed on upgrade attempt
- Gold/Experience boosts do not stack with same category
- Boosts are fight-based, not time-based
- Energy Potions cannot exceed max energy
- Health/Mana Potions cannot overheal/overrestore