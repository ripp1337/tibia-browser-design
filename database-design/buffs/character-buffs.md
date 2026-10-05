ENTITY: CharacterBuffs

PRIMARY KEY
-----------
CharacterBuffId

FOREIGN KEYS
------------
CharacterId
    → Characters.CharacterId

ConsumableDefinitionId
    → ConsumableDefinitions.ConsumableDefinitionId
    (nullable)

SpellId
    → Spells.SpellId
    (nullable)

CARDINALITY
-----------
Characters
└── CharacterBuffs (1:N)

ConsumableDefinitions
└── CharacterBuffs (1:N)

Spells
└── CharacterBuffs (1:N)

PURPOSE
-------
Stores all active buffs and debuffs.

Examples:
- Gold Boost
- Experience Boost
- Attack Buff
- Defense Buff
- Spell Power Buff
- Damage Over Time
- Heal Over Time
- Mana Drain
- Potion Disable

BUSINESS RULES
--------------
A buff may originate from:
- Consumable
- Spell
- System Effect

Exactly one source should exist.

Effects of the same type do not stack.
Instead they refresh duration.

CORE COLUMNS
------------
CharacterBuffId

CharacterId

BuffType
(
  GoldBoost,
  ExperienceBoost,
  AttackBuff,
  DefenseBuff,
  SpellPowerBuff,
  DamageOverTime,
  HealOverTime,
  ManaDrain,
  HealthDrain,
  PotionDisable
)

BuffSourceType
(
  Consumable,
  Spell,
  System
)

ConsumableDefinitionId
SpellId

Value

DurationType
(
  Turns,
  Fights,
  Permanent
)

DurationRemaining

IsPositive

AppliedAt

ExpiresAt

CreatedAt
UpdatedAt

INDEXES
-------
PK_CharacterBuffId

IX_CharacterBuffs_CharacterId

IX_CharacterBuffs_BuffType

IX_CharacterBuffs_ExpiresAt

IX_CharacterBuffs_IsPositive