# TASK BOSS DEFINITION

## Overview

Task Bosses are special bosses unlocked through monster kill progression.

Task Bosses are unlocked by killing specific monsters. given boss is unlocked by killing only the specific monster (e.g. rats -> rat king)

Examples:

Kill 100 Rats

→ Unlock Rat King

Kill 250 Wolves

→ Unlock Wolf Alpha

Kill 500 Vampires

→ Unlock Vampire Lord

Requirements are fully database-driven.

---

# Purpose

Monster Families are used for:

- Task Bosses
- Unique Items
- Set Items
- Content Theming

Task Bosses are intended to provide:

- Better Loot
- Long-Term Monster Progression Goals

---

# Unlock System

Task Bosses are linked to monster families.

Examples:

Rat

→ Rat King

Wolf

→ Wolf Alpha

Vampire

→ Vampire Lord

Unlock requirements are based on monster kill counts.

---

# Kill Requirements

Each monster may define:

- Task Boss ID
- Required Kills

Examples:

100

500

1000

All values are database-driven.

---

# Difficulty

Task Bosses are significantly stronger than normal monsters.

Target Power:

3x - 5x Normal Monster Strength

Examples:

Rat

↓

Rat King

Wolf

↓

Wolf Alpha

Vampire

↓

Vampire Lord

---

# Attempts

When a Task Boss is unlocked:

Player may fight it once.

After defeat:

Task Boss becomes unavailable.

---

# Re-Unlocking

Task Bosses may be unlocked again.

Requirement:

- Gold Fee

The fee is defined individually per boss.

No additional kill requirements are needed once unlocked initially.

---

# Combat Rules

Task Bosses use the standard combat system.

Task Bosses are stored as independent monster records.

Each Task Boss has its own:

- Stats
- Loot
- Cooldowns
- Abilities
- Artwork

---

# Rewards

Task Bosses provide:

- Better Loot
- Better Rarity Chances
- Better Loot Levels
- Higher Unique Chances
- Higher Set Chances
- Greater Material Rewards

No guaranteed unique rewards exist.

---

# Loot Modifiers

Task Bosses may use a Unique Modifier.

Examples:

Rat:

1.0

Mini Boss:

2.0

Task Boss:

5.0

Daily Boss:

10.0

The modifier is applied together with pity mechanics.

---

# Bestiary Integration

The Bestiary displays task progress for monsters that unlock Task Bosses.

Example:

Rat

Kills:

83 / 100

Task Boss:

Rat King

Status:

Locked

---

Rat

Kills:

100 / 100

Task Boss:

Rat King

Status:

Unlocked

Task progress is displayed directly within the monster entry.

---

# Character Tracking

Per Character:

Monster Kill Count

Examples:

Rat:

500

Wolf:

120

Dragon:

7

Used for:

- Achievements
- Task Bosses
- Statistics
- Bestiary

---

# Database

## Boss Domain

Purpose:

Store boss-specific content.

Boss Types:

- Mini Boss
- Task Boss
- Daily Boss

Characteristics:

- Unique Stats
- Loot Modifiers
- Cooldowns

Tables:

- Bosses
- MonsterTasks

---

## Monster Definitions

Each monster may contain:

Task Boss ID

Optional.

Links the monster to a Task Boss.

Example:

Rat

→ Rat King

---

Required Kills

Number required to unlock the Task Boss.

Examples:

100

500

1000

Fully database-driven.

---

# Design Philosophy

Task Boss progression follows:

Kill Monsters

↓

Reach Required Kill Count

↓

Unlock Task Boss

↓

Fight Task Boss

↓

Receive Enhanced Rewards