ENTITY: CombatSessions

### PRIMARY KEY

CombatSessionId

### FOREIGN KEYS

CharacterId
→ Characters.CharacterId

MonsterId
→ Monsters.MonsterId

### CARDINALITY

Characters
└── CombatSessions (1:N)

Monsters
└── CombatSessions (1:N)

CombatSessions
├── CombatEffects (1:N)
├── CombatSpellCooldowns (1:N)
└── CombatLogs (1:1)

### REFERENCED BY

CombatEffects.CombatSessionId
CombatSpellCooldowns.CombatSessionId
CombatLogs.CombatSessionId

### PURPOSE

Stores active and completed combat encounters.
Acts as the authoritative server-side
combat state.

### CORE COLUMNS

CombatSessionId

CharacterId
MonsterId

Status
(
Active,
Victory,
Defeat,
Abandoned
)

CurrentTurn

CharacterHealth
CharacterMana

MonsterHealth

StartedAt
EndedAt

CreatedAt
UpdatedAt

### INDEXES

PK_CombatSessionId
IX_CombatSessions_CharacterId
IX_CombatSessions_MonsterId
IX_CombatSessions_Status

### BUSINESS RULES

- Only one active combat session per character
- Server is authoritative
- Combat state is never trusted from client
- Victory creates CombatLog entry
- Defeat creates CombatLog entry
- Completed sessions become read-only