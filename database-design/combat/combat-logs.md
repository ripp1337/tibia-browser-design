ENTITY: CombatLogs

PRIMARY KEY
-----------
CombatLogId

FOREIGN KEYS
------------
CharacterId
    → Characters.CharacterId

MonsterId
    → Monsters.MonsterId

CombatSessionId
    → CombatSessions.CombatSessionId

CARDINALITY
-----------
Characters
└── CombatLogs (1:N)

Monsters
└── CombatLogs (1:N)

CombatSessions
└── CombatLogs (1:1)

PURPOSE
-------
Stores completed combat history.

Used for:
- Death review
- Boss review
- Recent combat history

CORE COLUMNS
------------
CombatLogId

CombatSessionId

CharacterId
MonsterId

CombatResult
(
Victory,
Defeat
)

TurnCount

StartedAt
EndedAt

CombatDataJson

CreatedAt

INDEXES
-------
PK_CombatLogId

IX_CombatLogs_CharacterId

IX_CombatLogs_MonsterId

IX_CombatLogs_CreatedAt

BUSINESS RULES
--------------
- Maximum 10 combat logs per character
- Oldest logs are removed automatically
- Logs are immutable
- Logs are generated when combat completes
- CombatDataJson stores full combat replay