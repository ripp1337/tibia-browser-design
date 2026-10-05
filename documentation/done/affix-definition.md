# Affix Design
## Tibia Browser RPG

---

# 1. Overview

Affixes are random modifiers added to normal items.

Affixes provide:

- Item customization
- Item variety
- Long-term item hunting
- Build specialization

Final Item Formula:

Base Item

+

Rarity

+

Affixes

=

Final Item

---

# 2. Affix Types

Only 8 affix types exist.

Available Affixes:

- Attack
- Defense
- Spell Power
- Health
- Mana
- Energy
- Gold %
- Experience %

No other affixes exist.

Examples of excluded affixes:

- Critical Chance
- Critical Damage
- Cooldown Reduction
- Health Regeneration
- Mana Regeneration
- Potion Effectiveness

The affix system is intentionally simple.

---

# 3. Affix Tiers

Each affix contains 5 tiers.

Examples:

Attack Tier 1

Attack Tier 2

Attack Tier 3

Attack Tier 4

Attack Tier 5

---

Defense Tier 1

Defense Tier 2

Defense Tier 3

Defense Tier 4

Defense Tier 5

---

Each Affix Tier is treated as its own database entry.

Example:

Attack Tier 1

Item Level Requirement:

1

Range:

1-5

---

Attack Tier 5

Item Level Requirement:

100

Range:

25-50

---

The exact values are balanced independently.

---

# 4. Affix Level Requirements

Each Affix Tier contains:

- Required Item Level

Example:

Affix:

Attack Tier 3

Required Level:

40

Only items meeting the requirement may roll that tier.

This allows precise progression tuning.

---

# 5. Affix Storage

Every affix consists of:

Affix Template

+

Roll Value

Example:

Affix:

Attack Tier 4

Roll:

73

Stored As:

Template ID:

Attack Tier 4

Roll:

73

This structure simplifies balancing and future adjustments.

---

# 6. Affix Rolling

Each Affix Tier defines:

- Minimum Value
- Maximum Value

Example:

Attack Tier 5

Min:

100

Max:

200

All values inside the range have equal probability.

Examples:

100

101

102

...

200

All values are equally likely.

No weighted roll system exists.

---

# 7. Affix Visibility

Affix Names Are Hidden.

Players do not see:

- Attack Tier 5
- Major Attack
- Grand Defense

Players only see final values.

Examples:

Attack +150

Health +300

Mana +200

Gold +5%

This keeps item tooltips clean and easy to understand.

---

# 8. Affix Weighting

Affixes are weighted.

Weights are assigned per Item Base.

Example:

----------------------------------------------------

Steel Sword

----------------------------------------------------

Attack:

100

Defense:

25

Spell Power:

25

Health:

20

Mana:

5

Energy:

5

Gold:

2

Experience:

2

----------------------------------------------------

Merchant Ring

----------------------------------------------------

Attack:

30

Defense:

30

Spell Power:

30

Health:

30

Mana:

30

Energy:

30

Gold:

150

Experience:

100

Different item bases naturally favor different affixes.

All affixes remain possible.

---

# 9. Duplicate Affixes

Duplicate affixes are fully allowed.

Examples:

Attack +150

Attack +175

Attack +200

Attack +180

Perfectly valid.

No duplicate limits exist.

This allows intentionally specialized items.

Examples:

- Glass Cannon Gear
- Gold Farming Gear
- Experience Farming Gear
- High Mana Gear
- Pure Defense Gear

This is intended behavior.

---

# 10. Affix Scaling

Affixes scale with item progression.

However:

Item Bases remain the primary source of power.

Design Goal:

A Level 100 Magic Item

should generally outperform

a Level 1 Legendary Item

even if the Legendary has excellent affixes.

Progression always takes priority over rarity.

Item quality never completely overrides progression.

---

# 11. Rarity Interaction

Rarity only determines Affix Count.

Common:

0 Affixes

Magic:

1 Affix

Rare:

2 Affixes

Epic:

3 Affixes

Legendary:

4 Affixes

Rarity does not grant:

- Better Rolls
- Better Affix Tiers
- Better Affix Quality

Only more affixes.

---

# 12. Unique Items

Unique Items do not use affixes.

Unique Items use:

- Fixed Stat Categories
- Random Rolls Within Ranges

Example:

Rat King's Crown

Attack:

10-20

Defense:

15-30

No affixes may be generated.

---

# 13. Set Items

Set Items do not use affixes.

Set Items use:

- Fixed Stat Categories
- Random Rolls Within Ranges
- Set Bonuses

No affixes may be generated.

---

# 14. Item Score Contribution

Every affix contributes to Item Score.

Each affix type may use its own scoring formula.

Examples:

Attack

Score Formula A

---

Defense

Score Formula B

---

Gold %

Score Formula C

---

Experience %

Score Formula D

This allows accurate internal balancing.

---

# 15. Design Philosophy

Players should become excited by:

- High Item Level
- Strong Item Base
- Legendary Rarity
- Perfect Affix Combination
- Perfect Affix Rolls

The ideal chase item is:

High Level Base

+

Legendary

+

Perfect Affix Combination

+

Near Maximum Rolls

Example:

Dragon Sword

Level 100

Legendary

Attack +200

Attack +180

Attack +175

Attack +190

This type of item represents the true endgame item hunt.