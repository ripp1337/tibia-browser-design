# Gathering System

## Overview

Gathering is a passive offline progression system designed to support Crafting.

The system exists to provide a consistent source of materials outside of combat.

Gathering complements materials obtained through:

- Monster Loot
- Boss Loot
- NPC Vendors
- Marketplace Trading

Gathering is not intended to be a primary progression path.

Its purpose is to reward offline time and generate materials for crafting.

---

# Gathering Philosophy

Gathering is a support system.

It exists to:

- Reward Offline Time
- Supply Crafting Materials
- Generate Long-Term Value
- Create Steady Resource Income

Gathering should complement active gameplay rather than replace it.

Primary progression should still come from:

- Combat
- Loot
- Boss Encounters
- Economy

---

# Gathering Mastery

## Overview

Gathering has its own dedicated progression track.

Progression is separate from:

- Character Level
- Crafting Level
- Spell Progression

---

## Progression Flow

Gather Materials

↓

Gain Gathering Experience

↓

Increase Gathering Level

↓

Improve Gathering Efficiency

---

## Characteristics

- Independent Progression System
- Separate Experience Track
- Offline Focused
- Finite Progression

Maximum Gathering Level:

- 10

---

# Gathering Level Benefits

Each Gathering Level improves material acquisition.

Benefits include:

- Access To Better Materials
- Higher Success Rates
- Higher Material Quantities

---

## Restrictions

Gathering Levels do not affect:

- Combat
- Loot Quality
- Equipment Power
- Crafting Speed

Gathering progression exists solely to improve material generation.

---

# Gathering Activity

## Overview

Gathering is an offline-only activity.

Players start Gathering before leaving the game.

Once active:

- Gathering runs automatically
- No further interaction is required

---

## Activity Restrictions

While Gathering is active:

- Character Cannot Fight
- Character Cannot Craft
- Character Cannot Perform Other Activities

The character is fully committed to the Gathering session.

---

# Gathering Duration

## Maximum Duration

Maximum Gathering Session:

24 Hours

---

## Examples

Valid sessions include:

- 1 Hour
- 6 Hours
- 12 Hours
- 20 Hours
- 24 Hours

---

## Session Cap

After 24 Hours:

- Gathering Stops Automatically
- No Additional Rewards Accumulate

Players must begin a new session manually.

---

# Gathering Resolution

## Overview

Gathering is processed every 60 seconds.

Each minute is treated as an independent gathering attempt.

---

## Processing Flow

Every Minute:

1. Roll Gathering Success
2. If Successful:
   - Roll Material Type
   - Roll Material Quantity
3. Store Result

Repeat Until:

- Player Logs In
- Session Reaches 24 Hours

---

# Time Calculation Rules

## Completed Minutes Only

Gathering only counts fully completed minutes.

Partial minutes are ignored.

---

## Examples

### Example 1

45 Seconds

Result:

0 Minutes Gathered

---

### Example 2

1 Minute 59 Seconds

Result:

1 Minute Gathered

---

### Example 3

5 Hours 30 Minutes 45 Seconds

Result:

5 Hours 30 Minutes Gathered

---

## Purpose

This rule prevents timing abuse and creates predictable reward calculation.

---

# Gathering Materials

## Overview

Gathering produces crafting materials.

Target Material Count:

Approximately 50 Different Materials

---

## Progression Structure

Materials are progression-based.

Examples:

### Early Game

- Iron Ore

---

### Mid Game

- Steel Piece

---

### Late Game

- Mithril Fragment

---

The system does not use rarity tiers.

Progression comes from unlocking stronger materials over time.

---

# Material Access

## Overview

Available materials depend entirely on Gathering Level.

---

## Examples

### Gathering Level 1

Access to:

- Early Game Materials

---

### Gathering Level 5

Access to:

- Mid Game Materials

---

### Gathering Level 10

Access to:

- High-End Materials

---

## Restrictions

Players cannot gather materials beyond their allowed Gathering Level range.

There are no lucky rolls outside the progression bracket.

Access is deterministic.

---

# Quantity System

## Overview

Successful gathering rolls produce a material quantity.

Quantities are randomly generated within predefined ranges.

---

## Progression Scaling

Higher Gathering Levels improve:

- Success Chance
- Quantity Obtained

Both systems scale together.

---

## Design Goal

The system should provide meaningful growth without introducing unnecessary complexity.

---

# Gathering Experience

## Overview

Gathering Experience is awarded from successful gathering activity.

---

## Progression Source

Gathering progression comes entirely from:

- Gathering Activity

There are no alternative progression methods.

---

## Offline Progression

Experience accumulates while the player is offline.

Rewards are granted when the player collects completed results.

---

# Gathering Storage

## Overview

Gathered materials are stored directly in Material Storage.

Gathering rewards do not use Inventory Space.

---

## Example Storage

Iron Ore:
245 / 999

Steel Piece:
74 / 999

Mithril Fragment:
5 / 999

---

## Stack Limit

Maximum:

999 Per Material Type

---

# Material Usage

Gathered materials primarily support Crafting.

---

## Example Uses

Materials may be used to create:

- Protection Stones
- Blessings
- Energy Potions
- Health Potions
- Mana Potions
- Gold Boosts
- Experience Boosts

---

## Future Expansion

Materials may be utilized by future crafting systems as the game expands.

---

# Cosmetic Boss Materials

## Overview

Certain cosmetic materials remain boss-exclusive.

Examples:

- Dragon Eye
- Royal Crown
- Ancient Skull
- Demon Horn

---

## Uses

These materials support:

- Outfit Crafting
- Addon Crafting
- Cosmetic Collections

---

## Restrictions

Core crafting progression materials are never boss-exclusive.

Players must never be forced to kill a specific boss to access:

- Potions
- Blessings
- Protection Stones
- Energy Potions
- Core Crafting Progression

---

# Gathering Queue

## Overview

The Gathering System does not use queues.

Only a single gathering session may exist at a time.

---

## Flow

Start Gathering

↓

Logout

↓

Gathering Runs

↓

Login

↓

Collect Results

↓

Start New Session

---

Players must manually begin every new gathering session.

---

# Gathering Slots

## Overview

All characters have exactly:

- 1 Gathering Slot

---

## Restrictions

Additional Gathering Slots cannot be purchased.

There are no upgrades that increase gathering capacity.

---

# Gathering Boosts

## Overview

Gathering does not support temporary boosts.

---

## Non-Existing Systems

There are no:

- Gathering Speed Boosts
- Gathering Quantity Boosts
- Gathering Success Boosts

Gathering progression comes exclusively from Gathering Level.

---

# Gathering Completion Notifications

## Overview

When a player logs in after a completed gathering session, a summary notification is displayed.

---

## Example

Gathering Complete

Duration:
12 Hours 15 Minutes

Materials Gathered:

- Iron Ore × 120
- Steel Piece × 38
- Mithril Fragment × 7

[Collect]

---

## Collection Rules

Gathered materials are only granted after collection.

---

# Gathering Cancellation

## Overview

Logging into the game immediately ends the active Gathering session.

---

## Results

The player receives rewards for:

- All Completed Minutes

The player does not receive rewards for:

- Partial Minutes

---

## Penalties

No penalties exist.

No resources are lost.

No progress is removed.

---

# Leaderboards

## Overview

Gathering has no dedicated leaderboard.

---

## Philosophy

Gathering is intentionally treated as a support system rather than a competitive system.

Competition should remain focused on:

- Character Progression
- Combat
- Seasonal Rankings

---

# System Relationships

Gathering supports:

- Crafting
- Economy
- Marketplace Trading
- Consumable Production

Gathering does not directly support:

- Combat Power
- Equipment Progression
- Character Levels

---

# Design Philosophy

The Gathering System exists to create:

Logout

↓

Gather Materials

↓

Return Later

↓

Collect Rewards

↓

Craft Useful Items

The system should be:

- Simple
- Predictable
- Passive
- Low Maintenance

Players should never need to manage:

- Multiple Professions
- Resource Routes
- Gathering Locations
- Optimization Loops

The intended experience is:

Start Gathering

↓

Go Offline

↓

Return Later

↓

Collect Materials

↓

Continue Progression

Gathering should remain a reliable and accessible support system that rewards offline time without competing with active gameplay systems.