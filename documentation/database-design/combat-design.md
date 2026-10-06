# Combat Design
## Tibia Browser RPG

---

# 1. Combat Vision

Combat is a turn-based RPG system focused on preparation, character optimization, resource management, and risk versus reward.

The strongest characters are not determined by reaction speed.

Success comes from:

- Equipment optimization
- Spell loadouts
- Consumable management
- Character progression
- Resource preparation

Combat should be:

- Easy to understand
- Fast to resolve
- Difficult to master
- Highly scalable
- Database-driven

The most important decisions happen before combat begins.

---

# 2. Combat Structure

Combat is fully turn-based.

Players fight a single monster at a time.

After combat ends, the player returns to the monster selection interface.

There is no escape mechanic.

Once combat begins it ends only when:

- Player dies
- Monster dies
- Maximum combat duration is reached

Rewards are granted immediately after victory.

---

# 3. Energy Cost

Combat consumes Energy when the encounter begins.

Regular Monster:

- 3 Energy

Boss:

- 5 Energy

Energy is consumed immediately when combat starts.

If insufficient Energy exists:

- Combat cannot begin

Energy is never consumed during combat actions.

---

# 4. Turn Order

Player always acts first.

Combat Flow:

Player Action

↓

Resolve Effects

↓

Monster Action

↓

Resolve Effects

↓

Next Turn

---

# 5. Available Actions

Each turn a player may perform exactly one action.

Available actions:

- Attack
- Cast Spell
- Use Consumable

Using a consumable consumes the entire turn.

---

# 6. Combat Statistics

Combat effectiveness is determined by:

## Attack

Used for:

- Physical hit chance
- Physical damage

## Defense

Used for:

- Physical avoidance
- Physical damage reduction

## Health

Determines survivability.

When Health reaches 0:

- Character dies
- Combat immediately ends

## Mana

Required for spell casting.

## Spell Power

Determines effectiveness of:

- Damage Spells
- Healing Spells
- Damage Over Time
- Heal Over Time
- Health Drain
- Mana Drain

Base Value:

100%

Sources:

- Equipment
- Spell Mastery
- Temporary Buffs

Passive bonuses are not part of combat calculations:

- Gold Bonus %
- Experience Bonus %

---

## Combat Statistic Minimums

Combat uses finalized Effective Character Statistics.

Effective Attack, Defense, and Spell Power cannot be lower than 0.

Combat does not apply separate statistic clamping and does not recalculate
effective statistics independently. Minimum values are enforced by the
authoritative Effective Character Statistics calculator before the statistics
are used by combat.

# 7. Character Combat Resources

## Health

Starting Health:

180

Health does not regenerate during combat.

Health can only be restored through:

- Potions
- Healing Spells
- Heal Over Time
- Health Drain

Health can never exceed maximum Health.

---

## Mana

Starting Mana:

35

Mana is required for casting spells.

Mana regeneration is disabled during combat.

Mana may only be restored through:

- Mana Potions

Mana cannot exceed maximum Mana.
---

Combat never calculates maximum resources.
 
Combat uses EffectiveCharacterStats exclusively.
---

# 8. Physical Combat

Definitions:

AA = Attacker Attack

DD = Defender Defense

---

## Hit Chance Formula

Formula:

((AA - DD) × 4)%

Examples:

AA = 100

DD = 80

Hit Chance = 80%

---

AA = 100

DD = 90

Hit Chance = 40%

---

AA = 100

DD = 100

Hit Chance = 0%

---

## Hit Chance Limits

Minimum Hit Chance:

5%

Maximum Hit Chance:

90%

Rules:

- Every attack can hit
- Every attack can miss

---

## Damage Formula

If the attack hits:

Minimum Damage:

AA - DD

Maximum Damage:

(AA - DD) × 2

Random value rolled inside range.

Examples:

AA = 100

DD = 80

Damage:

20 - 40

---

AA = 100

DD = 98

Damage:

2 - 4

---

AA = 100

DD = 100

Damage:

0

Damage may be zero.

---

# 9. Spell System Overview

Spells are fixed templates.

Players unlock spells permanently.

Requirements:

- Character Level
- Gold Cost

Spells are not randomly acquired.

The game is built around spell loadouts rather than complex rotations.

---

# 10. Spell Slots

Default:

1 Spell Slot

Additional Slots:

Slot 2

Requirements:

- Level 20
- 10,000 Gold

Slot 3

Requirements:

- Level 50
- 100,000 Gold

Maximum:

3 Active Spell Slots

Rules:

- Same spell cannot occupy multiple slots
- Spell loadouts may be changed outside combat

---

# 11. Spell Categories

## Damage

Direct spell damage.

Rules:

- Cannot miss
- Ignores Defense
- Scales with Spell Power

Examples:

- Fireball

---

## Damage Over Time

Applies recurring damage.

Examples:

- Poison
- Burn

---

## Healing

Instant Health restoration.

Rules:

- Cannot exceed Maximum Health
- Scales with Spell Power

Examples:

- Light Healing
- Ultimate Healing

---

## Heal Over Time

Applies Health regeneration over several turns.

---

## Mana Drain

Removes Mana directly.

---

## Health Drain

Deals damage and restores Health.

---

## Stat Buff

Temporarily increases:

- Attack
- Defense
- Spell Power

Examples:

- Battle Focus
- Stone Skin

---

## Stat Debuff

Temporarily decreases:

- Attack
- Defense
- Spell Power

---

## Potion Disable

Prevents potion usage.

Variants:

- Health Potions Only
- Mana Potions Only
- All Potions

---

# 12. Spell Targeting

Every spell has exactly one target type.

Possible targets:

- Self
- Enemy

Examples:

Fireball

→ Enemy

Healing

→ Self

Defense Buff

→ Self

Attack Debuff

→ Enemy

---

# 13. Spell Mana Cost

Every spell has a fixed Mana Cost.

Examples:

Fireball:

30 Mana

Light Healing:

25 Mana

Ultimate Healing:

150 Mana

Mana Cost never scales.

---

# 14. Spell Cooldowns

Every spell stores an independent cooldown.

Cooldown unit:

Turns

Examples:

Fireball

2 Turns

Heal

5 Turns

Ultimate Heal

8 Turns

---

# 15. Spell Power Scaling

Every spell stores Base Value.

Formula:

Final Value = Base Value × Spell Power

Example:

Fireball

Base Damage:

100

Spell Power:

150%

Final Damage:

150

---

Healing Example

Base Heal:

150

Spell Power:

120%

Final Heal:

180

---

# 16. Spell Mastery

Spell Mastery is a global progression system.

Progression:

Cast Spell

↓

Gain Spell Mastery XP

↓

Increase Spell Mastery Level

↓

Increase Spell Power

Characteristics:

- Infinite progression
- Separate experience system
- Independent from Character Level
- Long-term progression

Examples:

Level 1

Spell Power 100%

Level 10

Spell Power 110%

Level 50

Spell Power 150%

Spell Mastery applies to every spell equally.

---

# 17. Effect Duration System

Effects use turn durations.

Examples:

Poison

3 Turns

Defense Buff

5 Turns

Potion Disable

2 Turns

---

# 18. Effect Stacking Rules

Effects do not stack.

Reapplying an active effect:

- Refreshes duration
- Replaces existing effect

Never creates duplicate instances.

Applies to:

- Damage Over Time
- Heal Over Time
- Buffs
- Debuffs
- Potion Disable

---

# 19. Consumables

Consumables may be used during combat.

Using a consumable consumes the player's turn.

Combat consumables:

- Health Potions
- Mana Potions

Energy Potions cannot be used during combat.

---

# 20. Potion Loadout

Characters carry:

- 1 Health Potion Type
- 1 Mana Potion Type

Configured before combat.

Examples:

Health:

Grand Health Potion

Mana:

Large Mana Potion

---

# 21. Potion Capacity

Maximum carried:

10 Health Potions

10 Mana Potions

Potions may be used on consecutive turns.

Example:

Turn 1

Health Potion

Turn 2

Health Potion

Turn 3

Health Potion

Valid

---

# 22. Monster Combat

Monsters use the same combat framework.

Monster Statistics:

- Health
- Attack
- Defense
- Spell Power

Monsters may:

- Attack
- Cast Spells

Monsters cannot:

- Use Consumables

---

# 23. Monster Ability System

Each monster has:

Ability Chance %

Every turn:

Roll Ability Chance

Success:

Use Ability

Failure:

Use Basic Attack

Examples:

Rat

0%

Demon

70%

Ancient Dragon

90%

---

## Available Monster Abilities

Monsters may use:

- Damage Spells
- Damage Over Time
- Healing
- Heal Over Time
- Mana Drain
- Health Drain
- Buffs
- Debuffs
- Potion Disable

Monster abilities use the same spell rules as player spells.

---

# 24. Monster Access Rules

A player may only fight monsters where:

Character Level >= Monster Level

Examples:

Character Level 20

Can Fight:

Levels 1-20

Cannot Fight:

Levels 21+

---

# 25. Boss Combat

Bosses use the normal combat system.

No special mechanics exist in V1.

Boss difficulty is created through:

- Higher Health
- Higher Attack
- Higher Defense
- Higher Spell Power
- Stronger Ability Sets
- Better Loot Tables

Future versions may introduce:

- Multi-phase Battles
- Unique Mechanics
- Enrage Systems
- Summons

---

# 26. Combat Rewards

Rewards are generated immediately upon victory.

Possible rewards:

- Experience
- Gold
- Equipment
- Materials
- Consumables

Reward generation is fully database-driven.

---

# 27. Death System

Death has meaningful progression consequences.

When Health reaches 0:

- Character dies
- Combat ends immediately

Default Death Penalty:

10% Total Experience

Promoted Character:

8% Total Experience

Consequences:

- Experience loss
- Level loss
- Multiple level loss

Experience removed through death is permanently lost.

---

# 28. Blessings

Blessings reduce death penalties.

Only one Blessing may be active at a time.

Blessings must be manually activated.

Upon death:

- Active Blessing is consumed
- Reduced penalty is applied

Death Loss:

Normal Character

10% → 6%

Promoted Character

8% → 4%

Blessings provide protection for one death only.

---

# 29. Promotion

Promotion is a permanent character upgrade.

Requirements:

- Level 20
- 20,000 Gold

Benefits:

Death Penalty

10% → 8%

Promotion is permanent.

---

# 30. Combat Log

Every combat generates a detailed combat log.

Example Information:

- Turns
- Attacks
- Spell Casts
- Damage
- Healing
- Effects
- Resource Changes

Stored Logs:

10 Most Recent Combats

When capacity is exceeded:

- New log added
- Oldest log removed

Purpose:

- Fight Analysis
- Death Review
- Boss Review
- Bug Investigation

Combat logs are not stored permanently.

---

# 31. Maximum Combat Duration

Maximum:

100 Turns

If combat exceeds 100 turns:

- Player loses
- Combat immediately ends
- Death penalties apply

This rule exists to prevent infinite combat caused by extreme defensive or healing combinations.

---

# 32. Combat Design Philosophy

Combat complexity should come from:

- Equipment
- Spell Selection
- Consumables
- Character Progression

Not from execution speed.

The player should solve most combat challenges before the fight begins through preparation and build optimization.

Core Combat Loop:

Character Build

↓

Equipment

↓

Spell Loadout

↓

Consumables

↓

Combat

↓

Rewards

↓

Progression