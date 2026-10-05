ENTITY: MonsterAbilityWeights

PRIMARY KEY
-----------
MonsterAbilityWeightId

FOREIGN KEYS
------------
MonsterAbilityId
    → MonsterAbilities.MonsterAbilityId

CARDINALITY
-----------
MonsterAbilities
└── MonsterAbilityWeights (1:N)

PURPOSE
-------
Stores weighted random selection data
for monster abilities.

CORE COLUMNS
------------
MonsterAbilityWeightId

MonsterAbilityId

Weight

CreatedAt

INDEXES
-------
PK_MonsterAbilityWeightId

IX_MonsterAbilityWeights_MonsterAbilityId