# Database Architecture

## Overview

This document defines the logical data architecture of the game.

It is not a SQL schema.

The purpose of this architecture is to define:

- What information exists
- Where information belongs
- Which systems are Account-Wide
- Which systems are Character-Specific
- Which systems are Global Definitions

The physical database schema is built from this architecture.

---

# Design Philosophy

The architecture follows several fundamental principles.

## Clear Ownership

Every piece of data belongs to exactly one scope:

- Account
- Character
- Global Game Data

---

## Separation of Concerns

Each domain owns its own data.

Examples:

- Combat data belongs to Characters
- Achievement data belongs to Account systems
- Monster definitions belong to Global systems

---

## Extensibility

The architecture should support future expansion without requiring major redesign.

Future systems include:

- Guilds
- PvP
- Parties
- Raids
- Guild Progression

---

## Database-Driven Design

All gameplay systems should be configurable through data.

Examples:

- Monsters
- Bosses
- Loot
- Recipes
- Spells
- Materials
- Achievements

Game content should never require code changes whenever possible.

---

# Data Ownership Model

The game contains three primary ownership layers.

## Account Layer

Stores permanent account-wide progression.

Examples:

- Achievements
- Holy Grail
- Friends
- Outfit Collection

---

## Character Layer

Stores character-specific progression.

Examples:

- Level
- Equipment
- Gold
- Resources
- Skills

---

## Global Layer

Stores game definitions.

Examples:

- Monsters
- Spells
- Recipes
- Materials
- Achievements

These records are shared by all players.

---

# Account Domain

## Purpose

Stores permanent account-level progression.

Account systems survive:

- Seasons
- Character Deletion
- Character Archiving
- Character Transfers

---

## Responsibilities

Stores:

- Login Information
- Achievement Progress
- Achievement Score
- Holy Grail Progress
- Friends
- Outfit Collection
- Addon Collection

---

## Rules

### Username

Required.

---

### Email

Optional.

---

### Character Names

Globally unique.

---

### Achievement Progress

Never resets.

---

### Holy Grail Progress

Never resets.

---

## Tables

### Accounts

Stores account records.

---

### AccountAchievements

Stores achievement ownership and progress.

---

### AccountHolyGrail

Stores collection progress.

---

### AccountFriends

Stores friendship relationships.

---

# Character Domain

## Purpose

Stores all character progression.

Characters are isolated progression entities.

Most gameplay data belongs here.

---

## Identity

Stores:

- Character Name
- Season
- Realm

---

## Progression

Stores:

- Level
- Experience
- Gold

---

## Resources

Current Values:

- Health
- Mana
- Energy

Maximum Values:

- Max Health
- Max Mana
- Max Energy

---

## Progression Systems

Stores:

- Crafting Level
- Crafting XP
- Gathering Level
- Gathering XP
- Spell Mastery

---

## Unlocks

Stores:

- Promotion
- Spell Slots
- Inventory Expansion
- Crafting Slots

---

## Character Statistics

Stores:

- Total Gold Earned
- Total Gold Spent
- Total Playtime
- Total Monster Kills
- Total Boss Kills
- Total Deaths
- Highest Physical Hit
- Highest Spell Hit
- Most Gold Ever Owned
- Strongest Monster Killed
- Strongest Boss Killed
- Longest No-Death Streak

---

## Tables

### Characters

Primary character records.

---

### CharacterStatistics

Lifetime statistics.

---

### CharacterMonsterKills

Monster kill tracking.

---

# Spell Domain

## Purpose

Stores spell definitions and spell progression.

---

## Responsibilities

Stores:

- Spell Definitions
- Character Spell Ownership
- Spell Unlock Information

---

## Rules

- Fixed Spell List
- Purchased With Gold
- Level Requirements
- Maximum 3 Active Slots
- No Duplicate Equipped Spells

---

## Tables

### Spells

Global spell definitions.

---

### CharacterSpells

Owned spells and active loadouts.

---

# Item Domain

## Purpose

Stores equipment definitions and generated item instances.

---

## Static Data

Stores:

- Item Bases
- Affixes
- Sets
- Uniques

---

## Dynamic Data

Stores:

- Generated Items

---

## Item Instance Data

Every item stores:

- Item Base
- Item Level
- Rarity
- Affixes
- Roll Values
- Owner

---

## Additional State

Stores:

- Equipped State
- Locked State

---

## Rules

- No Durability
- No Ownership History
- No Upgrade History

---

## Tables

### ItemBases

Static equipment definitions.

---

### Affixes

Affix definitions.

---

### Sets

Set definitions.

---

### Uniques

Unique item definitions.

---

### Items

Generated item instances.

---

# Inventory Domain

## Purpose

Stores owned resources and equipment.

---

## Components

### Equipment Inventory

Stores equipment items.

---

### Consumable Storage

Stores consumables.

---

### Material Storage

Stores crafting materials.

---

### Equipment Loadouts

Stores saved equipment sets.

---

## Rules

### Equipment Inventory

Base:

50 Slots

Maximum:

100 Slots

---

### Material Storage

Separate from inventory.

Maximum:

999 Per Material

---

## Tables

### InventoryItems

Equipment ownership.

---

### EquipmentLoadouts

Saved equipment sets.

---

### MaterialStorage

Stored materials.

---

### ConsumableStorage

Stored consumables.

---

# Monster Domain

## Purpose

Stores all monster definitions.

---

## Rules

- Fully Database Driven
- No Generated Stats
- Manual Balancing

---

## Monster Data

### Identity

- Name
- Family
- Artwork
- Description

---

### Progression

- Level

---

### Combat

- Health
- Attack
- Defense
- Spell Power

---

### Behavior

- Cooldown
- Ability Chance

---

### Rewards

- Gold Minimum
- Gold Maximum

---

## Tables

### MonsterFamilies

Monster family definitions.

---

### Monsters

Monster definitions.

