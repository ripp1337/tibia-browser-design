ENTITY: CombatEffects

PRIMARY KEY
-----------
CombatEffectId

FOREIGN KEYS
------------
CombatSessionId
    → CombatSessions.CombatSessionId

SpellId
    → Spells.SpellId
(nullable)

ConsumableDefinitionId
    → ConsumableDefinitions.ConsumableDefinitionId
(nullable)

CARDINALITY
-----------
CombatSessions
└── CombatEffects (1:N)

Spells
└── CombatEffects (1:N)

ConsumableDefinitions
└── CombatEffects (1:N)

PURPOSE
-------
Stores temporary effects that exist
only during combat.

Examples:
- Poison
- Heal Over Time
- Attack Buff
- Defense Buff
- Mana Drain
- Health Drain
- Potion Disable

CORE COLUMNS
------------
CombatEffectId

CombatSessionId

EffectType
(
DamageOverTime,
HealOverTime,
AttackBuff,
DefenseBuff,
SpellPowerBuff,
AttackDebuff,
DefenseDebuff,
SpellPowerDebuff,
ManaDrain,
HealthDrain,
PotionDisable
)

TargetType
(
Character,
Monster
)

SourceType
(
Spell,
Consumable,
System
)

SpellId
ConsumableDefinitionId

Value

RemainingTurns

AppliedAt

CreatedAt

INDEXES
-------
PK_CombatEffectId

IX_CombatEffects_CombatSessionId

IX_CombatEffects_EffectType

IX_CombatEffects_TargetType

BUSINESS RULES
--------------
- Effects only exist during combat
- Effects are deleted when combat ends
- Effects do not stack
- Reapplying refreshes duration
- Server calculates all effect resolution