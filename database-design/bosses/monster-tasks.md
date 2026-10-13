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

## M6 TASK BOSS TRANSITIONS

Task progress is advanced only by Victory against the configured progress monster while the task status is `ACTIVE`.

When progress reaches `RequiredKills`, the status becomes `UNLOCKED`.

Victory against the associated Task Boss changes the progress record from `UNLOCKED` to `WAITING_FOR_REUNLOCK`.

Task Boss encounters do not receive the Normal Monster or Mini Boss cooldown.
