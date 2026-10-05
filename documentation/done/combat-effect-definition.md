# COMBAT EFFECT DEFINITION

## Overview

Combat Effects are temporary effects applied during combat.

Combat Effects may be:

- Buffs
- Debuffs
- Damage Over Time Effects
- Heal Over Time Effects

Multiple Combat Effects may exist simultaneously.

Combat Effects are stored separately from character progression buffs.

---

# Effect Categories

## Damage Over Time

Applies damage over multiple turns.

Examples:

- Poison

Target:

- Enemy

Damage Over Time effectiveness scales with Spell Power.

---

## Heal Over Time

Applies healing over several turns.

Target:

- Self

Healing effectiveness scales with Spell Power.

---

## Stat Buff

Temporarily increases character statistics.

Possible Statistics:

- Attack
- Defense
- Spell Power

Target:

- Self

Duration:

- Fixed number of turns

---

## Stat Debuff

Temporarily reduces character statistics.

Possible Statistics:

- Attack
- Defense
- Spell Power

Target:

- Enemy

Duration:

- Fixed number of turns

---

## Mana Drain

Removes Mana directly.

Target:

- Enemy

---

## Health Drain

Deals damage and restores health.

Target:

- Enemy

Health Drain effectiveness scales with Spell Power.

---

## Potion Disable

Prevents potion usage.

Target:

- Enemy

Variants:

- All Potions
- Health Potions Only
- Mana Potions Only

---

# Sources

Combat Effects may originate from:

- Player Spells
- Monster Abilities

Monsters may use:

- Damage Spell
- Damage Over Time
- Self-Heal
- Heal Over Time
- Potion Disable
- Mana Drain
- Health Drain

Monster abilities use the same effect definitions as players.

---

# Spell Power Interaction

Spell Power affects:

- Damage Over Time
- Heal Over Time
- Health Drain

Examples:

Spell Base Value:

100

Spell Power:

100%

Final Value:

100

Spell Power:

150%

Final Value:

150

Monster Spell Power functions identically.

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

Durations are stored in turns.

---

# Stacking Rules

Effects do not stack.

Example:

Poison Active:

- 3 Turns

New Poison Cast

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

# Targeting Rules

Each effect has exactly one target type.

Target Types:

- Self
- Enemy

Examples:

Heal Over Time

→ Self

Defense Buff

→ Self

Attack Debuff

→ Enemy

Poison

→ Enemy

Mana Drain

→ Enemy

Health Drain

→ Enemy

Potion Disable

→ Enemy

---

# Database

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