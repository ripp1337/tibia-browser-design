ENTITY: Achievements

PRIMARY KEY
-----------
AchievementId

FOREIGN KEYS
------------
None

REFERENCED BY
-------------
AchievementProgress.AchievementId

CARDINALITY
-----------
Achievements
└── AchievementProgress (1:N)

UNIQUE CONSTRAINTS
------------------
Code
Name

PURPOSE
-------
Stores achievement definitions.

Examples:
- Kill 100 Monsters
- Reach Level 20
- Defeat 100 Daily Bosses
- Complete Vampire Set

CORE COLUMNS
------------
AchievementId

Code

Name
Description

Category
(
  Combat,
  Boss,
  DailyBoss,
  Level,
  Gold,
  Crafting,
  Gathering,
  Death,
  Hardcore,
  Unique,
  Set,
  HolyGrail
)

Points

ObjectiveType

RequiredValue

IsHidden

RewardAttack
RewardDefense
RewardGoldPercent
RewardExperiencePercent

CreatedAt
UpdatedAt

INDEXES
-------
PK_AchievementId

UX_Achievements_Code
UX_Achievements_Name

IX_Achievements_Category

BUSINESS RULES
--------------
- Achievements are account-wide
- Achievements never reset
- Achievements are auto-claimed
- Achievement Score = sum of earned points