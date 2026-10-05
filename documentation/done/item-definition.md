# Item Design
## Tibia Browser RPG

---

# 1. Overview

Item Bases are static equipment definitions.

Generated Items inherit Item Base properties and then receive:

- Rarity
- Affixes
- Affix Rolls

Formula:

Item Base

+

Rarity

+

Affixes

=

Final Item

---

# 2. Identity

## Item Base ID

Unique identifier.

---

## Name

Unique item name.

Examples:

Bronze Sword

Steel Sword

Dragon Sword

Merchant Ring

Explorer Boots

Rat King's Crown

---

## Description

Lore description.

Displayed on:

- Item Tooltip
- Bestiary
- Holy Grail

---

## Artwork

Every Item Base has artwork.

Used in:

- Equipment
- Marketplace
- Inventory
- Holy Grail

---

# 3. Progression

## Item Level

Defines:

- Loot Progression
- Affix Availability
- Upgrade Scaling

---

## Required Level

Stored separately.

Initially:

Required Level = Item Level

Stored separately to allow future balancing.

Example:

Item Level:

50

Required Level:

45

Possible in future.

---

# 4. Item Score

Every Item Base contains:

Base Item Score

Used for:

- Vendor Values
- Analytics
- Balancing

Final Item Score:

Base Score

+

Rarity Score

+

Affix Score

=

Final Item Score

Item Score is not shown to players.

---

# 5. Item Slots

Supported Equipment Slots:

- Weapon
- Helmet
- Armor
- Shield
- Legs
- Boots
- Ring
- Amulet

---

# 6. Weapon Types

Available Weapon Types:

- One-Handed
- Two-Handed

---

## Two-Handed Weapons

Characteristics:

- Approximately 150% normal Attack value
- Cannot equip Shield

Purpose:

- Offensive build choice

---

# 7. Base Statistics

Every item base may use any combination of:

- Attack
- Defense
- Spell Power
- Health
- Mana
- Energy
- Gold %
- Experience %

Most items focus on a small subset of these values.

Examples:

Steel Sword

Attack +50

---

Knight Armor

Defense +40

Health +150

---

Scholar Amulet

Spell Power +20

Mana +100

---

Merchant Ring

Gold +5%

---

# 8. Item Types

Available Item Types:

- Normal Item
- Set Item
- Unique Item

Implemented through flags.

---

## Set Flag

Boolean

If true:

Linked to Set ID

---

## Unique Flag

Boolean

If true:

Linked to Unique ID

No separate item-base system exists.

---

# 9. Drop Accessibility

## Boss Exclusive

Boolean

Examples:

false

true

Boss-exclusive item bases only appear through designated boss encounters.

---

# 10. Rarity Rules

All item bases may roll:

- Common
- Magic
- Rare
- Epic
- Legendary

No base item has rarity restrictions.

---

## Rarity Determines

- Affix Count

Only.

Rarity does not change base item stats.

---

# 11. Affix System

Item Bases use weighted affix generation.

All affixes may appear on all slots.

However:

Each slot has custom affix weights.

Example:

Weapon

Attack:

100

Defense:

25

Spell Power:

50

Gold:

5

Experience:

5

---

Ring

Gold:

100

Experience:

100

Attack:

50

Defense:

50

This preserves item identity while maintaining randomness.

---

# 12. Fixed Base Stats

Base stats are fixed.

Example:

Steel Sword

Attack:

50

Always.

No random base roll exists.

Randomness comes from:

- Rarity
- Affixes
- Affix Rolls

---

# 13. Class Restrictions

None.

Any character may use any item.

The game uses a classless progression system.

---

# 14. Expected Item Volume

Target:

80-100 Base Items

Spread across:

- Weapons
- Helmets
- Armor
- Shields
- Legs
- Boots
- Rings
- Amulets

New items may be added in future expansions.

---

# 15. Unique Items

Unique Items are based on normal item bases.

Additional Properties:

- Unique Flag
- Unique Template
- Fixed Stat Ranges

Example:

Rat King's Crown

Attack:

10-20

Defense:

5-15

Values roll within predefined ranges.

---

## Unique Item Rules

Unique Items do not roll affixes.

Their identity comes from:

- Fixed Stat Categories
- Variable Stat Rolls

Each drop rolls independently.

Players may continue farming for better versions.

---

# 16. Set Items

Set Items are based on normal item bases.

Additional Properties:

- Set Flag
- Set ID
- Set Bonuses

Example:

2 Pieces:

+5% Gold

---

3 Pieces:

+10 Attack

---

4 Pieces:

+5% Experience

---

## Set Item Rules

Set Items do not roll affixes.

Their identity comes from:

- Fixed Stat Categories
- Variable Stat Rolls
- Set Bonuses

---

# 17. Power Philosophy

Normal Items:

Base

+

Rarity

+

Affixes

---

Set Items:

Base

+

Set Bonuses

+

Fixed Stat Rolls

---

Unique Items:

Base

+

Unique Stat Rolls

---

## Ultimate Endgame Goal

Perfect Legendary Items.

Perfect Legendary equipment should generally outperform:

- Unique Items
- Set Items

Uniques and Sets exist as:

- Alternative Progression
- Collection Goals
- Build Options

Rather than Best-In-Slot equipment.

---

# 18. Design Philosophy

Item Bases should have strong identities.

Examples:

Merchant Ring

→ Gold-focused

---

Scholar Amulet

→ Spell-focused

---

Explorer Boots

→ Energy-focused

---

Knight Armor

→ Defense-focused

The goal is for players to recognize item bases themselves as valuable, rather than viewing all value as coming exclusively from affixes.