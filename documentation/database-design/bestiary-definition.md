# Bestiary System

## Overview

The Bestiary is a monster encyclopedia and tracking system.

The Bestiary exists to:

- Record encountered monsters
- Track kill statistics
- Display monster information
- Display loot information
- Track Task Boss progress
- Support collection-oriented gameplay

The Bestiary is an informational system.

It does not provide progression power or direct rewards.

All progression rewards tied to monsters are handled through:

- Achievements
- Task Bosses
- Loot Drops

---

# Core Rules

## Character-Based Progression

Bestiary progress is character-specific.

Each character maintains its own:

- Unlocked Monsters
- Kill Counts
- First Kill Dates
- Last Kill Dates
- Task Progress

Bestiary progress is not shared between characters.

---

## Unlocking

A monster is unlocked immediately after the first kill.

Example:

Kill Rat

↓

Rat appears in Bestiary

Once unlocked:

- All information becomes visible immediately
- No further discovery process exists
- No research mechanics exist

---

## Discovery Philosophy

The Bestiary does not use progressive discovery.

There are no hidden statistics after unlocking.

The player immediately gains access to:

- Full monster information
- Combat statistics
- Ability information
- Loot information

The system prioritizes clarity over mystery.

---

# Displayed Information

Every unlocked Bestiary entry displays:

## Identity

- Name
- Artwork
- Description
- Family

---

## Progression

- Monster Level

---

## Combat Statistics

- Health
- Attack
- Defense
- Spell Power

---

## Abilities

All monster abilities are displayed.

Examples:

- Fireball
- Poison
- Heal
- Heal Over Time
- Mana Drain
- Health Drain
- Potion Disable

---

## Loot Information

Displays:

- Equipment Drops
- Material Drops
- Other Loot

The Bestiary shows available rewards after unlock.

---

# Tracking

The Bestiary permanently tracks monster statistics.

## Kill Count

Examples:

Rat:
521 Kills

Wolf:
104 Kills

Dragon:
12 Kills

---

## First Kill Date

Stores:

- First time the monster was defeated

---

## Last Kill Date

Stores:

- Most recent time the monster was defeated

---

## Character Scope

Tracking is maintained separately for every character.

Different characters do not share Bestiary statistics.

---

# Task Boss Integration

The Bestiary tracks Task Boss progression.

For monsters tied to Task Bosses, the following information is displayed.

## Requirements

Example:

Rat

Kills:
83 / 100

Task Boss:
Rat King

Status:
Locked

---

After completion:

Rat

Kills:
100 / 100

Task Boss:
Rat King

Status:
Unlocked

---

## Purpose

Task tracking allows players to:

- Monitor progress
- View unlocking requirements
- Track boss availability

The Bestiary serves as the primary interface for Task Boss progression.

---

# Monster Families

Monsters are grouped into Families.

Families are organizational only.

Examples:

## Rats

- Rat
- Plague Rat
- Giant Rat

---

## Dragons

- Dragon
- Dragon Lord
- Ancient Dragon

---

## Vampires

- Vampire
- Vampire Bride
- Vampire Lord

---

Families provide:

- Better organization
- Easier navigation
- Collection tracking

Families do not provide bonuses or progression benefits.

---

# Bestiary Completion

The Bestiary tracks collection progress.

Examples:

- 15 / 100 Monsters
- 67 / 100 Monsters
- 100 / 100 Monsters

Progress is based on:

- Unique monster entries unlocked

Progress is not based on kill count.

---

## Completion Formula

Bestiary Completion % =
Unlocked Monsters
/
Total Monsters

---

# Profile Integration

Character Profiles display Bestiary progression.

Displayed values may include:

- Bestiary Completion %
- Total Monsters Unlocked
- Total Monsters Killed

Examples:

Bestiary:
74 / 100

Total Kills:
31,582

---

# Monster Types

The Bestiary supports all monster categories.

## Normal Monsters

Standard progression enemies.

Examples:

- Rat
- Wolf
- Spider
- Bear

---

## Mini Bosses

Stronger variants of selected monsters.

Examples:

- Rat Champion
- Spider Queen
- Troll Chief

---

## Task Bosses

Bosses unlocked through kill progression.

Examples:

- Rat King
- Wolf Alpha
- Vampire Lord

---

## Daily Bosses

Rotating endgame encounters.

Examples:

- Ancient Dragon
- Shadow Lord
- Infernal King
- Frost Titan

---

Each monster type has its own:

- Statistics
- Artwork
- Loot Tables
- Abilities
- Cooldowns

All monster types appear in the Bestiary.

---

# Bestiary Rewards

The Bestiary provides no direct rewards.

The system grants:

- No Gold
- No Equipment
- No Consumables
- No Permanent Bonuses

The Bestiary is informational only.

Monster-related rewards come from:

- Achievements
- Task Boss Systems
- Combat Rewards
- Loot Drops

---

# Statistics Usage

Bestiary data supports multiple game systems.

Tracked kill counts may be used by:

- Achievements
- Task Boss Progression
- Character Statistics
- Profile Displays

Example:

Rat:
500 Kills

Used for:

- Achievement Progress
- Task Boss Unlocks
- Lifetime Statistics
- Bestiary Tracking

---

# Completionist Support

The Bestiary acts as a collection system.

Players may pursue:

- First Encounters
- Full Monster Collection
- Family Completion
- Complete Bestiary Unlocks

The system complements:

- Achievements
- Holy Grail
- Collection Progression

Without providing direct power.

---

# Database Structure

## BestiaryEntries

Stores:

- Character ID
- Monster ID
- Unlock Date

---

## BestiaryStatistics

Stores:

- Monster Kill Count
- First Kill Date
- Last Kill Date

---

# Design Philosophy

The Bestiary exists to provide:

Monster Discovery

↓

Monster Information

↓

Monster Tracking

↓

Collection Progress

The system is intentionally:

- Simple
- Informative
- Completion-Oriented

The Bestiary should help players understand the game world and track their accomplishments without becoming a progression system itself.

Progression remains tied to:

- Combat
- Loot
- Achievements
- Task Bosses

rather than Bestiary completion itself.
`