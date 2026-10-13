ENTITY: CharacterCooldowns

### PRIMARY KEY

CharacterCooldownId

### FOREIGN KEYS

CharacterId
→ Characters.CharacterId

TargetId
→ Monsters.MonsterId
(nullable)

Used when CooldownType = Monster

### CARDINALITY

Characters
└── CharacterCooldowns (1:N)

Monsters
└── CharacterCooldowns (1:N)

### UNIQUE CONSTRAINTS

(CharacterId, CooldownType, TargetId)

### PURPOSE

Stores character-specific cooldowns
for monsters, NPC interactions and
future time-gated content.

### CORE COLUMNS

CharacterCooldownId

CharacterId

CooldownType
(
Monster,
NpcHealer
)

TargetId
(nullable)

AvailableAt

CreatedAt
UpdatedAt

### INDEXES

PK_CharacterCooldownId
IX_CharacterCooldowns_CharacterId
IX_CharacterCooldowns_CooldownType
IX_CharacterCooldowns_TargetId
IX_CharacterCooldowns_AvailableAt

### BUSINESS RULES

- Monster cooldowns use:
  CooldownType = Monster
  TargetId = Monsters.MonsterId

- NPC healer cooldowns use:
  CooldownType = NpcHealer
  TargetId = NULL

- One NPC healer cooldown may exist per character

- Character may access content when:
  AvailableAt <= CurrentTime

- Defeating a monster starts a new cooldown

- Using the NPC healer starts a new cooldown

## M6 COMBAT COOLDOWN RULES

A configured monster cooldown is written after terminal settlement for:

- Normal Monsters,
- Mini Bosses.

The cooldown is applied after both Victory and Defeat.

Task Bosses and Daily Bosses are excluded from this monster-cooldown write because their availability is controlled by their own progression or rotation systems.
