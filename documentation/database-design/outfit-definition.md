# Outfit System

## Overview

The Outfit System is a long-term cosmetic progression system.

Outfits provide:

- Visual Customization
- Collection Progression
- Prestige Goals
- Long-Term Account Progression

The system exists purely for cosmetic purposes.

Outfits provide no gameplay advantages.

---

# Core Philosophy

The Outfit System exists to reward:

- Collection
- Boss Farming
- Crafting
- Long-Term Dedication

Outfits are intended to provide visual progression rather than character power.

Players should feel rewarded through:

- Unique Appearances
- Collection Completion
- Cosmetic Prestige

rather than gameplay advantages.

---

# Cosmetic-Only Design

## No Gameplay Benefits

Outfits provide:

- No Combat Power
- No Character Statistics
- No Economic Bonuses
- No Progression Multipliers

Outfits are entirely visual.

---

## Design Goal

Character strength should continue to come from:

- Levels
- Equipment
- Spells
- Crafting
- Economy

Outfits should never influence combat or progression.

---

# Account-Wide Progression

## Overview

Outfits are Account-Wide.

Once unlocked, an outfit becomes permanently available to the account.

---

## Persistence

Outfit progress survives:

- Character Deletion
- Character Archiving
- Character Transfers
- Seasonal Resets
- New Character Creation

Unlocks never need to be earned more than once.

---

# Outfit Collection

## Overview

The Outfit System functions as a permanent collection system.

Players gradually unlock new appearances throughout long-term play.

---

## Collection Goals

Examples:

- Unlock First Outfit
- Complete Outfit Set
- Complete Addon Set
- Complete Entire Collection

The collection aspect is a primary motivation for participation.

---

# Outfit Definitions

## Overview

Outfits are static game definitions.

Every outfit contains its own identity and visual appearance.

---

## Stored Data

Each outfit stores:

- Name
- Description
- Artwork
- Category
- Display Order

---

## Examples

Possible outfits:

- Knight Outfit
- Mage Outfit
- Merchant Outfit
- Dragon Hunter Outfit
- Ancient Vampire Outfit

Actual outfit availability is fully database-driven.

---

# Addon System

## Overview

Addons are secondary cosmetic upgrades attached to specific outfits.

They provide additional visual progression.

---

## Relationship Structure

Every Addon belongs to a specific Outfit.

Example:

Knight Outfit

↓

Knight Helmet Addon

↓

Knight Cape Addon

---

Addons cannot exist independently.

They require an associated Outfit definition.

---

# Addon Progression

## Purpose

Addons extend the lifespan of outfit collection.

Players continue progressing after unlocking an outfit.

---

## Design Goal

Progression Path:

Unlock Outfit

↓

Unlock Addon 1

↓

Unlock Addon 2

↓

Complete Outfit

This creates multiple collection goals from a single cosmetic theme.

---

# Acquisition Philosophy

## Overview

Outfits are intended to be earned through gameplay.

Primary sources may include:

- Crafting
- Boss Farming
- Material Collection
- Marketplace Trading

---

## Long-Term Goals

Outfits should feel valuable because they require:

- Time
- Planning
- Material Investment
- Collection Effort

Outfit acquisition should never be instant.

---

# Boss Material Integration

## Overview

Certain cosmetic materials are obtained from bosses.

Examples:

- Dragon Eye
- Royal Crown
- Ancient Skull
- Demon Horn

---

## Usage

Boss Components are used for:

- Outfit Tokens
- Addon Tokens
- Cosmetic Crafting

---

## Restrictions

Boss Components never provide:

- Combat Bonuses
- Equipment Power
- Character Statistics

They exist exclusively for cosmetic progression.

---

# Outfit Tokens

## Overview

Outfit unlocks may require dedicated tokens.

These tokens function as account progression items.

---

## Sources

Possible sources:

- Crafting
- Marketplace Trading
- Material Conversion

The exact implementation remains database-driven.

---

# Addon Tokens

## Overview

Addons may require dedicated Addon Tokens.

These function similarly to Outfit Tokens but are used for addon progression.

---

## Sources

Possible sources:

- Crafting
- Marketplace Trading
- Boss Materials

---

# Marketplace Integration

## Tradable Objects

The Marketplace supports trading of cosmetic progression items.

Examples:

- Outfit Tokens
- Addon Tokens
- Outfit Materials
- Addon Materials
- Boss Components

---

## Benefits

The economy allows players to:

- Farm Materials
- Sell Components
- Purchase Missing Pieces
- Accelerate Collection Progress

Without bypassing the collection system entirely.

---

# Seasonal Interaction

## Overview

Outfits are not seasonal.

Outfit progression remains permanently attached to the account.

---

## Unaffected By Seasons

Season resets do not affect:

- Outfit Collection
- Addon Collection
- Cosmetic Unlocks

All progress remains available forever.

---

# Character Usage

## Shared Access

All characters on the same account may use unlocked outfits.

Once unlocked:

- Current Characters Gain Access
- Future Characters Gain Access

There is no need to unlock the same outfit multiple times.

---

# Collection Progress

## Overview

The system tracks outfit collection completion.

Examples:

- Outfits Unlocked
- Addons Unlocked
- Collection Percentage

---

## Purpose

Collection tracking provides:

- Long-Term Goals
- Prestige
- Completion Metrics

without adding gameplay power.

---

# Achievement Integration

## Overview

The Outfit System integrates with Achievements.

---

## Example Achievements

### Unlock First Outfit

Achievement Unlocked

---

### Unlock 10 Outfits

Achievement Unlocked

---

### Unlock 25 Outfits

Achievement Unlocked

---

### Unlock All Outfits

Achievement Unlocked

---

### Unlock All Addons

Achievement Unlocked

---

### Complete Cosmetic Collection

Achievement Unlocked

---

## Rewards

Achievement rewards follow standard Achievement rules.

Examples:

- Achievement Points
- Small Permanent Bonuses

The reward comes primarily from collection completion itself.

---

# Profile Integration

## Overview

Character Profiles may display cosmetic progression.

Possible displays include:

- Outfit Collection Progress
- Addon Collection Progress
- Collection Completion Percentage

This allows cosmetic achievements to serve as visible prestige systems.

---

# Database Structure

## OutfitDefinitions

Stores:

- Outfit Name
- Description
- Artwork
- Category
- Display Order

---

## AddonDefinitions

Stores:

- Addon Name
- Parent Outfit
- Artwork
- Unlock Requirements

---

## AccountOutfits

Stores:

- Unlocked Outfits
- Unlock Dates

---

## AccountAddons

Stores:

- Unlocked Addons
- Unlock Dates

---

# System Relationships

The Outfit System interacts with:

- Bosses
- Crafting
- Marketplace
- Achievements
- Character Profiles
- Collection Systems

The system serves as a long-term cosmetic progression layer that complements gameplay systems without affecting balance.

---

# Design Philosophy

The Outfit System exists to create:

Boss Farming

↓

Material Collection

↓

Crafting

↓

Outfit Unlocks

↓

Collection Progress

↓

Prestige

Players should feel excited about:

- Unlocking Rare Appearances
- Completing Collections
- Displaying Long-Term Progress

The Outfit System should complement:

- Holy Grail
- Achievements
- Boss Progression
- Crafting

while remaining completely cosmetic.

Character power should never come from outfits.

Their purpose is:

Customization

↓

Collection

↓

Prestige

rather than progression power.