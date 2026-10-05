# 6. LOOT SYSTEM

## Overview

Every monster kill generates loot through four independent loot systems:

1. Gold Roll
2. Item Roll
3. Other Loot Roll
4. Unique/Set Roll

Each roll is processed independently.

This means a single kill may result in:

- Gold only
- Gold + Materials
- Gold + Item
- Gold + Item + Materials
- Gold + Item + Materials + Unique/Set Item

Maximum possible item drops from a single kill:

- 1 Regular Item
- 1 Unique/Set Item

Maximum:

2 equipment items per kill

---

# Gold Roll

Gold is always rolled.

Every monster has:

- Minimum Gold
- Maximum Gold

Stored directly in the monster database.

Example:

Rat

Gold:

5 - 15

Wolf

Gold:

20 - 40

Dragon

Gold:

500 - 1000

Actual gold reward is rolled randomly within the configured range.

Gold rewards can be increased through active Gold Boosts.

---

# Regular Item Roll

Every monster performs one equipment roll.

Default Monster Chances:

30%:

- Equipment Item

70%:

- No Equipment

If an item is generated:

1. Roll Item Level
2. Roll Equipment Slot
3. Roll Rarity
4. Roll Affixes
5. Create Item

---

## Item Level Roll

Monster Level determines item level range.

Example:

Level 50 Monster

Possible Item Levels:

40 - 55

Every level within the range has equal chance.

Example:

40,41,42,43...55

All equally likely.

---

## Equipment Slot Distribution

Equipment slot chances:

Weapon:

15%

Helmet:

15%

Armor:

15%

Shield:

15%

Legs:

15%

Boots:

15%

Ring:

5%

Amulet:

5%

Total:

100%

---

## Item Rarity Chances

Regular Monster Loot Chances:

Common:

70%

Magic:

20%

Rare:

8%

Epic:

1.8%

Legendary:

0.2%

Legendary items may drop from any monster.

Higher-level monsters provide access to higher-level equipment.

---

# Boss Item Roll

Bosses use improved loot tables.

Boss Equipment Roll:

80%:

- Equipment Item

20%:

- No Equipment

Bosses also use improved rarity chances.

Boss Rarity Chances:

Common:

0%

Magic:

70%

Rare:

20%

Epic:

9%

Legendary:

1%

Bosses additionally increase loot quality through bonus loot levels.

Examples:

Boss Level:

50

Bonus Loot Level:

+10

Loot rolls as:

Level 60 Monster

Bonus Loot Level may vary by boss.

---

# Other Loot Roll

Every monster performs one additional loot roll.

Default Monster Chances:

70%

- Other Loot

30%

- Empty

Other Loot may include:

- Crafting Materials
- Potions
- Temporary Boosts
- Blessings
- Protection Stones

All entries use individual drop tables.

---

## Boss Other Loot Roll

Bosses receive improved chances.

Boss Chances:

90%

- Other Loot

10%

- Empty

Bosses additionally have access to:

- Rare Materials
- Boss Exclusive Materials
- Better quantities
- Higher Blessing Rates
- Higher Protection Stone Rates

---

# Materials

Materials are primarily used for:

- Crafting
- Equipment Upgrades
- Protection Crafting
- Blessing Crafting

Material progression is level-based.

Examples:

Low Levels:

- Iron Ore

Mid Levels:

- Steel Piece

Higher Levels:

- Mithril Fragment

Materials do not use rarity tiers.

Each material exists as its own resource.

Some cosmetic materials are boss-exclusive.

These materials are primarily used for:

- Outfits
- Addons
- Cosmetic Collections

Core progression materials are not boss-exclusive.

Players may obtain progression materials through:

- Gathering
- Loot
- Trading
- Vendors (selected materials)

Examples:

- Dragon Scales
- Ancient Essence
- Rat King's Tooth

# Boss Materials

Certain materials may be exclusive to bosses.

These materials are intended primarily for:

- Outfits
- Addons
- Cosmetic Collections

Examples:

- Dragon Eye
- Ancient Skull
- Royal Crown
- Demon Horn

Boss-exclusive materials are not required for core gameplay progression.

Players must never be forced to kill a specific boss in order to access:

- Potions
- Blessings
- Protection Stones
- Energy Potions
- Core Crafting Progression

Boss-exclusive materials exist primarily to support prestige and collection systems.

---

# Unique & Set Loot System

Unique and Set Items use a completely independent loot roll.

The system includes bad luck protection.

Unique and Set rolls do not affect regular item drops.

Both can occur from the same kill.

---

## Unique Pity System

Every eligible kill increases unique chance.

Starting Chance:

0.1%

After each kill:

+0.1%

Examples:

Kill 1:

0.1%

Kill 2:

0.2%

Kill 10:

1.0%

Kill 50:

5.0%

Kill 100:

10.0%

Maximum Chance:

10%

When a Unique or Set Item drops:

Chance resets back to:

0.1%

---

## Unique Selection

When a unique roll succeeds:

The game selects an eligible unique based on:

- Monster Level
- Boss Level
- Loot Level Range

The dropped unique must fit the current progression range.

---

### Set Items

Set Items are a special category of Unique Items.

Characteristics:
- Fixed Identity
- Fixed Stat Categories
- Random Stat Rolls
- Set Bonuses

Set Items do not use affixes.

Sets may drop from:

- Normal Monsters
- Bosses

Bosses generally have better set drop chances.

Set Item Sources

Set Items are tied to monster families.

Example:

Rat Set:
- Rat
- Plague Rat
- Rat King

Vampire Set:
- Vampire
- Vampire Bride
- Vampire Lord

---

## Unique Item Philosophy

Unique and Set Items are powerful.

However:

Perfectly rolled Legendary items remain the strongest equipment in the game.

Endgame Best-In-Slot gear is expected to come from:

- High Item Level
- Legendary Rarity
- Perfect Affixes
- Perfect Affix Rolls
- Successful Upgrades

Unique and Set Items are intended as valuable alternatives rather than mandatory endgame equipment.

---

# Loot Modifiers

There are no loot quality modifiers.

No statistics such as:

- Magic Find
- Item Find
- Loot Quality %

exist in the game.

Equipment acquisition is intended to remain a grind-based progression system.

---

# Inventory Rules

Default Inventory Size:

50 Slots

Inventory Expansion:

+50 Slots

Maximum Inventory:

100 Slots

Expansion Cost:

1,000,000 Gold

Inventory size only affects equipment and item storage.

---

## Stack Limits

Gold:

- Unlimited

Crafting Materials:

- 999 per stack

Potions:

- 999 per stack

Boosts:

- 999 per stack

Blessings:

- 999 per stack

Protection Stones:

- 999 per stack

Additional stacks are created automatically when possible.

---

# Full Inventory Rules

When inventory is full:

Equipment Items:

- Lost

Gold:

- Still received

Materials:

- Still received if material stack has available space

Consumables:

- Still received if stack capacity allows

The player receives a warning notification when inventory is full.

The player is responsible for maintaining inventory space.

---

# Loot Visibility

Dropped items are fully identified immediately.

Players instantly see:

- Item Name
- Item Slot
- Item Level
- Item Rarity
- Item Statistics

There is no item identification system.

---

# Loot Notifications

There are no global loot announcements.

Examples:

No server-wide messages for:

- Legendary Drops
- Unique Drops
- Set Drops

All loot remains private to the player.

---

# Loot Philosophy

The loot system is designed around four goals:

1. Frequent progression through normal loot.
2. Long-term item hunting through rarity and affixes.
3. Excitement through unique and set item drops.
4. Endless optimization through perfect legendary gear.

The strongest items in the game should remain extremely rare and require significant time, luck, upgrades and trading to obtain.