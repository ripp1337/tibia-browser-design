# Recipe Definition
## Tibia Browser RPG

---

# 1. Overview

Recipes convert crafting materials into usable items.

Recipes are unlocked through Crafting progression.

All recipes are permanent.

Recipes never fail.

Crafting is deterministic.

---

# 2. Identity

## Recipe ID

Unique identifier.

---

## Name

Unique recipe name.

Examples:

- Small Health Potion
- Large Gold Boost
- Blessing
- Protection Stone
- Large Energy Potion

---

## Description

Short explanation of the recipe output.

Displayed in:

- Crafting Window
- Recipe Details

---

# 3. Recipe Visibility

All recipes are visible at all times.

Locked recipes are displayed but unavailable.

Players can always view:

- Output
- Materials
- Quantities
- Gold Cost
- Crafting Time
- Crafting XP Reward
- Level Requirements

---

# 4. Unlocking

Each recipe contains:

- Required Crafting Level
- Required Character Level

Examples:

Small Potion

Crafting:

1

Character:

1

---

Blessing

Crafting:

8

Character:

75

---

Protection Stone

Crafting:

10

Character:

100

---

# 5. Output

Every recipe produces exactly one item type.

Examples:

- Health Potion
- Mana Potion
- Energy Potion
- Gold Boost
- Experience Boost
- Blessing
- Protection Stone

Recipes never produce equipment.

Equipment crafting does not exist.

---

# 6. Crafting Costs

## Recipe Materials

Each recipe requires:

1-5 different materials.

Examples:

Iron Ore ×2

Steel Piece ×1

Silver Chunk ×4

Material quantities remain intentionally small.

Typical requirement:

1-5 units per material.

---

# 7. Gold Cost

Recipes may require Gold.

Gold Cost is stored directly on the recipe.

Examples:

Small Potion:

0 Gold

---

Protection Stone:

10,000 Gold

---

Blessing:

50,000 Gold

Gold is consumed immediately when crafting begins.

---

# 8. Crafting Time

Crafting Time is stored directly on the recipe.

Examples:

Small Health Potion

30 Seconds

---

Large Gold Boost

10 Minutes

---

Protection Stone

4 Hours

---

Blessing

8 Hours

Time is stored in seconds.

---

# 9. Crafting Experience

Each recipe grants a fixed amount of Crafting Experience.

Examples:

Small Potion

2 XP

---

Large Boost

10 XP

---

Blessing

50 XP

Crafting Experience is granted when crafting completes.

---

# 10. Crafting Output Quantity

Each recipe produces:

1 Output Item

Examples:

Protection Stone

→ 1

---

Blessing

→ 1

---

Large Gold Boost

→ 1

To produce multiple items:

Players craft multiple times.

Example:

Protection Stone ×100

creates

100 queued crafts

using recipe quantity scaling.

---

# 11. Recipe Categories

Recipe Categories exist primarily for UI filtering.

Available Categories:

- Potions
- Upgrades
- Blessings

---

## Potions

Includes:

- Health Potions
- Mana Potions
- Energy Potions

---

## Upgrades

Includes:

- Protection Stones
- Future Upgrade Components

---

## Blessings

Includes:

- Blessings

---

# 12. Recipe Score

Recipe Score is a hidden internal value.

Used for:

- Balancing
- Analytics
- Progression Review

Not displayed to players.

Examples:

Easy Recipe

Score 10

---

Medium Recipe

Score 50

---

Hard Recipe

Score 100

---

# 13. Consumable Tiers

Each consumable family defines its own tiers.

## Health Potions

- Small
- Medium
- Large
- Grand
- Ultimate

---

## Mana Potions

- Small
- Medium
- Large
- Grand
- Ultimate

---

## Energy Potions

- Small
- Medium
- Large

---

# 14. Protection Stones

Only one Protection Stone exists.

Characteristics:

- No Tiers
- Single Recipe
- Single Item

---

# 15. Blessings

Only one Blessing exists.

Characteristics:

- No Tiers
- Single Recipe
- Single Item

---

# 16. Crafting Limits

Maximum Crafting Level:

10

Crafting Level 10 unlocks:

Every recipe in the game.

There are:

- No External Unlocks
- No Recipe Books
- No Recipe Drops
- No Hidden Recipes

---

# 17. Design Philosophy

Recipes are intended to be:

- Clear
- Predictable
- Deterministic

Progression comes from:

Materials

↓

Crafting Level

↓

Recipe Access

rather than Recipe Hunting.

The intended player experience is:

"I have the materials, therefore I can craft it."

not

"I need to find the recipe first."

This keeps Crafting approachable while still providing meaningful progression through:

- Recipe Unlocks
- Material Acquisition
- Crafting Progression