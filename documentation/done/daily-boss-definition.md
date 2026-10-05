# Daily Boss System

## Overview

Daily Bosses are powerful once-per-day encounters designed to provide challenging, high-reward content.

The system exists to:

- Create Daily Objectives
- Encourage Preparation
- Reward Efficient Character Building
- Generate Valuable Loot
- Provide High-Risk, High-Reward Gameplay

Daily Bosses are intended to be among the most difficult encounters in the game.

---

# Core Philosophy

Daily Bosses are designed as premium daily content.

They are not intended to be:

- Mandatory Progression
- Efficient Farming Content
- Repeatable Grind Content

They exist to provide:

Preparation

↓

Challenge

↓

Risk

↓

Valuable Rewards

↓

Long-Term Progression

---

# Daily Reset Integration

## Global Daily Reset

Daily Bosses are tied to the game's global daily reset.

At daily reset:

- Daily Boss Rotation Rerolls
- Daily Boss Attempts Reset
- Daily Chests Reset
- Other Daily Activities Reset

All daily systems share the same reset time.

---

# Boss Tier Structure

## Overview

Daily Bosses are divided into three separate tiers.

Each tier targets a different progression stage.

---

## Tier 1

Recommended For:

- Early Game
- Mid Game

---

## Tier 2

Recommended For:

- Mid Game
- Late Game

---

## Tier 3

Recommended For:

- Endgame

---

# Daily Rotation System

## Overview

The active Daily Bosses rotate every day.

At each daily reset:

- One Tier 1 Boss is selected
- One Tier 2 Boss is selected
- One Tier 3 Boss is selected

All players share the same daily rotation.

---

## Example Rotation

Tier 1:

- Rat King

---

Tier 2:

- Vampire Lord

---

Tier 3:

- Ancient Dragon

---

The selected bosses remain active until the next daily reset.

---

# Boss Pools

## Overview

Each tier maintains an independent boss pool.

Boss selection is fully database-driven.

---

## Tier 1 Pool Example

- Rat King
- Wolf Alpha
- Spider Queen
- Troll Chief
- Skeleton Champion

---

## Tier 2 Pool Example

- Vampire Lord
- Orc Warlord
- Demon Knight
- Lizard Emperor

---

## Tier 3 Pool Example

- Ancient Dragon
- Shadow Lord
- Infernal King
- Frost Titan

---

# Attempt System

## Overview

Each active Daily Boss may be challenged once per day.

---

## Daily Limits

Tier 1 Boss:

1 Attempt

---

Tier 2 Boss:

1 Attempt

---

Tier 3 Boss:

1 Attempt

---

Maximum Daily Attempts:

3

One attempt per active boss.

---

# Failure Rules

## On Defeat

If the player loses:

- Attempt Is Consumed
- Combat Ends
- Death Penalties Apply

No retry is allowed until the next daily reset.

---

## Example

Enter Boss

↓

Lose Combat

↓

Death Penalty Applied

↓

Attempt Consumed

↓

Wait For Reset

---

# Victory Rules

## On Success

If the player wins:

- Attempt Is Consumed
- Rewards Are Granted
- Boss Is Marked Completed

The boss cannot be challenged again until reset.

---

## Example

Enter Boss

↓

Win Combat

↓

Receive Rewards

↓

Boss Completed

↓

Wait For Reset

---

# Difficulty Philosophy

## Overview

Daily Bosses are intentionally difficult.

They are designed to be substantially stronger than normal monsters.

---

## Target Strength

Daily Bosses should be approximately:

7x - 10x

the power of an equivalent monster encounter.

---

## Expected Requirements

Successful completion should generally require:

- Strong Equipment
- Potions
- Effective Spell Loadouts
- Preparation
- Resource Management

Daily Bosses are not intended to be easy content.

---

# Recommended Levels

## Overview

Every Daily Boss includes a recommended character level.

Recommendations help players judge difficulty.

They do not restrict access.

---

## Examples

### Tier 1

Recommended Level:

20+

---

### Tier 2

Recommended Level:

70+

---

### Tier 3

Recommended Level:

120+

---

## Access Rules

Players below the recommendation may still attempt the encounter.

Risk remains entirely with the player.

---

# Combat Rules

## Standard Combat

Daily Bosses use the normal combat system.

No special combat framework exists.

---

## Difficulty Sources

Difficulty comes from:

- Higher Health
- Higher Attack
- Higher Defense
- Higher Spell Power
- Stronger Ability Sets

Encounters remain mechanically consistent with the rest of the game.

---

# Reward Philosophy

## Overview

Daily Bosses provide some of the best rewards available in the game.

Rewards should feel valuable even when rare items do not drop.

---

## Improved Rewards

Daily Bosses provide:

- Better Equipment Chances
- Better Rarity Chances
- Higher Loot Levels
- Better Unique Chances
- Better Set Chances
- Better Material Rewards

---

# Equipment Rewards

## Enhanced Loot Generation

Daily Bosses use improved equipment generation rules.

Possible advantages include:

- Higher Item Levels
- Improved Rarity Distribution
- Better Loot Modifiers

All values are database-driven.

---

# Unique & Set Items

## Drop Philosophy

Daily Bosses use improved rates for:

- Unique Items
- Set Items

---

## System Integration

Daily Bosses continue using the standard:

- Unique System
- Set System
- Pity System

---

## Restrictions

Daily Bosses never guarantee:

- Unique Items
- Set Items

Rare rewards remain rare.

---

# Material Rewards

## Overview

Daily Bosses provide superior material rewards.

Benefits may include:

- Larger Quantities
- Higher-Tier Materials
- Cosmetic Components

---

## Progression Materials

Daily Bosses may provide improved access to progression resources.

---

## Cosmetic Materials

Daily Bosses are a major source of cosmetic crafting materials.

---

# Boss Components

## Overview

Daily Bosses may drop exclusive cosmetic components.

Examples:

- Dragon Eye
- Ancient Skull
- Demon Horn
- Royal Crown

---

## Usage

Boss Components are used for:

- Outfit Tokens
- Addon Tokens
- Cosmetic Crafting

---

## Restrictions

Boss Components provide:

- No Combat Power
- No Progression Bonuses
- No Character Statistics

They exist purely for cosmetic progression.

---

# Statistics Tracking

Characters permanently track Daily Boss activity.

---

## Tracked Statistics

- Total Daily Boss Attempts
- Total Daily Boss Victories
- Highest Tier Defeated

---

## Examples

Daily Boss Kills:

174

---

Tier 3 Victories:

52

---

# Profile Integration

Character Profiles may display:

- Total Daily Boss Victories
- Daily Boss Kill Count
- Highest Tier Completed

This provides visible prestige for experienced players.

---

# Achievement Integration

Daily Bosses support the Achievement System.

---

## Example Achievements

### Defeat First Daily Boss

Achievement Unlocked

---

### Defeat 25 Daily Bosses

Achievement Unlocked

---

### Defeat 100 Daily Bosses

Achievement Unlocked

---

### Defeat 500 Daily Bosses

Achievement Unlocked

---

Rewards follow normal Achievement rules.

Examples:

- Achievement Points
- Small Permanent Bonuses

---

# Database Structure

## DailyBossDefinitions

Stores:

- Name
- Tier
- Artwork
- Statistics
- Recommended Level

---

## DailyBossPools

Stores:

- Tier
- Boss Assignments

---

## DailyBossRotation

Stores:

- Current Tier 1 Boss
- Current Tier 2 Boss
- Current Tier 3 Boss
- Reset Timestamp

---

## CharacterDailyBossProgress

Stores:

- Attempts Used
- Victories
- Lifetime Statistics

---

# System Relationships

Daily Bosses interact with:

- Combat
- Loot
- Achievements
- Character Statistics
- Outfits
- Addons
- Holy Grail
- Character Profiles

Daily Bosses function as a high-end extension of the core combat loop.

---

# Design Philosophy

The Daily Boss System exists to create:

Daily Reset

↓

Preparation

↓

Difficult Encounter

↓

Valuable Rewards

↓

Long-Term Progression

Daily Bosses should feel:

- Challenging
- Rewarding
- Prestigious
- Optional

The system should provide meaningful daily goals while ensuring that normal character progression remains possible without mandatory participation in Daily Boss content.