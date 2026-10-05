ENTITY: MonsterFamilies

PRIMARY KEY
-----------
MonsterFamilyId

FOREIGN KEYS
------------
None

REFERENCED BY
-------------
Monsters.MonsterFamilyId

CARDINALITY
-----------
MonsterFamilies
└── Monsters (1:N)

UNIQUE CONSTRAINTS
------------------
Name

PURPOSE
-------
Stores monster family definitions.

CORE COLUMNS
------------
MonsterFamilyId

Name
Description

CreatedAt
UpdatedAt

INDEXES
-------
PK_MonsterFamilyId

UX_MonsterFamilies_Name