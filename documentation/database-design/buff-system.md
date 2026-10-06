# BUFF SYSTEM

## Overview

The Buff System manages all temporary positive and negative effects applied to characters during combat and progression systems.

The system supports:

- Buffs
- Debuffs
- Damage Over Time
- Heal Over Time
- Temporary Stat Modifiers
- Consumable Boosts

Multiple buffs and debuffs may exist simultaneously.

Examples:

Character Buffs:

- Gold Boost
- Experience Boost

Combat Buffs:

- Damage Increase
- Defense Increase

Combat Debuffs:

- Damage Over Time
- Potion Disable
- Mana Drain

---

# Buff Categories

## Character Buffs

Character Buffs apply outside of combat and support progression systems.

Examples:

- Gold Boost
- Experience Boost

---

## Combat Buffs

Combat Buffs temporarily improve character combat effectiveness.

Examples:

- Attack Increase
- Defense Increase
- Spell Power Increase

---

## Combat Debuffs

Combat Debuffs temporarily hinder character effectiveness.

Examples:

- Damage Over Time
- Potion Disable
- Mana Drain
- Attack Reduction
- Defense Reduction
- Spell Power Reduction

---

# Stat Buffs

Stat Buff spells temporarily increase:

- Attack
- Defense
- Spell Power

Target:

- Self

Duration:

- Fixed number of turns

---

# Stat Debuffs

Stat Debuffs temporarily reduce:

- Attack
- Defense
- Spell Power

Target:

- Enemy

Duration:

- Fixed number of turns

### Stat Debuff Minimums

Stat debuffs use flat negative values.

Multiple applicable modifiers are resolved before the final statistic minimum
is enforced.

A stat debuff may reduce effective Attack, Defense, or Spell Power to 0,
but never below 0.

The authoritative Effective Character Statistics calculator is responsible
for enforcing these minimums.

Example:

Calculated Defense before finalization: -5
Effective Defense after finalization: 0

---

# Damage Over Time

Damage Over Time effects apply damage over multiple turns.

Examples:

- Poison

Target:

- Enemy

Damage Over Time effectiveness scales with Spell Power.

---

# Heal Over Time

Heal Over Time effects restore health over several turns.

Target:

- Self

Healing effectiveness scales with Spell Power.

---

# Mana Drain

Mana Drain removes mana from the target.

Target:

- Enemy

---

# Health Drain

Health Drain:

- Deals damage
- Restores health to the caster

Target:

- Enemy

Health Drain effectiveness scales with Spell Power.

---

# Potion Disable

Potion Disable prevents potion usage.

Target:

- Enemy

Possible variants:

- All Potions
- Health Potions Only
- Mana Potions Only

---

# Duration System

Effects use turn durations.

Examples:

Poison:

- 3 Turns

Defense Buff:

- 5 Turns

Potion Disable:

- 2 Turns

All durations are stored in turns.

---

# Stacking Rules

Effects do not stack.

Example:

Poison Active:

- 3 Turns Remaining

New Poison Cast:

Result:

- Existing effect refreshed

Not:

- Two simultaneous poison effects

This rule applies to:

- Damage Over Time
- Heal Over Time
- Buffs
- Debuffs
- Potion Disable

---

# Spell Power Interaction

Spell Power affects:

- Damage Spells
- Healing Spells
- Damage Over Time
- Heal Over Time
- Health Drain

Examples:

Spell Base Damage:

100

Character Spell Power:

150%

Final Damage:

150

Monster Spell Power functions identically.

---

# Progression Boosts

## Gold Boosts

Gold Boosts increase gold rewards from combat.

Only one Gold Boost may be active at a time.

Examples:

### Small Gold Boost

- +10% Gold
- 100 Fights

### Medium Gold Boost

- +15% Gold
- 250 Fights

### Large Gold Boost

- +25% Gold
- 500 Fights

Sources:

- Loot
- Crafting
- Chests
- Level Rewards

---

## Experience Boosts

Experience Boosts increase experience rewards from combat.

Examples:

### Small Experience Boost

- +10%
- 100 Fights

### Medium Experience Boost

- +15%
- 250 Fights

### Large Experience Boost

- +25%
- 500 Fights

Sources:

- Crafting
- Loot
- NPC Vendors

---

# Boost Rules

Boosts are fight-based rather than time-based.

A fight charge is consumed when:

- Victory occurs
- Defeat occurs

Boost progress is preserved:

- Online
- Offline
- Across Sessions

Example:

Gold Boost

100 Fights Remaining

Logout

Login Later

Still:

100 Fights Remaining

Boosts never expire based on time.

---

# Boost Stacking Rules

Boosts of the same type do not stack.

Allowed:

- Gold Boost
- Experience Boost

Active simultaneously.

Not Allowed:

- Gold Boost
- Gold Boost

Only one boost of each category may be active.

Using a new boost replaces the currently active boost of the same category.

## Buff Percentage Aggregation

Effects of the same BuffType do not stack with one another.

Applying another effect of the same BuffType refreshes or replaces the
existing effect according to the effect-specific rule. It does not create
an additional simultaneous modifier.

The value of the single active effect is combined additively with percentage
modifiers from equipment, item affixes, set bonuses, achievements, permanent
bonuses, and other compatible effect categories.

Example:

Equipment Gold Bonus: +20%
Active Gold Boost: +15%
Total Gold Bonus: +35%

Two active Gold Boost effects cannot contribute simultaneously.

---

# Monster Ability Effects

Monsters may apply:

- Damage Spell
- Damage Over Time
- Self-Heal
- Heal Over Time
- Potion Disable
- Mana Drain
- Health Drain

Monster abilities use the same effect system as player spells.

---

# Database

## CharacterBuffs

Stores:

- Character Buffs
- Progression Buffs
- Active Boosts

Examples:

- Gold Boost
- Experience Boost

---

## CombatEffects

Stores:

- Active Buffs
- Active Debuffs
- Damage Over Time
- Heal Over Time
- Potion Disable
- Mana Drain
- Health Drain
- Stat Modifiers
- Remaining Duration