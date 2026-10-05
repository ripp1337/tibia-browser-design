ENTITY: CharacterMonsterKills

PRIMARY KEY
-----------
CharacterMonsterKillId

FOREIGN KEYS
------------
CharacterId → Characters.CharacterId
MonsterId → Monsters.MonsterId

UNIQUE CONSTRAINTS
------------------
(CharacterId, MonsterId)

CARDINALITY
-----------
Characters
└── CharacterMonsterKills (1:N)

Monsters
└── CharacterMonsterKills (1:N)

PURPOSE
-------
Stores lifetime kill counts per monster.

CORE COLUMNS
------------
CharacterMonsterKillId

CharacterId
MonsterId

KillCount

FirstKillAt
LastKillAt

INDEXES
-------
PK_CharacterMonsterKillId

UX_CharacterMonsterKills_CharacterId_MonsterId

IX_CharacterMonsterKills_CharacterId
IX_CharacterMonsterKills_MonsterId