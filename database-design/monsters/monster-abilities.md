ENTITY: MonsterAbilities

PRIMARY KEY
-----------
MonsterAbilityId

FOREIGN KEYS
------------
MonsterId → Monsters.MonsterId
SpellId → Spells.SpellId

REFERENCED BY
-------------
MonsterAbilityWeights.MonsterAbilityId

CARDINALITY
-----------
Monsters
└── MonsterAbilities (1:N)

MonsterAbilities
└── MonsterAbilityWeights (1:N)

PURPOSE
-------
Assigns abilities to monsters.

CORE COLUMNS
------------
MonsterAbilityId

MonsterId
SpellId

IsEnabled

CreatedAt

INDEXES
-------
PK_MonsterAbilityId

IX_MonsterAbilities_MonsterId
IX_MonsterAbilities_SpellId