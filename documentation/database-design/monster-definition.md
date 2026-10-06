# Monster Definition
## Tibia Browser RPG

---

# 1. Overview

Defines every:

- Monster
- Mini Boss
- Task Boss
- Daily Boss

All content is database-driven.

No formulas generate monster statistics.

Every monster is manually balanced.

---

# 2. Identity

## Monster ID

Unique internal identifier.

---

## Name

Globally unique.

Examples:

Rat

Wolf

Skeleton Archer

Ancient Dragon

No duplicate names are allowed.

---

## Description

Short lore description.

Displayed in:

- Monster Details
- Bestiary

---

## Artwork

Every monster has its own artwork.

Examples:

Rat

Plague Rat

Rat King

All use separate artwork.

---

## Family

Single family assignment.

Examples:

- Rat
- Wolf
- Vampire
- Dragon
- Skeleton

No hierarchy exists.

Relationship:

Family

↓

Monster

Each monster belongs to exactly one family.

---

# 3. Progression

## Monster Level

Defines:

- Accessibility
- Loot Progression
- Material Progression

Requirement:

Character Level ≥ Monster Level

---

## Loot Level Modifier

Default:

0

Possible values:

- Negative
- Positive

Examples:

0

+5

+10

+20

Used during loot generation.

---

## Power Score

Hidden value.

Used for:

- Analytics
- Balancing
- Internal Comparisons

Not visible to players.

---

# 4. Combat Statistics

Every monster stores:

- Health
- Attack
- Defense
- Spell Power

Examples of Spell Power:

100%

125%

200%

---

## Cooldown

Stored in seconds.

Examples:

10

60

300

Cooldown is tracked per player.

Every player has independent cooldown tracking.

---

# 5. Ability System

## Ability Chance %

Every turn:

Roll Ability Chance.

Success:

→ Cast Ability

Failure:

→ Basic Attack

Examples:

0%

25%

50%

100%

---

## Abilities

Abilities are assigned from a shared ability database.

Examples:

- Fireball
- Damage Over Time
- Heal
- Heal Over Time
- Mana Drain
- Health Drain
- Potion Disable

---

## Ability Selection

Abilities use weighted random selection.

Example:

Fireball:

70

Heal:

20

Mana Drain:

10

Result:

70% Fireball

20% Heal

10% Mana Drain

---

## Ability Count

Unlimited abilities may be assigned to a monster.

All assignments are database-driven.

---

## Ability Scaling

Abilities are generic templates.

Example:

Fireball

Damage scales through Monster Spell Power.

There are no separate spell records such as:

- Fireball I
- Fireball II
- Fireball III

---

# 6. Loot Settings

## Gold Rewards

Every monster stores:

- Gold Min
- Gold Max

---

## Equipment Drop Chance

Controls chances for:

- Weapon
- Helmet
- Armor
- Shield
- Legs
- Boots

---

## Jewelry Drop Chance

Controls chances for:

- Rings
- Amulets

Independent from equipment.

---

## Other Loot Chance

Controls:

- Materials
- Potions
- Blessings
- Boosts
- Protection Stones

---

## Unique Modifier

Default:

1.0

Examples:

Rat:

1.0

---

Mini Boss:

2.0

---

Task Boss:

5.0

---

Daily Boss:

10.0

Applied together with the Unique Pity System.

---

# 7. Task Boss Links

## Task Boss ID

Optional field.

Links a monster to its Task Boss.

Example:

Rat

→ Rat King

---

## Required Kills

Number of kills required to unlock the Task Boss.

Examples:

100

500

1000

Fully database-driven.

---

# 8. Bestiary

## Unlock Condition

First Kill

Example:

Kill Rat

↓

Rat unlocked in Bestiary

Once unlocked, all information becomes visible immediately.

There is no progressive discovery system.

---

## Displayed Information

Each Bestiary entry displays:

- Name
- Artwork
- Description
- Monster Family
- Monster Level
- Health
- Attack
- Defense
- Spell Power
- Abilities
- Loot Table
- Material Drops

All information becomes visible immediately after unlock.

---

## Tracking

The Bestiary permanently tracks:

- Kill Count
- First Kill Date
- Last Kill Date

Examples:

Rat:

521 Kills

Wolf:

104 Kills

Dragon:

12 Kills

Tracking is character-specific.

---

## Task Boss Progress

The Bestiary displays Task Boss progress.

Example:

Rat

Kills:

83 / 100

Task Boss:

Rat King

Status:

Locked

---

Rat

Kills:

100 / 100

Task Boss:

Rat King

Status:

Unlocked

Task progress is displayed directly on the monster entry.

---

## Monster Families

Monsters are grouped by Family.

Examples:

Rats

- Rat
- Plague Rat
- Giant Rat

---

Dragons

- Dragon
- Dragon Lord
- Ancient Dragon

---

Vampires

- Vampire
- Vampire Bride
- Vampire Lord

Families are used for organization only.

---

## Bestiary Completion

The Bestiary tracks collection progress.

Examples:

15 / 100

67 / 100

100 / 100

Progress measures unlocked monster entries.

---

## Profile Integration

Character Profiles display:

- Bestiary Completion %
- Total Monsters Unlocked
- Total Monsters Killed

Examples:

Bestiary:

74 / 100

Total Kills:

31,582

---

## Rewards

The Bestiary provides:

- No Gold
- No Items
- No Consumables
- No Permanent Bonuses

The Bestiary is informational only.

Monster-related rewards come from:

- Achievements
- Task Bosses
- Loot Drops

---

# 9. Monster Types

Available Monster Types:

- Normal Monster
- Mini Boss
- Task Boss
- Daily Boss

All are stored as independent database records.

Examples:

Rat

Plague Rat

Rat King

Ancient Rat Emperor

Each has its own:

- Stats
- Loot
- Cooldowns
- Abilities
- Artwork

---

# 10. Database

## BestiaryEntries

Stores:

- Character
- Monster
- Unlock Date

---

## BestiaryStatistics

Stores:

- Monster Kill Count
- First Kill Date
- Last Kill Date

---

# 11. Content Philosophy

Every monster is a unique entity.

Examples:

- Rat
- Wolf
- Spider
- Bear

Not:

- Rat Level 1
- Rat Level 5
- Rat Level 10

Target Content:

- Approximately 100 Unique Monsters
- 10-15 Mini Bosses
- Multiple Task Bosses
- Multiple Daily Bosses

Each monster should feel distinct and collectible.

---

# 12. Design Philosophy

The Bestiary exists to provide:

Monster Discovery

↓

Monster Information

↓

Monster Tracking

↓

Collection Progress

The system is intended to be:

- Simple
- Informative
- Completion-Oriented

without providing additional character power.

---

# 13. Tracking Philosophy

Per Character:

Monster Kill Count

Examples:

Rat:

500

Wolf:

120

Dragon:

7

Used for:

- Achievements
- Task Bosses
- Statistics
- Bestiary

---

# 14. Monster Philosophy

Every monster is manually defined.

Every monster has its own:

- Name
- Artwork
- Stats
- Abilities
- Loot
- Identity

The goal is for every monster to feel like a unique piece of content rather than a scaled version of another monster.