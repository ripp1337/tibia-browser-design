# NPC DEFINITION

## Overview

NPCs provide utility services to players.

NPC functionality currently includes:

- Equipment Vendors
- Material Vendors
- Blessing Vendors
- Healers

NPCs act as both:

- Economic Sources
- Economic Sinks

NPC stock is infinite.

---

# NPC Vendors

## Overview

NPC Vendors represent an unlimited economy source and sink.

NPC stock is infinite.

---

# Vendor Inventory

NPC Vendors may sell:

- Common Equipment
- Potions
- Basic Materials
- Blessings
- Experience Boosts

NPC equipment is intended mainly for early-game progression.

Most mid-game and end-game equipment comes from:

- Loot
- Bosses
- Crafting
- Gambling
- Trading

---

# Equipment Sales

NPC Equipment Pricing:

Item Level × 100 Gold

Examples:

Level 10 Item:

- 1,000 Gold

Level 50 Item:

- 5,000 Gold

Level 100 Item:

- 10,000 Gold

---

# Material Sales

Basic materials may be purchased from vendors.

Formula:

Material Tier × Constant

Higher-tier materials are substantially more expensive.

Rare materials are generally unavailable from vendors.

---

# Vendor Purchases

Equipment may be sold to NPC Vendors.

Vendor value scales primarily with:

- Item Level
- Affix Strength

Stronger items provide higher vendor values.

This creates a guaranteed minimum value for all loot.

---

# Vendor Sell Value

Items sold to NPC vendors use Item Score.

Formula:

Item Score × 100 Gold

Item Score is determined by:

- Item Level
- Base Stats
- Rarity
- Affixes
- Affix Values

Better items generate higher vendor values.

---

# Blessings

Blessings may be purchased from NPC Vendors.

Blessings may also be:

- Crafted
- Looted

---

## Blessing Cost

Character Level 1-20:

- 5,000 Gold

Character Level 21-30:

- 10,000 Gold

Character Level 31-50:

- 20,000 Gold

Character Level 51-75:

- 50,000 Gold

Character Level 76-100:

- 100,000 Gold

Character Level 101+:

- 200,000 Gold

---

# Healer NPC

## Overview

NPC Healers restore Health in exchange for Gold.

Health may also be restored through:

- Potions
- Healing Spells

---

## Healing Rules

NPC Healers:

- Restore up to 50% of missing Health
- May be used once every 60 minutes

---

## Healing Cost

Level 1-30:

- 100 × Level

Level 31-50:

- 150 × Level

Level 51-80:

- 200 × Level

Level 81-100:

- 300 × Level

Level 101+:

- 500 × Level

---

## Examples

Level 20:

- 2,000 Gold

Level 40:

- 6,000 Gold

Level 75:

- 15,000 Gold

Level 120:

- 60,000 Gold

---

# Spell Services

Spells are purchased through the Spell Menu.

Requirements:

- Character Level
- Gold Cost

NPC spell vendors are not defined.

---

# Promotion

Promotion is a permanent character upgrade.

Requirements:

- Level 20
- 20,000 Gold

Effect:

- Reduces death experience loss from 10% to 8%

The method of purchasing Promotion is not specified.

---

# Economic Role

NPCs participate in the economy through:

Gold Sources:

- Selling items to Vendors

Gold Sinks:

- NPC Equipment Purchases
- Material Purchases
- Blessing Purchases
- NPC Healing

NPCs provide both guaranteed access to progression resources and permanent methods for removing Gold from the economy.

---

# Design Philosophy

NPCs exist to provide:

- Basic Equipment Access
- Material Access
- Health Recovery
- Blessing Access

NPCs are intended to support progression and provide economic stability.

Most valuable equipment progression is expected to come from:

- Loot
- Bosses
- Gambling
- Trading

rather than from NPC Vendors.