# Equipment Design
## Tibia Browser RPG

---

# 1. Equipment Vision

Equipment is the primary source of character power.

Most character strength comes from:

- Equipment
- Affixes
- Upgrades

rather than:

- Character Level

Character Level primarily unlocks access to content and equipment.

Equipment progression is intended to be the main long-term chase system.

---

# 2. Equipment Sources

Equipment enters the economy through:

- Monster Loot
- Boss Loot
- Gambling
- Trading

Equipment cannot be crafted.

Equipment may be:

- Equipped
- Sold
- Traded
- Upgraded
- Salvaged

---

# 3. Equipment Slots

Characters have 8 equipment slots:

- Amulet
- Helmet
- Weapon
- Armor
- Shield
- Legs
- Boots
- Ring

---

# 4. Item Levels

Every equipment piece has:

- Item Level
- Required Level

Current Rule:

Required Level = Item Level

Examples:

Bronze Sword
Level 5

Steel Sword
Level 20

Dragon Sword
Level 100

Item Level determines:

- Base Stats
- Affix Availability
- Affix Tier Availability
- Upgrade Costs
- Salvage Rewards

---

# 5. Item Generation

Equipment is generated using three stages:

Step 1:
Roll Item Base

↓

Step 2:
Roll Rarity

↓

Step 3:
Roll Affixes

Example:

Steel Sword

↓

Epic

↓

Attack +42

Attack +38

Defense +18

Every generated item is independent.

---

# 6. Base Item Statistics

Every Item Base contains fixed statistics.

Example:

Steel Sword

Attack: 50

Defense: 0

Spell Power: 0

Base stats never roll randomly.

Randomness comes from:

- Rarity
- Affixes
- Affix Values

Formula:

Base Item
+
Affixes
=
Final Item

---

# 7. Supported Stats

Items may contain:

- Attack
- Defense
- Spell Power
- Health
- Mana
- Energy
- Gold %
- Experience %

Not every item uses every stat.

---

# 8. Weapon Types

## One-Handed

May equip shield.

## Two-Handed

Characteristics:

- Approximately 150% base attack
- Cannot equip shield

Purpose:

Higher offense at the cost of defense.

---

# 9. Equipment Rarities

Available Rarities:

- Common
- Magic
- Rare
- Epic
- Legendary

Rarity does NOT modify:

- Base Stats
- Affix Strength
- Affix Tier

Rarity only controls:

- Affix Count

---

# 10. Affix Counts

Common

0 Affixes

Magic

1 Affix

Rare

2 Affixes

Epic

3 Affixes

Legendary

4 Affixes

---

# 11. Affix Types

Only eight affix families exist:

- Attack
- Defense
- Spell Power
- Health
- Mana
- Energy
- Gold %
- Experience %

No additional affix systems exist.

Examples of excluded affixes:

- Critical Chance
- Critical Damage
- Cooldown Reduction
- Regeneration
- Potion Efficiency

The system is intentionally simple.

---

# 12. Affix Tiers

Each affix uses predefined tiers.

Example:

Attack Tier 1

Level Requirement: 1

Range: 1-5

---

Attack Tier 5

Level Requirement: 100

Range: 25-50

Only eligible tiers may appear on an item.

---

# 13. Affix Rolls

After a tier is selected:

A random roll occurs within the tier range.

Example:

Attack Tier 5

100-200

Possible Roll:

173

Every value inside the range is equally likely.

---

# 14. Affix Visibility

Players never see tier names.

Players only see final values.

Examples:

Attack +150

Defense +90

Gold +8%

Experience +5%

---

# 15. Duplicate Affixes

Duplicate affixes are allowed.

Example:

Legendary Dragon Sword

Attack +200

Attack +185

Attack +191

Attack +174

Valid.

No duplicate restrictions exist.

This allows specialized items.

---

# 16. Affix Weighting

All affixes may appear on all items.

Item Bases use weights to encourage identity.

Example:

Dragon Sword

Attack: 100

Defense: 25

Spell Power: 25

Gold: 5

Experience: 5

---

Merchant Ring

Gold: 150

Experience: 100

Attack: 30

Defense: 30

Spell Power: 30

Items favor certain stats but all are possible.

---

# 17. Item Improvement Systems

Equipment has two independent improvement systems:

1. Rarity Upgrade
2. Affix Reroll

Systems do not interact.

---

# 18. Rarity Upgrades

Progression:

Common

↓

Magic

↓

Rare

↓

Epic

↓

Legendary

Each successful upgrade grants:

+1 New Affix

Maximum:

Legendary

---

# 19. Upgrade Success Chances

Common → Magic

80%

Magic → Rare

50%

Rare → Epic

25%

Epic → Legendary

10%

All values are configurable.

---

# 20. Upgrade Costs

Upgrades require:

- Gold
- Upgrade Materials

Costs scale based on:

- Item Level
- Current Rarity

Higher rarity = higher cost.

---

# 21. Upgrade Failure

Failed upgrade:

- Item destroyed
- Materials consumed
- Gold consumed

Item is permanently lost.

---

# 22. Protection Stones

Protection Stones may be used before upgrading.

On Failure:

- Upgrade fails
- Item survives

On Success:

- Upgrade succeeds normally

Protection Stone is consumed regardless of result.

Protection protects only one attempt.

---

# 23. Affix Reroll System

Player chooses one affix.

Only selected affix changes.

Example:

Before:

Attack +150
Attack +120
Gold +2%
Mana +40

Selected:

Gold +2%

After:

Attack +150
Attack +120
Gold +8%
Mana +40

All other affixes remain unchanged.

---

# 24. Salvaging

Equipment may be destroyed for materials.

Rewards depend on:

- Item Level
- Item Rarity

Higher rarity items provide better salvage rewards.

Options for unwanted items:

- Equip
- Sell
- Trade
- Salvage

---

# 25. Vendor Sales

Items may be sold to NPC vendors.

Vendor value is based primarily on:

- Item Score

Higher quality items have greater value.

Vendor sales create a guaranteed minimum value for loot.

---

# 26. Trading Rules

All equipment is fully tradable.

There are:

- No Bind on Pickup
- No Bind on Equip
- No Account Bound Items

Players may freely:

- Buy
- Sell
- Trade

at any time.

---

# 27. Boss Exclusive Bases

Certain Item Bases are boss-exclusive.

Examples:

- Rat King's Crown
- Ancient Dragon Armor
- Shadow Lord Ring

These bases enter the economy only through designated bosses.

---

# 28. Unique Items

Unique Items are special predefined equipment.

Characteristics:

- Fixed Identity
- Fixed Stat Categories
- Random Stat Rolls

Example:

Rat King's Crown

Attack: 10-20

Defense: 15-30

Rolls vary between drops.

---

# 29. Unique Item Rules

Unique Items:

- Do Not Use Affixes
- Do Not Use Rarity System

Power comes from:

- Fixed Identity
- Roll Quality

---

# 30. Set Items

Set Items are predefined equipment pieces.

Characteristics:

- Fixed Identity
- Fixed Rolls
- Set Bonuses

Examples:

Rat Set

- Rat Helm
- Rat Armor
- Rat Ring
- Rat Boots

---

# 31. Set Bonuses

Example:

2 Pieces

+5% Gold

3 Pieces

+10 Attack

4 Pieces

+5% Experience

Only designated set items provide set bonuses.

---

# 32. Item Score

Every item has a hidden Item Score.

Calculated from:

- Item Level
- Base Stats
- Rarity
- Affixes
- Affix Rolls

Uses:

- Vendor Pricing
- Analytics
- Balancing
- Market Monitoring

Item Score is never visible to players.

---

# 33. Best-In-Slot Philosophy

Ultimate endgame gear should generally be:

High Item Level

+

Legendary Rarity

+

Perfect Affixes

+

Near Perfect Rolls

Perfect Legendary items should generally outperform:

- Unique Items
- Set Items

Unique and Set items are intended to be:

- Valuable
- Collectible
- Build Enabling

not mandatory best-in-slot gear.

---

# 34. Equipment Design Philosophy

Equipment progression should create long-term goals.

Players should become excited by:

- High Item Levels
- Rare Drops
- Legendary Items
- Perfect Affix Combinations
- Near Perfect Rolls

Core Item Chase:

Strong Base

↓

Legendary

↓

Perfect Affixes

↓

Perfect Rolls

↓

Successful Upgrades

↓

Endgame Item