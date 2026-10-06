# Character System

## Overview

The Character is the primary progression entity in the game.

Each character progresses independently and maintains its own:

- Level
- Experience
- Equipment
- Resources
- Inventory
- Spell Progression
- Crafting Progression
- Gathering Progression
- Statistics

The game uses a classless character system.

Players define their builds through:

- Equipment
- Spells
- Progression Choices
- Resource Management

---

## Character Philosophy

The game is built around a classless progression model.

There are:

- No Classes
- No Skill Trees
- No Attribute Allocation

Character strength is derived primarily from:

- Equipment
- Spell Selection
- Spell Mastery
- Crafting Support
- Resource Optimization

Character Levels provide progression, but equipment remains the primary source of power.

---

## Character Slots

### Account Limits

Maximum Characters Per Account:

- 3

Every character progresses independently.

### Character Names

Character names are globally unique.

No two characters may share the same name.

### Character States

Characters may exist in one of two states:

#### Active

Fully playable.

#### Archived

Archived characters become view only.

Archiving frees a character slot.

Progress is never deleted through archiving.

---

## Character Progression

### Character Level

Character Level is the primary progression metric.

Characteristics:

- Infinite Levels
- Infinite Progression
- Tibia-Inspired Experience Curve
- Combat-Focused Experience Gain

Experience requirements continue indefinitely through a custom scaling formula.

Level progression is intended to take months rather than days.

### Example Experience Milestones

| Level | Total Experience |
|---:|---:|
| 1 | 0 |
| 2 | 100 |
| 3 | 200 |
| 8 | 4,200 |
| 20 | 98,800 |
| 40 | 917,800 |
| 50 | 1,847,300 |
| 100 | 15,694,800 |

These values serve as progression anchors.

The experience curve continues infinitely.

---

## Character Resources

The character maintains both current and maximum values for each resource.

### Health

Determines survival during combat.

### Mana

Required for spell casting.

### Energy

Required to initiate combat.

Controls active progression speed.

### Resource Rules

Resources regenerate online and offline.

Resources may never exceed their maximum values.

Energy may additionally be restored through Energy Potions.

---

## Base Statistics

All characters begin with the following base values:

| Statistic | Base value |
|---|---:|
| Health | 180 |
| Mana | 35 |
| Attack | 7 |
| Defense | 7 |
| Spell Power | 100 |
| Energy | 100 |

Spell Power is stored as the flat numeric value `100` and displayed to players as `100%`.

These values are modified through:

- Levels
- Equipment
- Spells
- Buffs
- Progression Systems

---

## Effective Statistic Value Types

The effective character statistics system uses exactly two modifier categories.

### Flat Statistics

The following statistics always use flat numeric values:

- Attack
- Defense
- Spell Power
- Maximum Health
- Maximum Mana
- Maximum Energy

All contributions to these statistics are added directly.

Example:

```text
Base Attack: 7
Equipment Attack: 50
Affix Attack: 15
Set Attack: 10
Buff Attack: 20
Debuff Attack: -12

Effective Attack:
7 + 50 + 15 + 10 + 20 - 12 = 90
```

No percentage-based modifiers exist for Attack, Defense, Spell Power, Maximum Health, Maximum Mana, or Maximum Energy.

Spell Power uses a flat numeric representation. Its base value is `100`, displayed to players as `100%`.

Example:

```text
Base Spell Power: 100
Equipment Spell Power: 20
Affix Spell Power: 15

Effective Spell Power:
100 + 20 + 15 = 135
Displayed value: 135%
```

A `+20 Spell Power` modifier adds 20 directly to the Spell Power value. It does not multiply the existing value by 20%.

### Percentage Bonuses

Only the following effective statistics use percentage-point values:

- Gold Bonus
- Experience Bonus

Gold and Experience bonuses are never flat values.

All percentage bonuses from equipment, affixes, set bonuses, achievements, permanent bonuses, and active boosts are added together.

Example:

```text
Equipment Gold Bonus: 5%
Affix Gold Bonus: 8%
Achievement Gold Bonus: 2%
Active Gold Boost: 10%

Effective Gold Bonus:
5% + 8% + 2% + 10% = 25%
```

Percentage bonuses are additive, not multiplicative.

The final accumulated bonus is applied once:

```text
finalReward = floor(baseReward * (100 + effectiveBonusPercent) / 100)
```

Example:

```text
Base Gold Reward: 100
Effective Gold Bonus: 25%

Final Gold Reward:
floor(100 * 125 / 100) = 125
```

Gold and Experience rewards are rounded down only when the final reward is calculated.

---

## Level Rewards

Every level grants:

- +30 Maximum Health
- +15 Maximum Mana

These rewards apply automatically.

---

## Energy Progression

Energy grows at milestone intervals.

### Rules

- Base Energy is 100.
- Characters below level 20 have 100 maximum Energy.
- Reaching level 20 grants 10 maximum Energy.
- Starting from level 30, every 10 levels grant 5 maximum Energy.
- Maximum Energy cannot exceed 200.
- Level progression does not increase maximum Energy beyond level 200.

### Formula

```text
if level < 20:
    maximumEnergy = 100
else:
    maximumEnergy = min(
        200,
        110 + floor((level - 20) / 10) * 5
    )
```

### Examples

| Character Level | Maximum Energy |
|---:|---:|
| 1 | 100 |
| 19 | 100 |
| 20 | 110 |
| 30 | 115 |
| 40 | 120 |
| 50 | 125 |
| 100 | 150 |
| 150 | 175 |
| 200 | 200 |
| 201 and above | 200 |

### Design Intent

Energy increases slowly because it controls the pace of active gameplay.

The exceptional 10-point increase at level 20 establishes the first Energy milestone. Every later milestone grants a regular 5-point increase until the hard maximum of 200 is reached at level 200.

---

## Level Milestone Rewards

Certain levels grant one-time rewards.

### Level 8

- 1,000 Gold
- 1 Random Rare Item

### Level 20

- 10,000 Gold
- Small Gold Boost
- Small Experience Boost
- 2 Random Epic Items

### Level 30

- 10,000 Gold
- Small Gold Boost
- Small Experience Boost
- 1 Random Epic Item

### Level 50

- 50,000 Gold
- Medium Gold Boost
- Medium Experience Boost
- 2 Random Epic Items

### Level 75

- 100,000 Gold
- Large Gold Boost
- Large Experience Boost
- 1 Random Legendary Item

### Level 100

- 200,000 Gold
- 5 Large Gold Boosts
- 5 Large Experience Boosts
- 2 Random Legendary Items

---

## Spell Mastery

Spell Mastery is a separate progression system.

Progression flow:

```text
Cast Spell
-> Gain Spell Mastery Experience
-> Increase Spell Mastery Level
```

Characteristics:

- Infinite Progression
- Independent Experience Curve
- Separate From Character Level
- Long-Term Progression System

Spell Mastery increases:

- Spell Effectiveness
- Spell Scaling
- Overall Spell Power

Base Spell Power is 100. Additional flat Spell Power is gained through Spell Mastery progression.

---

## Spell Slots

Characters begin with one Spell Slot.

Additional slots may be permanently unlocked.

Maximum:

- 3 Active Spell Slots

Rules:

- The same spell cannot occupy multiple slots.
- All slots are permanent unlocks.
- Spell loadouts are intended to be situational.

### Slot 2

Requirements:

- Level 20
- 10,000 Gold

### Slot 3

Requirements:

- Level 50
- 100,000 Gold

---

## Equipment Loadouts

Characters may save equipment presets.

Maximum:

- 3 Loadouts

Examples:

- Combat Loadout
- Boss Loadout
- Gold Farming Loadout

Loadouts allow rapid build switching.

---

## Inventory Expansion

- Default Inventory: 50 Slots
- Maximum Inventory: 100 Slots
- Expansion: +50 Slots
- Cost: 1,000,000 Gold

---

## Permanent Upgrades

Permanent upgrades are character specific.

Examples:

- Promotion
- Spell Slot Unlocks
- Crafting Slot Unlocks
- Inventory Expansion

Permanent upgrades never transfer between characters.

---

## Promotion

Promotion is a one-time permanent upgrade.

### Requirements

- Level 20
- 20,000 Gold

### Benefits

Promotion reduces experience loss on death:

- Default: 10% of Total Experience
- Promoted: 8% of Total Experience

Promotion is permanent.

---

## Death Rules

Death has meaningful progression consequences.

On death, the character loses experience.

Experience loss:

- Default: 10% of Total Experience
- Promoted: 8% of Total Experience
- Blessed: further reduced by Blessing effects

Consequences may include:

- Experience Loss
- Level Loss
- Multiple Levels Lost
- Permanent Progress Removal

Death penalties are intended to remain meaningful.

---

## Character Statistics

Characters permanently track lifetime statistics.

Examples:

- Total Playtime
- Total Gold Earned
- Total Gold Spent
- Highest Gold Ever Owned
- Total Monsters Killed
- Total Daily Bosses Killed
- Total Deaths
- Total Damage Dealt
- Total Damage Taken
- Total Healing Done
- Total Mana Spent
- Highest Physical Hit
- Highest Spell Hit
- Strongest Monster Killed
- Strongest Boss Killed
- Longest No-Death Streak

Statistics are permanent.

---

## Character Profile

Every character has a public profile.

Displayed information includes:

- Name
- Level
- Experience
- Equipment
- Statistics
- Achievement Progress
- Holy Grail Progress
- Bestiary Progress
- Season History

---

## Character Ownership

Characters are fully isolated progression entities.

The following are not shared between characters:

- Gold
- Equipment
- Materials
- Inventory
- Spell Progression
- Crafting Progression
- Gathering Progression

Each character must progress independently.

---

## Relationship With Account Systems

Most progression is character-specific. Only a limited number of systems are account-wide.

### Account-Wide Systems

- Achievements
- Achievement Score
- Holy Grail Progress
- Outfit Collection
- Addon Collection
- Friends

### Character-Specific Systems

- Levels
- Experience
- Equipment
- Resources
- Gold
- Inventory
- Spell Mastery
- Crafting Progression
- Gathering Progression
- Statistics

---

## Seasonal Interaction

Characters participate in seasonal progression.

At season end:

- Character is transferred to Non-Ladder.
- Character remains fully playable.
- Character progression is preserved.

Transferred data includes:

- Levels
- Experience
- Equipment
- Gold
- Inventory
- Spell Mastery
- Crafting Level
- Gathering Level
- Statistics

Nothing on the character is reset during transfer.

---

## Design Philosophy

The Character System exists to provide:

```text
Character
-> Combat
-> Loot
-> Optimization
-> Long-Term Progression
```

The game is intentionally designed around:

- Classless Builds
- Equipment-Based Power
- Long-Term Character Growth
- Meaningful Death Consequences
- Independent Character Progression

The strongest characters should be determined by:

- Smart Equipment Choices
- Efficient Progression
- Resource Management
- Economic Decisions

Character strength should not be determined by time played alone.
