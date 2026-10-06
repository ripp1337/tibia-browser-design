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
- Permanent rewards from completed achievements apply to every character belonging to the account
- Permanent rewards also apply to characters created after the achievement was completed
- RewardAttack and RewardDefense are flat values
- RewardGoldPercent and RewardExperiencePercent are percentage values
- Percentage rewards from multiple completed achievements are added together
- Only completed achievements provide permanent rewards
- Achievement rewards are resolved dynamically through the character owner's AccountId
- Achievement rewards are not copied into character records
- RewardAttack and RewardDefense are flat modifiers.
- RewardGoldPercent and RewardExperiencePercent are percentage-point modifiers.
- Percentage achievement rewards affecting the same statistic are combined additively.
- Completed achievement bonuses are inputs to the authoritative Effective Character Statistics calculator.