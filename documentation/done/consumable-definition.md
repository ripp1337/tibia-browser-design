# Consumable System

## Overview

Consumables are items that may be used directly by players.

Consumables provide temporary utility and progression support.

They are divided into four categories:

- Potions
- Boosts
- Blessings
- Protection Stones

All consumables are fully tradable.

All consumables are stackable.

Maximum Stack Size:

- 999

Consumables support character progression but are not intended to replace:

- Equipment
- Character Levels
- Spell Progression

---

# Consumable Categories

The Consumable System contains four major categories.

## Potions

Restore resources.

Examples:

- Health Potions
- Mana Potions
- Energy Potions

---

## Boosts

Provide temporary progression bonuses.

Examples:

- Gold Boosts
- Experience Boosts

---

## Blessings

Provide protection against death penalties.

---

## Protection Stones

Provide protection during equipment upgrades.

---

# Potions

## Overview

Potions restore character resources.

Potions may be used:

- During Combat
- Outside Combat

depending on potion type.

---

# Health Potions

## Purpose

Health Potions restore Health.

---

## Usage

May be used:

- During Combat
- Outside Combat

---

## Combat Rules

Using a Health Potion consumes the entire turn.

Example:

Turn 1

↓

Use Health Potion

↓

Turn Ends

---

## Healing Formula

Health Potions use a hybrid scaling model.

### Low-Tier Potions

Restore fixed Health amounts.

Examples:

#### Small Health Potion

Restore 50 Health

#### Medium Health Potion

Restore 150 Health

---

### High-Tier Potions

Restore a percentage of Maximum Health.

Examples:

#### Grand Health Potion

Restore 25% Max Health

#### Ultimate Health Potion

Restore 50% Max Health

---

## Overhealing

Overhealing is not allowed.

Example:

Current Health:
950

Maximum Health:
1000

Potion Healing:
200

Result:
1000 Health

Health may never exceed Maximum Health.

---

# Mana Potions

## Purpose

Mana Potions restore Mana.

---

## Usage

May be used:

- During Combat
- Outside Combat

---

## Combat Rules

Using a Mana Potion consumes the entire turn.

---

## Restoration Formula

Mana Potions follow the same progression model as Health Potions.

### Low-Tier Potions

Restore fixed Mana values.

---

### High-Tier Potions

Restore a percentage of Maximum Mana.

---

## Over-Restoration

Mana may never exceed Maximum Mana.

Any excess restoration is lost.

---

# Energy Potions

## Purpose

Energy Potions restore Energy.

Energy Potions support additional combat activity.

---

## Usage Restrictions

Energy Potions may only be used:

- Outside Combat

---

## Example Values

### Small Energy Potion

+20 Energy

---

### Medium Energy Potion

+50 Energy

---

### Large Energy Potion

+100 Energy

---

Actual values are defined individually per consumable.

---

## Capacity Rules

Energy cannot exceed Maximum Energy.

Any excess restoration is lost.

---

# Potion Cooldowns

## Overview

Every potion may define a cooldown.

Cooldowns are measured in turns.

---

## Examples

### Instant Use

0 Turns

---

### Short Cooldown

1 Turn

---

### Long Cooldown

3 Turns

---

## Default

Default Potion Cooldown:

0 Turns

This allows consecutive potion usage when balancing permits it.

---

## Combat Example

Turn 1

↓

Health Potion

↓

Turn 2

↓

Health Potion

↓

Turn 3

↓

Health Potion

Allowed if no cooldown prevents usage.

---

# Boosts

## Overview

Boosts provide temporary progression bonuses.

They do not provide permanent character power.

Boost duration is based on completed fights rather than time.

---

## Purpose

Boosts exist to:

- Accelerate Progression
- Reward Preparation
- Improve Farming Efficiency
- Support Long-Term Goals

---

# Gold Boosts

## Effect

Increase Gold earned from combat.

---

## Example Tiers

### Small Gold Boost

Bonus:

+10% Gold

Duration:

100 Fights

---

### Medium Gold Boost

Bonus:

+15% Gold

Duration:

250 Fights

---

### Large Gold Boost

Bonus:

+25% Gold

Duration:

500 Fights

---

# Experience Boosts

## Effect

Increase Experience gained from combat.

---

## Example Tiers

### Small Experience Boost

Bonus:

+10% Experience

Duration:

100 Fights

---

### Medium Experience Boost

Bonus:

+15% Experience

Duration:

250 Fights

---

### Large Experience Boost

Bonus:

+25% Experience

Duration:

500 Fights

---

# Fight-Based Duration System

## Overview

Boosts are measured in completed fights.

They are not time based.

---

## Fight Consumption

A boost charge is consumed when:

- Victory occurs
- Defeat occurs

Both outcomes consume one fight.

---

## Persistence

Boost progress is preserved:

- Online
- Offline
- Across Sessions
- Across Logouts

---

## Example

Gold Boost:

100 Fights Remaining

↓

Logout

↓

Login 3 Days Later

↓

Still 100 Fights Remaining

---

## Advantages

Fight-based duration ensures:

- No wasted duration
- Equal value for all players
- Consistent progression timing

---

# Boost Stacking Rules

## Same Category

Boosts of the same category do not stack.

Example:

Gold Boost +10%

+

Gold Boost +15%

Result:

Only one Gold Boost active

---

## Different Categories

Different boost categories may be active simultaneously.

Example:

Gold Boost

+

Experience Boost

Allowed

---

# Boost Replacement

Using a new boost automatically replaces the currently active boost of the same category.

Example:

Active:

Gold Boost +10%

↓

Use:

Gold Boost +25%

↓

Result:

Gold Boost +25%

The previous boost is removed.

---

# Blessings

## Purpose

Blessings reduce death penalties.

---

## Activation

Blessings must be activated manually.

They are not consumed automatically from inventory.

This allows:

- Trading
- Strategic Usage
- Economic Value

---

## Active Limit

A character may have:

- One Active Blessing

Additional Blessings remain stored in inventory.

---

## Death Interaction

When the character dies:

- Active Blessing is consumed
- Death penalty reduction is applied

A new Blessing must be activated manually after death.

---

## Death Penalty Reduction

### Non-Promoted Character

Normal:

10% Experience Loss

With Blessing:

6% Experience Loss

---

### Promoted Character

Normal:

8% Experience Loss

With Blessing:

4% Experience Loss

---

## Consumption Rules

Blessing effects apply only once.

After activation and subsequent death:

- Blessing is consumed
- Protection ends

---

# Protection Stones

## Purpose

Protection Stones prevent item destruction during failed upgrades.

---

## Usage

A Protection Stone applies to a single upgrade attempt.

The stone is consumed immediately when the attempt begins.

---

## Success Result

Upgrade succeeds.

- Item upgrades normally
- Protection Stone is consumed

---

## Failure Result

Upgrade fails.

- Item survives
- Materials are consumed
- Gold is consumed
- Protection Stone is consumed

---

## Protection Scope

One Protection Stone protects:

- One Upgrade Attempt

Nothing more.

---

## Variants

There are no tiers.

Only one Protection Stone exists.

Examples not allowed:

- Small Protection Stone
- Greater Protection Stone
- Legendary Protection Stone

The system intentionally uses a single universal protection consumable.

---

# Trade Rules

All consumables are tradable.

Examples:

- Health Potions
- Mana Potions
- Energy Potions
- Gold Boosts
- Experience Boosts
- Blessings
- Protection Stones

Players may:

- List
- Buy
- Sell
- Trade Through Marketplace

---

# Storage Rules

Consumables use Consumable Storage.

Rules:

- Separate from Equipment Inventory
- Stackable
- Maximum Stack Size 999

Supported Consumables:

- Potions
- Boosts
- Blessings
- Protection Stones

---

# Sources

Consumables may enter the economy through:

- Crafting
- Loot
- Boss Loot
- Chests
- Marketplace Trading
- NPC Vendors (selected consumables)

Different consumable types have different acquisition methods.

---

# Economic Role

Consumables represent recurring economic demand.

They function as:

- Progression Support
- Resource Management Tools
- Economic Goods
- Crafting Outputs

Consumables create ongoing consumption throughout all stages of progression.

---

# Design Philosophy

The Consumable System exists to create:

Gather Resources

↓

Craft Consumables

↓

Use Consumables

↓

Improve Progression

↓

Repeat

Common consumables should be used frequently:

- Health Potions
- Mana Potions
- Energy Potions

Valuable consumables should be used strategically:

- Blessings
- Protection Stones
- High-Tier Boosts

Consumables should feel meaningful and valuable while remaining supportive systems rather than mandatory sources of character power.