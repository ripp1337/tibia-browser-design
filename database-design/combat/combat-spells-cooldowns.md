ENTITY: CombatSpellCooldowns

PRIMARY KEY
-----------
CombatSpellCooldownId

FOREIGN KEYS
------------
CombatSessionId
    → CombatSessions.CombatSessionId

SpellId
    → Spells.SpellId

CARDINALITY
-----------
CombatSessions
└── CombatSpellCooldowns (1:N)

Spells
└── CombatSpellCooldowns (1:N)

UNIQUE CONSTRAINTS
------------------
(CombatSessionId, SpellId)

PURPOSE
-------
Stores active spell cooldowns that exist
only during combat.

Tracks which spells are temporarily
unavailable and for how many turns.

CORE COLUMNS
------------
CombatSpellCooldownId

CombatSessionId

SpellId

RemainingTurns

CreatedAt

INDEXES
-------
PK_CombatSpellCooldownId

UX_CombatSpellCooldowns_CombatSession_Spell

IX_CombatSpellCooldowns_CombatSessionId

IX_CombatSpellCooldowns_SpellId

BUSINESS RULES
--------------
- Spell cooldowns only exist during combat
- Cooldowns are tracked independently per spell
- Using a spell creates or refreshes its cooldown
- RemainingTurns decreases at the end of each turn
- A spell may be cast only when no active cooldown exists
- Spell cooldowns are deleted when combat ends
- Cooldowns are never persisted outside combat
- Server is authoritative for cooldown validation