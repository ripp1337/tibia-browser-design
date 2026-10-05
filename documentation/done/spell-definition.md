# Spell Definition
## Tibia Browser RPG

---

# 1. Overview

Spells are fixed templates.

Players unlock spells permanently through Gold purchases.

Monsters use the same spell definitions and scale spell effectiveness through Spell Power.

---

# 2. Spell Identity

## Spell ID

Unique internal identifier.

---

## Name

Examples:

- Light Healing
- Intense Healing
- Ultimate Healing
- Fireball
- Poison
- Mana Burn
- Battle Focus
- Stone Skin

---

## Description

Short explanation shown to players.

Example:

"Heals the caster for a moderate amount of Health."

---

## Artwork / Icon

Every spell has its own icon.

Used in:

- Spellbook
- Combat Log
- Spell Slots

---

# 3. Unlocking

All spells are unlocked through:

Spell Menu

↓

Purchase Spell

Requirements:

- Character Level
- Gold Cost

Examples:

Light Healing

Level:

1

Gold:

1,000

---

Ultimate Healing

Level:

100

Gold:

500,000

---

# 4. Spell Slots

Default:

1 Spell Slot

---

## Additional Spell Slots

Slot 2:

- Level Requirement
- Gold Cost

---

Slot 3:

- Level Requirement
- Gold Cost

---

Maximum:

3 Active Spell Slots

---

## Duplicate Rules

The same spell cannot occupy multiple slots.

Example:

Fireball

Fireball

Fireball

Invalid

---

# 5. Spell Categories

## Damage

Direct damage spell.

Target:

Enemy

---

## Damage Over Time

Applies damage over multiple turns.

Target:

Enemy

---

## Healing

Instant healing.

Target:

Self

---

## Heal Over Time

Applies healing over multiple turns.

Target:

Self

---

## Mana Drain

Removes Mana from the target.

Target:

Enemy

---

## Health Drain

Deals damage and restores Health.

Target:

Enemy

---

## Potion Disable

Prevents potion usage.

Target:

Enemy

Variants may include:

- All Potions
- Health Potions Only
- Mana Potions Only

---

## Stat Buff

Temporarily increases:

- Attack
- Defense
- Spell Power

Target:

Self

---

## Stat Debuff

Temporarily reduces:

- Attack
- Defense
- Spell Power

Target:

Enemy

---

# 6. Targeting

Every spell has exactly one target type.

Available Targets:

- Self
- Enemy

No spell can target both.

Examples:

Fireball

→ Enemy

---

Heal

→ Self

---

Defense Buff

→ Self

---

Attack Debuff

→ Enemy

---

# 7. Mana Cost

Every spell contains a fixed Mana Cost.

Examples:

Fireball

30 Mana

---

Light Healing

25 Mana

---

Ultimate Healing

150 Mana

Mana Costs are stored per spell.

Mana Costs never scale.

---

# 8. Cooldowns

Every spell contains a Cooldown.

Cooldowns are stored in turns.

Examples:

Fireball

2 Turns

---

Heal

5 Turns

---

Ultimate Heal

8 Turns

Cooldowns are tracked independently.

---

# 9. Scaling

Every spell stores a Base Value.

Examples:

Fireball

Base Damage:

100

---

Healing

Base Heal:

150

---

Poison

Base Damage:

25 per Turn

---

## Spell Power Formula

Final Value

=

Base Value

×

Spell Power

Examples:

Fireball

Base Damage:

100

Character Spell Power:

150%

Final Damage:

150

Monster Spell Power uses the same formula.

---

# 10. Accuracy

Spells never miss.

Spells always succeed.

There is:

- No Hit Chance
- No Spell Accuracy

---

# 11. Duration System

Effects use turn durations.

Examples:

Poison

3 Turns

---

Defense Buff

5 Turns

---

Potion Disable

2 Turns

---

# 12. Stacking Rules

Effects do not stack.

Example:

Poison

Active:

3 Turns

---

New Poison Cast

Result:

Refresh Existing Effect

Not:

Two Simultaneous Poison Effects

---

This applies to:

- Damage Over Time
- Heal Over Time
- Buffs
- Debuffs
- Potion Disable

---

# 13. Spell Progression

Spells may have stronger successors.

Example:

Light Healing

↓

Intense Healing

↓

Ultimate Healing

These are separate spells.

Players choose which version to equip.

---

# 14. Monster Usage

Monsters use the same spell definitions as players.

Monster abilities are assigned from the shared spell database.

Spell effectiveness scales through Monster Spell Power.

There are no separate monster-only versions such as:

- Fireball I
- Fireball II
- Fireball III

---

# 15. Combat Philosophy

Combat is built around:

Spell Loadouts

not

Spell Rotations.

The primary decision happens before combat begins.

Examples:

Boss Build:

- Ultimate Heal
- Defense Buff
- Health Drain

---

Damage Build:

- Fireball
- Damage Over Time
- Attack Buff

---

Anti-Healing Build:

- Poison
- Healing Reduction
- Fireball

Different encounters should encourage different spell selections.

The strongest players are expected to adapt their loadouts to specific challenges rather than always using the same three spells.

---

# 16. Expected Spell Count

Target:

15-30 Total Spells

Mix:

- Offensive
- Defensive
- Utility

The spell list should remain relatively small and