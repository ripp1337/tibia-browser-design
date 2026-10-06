# Material Definition
## Tibia Browser RPG

---

# 1. Overview

Materials are crafting resources used to create:

- Potions
- Blessings
- Protection Stones
- Energy Potions
- Boosts

Materials are obtained through:

- Gathering
- Monster Loot
- Boss Loot
- Vendors
- Marketplace Trading

Materials are not used directly in combat.

---

# 2. Identity

## Material ID

Unique identifier.

---

## Name

Unique material name.

Examples:

Iron Ore

Steel Piece

Silver Chunk

Mithril Fragment

Ancient Crystal

Dragon Heart

---

## Description

Short lore description.

Displayed in:

- Material Storage
- Crafting Recipes
- Marketplace

---

## Artwork

Every material has unique artwork.

No shared icons.

---

# 3. Progression

## Material Level

Defines:

- Gathering Access
- Loot Access
- Recipe Usage

Examples:

Iron Ore

Level 1

---

Steel Piece

Level 10

---

Silver Chunk

Level 25

---

Mithril Fragment

Level 50

---

Ancient Crystal

Level 100

Materials are distributed relatively evenly across progression.

---

# 4. Vendor Data

## Vendor Available

Boolean.

Examples:

Iron Ore

true

---

Ancient Crystal

false

---

## Vendor Price

Stored directly on the material.

Examples:

Iron Ore

50 Gold

---

Steel Piece

500 Gold

---

Mithril Fragment

5,000 Gold

Used by NPC vendors.

---

# 5. Source Flags

Each material stores the following source flags:

- Gatherable
- Lootable
- Vendor Available
- Crafting Ingredient

Example:

Iron Ore

Gatherable:

Yes

Lootable:

Yes

Vendor Available:

Yes

Crafting Ingredient:

Yes

---

# 6. Gathering Requirements

## Required Gathering Level

Examples:

Iron Ore

1

---

Steel Piece

3

---

Mithril Fragment

7

---

Ancient Crystal

10

Used by the Gathering System.

---

# 7. Loot Requirements

## Minimum Monster Level

Examples:

Iron Ore

1

---

Steel Piece

10

---

Mithril Fragment

50

---

Ancient Crystal

100

Used by Loot Generation.

---

# 8. Storage & Stacking

## Maximum Stack Size

999

Applies to every material.

No exceptions exist.

Materials are stored inside Material Storage.

---

# 9. Marketplace

All materials are tradable.

Materials may be:

- Listed
- Purchased
- Sold

The Marketplace treats materials the same way as other tradable goods.

---

# 10. NPC Sales

Materials may be sold to NPC vendors.

Vendor value is determined by the stored Vendor Price.

---

# 11. Drop Quantities

Material drops are intentionally small.

Typical rewards:

- 0-2 Materials
- 0-3 Materials

The game prefers:

Valuable Materials

rather than

Massive Quantities

---

# 12. Crafting Usage

Every material should have recipe usage.

No material should exist without a purpose.

Examples:

Iron Ore

→ Early Potions

---

Steel Piece

→ Mid-Tier Boosts

---

Mithril Fragment

→ Protection Stones

---

Ancient Crystal

→ Endgame Blessings

Materials are intended to remain useful throughout progression.

---

# 13. Material Complexity

Materials have:

- No Categories
- No Families
- No Refinement
- No Conversion Chains

Examples:

The game does NOT use:

Iron Ore

↓

Iron Ingot

↓

Refined Iron

↓

Polished Iron

Instead, resources exist independently:

- Iron Ore
- Steel Piece
- Silver Chunk
- Mithril Fragment

Each material is its own resource.

---

# 14. Rare Materials

Some materials are substantially rarer than others.

Rarity is primarily determined by:

- Level Requirement
- Monster Access
- Gathering Access

Not by separate rarity tiers.

Example:

Ancient Crystal

is naturally rarer than

Iron Ore.

---

# 15. Collection Rules

Materials do not participate in:

- Holy Grail
- Collections
- Discovery Logs

Materials are purely functional resources.

---

# 16. Design Philosophy

Materials exist primarily to support Crafting.

Primary Purpose:

Material

↓

Recipe

↓

Useful Item

Trading is secondary.

The intended player question is:

"What can I craft with this?"

rather than

"This material is collectible."

The material ecosystem should remain:

- Simple
- Understandable
- Directly Connected to Progression