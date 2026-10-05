ENTITY: MonsterTasks

PRIMARY KEY
-----------
MonsterTaskId

FOREIGN KEYS
------------
MonsterId → Monsters.MonsterId
BossId → Bosses.BossId

UNIQUE CONSTRAINTS
------------------
MonsterId

CARDINALITY
-----------
Monsters
└── MonsterTasks (1:N)

Bosses
└── MonsterTasks (1:N)

PURPOSE
-------
Stores task boss unlocking requirements.

CORE COLUMNS
------------
MonsterTaskId

MonsterId
BossId

RequiredKills

ReunlockGoldCost

CreatedAt
UpdatedAt

INDEXES
-------
PK_MonsterTaskId

UX_MonsterTasks_MonsterId

IX_MonsterTasks_BossId