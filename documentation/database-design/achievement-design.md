## Achievement System

### Overview
  
Achievements provide long-term objectives and additional goals outside of normal progression.  
The system exists to:
- Reward long-term play
- Encourage exploration of all game systems
- Track player accomplishments
- Provide small progression bonuses
- Support completionist playstyles  
Achievements are not intended to become a primary source of character power.  
Character strength should continue to come primarily from:
- Levels
- Equipment
- Crafting
- Loot
- Economy  
Achievements provide minor supplemental rewards only.

## Core Rules

### Account-Wide Progression
  
Achievements are account-wide.  
Achievement progress:
- Never resets
- Persists through seasons
- Persists across all characters  
The following are account-wide:
- Achievement Progress
- Achievement Score
- Achievement Unlocks
- Permanent Achievement Bonuses

### Account-Wide Achievement Rewards
  
Permanent bonuses from completed achievements apply to every character belonging to the Account.  
This includes:
- Characters that existed when the achievement was completed
- Characters created after the achievement was completed
- Active characters
- Archived characters when their statistics are displayed
- Seasonal characters
- Non-Ladder characters  
Achievement bonuses are resolved dynamically through the character owner's AccountId.  
The Effective Character Statistics calculator:
- Resolves the character's AccountId
- Reads completed Achievement Progress records for that Account
- Uses the reward values from the completed Achievement definitions
- Sums all completed Achievement bonuses
- Applies the totals to the requested character  
Achievement bonuses are not copied into character records.  
Creating a new character does not duplicate or transfer Achievement Progress.  
The new character automatically benefits from all Achievements already completed by the Account.  
Supported permanent statistic bonuses:
- Flat Attack
- Flat Defense
- Gold gain percentage points
- Experience gain percentage points  
Attack and Defense bonuses are flat values.  
Gold and Experience bonuses are percentage values.  
Percentage bonuses from multiple completed Achievements are added together.  
Only completed Achievements provide permanent bonuses.

### Automatic Completion
  
Achievements are awarded automatically.  
Rules:
- No manual claiming
- Rewards granted immediately upon completion
- Progress tracked automatically

### Achievement Score
  
Every achievement grants Achievement Points.

#### Formula
  
Total Achievement Score =
Sum of All Achievement Points

#### Purpose
  
Achievement Score exists for:
- Completion tracking
- Prestige
- Achievement leaderboards
- Long-term goals  
Achievement Score does not directly affect character power.

## Reward Philosophy
  
Achievement rewards should remain small.  
Example rewards:
- +1 Attack
- +1 Defense
- +1% Gold Gain
- +1% Experience Gain
- -5% Vendor Prices  
Achievements should support progression rather than define it.  
The primary power sources remain:
- Character Levels
- Equipment
- Crafting
- Economy

## Reward Types
  
Possible reward categories:

### Permanent Bonuses
  
Examples:
- Attack bonuses
- Defense bonuses
- Gold gain bonuses
- Experience gain bonuses
- Vendor discount bonuses

## Achievement Bonus Aggregation

Percentage bonuses granted by completed achievements are permanent and
account-wide.

Achievement percentage bonuses affecting the same statistic are combined
additively with one another and with percentage modifiers from equipment,
item affixes, set bonuses, permanent bonuses, buffs, and debuffs.

Example:

Achievement Gold Bonus: +2%
Equipment Gold Bonus: +20%
Set Gold Bonus: +5%
Total Gold Bonus: +27%

Achievement percentage bonuses are never multiplied by other percentage
modifiers.

### Gold
  
Achievements may grant gold rewards.

### Achievement Points
  
Every achievement grants Achievement Points.

### Restricted Rewards
  
Achievements do not grant:
- Equipment
- Cosmetics
- Seasonal power rewards
- Exclusive gameplay advantages

## Achievement Categories
  
The achievement list should remain relatively small and meaningful.  
Categories include:
- Combat
- Bosses
- Levels
- Gold
- Crafting
- Gathering
- Sets
- Uniques
- Deaths
- Hardcore Progression
- Collection Progression
- Daily Bosses

## Combat Achievements
  
Track total monsters killed.

### Tier 1
  
Requirement:
- Kill 100 Monsters  
Rewards:
- Achievement Points
- Small permanent bonus

### Tier 2
  
Requirement:
- Kill 10,000 Monsters  
Rewards:
- Achievement Points
- Small permanent bonus

### Tier 3
  
Requirement:
- Kill 100,000 Monsters  
Rewards:
- Achievement Points
- Small permanent bonus

## Boss Achievements
  
Each boss has its own achievement.  
Examples:
- Kill Rat King
- Kill Wolf Alpha
- Kill Vampire Lord
- Kill Ancient Dragon  
Primary reward:
- Achievement Points  
Boss achievements generally do not require permanent power rewards.

## Daily Boss Achievements
  
Example milestone:

### Defeat 100 Daily Bosses
  
Rewards:
- Achievement Points
- Small permanent bonus  
Additional milestones may be added later.

## Level Achievements
  
Major level milestones grant achievements.

### Level 8
  
Achievement unlocked.  
Rewards:
- Achievement Points
- Small permanent bonus

### Level 20
  
Achievement unlocked.  
Rewards:
- Achievement Points
- Small permanent bonus

### Level 100
  
Achievement unlocked.  
Rewards:
- Achievement Points
- Small permanent bonus

## Gold Achievements
  
Three independent gold categories exist.

### Gold Earned
  
Tracks total gold generated.  
Example milestones:
- Earn 10,000 Gold
- Earn 1,000,000 Gold
- Earn 100,000,000 Gold

### Gold Spent
  
Tracks total gold removed from inventory.  
Example milestones:
- Spend 10,000 Gold
- Spend 1,000,000 Gold
- Spend 100,000,000 Gold

### Gold Owned
  
Tracks highest amount of gold owned at one time.  
Example milestones:
- Own 100,000 Gold
- Own 1,000,000 Gold
- Own 10,000,000 Gold

## Crafting Achievements
  
Track total crafting activity.  
Example milestones:
- Craft 100 Items
- Craft 1,000 Items
- Craft 10,000 Items  
Rewards:
- Achievement Points
- Small permanent bonuses

## Gathering Achievements
  
Track total gathered resources.  
Example milestones:
- Gather 1,000 Materials
- Gather 10,000 Materials
- Gather 100,000 Materials  
Rewards:
- Achievement Points
- Small permanent bonuses

## Death Achievements
  
Track total character deaths.  
Example milestones:
- First Death
- 10 Deaths
- 100 Deaths
- 1,000 Deaths  
Purpose:
- Statistics
- Completion progress  
Rewards:
- Primarily Achievement Points

## Hidden Achievements
  
A small number of secret achievements exist.  
These achievements remain hidden until completed.  
Example hidden achievements:
- Die 100 Times
- Use 1,000 Potions
- Survive a fight with 1 HP
- Other hidden objectives  
Rewards:
- Achievement Points
- Small bonuses

## Hardcore Achievements
  
Hardcore achievements track progression without dying.

### Reach Level 20 Without Dying
  
Achievement unlocked.  
Rewards:
- Achievement Points
- Unique achievement entry

### Reach Level 50 Without Dying
  
Achievement unlocked.  
Rewards:
- Achievement Points
- Unique achievement entry

### Reach Level 100 Without Dying
  
Achievement unlocked.  
Rewards:
- Achievement Points
- Unique achievement entry  
Hardcore achievements are intended as prestigious long-term goals.  
They must not grant game-breaking bonuses.

## Holy Grail Integration
  
The Achievement System integrates with the Holy Grail collection system.  
Holy Grail permanently tracks discovery of:
- Unique Items
- Set Items  
Progress remains even if items are:
- Sold
- Salvaged
- Destroyed
- Lost

## Unique Collection Achievements
  
Example milestones:
- Find First Unique
- Find 10 Unique Items
- Find 25 Unique Items
- Find 50 Unique Items  
Rewards:
- Achievement Points
- Minor bonuses

## Set Collection Achievements
  
Completed sets grant achievements.  
Examples:
- Complete Rat Set
- Complete Vampire Set
- Complete Dragon Set  
Requirements:
- Every set piece must be discovered at least once  
Permanent ownership is not required.  
Rewards:
- Achievement
- Achievement Points

## Ultimate Achievement

### Holy Grail Completion
  
Requirement:
- Discover every Unique Item
- Discover every Set Item  
Characteristics:
- Account-wide
- Permanent
- Tracks total collection completion  
Holy Grail Completion is intended to be one of the most difficult and prestigious objectives in the game.

## Achievement Persistence
  
Achievements never reset.  
The system persists through:
- Character deletion
- Character archiving
- Seasonal resets
- Character transfers to Non-Ladder  
Achievement progress always belongs to the Account.  
Permanent Achievement bonuses apply to every existing and future character belonging to the Account.  
Achievement bonuses are calculated dynamically and are not copied into character records.

## Achievement Data Tracking
  
The system may track progress based on:
- Monster kills
- Boss kills
- Daily boss kills
- Character levels
- Gold earned
- Gold spent
- Gold owned
- Crafted items
- Gathered materials
- Death count
- Unique discoveries
- Set discoveries
- Holy Grail progress
- Hardcore progression

## Character Profile Display
  
Character profiles may display:
- Achievement Score
- Achievement Progress
- Completed Achievements
- Hardcore Achievements
- Collection Achievements

## Design Philosophy
  
Achievements exist to:
- Reward dedication
- Encourage varied gameplay
- Promote exploration of all systems
- Support completionist players  
Achievement progression follows:  
Progress Tracking
→ Prestige
→ Small Bonuses  
Achievements should never replace normal progression.  
Character power should continue to come primarily from:
- Levels
- Equipment
- Crafting
- Economy  
Achievement bonuses must remain intentionally limited to prevent achievements from becoming a mandatory power system.